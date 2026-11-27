Paisagismo.telaCustos = (ctx) => {
  const ui = Paisagismo.ui;
  const bot = Paisagismo.botanica;
  const regras = Paisagismo.comercial;
  const operacao = ctx.dados.operacao;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const mesesPeriodo = { mensal: 1, trimestral: 3, anual: 12 };

  const categoriasDef = [
    { nome: "Escritório", cor: "#2f5d46", tema: "escritorio" },
    { nome: "Trabalho", cor: "#a8833e", tema: "trabalho" },
    { nome: "Pessoas", cor: "#18392d", tema: "pessoas" },
    { nome: "Crescimento", cor: "#4d7852", tema: "crescimento" },
  ];
  const coresCategoria = {
    "Escritório": "#2f5d46",
    "Trabalho": "#a8833e",
    "Pessoas": "#18392d",
    "Crescimento": "#4d7852",
    "Outros": "#b0623e",
  };

  function itensMensaisAtuais() {
    return operacao.custos.map((item, i) => {
      const [nome, valor, periodo] = item;
      const valorMensal = (Number(valor) || 0) / (mesesPeriodo[periodo ?? "mensal"] || 1);
      return {
        item,
        nome: nome || "Despesa " + (i + 1),
        valorMensal: Math.round(valorMensal * 100) / 100,
        categoria: regras.categoriaCusto(item),
      };
    });
  }

  function agruparCategorias(itensMensais) {
    const mapa = new Map();
    for (const def of categoriasDef) {
      mapa.set(def.nome, { ...def, valorMensal: 0, quantidade: 0 });
    }
    for (const { valorMensal, categoria } of itensMensais) {
      if (!mapa.has(categoria)) {
        mapa.set(categoria, { nome: categoria, cor: coresCategoria[categoria] || "#5a7566", tema: "outros", valorMensal: 0, quantidade: 0 });
      }
      const grupo = mapa.get(categoria);
      grupo.valorMensal += valorMensal;
      grupo.quantidade += 1;
    }
    return [...mapa.values()].filter((g) => regras.categoriasCusto.includes(g.nome) || g.quantidade > 0);
  }

  function criarSvg(viewBox, paths, classe = "") {
    if (typeof document.createElementNS !== "function") return ui.elemento("span", undefined, classe);
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

  function ilustrarCategoria(nome) {
    const s = { stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" };
    if (nome === "Escritório") {
      return criarSvg("0 0 110 92", [
        { ...s, d: "M22 76V30l30-14 30 14v46", fill: "currentColor", "fill-opacity": "0.08" },
        { ...s, d: "M14 76h82" },
        { ...s, d: "M40 42h8v10h-8zM56 42h8v10h-8zM44 76V60h16v16" },
        { ...s, d: "M82 76V46l14 6v24", "stroke-opacity": "0.5" },
      ], "fase-ilustracao-svg");
    }
    if (nome === "Trabalho") {
      return criarSvg("0 0 110 92", [
        { ...s, d: "M24 24h62v42H24z", fill: "currentColor", "fill-opacity": "0.09" },
        { ...s, d: "M16 74h78" },
        { ...s, d: "M34 38h24M34 48h42M34 58h30", "stroke-opacity": "0.6" },
        { ...s, tag: "circle", cx: "76", cy: "38", r: "6" },
      ], "fase-ilustracao-svg");
    }
    if (nome === "Pessoas") {
      return criarSvg("0 0 110 92", [
        { ...s, tag: "circle", cx: "44", cy: "34", r: "11", fill: "currentColor", "fill-opacity": "0.1" },
        { ...s, d: "M22 74c0-13 10-22 22-22s22 9 22 22" },
        { ...s, tag: "circle", cx: "74", cy: "40", r: "8", "stroke-opacity": "0.65" },
        { ...s, d: "M64 74c1-10 8-16 18-16 8 0 14 5 16 16", "stroke-opacity": "0.65" },
      ], "fase-ilustracao-svg");
    }
    return criarSvg("0 0 110 92", [
      { ...s, d: "M54 78V34" },
      { ...s, d: "M54 58C38 56 28 42 32 28c14 2 22 14 22 30z", fill: "currentColor", "fill-opacity": "0.13" },
      { ...s, d: "M54 46c16-2 28-14 28-28-14 0-26 12-28 28z", fill: "currentColor", "fill-opacity": "0.1" },
      { ...s, d: "M26 78h56", "stroke-opacity": "0.45" },
    ], "fase-ilustracao-svg");
  }

  /* Sistema unificado de modais contextuais (.flora-ct-dialog) */
  let modalAtivo = null;
  function abrirModalCustos({
    titulo,
    subtitulo = "",
    tamanho = "padrao",
    origemEl = null,
    modo = "edicao",
    textoConfirmar = "Confirmar",
    montar,
    estaAlterado = () => false,
    aoConfirmar = () => {},
    aoCancelar = () => {},
  }) {
    if (modalAtivo) modalAtivo.forcarFechar();

    const dialog = ui.elemento("dialog", undefined, "flora-ct-dialog");
    dialog.dataset.tamanho = tamanho;
    dialog.setAttribute("aria-label", titulo);

    const card = ui.elemento("div", undefined, "flora-ct-card");
    const topo = ui.elemento("header", undefined, "flora-ct-topo");
    const topoTexto = ui.elemento("div", undefined, "etapas-modal-topo-texto");
    topoTexto.append(ui.elemento("h2", titulo));
    if (subtitulo) topoTexto.append(ui.elemento("small", subtitulo, "etapas-modal-subtitulo"));
    const btnFechar = ui.elemento("button", "×", "flora-ct-fechar");
    btnFechar.type = "button";
    btnFechar.setAttribute("aria-label", "Fechar " + titulo);
    topo.append(topoTexto, btnFechar);

    const corpo = ui.elemento("div", undefined, "flora-ct-corpo");
    const rodape = ui.elemento("footer", undefined, "flora-ct-rodape");
    const grupoDireita = ui.elemento("div", undefined, "flora-ct-rodape-acoes");
    const acoesExtras = [];

    let fechando = false;
    const reduzido = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    function limparDialogo(confirmado) {
      dialog.close?.();
      dialog.remove?.();
      if (origemEl?.dataset) delete origemEl.dataset.transformAtivo;
      if (modalAtivo?.dialog === dialog) modalAtivo = null;
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

      if (!reduzido) {
        dialog.dataset.fechando = "true";
        delete dialog.dataset.visivel;
        card.style.transform = "scale(0.97)";
        card.style.opacity = "0";
        window.setTimeout?.(() => limparDialogo(confirmado), 210);
      } else {
        limparDialogo(confirmado);
      }
    }

    const btnConfirmar = modo === "consulta"
      ? ui.botao("Fechar", () => fechar(true, false))
      : ui.botao(textoConfirmar, () => fechar(true, false));

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
        ui.botao("Cancelar", () => fechar(false, false), true),
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

    modalAtivo = {
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

    if (!reduzido) {
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

  function registrarMes(mesSelecionado) {
    const mes = mesSelecionado || regras.hoje().slice(0, 7);
    const total = Paisagismo.custos(operacao);
    const registro = {
      mes,
      mensal: Math.round(total.mensal * 100) / 100,
      horas: operacao.horas,
      hora: Math.round(total.hora * 100) / 100,
      itens: itensMensaisAtuais().map(({ nome, valorMensal, categoria }) => [nome, valorMensal, categoria]),
    };
    const lista = ctx.dados.historicoCustos;
    const existente = lista.findIndex((item) => item.mes === mes);
    if (existente >= 0) lista[existente] = registro;
    else lista.push(registro);
    lista.sort((a, b) => a.mes.localeCompare(b.mes));
    ctx.gravar("Custos de " + regras.formatarMes(mes) + " registrados no histórico.");
  }

  function construirPainelEvolucao() {
    const painel = ui.elemento("div", undefined, "pilha painel-evolucao");
    const barraRegistro = ui.elemento("div", undefined, "acoes barra-registro-mes");
    const seletorMes = ui.elemento("input");
    seletorMes.type = "month";
    seletorMes.value = regras.hoje().slice(0, 7);
    seletorMes.setAttribute("aria-label", "Competência para registrar custos");
    let periodoVisao = "mensal";

    const areaGrafico = ui.elemento("div", undefined, "ranking-barras");
    const areaVariacao = ui.elemento("div", undefined, "pilha");
    const areaMedia = ui.elemento("p", "", "subtexto-indicador");

    const btnMensal = ui.botao("Mensal", () => { periodoVisao = "mensal"; atualizarVisao(); }, true);
    const btnTrimestral = ui.botao("Trimestral", () => { periodoVisao = "trimestral"; atualizarVisao(); }, true);
    const seletorPeriodo = ui.elemento("div", undefined, "acoes grupos-comerciais");
    seletorPeriodo.append(btnMensal, btnTrimestral);

    function atualizarVisao() {
      btnMensal.setAttribute("aria-pressed", String(periodoVisao === "mensal"));
      btnTrimestral.setAttribute("aria-pressed", String(periodoVisao === "trimestral"));
      const historico = [...ctx.dados.historicoCustos].sort((a, b) => a.mes.localeCompare(b.mes));
      if (!historico.length) {
        areaGrafico.replaceChildren(ui.elemento("p",
          "Nenhum fechamento mensal registrado ainda. Clique em \"Registrar fechamento\" acima para acompanhar a evolução."));
        areaVariacao.replaceChildren();
        areaMedia.textContent = "";
        return;
      }

      let series;
      if (periodoVisao === "mensal") {
        series = historico.slice(-6).map((h) => ({
          rotulo: regras.formatarMes(h.mes),
          valor: h.mensal,
          detalhe: ui.brl(h.mensal) + " (" + ui.brl(h.hora) + "/h)",
        }));
      } else {
        const trimestres = new Map();
        for (const h of historico) {
          const [ano, mes] = h.mes.split("-");
          const tri = "T" + Math.ceil(Number(mes) / 3) + "/" + ano;
          const acum = trimestres.get(tri) || { soma: 0, qtd: 0 };
          acum.soma += h.mensal;
          acum.qtd += 1;
          trimestres.set(tri, acum);
        }
        series = [...trimestres.entries()].slice(-4).map(([tri, { soma, qtd }]) => ({
          rotulo: tri + " (" + qtd + (qtd === 1 ? " mês)" : " meses)"),
          valor: soma,
          detalhe: ui.brl(soma) + " · média " + ui.brl(soma / qtd) + "/mês",
        }));
      }

      const maximo = Math.max(0.01, ...series.map((s) => s.valor));
      areaGrafico.replaceChildren(...series.map(({ rotulo, valor, detalhe }) => {
        const pct = Math.min(100, Math.round((valor / maximo) * 100));
        const item = ui.elemento("div", undefined, "item-ranking");
        const topo = ui.elemento("div", undefined, "topo-ranking");
        topo.append(ui.elemento("span", rotulo), ui.elemento("strong", detalhe));
        const trilha = ui.elemento("div", undefined, "trilha-ranking");
        const barra = ui.elemento("div", undefined, "barra-preenchimento");
        barra.setAttribute("style", "width:" + Math.max(6, pct) + "%");
        trilha.append(barra);
        item.append(topo, trilha);
        return item;
      }));

      const recentes = historico.slice(-3);
      const mediaMensal = recentes.reduce((s, h) => s + h.mensal, 0) / recentes.length;
      const mediaHora = recentes.reduce((s, h) => s + h.hora, 0) / recentes.length;
      areaMedia.textContent = "Média dos últimos " + recentes.length + (recentes.length === 1 ? " mês: " : " meses: ")
        + ui.brl(mediaMensal) + "/mês · " + ui.brl(mediaHora) + "/h.";

      if (historico.length >= 2) {
        const anterior = historico[historico.length - 2];
        const atual = historico[historico.length - 1];
        const deltaTotal = atual.mensal - anterior.mensal;
        const pctTotal = anterior.mensal > 0 ? (deltaTotal / anterior.mensal) * 100 : 0;
        const mapaAntes = new Map(anterior.itens.map(([n, v]) => [n, v]));
        const mapaDepois = new Map(atual.itens.map(([n, v]) => [n, v]));
        const variacoes = [...new Set([...mapaAntes.keys(), ...mapaDepois.keys()])]
          .map((nome) => ({ nome, delta: (mapaDepois.get(nome) || 0) - (mapaAntes.get(nome) || 0) }))
          .filter((v) => Math.abs(v.delta) >= 0.01)
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
          .slice(0, 6);

        const resumoVar = ui.elemento("div", undefined, "cartao");
        const tituloVar = "O que mudou (" + regras.formatarMes(anterior.mes) + " → " + regras.formatarMes(atual.mes) + ")";
        const linhasVar = [
          ui.linha("Variação total mensal",
            (deltaTotal > 0 ? "+" : "") + ui.brl(deltaTotal) + " (" + (pctTotal > 0 ? "+" : "") + ui.percentual(pctTotal) + ")",
            "strong").bloco,
          ...(variacoes.length ? variacoes.map(({ nome, delta }) => {
            const l = ui.linha(nome, (delta > 0 ? "+" : "") + ui.brl(delta), "strong");
            l.bloco.classList.add(delta > 0 ? "variacao-alta" : "variacao-queda");
            return l.bloco;
          }) : [ui.elemento("p", "Os custos permaneceram idênticos entre estes dois meses.")]),
        ];
        resumoVar.append(ui.elemento("h2", tituloVar), ...linhasVar);
        areaVariacao.replaceChildren(resumoVar);
      } else {
        areaVariacao.replaceChildren(ui.elemento("p",
          "Registre pelo menos 2 meses para comparar o que subiu ou diminuiu nos custos."));
      }
    }

    barraRegistro.append(
      seletorMes,
      ui.botao("Registrar fechamento", () => {
        if (!seletorMes.value) return;
        registrarMes(seletorMes.value);
        atualizarVisao();
      }),
    );
    atualizarVisao();
    painel.append(barraRegistro, seletorPeriodo, areaGrafico, areaMedia, areaVariacao);
    return painel;
  }

  /* Modal de Despesa Individual */
  function abrirModalDespesa(item, ancora) {
    const snapshot = item.slice();
    const comercial = Paisagismo.telasComerciais;
    const periodos = [["mensal", "Mensal"], ["trimestral", "Trimestral"], ["anual", "Anual"]];
    const baseCats = regras.categoriasCusto;
    const catInicial = regras.categoriaCusto(item);

    abrirModalCustos({
      titulo: item[0] || "Editar despesa",
      subtitulo: catInicial,
      tamanho: "compacto",
      origemEl: ancora,
      modo: "edicao",
      estaAlterado: () => JSON.stringify(item) !== JSON.stringify(snapshot),
      aoConfirmar: () => atualizar(),
      aoCancelar: () => {
        item.splice(0, item.length, ...snapshot);
        atualizar();
      },
      montar: ({ adicionarAcaoEsquerda, atualizarTitulo }) => {
        const grade = ui.elemento("div", undefined, "formulario-comercial");
        const valorMensalEl = ui.elemento("strong", "R$ 0,00");
        const impactoHoraEl = ui.elemento("strong", "R$ 0,00/h");

        const atualizarPrevia = () => {
          const vm = (Number(item[1]) || 0) / (mesesPeriodo[item[2] ?? "mensal"] || 1);
          valorMensalEl.textContent = ui.brl(vm);
          impactoHoraEl.textContent = ui.brl(vm / Math.max(0.01, operacao.horas)) + "/h";
        };

        const campoNome = ui.campo("Nome da despesa", item[0], (v) => {
          item[0] = v;
          atualizarTitulo?.(v || "Editar despesa", regras.categoriaCusto(item));
          return true;
        });
        campoNome.classList.add("campo-completo");

        const campoVal = ui.campo("Valor (R$)", item[1], (v) => {
          item[1] = v;
          atualizarPrevia();
          return true;
        }, 0);

        const selPeriodo = comercial.seletor("Periodicidade", periodos, item[2] ?? "mensal", (v) => {
          item[2] = v;
          atualizarPrevia();
          return true;
        });

        const opCats = [
          ...baseCats.map((c) => [c, c]),
          ...(catInicial && !baseCats.includes(catInicial) && catInicial !== "Outros" ? [[catInicial, catInicial]] : []),
          ["Outros", "Outros"],
        ];
        const selCat = comercial.seletor("Categoria", opCats, catInicial, (v) => {
          item[3] = v;
          atualizarTitulo?.(item[0] || "Editar despesa", v);
          return true;
        });

        const previa = ui.elemento("div", undefined, "custos-modal-previa");
        const s1 = ui.elemento("div", undefined, "etapas-modal-stat");
        s1.append(ui.elemento("small", "Equivalente mensal"), valorMensalEl);
        const s2 = ui.elemento("div", undefined, "etapas-modal-stat");
        s2.append(ui.elemento("small", "Impacto no custo/hora"), impactoHoraEl);
        previa.append(s1, s2);

        const btnRem = ui.botao("Remover despesa", () => {
          const confirmar = typeof window !== "undefined" && typeof window.confirm === "function"
            ? window.confirm("Tem certeza que deseja remover a despesa \"" + (item[0] || "sem nome") + "\"?")
            : true;
          if (!confirmar) return;
          const idx = operacao.custos.indexOf(item);
          if (idx >= 0) operacao.custos.splice(idx, 1);
          modalAtivo?.forcarFechar();
          atualizar();
        }, true);
        btnRem.classList.add("flora-ct-btn-remover");
        adicionarAcaoEsquerda(btnRem);

        atualizarPrevia();
        grade.append(
          campoNome,
          campoVal,
          comercial.rotular("Periodicidade", selPeriodo),
          comercial.rotular("Categoria", selCat),
          previa,
        );
        return grade;
      },
    });
  }

  /* Modal de Categoria ou Todas as Despesas */
  function abrirModalCategoria(ancora, categoriaInicial = "") {
    const snapshot = structuredClone(operacao.custos);
    const comercial = Paisagismo.telasComerciais;
    let catAtual = categoriaInicial;
    let termoBusca = "";
    let itemSelecionado = null;
    let removido = null;
    const normalizar = (t) => String(t || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    abrirModalCustos({
      titulo: catAtual || "Todas as despesas",
      subtitulo: catAtual ? "Despesas operacionais da categoria" : "Visão consolidada da operação",
      tamanho: "padrao",
      origemEl: ancora,
      modo: "edicao",
      estaAlterado: () => JSON.stringify(operacao.custos) !== JSON.stringify(snapshot),
      aoConfirmar: () => atualizar(),
      aoCancelar: () => {
        operacao.custos.splice(0, operacao.custos.length, ...snapshot);
        atualizar();
      },
      montar: () => {
        const container = ui.elemento("div", undefined, "etapas-modal-fase");
        const resumoModal = ui.elemento("div", undefined, "etapas-modal-resumo");
        const mMensal = ui.elemento("strong", "R$ 0,00");
        const mAnual = ui.elemento("strong", "R$ 0,00");
        const mHora = ui.elemento("strong", "R$ 0,00/h");
        const mPct = ui.elemento("strong", "0%");
        const criarStat = (rot, el) => {
          const s = ui.elemento("div", undefined, "etapas-modal-stat");
          s.append(ui.elemento("small", rot), el);
          return s;
        };
        resumoModal.append(
          criarStat("Subtotal mensal", mMensal),
          criarStat("Custo anual", mAnual),
          criarStat("Impacto/hora", mHora),
          criarStat("Participação", mPct),
        );

        const barraAcoes = ui.elemento("div", undefined, "etapas-modal-barra");
        const campoBusca = ui.elemento("input", undefined, "gaveta-input-busca");
        campoBusca.type = "search";
        campoBusca.placeholder = "Buscar despesa...";
        campoBusca.setAttribute("aria-label", "Buscar despesa");
        campoBusca.addEventListener("input", () => {
          termoBusca = normalizar(campoBusca.value.trim());
          renderizarLista();
        });

        const btnAdicionar = ui.botao("+ Nova despesa", () => {
          const novo = ["Nova despesa", 0, "mensal", catAtual || "Escritório"];
          operacao.custos.unshift(novo);
          termoBusca = "";
          campoBusca.value = "";
          itemSelecionado = novo;
          atualizarResumoModal();
          renderizarLista(true);
        }, true);
        barraAcoes.append(campoBusca, btnAdicionar);

        const barraDesfazer = ui.elemento("div", undefined, "gaveta-desfazer");
        barraDesfazer.hidden = true;
        const txtDesfazer = ui.elemento("span", "Despesa removida.");
        const btnDesfazer = ui.botao("Desfazer", () => {
          if (!removido) return;
          operacao.custos.splice(removido.indice, 0, removido.item);
          itemSelecionado = removido.item;
          removido = null;
          barraDesfazer.hidden = true;
          atualizarResumoModal();
          renderizarLista();
        }, true);
        barraDesfazer.append(txtDesfazer, btnDesfazer);

        const listaEl = ui.elemento("div", undefined, "etapas-modal-lista");

        function atualizarResumoModal() {
          const total = Paisagismo.custos(operacao);
          const itens = itensMensaisAtuais();
          const doGrupo = catAtual ? itens.filter((i) => i.categoria === catAtual) : itens;
          const subtotal = doGrupo.reduce((s, i) => s + i.valorMensal, 0);
          const pct = total.mensal > 0 ? Math.round((subtotal / total.mensal) * 100) : 0;
          const horasRef = Math.max(0.01, operacao.horas);
          mMensal.textContent = ui.brl(subtotal);
          mAnual.textContent = ui.brl(subtotal * 12);
          mHora.textContent = ui.brl(subtotal / horasRef) + "/h";
          mPct.textContent = pct + "%";
        }

        function renderizarLista(focarNova = false) {
          const visiveis = operacao.custos
            .map((item, indice) => ({ item, indice, cat: regras.categoriaCusto(item) }))
            .filter(({ item, cat }) => {
              if (catAtual && cat !== catAtual) return false;
              if (termoBusca && !normalizar(item[0] + " " + cat).includes(termoBusca)) return false;
              return true;
            });

          if (!visiveis.length) {
            listaEl.replaceChildren(ui.elemento("p",
              termoBusca ? "Nenhuma despesa encontrada para essa busca." : "Nenhuma despesa cadastrada nesta categoria.",
              "gaveta-vazio"));
            return;
          }

          const periodos = [["mensal", "Mensal"], ["trimestral", "Trimestral"], ["anual", "Anual"]];
          const baseCats = regras.categoriasCusto;
          let focoEl = null;

          listaEl.replaceChildren(...visiveis.map(({ item, cat }) => {
            const emEdicao = itemSelecionado === item;
            const linha = ui.elemento("div", undefined, "etapas-modal-item");
            if (emEdicao) linha.dataset.aberta = "true";

            const valorMensalItem = () => (Number(item[1]) || 0) / (mesesPeriodo[item[2] ?? "mensal"] || 1);
            const linhaTopo = ui.elemento("div", undefined, "etapas-modal-item-topo");
            const infoEsq = ui.elemento("div", undefined, "etapas-modal-item-info");
            const nomeInput = ui.elemento("input", undefined, "etapas-modal-nome-input");
            nomeInput.type = "text";
            nomeInput.value = item[0] || "";
            nomeInput.setAttribute("aria-label", "Nome da despesa");
            nomeInput.addEventListener("input", () => {
              item[0] = nomeInput.value;
            });
            if (focarNova && emEdicao) focoEl = nomeInput;

            const subMeta = ui.elemento("small", [
              item[2] && item[2] !== "mensal" ? (item[2] === "anual" ? "Anual" : "Trimestral") : "",
              !catAtual ? cat : "",
            ].filter(Boolean).join(" · "), "etapas-modal-item-meta");
            subMeta.hidden = !subMeta.textContent;
            infoEsq.append(nomeInput, subMeta);

            const acoesDir = ui.elemento("div", undefined, "etapas-modal-item-acoes");
            const valorWrap = ui.elemento("label", undefined, "despesa-valor-wrap");
            valorWrap.append(ui.elemento("span", "R$", "despesa-moeda"));
            const inpVal = ui.elemento("input");
            inpVal.type = "text";
            inpVal.inputMode = "decimal";
            inpVal.setAttribute("aria-label", "Valor de " + (item[0] || "despesa"));
            inpVal.value = String(item[1] ?? 0).replace(".", ",");
            inpVal.addEventListener("focus", () => inpVal.select?.());
            inpVal.addEventListener("input", () => {
              const p = Number(String(inpVal.value).replace(",", ".").replace(/[^\d.-]/g, ""));
              if (Number.isFinite(p) && p >= 0) {
                inpVal.classList.remove("campo-invalido");
                item[1] = p;
                atualizarResumoModal();
              } else {
                inpVal.classList.add("campo-invalido");
              }
            });
            valorWrap.append(inpVal);

            const btnDet = ui.elemento("button", emEdicao ? "Fechar" : "Editar", "etapas-modal-link-btn");
            btnDet.type = "button";
            btnDet.addEventListener("click", () => {
              itemSelecionado = emEdicao ? null : item;
              renderizarLista();
            });

            const btnRem = ui.elemento("button", "×", "despesa-remover-btn");
            btnRem.type = "button";
            btnRem.title = "Remover despesa";
            btnRem.setAttribute("aria-label", "Remover " + (item[0] || "despesa"));
            btnRem.addEventListener("click", () => {
              const confirmar = typeof window !== "undefined" && typeof window.confirm === "function"
                ? window.confirm("Tem certeza que deseja remover \"" + (item[0] || "despesa") + "\"?")
                : true;
              if (!confirmar) return;
              const idxAtual = operacao.custos.indexOf(item);
              if (idxAtual < 0) return;
              operacao.custos.splice(idxAtual, 1);
              removido = { indice: idxAtual, item };
              if (itemSelecionado === item) itemSelecionado = null;
              txtDesfazer.textContent = "\"" + (item[0] || "Despesa") + "\" removida.";
              barraDesfazer.hidden = false;
              atualizarResumoModal();
              renderizarLista();
            });

            acoesDir.append(valorWrap, btnDet, btnRem);
            linhaTopo.append(infoEsq, acoesDir);
            linha.append(linhaTopo);

            if (emEdicao) {
              const detBox = ui.elemento("div", undefined, "etapas-modal-item-detalhes formulario-comercial");
              const selP = comercial.seletor("Periodicidade", periodos, item[2] ?? "mensal", (v) => {
                item[2] = v;
                atualizarResumoModal();
                return true;
              });
              const opCats = [
                ...baseCats.map((c) => [c, c]),
                ...(cat && !baseCats.includes(cat) && cat !== "Outros" ? [[cat, cat]] : []),
                ["Outros", "Outros"],
              ];
              const selC = comercial.seletor("Categoria", opCats, cat, (v) => {
                item[3] = v;
                atualizarResumoModal();
                if (catAtual && v !== catAtual) {
                  itemSelecionado = null;
                  renderizarLista();
                }
                return true;
              });
              const nota = ui.elemento("small",
                (item[2] ?? "mensal") === "mensal" ? "" : "Equivalente mensal: " + ui.brl(valorMensalItem()),
                "nota-equiv-gaveta");
              detBox.append(comercial.rotular("Periodicidade", selP), comercial.rotular("Categoria", selC), nota);
              linha.append(detBox);
            }
            return linha;
          }));

          if (focoEl) {
            focoEl.focus?.();
            focoEl.select?.();
          }
        }

        atualizarResumoModal();
        renderizarLista();
        container.append(resumoModal, barraAcoes, barraDesfazer, listaEl);
        return container;
      },
    });
  }

  /* Modal de Capacidade Operacional (Simulador seguro) */
  function abrirModalCapacidade(ancora) {
    let horasSimuladas = operacao.horas;

    abrirModalCustos({
      titulo: "Capacidade operacional",
      subtitulo: "Simulação de referência para o custo por hora",
      tamanho: "compacto",
      origemEl: ancora,
      modo: "edicao",
      textoConfirmar: "Aplicar referência",
      estaAlterado: () => Number.isFinite(horasSimuladas)
        && horasSimuladas > 0
        && Math.abs(horasSimuladas - operacao.horas) >= 0.01,
      aoConfirmar: () => {
        if (!Number.isFinite(horasSimuladas) || horasSimuladas <= 0) return;
        if (Math.abs(horasSimuladas - operacao.horas) < 0.001) return;
        operacao.horas = horasSimuladas;
        atualizar();
        ctx.status("Capacidade operacional atualizada para " + ui.numero(horasSimuladas) + " h/mês.");
      },
      montar: ({ adicionarAcaoEsquerda, definirConfirmarDesabilitado }) => {
        const container = ui.elemento("div", undefined, "pilha capacidade-modal-corpo");
        const total = Paisagismo.custos(operacao);
        const oficialHora = total.hora;

        const resumo = ui.elemento("div", undefined, "etapas-modal-resumo");
        const criarStat = (rot, valEl) => {
          const s = ui.elemento("div", undefined, "etapas-modal-stat");
          s.append(ui.elemento("small", rot), valEl);
          return s;
        };
        const statMensal = ui.elemento("strong", ui.brl(total.mensal));
        const statOficial = ui.elemento("strong", ui.numero(operacao.horas) + " h");
        const simHoraOut = ui.elemento("strong", ui.brl(oficialHora) + "/h", "capacidade-hora-simulada");
        const simVariacao = ui.elemento("strong", "0,0%", "capacidade-variacao");
        resumo.append(
          criarStat("Custo mensal atual", statMensal),
          criarStat("Capacidade oficial", statOficial),
          criarStat("Custo/hora simulado", simHoraOut),
          criarStat("Diferença", simVariacao),
        );

        const controle = ui.elemento("div", undefined, "capacidade-modal-controle");
        const controleTopo = ui.elemento("div", undefined, "capacidade-modal-controle-topo");
        controleTopo.append(ui.elemento("label", "Horas mensais de referência"));
        const simInputWrap = ui.elemento("div", undefined, "capacidade-input-wrap");
        const simInput = ui.elemento("input", undefined, "capacidade-input");
        simInput.type = "text";
        simInput.inputMode = "decimal";
        simInput.setAttribute("aria-label", "Horas mensais simuladas");
        simInput.value = String(operacao.horas).replace(".", ",");
        simInputWrap.append(simInput, ui.elemento("span", "h/mês"));
        controleTopo.append(simInputWrap);

        const simSlider = ui.elemento("input", undefined, "capacidade-slider");
        simSlider.type = "range";
        simSlider.min = "40";
        simSlider.max = "320";
        simSlider.step = "5";
        simSlider.value = String(Math.max(40, Math.min(320, operacao.horas)));
        simSlider.setAttribute("aria-label", "Simular horas mensais de referência");

        const escala = ui.elemento("div", undefined, "capacidade-modal-escala");
        escala.append(ui.elemento("span", "40 h"), ui.elemento("span", "180 h"), ui.elemento("span", "320 h"));

        const simComparativo = ui.elemento("p", "", "capacidade-comparativo");
        controle.append(controleTopo, simSlider, escala, simComparativo);

        const btnRestaurar = ui.botao("Restaurar", () => {
          horasSimuladas = operacao.horas;
          simInput.value = String(operacao.horas).replace(".", ",");
          simSlider.value = String(Math.max(40, Math.min(320, operacao.horas)));
          simInput.classList.remove("campo-invalido");
          atualizarSimulador();
        }, true);
        adicionarAcaoEsquerda(btnRestaurar);

        function atualizarSimulador() {
          const simValida = Number.isFinite(horasSimuladas) && horasSimuladas > 0;
          const simHora = simValida ? total.mensal / horasSimuladas : oficialHora;
          const alterada = simValida && Math.abs(horasSimuladas - operacao.horas) >= 0.01;
          simHoraOut.textContent = ui.brl(simHora) + "/h";

          if (!simValida) {
            simVariacao.textContent = "Inválido";
            simVariacao.dataset.estado = "atencao";
            simComparativo.textContent = "Informe uma capacidade mensal maior que zero.";
            btnRestaurar.disabled = false;
            definirConfirmarDesabilitado(true);
            return;
          }

          if (!alterada) {
            simVariacao.textContent = "0,0%";
            delete simVariacao.dataset.estado;
            simComparativo.textContent = "Referência oficial mantida em " + ui.brl(oficialHora) + "/h (" + ui.numero(operacao.horas) + " h/mês).";
            btnRestaurar.disabled = true;
            definirConfirmarDesabilitado(true);
          } else {
            const pctDiff = oficialHora > 0 ? ((simHora - oficialHora) / oficialHora) * 100 : 0;
            const sinal = pctDiff > 0 ? "+" : "";
            simVariacao.textContent = sinal + ui.percentual(pctDiff);
            simVariacao.dataset.estado = pctDiff < 0 ? "positivo" : "atencao";
            simComparativo.textContent = "Oficial: " + ui.brl(oficialHora) + "/h → Simulado: " + ui.brl(simHora) + "/h";
            btnRestaurar.disabled = false;
            definirConfirmarDesabilitado(false);
          }
        }

        simSlider.addEventListener("input", () => {
          horasSimuladas = Number(simSlider.value);
          simInput.value = String(horasSimuladas).replace(".", ",");
          simInput.classList.remove("campo-invalido");
          atualizarSimulador();
        });
        simInput.addEventListener("focus", () => simInput.select?.());
        simInput.addEventListener("input", () => {
          const parsed = Number(String(simInput.value).replace(",", ".").replace(/[^\d.]/g, ""));
          if (!Number.isFinite(parsed) || parsed <= 0) {
            horasSimuladas = NaN;
            simInput.classList.add("campo-invalido");
            atualizarSimulador();
            return;
          }
          simInput.classList.remove("campo-invalido");
          horasSimuladas = parsed;
          simSlider.value = String(Math.max(40, Math.min(320, parsed)));
          atualizarSimulador();
        });

        atualizarSimulador();
        container.append(resumo, controle);
        return container;
      },
    });
  }

  /* ==========================================================================
     Construção da página principal de Custos da operação
     ========================================================================== */
  const pagina = ui.elemento("div", undefined, "custos-pagina");
  function definirFocoCategoria(nomeCat) {
    if (nomeCat) pagina.dataset.categoriaFoco = nomeCat;
    else delete pagina.dataset.categoriaFoco;
  }

  /* Região 1: Cabeçalho financeiro botânico */
  const totalMensalHero = ui.elemento("strong", "R$ 0,00", "valor-financeiro");
  const indCustoHora = ui.elemento("strong", "R$ 0,00/h", "preco-indicador-valor");
  const indCustoAnual = ui.elemento("strong", "R$ 0,00", "preco-indicador-valor");
  const indCapacidade = ui.elemento("strong", "0 h", "preco-indicador-valor");
  const indDespesas = ui.elemento("strong", "0", "preco-indicador-valor");

  const criarInd = (titulo, el) => {
    const w = ui.elemento("div", undefined, "preco-indicador");
    w.append(ui.elemento("span", titulo, "preco-indicador-titulo"), el);
    return w;
  };
  const wrapHora = criarInd("Custo por hora", indCustoHora);
  const wrapAnual = criarInd("Custo anual", indCustoAnual);
  const wrapCap = ui.elemento("button", undefined, "preco-indicador preco-indicador-btn");
  wrapCap.type = "button";
  wrapCap.setAttribute("aria-haspopup", "dialog");
  wrapCap.setAttribute("aria-label", "Capacidade mensal: ajustar referência");
  wrapCap.title = "Simular e ajustar capacidade mensal";
  const capTituloWrap = ui.elemento("span", undefined, "preco-indicador-titulo-wrap");
  const capEditIcon = ui.elemento("span", "✎", "preco-indicador-edit");
  capEditIcon.setAttribute("aria-hidden", "true");
  capTituloWrap.append(ui.elemento("span", "Capacidade mensal", "preco-indicador-titulo"), capEditIcon);
  wrapCap.append(capTituloWrap, indCapacidade);
  wrapCap.addEventListener("click", () => abrirModalCapacidade(wrapCap));
  const wrapDesp = criarInd("Despesas cadastradas", indDespesas);

  const btnTodas = ui.botao("Ver despesas (0)", () => abrirModalCategoria(btnTodas, ""), true);
  const btnEvolucao = ui.botao("Evolução mensal", () => {
    abrirModalCustos({
      titulo: "Evolução mensal",
      subtitulo: "Histórico de custos operacionais",
      tamanho: "padrao",
      origemEl: btnEvolucao,
      modo: "consulta",
      montar: () => construirPainelEvolucao(),
    });
  }, true);
  const btnRegistrarMes = ui.botao("Registrar mês atual", () => registrarMes());
  btnRegistrarMes.classList.add("orcamento-salvar-destaque");

  const acoesHero = ui.elemento("div", undefined, "acoes orcamento-acoes");
  acoesHero.append(btnTodas, btnEvolucao, btnRegistrarMes);

  const headerCustos = bot
    ? bot.OrganicSurface("header", "botanical-luxury-hero orcamento-painel-hero custos-painel-hero")
    : ui.elemento("header", undefined, "botanical-luxury-hero custos-painel-hero");
  if (bot) {
    const ramo = bot.BotanicalBranch("luxury");
    headerCustos.append(bot.LeafShadow(), bot.OrganicPattern(), ramo);
    bot.ativarAmbienteBotanico?.(headerCustos, ramo);
  }
  const heroConteudo = ui.elemento("div", undefined, "orcamento-hero-conteudo");
  const heroTopo = ui.elemento("div", undefined, "orcamento-hero-topo");
  heroTopo.append(ui.elemento("h1", "Custos da operação"));
  const heroPrincipal = ui.elemento("div", undefined, "orcamento-hero-principal");
  heroPrincipal.append(ui.elemento("span", "Custo mensal da operação", "orcamento-hero-rotulo"), totalMensalHero);
  const heroRodape = ui.elemento("div", undefined, "orcamento-hero-rodape");
  const heroIndicadores = ui.elemento("div", undefined, "orcamento-hero-indicadores custos-hero-indicadores");
  heroIndicadores.append(wrapHora, wrapAnual, wrapCap, wrapDesp);
  heroRodape.append(heroIndicadores, acoesHero);
  heroConteudo.append(heroTopo, heroPrincipal, heroRodape);
  headerCustos.append(heroConteudo);

  /* Região 2: 4 Cards horizontais de categorias */
  const gradeCards = ui.elemento("section", undefined, "custos-categorias-grid");
  gradeCards.setAttribute("aria-label", "Categorias de custos");
  const cardsMapa = new Map();

  function obterOuCriarCard(grupo, indice) {
    if (cardsMapa.has(grupo.nome)) return cardsMapa.get(grupo.nome);
    const card = ui.elemento("button", undefined, "cartao card-fase-jornada card-categoria-jornada");
    card.type = "button";
    card.dataset.categoria = grupo.nome;
    card.dataset.tema = grupo.tema;
    card.setAttribute("style", "--cor-fase:" + grupo.cor + ";--atraso-card:" + (indice * 55) + "ms");
    card.setAttribute("aria-haspopup", "dialog");
    card.addEventListener("click", () => abrirModalCategoria(card, grupo.nome));
    card.addEventListener("pointerenter", () => definirFocoCategoria(grupo.nome));
    card.addEventListener("pointerleave", () => definirFocoCategoria(""));
    card.addEventListener("focusin", () => definirFocoCategoria(grupo.nome));
    card.addEventListener("focusout", () => definirFocoCategoria(""));

    const topoCard = ui.elemento("div", undefined, "fase-jornada-topo");
    const nomeEl = ui.elemento("h2", grupo.nome, "fase-jornada-nome");
    const editIcon = ui.elemento("span", "✎", "fase-jornada-edit");
    editIcon.setAttribute("aria-hidden", "true");
    topoCard.append(nomeEl, editIcon);

    const valorEl = ui.elemento("strong", "R$ 0,00", "fase-jornada-horas valor-financeiro");
    const metaGrid = ui.elemento("div", undefined, "fase-jornada-meta");
    const qtdEl = ui.elemento("small", "0 despesas", "fase-jornada-ativ");
    const pctEl = ui.elemento("small", "0% do total", "fase-jornada-pct");
    metaGrid.append(qtdEl, pctEl);

    const trilha = ui.elemento("div", undefined, "trilha-ranking trilha-fina");
    const barra = ui.elemento("div", undefined, "barra-preenchimento");
    trilha.append(barra);

    const ilustra = ui.elemento("span", undefined, "fase-jornada-ilustracao");
    ilustra.append(ilustrarCategoria(grupo.nome));

    card.append(topoCard, valorEl, metaGrid, trilha, ilustra);
    const ref = { card, valorEl, qtdEl, pctEl, barra, cor: grupo.cor };
    cardsMapa.set(grupo.nome, ref);
    return ref;
  }

  /* Região 3: Composição dos custos (60%) + Maiores despesas individuais (40%) */
  const roscaSvgWrap = ui.elemento("div", undefined, "rosca-svg-wrap");
  const mioloRotulo = ui.elemento("small", "Custo mensal");
  const mioloValor = ui.elemento("strong", "R$ 0,00");
  const mioloHora = ui.elemento("span", "R$ 0,00/h");
  const miolo = ui.elemento("div", undefined, "miolo-rosca-svg");
  miolo.append(mioloRotulo, mioloValor, mioloHora);
  const tabelaComposicao = ui.elemento("div", undefined, "composicao-tabela");

  const blocoComposicao = ui.elemento("section", undefined, "cartao card-composicao-custos");
  const compGrade = ui.elemento("div", undefined, "composicao-custos-grade");
  const colRosca = ui.elemento("div", undefined, "bloco-rosca-svg");
  colRosca.append(roscaSvgWrap, miolo);
  compGrade.append(colRosca, tabelaComposicao);
  blocoComposicao.append(ui.elemento("h2", "Composição dos custos"), compGrade);

  const ranking = ui.elemento("div", undefined, "ranking-barras etapas-ranking-atividades");
  const blocoRanking = ui.elemento("section", undefined, "cartao card-maiores-atividades");
  blocoRanking.append(ui.elemento("h2", "Maiores despesas individuais"), ranking);

  const analiseGrade = ui.elemento("div", undefined, "custos-analise-grade");
  analiseGrade.append(blocoComposicao, blocoRanking);

  let inicializado = false;
  let mensalAtual = null;
  let rafMensal = null;

  function animarMensalSuave(destino) {
    const reduzido = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!inicializado || reduzido || typeof window === "undefined"
      || typeof window.requestAnimationFrame !== "function" || !Number.isFinite(mensalAtual)) {
      mensalAtual = destino;
      ui.mostrarValor(totalMensalHero, ui.brl(destino));
      return;
    }
    if (Math.abs(destino - mensalAtual) < 0.005) {
      mensalAtual = destino;
      ui.mostrarValor(totalMensalHero, ui.brl(destino));
      return;
    }
    if (rafMensal) window.cancelAnimationFrame?.(rafMensal);
    const ini = mensalAtual;
    const t0 = performance.now();
    const dur = 290;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      totalMensalHero.textContent = ui.brl(ini + (destino - ini) * eased);
      if (p < 1) rafMensal = window.requestAnimationFrame(step);
      else {
        mensalAtual = destino;
        ui.mostrarValor(totalMensalHero, ui.brl(destino));
        rafMensal = null;
      }
    };
    rafMensal = window.requestAnimationFrame(step);
  }

  function pulsarSeMudou(wrap, el, novoTexto) {
    if (inicializado && el.textContent !== novoTexto && wrap?.classList) {
      wrap.classList.remove("ind-atualizado");
      void wrap.offsetWidth;
      wrap.classList.add("ind-atualizado");
    }
    el.textContent = novoTexto;
  }

  const exibir = () => {
    const total = Paisagismo.custos(operacao);
    animarMensalSuave(total.mensal);
    pulsarSeMudou(wrapHora, indCustoHora, ui.brl(total.hora) + "/h");
    pulsarSeMudou(wrapAnual, indCustoAnual, ui.brl(total.anual));
    pulsarSeMudou(wrapCap, indCapacidade, ui.numero(operacao.horas) + " h");
    pulsarSeMudou(wrapDesp, indDespesas, String(operacao.custos.length));
    btnTodas.textContent = "Ver despesas (" + operacao.custos.length + ")";

    const itensMensais = itensMensaisAtuais();
    const grupos = agruparCategorias(itensMensais);
    const baseMensal = Math.max(0.01, total.mensal);
    const horasRef = Math.max(0.01, operacao.horas);

    gradeCards.replaceChildren(...grupos.map((g, idx) => {
      const ref = obterOuCriarCard(g, idx);
      const pct = total.mensal > 0 ? Math.round((g.valorMensal / baseMensal) * 100) : 0;
      ui.mostrarValor(ref.valorEl, ui.brl(g.valorMensal));
      ref.qtdEl.textContent = g.quantidade + (g.quantidade === 1 ? " despesa" : " despesas");
      ref.pctEl.textContent = pct + "% do total";
      ref.barra.setAttribute("style", "width:" + (g.valorMensal > 0 ? Math.max(4, pct) : 0) + "%;background:" + ref.cor);
      return ref.card;
    }));

    /* Rosca SVG interativa com centro dinâmico */
    const ordenados = [...grupos].sort((a, b) => b.valorMensal - a.valorMensal);
    const resetMiolo = () => {
      mioloRotulo.textContent = "Custo mensal";
      mioloValor.textContent = ui.brl(total.mensal);
      mioloHora.textContent = ui.brl(total.hora) + "/h";
    };
    resetMiolo();

    const ativos = ordenados.filter((g) => g.valorMensal > 0);
    if (typeof document.createElementNS === "function") {
      const r = 82;
      const circ = 2 * Math.PI * r;
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 200 200");
      svg.setAttribute("class", "rosca-svg-el");
      svg.setAttribute("aria-label", "Gráfico de composição dos custos");

      const trilhaFundo = document.createElementNS(SVG_NS, "circle");
      trilhaFundo.setAttribute("cx", "100");
      trilhaFundo.setAttribute("cy", "100");
      trilhaFundo.setAttribute("r", String(r));
      trilhaFundo.setAttribute("fill", "none");
      trilhaFundo.setAttribute("stroke", "#eceae0");
      trilhaFundo.setAttribute("stroke-width", "18");
      svg.append(trilhaFundo);

      let acumulado = 0;
      for (const g of ativos) {
        const fracao = g.valorMensal / baseMensal;
        const gap = ativos.length > 1 ? 3 : 0;
        const len = Math.max(2, fracao * circ - gap);
        const seg = document.createElementNS(SVG_NS, "circle");
        seg.setAttribute("cx", "100");
        seg.setAttribute("cy", "100");
        seg.setAttribute("r", String(r));
        seg.setAttribute("fill", "none");
        seg.setAttribute("stroke", g.cor);
        seg.setAttribute("stroke-width", "18");
        seg.setAttribute("stroke-dasharray", `${len.toFixed(2)} ${(circ - len).toFixed(2)}`);
        seg.setAttribute("stroke-dashoffset", String((-acumulado * circ).toFixed(2)));
        seg.setAttribute("class", "rosca-fatia");
        seg.dataset.categoria = g.nome;
        seg.setAttribute("tabindex", "0");
        seg.setAttribute("aria-label", g.nome + ": " + ui.brl(g.valorMensal) + " (" + Math.round(fracao * 100) + "%)");

        const ativarCat = () => {
          definirFocoCategoria(g.nome);
          mioloRotulo.textContent = g.nome;
          mioloValor.textContent = ui.brl(g.valorMensal);
          mioloHora.textContent = ui.brl(g.valorMensal / horasRef) + "/h";
        };
        const desativarCat = () => {
          definirFocoCategoria("");
          resetMiolo();
        };
        seg.addEventListener("pointerenter", ativarCat);
        seg.addEventListener("pointerleave", desativarCat);
        seg.addEventListener("focus", ativarCat);
        seg.addEventListener("blur", desativarCat);
        seg.addEventListener("click", () => {
          const ref = cardsMapa.get(g.nome);
          abrirModalCategoria(ref?.card || seg, g.nome);
        });
        svg.append(seg);
        acumulado += fracao;
      }
      roscaSvgWrap.replaceChildren(svg);
    }

    /* Tabela limpa de Composição dos custos */
    const headerTab = ui.elemento("div", undefined, "composicao-tabela-topo");
    headerTab.append(
      ui.elemento("span", "Categoria"),
      ui.elemento("span", "Valor mensal"),
      ui.elemento("span", "Impacto/h"),
      ui.elemento("span", "Participação"),
    );
    tabelaComposicao.replaceChildren(headerTab, ...ordenados.map((g) => {
      const pct = total.mensal > 0 ? Math.round((g.valorMensal / baseMensal) * 100) : 0;
      const row = ui.elemento("button", undefined, "composicao-tabela-linha");
      row.type = "button";
      row.dataset.categoria = g.nome;
      const catCell = ui.elemento("span", undefined, "rotulo-com-ponto");
      const ponto = ui.elemento("i");
      ponto.setAttribute("style", "background:" + g.cor);
      catCell.append(ponto, g.nome);
      row.append(
        catCell,
        ui.elemento("strong", ui.brl(g.valorMensal)),
        ui.elemento("small", ui.brl(g.valorMensal / horasRef) + "/h"),
        ui.elemento("small", pct + "%"),
      );
      row.addEventListener("pointerenter", () => {
        definirFocoCategoria(g.nome);
        mioloRotulo.textContent = g.nome;
        mioloValor.textContent = ui.brl(g.valorMensal);
        mioloHora.textContent = ui.brl(g.valorMensal / horasRef) + "/h";
      });
      row.addEventListener("pointerleave", () => {
        definirFocoCategoria("");
        resetMiolo();
      });
      row.addEventListener("click", () => {
        const ref = cardsMapa.get(g.nome);
        abrirModalCategoria(ref?.card || row, g.nome);
      });
      return row;
    }));

    /* Maiores despesas individuais (Top 5, cor da categoria, clicável) */
    const maiores = [...itensMensais]
      .sort((a, b) => b.valorMensal - a.valorMensal)
      .slice(0, 5);
    ranking.replaceChildren(...(maiores.length ? maiores.map(({ item, nome, valorMensal, categoria }) => {
      const pct = total.mensal > 0 ? Math.min(100, Math.round((valorMensal / baseMensal) * 100)) : 0;
      const corCat = coresCategoria[categoria] || "#275b44";
      const btnItem = ui.elemento("button", undefined, "item-ranking item-ranking-btn");
      btnItem.type = "button";
      btnItem.dataset.categoria = categoria;
      btnItem.title = nome + " (" + categoria + " · " + ui.brl(valorMensal) + " · " + pct + "%) — Clique para editar";
      const topo = ui.elemento("div", undefined, "topo-ranking");
      const esq = ui.elemento("span", undefined, "ranking-nome-wrap");
      const ponto = ui.elemento("i", undefined, "ranking-fase-ponto");
      ponto.setAttribute("style", "background:" + corCat);
      const txtWrap = ui.elemento("span", undefined, "ranking-texto-duplo");
      txtWrap.append(ui.elemento("span", nome, "ranking-nome-texto"), ui.elemento("small", categoria, "ranking-cat-sub"));
      esq.append(ponto, txtWrap);
      topo.append(esq, ui.elemento("strong", ui.brl(valorMensal) + " · " + pct + "%"));
      const trilha = ui.elemento("div", undefined, "trilha-ranking");
      const barra = ui.elemento("div", undefined, "barra-preenchimento");
      barra.setAttribute("style", "width:" + (valorMensal > 0 ? Math.max(4, pct) : 0) + "%;background:" + corCat);
      trilha.append(barra);
      btnItem.append(topo, trilha);
      btnItem.addEventListener("pointerenter", () => definirFocoCategoria(categoria));
      btnItem.addEventListener("pointerleave", () => definirFocoCategoria(""));
      btnItem.addEventListener("click", () => abrirModalDespesa(item, btnItem));
      return btnItem;
    }) : [ui.elemento("p", "Cadastre despesas para visualizar os maiores custos.")]));

    inicializado = true;
  };

  const atualizar = ctx.aoAlterar(exibir);
  exibir();

  pagina.append(headerCustos, gradeCards, analiseGrade);
  return [pagina];
};
