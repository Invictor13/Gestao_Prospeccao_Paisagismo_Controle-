Paisagismo.telaEtapas = (ctx) => {
  const ui = Paisagismo.ui;
  const etapas = ctx.dados.projeto.etapa;
  const valorHora = Paisagismo.custos(ctx.dados.operacao).hora;

  const fasesDef = [
    ["Levantamento", "#143329", "Briefing, orçamento e coleta em campo"],
    ["Pré-projeto", "#275b44", "Estudo conceitual e pré-executivo"],
    ["Executivo & 3D", "#769d83", "Modelagem, projeto executivo e render"],
    ["Finalização", "#b88a44", "Revisões finais, polimento e entrega"],
  ];
  const coresFase = Object.fromEntries(fasesDef.map(([n, c]) => [n, c]));

  function faseDaEtapa(nome) {
    const t = String(nome || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    if (/fechamento|briefing|referencia|campo|levantamento|visita/.test(t)) return "Levantamento";
    if (/pre-projeto|pre-executivo|conceito|estudo/.test(t)) return "Pré-projeto";
    if (/polimento|detalhamento|entrega|revisao|orientac|reunioes.*executivo|alteracoes.*executivo/.test(t)) return "Finalização";
    if (/modelagem|3d|executivo|render/.test(t)) return "Executivo & 3D";
    return "Finalização";
  }

  function agruparFases() {
    const mapa = new Map(fasesDef.map(([nome]) => [nome, { nome, horas: 0, quantidade: 0, entregaveis: 0 }]));
    for (const item of etapas) {
      const f = faseDaEtapa(item[0]);
      const grupo = mapa.get(f);
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
    let falta = 100 - exatos.reduce((s, item) => s + item.piso, 0);
    const ordenados = [...exatos].sort((a, b) => b.resto - a.resto);
    for (let i = 0; i < falta; i++) ordenados[i].piso += 1;
    return exatos.map((item) => item.piso);
  }

  /* Elementos persistentes do painel principal */
  const total = ui.elemento("output", undefined, "valor-financeiro");
  const subtitulo = ui.elemento("div", undefined, "subtitulo-preco");
  const contagemAtividades = ui.elemento("span");
  const contagemEntregaveis = ui.elemento("span", undefined, "badge-margem");
  subtitulo.append(contagemAtividades, contagemEntregaveis);
  const valorMaoObra = ui.elemento("small", "", "subtexto-preco-etapas");
  const ranking = ui.elemento("div", undefined, "ranking-barras");

  const gradeCards = ui.elemento("div", undefined, "grade-categorias-custos grade-fases-etapas");
  const cardsMapa = new Map();
  const barraTimeline = ui.elemento("div", undefined, "barra-composicao barra-timeline-etapas");
  const totalDistribuicaoEl = ui.elemento("span", "", "total-distribuicao-fase");
  const legendaFases = ui.elemento("div", undefined, "legenda-distribuicao-fases");
  const btnTodas = ui.botao("Ver todas", () => abrirGavetaFase(btnTodas, ""), true);

  let atualizarGavetaAtiva = null;
  let faseSelecionada = "";

  function marcarCardSelecionado(nomeFase) {
    faseSelecionada = nomeFase;
    for (const [nome, ref] of cardsMapa.entries()) {
      if (nome === nomeFase) ref.card.dataset.selecionada = "true";
      else delete ref.card.dataset.selecionada;
    }
  }

  function abrirGavetaFase(ancora, faseInicial = "") {
    let termoBusca = "";
    let itemSelecionado = null;
    let removido = null;
    const normalizar = (t) => String(t || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    /* Região 1 — Cabeçalho Verde Floresta limpo */
    const headerConteudo = ui.elemento("div", undefined, "gaveta-header-verde");
    const tituloFaseEl = ui.elemento("h2", faseInicial || "Todas as atividades", "gaveta-titulo-categoria");
    const totalHorasEl = ui.elemento("strong", "", "gaveta-total-mensal valor-financeiro");
    const metaLinha = ui.elemento("div", undefined, "gaveta-meta-linha");
    const qtdAtivEl = ui.elemento("span");
    const pctEsforcoEl = ui.elemento("span");
    metaLinha.append(qtdAtivEl, pctEsforcoEl);
    headerConteudo.append(tituloFaseEl, totalHorasEl, metaLinha);

    /* Região 2 — Busca + Botão (+) + Desfazer + Lista Contextual */
    const corpoConteudo = ui.elemento("div", undefined, "gaveta-conteudo-editor");
    const barraBusca = ui.elemento("div", undefined, "gaveta-barra-busca");
    const campoBusca = ui.elemento("input");
    campoBusca.type = "search";
    campoBusca.placeholder = "Buscar atividade...";
    campoBusca.className = "gaveta-input-busca";
    campoBusca.setAttribute("aria-label", "Buscar atividade");
    campoBusca.addEventListener("input", () => {
      termoBusca = normalizar(campoBusca.value.trim());
      renderizarLista();
    });

    const nomesSugestao = {
      "Levantamento": "Novo levantamento",
      "Pré-projeto": "Nova etapa do pré-projeto",
      "Executivo & 3D": "Nova etapa executivo 3D",
      "Finalização": "Nova revisão e entrega",
    };
    const btnAdicionar = ui.elemento("button", "+", "botao gaveta-btn-add");
    btnAdicionar.type = "button";
    btnAdicionar.title = "Adicionar nova atividade";
    btnAdicionar.setAttribute("aria-label", "Adicionar nova atividade");
    btnAdicionar.addEventListener("click", () => {
      const nova = [nomesSugestao[faseInicial] || "Nova atividade", 1, "", "", false];
      etapas.push(nova);
      if (atualizar()) {
        termoBusca = "";
        campoBusca.value = "";
        itemSelecionado = nova;
        renderizarLista(true);
        atualizarResumoGaveta();
      } else {
        etapas.pop();
      }
    });
    barraBusca.append(campoBusca, btnAdicionar);

    const barraDesfazer = ui.elemento("div", undefined, "gaveta-desfazer");
    barraDesfazer.hidden = true;
    const textoDesfazer = ui.elemento("span", "Atividade removida.");
    const btnDesfazer = ui.botao("Desfazer", () => {
      if (!removido) return;
      etapas.splice(removido.indice, 0, removido.item);
      if (atualizar()) {
        itemSelecionado = removido.item;
        removido = null;
        barraDesfazer.hidden = true;
        renderizarLista();
        atualizarResumoGaveta();
      } else {
        etapas.splice(removido.indice, 1);
      }
    }, true);
    btnDesfazer.classList.add("botao-filtro-cat");
    barraDesfazer.append(textoDesfazer, btnDesfazer);

    const listaEl = ui.elemento("div", undefined, "lista-despesas-gaveta");
    corpoConteudo.append(barraBusca, barraDesfazer, listaEl);

    /* Região 3 — Rodapé Financeiro e de Entregáveis da Fase */
    const rodapeConteudo = ui.elemento("div", undefined, "gaveta-resumo-categoria");
    const custoHorasEl = ui.elemento("strong", "", "valor-financeiro");
    const entregaveisFaseEl = ui.elemento("strong");
    const linhaCusto = ui.elemento("div", undefined, "linha-resumo-gaveta");
    linhaCusto.append(ui.elemento("span", "Custo estimado das horas"), custoHorasEl);
    const linhaEntregas = ui.elemento("div", undefined, "linha-resumo-gaveta");
    linhaEntregas.append(ui.elemento("span", "Entregáveis na proposta"), entregaveisFaseEl);
    const trilhaRodape = ui.elemento("div", undefined, "trilha-ranking");
    const barraRodape = ui.elemento("div", undefined, "barra-preenchimento");
    trilhaRodape.append(barraRodape);
    rodapeConteudo.append(
      ui.elemento("span", "Resumo da fase", "titulo-resumo-gaveta"),
      linhaCusto,
      linhaEntregas,
      trilhaRodape,
    );

    function obterVisiveis() {
      return etapas
        .map((item, indice) => ({ item, indice, fase: faseDaEtapa(item[0]) }))
        .filter(({ item, fase }) => {
          if (faseInicial && fase !== faseInicial) return false;
          if (termoBusca && !normalizar(item[0] + " " + (item[3] || "")).includes(termoBusca)) return false;
          return true;
        });
    }

    function atualizarResumoGaveta() {
      const somaTotal = Paisagismo.horasProjeto(etapas);
      const doGrupo = faseInicial ? etapas.filter((it) => faseDaEtapa(it[0]) === faseInicial) : etapas;
      const horasGrupo = doGrupo.reduce((s, [, h]) => s + (Number(h) || 0), 0);
      const entGrupo = doGrupo.filter((it) => it[4] === true).length;
      const pct = somaTotal > 0 ? Math.round((horasGrupo / somaTotal) * 100) : 0;
      const cor = faseInicial ? (coresFase[faseInicial] || "#275b44") : "#143329";

      ui.mostrarValor(totalHorasEl, ui.numero(horasGrupo) + " h");
      qtdAtivEl.textContent = doGrupo.length + (doGrupo.length === 1 ? " atividade" : " atividades");
      pctEsforcoEl.textContent = pct + "% do esforço total";
      ui.mostrarValor(custoHorasEl, ui.brl(horasGrupo * valorHora));
      entregaveisFaseEl.textContent = entGrupo + " de " + doGrupo.length;
      barraRodape.setAttribute("style", "width:" + Math.max(horasGrupo > 0 ? 4 : 0, pct) + "%;background:" + cor);
    }

    function renderizarLista(focarSelecionado = false) {
      const visiveis = obterVisiveis();
      if (!visiveis.length) {
        listaEl.replaceChildren(ui.elemento("p",
          termoBusca ? "Nenhuma atividade encontrada para essa busca." : "Nenhuma atividade nesta fase. Clique em + para adicionar.",
          "gaveta-vazio"));
        return;
      }

      let inputParaFocar = null;
      listaEl.replaceChildren(...visiveis.map(({ item, indice }) => {
        const aberto = itemSelecionado === item;
        const cardItem = ui.elemento("div", undefined, "item-despesa-gaveta");
        if (aberto) cardItem.classList.add("item-ativo");
        if (aberto && focarSelecionado) cardItem.classList.add("item-novo");

        const btnTopo = ui.elemento("button", undefined, "topo-item-gaveta");
        btnTopo.type = "button";
        btnTopo.setAttribute("aria-expanded", String(aberto));

        const infoEsq = ui.elemento("span", undefined, "nome-item-gaveta");
        const nomeEl = ui.elemento("strong", item[0] || "Atividade sem nome");
        nomeEl.className = "nome-etapa-completo";
        const tagMeta = ui.elemento("small", "", "tag-item-gaveta");
        const atualizarTag = () => {
          const partes = [
            item[4] === true ? "Entregável na proposta" : "",
            item[3] || "",
            !faseInicial ? faseDaEtapa(item[0]) : "",
          ].filter(Boolean);
          tagMeta.textContent = partes.join(" · ");
          tagMeta.hidden = !partes.length;
        };
        atualizarTag();
        infoEsq.append(nomeEl, tagMeta);

        const infoDir = ui.elemento("span", undefined, "valor-item-gaveta");
        const horasDisplay = ui.elemento("span", ui.numero(Number(item[1]) || 0) + " h", "valor-financeiro");
        const iconeEdit = ui.elemento("span", aberto ? "▴" : "✎", "icone-editar-gaveta");
        iconeEdit.setAttribute("aria-hidden", "true");
        infoDir.append(horasDisplay, iconeEdit);

        btnTopo.append(infoEsq, infoDir);
        btnTopo.addEventListener("click", () => {
          itemSelecionado = aberto ? null : item;
          renderizarLista(!aberto);
        });
        cardItem.append(btnTopo);

        if (aberto) {
          const editorInline = ui.elemento("div", undefined, "editor-inline-gaveta");
          const gradeCampos = ui.elemento("div", undefined, "formulario-comercial");

          const editarItem = (col, val) => {
            const anterior = item.slice();
            item[col] = val;
            if (atualizar()) {
              nomeEl.textContent = item[0] || "Atividade sem nome";
              horasDisplay.textContent = ui.numero(Number(item[1]) || 0) + " h";
              atualizarTag();
              return true;
            }
            item.splice(0, item.length, ...anterior);
            return false;
          };

          const campoNome = ui.campo("Nome da atividade", item[0], (v) => editarItem(0, v));
          campoNome.classList.add("campo-completo");
          const campoHoras = ui.campo("Duração (h)", item[1], (v) => editarItem(1, v), 0);
          const campoResp = ui.campo("Responsável", item[3] ?? "", (v) => editarItem(3, v));
          const campoDesc = ui.campo("Descrição para a proposta", item[2] ?? "", (v) => editarItem(2, v));
          campoDesc.classList.add("campo-completo");

          const chkPublico = ui.elemento("input");
          chkPublico.type = "checkbox";
          chkPublico.checked = item[4] === true;
          chkPublico.addEventListener("change", () => editarItem(4, chkPublico.checked));
          const rotuloPub = Paisagismo.telasComerciais.rotular("Incluir entre os entregáveis da proposta", chkPublico);
          rotuloPub.classList.add("campo-completo", "campo-check-inline");

          gradeCampos.append(campoNome, campoHoras, campoResp, campoDesc, rotuloPub);

          const rodapeInline = ui.elemento("div", undefined, "acoes-inline-gaveta");
          const grupoOrdem = ui.elemento("div", undefined, "acoes");
          const mover = (delta) => {
            const idxAtual = etapas.indexOf(item);
            const dest = idxAtual + delta;
            if (idxAtual < 0 || dest < 0 || dest >= etapas.length) return;
            [etapas[idxAtual], etapas[dest]] = [etapas[dest], etapas[idxAtual]];
            if (atualizar()) renderizarLista();
            else [etapas[idxAtual], etapas[dest]] = [etapas[dest], etapas[idxAtual]];
          };
          if (indice > 0) {
            const bUp = ui.botao("↑", () => mover(-1), true);
            bUp.title = "Mover acima";
            bUp.classList.add("botao-filtro-cat");
            grupoOrdem.append(bUp);
          }
          if (indice < etapas.length - 1) {
            const bDn = ui.botao("↓", () => mover(1), true);
            bDn.title = "Mover abaixo";
            bDn.classList.add("botao-filtro-cat");
            grupoOrdem.append(bDn);
          }

          const btnRemover = ui.botao("Remover", () => {
            const idxAtual = etapas.indexOf(item);
            if (idxAtual < 0) return;
            etapas.splice(idxAtual, 1);
            if (atualizar()) {
              removido = { indice: idxAtual, item };
              itemSelecionado = null;
              textoDesfazer.textContent = "\"" + (item[0] || "Atividade") + "\" removida.";
              barraDesfazer.hidden = false;
              renderizarLista();
              atualizarResumoGaveta();
            } else {
              etapas.splice(idxAtual, 0, item);
            }
          }, true);
          btnRemover.classList.add("btn-remover-contextual");
          grupoOrdem.append(btnRemover);

          const btnConcluir = ui.botao("Concluir", () => {
            itemSelecionado = null;
            renderizarLista();
          }, true);
          btnConcluir.classList.add("botao-filtro-cat");

          rodapeInline.append(grupoOrdem, btnConcluir);
          editorInline.append(gradeCampos, rodapeInline);
          cardItem.append(editorInline);

          if (focarSelecionado) inputParaFocar = campoNome.querySelector("input");
        }
        return cardItem;
      }));

      if (inputParaFocar) {
        inputParaFocar.focus();
        inputParaFocar.select?.();
      }
    }

    renderizarLista();
    atualizarResumoGaveta();
    atualizarGavetaAtiva = atualizarResumoGaveta;
    marcarCardSelecionado(faseInicial);

    ui.abrirGaveta(ancora, faseInicial || "Todas as atividades", corpoConteudo, {
      classe: "gaveta-custos-v2",
      cabecalhoPersonalizado: headerConteudo,
      rodape: rodapeConteudo,
      aoFechar() {
        atualizarGavetaAtiva = null;
        marcarCardSelecionado("");
      },
    });
  }

  function obterOuCriarCard(nome, cor) {
    if (cardsMapa.has(nome)) return cardsMapa.get(nome);
    const card = ui.elemento("button", undefined, "cartao card-categoria-custo card-fase-compacto");
    card.type = "button";
    card.dataset.fase = nome;
    card.setAttribute("style", "--cor-fase:" + cor);
    card.setAttribute("aria-haspopup", "dialog");
    card.addEventListener("click", () => abrirGavetaFase(card, nome));

    const topoCard = ui.elemento("div", undefined, "topo-card-categoria");
    const tituloBloco = ui.elemento("div", undefined, "titulo-card-categoria");
    const icone = ui.elemento("span", undefined, "icone-categoria");
    icone.dataset.fase = nome;
    icone.setAttribute("aria-hidden", "true");
    const metaTitulo = ui.elemento("div", undefined, "meta-titulo-categoria");
    const qtdEl = ui.elemento("small", "", "qtd-card-categoria");
    metaTitulo.append(ui.elemento("strong", nome), qtdEl);
    tituloBloco.append(icone, metaTitulo);
    const seta = ui.elemento("span", "↗", "seta-card-categoria");
    seta.setAttribute("aria-hidden", "true");
    topoCard.append(tituloBloco, seta);

    /* Bloco unificado: Horas em destaque + Custo e % agrupados logo ao lado */
    const metricasBloco = ui.elemento("div", undefined, "metricas-fase-agrupadas");
    const valorEl = ui.elemento("strong", "", "valor-fase-horas valor-financeiro");
    const detalhesNum = ui.elemento("div", undefined, "detalhes-fase-agrupados");
    const custoEl = ui.elemento("strong", "", "custo-fase-valor");
    const pctEl = ui.elemento("small", "", "pct-fase-valor");
    detalhesNum.append(custoEl, pctEl);
    metricasBloco.append(valorEl, detalhesNum);

    const trilha = ui.elemento("div", undefined, "trilha-ranking trilha-fina");
    const barra = ui.elemento("div", undefined, "barra-preenchimento barra-estatica");
    trilha.append(barra);

    card.append(topoCard, metricasBloco, trilha);
    const ref = { card, qtdEl, valorEl, custoEl, pctEl, barra, cor };
    cardsMapa.set(nome, ref);
    return ref;
  }

  const exibir = () => {
    const somaHoras = Paisagismo.horasProjeto(etapas);
    const baseHoras = Math.max(0.01, somaHoras);
    const entregaveis = etapas.filter(([, , , , publica]) => publica === true).length;

    ui.mostrarValor(total, ui.numero(somaHoras) + " h");
    contagemAtividades.textContent = etapas.length + (etapas.length === 1 ? " atividade" : " atividades");
    contagemEntregaveis.textContent = entregaveis + (entregaveis === 1 ? " entregável" : " entregáveis");
    valorMaoObra.textContent = "Mão de obra estimada: " + ui.brl(somaHoras * valorHora)
      + " (" + ui.brl(valorHora) + "/h)";
    totalDistribuicaoEl.textContent = ui.numero(somaHoras) + " h estimadas";
    btnTodas.textContent = "Ver todas (" + etapas.length + ")";

    const grupos = agruparFases();
    const pcts = percentuaisConsistentes(grupos.map((g) => g.horas));
    gradeCards.replaceChildren(...grupos.map((g, idx) => {
      const ref = obterOuCriarCard(g.nome, coresFase[g.nome] || "#275b44");
      const pct = pcts[idx];
      ref.qtdEl.textContent = g.quantidade + (g.quantidade === 1 ? " atividade" : " atividades")
        + (g.entregaveis ? " · " + g.entregaveis + " na proposta" : "");
      ui.mostrarValor(ref.valorEl, ui.numero(g.horas) + " h");
      ui.mostrarValor(ref.custoEl, ui.brl(g.horas * valorHora));
      ref.pctEl.textContent = pct + "% do projeto";
      ref.barra.setAttribute("style", "width:" + Math.max(g.horas > 0 ? 4 : 0, pct) + "%;background:" + ref.cor);
      return ref.card;
    }));

    /* Distribuição do tempo por fase: barra segmentada + legenda compacta */
    barraTimeline.replaceChildren(...grupos.map((g, idx) => ({ g, pct: pcts[idx] }))
      .filter(({ g }) => g.horas > 0)
      .map(({ g, pct }) => {
        const seg = ui.elemento("div", undefined, "segmento-composicao");
        seg.setAttribute("style", "width:" + Math.max(4, pct) + "%;background:" + (coresFase[g.nome] || "#275b44"));
        seg.title = g.nome + ": " + ui.numero(g.horas) + " h (" + pct + "%)";
        return seg;
      }));

    legendaFases.replaceChildren(...grupos.map((g) => {
      const dias = Math.max(g.horas > 0 ? 0.5 : 0, Math.round((g.horas / 8) * 10) / 10);
      const cor = coresFase[g.nome] || "#275b44";
      const itemLeg = ui.elemento("div", undefined, "item-legenda-fase");
      const rotulo = ui.elemento("span", undefined, "rotulo-com-ponto");
      const ponto = ui.elemento("i");
      ponto.setAttribute("style", "background:" + cor);
      rotulo.append(ponto, g.nome);
      itemLeg.append(rotulo, ui.elemento("small", ui.numero(g.horas) + " h · ~" + ui.numero(dias) + " d úteis"));
      return itemLeg;
    }));

    const maiores = etapas
      .map(([nome, horas], i) => ({ nome: nome || "Atividade " + (i + 1), horas: Number(horas) || 0 }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5);
    ranking.replaceChildren(...(maiores.length ? maiores.map(({ nome, horas }) => {
      const pct = Math.min(100, Math.round((horas / baseHoras) * 100));
      const item = ui.elemento("div", undefined, "item-ranking");
      const topo = ui.elemento("div", undefined, "topo-ranking");
      topo.append(ui.elemento("span", nome), ui.elemento("strong", ui.numero(horas) + " h · " + pct + "%"));
      const trilha = ui.elemento("div", undefined, "trilha-ranking");
      const barra = ui.elemento("div", undefined, "barra-preenchimento barra-estatica");
      barra.setAttribute("style", "width:" + Math.max(4, pct) + "%");
      trilha.append(barra);
      item.append(topo, trilha);
      return item;
    }) : [ui.elemento("p", "Adicione atividades para visualizar a distribuição de esforço.")]));

    atualizarGavetaAtiva?.();
  };

  const atualizar = ctx.aoAlterar(exibir);

  const topoDistribuicao = ui.elemento("div", undefined, "topo-distribuicao-fase");
  topoDistribuicao.append(ui.elemento("h2", "Distribuição do tempo por fase"), totalDistribuicaoEl);
  const blocoTimeline = ui.elemento("section", undefined, "cartao card-distribuicao-fases");
  blocoTimeline.append(topoDistribuicao, barraTimeline, legendaFases);

  const areaEsquerda = ui.elemento("div", undefined, "pilha area-custos-esquerda");
  areaEsquerda.append(gradeCards, blocoTimeline);

  const destaque = ui.cartao("Horas estimadas", total, valorMaoObra, subtitulo);
  destaque.classList.add("preco");
  const distribuicao = ui.cartao("Maiores etapas", ranking);
  const resumo = ui.elemento("div", undefined, "pilha resumo resumo-operacao");
  resumo.append(destaque, distribuicao);

  const grade = ui.elemento("div", undefined, "grade grade-cadastro");
  grade.append(areaEsquerda, resumo);

  const acoesTopo = ui.elemento("div", undefined, "acoes");
  acoesTopo.append(btnTodas, ui.botao("Ir para orçamento", () => ctx.navegar("orcamento")));

  exibir();
  return [ui.cabecalho("Etapas do projeto", "Clique em qualquer fase para editar durações e entregáveis ao vivo.", acoesTopo), grade];
};
