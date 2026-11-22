// Histórico de cálculos separado por usuário.
// O armazenamento é recebido por parâmetro, o que permite testar sem navegador.

const CHAVE = "calculadora-historico";
const LIMITE_POR_USUARIO = 200;

export function criarHistorico(storage = globalThis.localStorage) {
  let dados = carregar();

  function carregar() {
    try {
      const salvo = JSON.parse(storage?.getItem(CHAVE));
      if (salvo?.usuarios) return salvo;
    } catch {
      // Dados corrompidos ou armazenamento indisponível: começa do zero.
    }
    return { usuarioAtual: "Visitante", usuarios: { Visitante: [] } };
  }

  function salvar() {
    try {
      storage?.setItem(CHAVE, JSON.stringify(dados));
    } catch {
      // Sem armazenamento: o histórico vale só para esta sessão.
    }
  }

  function validarNome(nome) {
    const limpo = String(nome ?? "").trim().replace(/\s+/g, " ");
    if (!limpo) throw new Error("Digite um nome.");
    if (limpo.length > 30) throw new Error("Use no máximo 30 caracteres.");
    return limpo;
  }

  const lista = () => dados.usuarios[dados.usuarioAtual];

  return {
    usuarioAtual: () => dados.usuarioAtual,
    usuarios: () => Object.keys(dados.usuarios).sort((a, b) => a.localeCompare(b, "pt-BR")),

    trocarUsuario(nome) {
      const limpo = validarNome(nome);
      // Reaproveita o usuário se já existir com outra combinação de maiúsculas/minúsculas.
      const existente = Object.keys(dados.usuarios).find(u => u.toLowerCase() === limpo.toLowerCase());
      const final = existente || limpo;
      if (!existente) dados.usuarios[final] = [];
      dados.usuarioAtual = final;
      salvar();
      return final;
    },

    removerUsuario(nome) {
      if (Object.keys(dados.usuarios).length === 1) throw new Error("É preciso ter pelo menos um usuário.");
      delete dados.usuarios[nome];
      if (dados.usuarioAtual === nome) dados.usuarioAtual = Object.keys(dados.usuarios)[0];
      salvar();
    },

    adicionar(expressao, resultado, em = new Date()) {
      const item = {
        id: `${em.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        expressao,
        resultado,
        em: em.toISOString()
      };
      lista().unshift(item);
      lista().splice(LIMITE_POR_USUARIO);
      salvar();
      return item;
    },

    itens(busca = "") {
      const termo = busca.trim().toLowerCase().replace(",", ".");
      if (!termo) return [...lista()];
      return lista().filter(i => `${i.expressao} ${i.resultado}`.toLowerCase().replace(/,/g, ".").includes(termo));
    },

    remover(id) {
      dados.usuarios[dados.usuarioAtual] = lista().filter(i => i.id !== id);
      salvar();
    },

    limpar() {
      dados.usuarios[dados.usuarioAtual] = [];
      salvar();
    },

    estatisticas(hoje = new Date()) {
      const itens = lista();
      const dia = hoje.toISOString().slice(0, 10);
      const resultados = itens.map(i => i.resultado);
      return {
        total: itens.length,
        hoje: itens.filter(i => i.em.slice(0, 10) === dia).length,
        maior: resultados.length ? Math.max(...resultados) : null,
        menor: resultados.length ? Math.min(...resultados) : null
      };
    },

    paraCsv() {
      const celula = v => `"${String(v).replace(/"/g, '""')}"`;
      const linhas = [["Data", "Expressão", "Resultado"]].concat(
        lista().map(i => [new Date(i.em).toLocaleString("pt-BR"), i.expressao, String(i.resultado).replace(".", ",")])
      );
      return "\ufeff" + linhas.map(l => l.map(celula).join(";")).join("\n");
    }
  };
}
