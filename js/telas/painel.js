Paisagismo.telaPainel = (ctx) => {
  const ui = Paisagismo.ui;
  const hoje = Paisagismo.comercial.hoje();
  const painel = Paisagismo.resumirPainel(ctx.dados.salvos, hoje, ctx.versaoPendente);
  const acoes = ui.elemento("div", undefined, "acoes");
  acoes.append(ui.botao("Abrir orçamento", () => ctx.navegar("orcamento")),
    ui.botao("Ver modelos de serviço", () => ctx.navegar("modelos"), true));
  const topo = ui.cabecalho("Visão geral", "Acompanhe propostas e retornos de cada projeto.", acoes);
  topo.classList.add("topo-painel");
  const valor = ui.elemento("section", undefined, "indicador-principal");
  const numeroPotencial = ui.elemento("strong", undefined, "valor-indicador valor-financeiro");
  ui.animarNumero(numeroPotencial, ui.brl(painel.potencial));
  valor.append(ui.elemento("h2", "Valor em aberto"),
    numeroPotencial,
    ui.elemento("p", "Propostas planejadas e enviadas"));
  const destaque = ui.elemento("div", undefined, "destaque-painel");
  destaque.append(topo, valor);

  const contagens = ui.elemento("section", undefined, "cartao indicadores-secundarios");
  contagens.setAttribute("aria-label", "Indicadores comerciais");
  for (const [rotulo, quantidade, subtexto] of [
    ["Propostas em aberto", ui.numero(painel.abertas), "Planejadas e enviadas"],
    ["Retornos até hoje", ui.numero(painel.aRetomar), "Atenção comercial imediata"],
    ["Propostas aprovadas", ui.numero(painel.aprovadas), "Projetos confirmados"],
  ]) {
    const indicador = ui.elemento("div");
    const rotuloBloco = ui.elemento("div");
    rotuloBloco.append(ui.elemento("h2", rotulo), ui.elemento("span", subtexto, "subtexto-indicador"));
    const numero = ui.elemento("strong", undefined, "valor-indicador");
    ui.animarNumero(numero, quantidade);
    indicador.append(rotuloBloco, numero);
    contagens.append(indicador);
  }

  const total = painel.funil.reduce((soma, [, quantidade]) => soma + quantidade, 0);
  const funil = painel.funil.map(([situacao, quantidade]) => {
    const linha = ui.elemento("div", undefined, "funil-linha");
    linha.dataset.situacao = situacao;
    const barra = ui.elemento("meter");
    barra.max = Math.max(1, total);
    barra.value = quantidade;
    barra.setAttribute("aria-hidden", "true");
    const pct = total > 0 ? Math.round((quantidade / total) * 100) : 0;
    const rotuloValor = total > 0 ? ui.numero(quantidade) + " (" + pct + "%)" : ui.numero(quantidade);
    linha.append(ui.linha(situacao, rotuloValor, "strong").bloco, barra);
    return linha;
  });

  const retornos = painel.retornos.slice(0, 3).map((item) => {
    const linha = ui.elemento("div", undefined, "linha item-agenda");
    const detalhes = ui.elemento("div");
    const dia = item.acompanhamento.proximo;
    const urgencia = dia < hoje ? "atrasado" : dia === hoje ? "hoje" : "agendado";
    const rotulo = dia < hoje ? "Atrasado" : dia === hoje ? "Hoje" : Paisagismo.comercial.formatarData(dia);
    const badge = ui.elemento("span", rotulo, "badge-prazo");
    badge.dataset.urgencia = urgencia;
    detalhes.append(
      ui.elemento("strong", [item.clienteNome, item.projeto.nome].filter(Boolean).join(" · ")),
      ui.elemento("p", rotulo + " · " + (item.acompanhamento.acao || "Retomar contato")),
      badge,
    );
    linha.append(detalhes, ui.botao("Abrir", () => ctx.abrir(ctx.dados.salvos.indexOf(item)), true));
    return linha;
  });
  if (!retornos.length) retornos.push(ui.elemento("p", "Nenhum próximo contato nas propostas em aberto."));
  const area = ui.elemento("div", undefined, "painel-detalhes");
  const contatos = ui.cartao("Próximos contatos", ...retornos,
    ui.botao("Ver agenda", () => ctx.navegar("retornos"), true));
  area.append(contatos, ui.cartao("Situação das propostas", ...funil));
  const painelCompleto = ui.elemento("div", undefined, "pilha painel-espaco");
  const inicio = ui.elemento("div", undefined, "painel-inicio");
  inicio.append(destaque, contagens);
  painelCompleto.append(inicio, area);
  if (painel.recentes.length) {
    const recentes = painel.recentes.slice(0, 3).map((item) => {
      const registro = ui.elemento("div", undefined, "linha cartao-proposta-item");
      const detalhes = ui.elemento("div");
      const situacao = item.acompanhamento.situacao;
      const etiqueta = ui.elemento("span", situacao, "status-proposta");
      etiqueta.dataset.situacao = situacao;
      detalhes.append(ui.elemento("strong", item.projeto.nome),
        ui.elemento("p", [item.clienteNome, ui.brl(Paisagismo.calcular(item.projeto, item.hora).preco)]
          .filter(Boolean).join(" · ")), etiqueta);
      const abrir = ui.botao("Abrir", () => ctx.abrir(ctx.dados.salvos.indexOf(item)), true);
      abrir.setAttribute("aria-label", "Ver proposta no histórico: " + item.projeto.nome);
      registro.append(detalhes, abrir);
      return registro;
    });
    area.append(ui.cartao("Propostas recentes", ...recentes));
  }
  return [painelCompleto];
};
