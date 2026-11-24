Paisagismo.telaCustos = (ctx) => {
  const ui = Paisagismo.ui;
  const regras = Paisagismo.comercial;
  const operacao = ctx.dados.operacao;
  const mensal = ui.linha("Custo mensal");
  const anual = ui.linha("Custo anual");
  mensal.bloco.classList.add("linha-total");
  const hora = ui.elemento("output", undefined, "valor-financeiro");
  const subtituloHora = ui.elemento("div", undefined, "subtitulo-preco");
  const infoBase = ui.elemento("span");
  const infoItens = ui.elemento("span", undefined, "badge-margem");
  subtituloHora.append(infoBase, infoItens);
  const ranking = ui.elemento("div", undefined, "ranking-barras");
  const mesesPeriodo = { mensal: 1, trimestral: 3, anual: 12 };
  const coresCategoria = {
    "Pessoas": "#143329",
    "Escritório": "#275b44",
    "Crescimento": "#769d83",
    "Trabalho": "#b88a44",
    "Outros": "#b0623e",
  };

  function itensMensaisAtuais() {
    return operacao.custos.map((item, i) => {
      const [nome, valor, periodo] = item;
      const valorMensal = (Number(valor) || 0) / (mesesPeriodo[periodo ?? "mensal"] || 1);
      return [nome || "Despesa " + (i + 1), Math.round(valorMensal * 100) / 100, regras.categoriaCusto(item)];
    });
  }

  function agruparCategorias(itensMensais) {
    const mapa = new Map();
    for (const cat of regras.categoriasCusto) {
      mapa.set(cat, { nome: cat, valorMensal: 0, quantidade: 0 });
    }
    for (const [, valorMensal, cat] of itensMensais) {
      if (!mapa.has(cat)) mapa.set(cat, { nome: cat, valorMensal: 0, quantidade: 0 });
      const grupo = mapa.get(cat);
      grupo.valorMensal += valorMensal;
      grupo.quantidade += 1;
    }
    return [...mapa.values()].filter((g) => regras.categoriasCusto.includes(g.nome) || g.quantidade > 0);
  }

  function registrarMes(mesSelecionado) {
    const mes = mesSelecionado || regras.hoje().slice(0, 7);
    const total = Paisagismo.custos(operacao);
    const registro = {
      mes,
      mensal: Math.round(total.mensal * 100) / 100,
      horas: operacao.horas,
      hora: Math.round(total.hora * 100) / 100,
      itens: itensMensaisAtuais(),
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
          "Nenhum fechamento mensal registrado ainda. Clique em \"Registrar fechamento\" acima para começar a acompanhar a evolução."));
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
          "Registre pelo menos 2 meses para comparar o que subiu ou diminuiu nos custos do escritório."));
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

  /* Elementos persistentes do Painel Analítico (atualizam ao vivo sem reconstruir) */
  const gradeCards = ui.elemento("div", undefined, "grade-categorias-custos");
  const cardsMapa = new Map();
  const rosca = ui.elemento("div", undefined, "rosca-custos");
  const valorMiolo = ui.elemento("strong");
  const miolo = ui.elemento("div", undefined, "miolo-rosca");
  miolo.append(ui.elemento("small", "Mensal"), valorMiolo);
  rosca.append(miolo);
  const gradeImpacto = ui.elemento("div", undefined, "grade-impacto-hora");

  let atualizarGavetaAtiva = null;

  function abrirGavetaCategoria(ancora, categoriaInicial = "") {
    let catAtual = categoriaInicial;
    let termoBusca = "";
    let itemSelecionado = null;
    let removido = null;
    const comercial = Paisagismo.telasComerciais;
    const normalizar = (t) => String(t || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    /* Região 1 — Cabeçalho Verde Floresta limpo com título, subtotal e participação */
    const headerConteudo = ui.elemento("div", undefined, "gaveta-header-verde");
    const tituloCatEl = ui.elemento("h2", catAtual || "Todas as despesas", "gaveta-titulo-categoria");
    const totalMensalEl = ui.elemento("strong", "", "gaveta-total-mensal valor-financeiro");
    const metaLinha = ui.elemento("div", undefined, "gaveta-meta-linha");
    const qtdDespesasEl = ui.elemento("span");
    const pctMensalEl = ui.elemento("span");
    metaLinha.append(qtdDespesasEl, pctMensalEl);
    headerConteudo.append(tituloCatEl, totalMensalEl, metaLinha);

    /* Região 2 — Corpo: Busca + Botão (+) + Desfazer + Lista Contextual */
    const corpoConteudo = ui.elemento("div", undefined, "gaveta-conteudo-editor");
    const barraBusca = ui.elemento("div", undefined, "gaveta-barra-busca");
    const campoBusca = ui.elemento("input");
    campoBusca.type = "search";
    campoBusca.placeholder = "Buscar despesa...";
    campoBusca.className = "gaveta-input-busca";
    campoBusca.setAttribute("aria-label", "Buscar despesa");
    campoBusca.addEventListener("input", () => {
      termoBusca = normalizar(campoBusca.value.trim());
      renderizarListaGaveta();
    });

    const btnAdicionar = ui.elemento("button", "+", "botao gaveta-btn-add");
    btnAdicionar.type = "button";
    btnAdicionar.title = "Adicionar nova despesa";
    btnAdicionar.setAttribute("aria-label", "Adicionar nova despesa");
    btnAdicionar.addEventListener("click", () => {
      const novo = ["Nova despesa", 0, "mensal", catAtual || "Escritório"];
      operacao.custos.unshift(novo);
      if (atualizar()) {
        termoBusca = "";
        campoBusca.value = "";
        itemSelecionado = novo;
        renderizarListaGaveta(true);
        atualizarResumoGaveta();
      } else {
        operacao.custos.shift();
      }
    });
    barraBusca.append(campoBusca, btnAdicionar);

    const barraDesfazer = ui.elemento("div", undefined, "gaveta-desfazer");
    barraDesfazer.hidden = true;
    const textoDesfazer = ui.elemento("span", "Despesa removida.");
    const btnDesfazer = ui.botao("Desfazer", () => {
      if (!removido) return;
      operacao.custos.splice(removido.indice, 0, removido.item);
      if (atualizar()) {
        itemSelecionado = removido.item;
        removido = null;
        barraDesfazer.hidden = true;
        renderizarListaGaveta();
        atualizarResumoGaveta();
      } else {
        operacao.custos.splice(removido.indice, 1);
      }
    }, true);
    btnDesfazer.classList.add("botao-filtro-cat");
    barraDesfazer.append(textoDesfazer, btnDesfazer);

    const listaEl = ui.elemento("div", undefined, "lista-despesas-gaveta");
    corpoConteudo.append(barraBusca, barraDesfazer, listaEl);

    /* Região 3 — Rodapé: Resumo Financeiro da Categoria */
    const rodapeConteudo = ui.elemento("div", undefined, "gaveta-resumo-categoria");
    const anualEl = ui.elemento("strong", "", "valor-financeiro");
    const horaEl = ui.elemento("strong", "", "valor-financeiro");
    const linhaAnual = ui.elemento("div", undefined, "linha-resumo-gaveta");
    linhaAnual.append(ui.elemento("span", "Custo anual equivalente"), anualEl);
    const linhaHora = ui.elemento("div", undefined, "linha-resumo-gaveta");
    linhaHora.append(ui.elemento("span", "Impacto no custo por hora"), horaEl);
    const trilhaRodape = ui.elemento("div", undefined, "trilha-ranking");
    const barraRodape = ui.elemento("div", undefined, "barra-preenchimento");
    trilhaRodape.append(barraRodape);
    rodapeConteudo.append(
      ui.elemento("span", "Resumo da categoria", "titulo-resumo-gaveta"),
      linhaAnual,
      linhaHora,
      trilhaRodape,
    );

    function obterItensVisiveis() {
      return operacao.custos
        .map((item, indice) => ({ item, indice, cat: regras.categoriaCusto(item) }))
        .filter(({ item, cat }) => {
          if (catAtual && cat !== catAtual) return false;
          if (termoBusca && !normalizar(item[0] + " " + cat).includes(termoBusca)) return false;
          return true;
        });
    }

    function atualizarResumoGaveta() {
      const total = Paisagismo.custos(operacao);
      const itensMensais = itensMensaisAtuais();
      const doGrupo = catAtual ? itensMensais.filter(([, , c]) => c === catAtual) : itensMensais;
      const subtotalMensal = doGrupo.reduce((s, [, v]) => s + v, 0);
      const pct = total.mensal > 0 ? Math.round((subtotalMensal / total.mensal) * 100) : 0;
      const horasRef = Math.max(0.01, operacao.horas);
      const cor = catAtual ? (coresCategoria[catAtual] || "#275b44") : "#143329";

      tituloCatEl.textContent = catAtual || "Todas as despesas";
      ui.mostrarValor(totalMensalEl, ui.brl(subtotalMensal));
      qtdDespesasEl.textContent = doGrupo.length + (doGrupo.length === 1 ? " despesa" : " despesas");
      pctMensalEl.textContent = pct + "% do custo mensal";
      ui.mostrarValor(anualEl, ui.brl(subtotalMensal * 12));
      ui.mostrarValor(horaEl, ui.brl(subtotalMensal / horasRef) + "/h");
      barraRodape.setAttribute("style", "width:" + Math.max(subtotalMensal > 0 ? 4 : 0, pct) + "%;background:" + cor);
    }

    function renderizarListaGaveta(focarSelecionado = false) {
      const visiveis = obterItensVisiveis();
      if (!visiveis.length) {
        listaEl.replaceChildren(ui.elemento("p",
          termoBusca ? "Nenhuma despesa encontrada para essa busca." : "Nenhuma despesa nesta categoria. Clique em + para adicionar.",
          "gaveta-vazio"));
        return;
      }

      const periodos = [["mensal", "Mensal"], ["trimestral", "Trimestral"], ["anual", "Anual"]];
      const baseCats = regras.categoriasCusto;
      let inputParaFocar = null;

      listaEl.replaceChildren(...visiveis.map(({ item, cat }) => {
        const aberto = itemSelecionado === item;
        const cardItem = ui.elemento("div", undefined, "item-despesa-gaveta");
        if (aberto) cardItem.classList.add("item-ativo");
        if (aberto && focarSelecionado) cardItem.classList.add("item-novo");

        const valorMensalItem = () => (Number(item[1]) || 0) / (mesesPeriodo[item[2] ?? "mensal"] || 1);
        const btnTopo = ui.elemento("button", undefined, "topo-item-gaveta");
        btnTopo.type = "button";
        btnTopo.setAttribute("aria-expanded", String(aberto));

        const infoEsq = ui.elemento("span", undefined, "nome-item-gaveta");
        const nomeEl = ui.elemento("strong", item[0] || "Despesa sem nome");
        const tagMeta = ui.elemento("small", "", "tag-item-gaveta");
        const atualizarTag = () => {
          const p = item[2] && item[2] !== "mensal" ? (item[2] === "anual" ? "Anual" : "Trimestral") : "";
          const meta = [p, !catAtual ? regras.categoriaCusto(item) : ""].filter(Boolean).join(" · ");
          tagMeta.textContent = meta;
          tagMeta.hidden = !meta;
        };
        atualizarTag();
        infoEsq.append(nomeEl, tagMeta);

        const infoDir = ui.elemento("span", undefined, "valor-item-gaveta");
        const valorDisplay = ui.elemento("span", ui.brl(Number(item[1]) || 0), "valor-financeiro");
        const iconeEdit = ui.elemento("span", aberto ? "▴" : "✎", "icone-editar-gaveta");
        iconeEdit.setAttribute("aria-hidden", "true");
        infoDir.append(valorDisplay, iconeEdit);

        btnTopo.append(infoEsq, infoDir);
        btnTopo.addEventListener("click", () => {
          itemSelecionado = aberto ? null : item;
          renderizarListaGaveta(!aberto);
        });
        cardItem.append(btnTopo);

        if (aberto) {
          const editorInline = ui.elemento("div", undefined, "editor-inline-gaveta");
          const gradeCampos = ui.elemento("div", undefined, "formulario-comercial");
          const notaEquiv = ui.elemento("small", "", "nota-equiv-gaveta");
          const atualizarEquiv = () => {
            const p = item[2] ?? "mensal";
            notaEquiv.textContent = p === "mensal" ? "" : "Equivalente mensal: " + ui.brl(valorMensalItem());
            notaEquiv.hidden = p === "mensal";
          };

          const editarItem = (col, val) => {
            const anterior = item.slice();
            item[col] = val;
            if (atualizar()) {
              nomeEl.textContent = item[0] || "Despesa sem nome";
              valorDisplay.textContent = ui.brl(Number(item[1]) || 0);
              atualizarTag();
              atualizarEquiv();
              return true;
            }
            item.splice(0, item.length, ...anterior);
            return false;
          };

          const campoNome = ui.campo("Nome da despesa", item[0], (v) => editarItem(0, v));
          campoNome.classList.add("campo-completo");
          const campoVal = ui.campo("Valor (R$)", item[1], (v) => editarItem(1, v), 0);
          const selPeriodo = comercial.seletor("Periodicidade", periodos, item[2] ?? "mensal", (v) => editarItem(2, v));
          const opCatsItem = [
            ...baseCats.map((c) => [c, c]),
            ...(cat && !baseCats.includes(cat) && cat !== "Outros" ? [[cat, cat]] : []),
            ["Outros", "Outros"],
          ];
          const selCatItem = comercial.seletor("Categoria", opCatsItem, cat, (v) => {
            const ok = editarItem(3, v);
            if (ok && catAtual && v !== catAtual) {
              itemSelecionado = null;
              renderizarListaGaveta();
              atualizarResumoGaveta();
            }
            return ok;
          });

          gradeCampos.append(
            campoNome,
            campoVal,
            comercial.rotular("Periodicidade", selPeriodo),
            comercial.rotular("Categoria", selCatItem),
          );
          atualizarEquiv();

          const rodapeInline = ui.elemento("div", undefined, "acoes-inline-gaveta");
          const btnRemover = ui.botao("Remover despesa", () => {
            const idxAtual = operacao.custos.indexOf(item);
            if (idxAtual < 0) return;
            operacao.custos.splice(idxAtual, 1);
            if (atualizar()) {
              removido = { indice: idxAtual, item };
              itemSelecionado = null;
              textoDesfazer.textContent = "\"" + (item[0] || "Despesa") + "\" removida.";
              barraDesfazer.hidden = false;
              renderizarListaGaveta();
              atualizarResumoGaveta();
            } else {
              operacao.custos.splice(idxAtual, 0, item);
            }
          }, true);
          btnRemover.classList.add("btn-remover-contextual");

          const btnConcluir = ui.botao("Concluir", () => {
            itemSelecionado = null;
            renderizarListaGaveta();
          }, true);
          btnConcluir.classList.add("botao-filtro-cat");

          rodapeInline.append(btnRemover, btnConcluir);
          editorInline.append(gradeCampos, notaEquiv, rodapeInline);
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

    renderizarListaGaveta();
    atualizarResumoGaveta();
    atualizarGavetaAtiva = atualizarResumoGaveta;

    ui.abrirGaveta(ancora, catAtual || "Todas as despesas", corpoConteudo, {
      classe: "gaveta-custos-v2",
      cabecalhoPersonalizado: headerConteudo,
      rodape: rodapeConteudo,
      aoFechar() { atualizarGavetaAtiva = null; },
    });
  }

  function obterOuCriarCard(nome) {
    if (cardsMapa.has(nome)) return cardsMapa.get(nome);
    const cor = coresCategoria[nome] || "#275b44";
    const card = ui.elemento("button", undefined, "cartao card-categoria-custo");
    card.type = "button";
    card.dataset.categoria = nome;
    card.setAttribute("aria-haspopup", "dialog");
    card.addEventListener("click", () => abrirGavetaCategoria(card, nome));

    const topoCard = ui.elemento("div", undefined, "topo-card-categoria");
    const tituloBloco = ui.elemento("div", undefined, "titulo-card-categoria");
    const icone = ui.elemento("span", undefined, "icone-categoria");
    icone.dataset.categoria = nome;
    icone.setAttribute("aria-hidden", "true");
    const metaTitulo = ui.elemento("div", undefined, "meta-titulo-categoria");
    const qtdEl = ui.elemento("small", "", "qtd-card-categoria");
    metaTitulo.append(ui.elemento("strong", nome), qtdEl);
    tituloBloco.append(icone, metaTitulo);
    const seta = ui.elemento("span", "↗", "seta-card-categoria");
    seta.setAttribute("aria-hidden", "true");
    topoCard.append(tituloBloco, seta);

    const valorBloco = ui.elemento("div", undefined, "valor-card-categoria");
    const valorEl = ui.elemento("strong", "", "valor-financeiro");
    const pctEl = ui.elemento("small");
    valorBloco.append(valorEl, pctEl);

    const trilha = ui.elemento("div", undefined, "trilha-ranking");
    const barra = ui.elemento("div", undefined, "barra-preenchimento");
    trilha.append(barra);

    card.append(topoCard, valorBloco, trilha);
    const ref = { card, qtdEl, valorEl, pctEl, barra, cor };
    cardsMapa.set(nome, ref);
    return ref;
  }

  const btnTodas = ui.botao("Ver todas", () => abrirGavetaCategoria(btnTodas, ""), true);

  const exibir = () => {
    const total = Paisagismo.custos(operacao);
    mensal.resultado.value = ui.brl(total.mensal);
    anual.resultado.value = ui.brl(total.anual);
    ui.mostrarValor(hora, ui.brl(total.hora));
    ui.mostrarValor(valorMiolo, ui.brl(total.mensal));
    infoBase.textContent = ui.numero(operacao.horas) + " h/mês";
    infoItens.textContent = operacao.custos.length + " itens";
    btnTodas.textContent = "Ver todas (" + operacao.custos.length + ")";

    const itensMensais = itensMensaisAtuais();
    const grupos = agruparCategorias(itensMensais);
    const baseMensal = Math.max(0.01, total.mensal);
    const horasRef = Math.max(0.01, operacao.horas);

    /* Atualiza os 4 cards no lugar (sem reconstruir) */
    const cardsVisiveis = grupos.map((grupo) => {
      const ref = obterOuCriarCard(grupo.nome);
      const pct = total.mensal > 0 ? Math.round((grupo.valorMensal / baseMensal) * 100) : 0;
      ref.qtdEl.textContent = grupo.quantidade + (grupo.quantidade === 1 ? " custo" : " custos");
      ui.mostrarValor(ref.valorEl, ui.brl(grupo.valorMensal));
      ref.pctEl.textContent = pct + "% do total";
      ref.barra.setAttribute("style", "width:" + Math.max(grupo.valorMensal > 0 ? 4 : 0, pct) + "%;background:" + ref.cor);
      return ref.card;
    });
    gradeCards.replaceChildren(...cardsVisiveis);

    /* Atualiza Donut e grade 2×2 compacta de impacto por hora */
    const ordenados = [...grupos].sort((a, b) => b.valorMensal - a.valorMensal);
    let cursor = 0;
    const fatias = [];
    const visiveisComValor = ordenados.filter((g) => g.valorMensal > 0);
    for (const [idx, g] of visiveisComValor.entries()) {
      const fatiaPct = (g.valorMensal / baseMensal) * 100;
      const inicio = cursor;
      cursor += fatiaPct;
      const cor = coresCategoria[g.nome] || "#275b44";
      const sep = visiveisComValor.length > 1 ? 0.55 : 0;
      fatias.push(cor + " " + (inicio + (idx > 0 ? sep : 0)).toFixed(2) + "% " + Math.max(inicio, cursor - sep).toFixed(2) + "%");
      if (sep > 0) fatias.push("#fffdf9 " + Math.max(inicio, cursor - sep).toFixed(2) + "% " + cursor.toFixed(2) + "%");
    }
    rosca.setAttribute("style", fatias.length ? "background:conic-gradient(" + fatias.join(",") + ")" : "background:#e5e2d7");

    const maxHora = Math.max(0.01, ...ordenados.map((g) => g.valorMensal / horasRef));
    gradeImpacto.replaceChildren(...ordenados.map((g) => {
      const impactoHora = g.valorMensal / horasRef;
      const pctTotal = total.mensal > 0 ? Math.round((g.valorMensal / baseMensal) * 100) : 0;
      const larguraPct = Math.max(impactoHora > 0 ? 6 : 0, Math.round((impactoHora / maxHora) * 100));
      const cor = coresCategoria[g.nome] || "#275b44";
      const celula = ui.elemento("div", undefined, "celula-impacto");
      const linhaTopo = ui.elemento("div", undefined, "topo-celula-impacto");
      const rotulo = ui.elemento("span", undefined, "rotulo-com-ponto");
      const ponto = ui.elemento("i");
      ponto.setAttribute("style", "background:" + cor);
      rotulo.append(ponto, g.nome);
      linhaTopo.append(rotulo, ui.elemento("small", pctTotal + "%"));
      const valorHoraEl = ui.elemento("strong", ui.brl(impactoHora) + "/h");
      const trilha = ui.elemento("div", undefined, "trilha-ranking");
      const barra = ui.elemento("div", undefined, "barra-preenchimento");
      barra.setAttribute("style", "width:" + larguraPct + "%;background:" + cor);
      trilha.append(barra);
      celula.append(linhaTopo, valorHoraEl, trilha);
      return celula;
    }));

    /* Atualiza Maiores despesas individuais na coluna direita */
    const maiores = itensMensais
      .map(([nome, valorMensal]) => ({ nome, valorMensal }))
      .sort((a, b) => b.valorMensal - a.valorMensal)
      .slice(0, 4);
    ranking.replaceChildren(...(maiores.length ? maiores.map(({ nome, valorMensal }) => {
      const pct = Math.min(100, Math.round((valorMensal / baseMensal) * 100));
      const item = ui.elemento("div", undefined, "item-ranking");
      const topo = ui.elemento("div", undefined, "topo-ranking");
      topo.append(ui.elemento("span", nome), ui.elemento("strong", ui.brl(valorMensal) + " · " + pct + "%"));
      const trilha = ui.elemento("div", undefined, "trilha-ranking");
      const barra = ui.elemento("div", undefined, "barra-preenchimento");
      barra.setAttribute("style", "width:" + Math.max(4, pct) + "%");
      trilha.append(barra);
      item.append(topo, trilha);
      return item;
    }) : [ui.elemento("p", "Cadastre despesas para visualizar os maiores custos.")]));

    /* Atualiza subtotal e resumo no cabeçalho/rodapé da gaveta se ela estiver aberta */
    atualizarGavetaAtiva?.();
  };

  const atualizar = ctx.aoAlterar(exibir);

  const blocoGrafico = ui.elemento("section", undefined, "cartao dashboard-grafico-custos");
  const graficoGrade = ui.elemento("div", undefined, "grade-grafico-custos");
  const colRosca = ui.elemento("div", undefined, "bloco-rosca");
  colRosca.append(rosca);
  const colImpacto = ui.elemento("div", undefined, "bloco-barras-dashboard");
  colImpacto.append(ui.elemento("h3", "Impacto de cada grupo no custo/hora"), gradeImpacto);
  graficoGrade.append(colRosca, colImpacto);
  blocoGrafico.append(ui.elemento("h2", "Visão gráfica dos gastos"), graficoGrade);

  const areaEsquerda = ui.elemento("div", undefined, "pilha area-custos-esquerda");
  areaEsquerda.append(gradeCards, blocoGrafico);

  const grade = ui.elemento("div", undefined, "grade grade-cadastro");
  const resumo = ui.elemento("div", undefined, "pilha resumo resumo-operacao");
  const destaque = ui.cartao("Custo por hora", hora, subtituloHora);
  destaque.classList.add("preco");
  resumo.append(
    destaque,
    ui.cartao("Custo de operação",
      ui.campo("Horas mensais de referência", operacao.horas, ui.editar(operacao, "horas", atualizar), 0.01),
      mensal.bloco,
      anual.bloco),
    ui.cartao("Maiores despesas individuais", ranking),
  );
  grade.append(areaEsquerda, resumo);

  const acoesCabecalho = ui.elemento("div", undefined, "acoes");
  const btnEvolucao = ui.botao("Evolução mensal", () => {
    ui.abrirDialogo(btnEvolucao, "Evolução mensal e trimestral de custos", construirPainelEvolucao());
  }, true);
  const btnRegistrarMes = ui.botao("Registrar mês atual", () => registrarMes());
  acoesCabecalho.append(btnTodas, btnEvolucao, btnRegistrarMes);

  exibir();
  return [ui.cabecalho("Custos da operação", "Clique em qualquer grupo para editar despesas ao vivo.", acoesCabecalho), grade];
};
