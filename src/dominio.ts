// Orientado a objetos (Aula 4): a hierarquia de erros de negócio e a classe Evento.

import type { EventoInfo } from "./tipos.ts";

// Erro de negócio: carrega o status HTTP que o servidor.ts devolve na resposta.
// Abstrata porque ninguém deve criar um erro genérico: só as quatro filhas abaixo.
export abstract class ErroDeNegocio extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

// 400: pedido ou poltrona inválidos.
export class DadosInvalidosErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 400);
  }
}

// 404: o evento não existe.
export class NaoEncontradoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 404);
  }
}

// 409: a poltrona já foi vendida.
export class PoltronaOcupadaErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 409);
  }
}

// 502: a operadora não aprovou o pagamento.
export class PagamentoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 502);
  }
}

// Um evento do show: as poltronas de 1 até a capacidade. A lista de vendidas
// é privada (campo #): quem está fora só lê `disponivel`, nunca muda.
export class Evento {
  readonly id: number;
  readonly nome: string;
  readonly preco: number;
  readonly capacidade: number;

  #vendidas: number[] = [];

  constructor(id: number, nome: string, preco: number, capacidade: number) {
    this.id = id;
    this.nome = nome;
    this.preco = preco;
    this.capacidade = capacidade;
  }

  // Getter sem setter: atribuir a `evento.disponivel` estoura TypeError.
  get disponivel(): number {
    return this.capacidade - this.#vendidas.length;
  }

  // Marca poltronas como vendidas. Tudo ou nada: valida a lista inteira
  // primeiro e só depois marca; se qualquer uma falhar, nenhuma é marcada.
  reservar(poltronas: number[]): void {
    if (poltronas.length === 0) {
      throw new DadosInvalidosErro("lista de poltronas vazia");
    }
    if (new Set(poltronas).size !== poltronas.length) {
      throw new DadosInvalidosErro("poltrona repetida no mesmo pedido");
    }
    for (const poltrona of poltronas) {
      if (!Number.isInteger(poltrona) || poltrona < 1 || poltrona > this.capacidade) {
        throw new DadosInvalidosErro(`poltrona ${poltrona} inválida`);
      }
    }
    for (const poltrona of poltronas) {
      if (this.#vendidas.includes(poltrona)) {
        throw new PoltronaOcupadaErro(`poltrona ${poltrona} já vendida`);
      }
    }
    this.#vendidas.push(...poltronas);
  }

  // Devolve poltronas para a venda (pagamento falhou ou estourou o tempo).
  liberar(poltronas: number[]): void {
    if (poltronas.some((poltrona) => !this.#vendidas.includes(poltrona))) {
      throw new DadosInvalidosErro("poltrona que não estava vendida");
    }
    this.#vendidas = this.#vendidas.filter((vendida) => !poltronas.includes(vendida));
  }

  // Os 5 campos que a API devolve; `disponivel` vem do getter.
  info(): EventoInfo {
    return {
      id: this.id,
      nome: this.nome,
      preco: this.preco,
      capacidade: this.capacidade,
      disponivel: this.disponivel,
    };
  }
}
