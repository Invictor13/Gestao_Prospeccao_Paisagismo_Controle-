Paisagismo.telaPainel = (ctx) => {
  const ui = Paisagismo.ui;
  const bot = Paisagismo.botanica;
  const hoje = Paisagismo.comercial.hoje();
  let periodoAtivo = ctx.periodoPainel || "tudo";

  const raiz = ui.elemento("div", undefined, "painel-espaco");

  const PERIODOS = [
    ["30d", "30 dias"],
    ["90d", "90 dias"],
    ["mes", "Este mês"],
    ["tudo", "Tudo"],
  ];

  let timerHero = null;

  function criarCabecalho(painel) {
    if (timerHero) {
      window.clearInterval?.(timerHero);
      timerHero = null;
    }

    const controles = ui.elemento("div");
    controles.append(ui.botao("Novo orçamento", () => ctx.navegar("orcamento")));

    const linkModelos = ui.elemento("button", undefined, "botanical-hero-link");
    linkModelos.type = "button";
    const textoModelos = ui.elemento("span", "Modelos de serviço ");
    const setaModelos = ui.elemento("span", "↗", "botanical-hero-link-seta");
    setaModelos.setAttribute("aria-hidden", "true");
    linkModelos.append(textoModelos, setaModelos);
    linkModelos.addEventListener("click", () => ctx.navegar("modelos"));
    controles.append(linkModelos);

    if (painel.totalRegistros > 0) {
      const seletor = ui.elemento("select", undefined, "painel-seletor-periodo");
      seletor.setAttribute("aria-label", "Período");
      for (const [id, rotulo] of PERIODOS) {
        const opt = ui.elemento("option", rotulo);
        opt.value = id;
        if (periodoAtivo === id) opt.selected = true;
        seletor.append(opt);
      }
      seletor.addEventListener("change", () => {
        periodoAtivo = seletor.value;
        ctx.periodoPainel = periodoAtivo;
        renderizar();
      });
      controles.append(seletor);
    }

    const slides = [
      ["Gestão para paisagismo", "Flora em Folha", "marca"],
      ["Valor em negociação", ui.brl(painel.potencial), "negociacao"],
      ["Valor aprovado", ui.brl(painel.valorAprovado), "aprovado"],
      ["Taxa de conversão", painel.totalPeriodo > 0 ? ui.percentual(painel.taxaConversao) : "—", "conversao"],
    ];
    let indiceSlide = 0;
    const DURACAO_SLIDE = 4000;

    const rotuloEl = ui.elemento("span", slides[0][0]);
    const numeroValor = ui.elemento("strong", slides[0][1]);

    const indicadores = ui.elemento("div", undefined, "botanical-hero-indicadores");
    indicadores.setAttribute("role", "tablist");
    indicadores.setAttribute("aria-label", "Indicadores em destaque");
    const barrasProgresso = [];
    const pontos = slides.map(([nome], idx) => {
      const dot = ui.elemento("button", undefined, "hero-dot");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", nome);
      dot.setAttribute("aria-selected", String(idx === 0));
      if (idx === 0) dot.dataset.ativo = "true";
      const barra = ui.elemento("span", undefined, "hero-dot-progresso");
      barra.setAttribute("aria-hidden", "true");
      dot.append(barra);
      barrasProgresso.push(barra);
      dot.addEventListener("click", () => trocarPara(idx));
      indicadores.append(dot);
      return dot;
    });

    const btnPausa = ui.elemento("button", "❚❚", "hero-pausa-btn");
    btnPausa.type = "button";
    btnPausa.setAttribute("aria-label", "Pausar rotação automática");
    btnPausa.setAttribute("aria-pressed", "false");
    indicadores.append(btnPausa);

    const header = bot.BotanicalHeader({
      rotuloEl,
      valorEl: numeroValor,
      controles,
      rodape: indicadores,
    });
    header.dataset.atmosfera = slides[0][2];

    const caixaValor = header.querySelector?.(".botanical-hero-valor");
    let decorridoMs = 0;
    let pausaHover = false;
    let pausaFoco = false;
    let pausaManual = false;

    function atualizarEstadoPausa() {
      const pausado = pausaHover || pausaFoco || pausaManual;
      header.classList?.toggle("carrossel-pausado", pausado);
    }

    btnPausa.addEventListener("click", () => {
      pausaManual = !pausaManual;
      btnPausa.textContent = pausaManual ? "▶" : "❚❚";
      btnPausa.setAttribute("aria-pressed", String(pausaManual));
      btnPausa.setAttribute("aria-label", pausaManual ? "Retomar rotação automática" : "Pausar rotação automática");
      atualizarEstadoPausa();
    });

    function atualizarProgressoVisual() {
      const fracao = Math.max(0, Math.min(1, decorridoMs / DURACAO_SLIDE));
      barrasProgresso.forEach((b, i) => {
        if (b.style) b.style.transform = i === indiceSlide ? `scaleX(${fracao.toFixed(3)})` : "scaleX(0)";
      });
    }

    function trocarPara(novoIndice) {
      decorridoMs = 0;
      atualizarProgressoVisual();
      if (novoIndice === indiceSlide) return;
      indiceSlide = novoIndice;
      pontos.forEach((p, i) => {
        const ativo = i === indiceSlide;
        p.setAttribute("aria-selected", String(ativo));
        if (ativo) p.dataset.ativo = "true";
        else delete p.dataset.ativo;
      });
      const [rotulo, valor, atmosfera] = slides[indiceSlide];
      header.dataset.atmosfera = atmosfera;
      if (caixaValor?.classList) {
        caixaValor.classList.remove("entrando");
        caixaValor.classList.add("saindo");
        window.setTimeout?.(() => {
          if (!header.isConnected) return;
          rotuloEl.textContent = rotulo;
          numeroValor.textContent = valor;
          caixaValor.classList.remove("saindo");
          void caixaValor.offsetWidth;
          caixaValor.classList.add("entrando");
        }, 220);
      } else {
        rotuloEl.textContent = rotulo;
        numeroValor.textContent = valor;
      }
    }

    if (typeof window !== "undefined" && typeof window.setInterval === "function"
      && window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches) {
      header.addEventListener("pointerenter", () => { pausaHover = true; atualizarEstadoPausa(); });
      header.addEventListener("pointerleave", () => { pausaHover = false; atualizarEstadoPausa(); });
      header.addEventListener("focusin", () => { pausaFoco = true; atualizarEstadoPausa(); });
      header.addEventListener("focusout", (e) => {
        if (!header.contains?.(e.relatedTarget)) {
          pausaFoco = false;
          atualizarEstadoPausa();
        }
      });

      const PASSO_MS = 100;
      timerHero = window.setInterval(() => {
        if (!header.isConnected) {
          window.clearInterval(timerHero);
          timerHero = null;
          return;
        }
        if (pausaHover || pausaFoco || pausaManual || (typeof document !== "undefined" && document.hidden)) return;
        decorridoMs += PASSO_MS;
        atualizarProgressoVisual();
        if (decorridoMs >= DURACAO_SLIDE) {
          trocarPara((indiceSlide + 1) % slides.length);
        }
      }, PASSO_MS);
    }

    return header;
  }

  function criarAtalhos() {
    const totalOrcamentos = ctx.dados.salvos.filter((item) => item !== ctx.versaoPendente).length;
    const totalContatos = ctx.dados.salvos.filter(
      (item) => item !== ctx.versaoPendente && item.acompanhamento.proximo
        && !["Aprovada", "Recusada"].includes(item.acompanhamento.situacao),
    ).length;

    const grade = ui.elemento("section", undefined, "atalhos-painel-equilibrado");
    grade.setAttribute("aria-label", "Atalhos rápidos");

    const itens = [
      { titulo: "Clientes", quantidade: ctx.dados.clientes.length, destino: "clientes", tema: "savia", ilustracao: "pessoas" },
      { titulo: "Orçamentos", quantidade: totalOrcamentos, destino: "historico", tema: "eucalipto", ilustracao: "documentos" },
      { titulo: "Contatos", quantidade: totalContatos, destino: "retornos", tema: "terracota", ilustracao: "calendario" },
      { titulo: "Serviços", quantidade: ctx.dados.modelos.length, destino: "modelos", tema: "oliva", ilustracao: "maleta" },
    ];

    for (const item of itens) {
      grade.append(bot.BotanicalQuickAccessCard({ ...item, aoNavegar: ctx.navegar }));
    }
    return grade;
  }

  function criarAgenda(painel) {
    const estadoAgenda = !painel.retornos.length
      ? "em-dia"
      : painel.atrasados > 0
        ? "atrasado"
        : painel.paraHoje > 0
          ? "hoje"
          : "futuro";

    const rotulosEstado = {
      "em-dia": ["Agenda em dia", "Nenhum retorno pendente"],
      futuro: ["Retornos agendados", ui.numero(painel.retornos.length) + (painel.retornos.length === 1 ? " retorno futuro" : " retornos futuros")],
      hoje: ["Retornos para hoje", ui.numero(painel.paraHoje) + (painel.paraHoje === 1 ? " contato hoje" : " contatos hoje")],
      atrasado: ["Retornos atrasados", ui.numero(painel.atrasados) + (painel.atrasados === 1 ? " atrasado" : " atrasados")],
    };

    const [tituloEstado, subtituloEstado] = rotulosEstado[estadoAgenda];
    const card = bot.OrganicSurface("section", "cartao painel-bloco painel-agenda-card sem-cabecalho");
    card.dataset.estado = estadoAgenda;
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", tituloEstado + ". " + subtituloEstado + ". Abrir agenda comercial.");
    card.addEventListener("click", () => ctx.navegar("retornos"));
    card.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        ctx.navegar("retornos");
      }
    });
    card.append(bot.criarIlustracaoAgenda(estadoAgenda));

    const resumoEstado = ui.elemento("div", undefined, "agenda-estado-direto");
    resumoEstado.append(
      ui.elemento("strong", tituloEstado, "agenda-estado-titulo"),
      ui.elemento("span", subtituloEstado, "agenda-estado-sub"),
    );
    card.append(resumoEstado);

    if (painel.retornos.length) {
      const lista = ui.elemento("div", undefined, "agenda-lista-integrada");
      for (const item of painel.retornos.slice(0, 2)) {
        const linha = ui.elemento("div", undefined, "agenda-linha-direta");
        const dia = item.acompanhamento.proximo;
        const urgencia = dia < hoje ? "atrasado" : dia === hoje ? "hoje" : "agendado";
        const rotulo = dia < hoje ? "Atrasado" : dia === hoje ? "Hoje" : Paisagismo.comercial.formatarData(dia);

        const info = ui.elemento("div", undefined, "agenda-linha-info");
        const cab = ui.elemento("div", undefined, "agenda-item-cab");
        const badge = ui.elemento("span", rotulo, "badge-prazo");
        badge.dataset.urgencia = urgencia;
        cab.append(
          ui.elemento("strong", [item.clienteNome, item.projeto.nome].filter(Boolean).join(" · ")),
          badge,
        );
        info.append(cab, ui.elemento("small", item.acompanhamento.acao || "Retomar contato"));

        const btn = ui.elemento("button", "Abrir", "btn-tabela");
        btn.type = "button";
        btn.addEventListener("click", (evento) => {
          evento.stopPropagation();
          ctx.abrir(ctx.dados.salvos.indexOf(item));
        });

        linha.append(info, btn);
        lista.append(linha);
      }
      card.append(lista);
    }

    return card;
  }

  function criarSituacao(painel) {
    const card = bot.OrganicSurface("section", "cartao painel-bloco painel-situacao-card");
    const topo = ui.elemento("div", undefined, "painel-bloco-topo");
    topo.append(ui.elemento("h2", "Situação das propostas"));
    if (painel.totalPeriodo > 0) {
      topo.append(ui.elemento("span", ui.numero(painel.totalPeriodo) + " no período", "painel-bloco-meta"));
    }
    card.append(topo);

    const rotulosPlural = {
      Planejada: "Planejadas",
      Enviada: "Enviadas",
      Aprovada: "Aprovadas",
      Recusada: "Recusadas",
    };

    const grade = ui.elemento("div", undefined, "situacao-indicadores");
    for (const item of painel.funilDetalhado) {
      const btn = ui.elemento("button", undefined, "situacao-indicador");
      btn.type = "button";
      btn.dataset.situacao = item.situacao;
      btn.setAttribute("aria-label", rotulosPlural[item.situacao] + ": " + ui.numero(item.quantidade));
      btn.addEventListener("click", () => {
        ctx.navegar("historico", painel.totalPeriodo > 0 ? { situacao: item.situacao } : undefined);
      });

      const cab = ui.elemento("div", undefined, "situacao-indicador-topo");
      const qtd = ui.elemento("strong", undefined, "situacao-indicador-qtd");
      ui.animarNumero(qtd, ui.numero(item.quantidade));
      cab.append(qtd, bot.criarSimboloSituacao(item.situacao));

      const nome = ui.elemento("span", rotulosPlural[item.situacao] || item.situacao, "situacao-indicador-nome");
      btn.append(cab, nome);
      grade.append(btn);
    }
    card.append(grade);

    if (painel.totalPeriodo > 0) {
      const barra = ui.elemento("div", undefined, "barra-funil-segmentada");
      barra.setAttribute("aria-hidden", "true");
      for (const item of painel.funilDetalhado) {
        if (!item.quantidade) continue;
        const seg = ui.elemento("span", undefined, "seg-funil");
        seg.dataset.situacao = item.situacao;
        if (seg.style) seg.style.width = ((item.quantidade / painel.totalPeriodo) * 100).toFixed(2) + "%";
        barra.append(seg);
      }
      card.append(barra);
    }

    return card;
  }

  function criarFluxoFinanceiro(painel) {
    const card = bot.OrganicSurface("section", "cartao painel-bloco painel-fluxo-card");
    const topo = ui.elemento("div", undefined, "painel-bloco-topo");
    topo.append(ui.elemento("h2", "Fluxo comercial e operação"));

    const legenda = ui.elemento("div", undefined, "grafico-legenda");
    for (const [classe, texto] of [
      ["aprovado", "Aprovado"],
      ["aberto", "Em negociação"],
      ["saldo", "Acumulado aprovado"],
    ]) {
      const item = ui.elemento("span", undefined, "grafico-legenda-item");
      item.append(ui.elemento("i", undefined, "grafico-ponto " + classe), ui.elemento("span", texto));
      legenda.append(item);
    }
    topo.append(legenda);
    card.append(topo);

    const maxBruto = Math.max(
      0,
      ...painel.evolucao.map((m) => Math.max(m.aprovadoValor, m.abertoValor, m.aprovadoAcumulado)),
    );
    const maxEscala = maxBruto > 0 ? maxBruto : 100;

    const area = ui.elemento("div", undefined, "grafico-area grafico-area-fluxo");
    const eixoY = ui.elemento("div", undefined, "grafico-eixo-y");
    eixoY.setAttribute("aria-hidden", "true");
    eixoY.append(
      ui.elemento("span", maxBruto > 0 ? ui.brl(maxEscala) : "—"),
      ui.elemento("span", maxBruto > 0 ? ui.brl(maxEscala / 2) : "—"),
      ui.elemento("span", "R$ 0"),
    );

    const plotagem = ui.elemento("div", undefined, "grafico-plotagem");
    const colunas = ui.elemento("div", undefined, "grafico-colunas");

    const pontosLinha = [];
    painel.evolucao.forEach((mes, idx) => {
      const grupo = ui.elemento("div", undefined, "grafico-grupo");
      if (maxBruto > 0) {
        grupo.tabIndex = 0;
        grupo.setAttribute(
          "aria-label",
          mes.rotulo + ": Aprovado " + ui.brl(mes.aprovadoValor) + ", Em negociação " + ui.brl(mes.abertoValor) + ", Acumulado " + ui.brl(mes.aprovadoAcumulado),
        );

        const tooltip = ui.elemento("div", undefined, "grafico-tooltip");
        tooltip.append(
          ui.elemento("strong", mes.rotulo),
          ui.elemento("span", "Aprovado: " + ui.brl(mes.aprovadoValor)),
          ui.elemento("span", "Negociação: " + ui.brl(mes.abertoValor)),
          ui.elemento("span", "Acumulado: " + ui.brl(mes.aprovadoAcumulado)),
        );
        grupo.append(tooltip);
      }

      const trilho = ui.elemento("div", undefined, "grafico-trilho");
      const barAprovado = ui.elemento("span", undefined, "grafico-barra aprovado");
      const barAberto = ui.elemento("span", undefined, "grafico-barra aberto");
      if (barAprovado.style) {
        barAprovado.style.height = mes.aprovadoValor > 0 ? Math.max(6, (mes.aprovadoValor / maxEscala) * 100).toFixed(1) + "%" : "0%";
      }
      if (barAberto.style) {
        barAberto.style.height = mes.abertoValor > 0 ? Math.max(6, (mes.abertoValor / maxEscala) * 100).toFixed(1) + "%" : "0%";
      }
      trilho.append(barAprovado, barAberto);
      grupo.append(trilho, ui.elemento("span", mes.rotulo, "grafico-mes"));
      colunas.append(grupo);

      if (maxBruto > 0) {
        const xPct = ((idx + 0.5) / painel.evolucao.length) * 100;
        const yPct = 100 - Math.max(4, Math.min(94, (mes.aprovadoAcumulado / maxEscala) * 100));
        pontosLinha.push([xPct, yPct]);
      }
    });

    plotagem.append(colunas);

    if (maxBruto > 0 && typeof document.createElementNS === "function" && pontosLinha.length > 1) {
      const SVG_NS = "http://www.w3.org/2000/svg";
      const svgLinha = document.createElementNS(SVG_NS, "svg");
      svgLinha.setAttribute("viewBox", "0 0 100 100");
      svgLinha.setAttribute("preserveAspectRatio", "none");
      svgLinha.setAttribute("class", "grafico-linha-acumulado");
      svgLinha.setAttribute("aria-hidden", "true");

      const poly = document.createElementNS(SVG_NS, "polyline");
      poly.setAttribute("points", pontosLinha.map(([x, y]) => x.toFixed(1) + "," + y.toFixed(1)).join(" "));
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", "#C4A66B");
      poly.setAttribute("stroke-width", "1.75");
      poly.setAttribute("vector-effect", "non-scaling-stroke");
      svgLinha.append(poly);

      for (const [x, y] of pontosLinha) {
        const pt = document.createElementNS(SVG_NS, "circle");
        pt.setAttribute("cx", x.toFixed(1));
        pt.setAttribute("cy", y.toFixed(1));
        pt.setAttribute("r", "1.8");
        pt.setAttribute("fill", "#FFFFFF");
        pt.setAttribute("stroke", "#C4A66B");
        pt.setAttribute("stroke-width", "1.1");
        pt.setAttribute("vector-effect", "non-scaling-stroke");
        svgLinha.append(pt);
      }
      plotagem.append(svgLinha);
    }

    area.append(eixoY, plotagem);
    card.append(area);

    const rodape = ui.elemento("div", undefined, "grafico-rodape-resumo");
    for (const [rotulo, valor, classe] of [
      ["Em negociação", ui.brl(painel.potencial), ""],
      ["Valor aprovado", ui.brl(painel.valorAprovado), "positivo"],
      ["Taxa de conversão", painel.totalPeriodo > 0 ? ui.percentual(painel.taxaConversao) : "—", ""],
    ]) {
      const cel = ui.elemento("div", undefined, "grafico-rodape-item");
      const val = ui.elemento("strong", valor);
      if (classe) val.dataset.tom = classe;
      cel.append(ui.elemento("small", rotulo), val);
      rodape.append(cel);
    }
    card.append(rodape);
    return card;
  }

  function criarListaLateral(painel) {
    const temRecentes = painel.recentes.length > 0;
    const card = bot.OrganicSurface("section", "cartao painel-bloco painel-lateral-card");
    const topo = ui.elemento("div", undefined, "painel-bloco-topo");

    if (temRecentes) {
      topo.append(ui.elemento("h2", "Propostas recentes"));
      const verTodas = ui.elemento("button", "Ver todas →", "painel-link-acao");
      verTodas.type = "button";
      verTodas.addEventListener("click", () => ctx.navegar("historico"));
      topo.append(verTodas);
      card.append(topo);

      const lista = ui.elemento("div", undefined, "ref-lista");
      for (const item of painel.recentes.slice(0, 3)) {
        const indice = ctx.dados.salvos.indexOf(item);
        const situacao = item.acompanhamento.situacao;
        const valor = Paisagismo.calcular(item.projeto, item.hora).preco;

        const row = ui.elemento("button", undefined, "ref-linha");
        row.type = "button";
        row.dataset.tom = situacao === "Aprovada" ? "salvia" : situacao === "Recusada" ? "terracota" : "eucalipto";
        row.addEventListener("click", () => ctx.abrir(indice));

        const icone = ui.elemento("span", undefined, "ref-icone");
        icone.dataset.refIcone = "proposta";
        icone.setAttribute("aria-hidden", "true");

        const info = ui.elemento("div", undefined, "ref-info");
        info.append(
          ui.elemento("span", item.projeto.nome || "Sem título", "ref-titulo"),
          ui.elemento("strong", ui.brl(valor), "ref-valor"),
        );

        const meta = ui.elemento("span", situacao, "status-proposta");
        meta.dataset.situacao = situacao;

        const seta = ui.elemento("span", "→", "ref-seta");
        seta.setAttribute("aria-hidden", "true");

        row.append(icone, info, meta, seta);
        lista.append(row);
      }
      card.append(lista);
      return card;
    }

    topo.append(ui.elemento("h2", "Referências da operação"));
    card.append(topo);

    const perfil = ctx.dados.perfil || {};
    const nomeEmpresa = perfil.empresa || "Não cadastrado";
    const telefoneEmpresa = perfil.telefone ? " · " + perfil.telefone : "";

    const lista = ui.elemento("div", undefined, "ref-lista");
    for (const [titulo, valor, tom, iconeNome, destino] of [
      ["Custo por hora", ui.brl(painel.custoHoraAtual) + "/h", "dourado", "hora", "custos"],
      ["Custo mensal da operação", ui.brl(painel.custoMensalAtual), "eucalipto", "mensal", "custos"],
      ["Capacidade mensal", ui.numero(ctx.dados.operacao.horas) + " h/mês", "salvia", "capacidade", "custos"],
      ["Empresa e contato", nomeEmpresa + telefoneEmpresa, "terracota", "empresa", "custos"],
    ]) {
      const row = ui.elemento("button", undefined, "ref-linha");
      row.type = "button";
      row.dataset.tom = tom;
      row.addEventListener("click", () => ctx.navegar(destino));

      const icone = ui.elemento("span", undefined, "ref-icone");
      icone.dataset.refIcone = iconeNome;
      icone.setAttribute("aria-hidden", "true");

      const info = ui.elemento("div", undefined, "ref-info");
      info.append(
        ui.elemento("span", titulo, "ref-titulo"),
        ui.elemento("strong", valor, "ref-valor"),
      );

      const seta = ui.elemento("span", "→", "ref-seta");
      seta.setAttribute("aria-hidden", "true");

      row.append(icone, info, seta);
      lista.append(row);
    }
    card.append(lista);
    return card;
  }

  function renderizar() {
    const painel = Paisagismo.resumirPainel(
      ctx.dados.salvos,
      hoje,
      ctx.versaoPendente,
      periodoAtivo,
      ctx.dados.operacao,
      ctx.dados.historicoCustos,
    );

    const gradeCentro = ui.elemento("div", undefined, "painel-grade-equilibrada");
    gradeCentro.append(criarAgenda(painel), criarSituacao(painel));

    const gradeBase = ui.elemento("div", undefined, "painel-base-dupla");
    gradeBase.append(criarFluxoFinanceiro(painel), criarListaLateral(painel));

    raiz.replaceChildren(
      criarCabecalho(painel),
      criarAtalhos(),
      gradeCentro,
      gradeBase,
    );
  }

  renderizar();
  return [raiz];
};
