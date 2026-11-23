const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

function abrirAplicacao(interfaceSimulada) {
  let conteudo = null;
  const disco = {
    falhar: false,
    getItem: () => conteudo,
    setItem(chave, valor) {
      if (this.falhar) throw new Error("QuotaExceededError");
      conteudo = valor;
    },
  };
  const raiz = join(__dirname, "..");
  const html = readFileSync(join(raiz, "index.html"), "utf8");
  const ambiente = vm.createContext({ localStorage: disco, ...interfaceSimulada });
  ambiente.window = ambiente;
  for (const [, caminho] of html.matchAll(/<script defer src="([^"]+)"/g)) {
    if (caminho === "js/app.js" && !interfaceSimulada) break;
    vm.runInContext(readFileSync(join(raiz, caminho), "utf8"), ambiente, { filename: caminho });
  }
  return { p: ambiente.Paisagismo, disco };
}

function elementoSimulado(tag) {
  return {
    tag, textContent: "", value: "", children: [], eventos: {}, atributos: {}, dataset: {},
    classList: { add() {}, toggle() {} },
    append(...filhos) { this.children.push(...filhos); },
    replaceChildren(...filhos) { this.children = filhos; },
    addEventListener(nome, acao) { this.eventos[nome] = acao; },
    setAttribute(nome, valor) { this.atributos[nome] = valor; },
    removeAttribute(nome) { delete this.atributos[nome]; },
  };
}

function* elementos(raiz) {
  yield raiz;
  for (const filho of raiz.children) yield* elementos(filho);
}

test("a interface sinaliza a pendência e confirma somente após a nova tentativa", () => {
  const controles = new Map();
  const historico = elementoSimulado("button");
  historico.dataset.tela = "historico";
  const document = {
    body: elementoSimulado("body"),
    createElement: elementoSimulado,
    querySelector(seletor) {
      if (!controles.has(seletor)) controles.set(seletor, elementoSimulado(seletor));
      return controles.get(seletor);
    },
    querySelectorAll: () => [historico],
  };
  const { p, disco } = abrirAplicacao({ document, structuredClone, scrollTo() {} });
  const naTela = (filtrar) => [...elementos(controles.get("#conteudo"))].find(filtrar);
  const nome = naTela((elemento) => elemento.atributos["aria-label"] === "Nome do projeto");
  nome.value = "Jardim em teste";
  nome.eventos.input();

  disco.falhar = true;
  naTela((elemento) => elemento.textContent === "Salvar orçamento").eventos.click();
  assert.match(controles.get("#status").textContent, /pendente de gravação/);
  assert.equal(controles.get("#tentar-gravar").hidden, false);
  assert.equal(p.armazenamento.carregar().salvos.length, 0);
  historico.eventos.click();
  assert.ok(naTela((elemento) => elemento.textContent.includes("Gravação pendente")));

  disco.falhar = false;
  controles.get("#tentar-gravar").eventos.click();
  assert.equal(controles.get("#status").textContent, "Orçamento salvo neste navegador.");
  assert.equal(controles.get("#tentar-gravar").hidden, true);
  assert.equal(naTela((elemento) => elemento.textContent.includes("Gravação pendente")), undefined);
  assert.equal(p.armazenamento.carregar().salvos.length, 1);
});

function versao(projeto, hora) {
  return { projeto: structuredClone(projeto), hora, data: "2025-01-03T13:00:00.000Z" };
}

test("falhas repetidas mantêm a mesma versão e permitem gravá-la sem duplicar", () => {
  const { p, disco } = abrirAplicacao();
  const sessao = p.criarSessao(p.armazenamento.carregar(), p.armazenamento.gravar);
  sessao.dados.projeto.nome = "Jardim original";
  const registro = versao(sessao.dados.projeto, p.custos(sessao.dados.operacao).hora);
  disco.falhar = true;
  assert.equal(sessao.salvarVersao(() => registro), false);
  assert.equal(sessao.versaoPendente, registro);
  assert.equal(disco.getItem(), null);

  sessao.dados.projeto.nome = "Rascunho editado";
  assert.equal(sessao.salvarVersao(() => assert.fail("Criou uma segunda versão")), false);
  assert.equal(sessao.dados.salvos.length, 1);
  disco.falhar = false;
  assert.equal(sessao.gravar(), false, "Autosave não confirma uma versão pendente");
  assert.equal(sessao.repetir(), true);
  assert.equal(sessao.versaoPendente, null);
  const reaberto = p.armazenamento.carregar();
  assert.equal(reaberto.salvos.length, 1);
  assert.equal(reaberto.salvos[0].data, registro.data);
  assert.equal(reaberto.salvos[0].projeto.nome, "Jardim original");
  assert.equal(reaberto.projeto.nome, "Rascunho editado");
});

test("backup inválido ou sem espaço para gravação preserva o estado atual", () => {
  const { p, disco } = abrirAplicacao();
  const atual = p.armazenamento.carregar();
  atual.projeto.nome = "Projeto atual";
  const sessao = p.criarSessao(atual, p.armazenamento.gravar);
  assert.equal(sessao.gravar(), true);
  const gravado = disco.getItem();
  const novo = p.modelo();
  novo.projeto.nome = "Backup novo";
  const invalido = { ...novo, salvos: [versao(novo.projeto, -1)] };
  assert.throws(() => sessao.restaurar(p.armazenamento.ler(JSON.stringify(invalido))));
  invalido.salvos[0].hora = 20;
  invalido.salvos[0].acompanhamento = { situacao: "Enviada", proximo: "2025-02-30" };
  assert.throws(() => sessao.restaurar(p.armazenamento.ler(JSON.stringify(invalido))));

  disco.falhar = true;
  const pendente = versao(atual.projeto, 20);
  assert.equal(sessao.salvarVersao(() => pendente), false);
  assert.equal(sessao.restaurar(p.armazenamento.ler(JSON.stringify(novo))), false);
  assert.equal(sessao.dados, atual);
  assert.equal(sessao.versaoPendente, pendente);
  assert.equal(disco.getItem(), gravado);
});

test("backup legado restaura versões usando as horas e percentuais históricos", () => {
  const { p } = abrirAplicacao();
  const legado = p.modelo();
  const hora = p.custos(legado.operacao).hora;
  legado.projeto.nome = "Histórico";
  legado.salvos.push(versao(legado.projeto, hora));
  legado.operacao.horas = 200;
  const sessao = p.criarSessao(p.armazenamento.carregar(), p.armazenamento.gravar);
  assert.equal(sessao.restaurar(p.armazenamento.ler(JSON.stringify(legado))), true);
  const salvo = p.armazenamento.carregar().salvos[0];
  assert.equal(salvo.hora, hora);
  assert.equal(salvo.projeto.modoLucro, "acrescimo");
  assert.equal(salvo.acompanhamento.situacao, "Planejada");
  assert.equal(p.calcular(salvo.projeto, salvo.hora).preco.toFixed(2), "3052.81");
  assert.notEqual(p.custos(sessao.dados.operacao).hora, salvo.hora);
});

test("o exemplo inicial continua exibindo R$ 3.052,81", () => {
  const { p } = abrirAplicacao();
  const modelo = p.armazenamento.carregar();
  const valores = p.calcular(modelo.projeto, p.custos(modelo.operacao).hora);
  assert.equal(valores.horas, 55);
  assert.equal(p.ui.brl(valores.preco).replace(/\s/g, " "), "R$ 3.052,81");
});
