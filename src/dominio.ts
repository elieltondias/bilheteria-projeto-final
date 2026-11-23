import type { EventoInfo } from "./tipos.ts";

export abstract class ErroDeNegocio extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

export class DadosInvalidosErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 400);
  }
}

export class NaoEncontradoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 404);
  }
}

export class PoltronaOcupadaErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 409);
  }
}

export class PagamentoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 502);
  }
}

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

  get disponivel(): number {
    return this.capacidade - this.#vendidas.length;
  }

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

  liberar(poltronas: number[]): void {
    if (poltronas.some((poltrona) => !this.#vendidas.includes(poltrona))) {
      throw new DadosInvalidosErro("poltrona que não estava vendida");
    }
    this.#vendidas = this.#vendidas.filter((vendida) => !poltronas.includes(vendida));
  }

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
