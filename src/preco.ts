// Preço do ingresso, no paradigma FUNCIONAL: só funções puras, sem estado nem mutação.
// Nada de let, var, for, while, push, forEach ou class neste arquivo.

import type { TipoIngresso } from "./tipos.ts";

// Fábrica de funções (como o criarMultiplicador da Aula 7): recebe o preço base
// e devolve uma função que calcula o valor de cada tipo de ingresso.
export function valorDoIngresso(precoBase: number): (tipo: TipoIngresso) => number {
  return (tipo) => {
    const valor = tipo === "meia" ? precoBase / 2 : precoBase;
    return Math.round(valor * 100) / 100;
  };
}

// Outra fábrica: recebe o percentual da taxa e devolve uma função que soma a
// taxa a um valor. O arredondamento acontece DENTRO da função devolvida.
export function aplicarTaxa(percentual: number): (valor: number) => number {
  return (valor) => Math.round(valor * (1 + percentual) * 100) / 100;
}
