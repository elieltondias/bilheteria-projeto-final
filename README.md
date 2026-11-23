# Bilheteria concorrente

Projeto final de Paradigmas de Linguagens de Programação. Enunciado completo no Blackboard.

Os arquivos de `src/` que vocês escrevem já existem, vazios; o `tipos.ts` e o `servidor.ts` vêm prontos. O que vai em cada um está no passo
indicado do enunciado:

| Arquivo | Passo do enunciado |
| :--- | :--- |
| `src/tipos.ts` (pronto) | 1: os tipos |
| `src/regras.ts` | 2: meia-entrada |
| `src/preco.ts` | 3: preço (funcional) |
| `src/dominio.ts` | 4: evento e erros (orientado a objetos) |
| `src/bilheteria.ts` | 5: a venda, onde a concorrência aparece |
| `src/servidor.ts` (pronto) e `src/main.ts` | 6: ligar o servidor |

Não alterem `src/pagamento.ts`, `src/servidor.ts`, `src/bench.ts` nem `testes/`: a correção usa os originais.

Para começar, sigam o `GUIA.md`. Depois dele, os comandos são:

```bash
npm install
npm test          # correção automática: mostra os pontos
npm start         # serviço em http://localhost:3000
npm run bench     # com o serviço no ar: 200 pedidos simultâneos no evento 1, dois por poltrona
```

Exemplo de pedido:

```bash
curl -X POST localhost:3000/reservas -H 'Content-Type: application/json' \
  -d '{"eventoId":1,"ingressos":[{"nome":"Ana","idade":20,"estudante":true,"pcd":false,"poltrona":7}]}'
```

---

**Link do vídeo:** 

### Integrantes

| Nome | Usuário do GitHub | Parte principal |
| :--- | :--- | :--- |
| Elielton Dias | elieltondias | `regras.ts`, `preco.ts` (map/reduce), pagamento recusado em `bilheteria.ts` |
| Matheus André Soares | Matheus-Andre-Soares | fábricas de `preco.ts`, `reservar`/`liberar` do `Evento`, tempo limite da operadora |
| J. Victor Araújo | Devjv10 | hierarquia de erros do `dominio.ts`, a venda em `bilheteria.ts`, `main.ts` e Dockerfile |

### Decisões

1. **Concorrência.** As poltronas são marcadas com `evento.reservar(poltronas)` **antes** do `await`
   do pagamento: o `reservar` do `Evento` valida tudo e marca de uma vez, e como o Node executa o
   JavaScript numa linha só, nenhum outro pedido roda entre a checagem e a marcação. Quando o segundo
   pedido para a mesma poltrona chega, ela já está vendida e ele recebe 409 **sem ter sido cobrado**.
   O `await` perigoso era o do pagamento: se marcássemos as poltronas depois dele, dois pedidos
   esperando a operadora ao mesmo tempo enxergariam a mesma poltrona livre e ela seria vendida duas
   vezes. O teste de 200 pedidos em 50 poltronas confirma: saem exatamente 50 vendas e 50 cobranças.

2. **OO.** O `Evento` esconde a lista de poltronas vendidas num campo `#` e só expõe o `get
   disponivel()` sem setter: de fora dá para **ler** quantas restam, mas não mudar — tentar
   `evento.disponivel = 999` estoura `TypeError`. Se a lista fosse pública, qualquer código faria
   `evento.vendidas.push(99)` e venderia uma poltrona sem passar pela validação. O `reservar` é tudo
   ou nada porque marcar só parte de um pedido recusado deixaria poltronas ocupadas "fantasma",
   vendidas para ninguém, e a contagem do evento ficaria errada. Os erros são uma hierarquia porque
   cada um carrega o próprio `status` HTTP (400, 404, 409, 502): o `servidor.ts` faz um único
   `instanceof ErroDeNegocio` e responde com `erro.status`, então um erro novo é uma classe nova —
   sem mexer no servidor — e o cliente pode tratar cada caso pelo tipo.

3. **Funcional.** `preco.ts` é puro: mesma entrada, mesma saída, sem estado e sem mutação. As duas
   fábricas (`valorDoIngresso` e `aplicarTaxa`) devolvem funções fechadas sobre o preço/percentual,
   como o `criarMultiplicador` da Aula 7; `montarIngressos` usa `map` (devolve um array novo, a
   entrada congelada com `Object.freeze` não é tocada) e `calcularTotal` usa `reduce` somando e
   chamando `aplicarTaxa(0.1)`. Isso facilita testar **sem subir o servidor**: basta
   importar o módulo e chamar direto — `valorDoIngresso(80)("meia")` tem que dar `40`,
   `aplicarTaxa(0.1)(100)` tem que dar `110` — sem rede, sem mocks e sem ordem de execução a
   preocupar, e as mesmas funções servem para um balcão ou um app mobile.

4. **Se fosse em outro paradigma.** Escolhemos `preco.ts`. Em orientado a objetos ele viraria uma
   classe `CalculadoraDePreco` com um campo `precoBase` e métodos (`valorDo()`, `aplicarTaxa()`,
   `montarIngressos()`): ficaria **pior** — mais verboso, as fábricas de função viram construtores,
   o estado da instância precisa ser cuidado (uma instância compartilhada entre requisições vira
   fonte de bug) e testar exigiria criar e configurar objetos antes de cada caso. O inverso também
   se sustenta: `dominio.ts` em puro funcional (objetos planos + funções) perderia o encapsulamento
   do campo `#` — qualquer um alteraria a lista de vendidas — e a hierarquia de erros com
   `instanceof`, que é exatamente o que o servidor usa para escolher o status.

5. **Concorrente × paralelo.** Os pedidos são concorrentes, não paralelos: o event loop pausa um
   pedido no `await` e roda o próximo, mas só um trecho de JavaScript executa por vez — por isso
   `evento.reservar` é atômico **sem nenhuma trava**. Se a venda rodasse em vários núcleos
   (`worker_threads`, `cluster` ou outro processo), dois núcleos executariam a checagem-então-marca
   da mesma poltrona ao mesmo tempo: a corrida (TOCTOU) abriria espaço para vender duas vezes. Ia
   precisar de sincronização — uma trava (mutex) por evento, uma fila única com um processo dono do
   estado, ou lock/atualização atômica no armazenamento — e o `limitePagamentoMs` teria que valer
   para o sistema todo, não por processo. Ficaria bem mais complexo e com mais latência para o
   volume atual, mas ganharia escala real de CPU para uma abertura de vendas muito maior.

### Resultados do bench

| Cenário | Pedidos | Tempo (ms) | Vendidos | Poltrona ocupada | Falha de pagamento |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Padrão (`main.ts`) | 200 | 165 | 87 | 100 | 13 |

O bench ocupa as poltronas do evento 1: para rodar de novo, parem o `npm start` (Ctrl+C) e subam outra
vez.

O que os números mostram:

- **100 recusados com 409 (poltrona ocupada):** o evento 1 tem 100 poltronas e cada uma disputada por
  dois pedidos — o segundo pedido de **cada** poltrona foi recusado. Nenhuma poltrona foi vendida duas
  vezes, que é a regra número um do projeto.
- **87 vendidos + 13 falhas de pagamento = 100:** os 100 primeiros pedidos (um por poltrona) passaram
  pela operadora; 13 deles caíram nos ~10% de `taxaDeFalha` configurados no `main.ts` e receberam 502.
  Como o pagamento falhou, as poltronas desses 13 **voltaram para a venda** (`disponivel: 13` no fim):
  ninguém ficou cobrado sem levar o ingresso.
- **165 ms para 200 pedidos** (1213 pedidos/s): cada cobrança demora 80 ms sozinha, então se os pedidos
  fosse um a um levariam 100 × 80 ms = 8 segundos. Os pedidos não esperam uns pelos outros: enquanto
  um espera no `await` do pagamento, o Node atende os outros.
