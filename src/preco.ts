// Preço do ingresso, no paradigma FUNCIONAL: só funções puras, sem estado nem mutação.
// Nada de let, var, for, while, push, forEach ou class neste arquivo.

import type { Ingresso, Pessoa, TipoIngresso } from "./tipos.ts";

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

// Cria um Ingresso por pessoa com map, na mesma ordem e com a poltrona de
// cada uma. Quem decide se é meia é a função temDireitoAMeia recebida: as
// entradas não são alteradas, o resultado é um novo array de objetos novos.
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

// Soma os valores com reduce e aplica a taxa de serviço de 10% chamando a
// fábrica aplicarTaxa. Não muta a lista recebida.
export function calcularTotal(ingressos: readonly Ingresso[]): number {
  const soma = ingressos.reduce((acumulado, ingresso) => acumulado + ingresso.valor, 0);
  return aplicarTaxa(0.1)(soma);
}
