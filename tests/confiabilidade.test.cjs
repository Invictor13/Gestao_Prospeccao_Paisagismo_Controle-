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
    tag, textContent: "", value: "", children: [], eventos: {}, atributos: {}, dataset: {}, style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    append(...filhos) { this.children.push(...filhos); },
    replaceChildren(...filhos) { this.children = filhos; },
    addEventListener(nome, acao) { this.eventos[nome] = acao; },
    setAttribute(nome, valor) { this.atributos[nome] = valor; },
    getAttribute(nome) { return this.atributos[nome] ?? null; },
    removeAttribute(nome) { delete this.atributos[nome]; },
    querySelector(tag) { return [...elementos(this)].find((filho) => filho.tag === tag); },
    focus() { this.focado = true; },
    remove() { this.children = []; },
  };
}

function* elementos(raiz) {
  if (!raiz || typeof raiz !== "object") return;
  yield raiz;
  for (const filho of raiz.children || []) yield* elementos(filho);
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
  naTela((elemento) => elemento.textContent === "Novo orçamento").eventos.click();
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
  naTela((elemento) => elemento.textContent === "Novo orçamento").eventos.click();
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

test("paginação conserva a posição dos itens e volta após remover a última linha", () => {
  const { document } = simularInterface();
  const { p } = abrirAplicacao({ document, structuredClone, scrollTo() {} });
  const lista = Array.from({ length: 21 }, (_, indice) => "Item " + (indice + 1));
  let visiveis;
  const paginas = p.ui.paginador(8, (inicio, fim) => { visiveis = lista.slice(inicio, fim); }, "Itens");
  const [anterior, legenda, proxima] = paginas.controles.children;
  paginas.atualizar(lista.length);
  assert.equal(anterior.disabled, true);
  assert.deepEqual(visiveis, lista.slice(0, 8));
  proxima.eventos.click();
  assert.deepEqual(visiveis, lista.slice(8, 16));
  paginas.mostrar(lista.length, 20);
  assert.equal(paginas.paginaDe(20), 4);
  assert.equal(proxima.disabled, true);
  assert.match(legenda.textContent, /^3 de 3/);
  lista.splice(16);
  paginas.atualizar(lista.length);
  assert.match(legenda.textContent, /^2 de 2/);
  assert.deepEqual(visiveis, lista.slice(8));
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

test("painel calcula conversão, valor aprovado, filtro de período e evolução mensal", () => {
  const { p } = abrirAplicacao();
  const base = p.modelo().projeto;
  const aprovada = {
    ...versao({ ...base, idProjeto: "p1", nome: "Projeto Aprovado" }, 25),
    data: "2026-11-20T12:00:00.000Z",
    acompanhamento: { situacao: "Aprovada", proximo: "", acao: "" },
  };
  const atrasada = {
    ...versao({ ...base, idProjeto: "p2", nome: "Projeto Atrasado" }, 25),
    data: "2026-11-10T12:00:00.000Z",
    acompanhamento: { situacao: "Enviada", proximo: "2026-11-22", acao: "Ligar" },
  };
  const antiga = {
    ...versao({ ...base, idProjeto: "p3", nome: "Projeto Antigo" }, 25),
    data: "2026-06-05T12:00:00.000Z",
    acompanhamento: { situacao: "Planejada", proximo: "2026-11-26", acao: "Enviar" },
  };

  const tudo = p.resumirPainel([aprovada, atrasada, antiga], "2026-11-26", undefined, "tudo");
  assert.equal(tudo.totalPeriodo, 3);
  assert.equal(tudo.aprovadas, 1);
  assert.equal(tudo.abertas, 2);
  assert.equal(tudo.atrasados, 1);
  assert.equal(tudo.paraHoje, 1);
  assert.equal(tudo.aRetomar, 2);
  assert.equal(tudo.valorAprovado, p.calcular(aprovada.projeto, aprovada.hora).preco);
  assert.equal(Math.round(tudo.taxaConversao), 33);
  assert.equal(tudo.evolucao.length, 6);
  assert.equal(tudo.evolucao[5].mes, "2026-11");
  assert.equal(tudo.evolucao[5].quantidade, 2);

  const ultimos30 = p.resumirPainel([aprovada, atrasada, antiga], "2026-11-26", undefined, "30d");
  assert.equal(ultimos30.totalPeriodo, 2);
  assert.equal(ultimos30.abertas, 1);
  assert.equal(ultimos30.taxaConversao, 50);
});

test("painel exibe estados dinâmicos da agenda e navega para histórico filtrado por situação", () => {
  const { document, naTela } = simularInterface();
  abrirAplicacao({ document, structuredClone, location: { search: "?demo=1" }, scrollTo() {} });

  const agenda = naTela((el) => el.dataset?.estado === "hoje");
  assert.ok(agenda, "Agenda comercial deve refletir estado 'hoje' na demonstração");

  const btnEnviadas = naTela((el) => el.dataset?.situacao === "Enviada" && el.tag === "button");
  assert.ok(btnEnviadas, "Indicador 'Enviadas' deve estar presente");
  btnEnviadas.eventos.click();

  const titulo = naTela((el) => el.tag === "h1");
  assert.equal(titulo.textContent, "Orçamentos salvos");
  const filtroSituacao = naTela((el) => el.className?.includes("gestao-filtro-pill")
    && el.atributos?.["aria-pressed"] === "true" && el.textContent === "Enviada");
  assert.ok(filtroSituacao, "Histórico deve abrir pré-filtrado em 'Enviada'");
});

test("painel separa custo de referência de precificação e não gera saldo negativo falso", () => {
  const { p } = abrirAplicacao();
  const base = p.modelo();
  const painelSemPropostas = p.resumirPainel([], "2026-11-27", undefined, "tudo", base.operacao, []);
  assert.equal(painelSemPropostas.custoMensalAtual, 5495);
  assert.equal(painelSemPropostas.valorAprovado, 0);
  assert.ok(painelSemPropostas.evolucao.every((m) => m.aprovadoAcumulado === 0));
});


test("janelas contextuais de orçamento mantêm memória no lugar e aplicam traslado", () => {
  const { document, naTela } = simularInterface();
  abrirAplicacao({ document, structuredClone, location: { search: "?demo=1" }, scrollTo() {} });

  naTela((el) => el.textContent === "Novo orçamento").eventos.click();

  const btnBase = naTela((el) => el.atributos?.["aria-label"] === "Consultar detalhamento de Base operacional");
  assert.ok(btnBase, "Botão de consulta da Base operacional deve estar na memória de cálculo");
  btnBase.eventos.click();

  const dialogAnalitico = document.body.children.find((c) => c.className === "flora-ct-dialog");
  assert.ok(dialogAnalitico, "Janela contextual analítica deve abrir em dialog");
  assert.equal(dialogAnalitico.dataset.tamanho, "analitico");
  const buscarEm = (no, pred) => {
    if (!no) return null;
    if (pred(no)) return no;
    for (const f of no.children || []) {
      const achou = buscarEm(f, pred);
      if (achou) return achou;
    }
    return null;
  };
  const fecharBtn = buscarEm(dialogAnalitico, (el) => el.className === "flora-ct-fechar");
  fecharBtn?.eventos?.click();

  const btnTraslado = naTela((el) => el.atributos?.["aria-label"] === "Calculadora e detalhes de Traslado");
  assert.ok(btnTraslado, "Botão contextual da calculadora de Traslado deve estar presente");
  btnTraslado.eventos.click();

  const dialogTraslado = document.body.children.filter((c) => c.className === "flora-ct-dialog").at(-1);
  assert.ok(dialogTraslado, "Janela contextual da calculadora de Traslado deve abrir");
  assert.ok(buscarEm(dialogTraslado, (el) => el.textContent === "Distância total"),
    "Calculadora de Traslado deve exibir Distância total");
});


test("simulador de capacidade em custos não altera dados oficiais antes da confirmação", () => {
  const { document, historico, naTela } = simularInterface();
  historico.dataset.tela = "custos";
  const { p } = abrirAplicacao({ document, structuredClone, crypto: globalThis.crypto, location: { search: "?demo=1" }, scrollTo() {} });

  historico.eventos.click();

  const btnCap = naTela((el) => el.className?.includes("preco-indicador-btn"));
  assert.ok(btnCap, "Indicador de capacidade mensal no cabeçalho deve ser clicável");
  btnCap.eventos.click();

  const noCorpo = (filtrar) => [...elementos(document.body)].find(filtrar);
  const inputSim = noCorpo((el) => el.atributos?.["aria-label"] === "Horas mensais simuladas");
  assert.ok(inputSim, "Campo de simulação de horas mensais deve existir no modal");
  inputSim.value = "120";
  inputSim.eventos.input();

  const simOut = noCorpo((el) => el.className === "capacidade-hora-simulada");
  assert.ok(simOut.textContent.includes("45,79"), "Simulador deve exibir R$ 45,79/h para 120 h");

  const capOficial = naTela((el) => el.textContent === "180 h");
  assert.ok(capOficial, "Capacidade oficial no cabeçalho deve permanecer 180 h antes de aplicar");

  const btnAplicar = noCorpo((el) => el.tag === "button" && el.textContent === "Aplicar referência");
  assert.equal(btnAplicar.disabled, false, "Aplicar referência deve estar habilitado para valor válido");
  btnAplicar.eventos.click();

  assert.ok(naTela((el) => el.textContent === "120 h"), "Após confirmar, capacidade oficial deve atualizar para 120 h");
  assert.ok(p);
});

test("clientes em modal não cria registro vazio ao abrir e salva somente após confirmar", () => {
  const { document, historico, naTela } = simularInterface();
  historico.dataset.tela = "clientes";
  const { p } = abrirAplicacao({ document, structuredClone, crypto: globalThis.crypto, location: { search: "?demo=1" }, scrollTo() {} });

  historico.eventos.click();
  const qtdAntes = [...elementos(document.body)].filter((el) => el.className?.includes("cliente-card")).length;

  naTela((el) => el.tag === "button" && el.textContent === "Cadastrar cliente").eventos.click();
  const noCorpo = (filtrar) => [...elementos(document.body)].find(filtrar);
  const btnSalvar = noCorpo((el) => el.tag === "button" && el.textContent === "Salvar");
  assert.equal(btnSalvar.disabled, true, "Salvar deve ficar desabilitado sem nome");

  const btnCancelar = noCorpo((el) => el.tag === "button" && el.textContent === "Cancelar");
  btnCancelar.eventos.click();
  const qtdDepoisCancelar = [...elementos(document.body)].filter((el) => el.className?.includes("cliente-card")).length;
  assert.equal(qtdDepoisCancelar, qtdAntes, "Cancelar não deve criar cliente vazio");

  naTela((el) => el.tag === "button" && el.textContent === "Cadastrar cliente").eventos.click();
  const inpNome = noCorpo((el) => el.tag === "input" && el.atributos?.["aria-label"] === "Nome ou empresa *");
  inpNome.value = "Residência Oliveira";
  inpNome.eventos.input();
  const btnSalvar2 = noCorpo((el) => el.tag === "button" && el.textContent === "Salvar");
  assert.equal(btnSalvar2.disabled, false, "Salvar deve habilitar após preencher o nome");
  btnSalvar2.eventos.click();
  assert.ok(naTela((el) => el.textContent === "Residência Oliveira"), "Novo cliente deve aparecer na carteira");
  assert.ok(p);
});

test("editor de modelos recalcula duração total em tempo real e preserva original ao cancelar", () => {
  const { document, historico, naTela } = simularInterface();
  historico.dataset.tela = "modelos";
  abrirAplicacao({ document, structuredClone, location: { search: "?demo=1" }, scrollTo() {} });

  historico.eventos.click();
  naTela((el) => el.tag === "button" && el.textContent === "Editar").eventos.click();

  const inpHoras = naTela((el) => el.className === "modelo-etapa-horas");
  assert.ok(inpHoras, "Campo de horas da atividade deve existir no editor");
  inpHoras.value = "10";
  inpHoras.eventos.input();

  assert.ok(naTela((el) => el.textContent === "· Alterações não salvas"), "Indicador deve sinalizar alterações não salvas");
  naTela((el) => el.tag === "button" && el.textContent === "Salvar modelo").eventos.click();
  assert.ok(naTela((el) => el.textContent === "· Salvo"), "Após salvar, indicador deve exibir estado Salvo");
});
