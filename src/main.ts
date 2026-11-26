// Sobe o serviço: três eventos, a operadora falsa e o servidor Express na 3000.
//   npm start     → http://localhost:3000
//   npm run bench → carga de 200 pedidos contra o evento 1

import { Evento } from "./dominio.ts";
import { criarBilheteria } from "./bilheteria.ts";
import { criarPagamentoFalso } from "./pagamento.ts";
import { criarServidor } from "./servidor.ts";

// O evento 1 tem 100 poltronas porque é o que o bench usa;
// os outros dois ficam à escolha do grupo.
const eventos = [
  new Evento(1, "Show de Paradigmas", 100, 100),
  new Evento(2, "Festival de Inverno", 80, 40),
  new Evento(3, "Serenata no Parque", 60, 25),
];

// Operadora falsa: demora 80 ms por cobrança e falha 10% das vezes.
const pagar = criarPagamentoFalso({ latenciaMs: 80, taxaDeFalha: 0.1 });

const bilheteria = criarBilheteria({ eventos, pagar, limitePagamentoMs: 500 });

criarServidor(bilheteria).listen(3000, () => {
  console.log("Bilheteria no ar em http://localhost:3000");
});
