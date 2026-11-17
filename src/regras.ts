// Regras de negócio da meia-entrada: estudante, PcD ou 60 anos ou mais paga meia.

import type { Pessoa } from "./tipos.ts";

export function direitoAMeia(pessoa: Pessoa): boolean {
  return pessoa.estudante || pessoa.pcd || pessoa.idade >= 60;
}
