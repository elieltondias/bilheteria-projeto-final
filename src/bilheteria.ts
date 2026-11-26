// A venda: onde a CONCORRÊNCIA aparece (Aula 8). Um pedido não espera o outro:
// as poltronas são marcadas antes do await do pagamento, então enquanto um
// pedido espera a operadora, o Node atende os outros.

import { DadosInvalidosErro, NaoEncontradoErro, PagamentoErro } from "./dominio.ts";
import type { Evento } from "./dominio.ts";
import { calcularTotal, montarIngressos } from "./preco.ts";
import { direitoAMeia } from "./regras.ts";
import type { Pagamento } from "./pagamento.ts";
import type { Comprovante, ConfigBilheteria, EventoInfo, Pedido } from "./tipos.ts";

// Tempo limite da operadora: o Promise.race devolve quem terminar primeiro,
// a cobrança ou o relógio, que rejeita depois de ms milissegundos. O finally
// desliga o relógio quando a cobrança termina antes.
function comTempoLimite<T>(promessa: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error("tempo esgotado")), ms);
  });
  return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
}

export class Bilheteria {
  #eventos: Evento[];
  #pagar: Pagamento;
  #limitePagamentoMs: number;
  #proximoReservaId = 1;

  constructor(config: ConfigBilheteria) {
    this.#eventos = config.eventos;
    this.#pagar = config.pagar;
    this.#limitePagamentoMs = config.limitePagamentoMs;
  }

  listarEventos(): EventoInfo[] {
    return this.#eventos.map((evento) => evento.info());
  }

  async reservar(pedido: Pedido): Promise<Comprovante> {
    // 1. Validação do pedido: nada de cobrar ou reservar para depois.
    if (!pedido || !pedido.ingressos || pedido.ingressos.length === 0) {
      throw new DadosInvalidosErro("pedido sem ingressos");
    }
    const evento = this.#eventos.find((e) => e.id === pedido.eventoId);
    if (!evento) {
      throw new NaoEncontradoErro(`evento ${pedido.eventoId} não existe`);
    }

    // 2. Marca as poltronas ANTES de qualquer await: é o que impede vender a
    //    mesma poltrona para duas pessoas. Os erros 400/409 saem aqui, antes
    //    de a operadora ser cobrada.
    const poltronas = pedido.ingressos.map((pessoa) => pessoa.poltrona);
    evento.reservar(poltronas);

    // 3. Preço, no funcional: montarIngressos + calcularTotal.
    const ingressos = montarIngressos(evento.preco, pedido.ingressos, direitoAMeia);
    const total = calcularTotal(ingressos);

    // 4. Cobra a operadora com tempo limite: se ela recusar OU travar, o
    //    comTempoLimite rejeita, as poltronas são devolvidas e o cliente
    //    recebe 502 — ninguém fica cobrado sem levar o ingresso, e nenhum
    //    pedido fica preso para sempre esperando uma operadora travada.
    try {
      await comTempoLimite(this.#pagar(total), this.#limitePagamentoMs);
    } catch (erro) {
      evento.liberar(poltronas);
      throw new PagamentoErro(`pagamento recusado: ${(erro as Error).message}`);
    }

    // 5. Comprovante com reservaId novo a cada compra.
    return {
      reservaId: this.#proximoReservaId++,
      eventoId: pedido.eventoId,
      ingressos,
      total,
    };
  }
}

export function criarBilheteria(config: ConfigBilheteria): Bilheteria {
  return new Bilheteria(config);
}
