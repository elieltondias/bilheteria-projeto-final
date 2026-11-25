// A venda: onde a CONCORRÊNCIA aparece (Aula 8). Um pedido não espera o outro:
// as poltronas são marcadas antes do await do pagamento, então enquanto um
// pedido espera a operadora, o Node atende os outros.

import { DadosInvalidosErro, NaoEncontradoErro, PagamentoErro } from "./dominio.ts";
import type { Evento } from "./dominio.ts";
import { calcularTotal, montarIngressos } from "./preco.ts";
import { direitoAMeia } from "./regras.ts";
import type { Pagamento } from "./pagamento.ts";
import type { Comprovante, ConfigBilheteria, EventoInfo, Pedido } from "./tipos.ts";

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

    // 4. Cobra na operadora. Outros pedidos seguem rodando enquanto este espera.
    //    Pagamento recusado: devolve as poltronas e responde 502 — ninguém
    //    fica cobrado sem levar o ingresso.
    try {
      await this.#pagar(total);
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
