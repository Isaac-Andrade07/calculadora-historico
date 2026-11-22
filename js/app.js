// Liga a interface à calculadora e ao histórico.

import { calcular, formatar, ErroCalculo } from "./calculadora.js";
import { criarHistorico } from "./historico.js";

const $ = id => document.getElementById(id);
const historico = criarHistorico();
const entrada = $("entrada");
const PERMITIDOS = /[^0-9+\-−*/×÷^().,%√]/g;

// ---------- Visor ----------

function definirEntrada(texto) {
  entrada.value = texto;
  atualizarPrevia();
  entrada.focus();
  entrada.setSelectionRange(texto.length, texto.length);
}

// Insere o texto onde está o cursor, como num editor.
function inserir(texto) {
  const inicio = entrada.selectionStart ?? entrada.value.length;
  const fim = entrada.selectionEnd ?? entrada.value.length;
  entrada.value = entrada.value.slice(0, inicio) + texto + entrada.value.slice(fim);
  const pos = inicio + texto.length;
  entrada.focus();
  entrada.setSelectionRange(pos, pos);
  atualizarPrevia();
}

function atualizarPrevia() {
  const previa = $("previa");
  previa.classList.remove("erro");
  try {
    previa.textContent = entrada.value ? `= ${formatar(calcular(entrada.value))}` : "";
  } catch {
    previa.textContent = ""; // enquanto digita, não mostra erro
  }
}

function resultadoParaEntrada(numero) {
  return String(numero).replace(".", ",");
}

function igual() {
  const expressao = entrada.value.trim();
  if (!expressao) return;
  try {
    const resultado = calcular(expressao);
    historico.adicionar(expressao, resultado);
    definirEntrada(resultadoParaEntrada(resultado));
    $("previa").textContent = expressao;
    renderHistorico();
  } catch (erro) {
    const previa = $("previa");
    previa.textContent = erro instanceof ErroCalculo ? erro.message : "Expressão inválida";
    previa.classList.add("erro");
  }
}

function inverterSinal() {
  const v = entrada.value.trim();
  if (!v) return;
  const envolvido = v.match(/^-\((.*)\)$/);
  definirEntrada(envolvido ? envolvido[1] : `-(${v})`);
}

function executarAcao(acao) {
  if (acao === "limpar") definirEntrada("");
  if (acao === "apagar") {
    const inicio = entrada.selectionStart;
    const fim = entrada.selectionEnd;
    if (inicio !== fim) inserir("");
    else if (inicio > 0) {
      entrada.setSelectionRange(inicio - 1, inicio);
      inserir("");
    }
  }
  if (acao === "sinal") inverterSinal();
  if (acao === "igual") igual();
}

// Destaca a tecla na tela quando o usuário usa o teclado físico.
function piscarTecla(seletor) {
  const botao = document.querySelector(seletor);
  if (!botao) return;
  botao.classList.add("pressionada");
  setTimeout(() => botao.classList.remove("pressionada"), 120);
}

// ---------- Histórico ----------

function renderUsuarios() {
  const atual = historico.usuarioAtual();
  $("seletorUsuario").innerHTML = historico.usuarios()
    .map(u => `<option ${u === atual ? "selected" : ""}>${escapar(u)}</option>`).join("");
  $("nomeUsuario").textContent = atual;
  $("btnRemoverUsuario").hidden = historico.usuarios().length < 2;
}

function renderHistorico() {
  const itens = historico.itens($("busca").value);
  const est = historico.estatisticas();
  const fmt = v => (v === null ? "—" : formatar(v));

  $("estatisticas").innerHTML = `
    <div><span>Cálculos</span><strong>${est.total}</strong></div>
    <div><span>Hoje</span><strong>${est.hoje}</strong></div>
    <div><span>Maior resultado</span><strong>${fmt(est.maior)}</strong></div>
    <div><span>Menor resultado</span><strong>${fmt(est.menor)}</strong></div>`;

  $("lista").innerHTML = itens.map(i => `
    <li data-id="${i.id}" data-resultado="${i.resultado}" title="Usar este resultado">
      <span class="expr">${escapar(i.expressao)} =</span>
      <span class="res">${formatar(i.resultado)}</span>
      <time datetime="${i.em}">${new Date(i.em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time>
      <button class="remover" data-remover="${i.id}" aria-label="Remover do histórico">×</button>
    </li>`).join("");

  const vazio = $("vazio");
  vazio.hidden = itens.length > 0;
  vazio.innerHTML = $("busca").value
    ? "Nada encontrado para essa busca."
    : "Nenhum cálculo ainda. Faça uma conta e aperte <b>=</b>.";
}

function render() {
  renderUsuarios();
  renderHistorico();
}

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function aviso(texto) {
  const toast = $("toast");
  toast.textContent = texto;
  toast.hidden = false;
  clearTimeout(aviso.timer);
  aviso.timer = setTimeout(() => { toast.hidden = true; }, 2500);
}

function baixarCsv() {
  if (!historico.estatisticas().total) return aviso("O histórico está vazio.");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([historico.paraCsv()], { type: "text/csv;charset=utf-8" }));
  link.download = `historico-${historico.usuarioAtual().toLowerCase().replace(/\s+/g, "-")}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// ---------- Eventos ----------

function configurarTeclado() {
  document.querySelectorAll("[data-tecla]").forEach(b =>
    b.addEventListener("click", () => inserir(b.dataset.tecla))
  );
  document.querySelectorAll("[data-acao]").forEach(b =>
    b.addEventListener("click", () => executarAcao(b.dataset.acao))
  );

  // Aceita apenas caracteres de conta e troca * e / pelos símbolos da tela.
  entrada.addEventListener("input", () => {
    const pos = entrada.selectionStart;
    const limpo = entrada.value.replace(/\*/g, "×").replace(/\//g, "÷").replace(PERMITIDOS, "");
    if (limpo !== entrada.value) {
      const diferenca = entrada.value.length - limpo.length;
      entrada.value = limpo;
      entrada.setSelectionRange(pos - diferenca, pos - diferenca);
    }
    atualizarPrevia();
  });

  entrada.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === "=") {
      e.preventDefault();
      piscarTecla('[data-acao="igual"]');
      igual();
    }
    if (e.key === "Escape") {
      piscarTecla('[data-acao="limpar"]');
      definirEntrada("");
    }
    const mapa = { "*": "×", "/": "÷" };
    const tecla = mapa[e.key] || e.key;
    piscarTecla(`[data-tecla="${CSS.escape(tecla)}"]`);
  });

  // Atalho: qualquer dígito digitado fora do campo vai para o visor.
  document.addEventListener("keydown", e => {
    const emCampo = e.target.closest("input, select, textarea, dialog");
    if (!emCampo && /^[0-9+\-*/().,%^]$/.test(e.key)) entrada.focus();
  });
}

function configurarHistorico() {
  $("lista").addEventListener("click", e => {
    const remover = e.target.closest("[data-remover]");
    if (remover) {
      historico.remover(remover.dataset.remover);
      renderHistorico();
      return;
    }
    const item = e.target.closest("li[data-resultado]");
    if (item) definirEntrada(resultadoParaEntrada(Number(item.dataset.resultado)));
  });
  $("busca").addEventListener("input", renderHistorico);
  $("btnExportar").addEventListener("click", baixarCsv);
  $("btnLimpar").addEventListener("click", () => {
    if (!historico.estatisticas().total) return;
    if (confirm(`Apagar todo o histórico de ${historico.usuarioAtual()}?`)) {
      historico.limpar();
      renderHistorico();
      aviso("Histórico apagado.");
    }
  });
}

function configurarUsuarios() {
  const modal = $("modalUsuario");
  const form = $("formUsuario");

  $("seletorUsuario").addEventListener("change", e => {
    historico.trocarUsuario(e.target.value);
    $("busca").value = "";
    render();
    aviso(`Olá, ${historico.usuarioAtual()}!`);
  });

  $("btnNovoUsuario").addEventListener("click", () => {
    form.reset();
    $("erroUsuario").textContent = "";
    modal.showModal();
  });
  $("btnCancelarUsuario").addEventListener("click", () => modal.close());

  form.addEventListener("submit", e => {
    e.preventDefault();
    try {
      const nome = historico.trocarUsuario(form.nome.value);
      modal.close();
      $("busca").value = "";
      render();
      aviso(`Olá, ${nome}!`);
      entrada.focus();
    } catch (erro) {
      $("erroUsuario").textContent = erro.message;
    }
  });

  $("btnRemoverUsuario").addEventListener("click", () => {
    const nome = historico.usuarioAtual();
    if (!confirm(`Remover o usuário ${nome} e todo o histórico dele?`)) return;
    historico.removerUsuario(nome);
    render();
    aviso(`Usuário ${nome} removido.`);
  });
}

function configurarAparencia() {
  const atualizarBotao = () => {
    $("btnTema").textContent = document.documentElement.dataset.tema === "escuro" ? "☀️" : "🌙";
  };
  $("btnTema").addEventListener("click", () => {
    const novo = document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro";
    document.documentElement.dataset.tema = novo;
    try { localStorage.setItem("calc-tema", novo); } catch {}
    atualizarBotao();
  });
  atualizarBotao();

  const btnModo = $("btnModo");
  const cientificas = $("teclasCientificas");
  let ativo = false;
  try { ativo = localStorage.getItem("calc-cientifica") === "1"; } catch {}
  const aplicar = () => {
    cientificas.hidden = !ativo;
    btnModo.setAttribute("aria-pressed", String(ativo));
  };
  btnModo.addEventListener("click", () => {
    ativo = !ativo;
    try { localStorage.setItem("calc-cientifica", ativo ? "1" : "0"); } catch {}
    aplicar();
    entrada.focus();
  });
  aplicar();
}

configurarTeclado();
configurarHistorico();
configurarUsuarios();
configurarAparencia();
render();
entrada.focus();
