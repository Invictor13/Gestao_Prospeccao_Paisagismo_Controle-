Paisagismo.telaEtapas = (ctx) => {
  const ui = Paisagismo.ui;
  const bot = Paisagismo.botanica;
  const etapas = ctx.dados.projeto.etapa;
  const valorHora = Paisagismo.custos(ctx.dados.operacao).hora;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const fasesDef = [
    { codigo: "Fase 01", nome: "Levantamento", cor: "#1e4a38", tema: "levantamento", desc: "Briefing, orçamento e coleta em campo" },
    { codigo: "Fase 02", nome: "Pré-projeto", cor: "#4d7852", tema: "preprojeto", desc: "Estudo conceitual e pré-executivo" },
    { codigo: "Fase 03", nome: "Executivo & 3D", cor: "#5a7566", tema: "executivo", desc: "Modelagem, projeto executivo e render" },
    { codigo: "Fase 04", nome: "Finalização", cor: "#a8833e", tema: "finalizacao", desc: "Revisões finais, polimento e entrega" },
  ];
  const coresFase = Object.fromEntries(fasesDef.map((f) => [f.nome, f.cor]));

  function faseDaEtapa(nome) {
    const t = String(nome || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    if (/fechamento|briefing|referencia|campo|levantamento|visita/.test(t)) return "Levantamento";
    if (/pre-projeto|pre-executivo|conceito|estudo/.test(t)) return "Pré-projeto";
    if (/polimento|detalhamento|entrega|revisao|orientac|reunioes.*executivo|alteracoes.*executivo/.test(t)) return "Finalização";
    if (/modelagem|3d|executivo|render/.test(t)) return "Executivo & 3D";
    return "Finalização";
  }

  function agruparFases() {
    const mapa = new Map(fasesDef.map((f) => [f.nome, { ...f, horas: 0, quantidade: 0, entregaveis: 0 }]));
    for (const item of etapas) {
      const grupo = mapa.get(faseDaEtapa(item[0]));
      grupo.horas += Number(item[1]) || 0;
      grupo.quantidade += 1;
      if (item[4] === true) grupo.entregaveis += 1;
    }
    return [...mapa.values()];
  }

  /* Arredondamento pelo método do maior resto (sempre soma 100% quando há horas) */
  function percentuaisConsistentes(valores) {
    const soma = valores.reduce((s, v) => s + v, 0);
    if (soma <= 0) return valores.map(() => 0);
    const exatos = valores.map((v, idx) => {
      const bruto = (v / soma) * 100;
      const piso = Math.floor(bruto);
      return { idx, piso, resto: bruto - piso };
    });
    const falta = 100 - exatos.reduce((s, item) => s + item.piso, 0);
    const ordenados = [...exatos].sort((a, b) => b.resto - a.resto);
    for (let i = 0; i < falta; i++) ordenados[i].piso += 1;
    return exatos.map((item) => item.piso);
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

  function ilustrarFase(nome) {
    const s = { stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" };
    if (nome === "Levantamento") {
      return criarSvg("0 0 120 100", [
        { ...s, d: "M10 82 C32 66, 56 76, 84 54 C98 44, 108 42, 114 44" },
        { ...s, d: "M16 92 C42 78, 66 86, 110 62", "stroke-opacity": "0.5" },
        { ...s, d: "M24 66 C44 54, 62 58, 92 40", "stroke-opacity": "0.35" },
        { ...s, tag: "circle", cx: "66", cy: "36", r: "17", fill: "currentColor", "fill-opacity": "0.08" },
        { ...s, d: "M66 19v34M49 36h34", "stroke-opacity": "0.45" },
        { tag: "circle", cx: "66", cy: "36", r: "4", fill: "currentColor" },
      ], "fase-ilustracao-svg");
    }
    if (nome === "Pré-projeto") {
      return criarSvg("0 0 120 100", [
        { ...s, d: "M18 82 C44 58, 72 68, 104 28", "stroke-opacity": "0.4" },
        { ...s, d: "M34 38 C52 20, 78 24, 84 44 C64 52, 44 48, 34 38 Z", fill: "currentColor", "fill-opacity": "0.14" },
        { ...s, d: "M34 38 Q58 36 80 42", "stroke-opacity": "0.55" },
        { ...s, d: "M56 78 L98 28 L106 36 L64 86 L50 88 Z", fill: "currentColor", "fill-opacity": "0.08" },
        { ...s, d: "M90 38 L98 46" },
      ], "fase-ilustracao-svg");
    }
    if (nome === "Executivo & 3D") {
      return criarSvg("0 0 120 100", [
        { ...s, d: "M62 16 L98 35 L62 54 L26 35 Z", fill: "currentColor", "fill-opacity": "0.13" },
        { ...s, d: "M26 35 V68 L62 88 V54" },
        { ...s, d: "M98 35 V68 L62 88" },
        { ...s, d: "M44 26 L80 45", "stroke-opacity": "0.42" },
        { ...s, d: "M80 26 L44 45", "stroke-opacity": "0.42" },
        { ...s, d: "M18 78 H40 M84 78 H108", "stroke-opacity": "0.35" },
      ], "fase-ilustracao-svg");
    }
    return criarSvg("0 0 120 100", [
      { ...s, tag: "circle", cx: "64", cy: "44", r: "23", fill: "currentColor", "fill-opacity": "0.1" },
      { ...s, tag: "circle", cx: "64", cy: "44", r: "16", "stroke-opacity": "0.4" },
      { ...s, d: "M54 44.5 L61 51.5 L75 37" },
      { ...s, d: "M50 64 L44 88 L64 78 L84 88 L78 64" },
      { ...s, d: "M22 68 C26 52, 36 42, 42 36", "stroke-opacity": "0.45" },
    ], "fase-ilustracao-svg");
  }

  /* Sistema unificado de modal contextual (padrão Orçamento) */
  let modalAtivo = null;
  function abrirModalEtapas({
    titulo,
    subtitulo = "",
    tamanho = "padrao",
    origemEl = null,
    modo = "edicao",
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

    const conteudo = montar({
      fecharConfirmando: () => fechar(true, false),
      fecharCancelando: () => fechar(false, false),
      adicionarAcaoEsquerda: (el) => acoesExtras.push(el),
      atualizarTitulo: (novoTit, novoSub = "") => {
        topoTexto.children[0].textContent = novoTit;
        if (topoTexto.children[1]) topoTexto.children[1].textContent = novoSub;
      },
    });
    corpo.append(conteudo);

    for (const el of acoesExtras) rodape.append(el);
    if (modo === "consulta") {
      grupoDireita.append(ui.botao("Fechar", () => fechar(true, false)));
    } else {
      grupoDireita.append(
        ui.botao("Cancelar", () => fechar(false, false), true),
        ui.botao("Confirmar", () => fechar(true, false)),
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

  function criarCampoDuracao(valorInicial, aoMudar) {
    const wrap = ui.elemento("div", undefined, "etapa-duracao-stepper");
    const btnMenos = ui.elemento("button", "−", "etapa-stepper-btn");
    btnMenos.type = "button";
    btnMenos.setAttribute("aria-label", "Diminuir duração");

    const input = ui.elemento("input", undefined, "etapa-stepper-input");
    input.type = "text";
    input.inputMode = "decimal";
    input.setAttribute("aria-label", "Duração (h)");
    input.value = String(valorInicial ?? 0).replace(".", ",");

    const btnMais = ui.elemento("button", "+", "etapa-stepper-btn");
    btnMais.type = "button";
    btnMais.setAttribute("aria-label", "Aumentar duração");

    const aplicar = (novo) => {
      const arredondado = Math.max(0, Math.round(novo * 100) / 100);
      if (aoMudar(arredondado)) {
        input.classList.remove("campo-invalido");
        input.value = String(arredondado).replace(".", ",");
        return true;
      }
      input.classList.add("campo-invalido");
      return false;
    };

    btnMenos.addEventListener("click", () => {
      const atual = Number(String(input.value).replace(",", ".")) || 0;
      const passo = atual > 1 ? 1 : 0.5;
      aplicar(Math.max(0, atual - passo));
    });
    btnMais.addEventListener("click", () => {
      const atual = Number(String(input.value).replace(",", ".")) || 0;
      const passo = atual < 1 ? 0.5 : 1;
      aplicar(atual + passo);
    });
    input.addEventListener("focus", () => input.select?.());
    input.addEventListener("input", () => {
      const parsed = Number(String(input.value).replace(",", ".").replace(/[^\d.]/g, ""));
      if (!Number.isFinite(parsed) || parsed < 0 || !aoMudar(parsed)) {
        input.classList.add("campo-invalido");
      } else {
        input.classList.remove("campo-invalido");
      }
    });

    wrap.append(btnMenos, input, ui.elemento("span", "h", "etapa-stepper-unid"), btnMais);
    return wrap;
  }

  /* Modal individual de Atividade (usado no ranking e em Ver atividades) */
  function abrirModalAtividade(item, ancora) {
    const snapshot = item.slice();
    abrirModalEtapas({
      titulo: item[0] || "Editar atividade",
      subtitulo: faseDaEtapa(item[0]),
      tamanho: "compacto",
      origemEl: ancora,
      modo: "edicao",
      estaAlterado: () => JSON.stringify(item) !== JSON.stringify(snapshot),
      aoConfirmar: () => atualizar(),
      aoCancelar: () => {
        item.splice(0, item.length, ...snapshot);
        atualizar();
      },
      montar: ({ atualizarTitulo }) => montarEditorAtividade(item, atualizarTitulo),
    });
  }

  function montarEditorAtividade(item, atualizarTitulo) {
    const grade = ui.elemento("div", undefined, "formulario-comercial");
    const campoNome = ui.campo("Nome da atividade", item[0], (v) => {
      item[0] = v;
      atualizarTitulo?.(v || "Editar atividade", faseDaEtapa(v));
      return true;
    });
    campoNome.classList.add("campo-completo");

    const blocoDuracao = ui.elemento("div", undefined, "campo");
    blocoDuracao.append(
      ui.elemento("span", "Duração estimada"),
      criarCampoDuracao(item[1], (v) => {
        item[1] = v;
        custoPrevEl.textContent = ui.brl((Number(item[1]) || 0) * valorHora);
        return true;
      }),
    );

    const campoResp = ui.campo("Responsável", item[3] ?? "", (v) => {
      item[3] = v;
      return true;
    });
    const campoDesc = ui.campo("Descrição para a proposta", item[2] ?? "", (v) => {
      item[2] = v;
      return true;
    }, "longo");
    campoDesc.classList.add("campo-completo");

    const chkPublico = ui.elemento("input");
    chkPublico.type = "checkbox";
    chkPublico.checked = item[4] === true;
    chkPublico.addEventListener("change", () => {
      item[4] = chkPublico.checked;
    });
    const rotuloPub = Paisagismo.telasComerciais.rotular("Incluir entre os entregáveis da proposta", chkPublico);
    rotuloPub.classList.add("campo-completo", "campo-check-inline");

    const previaWrap = ui.elemento("div", undefined, "etapa-atividade-previa");
    const custoPrevEl = ui.elemento("strong", ui.brl((Number(item[1]) || 0) * valorHora));
    previaWrap.append(ui.elemento("small", "Custo estimado desta atividade"), custoPrevEl);

    grade.append(campoNome, blocoDuracao, campoResp, campoDesc, rotuloPub, previaWrap);
    return grade;
  }

  /* Modal completo da Fase (Abas: Atividades | Entregáveis) */
  function abrirModalFase(ancora, faseNome) {
    const infoFase = fasesDef.find((f) => f.nome === faseNome) || fasesDef[0];
    const snapshot = structuredClone(etapas);
    let abaAtiva = "atividades";
    let atividadeEditando = null;
    let termoBusca = "";
    let removido = null;
    const normalizar = (t) => String(t || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    abrirModalEtapas({
      titulo: infoFase.codigo + " · " + infoFase.nome,
      subtitulo: infoFase.desc,
      tamanho: "padrao",
      origemEl: ancora,
      modo: "edicao",
      estaAlterado: () => JSON.stringify(etapas) !== JSON.stringify(snapshot),
      aoConfirmar: () => atualizar(),
      aoCancelar: () => {
        etapas.splice(0, etapas.length, ...snapshot);
        atualizar();
      },
      montar: ({ adicionarAcaoEsquerda }) => {
        const container = ui.elemento("div", undefined, "etapas-modal-fase");

        /* Prévia de impacto financeiro e operacional da fase */
        const resumoModal = ui.elemento("div", undefined, "etapas-modal-resumo");
        const mHoras = ui.elemento("strong", "0 h");
        const mCusto = ui.elemento("strong", "R$ 0,00");
        const mAtiv = ui.elemento("strong", "0");
        const mEnt = ui.elemento("strong", "0");
        const criarStat = (rot, el) => {
          const s = ui.elemento("div", undefined, "etapas-modal-stat");
          s.append(ui.elemento("small", rot), el);
          return s;
        };
        resumoModal.append(
          criarStat("Horas da fase", mHoras),
          criarStat("Custo estimado", mCusto),
          criarStat("Atividades", mAtiv),
          criarStat("Entregáveis", mEnt),
        );

        /* Controle segmentado: Atividades | Entregáveis */
        const navAbas = ui.elemento("div", undefined, "grupos-comerciais etapas-modal-abas");
        navAbas.setAttribute("role", "tablist");
        const btnAbaAtiv = ui.elemento("button", "Atividades", undefined);
        const btnAbaEnt = ui.elemento("button", "Entregáveis", undefined);
        btnAbaAtiv.type = "button";
        btnAbaEnt.type = "button";
        btnAbaAtiv.setAttribute("role", "tab");
        btnAbaEnt.setAttribute("role", "tab");
        navAbas.append(btnAbaAtiv, btnAbaEnt);

        const barraAcoes = ui.elemento("div", undefined, "etapas-modal-barra");
        const campoBusca = ui.elemento("input", undefined, "gaveta-input-busca");
        campoBusca.type = "search";
        campoBusca.placeholder = "Filtrar atividades...";
        campoBusca.setAttribute("aria-label", "Filtrar atividades da fase");
        campoBusca.addEventListener("input", () => {
          termoBusca = normalizar(campoBusca.value.trim());
          renderizarConteudo();
        });

        const nomesSugestao = {
          "Levantamento": "Novo levantamento",
          "Pré-projeto": "Nova etapa do pré-projeto",
          "Executivo & 3D": "Nova etapa executivo 3D",
          "Finalização": "Nova revisão e entrega",
        };
        const btnAdd = ui.botao("+ Adicionar atividade", () => {
          const ehEntregavel = abaAtiva === "entregaveis";
          const nova = [nomesSugestao[faseNome] || "Nova atividade", 1, "", "", ehEntregavel];
          etapas.push(nova);
          termoBusca = "";
          campoBusca.value = "";
          atividadeEditando = nova;
          atualizarResumoModal();
          renderizarConteudo(true);
        }, true);
        barraAcoes.append(campoBusca, btnAdd);

        const barraDesfazer = ui.elemento("div", undefined, "gaveta-desfazer");
        barraDesfazer.hidden = true;
        const txtDesfazer = ui.elemento("span", "Atividade removida.");
        const btnDesfazer = ui.botao("Desfazer", () => {
          if (!removido) return;
          etapas.splice(removido.indice, 0, removido.item);
          removido = null;
          barraDesfazer.hidden = true;
          atualizarResumoModal();
          renderizarConteudo();
        }, true);
        barraDesfazer.append(txtDesfazer, btnDesfazer);

        const listaBox = ui.elemento("div", undefined, "etapas-modal-lista");

        function atualizarResumoModal() {
          const doGrupo = etapas.filter((it) => faseDaEtapa(it[0]) === faseNome);
          const h = doGrupo.reduce((s, [, hrs]) => s + (Number(hrs) || 0), 0);
          const ent = doGrupo.filter((it) => it[4] === true).length;
          mHoras.textContent = ui.numero(h) + " h";
          mCusto.textContent = ui.brl(h * valorHora);
          mAtiv.textContent = String(doGrupo.length);
          mEnt.textContent = String(ent);
          btnAbaAtiv.textContent = "Atividades (" + doGrupo.length + ")";
          btnAbaEnt.textContent = "Entregáveis (" + ent + ")";
        }

        function alternarAba(novaAba) {
          abaAtiva = novaAba;
          atividadeEditando = null;
          btnAbaAtiv.setAttribute("aria-pressed", String(abaAtiva === "atividades"));
          btnAbaEnt.setAttribute("aria-pressed", String(abaAtiva === "entregaveis"));
          listaBox.classList.remove("aba-comercial-entrando");
          void listaBox.offsetWidth;
          listaBox.classList.add("aba-comercial-entrando");
          renderizarConteudo();
        }
        btnAbaAtiv.addEventListener("click", () => alternarAba("atividades"));
        btnAbaEnt.addEventListener("click", () => alternarAba("entregaveis"));

        function renderizarConteudo(focarNova = false) {
          const doGrupo = etapas
            .map((item, indice) => ({ item, indice }))
            .filter(({ item }) => {
              if (faseDaEtapa(item[0]) !== faseNome) return false;
              if (abaAtiva === "entregaveis" && item[4] !== true) return false;
              if (termoBusca && !normalizar(item[0] + " " + (item[3] || "")).includes(termoBusca)) return false;
              return true;
            });

          if (!doGrupo.length) {
            listaBox.replaceChildren(ui.elemento("p",
              abaAtiva === "entregaveis"
                ? "Nenhum entregável marcado nesta fase. Marque uma atividade como entregável ou adicione um novo item."
                : termoBusca
                  ? "Nenhuma atividade encontrada para essa busca."
                  : "Nenhuma atividade cadastrada nesta fase.",
              "gaveta-vazio"));
            return;
          }

          let focoEl = null;
          listaBox.replaceChildren(...doGrupo.map(({ item, indice }) => {
            const emEdicao = atividadeEditando === item;
            const linha = ui.elemento("div", undefined, "etapas-modal-item");
            if (emEdicao) linha.dataset.aberta = "true";

            const linhaTopo = ui.elemento("div", undefined, "etapas-modal-item-topo");
            const infoEsq = ui.elemento("div", undefined, "etapas-modal-item-info");
            const nomeInput = ui.elemento("input", undefined, "etapas-modal-nome-input");
            nomeInput.type = "text";
            nomeInput.value = item[0] || "";
            nomeInput.setAttribute("aria-label", "Nome da atividade");
            nomeInput.addEventListener("input", () => {
              item[0] = nomeInput.value;
              atualizarResumoModal();
            });
            if (focarNova && emEdicao) focoEl = nomeInput;

            const subMeta = ui.elemento("small", [
              item[4] === true ? "Entregável" : "",
              item[3] || "",
            ].filter(Boolean).join(" · "), "etapas-modal-item-meta");
            subMeta.hidden = !subMeta.textContent;
            infoEsq.append(nomeInput, subMeta);

            const acoesDir = ui.elemento("div", undefined, "etapas-modal-item-acoes");
            const duracaoCtrl = criarCampoDuracao(item[1], (v) => {
              item[1] = v;
              atualizarResumoModal();
              return true;
            });

            const btnDetalhes = ui.elemento("button", emEdicao ? "Fechar" : "Detalhes", "etapas-modal-link-btn");
            btnDetalhes.type = "button";
            btnDetalhes.addEventListener("click", () => {
              atividadeEditando = emEdicao ? null : item;
              renderizarConteudo();
            });

            const btnRem = ui.elemento("button", "×", "despesa-remover-btn");
            btnRem.type = "button";
            btnRem.title = "Remover atividade";
            btnRem.setAttribute("aria-label", "Remover " + (item[0] || "atividade"));
            btnRem.addEventListener("click", () => {
              const idxAtual = etapas.indexOf(item);
              if (idxAtual < 0) return;
              etapas.splice(idxAtual, 1);
              removido = { indice: idxAtual, item };
              if (atividadeEditando === item) atividadeEditando = null;
              txtDesfazer.textContent = "\"" + (item[0] || "Atividade") + "\" removida.";
              barraDesfazer.hidden = false;
              atualizarResumoModal();
              renderizarConteudo();
            });

            acoesDir.append(duracaoCtrl, btnDetalhes, btnRem);
            linhaTopo.append(infoEsq, acoesDir);
            linha.append(linhaTopo);

            if (emEdicao) {
              const detalhesBox = ui.elemento("div", undefined, "etapas-modal-item-detalhes");
              const resp = ui.campo("Responsável", item[3] ?? "", (v) => {
                item[3] = v;
                subMeta.textContent = [item[4] === true ? "Entregável" : "", item[3] || ""].filter(Boolean).join(" · ");
                subMeta.hidden = !subMeta.textContent;
                return true;
              });
              const desc = ui.campo("Descrição para a proposta", item[2] ?? "", (v) => {
                item[2] = v;
                return true;
              });
              const chkEnt = ui.elemento("input");
              chkEnt.type = "checkbox";
              chkEnt.checked = item[4] === true;
              chkEnt.addEventListener("change", () => {
                item[4] = chkEnt.checked;
                atualizarResumoModal();
                if (abaAtiva === "entregaveis" && !chkEnt.checked) renderizarConteudo();
                else {
                  subMeta.textContent = [item[4] === true ? "Entregável" : "", item[3] || ""].filter(Boolean).join(" · ");
                  subMeta.hidden = !subMeta.textContent;
                }
              });
              const rotEnt = Paisagismo.telasComerciais.rotular("Incluir entre os entregáveis da proposta", chkEnt);
              rotEnt.classList.add("campo-check-inline");
              detalhesBox.append(resp, desc, rotEnt);
              linha.append(detalhesBox);
            }
            return linha;
          }));

          if (focoEl) {
            focoEl.focus?.();
            focoEl.select?.();
          }
        }

        atualizarResumoModal();
        alternarAba("atividades");
        container.append(resumoModal, navAbas, barraAcoes, barraDesfazer, listaBox);
        return container;
      },
    });
  }

  /* Modal Ver atividades (consulta unificada por fases com transição interna para edição) */
  function abrirModalTodasAtividades(ancora) {
    const snapshot = structuredClone(etapas);
    let termoBusca = "";
    let itemEmEdicao = null;
    const normalizar = (t) => String(t || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    abrirModalEtapas({
      titulo: "Atividades do projeto",
      subtitulo: "Visão consolidada por fase",
      tamanho: "padrao",
      origemEl: ancora,
      modo: "edicao",
      estaAlterado: () => JSON.stringify(etapas) !== JSON.stringify(snapshot),
      aoConfirmar: () => atualizar(),
      aoCancelar: () => {
        etapas.splice(0, etapas.length, ...snapshot);
        atualizar();
      },
      montar: ({ atualizarTitulo }) => {
        const container = ui.elemento("div", undefined, "etapas-modal-fase");
        const barraBusca = ui.elemento("div", undefined, "etapas-modal-barra");
        const campoBusca = ui.elemento("input", undefined, "gaveta-input-busca");
        campoBusca.type = "search";
        campoBusca.placeholder = "Buscar em todas as atividades...";
        campoBusca.setAttribute("aria-label", "Buscar em todas as atividades");
        campoBusca.addEventListener("input", () => {
          termoBusca = normalizar(campoBusca.value.trim());
          renderizar();
        });
        barraBusca.append(campoBusca);

        const corpoLista = ui.elemento("div", undefined, "etapas-modal-lista");

        function renderizar() {
          if (itemEmEdicao) {
            atualizarTitulo("Editar atividade", faseDaEtapa(itemEmEdicao[0]));
            const voltarBtn = ui.botao("← Voltar para a lista", () => {
              itemEmEdicao = null;
              atualizarTitulo("Atividades do projeto", "Visão consolidada por fase");
              renderizar();
            }, true);
            const editor = montarEditorAtividade(itemEmEdicao, (t, f) => atualizarTitulo(t || "Editar atividade", f));
            container.replaceChildren(voltarBtn, editor);
            return;
          }

          container.replaceChildren(barraBusca, corpoLista);
          const grupos = fasesDef.map((f) => ({
            ...f,
            itens: etapas.filter((it) => faseDaEtapa(it[0]) === f.nome
              && (!termoBusca || normalizar(it[0] + " " + (it[3] || "")).includes(termoBusca))),
          })).filter((g) => g.itens.length > 0);

          if (!grupos.length) {
            corpoLista.replaceChildren(ui.elemento("p", "Nenhuma atividade encontrada.", "gaveta-vazio"));
            return;
          }

          corpoLista.replaceChildren(...grupos.map((g) => {
            const sec = ui.elemento("div", undefined, "etapas-lista-grupo");
            const h3 = ui.elemento("div", undefined, "etapas-lista-grupo-topo");
            const hTotal = g.itens.reduce((s, [, h]) => s + (Number(h) || 0), 0);
            h3.append(ui.elemento("strong", g.codigo + " · " + g.nome), ui.elemento("span", ui.numero(hTotal) + " h"));
            sec.append(h3);

            for (const item of g.itens) {
              const row = ui.elemento("button", undefined, "etapas-lista-row");
              row.type = "button";
              const esq = ui.elemento("span", item[0] || "Atividade sem nome");
              const dir = ui.elemento("strong", ui.numero(Number(item[1]) || 0) + " h");
              row.append(esq, dir);
              row.addEventListener("click", () => {
                itemEmEdicao = item;
                renderizar();
              });
              sec.append(row);
            }
            return sec;
          }));
        }

        renderizar();
        return container;
      },
    });
  }

  /* ==========================================================================
     Construção da página principal de Etapas do projeto
     ========================================================================== */
  const totalHorasEl = ui.elemento("strong", "0 h", "valor-financeiro");
  const indMaoObra = ui.elemento("strong", "R$ 0,00", "preco-indicador-valor");
  const indCustoHora = ui.elemento("strong", ui.brl(valorHora), "preco-indicador-valor");
  const indAtividades = ui.elemento("strong", "0", "preco-indicador-valor");
  const indEntregaveis = ui.elemento("strong", "0", "preco-indicador-valor");

  const wrapMaoObra = ui.elemento("div", undefined, "preco-indicador");
  wrapMaoObra.append(ui.elemento("span", "Mão de obra estimada", "preco-indicador-titulo"), indMaoObra);
  const wrapCustoHora = ui.elemento("div", undefined, "preco-indicador");
  wrapCustoHora.append(ui.elemento("span", "Custo por hora", "preco-indicador-titulo"), indCustoHora);
  const wrapAtividades = ui.elemento("div", undefined, "preco-indicador");
  wrapAtividades.append(ui.elemento("span", "Atividades", "preco-indicador-titulo"), indAtividades);
  const wrapEntregaveis = ui.elemento("div", undefined, "preco-indicador");
  wrapEntregaveis.append(ui.elemento("span", "Entregáveis", "preco-indicador-titulo"), indEntregaveis);

  const btnTodas = ui.botao("Ver atividades (0)", () => abrirModalTodasAtividades(btnTodas), true);
  const btnOrcamento = ui.botao("Ir para orçamento", () => ctx.navegar("orcamento"));
  btnOrcamento.classList.add("orcamento-salvar-destaque");
  const acoesHero = ui.elemento("div", undefined, "acoes orcamento-acoes");
  acoesHero.append(btnTodas, btnOrcamento);

  const headerEtapas = bot
    ? bot.OrganicSurface("header", "botanical-luxury-hero orcamento-painel-hero etapas-painel-hero")
    : ui.elemento("header", undefined, "botanical-luxury-hero etapas-painel-hero");
  if (bot) {
    const ramo = bot.BotanicalBranch("luxury");
    headerEtapas.append(bot.LeafShadow(), bot.OrganicPattern(), ramo);
    bot.ativarAmbienteBotanico?.(headerEtapas, ramo);
  }
  const heroConteudo = ui.elemento("div", undefined, "orcamento-hero-conteudo");
  const heroTopo = ui.elemento("div", undefined, "orcamento-hero-topo");
  const heroTituloLinha = ui.elemento("div", undefined, "orcamento-hero-titulo-wrap");
  heroTituloLinha.append(
    ui.elemento("h1", "Etapas do projeto"),
    ui.elemento("span", "— Tempo estimado", "etapas-hero-subtitulo-inline"),
  );
  heroTopo.append(heroTituloLinha);
  const heroPrincipal = ui.elemento("div", undefined, "orcamento-hero-principal");
  heroPrincipal.append(totalHorasEl);
  const heroRodape = ui.elemento("div", undefined, "orcamento-hero-rodape");
  const heroIndicadores = ui.elemento("div", undefined, "orcamento-hero-indicadores etapas-hero-indicadores");
  heroIndicadores.append(wrapMaoObra, wrapCustoHora, wrapAtividades, wrapEntregaveis);
  heroRodape.append(heroIndicadores, acoesHero);
  heroConteudo.append(heroTopo, heroPrincipal, heroRodape);
  headerEtapas.append(heroConteudo);

  /* Segunda linha: Jornada das 4 Fases em linha única (desktop) */
  const gradeCards = ui.elemento("section", undefined, "etapas-jornada-fases");
  gradeCards.setAttribute("aria-label", "Fases do planejamento");
  const cardsMapa = new Map();

  const pagina = ui.elemento("div", undefined, "etapas-pagina");
  function definirFocoFase(nomeFase) {
    if (nomeFase) pagina.dataset.faseFoco = nomeFase;
    else delete pagina.dataset.faseFoco;
  }

  function obterOuCriarCard(faseInfo, indice = 0) {
    if (cardsMapa.has(faseInfo.nome)) return cardsMapa.get(faseInfo.nome);
    const card = ui.elemento("button", undefined, "cartao card-fase-jornada");
    card.type = "button";
    card.dataset.fase = faseInfo.nome;
    card.dataset.tema = faseInfo.tema;
    card.setAttribute("style", "--cor-fase:" + faseInfo.cor + ";--atraso-card:" + (indice * 55) + "ms");
    card.setAttribute("aria-haspopup", "dialog");
    card.addEventListener("click", () => abrirModalFase(card, faseInfo.nome));
    card.addEventListener("pointerenter", () => definirFocoFase(faseInfo.nome));
    card.addEventListener("pointerleave", () => definirFocoFase(""));
    card.addEventListener("focusin", () => definirFocoFase(faseInfo.nome));
    card.addEventListener("focusout", () => definirFocoFase(""));

    const topoCard = ui.elemento("div", undefined, "fase-jornada-topo");
    const tituloInline = ui.elemento("div", undefined, "fase-jornada-titulo-inline");
    const codigoEl = ui.elemento("span", faseInfo.codigo + " ·", "fase-jornada-codigo");
    const nomeEl = ui.elemento("h2", faseInfo.nome, "fase-jornada-nome");
    tituloInline.append(codigoEl, nomeEl);
    const editIcon = ui.elemento("span", "✎", "fase-jornada-edit");
    editIcon.setAttribute("aria-hidden", "true");
    topoCard.append(tituloInline, editIcon);

    const horasEl = ui.elemento("strong", "0 h", "fase-jornada-horas valor-financeiro");

    const metaGrid = ui.elemento("div", undefined, "fase-jornada-meta");
    const custoEl = ui.elemento("strong", "R$ 0,00", "fase-jornada-custo");
    const ativEl = ui.elemento("small", "0 atividades", "fase-jornada-ativ");
    const pctEl = ui.elemento("small", "0% do tempo", "fase-jornada-pct");
    metaGrid.append(custoEl, ativEl, pctEl);

    const trilha = ui.elemento("div", undefined, "trilha-ranking trilha-fina");
    const barra = ui.elemento("div", undefined, "barra-preenchimento");
    trilha.append(barra);

    const ilustra = ui.elemento("span", undefined, "fase-jornada-ilustracao");
    ilustra.append(ilustrarFase(faseInfo.nome));

    card.append(topoCard, horasEl, metaGrid, trilha, ilustra);
    const ref = { card, horasEl, custoEl, ativEl, pctEl, barra, cor: faseInfo.cor };
    cardsMapa.set(faseInfo.nome, ref);
    return ref;
  }

  /* Terceira linha: Distribuição do tempo (60%) + Atividades de maior duração (40%) */
  const totalDistribuicaoEl = ui.elemento("span", "0 h estimadas", "total-distribuicao-fase");
  const barraTimeline = ui.elemento("div", undefined, "barra-composicao barra-timeline-etapas");
  const legendaFases = ui.elemento("div", undefined, "legenda-distribuicao-fases");
  const resumoJornadasEl = ui.elemento("p", "", "distribuicao-jornadas-nota");
  const topoDistribuicao = ui.elemento("div", undefined, "topo-distribuicao-fase");
  topoDistribuicao.append(ui.elemento("h2", "Distribuição do tempo"), totalDistribuicaoEl);
  const blocoTimeline = ui.elemento("section", undefined, "cartao card-distribuicao-fases");
  blocoTimeline.append(topoDistribuicao, barraTimeline, legendaFases, resumoJornadasEl);

  const ranking = ui.elemento("div", undefined, "ranking-barras etapas-ranking-atividades");
  const blocoRanking = ui.elemento("section", undefined, "cartao card-maiores-atividades");
  blocoRanking.append(ui.elemento("h2", "Atividades de maior duração"), ranking);

  const analiseGrade = ui.elemento("div", undefined, "etapas-analise-grade");
  analiseGrade.append(blocoTimeline, blocoRanking);

  let inicializado = false;
  let horasAtuais = null;
  let rafHoras = null;

  function animarHorasTotais(destino) {
    const reduzido = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!inicializado || reduzido || typeof window === "undefined"
      || typeof window.requestAnimationFrame !== "function" || !Number.isFinite(horasAtuais)) {
      horasAtuais = destino;
      ui.mostrarValor(totalHorasEl, ui.numero(destino) + " h");
      return;
    }
    if (Math.abs(destino - horasAtuais) < 0.01) {
      horasAtuais = destino;
      ui.mostrarValor(totalHorasEl, ui.numero(destino) + " h");
      return;
    }
    if (rafHoras) window.cancelAnimationFrame?.(rafHoras);
    const ini = horasAtuais;
    const t0 = performance.now();
    const dur = 280;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      totalHorasEl.textContent = ui.numero(Math.round((ini + (destino - ini) * eased) * 10) / 10) + " h";
      if (p < 1) rafHoras = window.requestAnimationFrame(step);
      else {
        horasAtuais = destino;
        ui.mostrarValor(totalHorasEl, ui.numero(destino) + " h");
        rafHoras = null;
      }
    };
    rafHoras = window.requestAnimationFrame(step);
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
    const somaHoras = Paisagismo.horasProjeto(etapas);
    const baseHoras = Math.max(0.01, somaHoras);
    const entregaveis = etapas.filter(([, , , , publica]) => publica === true).length;

    animarHorasTotais(somaHoras);
    pulsarSeMudou(wrapMaoObra, indMaoObra, ui.brl(somaHoras * valorHora));
    pulsarSeMudou(wrapCustoHora, indCustoHora, ui.brl(valorHora));
    pulsarSeMudou(wrapAtividades, indAtividades, String(etapas.length));
    pulsarSeMudou(wrapEntregaveis, indEntregaveis, String(entregaveis));
    totalDistribuicaoEl.textContent = ui.numero(somaHoras) + " h estimadas";
    btnTodas.textContent = "Ver atividades (" + etapas.length + ")";

    const grupos = agruparFases();
    const pcts = percentuaisConsistentes(grupos.map((g) => g.horas));
    gradeCards.replaceChildren(...grupos.map((g, idx) => {
      const ref = obterOuCriarCard(g, idx);
      const pct = pcts[idx];
      ui.mostrarValor(ref.horasEl, ui.numero(g.horas) + " h");
      ref.custoEl.textContent = ui.brl(g.horas * valorHora);
      ref.ativEl.textContent = g.quantidade + (g.quantidade === 1 ? " atividade" : " atividades");
      ref.pctEl.textContent = pct + "% do tempo";
      ref.barra.setAttribute("style", "width:" + (g.horas > 0 ? Math.max(4, pct) : 0) + "%;background:" + ref.cor);
      return ref.card;
    }));

    /* Barra segmentada de Distribuição do tempo (zero segmentos artificiais) */
    const ativos = grupos.map((g, idx) => ({ g, pct: pcts[idx] })).filter(({ g }) => g.horas > 0);
    if (!ativos.length) {
      barraTimeline.dataset.vazio = "true";
      barraTimeline.replaceChildren();
    } else {
      delete barraTimeline.dataset.vazio;
      barraTimeline.replaceChildren(...ativos.map(({ g, pct }) => {
        const seg = ui.elemento("button", undefined, "segmento-composicao segmento-fase-btn");
        seg.type = "button";
        seg.dataset.fase = g.nome;
        seg.setAttribute("style", "width:" + pct + "%;background:" + g.cor);
        const rotHoras = g.horas === 1 ? "1 hora" : ui.numero(g.horas) + " horas";
        const tip = g.nome + ": " + rotHoras + " (" + pct + "%) · " + ui.brl(g.horas * valorHora);
        seg.title = tip;
        seg.setAttribute("aria-label", tip);
        if (pct >= 10) seg.append(ui.elemento("span", pct + "%", "segmento-pct-label"));
        seg.addEventListener("pointerenter", () => definirFocoFase(g.nome));
        seg.addEventListener("pointerleave", () => definirFocoFase(""));
        seg.addEventListener("focusin", () => definirFocoFase(g.nome));
        seg.addEventListener("focusout", () => definirFocoFase(""));
        seg.addEventListener("click", () => {
          const ref = cardsMapa.get(g.nome);
          if (ref?.card) abrirModalFase(ref.card, g.nome);
        });
        return seg;
      }));
    }

    legendaFases.replaceChildren(...grupos.map((g, idx) => {
      const pct = pcts[idx];
      const itemLeg = ui.elemento("button", undefined, "item-legenda-fase item-legenda-linha");
      itemLeg.type = "button";
      itemLeg.dataset.fase = g.nome;
      const rotulo = ui.elemento("span", undefined, "rotulo-com-ponto");
      const ponto = ui.elemento("i");
      ponto.setAttribute("style", "background:" + g.cor);
      rotulo.append(ponto, g.nome);
      const dadosDir = ui.elemento("span", undefined, "legenda-fase-dados");
      const rotHoras = g.horas === 1 ? "1 hora" : ui.numero(g.horas) + " horas";
      dadosDir.append(
        ui.elemento("small", pct + "% do tempo"),
        ui.elemento("strong", rotHoras),
      );
      itemLeg.append(rotulo, dadosDir);
      itemLeg.addEventListener("pointerenter", () => definirFocoFase(g.nome));
      itemLeg.addEventListener("pointerleave", () => definirFocoFase(""));
      itemLeg.addEventListener("click", () => {
        const ref = cardsMapa.get(g.nome);
        if (ref?.card) abrirModalFase(ref.card, g.nome);
      });
      return itemLeg;
    }));

    if (somaHoras > 0) {
      const rotTotal = somaHoras === 1 ? "1 hora estimada" : ui.numero(somaHoras) + " horas estimadas";
      resumoJornadasEl.textContent = rotTotal + " distribuídas nas 4 fases do projeto.";
    } else {
      resumoJornadasEl.textContent = "Sem horas estimadas nas etapas.";
    }

    /* Atividades de maior duração (Top 5, sem numeração, cor da fase de origem) */
    const maiores = etapas
      .map((item, i) => ({ item, nome: item[0] || "Atividade " + (i + 1), horas: Number(item[1]) || 0 }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5);
    ranking.replaceChildren(...(maiores.length ? maiores.map(({ item, nome, horas }) => {
      const faseItem = faseDaEtapa(item[0]);
      const corFase = coresFase[faseItem] || "#275b44";
      const pct = somaHoras > 0 ? Math.min(100, Math.round((horas / baseHoras) * 100)) : 0;
      const btnItem = ui.elemento("button", undefined, "item-ranking item-ranking-btn");
      btnItem.type = "button";
      btnItem.dataset.fase = faseItem;
      btnItem.title = nome + " (" + faseItem + " · " + ui.numero(horas) + " h · " + pct + "%) — Clique para editar";
      const topo = ui.elemento("div", undefined, "topo-ranking");
      const esq = ui.elemento("span", undefined, "ranking-nome-wrap");
      const pontoFase = ui.elemento("i", undefined, "ranking-fase-ponto");
      pontoFase.setAttribute("style", "background:" + corFase);
      esq.append(pontoFase, ui.elemento("span", nome, "ranking-nome-texto"));
      topo.append(esq, ui.elemento("strong", ui.numero(horas) + " h · " + pct + "%"));
      const trilha = ui.elemento("div", undefined, "trilha-ranking");
      const barra = ui.elemento("div", undefined, "barra-preenchimento");
      barra.setAttribute("style", "width:" + (horas > 0 ? Math.max(4, pct) : 0) + "%;background:" + corFase);
      trilha.append(barra);
      btnItem.append(topo, trilha);
      btnItem.addEventListener("pointerenter", () => definirFocoFase(faseItem));
      btnItem.addEventListener("pointerleave", () => definirFocoFase(""));
      btnItem.addEventListener("click", () => abrirModalAtividade(item, btnItem));
      return btnItem;
    }) : [ui.elemento("p", "Adicione atividades para visualizar a distribuição de esforço.")]));

    inicializado = true;
  };

  const atualizar = ctx.aoAlterar(exibir);
  exibir();

  pagina.append(headerEtapas, gradeCards, analiseGrade);
  return [pagina];
};
