const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

function abrirAplicacao(interfaceSimulada) {
  let conteudo = null;
  const disco = {
    falhar: false,
    leituras: 0,
    gravacoes: 0,
    getItem() { this.leituras++; return conteudo; },
    setItem(chave, valor) {
      this.gravacoes++;
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
    getAttribute(nome) { return this.atributos[nome] ?? null; },
    removeAttribute(nome) { delete this.atributos[nome]; },
    querySelector(tag) { return [...elementos(this)].find((filho) => filho.tag === tag); },
    focus() { this.focado = true; },
  };
}

function* elementos(raiz) {
  yield raiz;
  for (const filho of raiz.children) yield* elementos(filho);
}

function simularInterface() {
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
  const naTela = (filtrar) => [...elementos(controles.get("#conteudo"))].find(filtrar);
  return { document, controles, historico, naTela };
}

test("a interface sinaliza a pendência e confirma somente após a nova tentativa", () => {
  const { document, controles, historico, naTela } = simularInterface();
  const { p, disco } = abrirAplicacao({ document, structuredClone, scrollTo() {} });
  naTela((elemento) => elemento.textContent === "Abrir orçamento").eventos.click();
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

test("painel conta apenas a versão vigente gravada de cada projeto", () => {
  const { p } = abrirAplicacao();
  const dados = p.armazenamento.carregar();
  function registro(id, data, situacao, proximo = "") {
    return { ...versao({ ...dados.projeto, idProjeto: id }, 20), data,
      acompanhamento: { situacao, proximo } };
  }
  const antiga = registro("jardim", "2025-01-01", "Enviada", "2025-01-01");
  const vigente = registro("jardim", "2025-01-02", "Aprovada");
  const aberta = registro("patio", "2025-01-02", "Enviada", "2025-01-03");
  const pendente = registro("patio", "2025-01-04", "Aprovada");
  const painel = p.resumirPainel([pendente, antiga, aberta, vigente], "2025-01-03", pendente);
  assert.equal(painel.abertas, 1);
  assert.equal(painel.aprovadas, 1);
  assert.equal(painel.aRetomar, 1);
  assert.equal(painel.retornos[0], aberta);
  assert.equal(painel.potencial, p.calcular(aberta.projeto, aberta.hora).preco);
});

test("a demonstração fica em memória e não lê nem grava os dados locais", () => {
  const { document, controles, naTela } = simularInterface();
  const { disco } = abrirAplicacao({ document, structuredClone, location: { search: "?demo=1" }, scrollTo() {} });
  assert.equal(controles.get("#aviso-demonstracao").hidden, false);
  assert.equal(controles.get("#importar").hidden, true);
  assert.equal(controles.get("#exportar").hidden, true);
  assert.ok(naTela((elemento) => elemento.textContent.includes("Cliente fictício A")));
  naTela((elemento) => elemento.textContent === "Abrir orçamento").eventos.click();
  const nome = naTela((elemento) => elemento.atributos["aria-label"] === "Nome do projeto");
  nome.value = "Teste na demo";
  nome.eventos.input();
  naTela((elemento) => elemento.textContent === "Salvar orçamento").eventos.click();
  assert.match(controles.get("#status").textContent, /na demonstração/);
  assert.equal(disco.leituras, 0);
  assert.equal(disco.gravacoes, 0);
});

test("menu compacto fecha ao navegar e transfere o foco ao título", () => {
  const { document, controles, historico, naTela } = simularInterface();
  abrirAplicacao({ document, structuredClone, scrollTo() {} });
  const menu = controles.get("#menu-mobile");
  menu.eventos.click();
  assert.equal(menu.getAttribute("aria-expanded"), "true");
  historico.eventos.click();
  assert.equal(menu.getAttribute("aria-expanded"), "false");
  const titulo = naTela((elemento) => elemento.tag === "h1");
  assert.equal(titulo.textContent, "Orçamentos salvos");
  assert.equal(titulo.focado, true);
  menu.eventos.click();
  controles.get(".barra-app").eventos.keydown({ key: "Escape" });
  assert.equal(menu.getAttribute("aria-expanded"), "false");
  assert.equal(menu.focado, true);
});

test("a prévia inclui todo o escopo de uma proposta longa e só os dados públicos", () => {
  const { document } = simularInterface();
  const { p } = abrirAplicacao({ document, structuredClone, scrollTo() {} });
  for (const quantidade of [1, 100]) {
    const projeto = p.armazenamento.carregar().projeto;
    projeto.nome = "Projeto de teste";
    projeto.notas = "Informação interna";
    projeto.escopo = "Levantamento e detalhamento do jardim. ".repeat(quantidade);
    projeto.etapa = Array.from({ length: quantidade }, (_, i) => ["Entregável " + i, 1, "", "", true]);
    projeto.etapa.push(["Atividade interna", 1]);
    const item = { ...versao(projeto, 20), clienteNome: "Cliente fictício", acompanhamento: { emitida: "" } };
    const [, documento] = p.telaProposta({ demonstracao: true }, item);
    const conteudo = [...elementos(documento)];
    assert.equal(conteudo.filter((elemento) => elemento.tag === "li").length, quantidade);
    assert.ok(conteudo.some((elemento) => elemento.textContent === projeto.escopo));
    assert.ok(conteudo.every((elemento) => !/Informação interna|Atividade interna/.test(elemento.textContent)));
    assert.ok(conteudo.some((elemento) => elemento.textContent.includes("dados fictícios")));
  }
});
