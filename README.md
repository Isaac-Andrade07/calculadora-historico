# 🧮 Calculadora com Histórico

![Testes](https://github.com/Isaac-Andrade07/calculadora-historico/actions/workflows/testes.yml/badge.svg)

Calculadora científica feita com HTML, CSS e JavaScript puro, com **histórico de cálculos separado por usuário**.

🔗 **Acesse online:** https://isaac-andrade07.github.io/calculadora-historico/

## ✨ Funcionalidades

- Operações básicas, porcentagem, potência, raiz quadrada e parênteses
- Modo científico que pode ser ligado e desligado
- Prévia do resultado enquanto você digita
- Suporte ao teclado: números, operadores, `Enter` para calcular, `Esc` para limpar e `Backspace` para apagar
- Multiplicação implícita: `2(3+1)` e `2√16` funcionam como numa calculadora científica
- Mensagens de erro claras: divisão por zero, raiz de número negativo, parênteses desbalanceados
- **Vários usuários**: cada pessoa tem o próprio histórico
- Histórico com busca, data e hora, reutilização de resultados e remoção de itens
- Estatísticas por usuário: total de cálculos, cálculos do dia, maior e menor resultado
- Exportação do histórico em CSV (abre no Excel)
- Tema claro e escuro, layout responsivo para celular

## 🧠 Como o cálculo funciona

A calculadora **não usa `eval()`**, que seria inseguro e pouco controlável. Ela tem um interpretador próprio, em três etapas:

1. **Tokenização**: o texto `2+3×4` vira uma lista de pedaços: `2`, `+`, `3`, `×`, `4`.
2. **Algoritmo Shunting-yard** (Dijkstra): reorganiza os pedaços em notação polonesa reversa, respeitando precedência e parênteses: `2 3 4 × +`.
3. **Avaliação com pilha**: percorre a lista e calcula o resultado: `14`.

Também corrige a imprecisão de ponto flutuante do JavaScript (`0,1 + 0,2` dá `0,3`, e não `0,30000000000000004`).

## 🛠️ Tecnologias

- HTML5 (`<dialog>`, acessibilidade com `aria-*`)
- CSS3 (variáveis para tema, Grid, layout responsivo)
- JavaScript (ES Modules), sem bibliotecas
- localStorage para guardar o histórico
- Node.js test runner e GitHub Actions para os testes automatizados

## 📁 Estrutura

```
index.html                  → estrutura da página
css/style.css               → visual, temas e responsividade
js/calculadora.js           → interpretador de expressões (tokenizador, Shunting-yard, avaliação)
js/historico.js             → histórico por usuário, busca, estatísticas e CSV
js/app.js                   → eventos da tela e do teclado
tests/calculadora.test.js   → testes automatizados
```

## ▶️ Como rodar localmente

Por usar ES Modules, abra o projeto com um servidor local:

```bash
python -m http.server 8000
# depois acesse http://localhost:8000
```

## 🧪 Testes

```bash
npm test
```

São 11 testes que cobrem as operações, a precedência, os erros, a formatação e o histórico por usuário.

## 👤 Autor

**Isaac Raphael Oliveira Andrade**
Estudante de Análise e Desenvolvimento de Sistemas
