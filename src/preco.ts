import type { Ingresso, Pessoa, TipoIngresso } from "./tipos.ts";

export function valorDoIngresso(precoBase: number): (tipo: TipoIngresso) => number {
  return (tipo) => {
    const valor = tipo === "meia" ? precoBase / 2 : precoBase;
    return Math.round(valor * 100) / 100;
  };
}

export function aplicarTaxa(percentual: number): (valor: number) => number {
  return (valor) => Math.round(valor * (1 + percentual) * 100) / 100;
}

export function montarIngressos(
  precoBase: number,
  pessoas: readonly Pessoa[],
  temDireitoAMeia: (pessoa: Pessoa) => boolean,
): Ingresso[] {
  const valor = valorDoIngresso(precoBase);
  return pessoas.map((pessoa) => {
    const tipo: TipoIngresso = temDireitoAMeia(pessoa) ? "meia" : "inteira";
    return { nome: pessoa.nome, poltrona: pessoa.poltrona, tipo, valor: valor(tipo) };
  });
}

export function calcularTotal(ingressos: readonly Ingresso[]): number {
  const soma = ingressos.reduce((acumulado, ingresso) => acumulado + ingresso.valor, 0);
  return aplicarTaxa(0.1)(soma);
}
