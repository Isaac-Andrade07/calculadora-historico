// Rode com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcular, tokenizar, paraPosfixa, formatar, ErroCalculo } from "../js/calculadora.js";
import { criarHistorico } from "../js/historico.js";

test("operações básicas", () => {
  assert.equal(calcular("2+3"), 5);
  assert.equal(calcular("10-4"), 6);
  assert.equal(calcular("6×7"), 42);
  assert.equal(calcular("9÷2"), 4.5);
});

test("precedência e parênteses", () => {
  assert.equal(calcular("2+3*4"), 14);
  assert.equal(calcular("(2+3)*4"), 20);
  assert.equal(calcular("2^3^2"), 512); // potência é associativa à direita
  assert.equal(calcular("-2^2"), -4);
  assert.equal(calcular("(-2)^2"), 4);
});

test("números negativos, decimais com vírgula e porcentagem", () => {
  assert.equal(calcular("-5+3"), -2);
  assert.equal(calcular("3*-2"), -6);
  assert.equal(calcular("1,5+1,5"), 3);
  assert.equal(calcular("50%"), 0.5);
  assert.equal(calcular("200*10%"), 20);
});

test("raiz quadrada e multiplicação implícita", () => {
  assert.equal(calcular("√9"), 3);
  assert.equal(calcular("2√16"), 8);
  assert.equal(calcular("2(3+1)"), 8);
  assert.equal(calcular("(1+1)(2+2)"), 8);
});

test("corrige imprecisão de ponto flutuante", () => {
  assert.equal(calcular("0,1+0,2"), 0.3);
});

test("erros tratados", () => {
  assert.throws(() => calcular("5/0"), /Divisão por zero/);
  assert.throws(() => calcular("√-4"), /negativo/);
  assert.throws(() => calcular("(2+3"), /Parênteses/);
  assert.throws(() => calcular("2+"), ErroCalculo);
  assert.throws(() => calcular("2..5"), /Número inválido/);
  assert.throws(() => calcular("abc"), /Caractere inválido/);
  assert.throws(() => calcular(""), /Digite/);
});

test("conversão para notação posfixa", () => {
  const posfixa = paraPosfixa(tokenizar("3+4*2")).map(t => t.valor);
  assert.deepEqual(posfixa, [3, 4, 2, "*", "+"]);
});

test("formatação no padrão brasileiro", () => {
  assert.equal(formatar(1234.5), "1.234,5");
  assert.equal(formatar(1e20), "1,000000e+20");
});

// Armazenamento falso, para testar o histórico sem navegador.
function storageFalso() {
  const dados = {};
  return { getItem: k => dados[k] ?? null, setItem: (k, v) => { dados[k] = v; } };
}

test("histórico separado por usuário", () => {
  const h = criarHistorico(storageFalso());
  h.adicionar("2+2", 4);
  h.trocarUsuario("Ana");
  assert.equal(h.itens().length, 0);
  h.adicionar("3*3", 9);
  h.trocarUsuario("visitante"); // reaproveita o usuário existente
  assert.equal(h.usuarioAtual(), "Visitante");
  assert.equal(h.itens()[0].resultado, 4);
  assert.deepEqual(h.usuarios(), ["Ana", "Visitante"]);
});

test("histórico persiste, busca e estatísticas", () => {
  const storage = storageFalso();
  const h = criarHistorico(storage);
  h.adicionar("10/4", 2.5, new Date("2026-11-22T12:00:00Z"));
  h.adicionar("7*6", 42, new Date("2026-11-21T12:00:00Z"));

  const recarregado = criarHistorico(storage);
  assert.equal(recarregado.itens().length, 2);
  assert.equal(recarregado.itens("7*").length, 1);
  assert.equal(recarregado.itens("2,5").length, 1);
  assert.deepEqual(recarregado.estatisticas(new Date("2026-11-22T15:00:00Z")), { total: 2, hoje: 1, maior: 42, menor: 2.5 });
});

test("validação de usuário e remoção", () => {
  const h = criarHistorico(storageFalso());
  assert.throws(() => h.trocarUsuario("   "), /Digite um nome/);
  assert.throws(() => h.removerUsuario("Visitante"), /pelo menos um/);
  h.trocarUsuario("Bia");
  h.removerUsuario("Bia");
  assert.equal(h.usuarioAtual(), "Visitante");
});
