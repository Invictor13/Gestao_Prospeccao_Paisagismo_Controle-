Paisagismo.ui = (() => {
  const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const numeros = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 });
  const percentuais = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  const animacoesValor = new WeakMap();

  function elemento(tag, texto, classe) {
    const item = document.createElement(tag);
    if (texto !== undefined) item.textContent = texto;
    if (classe) item.className = classe;
    return item;
  }

  function botao(texto, acao, secundario = false) {
    const item = elemento("button", texto, secundario ? "botao secundario" : "botao");
    item.type = "button";
    item.addEventListener("click", acao);
    return item;
  }

  function cabecalho(titulo, descricao, acoes) {
    const bloco = elemento("header", undefined, "cabecalho");
    const texto = elemento("div");
    texto.append(elemento("h1", titulo), elemento("p", descricao));
    bloco.append(texto);
    if (acoes) bloco.append(acoes);
    return bloco;
  }

  function cartao(titulo, ...filhos) {
    const bloco = elemento("section", undefined, "cartao");
    bloco.append(elemento("h2", titulo), ...filhos);
    return bloco;
  }

  function dica(rotulo, explicacao) {
    const icone = elemento("span", "?", "dica-formula");
    icone.title = explicacao;
    icone.setAttribute("aria-label", rotulo + ": " + explicacao);
    return icone;
  }

  function linha(rotulo, valor, tag = "output", explicacao = "") {
    const bloco = elemento("div", undefined, "linha");
    const resultado = elemento(tag, valor);
    const texto = elemento("span", rotulo);
    if (explicacao) texto.append(dica(rotulo, explicacao));
    bloco.append(texto, resultado);
    return { bloco, resultado };
  }

  function mostrarValor(campo, valor) {
    if (campo.textContent === valor) return;
    if (campo.textContent && window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches) {
      animacoesValor.get(campo)?.cancel();
      const animacao = campo.animate?.([
        { opacity: .58, transform: "translateY(2px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      if (animacao) animacoesValor.set(campo, animacao);
    }
    campo.textContent = valor;
  }

  function animarNumero(campo, textoFinal) {
    campo.textContent = textoFinal;
    if (window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches) {
      campo.animate?.([
        { opacity: 0, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    }
  }

  function ilustrarEstadoVazio(variante = "documentos", estado = "vazio") {
    if (typeof document.createElementNS !== "function") return elemento("span", undefined, "flora-vazio-ilustracao");
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 120 96");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "flora-vazio-svg");
    const s = { stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" };
    const add = (tag, attrs) => {
      const n = document.createElementNS(SVG_NS, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      svg.append(n);
    };
    if (estado === "busca") {
      add("circle", { ...s, cx: "54", cy: "44", r: "20", fill: "currentColor", "fill-opacity": "0.06" });
      add("path", { ...s, d: "M69 59 L86 76" });
      add("path", { ...s, d: "M46 46 C48 36, 56 34, 62 38 C59 46, 52 48, 46 46 Z", "stroke-opacity": "0.6" });
    } else if (estado === "erro") {
      add("circle", { ...s, cx: "60", cy: "48", r: "24", fill: "currentColor", "fill-opacity": "0.06" });
      add("path", { ...s, d: "M60 36v15M60 58h.01" });
    } else if (estado === "carregando") {
      add("circle", { ...s, cx: "60", cy: "48", r: "20", "stroke-dasharray": "42 20", "stroke-opacity": "0.7" });
      add("path", { ...s, d: "M54 52 C56 42, 62 40, 67 43 C65 50, 59 53, 54 52 Z", fill: "currentColor", "fill-opacity": "0.1" });
    } else if (variante === "clientes") {
      add("circle", { ...s, cx: "48", cy: "36", r: "11", fill: "currentColor", "fill-opacity": "0.08" });
      add("path", { ...s, d: "M28 70c0-11 9-19 20-19s20 8 20 19" });
      add("path", { ...s, d: "M74 68 C74 52, 84 40, 96 34", "stroke-opacity": "0.55" });
      add("path", { ...s, d: "M78 52 C84 46, 92 46, 96 52 C90 56, 82 56, 78 52 Z", fill: "currentColor", "fill-opacity": "0.1" });
    } else if (variante === "calendario" || variante === "retornos") {
      add("rect", { ...s, x: "26", y: "24", width: "68", height: "54", rx: "10", fill: "currentColor", "fill-opacity": "0.06" });
      add("path", { ...s, d: "M42 18v12M78 18v12M26 39h68" });
      add("path", { ...s, d: "M52 60 C55 50, 64 47, 70 52 C66 60, 58 63, 52 60 Z", fill: "currentColor", "fill-opacity": "0.12" });
    } else if (variante === "modelos") {
      add("path", { ...s, d: "M60 76V30" });
      add("path", { ...s, d: "M60 58 C44 56, 36 44, 40 30 C52 32, 60 42, 60 58 Z", fill: "currentColor", "fill-opacity": "0.1" });
      add("path", { ...s, d: "M60 46 C76 44, 84 32, 80 18 C68 20, 60 30, 60 46 Z", fill: "currentColor", "fill-opacity": "0.08" });
      add("path", { ...s, d: "M34 76h52", "stroke-opacity": "0.45" });
    } else {
      add("path", { ...s, d: "M36 20h34l14 14v44a4 4 0 0 1-4 4H36a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z", fill: "currentColor", "fill-opacity": "0.06" });
      add("path", { ...s, d: "M70 20v14h14M44 48h26M44 58h18", "stroke-opacity": "0.55" });
      add("path", { ...s, d: "M44 38 C48 31, 56 30, 60 34 C56 39, 49 40, 44 38 Z", fill: "currentColor", "fill-opacity": "0.14" });
    }
    return svg;
  }

  function estadoVazioBotanico({
    variante = "documentos",
    estado = "vazio",
    titulo,
    descricao = "",
    acaoPrincipal = null,
    acaoSecundaria = null,
    tagTitulo = "h2",
  }) {
    const bloco = elemento("section", undefined, "cartao estado-vazio flora-estado-vazio");
    bloco.dataset.variante = variante;
    bloco.dataset.estado = estado;
    const arte = elemento("div", undefined, "flora-vazio-arte");
    arte.append(ilustrarEstadoVazio(variante, estado));
    bloco.append(arte, elemento(tagTitulo, titulo, "flora-vazio-titulo"));
    if (descricao) bloco.append(elemento("p", descricao, "flora-vazio-desc"));
    if (acaoPrincipal || acaoSecundaria) {
      const acoes = elemento("div", undefined, "acoes flora-vazio-acoes");
      if (acaoPrincipal) acoes.append(acaoPrincipal);
      if (acaoSecundaria) acoes.append(acaoSecundaria);
      bloco.append(acoes);
    }
    return bloco;
  }

  function estadoVazio(titulo, descricao, acao = null, icone = "historico") {
    const mapa = { historico: "documentos", clientes: "clientes", retornos: "calendario", modelos: "modelos" };
    return estadoVazioBotanico({
      variante: mapa[icone] || icone || "documentos",
      estado: "vazio",
      titulo,
      descricao,
      acaoPrincipal: acao,
      tagTitulo: "h1",
    });
  }

  function cabecalhoBotanico({ titulo, indicadores = [], acoes = [], navegacaoTopo = null, destaque = "" }) {
    const bot = Paisagismo.botanica;
    const header = bot
      ? bot.OrganicSurface("header", "botanical-luxury-hero orcamento-painel-hero gestao-painel-hero")
      : elemento("header", undefined, "botanical-luxury-hero orcamento-painel-hero gestao-painel-hero");
    if (bot) {
      const ramo = bot.BotanicalBranch("luxury");
      header.append(bot.LeafShadow(), bot.OrganicPattern(), ramo);
      bot.ativarAmbienteBotanico?.(header, ramo);
    }
    const conteudo = elemento("div", undefined, "orcamento-hero-conteudo gestao-hero-conteudo");
    const topo = elemento("div", undefined, "orcamento-hero-topo");
    const tituloWrap = elemento("div", undefined, "orcamento-hero-titulo-wrap");
    if (navegacaoTopo) tituloWrap.append(navegacaoTopo);
    tituloWrap.append(elemento("h1", titulo));
    if (destaque) tituloWrap.append(elemento("span", destaque, "etapas-hero-subtitulo-inline"));
    topo.append(tituloWrap);

    const rodape = elemento("div", undefined, "orcamento-hero-rodape gestao-hero-rodape");
    const indWrap = elemento("div", undefined, "orcamento-hero-indicadores gestao-hero-indicadores");
    for (const ind of indicadores) {
      const w = elemento("div", undefined, "preco-indicador");
      if (ind.estado) w.dataset.estado = ind.estado;
      const val = elemento("strong", ind.valor, "preco-indicador-valor");
      w.append(elemento("span", ind.rotulo, "preco-indicador-titulo"), val);
      indWrap.append(w);
    }
    const acoesWrap = elemento("div", undefined, "acoes orcamento-acoes");
    acoesWrap.append(...acoes);
    if (indicadores.length) rodape.append(indWrap, acoesWrap);
    else topo.append(acoesWrap);

    conteudo.append(topo);
    if (indicadores.length) conteudo.append(rodape);
    header.append(conteudo);
    return header;
  }

  function menuContextual({ rotulo = "Mais ações", itens = [] }) {
    const wrap = elemento("div", undefined, "flora-menu-ctx");
    const gatilho = elemento("button", "⋯", "flora-menu-ctx-btn");
    gatilho.type = "button";
    gatilho.setAttribute("aria-haspopup", "menu");
    gatilho.setAttribute("aria-expanded", "false");
    gatilho.setAttribute("aria-label", rotulo);
    gatilho.title = rotulo;

    const lista = elemento("div", undefined, "flora-menu-ctx-lista");
    lista.setAttribute("role", "menu");
    lista.hidden = true;

    function fechar(focarGatilho = false) {
      if (lista.hidden) return;
      lista.hidden = true;
      gatilho.setAttribute("aria-expanded", "false");
      if (focarGatilho) gatilho.focus?.();
    }

    function abrir() {
      for (const outro of document.querySelectorAll?.(".flora-menu-ctx-lista:not([hidden])") || []) {
        if (outro !== lista) {
          outro.hidden = true;
          outro.previousElementSibling?.setAttribute?.("aria-expanded", "false");
        }
      }
      lista.hidden = false;
      gatilho.setAttribute("aria-expanded", "true");
      lista.querySelector?.("button:not([disabled])")?.focus?.();
    }

    for (const item of itens) {
      if (!item) continue;
      const btn = elemento("button", item.rotulo, "flora-menu-ctx-item" + (item.perigo ? " perigo" : ""));
      btn.type = "button";
      btn.setAttribute("role", "menuitem");
      if (item.desabilitado) btn.disabled = true;
      btn.addEventListener("click", (e) => {
        e.stopPropagation?.();
        fechar(false);
        item.acao?.();
      });
      lista.append(btn);
    }

    gatilho.addEventListener("click", (e) => {
      e.stopPropagation?.();
      if (lista.hidden) abrir();
      else fechar(false);
    });
    lista.addEventListener("keydown", (e) => {
      const botoes = [...(lista.querySelectorAll?.("button:not([disabled])") || [])];
      const idx = botoes.indexOf(document.activeElement);
      if (e.key === "Escape") {
        e.preventDefault?.();
        fechar(true);
      } else if (e.key === "ArrowDown" && botoes.length) {
        e.preventDefault?.();
        botoes[(idx + 1) % botoes.length]?.focus();
      } else if (e.key === "ArrowUp" && botoes.length) {
        e.preventDefault?.();
        botoes[(idx - 1 + botoes.length) % botoes.length]?.focus();
      }
    });
    if (typeof document.addEventListener === "function") {
      document.addEventListener("click", (e) => {
        if (!lista.hidden && !wrap.contains?.(e.target)) fechar(false);
      });
    }

    wrap.append(gatilho, lista);
    return wrap;
  }

  let modalContextualAtivo = null;
  function abrirModalContextual({
    titulo,
    subtitulo = "",
    tamanho = "padrao",
    origemEl = null,
    modo = "edicao",
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    montar,
    estaAlterado = () => false,
    aoConfirmar = () => {},
    aoCancelar = () => {},
  }) {
    if (modalContextualAtivo) modalContextualAtivo.forcarFechar();

    const dialog = elemento("dialog", undefined, "flora-ct-dialog");
    dialog.dataset.tamanho = tamanho;
    dialog.setAttribute("aria-label", titulo);

    const card = elemento("div", undefined, "flora-ct-card");
    const topo = elemento("header", undefined, "flora-ct-topo");
    const topoTexto = elemento("div", undefined, "etapas-modal-topo-texto");
    topoTexto.append(elemento("h2", titulo));
    if (subtitulo) topoTexto.append(elemento("small", subtitulo, "etapas-modal-subtitulo"));
    const btnFechar = elemento("button", "×", "flora-ct-fechar");
    btnFechar.type = "button";
    btnFechar.setAttribute("aria-label", "Fechar " + titulo);
    topo.append(topoTexto, btnFechar);

    const corpo = elemento("div", undefined, "flora-ct-corpo");
    const rodape = elemento("footer", undefined, "flora-ct-rodape");
    const grupoDireita = elemento("div", undefined, "flora-ct-rodape-acoes");
    const acoesExtras = [];

    let fechando = false;
    const reduzido = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    function limparDialogo(confirmado) {
      dialog.close?.();
      dialog.remove?.();
      if (origemEl?.dataset) delete origemEl.dataset.transformAtivo;
      if (modalContextualAtivo?.dialog === dialog) modalContextualAtivo = null;
      origemEl?.focus?.();
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

      if (!reduzido && typeof window?.setTimeout === "function") {
        dialog.dataset.fechando = "true";
        delete dialog.dataset.visivel;
        if (card.style) {
          card.style.transform = "scale(0.97)";
          card.style.opacity = "0";
        }
        window.setTimeout(() => limparDialogo(confirmado), 210);
      } else {
        limparDialogo(confirmado);
      }
    }

    const btnConfirmar = modo === "consulta"
      ? botao("Fechar", () => fechar(true, false))
      : botao(textoConfirmar, () => fechar(true, false));

    const conteudo = montar({
      fecharConfirmando: () => fechar(true, false),
      fecharCancelando: () => fechar(false, false),
      adicionarAcaoEsquerda: (el) => acoesExtras.push(el),
      definirConfirmarDesabilitado: (desabilitado) => { btnConfirmar.disabled = Boolean(desabilitado); },
      atualizarTitulo: (novoTit, novoSub = "") => {
        topoTexto.children[0].textContent = novoTit;
        if (topoTexto.children[1]) topoTexto.children[1].textContent = novoSub;
      },
    });
    corpo.append(conteudo);

    for (const el of acoesExtras) rodape.append(el);
    if (modo === "consulta") {
      grupoDireita.append(btnConfirmar);
    } else {
      grupoDireita.append(
        botao(textoCancelar, () => fechar(false, false), true),
        btnConfirmar,
      );
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

    modalContextualAtivo = {
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

    if (!reduzido && card.style) {
      card.style.transform = "scale(0.97)";
      card.style.opacity = "0";
      void card.offsetWidth;
      window.requestAnimationFrame?.(() => {
        dialog.dataset.visivel = "true";
        card.style.transform = "scale(1)";
        card.style.opacity = "1";
      });
    } else {
      dialog.dataset.visivel = "true";
    }
    return dialog;
  }

  function entrada(rotulo, valor, atualizar, minimo, tag = "input", maximo) {
    const campo = elemento(tag);
    campo.setAttribute("aria-label", rotulo);
    const numerico = typeof valor === "number";
    const formatarEntrada = (numero) => String(numero).replace(".", ",");
    campo.value = numerico ? formatarEntrada(valor) : valor;
    if (numerico) {
      campo.inputMode = "decimal";
      campo.classList.add("entrada-numerica");
      campo.required = true;
      campo.addEventListener("blur", () => {
        campo.value = formatarEntrada(valor);
        campo.removeAttribute("aria-invalid");
        campo.setCustomValidity("");
      });
    }
    campo.addEventListener("input", () => {
      let novo = campo.value;
      if (numerico) {
        const texto = campo.value.trim();
        const formato = /^(?:\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[,.]\d+)?|[,.]\d+)$/.test(texto);
        const agrupado = /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(texto)
          && (texto.includes(",") || texto.indexOf(".") !== texto.lastIndexOf("."));
        novo = Number((agrupado ? texto.replaceAll(".", "") : texto).replace(",", "."));
        const valido = formato && Number.isFinite(novo) && novo >= (minimo ?? 0) && novo <= (maximo ?? Infinity);
        campo.setCustomValidity(valido ? "" : "Informe um número dentro do intervalo permitido.");
        if (!valido) {
          campo.setAttribute("aria-invalid", "true");
          return;
        }
        campo.removeAttribute("aria-invalid");
      }
      if (atualizar(novo)) valor = novo;
    });
    return campo;
  }

  function campo(rotulo, valor, atualizar, minimo, maximo) {
    const bloco = elemento("label", undefined, "campo");
    bloco.append(elemento("span", rotulo), entrada(rotulo, valor, atualizar, minimo, "input", maximo));
    return bloco;
  }

  function abrirGaveta(ancora, tituloInicial, conteudo, opcoes = {}) {
    const modal = elemento("dialog", undefined, "gaveta-lateral");
    modal.setAttribute("aria-label", tituloInicial);
    if (opcoes.classe) modal.classList.add(opcoes.classe);

    let fechando = false;
    const fecharComAnimacao = () => {
      if (fechando) return;
      fechando = true;
      if (window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches) {
        modal.classList.add("gaveta-fechando");
        window.setTimeout?.(() => { if (modal.open) modal.close(); }, 200);
      } else if (modal.open) {
        modal.close();
      }
    };

    const btnFechar = botao("×", fecharComAnimacao, true);
    btnFechar.className = "gaveta-fechar-x";
    btnFechar.setAttribute("aria-label", "Fechar painel lateral");

    const topo = elemento("header", undefined, "gaveta-topo");
    let tituloEl;
    let subtituloEl;
    if (opcoes.cabecalhoPersonalizado) {
      topo.classList.add("gaveta-topo-destaque");
      const linhaTopo = elemento("div", undefined, "gaveta-topo-linha");
      linhaTopo.append(opcoes.cabecalhoPersonalizado, btnFechar);
      topo.append(linhaTopo);
    } else {
      tituloEl = elemento("h2", tituloInicial);
      subtituloEl = elemento("p", opcoes.subtitulo || "", "gaveta-subtitulo");
      subtituloEl.hidden = !opcoes.subtitulo;
      const blocoTitulo = elemento("div", undefined, "gaveta-titulos");
      blocoTitulo.append(tituloEl, subtituloEl);
      topo.append(blocoTitulo, btnFechar);
    }

    const corpo = elemento("div", undefined, "gaveta-corpo");
    corpo.append(conteudo);
    modal.append(topo, corpo);
    if (opcoes.rodape) {
      const rodape = elemento("footer", undefined, "gaveta-rodape");
      rodape.append(opcoes.rodape);
      modal.append(rodape);
    }

    modal.addEventListener("cancel", (evento) => {
      if (window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches && !fechando) {
        evento.preventDefault();
        fecharComAnimacao();
      }
    });
    modal.addEventListener("click", (evento) => {
      if (evento.target === modal) fecharComAnimacao();
    });
    modal.addEventListener("close", () => {
      modal.remove();
      ancora?.focus?.();
      opcoes.aoFechar?.();
    });

    (document.body || ancora.parentElement).append(modal);
    modal.showModal();
    return {
      modal,
      fechar: fecharComAnimacao,
      atualizarCabecalho(novoTitulo, novoSubtitulo = "") {
        modal.setAttribute("aria-label", novoTitulo);
        if (tituloEl) tituloEl.textContent = novoTitulo;
        if (subtituloEl) {
          subtituloEl.textContent = novoSubtitulo;
          subtituloEl.hidden = !novoSubtitulo;
        }
      },
    };
  }

  function abrirDialogo(ancora, titulo, conteudo) {
    const modal = elemento("dialog", undefined, "dialogo-edicao");
    modal.setAttribute("aria-label", titulo);
    const form = elemento("form");
    form.method = "dialog";
    const fechar = elemento("button", "Fechar", "botao secundario");
    fechar.autofocus = true;
    form.append(fechar);
    const topo = elemento("div", undefined, "dialogo-topo");
    topo.append(elemento("h2", titulo), form);
    modal.append(topo, conteudo);
    modal.addEventListener("close", () => {
      modal.remove();
      ancora.focus();
    });
    ancora.parentElement.append(modal);
    modal.showModal();
    return modal;
  }

  function paginador(tamanho, exibir, rotulo) {
    let pagina = 0;
    let total = 0;
    const legenda = elemento("span", undefined, "paginacao-legenda");
    legenda.setAttribute("role", "status");
    const anterior = botao("Anterior", () => atualizar(total, pagina - 1), true);
    const proxima = botao("Próxima", () => atualizar(total, pagina + 1), true);
    const controles = elemento("nav", undefined, "paginacao");
    controles.setAttribute("aria-label", rotulo);
    controles.append(anterior, legenda, proxima);
    function atualizar(quantidade, destino = pagina) {
      total = quantidade;
      const paginas = Math.max(1, Math.ceil(total / tamanho));
      pagina = Math.max(0, Math.min(destino, paginas - 1));
      legenda.textContent = (pagina + 1) + " de " + paginas + " · " + total + (total === 1 ? " item" : " itens");
      controles.hidden = paginas <= 1;
      anterior.disabled = pagina === 0;
      proxima.disabled = pagina === paginas - 1;
      exibir(pagina * tamanho, (pagina + 1) * tamanho);
    }
    return { controles, atualizar, mostrar: (quantidade, indice) => atualizar(quantidade, Math.floor(indice / tamanho)),
      paginaDe: (indice) => indice % tamanho };
  }

  function editor(titulo, unidade, itens, atualizar, colunas, opcoes = {}) {
    const lista = elemento("div", undefined, "lista-itens");
    lista.setAttribute("role", "group");
    lista.setAttribute("aria-label", colunas.join(" · "));
    let atualizarBarrasVisiveis = () => {};
    let termoBusca = opcoes.buscaInicial ?? "";
    let filtroCategoria = opcoes.categoriaInicial ?? "";
    const normalizar = (t) => String(t || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const obterFiltrados = () => itens
      .map((item, indice) => ({ item, indice }))
      .filter(({ item }) => {
        const cat = opcoes.tipo === "custo" ? Paisagismo.comercial.categoriaCusto(item) : (item[3] || "").trim();
        if (termoBusca && !normalizar(item[0] + " " + cat).includes(termoBusca)) return false;
        if (filtroCategoria && cat !== filtroCategoria) return false;
        return true;
      });

    const paginacao = paginador(opcoes.porPagina ?? 8, renderizar, "Páginas de " + titulo.toLowerCase());
    let removido;
    const desfazer = botao("Desfazer remoção", () => {
      const { indice, item } = removido;
      itens.splice(indice, 0, item);
      if (atualizar()) {
        desfazer.hidden = true;
        termoBusca = "";
        filtroCategoria = "";
        if (campoBusca) campoBusca.value = "";
        atualizarBotoesCategoria();
        paginacao.mostrar(itens.length, indice);
        lista.children[paginacao.paginaDe(indice)]?.querySelector("textarea")?.focus();
      } else itens.splice(indice, 1);
    }, true);
    desfazer.hidden = true;
    const adicionar = botao("+ Adicionar item", () => {
      const novoItem = opcoes.tipo === "custo"
        ? ["Novo item", 0, "mensal", filtroCategoria || "Escritório"]
        : ["Novo item", 0];
      itens.push(novoItem);
      if (atualizar()) {
        termoBusca = "";
        if (campoBusca) campoBusca.value = "";
        const filtrados = obterFiltrados();
        paginacao.mostrar(filtrados.length, filtrados.length - 1);
        const novo = lista.lastElementChild?.querySelector("textarea");
        novo?.focus();
        novo?.select();
      } else itens.pop();
    }, true);
    adicionar.classList.add("adicionar");

    function renderizar(inicio, fim) {
      const atualizadoresLinha = [];
      atualizarBarrasVisiveis = () => {
        for (const fn of atualizadoresLinha) fn();
      };
      const filtrados = obterFiltrados();
      if (!filtrados.length && (termoBusca || filtroCategoria)) {
        lista.replaceChildren(elemento("p", "Nenhum item encontrado para o filtro informado."));
        return;
      }
      lista.replaceChildren(...filtrados.slice(inicio, fim).map(({ item, indice }) => {
        const grupo = elemento("div", undefined, "editor");
        let subtotal;
        let equivalenteMensal;
        let atualizarMeta = () => {};
        const meses = { mensal: 1, trimestral: 3, anual: 12 };
        const atualizarSubtotal = () => {
          if (subtotal) subtotal.value = reais.format(item[1] * (item[2] ?? 1));
          if (equivalenteMensal) {
            const divisor = meses[item[2] ?? "mensal"] || 1;
            equivalenteMensal.value = reais.format((Number(item[1]) || 0) / divisor);
          }
          if (opcoes.tipo === "despesa") {
            const zerado = (Number(item[1]) || 0) * (Number(item[2] ?? 1) || 1) <= 0;
            if (zerado) grupo.dataset.zerado = "true";
            else delete grupo.dataset.zerado;
          }
          aoAtualizarDespesa?.();
          atualizarBarrasVisiveis();
        };
        function editar(coluna, valor) {
          const anterior = item.slice();
          item[coluna] = valor;
          if (atualizar()) {
            atualizarSubtotal();
            return true;
          }
          item.splice(0, item.length, ...anterior);
          return false;
        }
        const remover = botao("×", () => {
          itens.splice(indice, 1);
          if (atualizar()) {
            removido = { indice, item };
            desfazer.hidden = false;
            const restantes = obterFiltrados();
            const proximo = Math.max(0, Math.min(indice, restantes.length - 1));
            paginacao.mostrar(restantes.length, proximo);
            (lista.children[paginacao.paginaDe(proximo)]?.querySelector("textarea") || adicionar).focus();
          } else itens.splice(indice, 0, item);
        }, true);
        remover.classList.add("remover");
        remover.title = "Remover item";
        remover.setAttribute("aria-label", "Remover item " + (indice + 1));

        const cabecalhoItem = elemento("div", undefined, "cabecalho-item-editor");
        const numeroBadge = elemento("span", String(indice + 1).padStart(2, "0"), "indice-item");
        numeroBadge.setAttribute("aria-hidden", "true");
        const nome = elemento("div", undefined, "nome-item");
        const ehTraslado = opcoes.tipo === "despesa"
          && /traslado|deslocamento|combust|gasolina|viagem/i.test(item[0] || "");
        const rotuloDetalhes = ehTraslado ? "km / R$" : "Detalhes";
        const detalhes = botao(rotuloDetalhes, () => {
          if (opcoes.tipo === "despesa") {
            const headerDesp = elemento("div", undefined, "gaveta-header-verde");
            const titDesp = elemento("h2", item[0] || "Despesa", "gaveta-titulo-categoria");
            const subDesp = elemento("strong", reais.format(item[1] * (item[2] ?? 1)), "gaveta-total-mensal valor-financeiro");
            headerDesp.append(titDesp, subDesp);
            const atualizarHeaderDesp = () => {
              titDesp.textContent = item[0] || "Despesa";
              mostrarValor(subDesp, reais.format(item[1] * (item[2] ?? 1)));
            };
            aoAtualizarDespesa = atualizarHeaderDesp;
            modal = abrirGaveta(detalhes, item[0] || "Despesa", extras, {
              classe: "gaveta-custos-v2",
              cabecalhoPersonalizado: headerDesp,
              aoFechar() { aoAtualizarDespesa = null; },
            });
          } else {
            modal = abrirDialogo(detalhes, "Detalhes de " + (item[0] || "item"), extras);
          }
        }, true);
        detalhes.classList.add("botao-detalhes-item");
        if (ehTraslado) detalhes.classList.add("botao-traslado-atalho");
        let aoAtualizarDespesa = null;
        const extras = elemento("div", undefined, "pilha");
        const camposExtras = elemento("div", undefined, "formulario-comercial detalhes-formulario");
        extras.append(camposExtras);
        let modal;
        const nomeDetalhes = () => {
          detalhes.setAttribute("aria-label", "Detalhes de " + (item[0] || "item " + (indice + 1)));
          nome.title = item[0] || "";
        };
        nomeDetalhes();
        nome.dataset.valor = item[0];
        const texto = entrada("Nome do item " + (indice + 1), item[0], (valor) => {
          if (!editar(0, valor)) return false;
          nome.dataset.valor = valor;
          nomeDetalhes();
          return true;
        }, undefined, "textarea");
        texto.rows = 1;
        nome.append(texto);
        cabecalhoItem.append(numeroBadge, nome);

        const campoValor = entrada(unidade + " do item " + (indice + 1), item[1], (v) => editar(1, v));

        if (opcoes.tipo === "etapa") {
          const barra = elemento("div", undefined, "barra-proporcao barra-proporcao-base");
          const barraInterna = elemento("div", undefined, "barra-proporcao-interna");
          barra.append(barraInterna);
          grupo.append(barra);
          atualizarMeta = () => {
            const totalHoras = Math.max(0.01, itens.reduce((soma, [, h]) => soma + (Number(h) || 0), 0));
            const pct = Math.min(100, Math.round(((Number(item[1]) || 0) / totalHoras) * 100));
            barraInterna.setAttribute("style", "width:" + pct + "%");
            const info = [pct + "% do esforço", item[4] === true ? "Entregável na proposta" : "", item[3] || ""]
              .filter(Boolean).join(" · ");
            barra.title = info;
            if (item[4] === true) numeroBadge.dataset.destaque = "publico";
            else delete numeroBadge.dataset.destaque;
          };
          atualizadoresLinha.push(atualizarMeta);
        }

        if (opcoes.tipo === "custo") {
          const etiqueta = elemento("span", undefined, "etiqueta-item etiqueta-inline");
          cabecalhoItem.append(etiqueta);
          atualizarMeta = () => {
            const p = item[2] && item[2] !== "mensal" ? (item[2] === "anual" ? "Anual" : "Trim.") : "";
            const cat = Paisagismo.comercial.categoriaCusto(item);
            const info = [p, filtroCategoria ? "" : cat].filter(Boolean).join(" · ");
            etiqueta.textContent = info;
            etiqueta.hidden = !info;
          };
          atualizadoresLinha.push(atualizarMeta);
        }

        const acoesItem = elemento("div", undefined, "acoes-item");
        if (opcoes.tipo || opcoes.ordenar) acoesItem.append(detalhes);
        acoesItem.append(remover);
        grupo.append(cabecalhoItem, campoValor, acoesItem);

        if (opcoes.tipo || opcoes.ordenar) {
          if (opcoes.tipo === "despesa") {
            subtotal = elemento("output");
            atualizarSubtotal();
            const campoQtd = campo("Quantidade", item[2] ?? 1, (v) => editar(2, v));
            const campoUnidade = campo("Unidade / observação", item[3] ?? "", (v) => editar(3, v));
            camposExtras.append(campoQtd, campoUnidade, rotuloValor("Subtotal do item", subtotal));

            /* Calculadora de deslocamento exclusiva para Traslado / deslocamento */
            if (opcoes.ctx && ehTraslado) {
              const projetoAtual = opcoes.ctx.dados.projeto;
              const padrao = opcoes.ctx.dados.deslocamentoPadrao;
              const t = projetoAtual.traslado;
              if (!t.combustivel && padrao.combustivel) t.combustivel = padrao.combustivel;
              if (!t.consumo && padrao.consumo) t.consumo = padrao.consumo;

              const calcBloco = elemento("details", undefined, "cartao calculadora-traslado");
              if (ehTraslado) calcBloco.open = true;
              calcBloco.append(elemento("summary", "Calculadora de deslocamento (km e combustível)"));
              const calcGrade = elemento("div", undefined, "formulario-comercial");
              const resumoCalc = elemento("p", "", "resumo-traslado");
              const atualizarResumoCalc = () => {
                const res = Paisagismo.comercial.calcularTraslado(t);
                resumoCalc.textContent = numeros.format(res.distanciaTotal) + " km totais · "
                  + numeros.format(Math.round(res.litros * 100) / 100) + " L estimados · Total: "
                  + reais.format(res.valor);
                return res;
              };
              const chkIdaVolta = elemento("input");
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
                campo("Distância do trecho (km)", t.km, editarTraslado("km"), 0),
                campo("Quantidade de visitas", t.visitas, editarTraslado("visitas"), 1),
                campo("Consumo do veículo (km/L)", t.consumo, editarTraslado("consumo"), 0.5),
                campo("Preço do combustível (R$/L)", t.combustivel, editarTraslado("combustivel"), 0),
                campo("Pedágio / estacionamento (R$)", t.pedagio, editarTraslado("pedagio"), 0),
                Paisagismo.telasComerciais.rotular("Considerar ida e volta (×2)", chkIdaVolta),
              );
              const aplicarCalc = botao("Aplicar valor calculado", () => {
                const res = atualizarResumoCalc();
                padrao.consumo = t.consumo;
                padrao.combustivel = t.combustivel;
                const nota = numeros.format(res.distanciaTotal) + " km · " + reais.format(t.combustivel) + "/L";
                item[2] = 1;
                item[3] = nota;
                if (editar(1, res.valor)) {
                  campoValor.value = String(res.valor).replace(".", ",");
                  const inputQtd = campoQtd.querySelector("input");
                  const inputUn = campoUnidade.querySelector("input");
                  if (inputQtd) inputQtd.value = "1";
                  if (inputUn) inputUn.value = nota;
                  opcoes.ctx.status("Traslado calculado e aplicado: " + reais.format(res.valor) + ".");
                }
              });
              atualizarResumoCalc();
              calcBloco.append(calcGrade, resumoCalc, aplicarCalc);
              extras.append(calcBloco);
            }
          }
          if (opcoes.tipo === "custo") {
            const comercial = Paisagismo.telasComerciais;
            const periodos = [["mensal", "Mensal"], ["trimestral", "Trimestral"], ["anual", "Anual"]];
            const baseCats = Paisagismo.comercial.categoriasCusto;
            const catAtual = Paisagismo.comercial.categoriaCusto(item);
            const opcoesCat = [
              ...baseCats.map((c) => [c, c]),
              ...(catAtual && !baseCats.includes(catAtual) && catAtual !== "Outros" ? [[catAtual, catAtual]] : []),
              ["Outros", "Outros"],
            ];
            equivalenteMensal = elemento("output");
            atualizarSubtotal();
            camposExtras.append(
              comercial.rotular("Periodicidade", comercial.seletor("Periodicidade", periodos,
                item[2] ?? "mensal", (v) => editar(2, v))),
              comercial.rotular("Categoria", comercial.seletor("Categoria", opcoesCat,
                catAtual, (v) => editar(3, v))),
              rotuloValor("Custo mensal equivalente", equivalenteMensal),
            );
          }
          if (opcoes.tipo === "etapa") {
            const publico = elemento("input");
            publico.type = "checkbox";
            publico.checked = item[4] === true;
            publico.addEventListener("change", () => editar(4, publico.checked));
            camposExtras.append(campo("Descrição para a proposta", item[2] ?? "", (v) => editar(2, v)),
              campo("Responsável", item[3] ?? "", (v) => editar(3, v)),
              Paisagismo.telasComerciais.rotular("Incluir entre os entregáveis", publico));
          }
          if (opcoes.ordenar) {
            const mover = (destino) => {
              [itens[indice], itens[destino]] = [itens[destino], itens[indice]];
              if (!atualizar()) {
                [itens[indice], itens[destino]] = [itens[destino], itens[indice]];
                return;
              }
              modal.close();
              paginacao.mostrar(itens.length, destino);
              lista.children[paginacao.paginaDe(destino)]?.querySelector("textarea")?.focus();
            };
            if (indice > 0) camposExtras.append(botao("Mover acima", () => mover(indice - 1), true));
            if (indice < itens.length - 1) camposExtras.append(botao("Mover abaixo", () => mover(indice + 1), true));
          }
        }
        return grupo;
      }));
      atualizarBarrasVisiveis();
    }

    let campoBusca;
    const botoesCat = [];
    const atualizarBotoesCategoria = () => {
      for (const { btn, chave } of botoesCat) {
        btn.setAttribute("aria-pressed", String(filtroCategoria === chave));
      }
    };

    const topo = elemento("div", undefined, "editor-topo");
    const acoes = elemento("div", undefined, "acoes");
    let barraCategorias = null;
    if (opcoes.tipo === "custo") {
      campoBusca = elemento("input");
      campoBusca.type = "search";
      campoBusca.value = termoBusca;
      campoBusca.placeholder = "Buscar despesa...";
      campoBusca.className = "busca-compacta";
      campoBusca.setAttribute("aria-label", "Buscar despesa da operação");
      campoBusca.addEventListener("input", () => {
        termoBusca = normalizar(campoBusca.value.trim());
        paginacao.atualizar(obterFiltrados().length, 0);
      });
      acoes.append(campoBusca);

      barraCategorias = elemento("div", undefined, "filtros-categoria grupos-comerciais");
      const cats = [["", "Todas"], ...Paisagismo.comercial.categoriasCusto.map((c) => [c, c]), ["Outros", "Outros"]];
      for (const [chave, rotulo] of cats) {
        const btn = botao(rotulo, () => {
          filtroCategoria = chave;
          atualizarBotoesCategoria();
          paginacao.atualizar(obterFiltrados().length, 0);
          opcoes.aoTrocarCategoria?.(chave);
        }, true);
        btn.classList.add("botao-filtro-cat");
        botoesCat.push({ btn, chave });
        barraCategorias.append(btn);
      }
      atualizarBotoesCategoria();
    }
    if (opcoes.botaoVoltar) acoes.append(opcoes.botaoVoltar);
    acoes.append(desfazer, adicionar);
    if (!opcoes.ocultarTitulo) topo.append(elemento("h2", titulo));
    topo.append(acoes);
    paginacao.atualizar(obterFiltrados().length);
    const bloco = elemento("section", undefined, opcoes.semCartao ? "cartao-editor editor-em-gaveta" : "cartao cartao-editor");
    if (opcoes.tipo) bloco.dataset.tipo = opcoes.tipo;
    if (opcoes.colunas) lista.classList.add("lista-dupla");
    if (barraCategorias) bloco.append(topo, barraCategorias, lista, paginacao.controles);
    else bloco.append(topo, lista, paginacao.controles);
    return bloco;
  }

  function rotuloValor(rotulo, output) {
    const bloco = elemento("div", undefined, "campo");
    bloco.append(elemento("span", rotulo), output);
    return bloco;
  }

  function editar(objeto, chave, atualizar) {
    return (valor) => {
      const anterior = objeto[chave];
      objeto[chave] = valor;
      if (atualizar()) return true;
      objeto[chave] = anterior;
      return false;
    };
  }

  return { elemento, botao, cabecalho, cabecalhoBotanico, cartao, linha, campo, editor, editar, mostrarValor, animarNumero,
    estadoVazio, estadoVazioBotanico, menuContextual, abrirModalContextual, paginador, abrirDialogo, abrirGaveta,
    brl: (valor) => reais.format(valor),
    numero: (valor) => numeros.format(valor),
    percentual: (valor) => percentuais.format(valor) + "%" };
})();
