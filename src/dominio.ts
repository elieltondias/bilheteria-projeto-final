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
