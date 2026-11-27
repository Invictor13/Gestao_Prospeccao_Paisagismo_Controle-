Paisagismo.telasOrcamento = (() => {
  const ui = Paisagismo.ui;
  const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const SVG_NS = "http://www.w3.org/2000/svg";
  const CHAVE_GRUPOS_MEMORIA = "flora_orcamento_grupos_memoria";

  function emModoDemo() {
    return typeof window !== "undefined" && /(?:^\?|&)demo=1(?:&|$)/.test(window.location?.search ?? "");
  }

  function lerPreferenciaGrupos() {
    if (!emModoDemo()) {
      try {
        const bruto = window.localStorage?.getItem(CHAVE_GRUPOS_MEMORIA);
        if (bruto) return JSON.parse(bruto);
      } catch {}
    }
    return { operacional: false, tributos: false, margem: false };
  }

  function salvarPreferenciaGrupos(estado) {
    if (emModoDemo()) return;
    try {
      window.localStorage?.setItem(CHAVE_GRUPOS_MEMORIA, JSON.stringify(estado));
    } catch {}
  }

  function criarIconeSvg(viewBox, paths, classe = "") {
    if (typeof document.createElementNS !== "function") {
      return ui.elemento("span", undefined, classe);
    }
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    if (classe) svg.setAttribute("class", classe);
    for (const attrs of paths) {
      const p = document.createElementNS(SVG_NS, attrs.tag || "path");
      for (const [k, v] of Object.entries(attrs)) {
        if (k !== "tag") p.setAttribute(k, v);
      }
      svg.append(p);
    }
    return svg;
  }

  function iconeDespesa(nome) {
    const n = String(nome || "").toLowerCase();
    const base = { stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" };
    if (/doc|art|rrt|projeto|licen|laudo|taxa/.test(n)) {
      return criarIconeSvg("0 0 20 20", [
        { ...base, d: "M6 3.5h5.5L15 7v9.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1z" },
        { ...base, d: "M11.5 3.5V7H15M7.5 10.5h5M7.5 13.5h3.5" },
      ], "despesa-icone-svg");
    }
    if (/traslado|desloc|combust|gasolina|viagem|frete|km/.test(n)) {
      return criarIconeSvg("0 0 20 20", [
        { ...base, d: "M3.5 12.5h13v-2.2l-1.8-3.3H5.3L3.5 10.3v2.2z" },
        { ...base, tag: "circle", cx: "6.5", cy: "14", r: "1.5" },
        { ...base, tag: "circle", cx: "13.5", cy: "14", r: "1.5" },
      ], "despesa-icone-svg");
    }
    if (/hosped|hotel|pousada|estadia|diaria|diária/.test(n)) {
      return criarIconeSvg("0 0 20 20", [
        { ...base, d: "M3 15V7m0 5h14v3M17 15v-3.5a2 2 0 0 0-2-2h-4.5V12" },
        { ...base, tag: "circle", cx: "6.5", cy: "9.5", r: "1.3" },
      ], "despesa-icone-svg");
    }
    if (/aliment|refei|almo|jantar|lanche|cafe|café/.test(n)) {
      return criarIconeSvg("0 0 20 20", [
        { ...base, d: "M6.5 3.5v5a2 2 0 0 0 2 2h0v6M5 3.5v3.5m3-3.5v3.5M13.5 3.5v13m0-13a2.5 2.5 0 0 1 2 2.5v3h-2" },
      ], "despesa-icone-svg");
    }
    if (/segur|garantia|apólice|apolice/.test(n)) {
      return criarIconeSvg("0 0 20 20", [
        { ...base, d: "M10 3L4.5 5.2v4.6c0 3.6 2.3 6.2 5.5 7.2 3.2-1 5.5-3.6 5.5-7.2V5.2L10 3z" },
        { ...base, d: "M7.8 10.2l1.6 1.6 3-3.2" },
      ], "despesa-icone-svg");
    }
    if (/plot|impress|copia|cópia|prancha|papel/.test(n)) {
      return criarIconeSvg("0 0 20 20", [
        { ...base, d: "M6 7V3.5h8V7M5 13.5H3.8a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1h12.4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H15" },
        { ...base, d: "M6 11.5h8v5H6v-5z" },
      ], "despesa-icone-svg");
    }
    if (/comiss|parcer|indica|corretag/.test(n)) {
      return criarIconeSvg("0 0 20 20", [
        { ...base, d: "M5.5 14.5l9-9" },
        { ...base, tag: "circle", cx: "6.5", cy: "6.5", r: "1.6" },
        { ...base, tag: "circle", cx: "13.5", cy: "13.5", r: "1.6" },
      ], "despesa-icone-svg");
    }
    return criarIconeSvg("0 0 20 20", [
      { ...base, d: "M4 6.5h12M4 10h12M4 13.5h8" },
    ], "despesa-icone-svg");
  }

  function iconeEditarContextual(classe = "orcamento-acao-icone") {
    return criarIconeSvg("0 0 20 20", [
      { d: "M12.8 4.2l3 3L7.2 15.8H4.2v-3l8.6-8.6z", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" },
    ], classe);
  }

  function iconeConsultarContextual(classe = "orcamento-acao-icone") {
    return criarIconeSvg("0 0 20 20", [
      { d: "M12 4.5h3.5V8M8 15.5H4.5V12M15.5 4.5l-4.2 4.2M4.5 15.5l4.2-4.2", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" },
    ], classe);
  }

  let janelaContextualAtiva = null;

  function abrirJanelaContextual({
    titulo,
    tamanho = "padrao",
    origemEl = null,
    focoEl = null,
    modo = "edicao",
    montar,
    estaAlterado = () => false,
    aoConfirmar = () => {},
    aoCancelar = () => {},
  }) {
    if (janelaContextualAtiva) {
      janelaContextualAtiva.forcarFechar();
    }

    const dialog = ui.elemento("dialog", undefined, "flora-ct-dialog");
    dialog.dataset.tamanho = tamanho;
    dialog.setAttribute("aria-label", titulo);

    const card = ui.elemento("div", undefined, "flora-ct-card");
    const topo = ui.elemento("header", undefined, "flora-ct-topo");
    const h2 = ui.elemento("h2", titulo);
    const btnFechar = ui.elemento("button", "×", "flora-ct-fechar");
    btnFechar.type = "button";
    btnFechar.setAttribute("aria-label", "Fechar " + titulo);
    topo.append(h2, btnFechar);

    const corpo = ui.elemento("div", undefined, "flora-ct-corpo");
    let acoesExtras = [];

    const rodape = ui.elemento("footer", undefined, "flora-ct-rodape");
    const grupoDireita = ui.elemento("div", undefined, "flora-ct-rodape-acoes");

    let fechando = false;
    const reduzido = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    function limparDialogo(confirmado) {
      dialog.close?.();
      dialog.remove?.();
      if (origemEl?.dataset) delete origemEl.dataset.transformAtivo;
      if (janelaContextualAtiva?.dialog === dialog) janelaContextualAtiva = null;
      (focoEl || origemEl)?.focus?.();
      if (confirmado && origemEl?.classList) {
        origemEl.classList.remove("atualizado-pulso");
        void origemEl.offsetWidth;
        origemEl.classList.add("atualizado-pulso");
      }
    }

    function fechar(confirmado = false, viaEscapeOuBackdrop = false) {
      if (fechando) return;
      if (!confirmado && modo === "edicao" && viaEscapeOuBackdrop && estaAlterado()) {
        const descartar = typeof window !== "undefined" && typeof window.confirm === "function"
          ? window.confirm("Descartar as alterações não confirmadas?")
          : true;
        if (!descartar) return;
      }
      fechando = true;
      if (confirmado) aoConfirmar();
      else aoCancelar();

      const rectOrigem = origemEl?.getBoundingClientRect?.();
      const rectCard = card.getBoundingClientRect?.();
      if (!reduzido && rectOrigem?.width && rectCard?.width) {
        const dx = (rectOrigem.left + rectOrigem.width / 2) - (rectCard.left + rectCard.width / 2);
        const dy = (rectOrigem.top + rectOrigem.height / 2) - (rectCard.top + rectCard.height / 2);
        const sx = Math.max(0.22, rectOrigem.width / rectCard.width);
        const sy = Math.max(0.14, rectOrigem.height / rectCard.height);
        dialog.dataset.fechando = "true";
        delete dialog.dataset.visivel;
        card.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
        card.style.opacity = "0";
        window.setTimeout?.(() => limparDialogo(confirmado), 290);
      } else {
        limparDialogo(confirmado);
      }
    }

    const conteudo = montar({
      fecharConfirmando: () => fechar(true, false),
      fecharCancelando: () => fechar(false, false),
      adicionarAcaoEsquerda: (el) => acoesExtras.push(el),
    });
    corpo.append(conteudo);

    for (const el of acoesExtras) rodape.append(el);
    if (modo === "consulta") {
      const btnOk = ui.botao("Fechar", () => fechar(true, false));
      grupoDireita.append(btnOk);
    } else {
      const btnCancelar = ui.botao("Cancelar", () => fechar(false, false), true);
      const btnConfirmar = ui.botao("Confirmar", () => fechar(true, false));
      grupoDireita.append(btnCancelar, btnConfirmar);
    }
    rodape.append(grupoDireita);
    card.append(topo, corpo, rodape);
    dialog.append(card);

    btnFechar.addEventListener("click", () => fechar(false, true));
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault?.();
      fechar(false, true);
    });
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) fechar(false, true);
    });

    janelaContextualAtiva = {
      dialog,
      forcarFechar() {
        fechando = true;
        limparDialogo(false);
      },
    };

    if (origemEl?.dataset) origemEl.dataset.transformAtivo = "true";
    document.body?.append?.(dialog);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.open = true;

    const rectOrigem = origemEl?.getBoundingClientRect?.();
    const rectCard = card.getBoundingClientRect?.();
    if (!reduzido && rectOrigem?.width && rectCard?.width) {
      const dx = (rectOrigem.left + rectOrigem.width / 2) - (rectCard.left + rectCard.width / 2);
      const dy = (rectOrigem.top + rectOrigem.height / 2) - (rectCard.top + rectCard.height / 2);
      const sx = Math.max(0.22, rectOrigem.width / rectCard.width);
      const sy = Math.max(0.14, rectOrigem.height / rectCard.height);
      card.style.transition = "none";
      card.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      card.style.opacity = "0.72";
      void card.offsetWidth;
      card.style.transition = "";
      window.requestAnimationFrame?.(() => {
        dialog.dataset.visivel = "true";
        card.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
        card.style.opacity = "1";
      });
    } else {
      dialog.dataset.visivel = "true";
    }
    return dialog;
  }

  function decorarCardPreco(cartao) {
    if (typeof document.createElementNS !== "function") return;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 240 160");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "orcamento-preco-botanica");

    const ramo = document.createElementNS(SVG_NS, "g");
    ramo.setAttribute("class", "orcamento-preco-ramo");
    const elementos = [
      { tag: "path", d: "M12 132 C84 114, 152 128, 232 96", stroke: "#E4EBD9", "stroke-opacity": "0.08", "stroke-width": "1" },
      { tag: "path", d: "M172 166 C168 118, 178 66, 210 8", stroke: "#A9BD91", "stroke-opacity": "0.42", "stroke-width": "1.6", "stroke-linecap": "round" },
      { tag: "path", d: "M173 122 C136 120, 112 96, 122 70 C148 74, 168 96, 173 122 Z", fill: "#A9BD91", "fill-opacity": "0.22" },
      { tag: "path", d: "M177 96 C206 96, 230 76, 232 50 C206 52, 184 72, 177 96 Z", fill: "#E4EBD9", "fill-opacity": "0.18" },
      { tag: "path", d: "M186 64 C158 54, 148 30, 160 8 C180 22, 188 42, 186 64 Z", fill: "#748E79", "fill-opacity": "0.26" },
      { tag: "path", d: "M196 36 C218 28, 236 12, 236 -6 C216 0, 202 16, 196 36 Z", fill: "#E4EBD9", "fill-opacity": "0.16" },
    ];
    for (const attrs of elementos) {
      const el = document.createElementNS(SVG_NS, attrs.tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (k !== "tag") el.setAttribute(k, v);
      }
      ramo.append(el);
    }
    svg.append(ramo);
    cartao.prepend(svg);
  }

  function resumo(projeto, hora, ctx, opcoesResumo = {}) {
    const preco = ui.elemento("strong", undefined, "valor-financeiro");

    const gradeIndicadores = ui.elemento("div", undefined, "preco-indicadores-grade");
    const criarIndicadorPreco = (titulo, clicavel = false) => {
      const wrap = ui.elemento("div", undefined, "preco-indicador");
      const rot = ui.elemento("span", titulo, "preco-indicador-titulo");
      const val = clicavel
        ? ui.elemento("button", "—", "preco-indicador-valor preco-indicador-btn")
        : ui.elemento("strong", "—", "preco-indicador-valor");
      if (clicavel) val.type = "button";
      wrap.append(rot, val);
      return { wrap, val };
    };
    const indHoras = criarIndicadorPreco("Horas previstas", Boolean(ctx));
    const indHora = criarIndicadorPreco("Custo por hora", Boolean(ctx));
    const indResultado = criarIndicadorPreco("Resultado líquido", false);
    if (ctx) {
      indHoras.val.title = "Editar etapas do projeto";
      indHoras.val.addEventListener("click", () => ctx.navegar("etapas"));
      indHora.val.title = "Editar custos da operação";
      indHora.val.addEventListener("click", () => ctx.navegar("custos"));
    }
    gradeIndicadores.append(indHoras.wrap, indHora.wrap, indResultado.wrap);

    const aviso = ui.elemento("p",
      "Atenção: o desconto comercial reduziu o preço final abaixo do custo total do projeto.",
      "aviso-margem");
    aviso.hidden = true;

    let destaque;
    let nomeProjetoHeader = null;
    if (opcoesResumo.unificado && Paisagismo.botanica) {
      const bot = Paisagismo.botanica;
      destaque = bot.OrganicSurface("header", "botanical-luxury-hero orcamento-painel-hero");
      const ramo = bot.BotanicalBranch("luxury");
      destaque.append(bot.LeafShadow(), bot.OrganicPattern(), ramo);

      const conteudo = ui.elemento("div", undefined, "orcamento-hero-conteudo");
      const topo = ui.elemento("div", undefined, "orcamento-hero-topo");
      const tituloWrap = ui.elemento("div", undefined, "orcamento-hero-titulo-wrap");
      nomeProjetoHeader = ui.elemento("span", "", "orcamento-hero-nome-projeto");
      nomeProjetoHeader.hidden = true;
      tituloWrap.append(ui.elemento("h1", "Orçamento"), nomeProjetoHeader);
      topo.append(tituloWrap);

      const principal = ui.elemento("div", undefined, "orcamento-hero-principal");
      principal.append(preco, aviso);

      gradeIndicadores.classList.add("orcamento-hero-indicadores");
      const rodapeHero = ui.elemento("div", undefined, "orcamento-hero-rodape");
      rodapeHero.append(gradeIndicadores);
      if (opcoesResumo.acoes) rodapeHero.append(opcoesResumo.acoes);

      conteudo.append(topo, principal, rodapeHero);
      destaque.append(conteudo);
      bot.ativarAmbienteBotanico?.(destaque, ramo);
    } else {
      destaque = ui.cartao("Preço final do projeto", preco, gradeIndicadores, aviso);
      destaque.classList.add("preco", "orcamento-preco-luxury");
      decorarCardPreco(destaque);
    }

    const resumoRodape = ui.elemento("div", undefined, "memoria-resumo-rodape");
    const resCustoMin = ui.elemento("strong", "R$ 0,00");
    const resPrecoPrat = ui.elemento("strong", "R$ 0,00");
    const resLucroLiq = ui.elemento("strong", "R$ 0,00");
    const resPercLiq = ui.elemento("strong", "0%");
    const criarCelResumo = (rotulo, valorEl, extraClasse = "") => {
      const cel = ui.elemento("div", undefined, ("memoria-resumo-item " + extraClasse).trim());
      cel.append(ui.elemento("small", rotulo), valorEl);
      return cel;
    };
    resumoRodape.append(
      criarCelResumo("Custo mínimo", resCustoMin),
      criarCelResumo("Preço praticado", resPrecoPrat),
      criarCelResumo("Lucro líquido", resLucroLiq, "destaque"),
      criarCelResumo("Resultado", resPercLiq, "destaque"),
    );

    const definicoes = [
      ["hora", "Custo por hora", "operacional", "Custo mensal da operação dividido pelas horas mensais de referência."],
      ["horas", "Horas de trabalho", "operacional", "Soma de todas as horas estimadas nas etapas do projeto."],
      ["minimo", "Valor mínimo viável", "operacional", "Horas de trabalho multiplicadas pelo custo por hora da operação."],
      ["despesas", "Despesas diretas", "operacional", "Soma de custos extras exclusivos deste projeto (quantidade × valor unitário)."],
      ["base", "Valor sem impostos", "tributos", "Soma do valor mínimo viável com as despesas diretas."],
      ["impostos", "Impostos", "tributos", "Aplicados sobre o valor sem impostos conforme o percentual informado."],
      ["custo", "Custo total do projeto", "tributos", "Valor mínimo necessário para cobrir operação, despesas diretas e impostos."],
      ["lucro", "Lucro do projeto", "margem", "Calculado como acréscimo sobre o custo ou margem sobre o preço antes do desconto."],
      ["desconto", "Desconto comercial", "margem", "Redução aplicada sobre o preço calculado antes do desconto."],
      ["resultadoLiquido", "Resultado líquido", "margem", "Diferença entre o preço final praticado e o custo total do projeto."],
    ];

    const metaGrupos = {
      operacional: { titulo: "Base operacional", destaqueRotulo: "Mínimo viável" },
      tributos: { titulo: "Tributos e custo", destaqueRotulo: "Custo total" },
      margem: { titulo: "Margem e resultado", destaqueRotulo: "Lucro" },
    };

    const grupos = new Map();
    const linhasPorGrupo = { operacional: [], tributos: [], margem: [] };
    for (const [chave, rotulo, grupoChave, explicacao] of definicoes) {
      const linha = ui.linha(rotulo, undefined, "output", explicacao);
      linha.bloco.classList.add("memoria-ct-linha");
      if (chave === "custo" || chave === "resultadoLiquido") linha.bloco.classList.add("linha-total");
      if (["impostos", "lucro", "desconto"].includes(chave)) linha.bloco.classList.add("linha-" + chave);
      linhasPorGrupo[grupoChave].push(linha.bloco);
      grupos.set(chave, linha);
    }

    const botoesGrupos = {};
    for (const [chaveGrupo, info] of Object.entries(metaGrupos)) {
      const btnGrupo = ui.elemento("button", undefined, "grupo-memoria-btn");
      btnGrupo.type = "button";
      btnGrupo.setAttribute("aria-haspopup", "dialog");
      btnGrupo.setAttribute("aria-label", "Consultar detalhamento de " + info.titulo);

      const infoWrap = ui.elemento("div", undefined, "grupo-memoria-info");
      const indicador = ui.elemento("output", "R$ 0,00", "grupo-memoria-destaque");
      indicador.setAttribute("aria-label", info.destaqueRotulo);
      infoWrap.append(ui.elemento("span", info.titulo, "titulo-grupo-memoria"), indicador);

      const iconeConsulta = iconeConsultarContextual("orcamento-acao-icone");
      btnGrupo.append(infoWrap, iconeConsulta);

      btnGrupo.addEventListener("click", () => {
        abrirJanelaContextual({
          titulo: info.titulo,
          tamanho: "analitico",
          origemEl: btnGrupo,
          modo: "consulta",
          montar: () => {
            const listaLinhas = ui.elemento("div", undefined, "memoria-ct-lista");
            listaLinhas.append(...linhasPorGrupo[chaveGrupo]);
            return listaLinhas;
          },
        });
      });
      botoesGrupos[chaveGrupo] = { btnGrupo, indicador };
    }
    const campos = Array.from(grupos.entries()).map(([chave, linha]) => ({ chave, ...linha }));

    const barraComposicao = ui.elemento("div", undefined, "barra-composicao");
    const segCusto = ui.elemento("div", undefined, "segmento-composicao segmento-custo");
    const segImpostos = ui.elemento("div", undefined, "segmento-composicao segmento-impostos");
    const segLucro = ui.elemento("div", undefined, "segmento-composicao segmento-lucro");
    segCusto.tabIndex = 0;
    segImpostos.tabIndex = 0;
    segLucro.tabIndex = 0;
    barraComposicao.append(segCusto, segImpostos, segLucro);

    const avisoComposicao = ui.elemento("p", "", "composicao-estado-especial");
    avisoComposicao.hidden = true;

    const legenda = ui.elemento("div", undefined, "legenda-composicao");
    const criarItemLegenda = (cor, texto) => {
      const item = ui.elemento("span");
      const ponto = ui.elemento("i");
      ponto.setAttribute("style", "background:" + cor);
      const rotulo = ui.elemento("small", texto);
      item.append(ponto, rotulo);
      return { item, rotulo };
    };
    const legCusto = criarItemLegenda("var(--salvia)", "Base");
    const legImpostos = criarItemLegenda("var(--ocre)", "Impostos");
    const legLucro = criarItemLegenda("var(--floresta)", "Lucro");
    legenda.append(legCusto.item, legImpostos.item, legLucro.item);

    let inicializado = false;
    let precoNumericoAtual = null;
    let rafPreco = null;
    const reaisFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    function animarPrecoSuave(destinoNum) {
      const reduzido = typeof window !== "undefined"
        && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!inicializado || reduzido || typeof window === "undefined"
        || typeof window.requestAnimationFrame !== "function" || !Number.isFinite(precoNumericoAtual)) {
        precoNumericoAtual = destinoNum;
        ui.mostrarValor(preco, ui.brl(destinoNum));
        return;
      }
      if (Math.abs(destinoNum - precoNumericoAtual) < 0.005) {
        precoNumericoAtual = destinoNum;
        ui.mostrarValor(preco, ui.brl(destinoNum));
        return;
      }
      if (rafPreco) window.cancelAnimationFrame?.(rafPreco);
      const inicioNum = precoNumericoAtual;
      const inicioT = performance.now();
      const duracao = 290;
      const passo = (agora) => {
        const p = Math.min(1, (agora - inicioT) / duracao);
        const eased = 1 - Math.pow(1 - p, 3);
        const atual = inicioNum + (destinoNum - inicioNum) * eased;
        preco.textContent = reaisFmt.format(atual);
        if (p < 1) {
          rafPreco = window.requestAnimationFrame(passo);
        } else {
          precoNumericoAtual = destinoNum;
          ui.mostrarValor(preco, ui.brl(destinoNum));
          rafPreco = null;
        }
      };
      rafPreco = window.requestAnimationFrame(passo);
    }

    function pulsarIndicador(wrap, textoAnterior, novoTexto) {
      if (!inicializado || textoAnterior === novoTexto || !wrap?.classList) return;
      wrap.classList.remove("ind-atualizado");
      void wrap.offsetWidth;
      wrap.classList.add("ind-atualizado");
    }

    function exibir() {
      const valores = Paisagismo.calcular(projeto, hora);
      const anterior = preco.textContent;
      animarPrecoSuave(valores.preco);
      if (inicializado && anterior !== ui.brl(valores.preco)) {
        destaque.classList.remove("preco-atualizado");
        void destaque.offsetWidth;
        destaque.classList.add("preco-atualizado");
      }

      if (nomeProjetoHeader) {
        const nomeLimpo = String(projeto.nome || "").trim();
        nomeProjetoHeader.textContent = nomeLimpo ? "· " + nomeLimpo : "";
        nomeProjetoHeader.hidden = !nomeLimpo;
      }

      const lucroLiquido = valores.preco - valores.custo;
      const margemEfetiva = valores.preco > 0 ? (lucroLiquido / valores.preco) * 100 : 0;
      const abaixoDoCusto = valores.preco + 0.004 < valores.custo;
      const resultadoInvalido = !Number.isFinite(valores.preco) || valores.preco < 0 || lucroLiquido < -0.004;

      for (const { chave, resultado } of campos) {
        if (chave === "horas") resultado.value = ui.numero(valores.horas) + " h";
        else if (chave === "resultadoLiquido") resultado.value = ui.brl(lucroLiquido);
        else resultado.value = ui.brl(valores[chave]);
      }

      botoesGrupos.operacional.indicador.value = ui.brl(valores.minimo);
      botoesGrupos.tributos.indicador.value = ui.brl(valores.custo);
      botoesGrupos.margem.indicador.value = ui.brl(valores.lucro);

      aviso.hidden = !abaixoDoCusto;
      const novoHoras = ui.numero(valores.horas) + " h";
      const novoHora = ui.brl(valores.hora);
      const novoResultado = abaixoDoCusto
        ? ui.percentual(margemEfetiva)
        : ui.percentual(Math.max(0, margemEfetiva));

      pulsarIndicador(indHoras.wrap, indHoras.val.textContent, novoHoras);
      pulsarIndicador(indHora.wrap, indHora.val.textContent, novoHora);
      pulsarIndicador(indResultado.wrap, indResultado.val.textContent, novoResultado);

      indHoras.val.textContent = novoHoras;
      indHora.val.textContent = novoHora;
      indResultado.val.textContent = novoResultado;
      if (abaixoDoCusto) {
        indResultado.wrap.dataset.alerta = "true";
        indResultado.wrap.dataset.estado = "prejuizo";
      } else if (lucroLiquido <= 0.004) {
        delete indResultado.wrap.dataset.alerta;
        indResultado.wrap.dataset.estado = "neutro";
      } else {
        delete indResultado.wrap.dataset.alerta;
        indResultado.wrap.dataset.estado = "positivo";
      }
      inicializado = true;

      resCustoMin.textContent = ui.brl(valores.custo);
      resPrecoPrat.textContent = ui.brl(valores.preco);
      resLucroLiq.textContent = ui.brl(lucroLiquido);
      resPercLiq.textContent = abaixoDoCusto
        ? ui.percentual(margemEfetiva)
        : ui.percentual(Math.max(0, margemEfetiva));

      if (abaixoDoCusto) {
        resumoRodape.dataset.estado = "prejuizo";
      } else if (lucroLiquido <= 0.004) {
        resumoRodape.dataset.estado = "neutro";
      } else {
        resumoRodape.dataset.estado = "positivo";
      }

      if (resultadoInvalido || valores.preco <= 0) {
        barraComposicao.dataset.invalido = "true";
        segCusto.setAttribute("style", "width:0%");
        segImpostos.setAttribute("style", "width:0%");
        segLucro.setAttribute("style", "width:0%");
        avisoComposicao.hidden = false;
        avisoComposicao.textContent = valores.preco <= 0
          ? "Sem preço positivo para distribuir a composição percentual."
          : "Composição percentual indisponível: o resultado está abaixo do custo mínimo.";
        legCusto.rotulo.textContent = "Base " + ui.brl(valores.base);
        legImpostos.rotulo.textContent = "Impostos " + ui.brl(valores.impostos);
        legLucro.rotulo.textContent = "Resultado " + ui.brl(lucroLiquido);
      } else {
        delete barraComposicao.dataset.invalido;
        avisoComposicao.hidden = true;
        const somaPartes = Math.max(0.01, valores.base + valores.impostos + Math.max(0, lucroLiquido));
        const pBase = Math.round((valores.base / somaPartes) * 100);
        const pImp = Math.round((valores.impostos / somaPartes) * 100);
        const pLuc = Math.max(0, 100 - pBase - pImp);

        segCusto.setAttribute("style", "width:" + pBase + "%");
        segImpostos.setAttribute("style", "width:" + pImp + "%");
        segLucro.setAttribute("style", "width:" + pLuc + "%");

        const dicaBase = "Base operacional: " + ui.brl(valores.base) + " (" + pBase + "%)";
        const dicaImp = "Impostos: " + ui.brl(valores.impostos) + " (" + pImp + "%)";
        const dicaLuc = "Lucro líquido: " + ui.brl(Math.max(0, lucroLiquido)) + " (" + pLuc + "%)";
        segCusto.title = dicaBase;
        segCusto.setAttribute("aria-label", dicaBase);
        segImpostos.title = dicaImp;
        segImpostos.setAttribute("aria-label", dicaImp);
        segLucro.title = dicaLuc;
        segLucro.setAttribute("aria-label", dicaLuc);

        legCusto.rotulo.textContent = "Base " + pBase + "%";
        legImpostos.rotulo.textContent = "Impostos " + pImp + "%";
        legLucro.rotulo.textContent = "Lucro " + pLuc + "%";
      }

      opcoesResumo.aoAtualizar?.(valores);
    }

    exibir();

    const cabecalhoMemoria = ui.elemento("div", undefined, "memoria-cabecalho-linha");
    cabecalhoMemoria.append(ui.elemento("h2", "Memória de cálculo"));

    const gruposLista = ui.elemento("div", undefined, "memoria-grupos-lista");
    gruposLista.append(...Object.values(botoesGrupos).map((g) => g.btnGrupo));

    const memoria = ui.elemento("section", undefined, "cartao orcamento-memoria");
    memoria.append(
      cabecalhoMemoria,
      barraComposicao,
      avisoComposicao,
      legenda,
      gruposLista,
      resumoRodape,
    );

    return { exibir, destaque, memoria };
  }

  function criarModuloDespesas(projeto, atualizar, ctx, opcoesDespesas = {}) {
    const itens = projeto.despesas;
    const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const numeros = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
    const CATEGORIAS_PADRAO = [
      "Documentação", "Traslado", "Hospedagem", "Alimentação",
      "Seguro", "Plotagem", "Comissão", "Outros custos",
    ];
    const normalizarNome = (t) => String(t || "").trim().toLowerCase();

    /* Restaura Documentação e Traslado uma única vez caso tenham sido removidos acidentalmente */
    if (!emModoDemo() && typeof window !== "undefined") {
      try {
        const chaveRestauro = "flora_restaurou_doc_traslado_v1";
        if (!window.localStorage?.getItem(chaveRestauro)) {
          let alterou = false;
          if (!itens.some((i) => normalizarNome(i[0]) === "documentação")) {
            itens.unshift(["Documentação", 0, 1, ""]);
            alterou = true;
          }
          if (!itens.some((i) => normalizarNome(i[0]) === "traslado")) {
            const posDoc = itens.findIndex((i) => normalizarNome(i[0]) === "documentação");
            itens.splice(posDoc >= 0 ? posDoc + 1 : 0, 0, ["Traslado", 0, 1, ""]);
            alterou = true;
          }
          window.localStorage?.setItem(chaveRestauro, "1");
          if (alterou) atualizar();
        }
      } catch {}
    }

    const lista = ui.elemento("div", undefined, "lista-despesas-inteligentes");
    lista.setAttribute("role", "group");
    lista.setAttribute("aria-label", "Despesas diretas do projeto");

    const totalEl = ui.elemento("strong", "R$ 0,00", "despesas-total-cabecalho");
    const atualizarTotal = () => {
      const total = itens.reduce((soma, item) => soma + (Number(item[1]) || 0) * (Number(item[2] ?? 1) || 1), 0);
      totalEl.textContent = reais.format(total);
    };

    let removido = null;
    const desfazer = ui.botao("Desfazer remoção", () => {
      if (!removido) return;
      const { indice, item } = removido;
      itens.splice(indice, 0, item);
      if (atualizar()) {
        removido = null;
        desfazer.hidden = true;
        renderizar();
        lista.children[indice]?.querySelector("textarea")?.focus();
      } else {
        itens.splice(indice, 1);
      }
    }, true);
    desfazer.hidden = true;

    const restaurarPadrao = ui.botao("Restaurar padrão", () => {
      let inseridos = 0;
      for (const [idx, nomeCat] of CATEGORIAS_PADRAO.entries()) {
        if (!itens.some((i) => normalizarNome(i[0]) === normalizarNome(nomeCat))) {
          itens.splice(Math.min(idx, itens.length), 0, [nomeCat, 0, 1, ""]);
          inseridos += 1;
        }
      }
      if (inseridos > 0 && atualizar()) {
        atualizarBotaoRestaurar();
        renderizar();
        ctx?.status?.("Categorias padrão restauradas.");
      }
    }, true);
    restaurarPadrao.classList.add("despesas-btn-adicionar");

    function atualizarBotaoRestaurar() {
      const faltaPadrao = CATEGORIAS_PADRAO.some(
        (nomeCat) => !itens.some((i) => normalizarNome(i[0]) === normalizarNome(nomeCat)),
      );
      restaurarPadrao.hidden = !faltaPadrao;
    }
    atualizarBotaoRestaurar();

    const adicionar = ui.botao("+ Adicionar", () => {
      itens.push(["Novo item", 0, 1, ""]);
      if (atualizar()) {
        renderizar();
        const ultimo = lista.lastElementChild?.querySelector("textarea");
        ultimo?.focus();
        ultimo?.select();
      } else {
        itens.pop();
      }
    }, true);
    adicionar.classList.add("adicionar", "despesas-btn-adicionar");

    let itemAberto = null;

    function renderizar() {
      atualizarTotal();
      atualizarBotaoRestaurar();
      lista.replaceChildren(...itens.map((item, indice) => {
        const ehTraslado = /traslado|deslocamento|combust|gasolina|viagem/i.test(item[0] || "");
        const linha = ui.elemento("article", undefined, "despesa-linha");
        if (itemAberto === item) linha.dataset.aberta = "true";

        const atualizarEstadoLinha = () => {
          const subtotalNum = (Number(item[1]) || 0) * (Number(item[2] ?? 1) || 1);
          if (subtotalNum <= 0) linha.dataset.zerado = "true";
          else delete linha.dataset.zerado;
          atualizarTotal();
        };

        const editar = (coluna, valor) => {
          const anterior = item.slice();
          item[coluna] = valor;
          if (atualizar()) {
            atualizarEstadoLinha();
            if (subtotalOutput) subtotalOutput.value = reais.format((Number(item[1]) || 0) * (Number(item[2] ?? 1) || 1));
            return true;
          }
          item.splice(0, item.length, ...anterior);
          return false;
        };

        const principal = ui.elemento("div", undefined, "despesa-linha-principal");
        const iconeWrap = ui.elemento("span", undefined, "despesa-icone-wrap");
        iconeWrap.append(iconeDespesa(item[0]));

        const campoNome = ui.elemento("div", undefined, "nome-item despesa-nome-wrap");
        const nomeArea = ui.elemento("textarea");
        nomeArea.rows = 1;
        nomeArea.value = item[0] || "";
        nomeArea.setAttribute("aria-label", "Nome da despesa");
        campoNome.dataset.valor = nomeArea.value;
        nomeArea.addEventListener("input", () => {
          campoNome.dataset.valor = nomeArea.value;
          if (editar(0, nomeArea.value.trim() || "Despesa")) {
            iconeWrap.replaceChildren(iconeDespesa(nomeArea.value));
          }
        });
        campoNome.append(nomeArea);

        const valorWrap = ui.elemento("label", undefined, "despesa-valor-wrap");
        valorWrap.append(ui.elemento("span", "R$", "despesa-moeda"));
        const campoValor = ui.elemento("input");
        campoValor.type = "text";
        campoValor.inputMode = "decimal";
        campoValor.setAttribute("aria-label", "Valor unitário de " + (item[0] || "despesa"));
        campoValor.value = String(item[1] ?? 0).replace(".", ",");
        const aplicarValor = () => {
          const parsed = Number(String(campoValor.value).replace(",", ".").replace(/[^\d.-]/g, ""));
          if (!Number.isFinite(parsed) || parsed < 0 || !editar(1, parsed)) {
            campoValor.classList.add("campo-invalido");
            return;
          }
          campoValor.classList.remove("campo-invalido");
        };
        campoValor.addEventListener("focus", () => {
          campoValor.select?.();
        });
        campoValor.addEventListener("input", aplicarValor);
        campoValor.addEventListener("blur", () => {
          aplicarValor();
          campoValor.value = String(item[1] ?? 0).replace(".", ",");
        });
        valorWrap.append(campoValor);

        const btnExpandir = ui.elemento("button", undefined, "despesa-expandir-btn");
        btnExpandir.type = "button";
        btnExpandir.setAttribute("aria-haspopup", "dialog");
        btnExpandir.setAttribute("aria-label", (ehTraslado ? "Calculadora e detalhes de " : "Detalhes de ") + (item[0] || "despesa"));
        btnExpandir.title = ehTraslado ? "Abrir calculadora de traslado" : "Editar detalhes da despesa";
        btnExpandir.append(iconeEditarContextual("orcamento-acao-icone"));
        btnExpandir.addEventListener("click", () => {
          const snapshotItem = item.slice();
          const snapshotTraslado = ehTraslado ? structuredClone(projeto.traslado) : null;
          abrirJanelaContextual({
            titulo: item[0] || "Detalhes da despesa",
            tamanho: ehTraslado ? "padrao" : "compacto",
            origemEl: linha,
            focoEl: btnExpandir,
            modo: "edicao",
            estaAlterado: () => JSON.stringify(item) !== JSON.stringify(snapshotItem)
              || (snapshotTraslado && JSON.stringify(projeto.traslado) !== JSON.stringify(snapshotTraslado)),
            aoConfirmar: () => {
              atualizar();
              renderizar();
            },
            aoCancelar: () => {
              item.splice(0, item.length, ...snapshotItem);
              if (snapshotTraslado) Object.assign(projeto.traslado, snapshotTraslado);
              atualizar();
              renderizar();
            },
            montar: ({ adicionarAcaoEsquerda }) => {
              const btnRemModal = ui.botao("Remover item", () => {
                const confirmar = typeof window !== "undefined" && typeof window.confirm === "function"
                  ? window.confirm("Tem certeza que deseja remover a despesa \"" + (item[0] || "despesa") + "\"?")
                  : true;
                if (!confirmar) return;
                const removida = itens.splice(indice, 1)[0];
                if (atualizar()) {
                  removido = { indice, item: removida };
                  desfazer.hidden = false;
                  janelaContextualAtiva?.forcarFechar();
                  renderizar();
                } else {
                  itens.splice(indice, 0, removida);
                }
              }, true);
              btnRemModal.classList.add("flora-ct-btn-remover");
              adicionarAcaoEsquerda(btnRemModal);

              if (ehTraslado && ctx) {
                return criarPainelTrasladoContextual(ctx, projeto, item, atualizar, (v) => {
                  campoValor.value = String(v).replace(".", ",");
                  atualizarEstadoLinha();
                });
              }

              const wrap = ui.elemento("div", undefined, "pilha");
              const grade = ui.elemento("div", undefined, "formulario-comercial");
              const subtotalOut = ui.elemento("output", reais.format((Number(item[1]) || 0) * (Number(item[2] ?? 1) || 1)));
              const atualizarSub = () => {
                subtotalOut.value = reais.format((Number(item[1]) || 0) * (Number(item[2] ?? 1) || 1));
              };
              const campoNomeDet = ui.campo("Descrição", item[0] ?? "", (v) => {
                item[0] = String(v || "").trim() || "Despesa";
                atualizar();
                return true;
              });
              const campoValDet = ui.campo("Valor unitário (R$)", item[1] ?? 0, (v) => {
                item[1] = v;
                atualizar();
                atualizarSub();
                return true;
              }, 0);
              const campoQtd = ui.campo("Quantidade", item[2] ?? 1, (v) => {
                item[2] = v;
                atualizar();
                atualizarSub();
                return true;
              }, 0);
              const campoObs = ui.campo("Unidade / observação", item[3] ?? "", (v) => {
                item[3] = v;
                atualizar();
                return true;
              });
              const blocoSub = ui.elemento("div", undefined, "campo despesa-subtotal-campo");
              blocoSub.append(ui.elemento("span", "Subtotal do item"), subtotalOut);
              grade.append(campoNomeDet, campoValDet, campoQtd, campoObs);
              wrap.append(grade, blocoSub);
              return wrap;
            },
          });
        });

        const btnRemover = ui.elemento("button", "×", "despesa-remover-btn");
        btnRemover.type = "button";
        btnRemover.setAttribute("aria-label", "Remover " + (item[0] || "despesa"));
        btnRemover.title = "Remover despesa";
        btnRemover.addEventListener("click", () => {
          const nomeItem = item[0] || "despesa";
          const confirmar = typeof window !== "undefined" && typeof window.confirm === "function"
            ? window.confirm("Tem certeza que deseja remover a despesa \"" + nomeItem + "\"?")
            : true;
          if (!confirmar) return;
          const removida = itens.splice(indice, 1)[0];
          if (atualizar()) {
            removido = { indice, item: removida };
            if (itemAberto === removida) itemAberto = null;
            desfazer.hidden = false;
            renderizar();
          } else {
            itens.splice(indice, 0, removida);
          }
        });

        principal.append(iconeWrap, campoNome, valorWrap, btnExpandir, btnRemover);
        linha.append(principal);
        atualizarEstadoLinha();
        return linha;
      }));
    }

    renderizar();

    const cabecalho = ui.elemento("div", undefined, "despesas-cabecalho");
    const cabecalhoLinha = ui.elemento("div", undefined, "despesas-cabecalho-topo");
    cabecalhoLinha.append(ui.elemento("h2", "Despesas diretas"));
    const acoes = ui.elemento("div", undefined, "acoes despesas-acoes");
    acoes.append(desfazer, restaurarPadrao, adicionar);
    cabecalhoLinha.append(acoes);
    cabecalho.append(cabecalhoLinha, totalEl);

    const cartao = ui.elemento("section", undefined, "cartao orcamento-despesas");
    cartao.append(cabecalho, lista);
    return cartao;
  }

  function criarPainelTrasladoContextual(ctx, projeto, item, atualizar, aoAtualizarValor) {
    const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const numeros = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
    const wrap = ui.elemento("div", undefined, "pilha traslado-painel-conteudo");

    const editarItem = (coluna, valor) => {
      const anterior = item.slice();
      item[coluna] = valor;
      if (atualizar()) {
        subtotalOutput.value = reais.format((Number(item[1]) || 0) * (Number(item[2] ?? 1) || 1));
        return true;
      }
      item.splice(0, item.length, ...anterior);
      return false;
    };

    const gradeItem = ui.elemento("div", undefined, "despesa-detalhes-grade");
    const campoQtd = ui.campo("Quantidade", item[2] ?? 1, (v) => editarItem(2, v), 0);
    const campoObs = ui.campo("Unidade / observação", item[3] ?? "", (v) => editarItem(3, v));
    const subtotalOutput = ui.elemento("output", reais.format((Number(item[1]) || 0) * (Number(item[2] ?? 1) || 1)));
    const blocoSub = ui.elemento("div", undefined, "campo despesa-subtotal-campo");
    blocoSub.append(ui.elemento("span", "Subtotal do item"), subtotalOutput);
    gradeItem.append(campoQtd, campoObs, blocoSub);

    const padrao = ctx.dados.deslocamentoPadrao;
    const t = projeto.traslado;
    if (!t.combustivel && padrao.combustivel) t.combustivel = padrao.combustivel;
    if (!t.consumo && padrao.consumo) t.consumo = padrao.consumo;

    const calcBloco = ui.elemento("div", undefined, "traslado-ct-grade");
    const calcGrade = ui.elemento("div", undefined, "formulario-comercial");

    const caixaResultado = ui.elemento("div", undefined, "traslado-ct-resultado");
    const distEl = ui.elemento("strong", "0 km");
    const litrosEl = ui.elemento("strong", "0 L");
    const valorCalcEl = ui.elemento("strong", "R$ 0,00");
    const criarStat = (rotulo, el) => {
      const s = ui.elemento("div", undefined, "traslado-ct-stat");
      s.append(ui.elemento("small", rotulo), el);
      return s;
    };
    caixaResultado.append(
      criarStat("Distância total", distEl),
      criarStat("Consumo estimado", litrosEl),
      criarStat("Custo total calculado", valorCalcEl),
    );

    const atualizarResumoCalc = () => {
      const res = Paisagismo.comercial.calcularTraslado(t);
      distEl.textContent = numeros.format(res.distanciaTotal) + " km";
      litrosEl.textContent = numeros.format(Math.round(res.litros * 100) / 100) + " L";
      valorCalcEl.textContent = reais.format(res.valor);
      return res;
    };

    const chkIdaVolta = ui.elemento("input");
    chkIdaVolta.type = "checkbox";
    chkIdaVolta.checked = t.idaVolta !== false;
    chkIdaVolta.addEventListener("change", () => {
      t.idaVolta = chkIdaVolta.checked;
      atualizarResumoCalc();
    });

    const editarTraslado = (chave) => (v) => {
      t[chave] = v;
      atualizarResumoCalc();
      return true;
    };

    calcGrade.append(
      ui.campo("Distância do trecho (km)", t.km, editarTraslado("km"), 0),
      ui.campo("Quantidade de visitas", t.visitas, editarTraslado("visitas"), 1),
      ui.campo("Consumo do veículo (km/L)", t.consumo, editarTraslado("consumo"), 0.5),
      ui.campo("Preço do combustível (R$/L)", t.combustivel, editarTraslado("combustivel"), 0),
      ui.campo("Pedágio / estacionamento (R$)", t.pedagio, editarTraslado("pedagio"), 0),
      Paisagismo.telasComerciais.rotular("Considerar ida e volta (×2)", chkIdaVolta),
    );

    const aplicarCalc = ui.botao("Aplicar valor calculado", () => {
      const res = atualizarResumoCalc();
      padrao.consumo = t.consumo;
      padrao.combustivel = t.combustivel;
      const nota = numeros.format(res.distanciaTotal) + " km · " + reais.format(t.combustivel) + "/L";
      item[2] = 1;
      item[3] = nota;
      if (editarItem(1, res.valor)) {
        const inputQtd = campoQtd.querySelector("input");
        const inputObs = campoObs.querySelector("input");
        if (inputQtd) inputQtd.value = "1";
        if (inputObs) inputObs.value = nota;
        aoAtualizarValor?.(res.valor);
        ctx.status("Traslado calculado e aplicado: " + reais.format(res.valor) + ".");
      }
    });

    atualizarResumoCalc();
    calcBloco.append(calcGrade, caixaResultado, aplicarCalc);
    wrap.append(calcBloco, gradeItem);
    return wrap;
  }

  function criarControleParametro({ titulo, nomeCompleto, valorInicial, dica, tema, onEditar }) {
    const linha = ui.elemento("div", undefined, "parametro-linha");
    linha.dataset.tema = tema;

    const rotuloWrap = ui.elemento("div", undefined, "parametro-rotulo-wrap");
    const rotulo = ui.elemento("span", titulo, "parametro-titulo");
    if (nomeCompleto) rotulo.title = nomeCompleto;
    rotuloWrap.append(rotulo);
    if (dica) {
      const ajuda = ui.elemento("button", "?", "parametro-ajuda");
      ajuda.type = "button";
      ajuda.setAttribute("aria-label", (nomeCompleto ? nomeCompleto + ": " : "") + dica);
      ajuda.title = (nomeCompleto ? nomeCompleto + " — " : "") + dica;
      rotuloWrap.append(ajuda);
    }

    const inputWrap = ui.elemento("div", undefined, "parametro-input-wrap");
    const input = ui.elemento("input", undefined, "parametro-input");
    input.type = "text";
    input.inputMode = "decimal";
    input.value = String(valorInicial ?? 0).replace(".", ",");
    input.setAttribute("aria-label", (nomeCompleto || titulo) + " (%)");
    inputWrap.append(input, ui.elemento("span", "%", "parametro-sufixo"));

    let timerPulso = null;
    const pulsar = () => {
      linha.classList.remove("parametro-alterado");
      void linha.offsetWidth;
      linha.classList.add("parametro-alterado");
      if (timerPulso) window.clearTimeout?.(timerPulso);
      timerPulso = window.setTimeout?.(() => linha.classList.remove("parametro-alterado"), 420);
    };

    input.addEventListener("focus", () => {
      input.select?.();
    });
    input.addEventListener("input", () => {
      if (onEditar(input.value)) {
        input.classList.remove("campo-invalido");
        pulsar();
      } else {
        input.classList.add("campo-invalido");
      }
    });

    linha.append(rotuloWrap, inputWrap);
    return linha;
  }

  function criarFluxograma(ctx, item, aoAtualizar) {
    const regras = Paisagismo.comercial;
    const hoje = regras.hoje();
    const marcos = item.acompanhamento.marcos;
    const trilha = ui.elemento("div", undefined, "fluxograma-proposta");
    trilha.setAttribute("role", "group");
    trilha.setAttribute("aria-label", "Etapas comerciais da proposta");

    for (const [chave, rotulo] of regras.etapasFluxo) {
      const dataMarco = marcos[chave] || "";
      const concluido = Boolean(dataMarco);
      const passo = ui.elemento("button", undefined, "etapa-fluxo");
      passo.type = "button";
      passo.dataset.concluido = String(concluido);
      passo.setAttribute("aria-pressed", String(concluido));
      const ponto = ui.elemento("span", concluido ? "✓" : "", "ponto-fluxo");
      ponto.setAttribute("aria-hidden", "true");
      const info = ui.elemento("span", undefined, "texto-fluxo");
      info.append(
        ui.elemento("strong", rotulo),
        ui.elemento("small", dataMarco ? regras.formatarData(dataMarco) : "Pendente"),
      );
      passo.append(ponto, info);
      passo.addEventListener("click", () => {
        marcos[chave] = marcos[chave] ? "" : hoje;
        if (item.acompanhamento.situacao !== "Recusada") {
          if (marcos.fechamento || marcos.inicio) item.acompanhamento.situacao = "Aprovada";
          else if (marcos.entregue || marcos.reuniao) item.acompanhamento.situacao = "Enviada";
          else item.acompanhamento.situacao = "Planejada";
        }
        ctx.gravar(marcos[chave] ? rotulo + " marcada em " + regras.formatarData(hoje) + "." : rotulo + " desmarcada.");
        aoAtualizar();
      });
      trilha.append(passo);
    }
    return trilha;
  }

  function orcamento(ctx) {
    const projeto = ctx.dados.projeto;
    const hora = Paisagismo.custos(ctx.dados.operacao).hora;
    let atualizar = () => true;
    const nome = ui.campo("Nome do projeto", projeto.nome, ui.editar(projeto, "nome", () => atualizar()));
    const comparar = ui.botao("Comparar cenários", () => ctx.navegar("comparar"), true);
    comparar.hidden = !ctx.dados.salvos.length;

    const salvarWrap = ui.elemento("div", undefined, "orcamento-salvar-wrap");
    const indicadorPendente = ui.elemento("span", "Alterações pendentes", "orcamento-pendente-indicador");
    indicadorPendente.hidden = !ctx.versaoPendente;

    let timerSalvo = null;
    const salvar = ui.botao(ctx.versaoPendente ? "Gravar versão pendente" : "Salvar orçamento", () => {
      if (!ctx.versaoPendente && !projeto.nome.trim()) {
        ctx.status("Informe o nome do projeto para salvar o orçamento.");
        nome.lastElementChild.focus();
        return;
      }
      if (timerSalvo) window.clearTimeout?.(timerSalvo);
      salvar.dataset.salvando = "true";
      salvar.textContent = "Salvando...";
      const ok = ctx.salvarVersao(() => {
        const clienteNome = ctx.dados.clientes.find((cliente) => cliente.id === projeto.cliente)?.nome || "";
        projeto.idProjeto ||= Paisagismo.comercial.chaveProjeto(projeto);
        const versao = { data: new Date().toISOString(), hora, projeto: structuredClone(projeto),
          clienteNome, operacao: structuredClone(ctx.dados.operacao) };
        Paisagismo.comercial.preparar({ ...ctx.dados, salvos: [versao] });
        return versao;
      });
      delete salvar.dataset.salvando;
      if (ok) {
        indicadorPendente.hidden = true;
        salvar.dataset.salvo = "true";
        salvar.textContent = "✓ Orçamento salvo";
        timerSalvo = window.setTimeout?.(() => {
          delete salvar.dataset.salvo;
          salvar.textContent = "Salvar orçamento";
        }, 2200);
      } else {
        delete salvar.dataset.salvo;
        indicadorPendente.hidden = false;
        salvar.textContent = "Gravar versão pendente";
      }
      comparar.hidden = false;
    });
    salvar.classList.add("orcamento-salvar-destaque");
    salvar.setAttribute("aria-label", "Salvar orçamento");
    salvarWrap.append(indicadorPendente, salvar);

    const novo = ui.botao("Novo orçamento", ctx.novo, true);
    const acoes = ui.elemento("div", undefined, "acoes orcamento-acoes");
    acoes.append(novo, ui.botao("Usar modelo", () => ctx.navegar("modelos"), true), comparar, salvarWrap);

    const resultado = resumo(projeto, hora, ctx, {
      unificado: true,
      acoes,
      aoAtualizar: () => {
        if (!salvar.dataset.salvo) {
          indicadorPendente.hidden = false;
        }
      },
    });
    atualizar = ctx.aoAlterar(resultado.exibir);

    /* Coluna esquerda: Módulo 1 (Projeto) + Módulo 2 (Precificação) */
    const esquerda = ui.elemento("div", undefined, "pilha orcamento-coluna-esquerda");

    const cardProjeto = ui.elemento("section", undefined, "cartao orcamento-projeto");
    cardProjeto.append(ui.elemento("h2", "Projeto"), nome);

    const resumoProjeto = ui.elemento("div", undefined, "orcamento-projeto-resumo");
    const atualizarResumoProjeto = () => {
      const clienteAtual = ctx.dados.clientes.find((c) => c.id === projeto.cliente);
      const partes = [
        clienteAtual?.nome && ("Cliente: " + clienteAtual.nome),
        projeto.tipo,
        projeto.local,
        projeto.prazo && ("Prazo: " + projeto.prazo),
      ].filter(Boolean);
      resumoProjeto.replaceChildren(...partes.map((texto) => ui.elemento("span", texto, "orcamento-chip-resumo")));
      resumoProjeto.hidden = !partes.length;
    };
    atualizarResumoProjeto();

    const btnComercial = ui.elemento("button", undefined, "orcamento-comercial-toggle orcamento-comercial-btn");
    btnComercial.type = "button";
    btnComercial.setAttribute("aria-haspopup", "dialog");
    btnComercial.append(
      ui.elemento("span", "Cliente, escopo e condições"),
      iconeEditarContextual("orcamento-acao-icone"),
    );
    cardProjeto.append(resumoProjeto, btnComercial);

    /* Módulo 2: Parâmetros de precificação */
    const cardPrecificacao = ui.elemento("section", undefined, "cartao orcamento-precificacao");
    cardPrecificacao.append(ui.elemento("h2", "Parâmetros de precificação"));

    const margem = projeto.modoLucro === "margem";
    const blocoBase = ui.elemento("div", undefined, "base-lucro-bloco");
    blocoBase.append(ui.elemento("span", "Base do lucro", "base-lucro-rotulo"));

    const segmentado = ui.elemento("div", undefined, "base-lucro-segmentado");
    segmentado.setAttribute("role", "radiogroup");
    segmentado.setAttribute("aria-label", "Base do lucro");

    const opcoesBase = [
      ["acrescimo", "Sobre o custo", "Acréscimo sobre o custo — aplica o percentual diretamente sobre o custo total do projeto."],
      ["margem", "Sobre o preço", "Margem sobre o preço antes do desconto — garante que o lucro líquido represente esse percentual do preço final."],
    ];
    for (const [idModo, rotuloCurto, descricaoCompleta] of opcoesBase) {
      const btnModo = ui.elemento("button", rotuloCurto, "base-lucro-opcao");
      btnModo.type = "button";
      btnModo.setAttribute("role", "radio");
      btnModo.setAttribute("aria-checked", String(projeto.modoLucro === idModo));
      btnModo.title = descricaoCompleta;
      if (projeto.modoLucro === idModo) btnModo.dataset.ativo = "true";
      btnModo.addEventListener("click", () => {
        if (projeto.modoLucro === idModo) return;
        if (!ui.editar(projeto, "modoLucro", atualizar)(idModo)) return;
        ctx.navegar("orcamento");
      });
      segmentado.append(btnModo);
    }

    const explicacaoModo = ui.elemento("small", margem
      ? "Margem sobre o preço antes do desconto."
      : "Acréscimo sobre o custo total do projeto.",
    "base-lucro-explicacao");
    blocoBase.append(segmentado, explicacaoModo);

    const listaParametros = ui.elemento("div", undefined, "parametros-lista-financeira");
    listaParametros.append(
      criarControleParametro({
        titulo: "Impostos",
        nomeCompleto: "Impostos sobre o subtotal (%)",
        valorInicial: projeto.impostos,
        dica: "Percentual aplicado sobre o valor sem impostos (base operacional + despesas diretas).",
        tema: "impostos",
        onEditar: ui.editar(projeto, "impostos", atualizar),
      }),
      criarControleParametro({
        titulo: "Margem",
        nomeCompleto: margem ? "Margem antes do desconto (%)" : "Acréscimo de lucro sobre o custo (%)",
        valorInicial: projeto.lucro,
        dica: margem
          ? "Margem sobre o preço antes do desconto: garante que o lucro líquido represente esse percentual do preço final."
          : "Acréscimo de lucro sobre o custo: aplica esse percentual diretamente sobre o custo total do projeto.",
        tema: "margem",
        onEditar: ui.editar(projeto, "lucro", atualizar),
      }),
      criarControleParametro({
        titulo: "Desconto",
        nomeCompleto: "Desconto sobre o preço calculado (%)",
        valorInicial: projeto.desconto,
        dica: "Redução percentual aplicada sobre o preço calculado antes do desconto.",
        tema: "desconto",
        onEditar: ui.editar(projeto, "desconto", atualizar),
      }),
    );
    cardPrecificacao.append(blocoBase, listaParametros);
    esquerda.append(cardProjeto, cardPrecificacao);

    const direita = ui.elemento("div", undefined, "pilha resumo orcamento-coluna-direita");
    direita.append(resultado.memoria);

    const CAMPOS_COMERCIAIS = [
      "cliente", "tipo", "local", "area",
      "tituloProposta", "validade", "prazo", "escopo", "exclusoes", "pagamento", "notas",
    ];
    btnComercial.addEventListener("click", () => {
      const snapshot = {};
      for (const k of CAMPOS_COMERCIAIS) snapshot[k] = projeto[k];
      abrirJanelaContextual({
        titulo: "Cliente, escopo e condições",
        tamanho: "padrao",
        origemEl: btnComercial,
        modo: "edicao",
        estaAlterado: () => CAMPOS_COMERCIAIS.some((k) => projeto[k] !== snapshot[k]),
        aoConfirmar: () => {
          atualizar();
          atualizarResumoProjeto();
        },
        aoCancelar: () => {
          for (const k of CAMPOS_COMERCIAIS) projeto[k] = snapshot[k];
          atualizar();
          atualizarResumoProjeto();
        },
        montar: () => Paisagismo.telasComerciais.dadosProjeto(ctx, () => {
          const ok = atualizar();
          atualizarResumoProjeto();
          return ok;
        }),
      });
    });

    /* Coluna central: Despesas diretas */
    const centro = criarModuloDespesas(projeto, atualizar, ctx);

    const grade = ui.elemento("div", undefined, "grade grade-orcamento");
    grade.append(esquerda, centro, direita);
    return [resultado.destaque, grade];
  }

  function historico(ctx, opcoes) {
    const pagina = ui.elemento("div", undefined, "gestao-pagina historico-pagina");
    const comercial = Paisagismo.telasComerciais;
    const regras = Paisagismo.comercial;

    /* Versões vigentes por projeto (sem duplicar projetos com múltiplas revisões) */
    const vigentesMapa = new Map();
    const contagemPorProjeto = new Map();
    for (const item of ctx.dados.salvos) {
      const chave = regras.chaveProjeto(item.projeto);
      contagemPorProjeto.set(chave, (contagemPorProjeto.get(chave) || 0) + 1);
      const atual = vigentesMapa.get(chave);
      if (!atual || String(item.data) > String(atual.data)) vigentesMapa.set(chave, item);
    }
    const vigentes = [...vigentesMapa.values()];
    const valorTotalPropostas = vigentes.reduce((soma, item) => soma + Paisagismo.calcular(item.projeto, item.hora).preco, 0);
    const totalAprovadas = vigentes.filter((item) => item.acompanhamento.situacao === "Aprovada").length;

    const acoesHeader = [];
    if (ctx.dados.salvos.length >= 2) {
      acoesHeader.push(ui.botao("Comparar propostas", () => ctx.navegar("comparar"), true));
    }
    const btnNovo = ui.botao("Novo orçamento", () => ctx.navegar("orcamento"));
    btnNovo.classList.add("orcamento-salvar-destaque");
    acoesHeader.push(btnNovo);

    const header = ui.cabecalhoBotanico({
      titulo: "Orçamentos salvos",
      indicadores: [
        { rotulo: "Orçamentos", valor: String(vigentes.length) },
        { rotulo: "Valor total das propostas", valor: ui.brl(valorTotalPropostas) },
        { rotulo: "Propostas aprovadas", valor: String(totalAprovadas), estado: totalAprovadas > 0 ? "positivo" : "" },
      ],
      acoes: acoesHeader,
    });

    if (!ctx.dados.salvos.length) {
      const vazio = ui.estadoVazioBotanico({
        variante: "documentos",
        estado: "vazio",
        titulo: "Nenhum orçamento salvo",
        descricao: "Seus orçamentos e versões aparecerão aqui.",
        acaoPrincipal: ui.botao("Criar orçamento", () => ctx.navegar("orcamento")),
      });
      vazio.classList.add("historico-vazio");
      pagina.append(header, vazio);
      return [pagina];
    }

    /* Índice de versão cronológica por projeto */
    const indiceVersaoPorItem = new WeakMap();
    const porProjeto = new Map();
    for (const item of ctx.dados.salvos) {
      const chave = regras.chaveProjeto(item.projeto);
      if (!porProjeto.has(chave)) porProjeto.set(chave, []);
      porProjeto.get(chave).push(item);
    }
    for (const listaVersoes of porProjeto.values()) {
      const ordenadas = [...listaVersoes].sort((a, b) => String(a.data).localeCompare(String(b.data)));
      ordenadas.forEach((v, idx) => indiceVersaoPorItem.set(v, { numero: idx + 1, total: ordenadas.length }));
    }

    let filtroSit = typeof opcoes === "object" && opcoes?.situacao ? opcoes.situacao : "";
    let ordenacao = "recentes";
    const barraFiltros = ui.elemento("div", undefined, "gestao-barra-filtros");
    const buscaWrap = ui.elemento("div", undefined, "gestao-busca-wrap");
    const busca = ui.elemento("input", undefined, "gestao-busca-input");
    busca.type = "search";
    busca.placeholder = "Buscar por projeto ou cliente...";
    busca.setAttribute("aria-label", "Buscar por projeto ou cliente");
    buscaWrap.append(busca);

    const pillsWrap = ui.elemento("div", undefined, "gestao-filtros-grupo");
    const pillsSituacao = [["", "Todas"], ...regras.situacoes.map((s) => [s, s])].map(([val, rot]) => {
      const pill = ui.elemento("button", rot, "gestao-filtro-pill");
      pill.type = "button";
      pill.setAttribute("aria-pressed", String(val === filtroSit));
      pill.addEventListener("click", () => {
        filtroSit = val;
        for (const p of pillsSituacao) p.setAttribute("aria-pressed", String(p.dataset.valor === filtroSit));
        exibir();
      });
      pill.dataset.valor = val;
      return pill;
    });
    pillsWrap.append(...pillsSituacao);

    const selOrdem = comercial.seletor("Ordenar por", [
      ["recentes", "Mais recentes"],
      ["maior", "Maior valor"],
      ["menor", "Menor valor"],
      ["nome", "Projeto (A–Z)"],
    ], ordenacao, (v) => {
      ordenacao = v;
      exibir();
      return true;
    });
    selOrdem.className = "propostas-ordem-select";

    const controlesDir = ui.elemento("div", undefined, "gestao-filtros-grupo");
    controlesDir.append(pillsWrap, selOrdem);
    barraFiltros.append(buscaWrap, controlesDir);
    barraFiltros.hidden = ctx.dados.salvos.length < 2 && !filtroSit;

    const tabelaWrap = ui.elemento("section", undefined, "cartao propostas-tabela-card");
    const lista = ui.elemento("div", undefined, "propostas-tabela");
    let registros = [];
    const paginas = ui.paginador(8, (inicio, fim) => {
      if (!registros.length) {
        lista.replaceChildren(ui.estadoVazioBotanico({
          variante: "documentos",
          estado: "busca",
          titulo: "Nenhum orçamento encontrado",
          descricao: "Nenhum orçamento corresponde aos filtros aplicados.",
          acaoPrincipal: ui.botao("Limpar filtros", () => {
            busca.value = "";
            filtroSit = "";
            for (const p of pillsSituacao) p.setAttribute("aria-pressed", String(p.dataset.valor === ""));
            exibir();
          }, true),
        }));
        return;
      }
      const cab = ui.elemento("div", undefined, "propostas-tabela-topo");
      cab.append(
        ui.elemento("span", "Projeto"),
        ui.elemento("span", "Cliente"),
        ui.elemento("span", "Valor"),
        ui.elemento("span", "Atualização"),
        ui.elemento("span", "Status"),
        ui.elemento("span", "Versão"),
        ui.elemento("span", "Ações"),
      );
      lista.replaceChildren(cab, ...registros.slice(inicio, fim));
    }, "Páginas de orçamentos");

    const normalizar = (texto) => String(texto || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    function exibir() {
      const termo = normalizar(busca.value.trim());
      const filtrados = ctx.dados.salvos
        .map((item, indice) => ({
          item,
          indice,
          calculado: Paisagismo.calcular(item.projeto, item.hora),
        }))
        .filter(({ item }) => {
          if (termo && !normalizar(item.projeto.nome + " " + item.clienteNome).includes(termo)) return false;
          if (filtroSit && item.acompanhamento.situacao !== filtroSit) return false;
          return true;
        });

      filtrados.sort((a, b) => {
        if (ordenacao === "maior") return b.calculado.preco - a.calculado.preco;
        if (ordenacao === "menor") return a.calculado.preco - b.calculado.preco;
        if (ordenacao === "nome") return (a.item.projeto.nome || "").localeCompare(b.item.projeto.nome || "", "pt-BR");
        return String(b.item.data).localeCompare(String(a.item.data));
      });

      registros = filtrados.map(({ item, indice, calculado }) => {
        const linha = ui.elemento("div", undefined, "propostas-tabela-linha");
        const colProj = ui.elemento("div", undefined, "proposta-col-projeto");
        const btnNome = ui.elemento("button", item.projeto.nome || "Orçamento sem nome", "proposta-link-nome");
        btnNome.type = "button";
        btnNome.addEventListener("click", () => ctx.abrir(indice));
        colProj.append(btnNome);
        if (item === ctx.versaoPendente) {
          colProj.append(ui.elemento("span", "Gravação pendente", "proposta-pendente-tag"));
        }

        const colCli = ui.elemento("span", item.clienteNome || "Sem cliente", "proposta-col-cliente");
        const colVal = ui.elemento("strong", ui.brl(calculado.preco), "proposta-col-valor");
        const colData = ui.elemento("span", data.format(new Date(item.data)), "proposta-col-data");

        const colStatus = ui.elemento("div", undefined, "proposta-col-status");
        const etiqueta = ui.elemento("span", item.acompanhamento.situacao, "status-proposta");
        etiqueta.dataset.situacao = item.acompanhamento.situacao;
        colStatus.append(etiqueta);

        const verInfo = indiceVersaoPorItem.get(item) || { numero: 1, total: 1 };
        const colVer = ui.elemento("span", verInfo.total > 1 ? "v" + verInfo.numero + "/" + verInfo.total : "v" + verInfo.numero, "proposta-col-versao");

        const colAcoes = ui.elemento("div", undefined, "proposta-col-acoes");
        const btnAbrir = ui.botao("Abrir", () => ctx.abrir(indice), true);
        const menuAcoes = ui.menuContextual({
          rotulo: "Mais ações para " + (item.projeto.nome || "orçamento"),
          itens: [
            { rotulo: "Prévia da proposta", acao: () => ctx.navegar("proposta", item) },
            { rotulo: "Editar como rascunho", acao: () => ctx.duplicar(item, true) },
            { rotulo: "Duplicar proposta", acao: () => ctx.duplicar(item, false) },
            { rotulo: "Comparar propostas", acao: () => ctx.navegar("comparar", item) },
            item !== ctx.versaoPendente ? {
              rotulo: "Excluir",
              perigo: true,
              acao: () => {
                if (!window.confirm("Excluir o orçamento \"" + (item.projeto.nome || "sem nome") + "\"?")) return;
                const pos = ctx.dados.salvos.indexOf(item);
                if (pos < 0) return;
                ctx.dados.salvos.splice(pos, 1);
                ctx.gravar("Orçamento excluído.");
                ctx.navegar("historico");
              },
            } : null,
          ],
        });
        colAcoes.append(btnAbrir, menuAcoes);

        linha.append(colProj, colCli, colVal, colData, colStatus, colVer, colAcoes);
        return linha;
      });

      paginas.atualizar(registros.length, 0);
    }

    busca.addEventListener("input", exibir);
    exibir();
    tabelaWrap.append(barraFiltros, lista, paginas.controles);
    pagina.append(header, tabelaWrap);
    return [pagina];
  }

  function salvo(ctx, item) {
    const resultado = resumo(item.projeto, item.hora);
    const grade = ui.elemento("div", undefined, "grade");
    const detalhes = ui.elemento("div", undefined, "pilha");
    const listar = (itens, formatar) => itens.map(([nome, valor]) => ui.linha(nome, formatar(valor), "strong").bloco);
    const blocoFluxo = ui.cartao("Andamento comercial",
      criarFluxograma(ctx, item, () => ctx.navegar("salvo", item)));
    detalhes.append(
      blocoFluxo,
      ui.cartao("Etapas", ...listar(item.projeto.etapa, (valor) => ui.numero(valor) + " h")),
      ui.cartao("Despesas diretas", ...listar(item.projeto.despesas.map(([nome, valor, quantidade]) =>
        [nome, valor * (quantidade ?? 1)]), ui.brl)),
      ui.cartao("Percentuais aplicados",
        ui.linha("Impostos", ui.numero(item.projeto.impostos) + "%", "strong").bloco,
        ui.linha(item.projeto.modoLucro === "margem" ? "Margem antes do desconto" : "Acréscimo sobre o custo",
          ui.numero(item.projeto.lucro) + "%", "strong").bloco,
        ui.linha("Desconto", ui.numero(item.projeto.desconto) + "%", "strong").bloco),
      Paisagismo.telasComerciais.acompanhamento(ctx, item),
      Paisagismo.telasComerciais.realizadas(ctx, item),
    );
    const direita = ui.elemento("div", undefined, "pilha resumo");
    direita.append(resultado.destaque, resultado.memoria);
    grade.append(detalhes, direita);
    const chave = Paisagismo.comercial.chaveProjeto(item.projeto);
    const versoes = ctx.dados.salvos.flatMap((versao, indice) => {
      if (Paisagismo.comercial.chaveProjeto(versao.projeto) !== chave) return [];
      const linha = ui.elemento("div", undefined, "linha");
      linha.append(ui.elemento("span", data.format(new Date(versao.data))),
        versao === item ? ui.elemento("strong", "Versão aberta") : ui.botao("Abrir versão", () => ctx.abrir(indice), true));
      return [linha];
    });
    detalhes.append(ui.cartao("Versões deste projeto", ...versoes));
    if (item.operacao) {
      const custo = Paisagismo.custos(item.operacao);
      detalhes.append(ui.cartao("Base de custos da versão",
        ui.linha("Custo mensal equivalente", ui.brl(custo.mensal), "strong").bloco,
        ui.linha("Horas mensais de referência", ui.numero(item.operacao.horas) + " h", "strong").bloco));
    }
    const acoes = ui.elemento("div", undefined, "acoes");
    acoes.append(ui.botao("Voltar ao histórico", () => ctx.navegar("historico"), true),
      ui.botao("Comparar", () => ctx.navegar("comparar", item), true),
      ui.botao("Criar revisão", () => ctx.duplicar(item, true), true),
      ui.botao("Duplicar como novo projeto", () => ctx.duplicar(item), true));
    if (item !== ctx.versaoPendente) {
      const btnExcluirSalvo = ui.botao("Excluir orçamento", () => {
        if (!window.confirm("Excluir o orçamento \"" + (item.projeto.nome || "sem nome") + "\"?")) return;
        const pos = ctx.dados.salvos.indexOf(item);
        if (pos < 0) return;
        ctx.dados.salvos.splice(pos, 1);
        ctx.gravar("Orçamento excluído.");
        ctx.navegar("historico");
      }, true);
      acoes.append(btnExcluirSalvo);
    }
    acoes.append(ui.botao("Prévia da proposta", () => ctx.navegar("proposta", item)));
    const descricao = (item === ctx.versaoPendente ? "Gravação pendente · " : "Salvo em ")
      + data.format(new Date(item.data));
    return [ui.cabecalho(item.projeto.nome, descricao, acoes), grade];
  }

  return { orcamento, historico, salvo };
})();
