// Interpretador de expressões matemáticas, feito do zero (sem eval).
// Etapas: 1) tokenizar  2) converter para notação polonesa reversa (Shunting-yard)  3) calcular.

export class ErroCalculo extends Error {}

const OPERADORES = {
  "+": { precedencia: 1, assoc: "esq", aridade: 2, fn: (a, b) => a + b },
  "-": { precedencia: 1, assoc: "esq", aridade: 2, fn: (a, b) => a - b },
  "*": { precedencia: 2, assoc: "esq", aridade: 2, fn: (a, b) => a * b },
  "/": {
    precedencia: 2, assoc: "esq", aridade: 2,
    fn: (a, b) => {
      if (b === 0) throw new ErroCalculo("Divisão por zero");
      return a / b;
    }
  },
  "neg": { precedencia: 3, assoc: "dir", aridade: 1, fn: a => -a },
  "^": { precedencia: 4, assoc: "dir", aridade: 2, fn: (a, b) => a ** b },
  "√": {
    precedencia: 5, assoc: "dir", aridade: 1,
    fn: a => {
      if (a < 0) throw new ErroCalculo("Raiz de número negativo");
      return Math.sqrt(a);
    }
  },
  "%": { precedencia: 6, assoc: "esq", aridade: 1, posfixo: true, fn: a => a / 100 }
};

// Converte símbolos que o usuário digita para o formato interno.
export function normalizar(expressao) {
  return String(expressao)
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/,/g, ".")
    .replace(/sqrt/gi, "√")
    .replace(/\s+/g, "");
}

// 1) Quebra o texto em pedaços (números, operadores, parênteses).
export function tokenizar(expressao) {
  const texto = normalizar(expressao);
  const tokens = [];
  let i = 0;

  while (i < texto.length) {
    const c = texto[i];
    const anterior = tokens[tokens.length - 1];
    const esperaValor = !anterior || anterior.tipo === "op" || anterior.tipo === "(";

    if (/[0-9.]/.test(c)) {
      let numero = "";
      while (i < texto.length && /[0-9.]/.test(texto[i])) numero += texto[i++];
      if ((numero.match(/\./g) || []).length > 1 || numero === ".") {
        throw new ErroCalculo(`Número inválido: ${numero}`);
      }
      multiplicacaoImplicita(tokens);
      tokens.push({ tipo: "num", valor: Number(numero) });
      continue;
    }

    if (c === "(") {
      multiplicacaoImplicita(tokens);
      tokens.push({ tipo: "(" });
    } else if (c === ")") {
      tokens.push({ tipo: ")" });
    } else if (c === "√") {
      multiplicacaoImplicita(tokens);
      tokens.push({ tipo: "op", valor: "√" });
    } else if (c === "%") {
      if (esperaValor) throw new ErroCalculo("% precisa vir depois de um número");
      tokens.push({ tipo: "op", valor: "%" });
    } else if (c === "-" && esperaValor) {
      tokens.push({ tipo: "op", valor: "neg" });
    } else if (c === "+" && esperaValor) {
      // "+" unário não muda nada: ignoramos.
    } else if ("+-*/^".includes(c)) {
      tokens.push({ tipo: "op", valor: c });
    } else {
      throw new ErroCalculo(`Caractere inválido: ${c}`);
    }
    i++;
  }
  return tokens;
}

// Permite escrever 2(3+1), (2)(3) ou 2√9, como numa calculadora científica.
function multiplicacaoImplicita(tokens) {
  const anterior = tokens[tokens.length - 1];
  if (!anterior) return;
  const terminaValor = anterior.tipo === "num" || anterior.tipo === ")" || (anterior.tipo === "op" && anterior.valor === "%");
  if (terminaValor) tokens.push({ tipo: "op", valor: "*" });
}

// 2) Algoritmo Shunting-yard: reorganiza os tokens respeitando precedência e parênteses.
export function paraPosfixa(tokens) {
  const saida = [];
  const pilha = [];

  for (const t of tokens) {
    if (t.tipo === "num") {
      saida.push(t);
    } else if (t.tipo === "op") {
      const atual = OPERADORES[t.valor];
      if (atual.posfixo) {
        saida.push(t);
        continue;
      }
      while (pilha.length) {
        const topo = pilha[pilha.length - 1];
        if (topo.tipo !== "op") break;
        const op = OPERADORES[topo.valor];
        const deveSair = atual.aridade === 2 && (
          op.precedencia > atual.precedencia ||
          (op.precedencia === atual.precedencia && atual.assoc === "esq")
        );
        if (!deveSair) break;
        saida.push(pilha.pop());
      }
      pilha.push(t);
    } else if (t.tipo === "(") {
      pilha.push(t);
    } else if (t.tipo === ")") {
      while (pilha.length && pilha[pilha.length - 1].tipo !== "(") saida.push(pilha.pop());
      if (!pilha.length) throw new ErroCalculo("Parênteses desbalanceados");
      pilha.pop();
    }
  }

  while (pilha.length) {
    const t = pilha.pop();
    if (t.tipo === "(") throw new ErroCalculo("Parênteses desbalanceados");
    saida.push(t);
  }
  return saida;
}

// 3) Calcula a expressão em notação posfixa usando uma pilha.
export function calcularPosfixa(posfixa) {
  const pilha = [];
  for (const t of posfixa) {
    if (t.tipo === "num") {
      pilha.push(t.valor);
      continue;
    }
    const op = OPERADORES[t.valor];
    if (pilha.length < op.aridade) throw new ErroCalculo("Expressão incompleta");
    const args = pilha.splice(-op.aridade);
    pilha.push(op.fn(...args));
  }
  if (pilha.length !== 1) throw new ErroCalculo("Expressão incompleta");
  return pilha[0];
}

// Arredonda para evitar resultados como 0.1 + 0.2 = 0.30000000000000004
export function arredondar(numero) {
  if (!Number.isFinite(numero)) throw new ErroCalculo("Resultado fora do limite");
  return Number.parseFloat(numero.toPrecision(12));
}

export function calcular(expressao) {
  if (!normalizar(expressao)) throw new ErroCalculo("Digite uma expressão");
  return arredondar(calcularPosfixa(paraPosfixa(tokenizar(expressao))));
}

// Formata no padrão brasileiro: 1.234,56
export function formatar(numero) {
  if (Math.abs(numero) >= 1e15 || (numero !== 0 && Math.abs(numero) < 1e-9)) {
    return numero.toExponential(6).replace(".", ",");
  }
  return numero.toLocaleString("pt-BR", { maximumFractionDigits: 10 });
}
