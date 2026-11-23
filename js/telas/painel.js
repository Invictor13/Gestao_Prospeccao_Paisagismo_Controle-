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
  valor.append(ui.elemento("h2", "Valor em aberto"),
    ui.elemento("strong", ui.brl(painel.potencial), "valor-indicador valor-financeiro"),
    ui.elemento("p", "Propostas planejadas e enviadas"));
  const destaque = ui.elemento("div", undefined, "destaque-painel");
  destaque.append(topo, valor);
  const contagens = ui.elemento("section", undefined, "cartao indicadores-secundarios");
  contagens.setAttribute("aria-label", "Indicadores comerciais");
  for (const [rotulo, valor] of [
    ["Propostas em aberto", ui.numero(painel.abertas)],
    ["Retornos até hoje", ui.numero(painel.aRetomar)],
    ["Propostas aprovadas", ui.numero(painel.aprovadas)],
  ]) {
    const indicador = ui.elemento("div");
    indicador.append(ui.elemento("h2", rotulo), ui.elemento("strong", valor, "valor-indicador"));
    contagens.append(indicador);
  }
  const total = painel.funil.reduce((soma, [, quantidade]) => soma + quantidade, 0);
  const funil = painel.funil.map(([situacao, quantidade]) => {
    const linha = ui.elemento("div", undefined, "funil-linha");
    const barra = ui.elemento("meter");
    barra.max = Math.max(1, total);
    barra.value = quantidade;
    barra.setAttribute("aria-hidden", "true");
    linha.append(ui.linha(situacao, ui.numero(quantidade), "strong").bloco, barra);
    return linha;
  });
  const retornos = painel.retornos.slice(0, 5).map((item) => {
    const linha = ui.elemento("div", undefined, "linha");
    const detalhes = ui.elemento("div");
    const dia = item.acompanhamento.proximo;
    const rotulo = dia < hoje ? "Atrasado" : dia === hoje ? "Hoje" : Paisagismo.comercial.formatarData(dia);
    detalhes.append(ui.elemento("strong", [item.clienteNome, item.projeto.nome].filter(Boolean).join(" · ")),
      ui.elemento("p", rotulo + " · " + (item.acompanhamento.acao || "Retomar contato")));
    linha.append(detalhes, ui.botao("Abrir", () => ctx.abrir(ctx.dados.salvos.indexOf(item)), true));
    return linha;
  });
  if (!retornos.length) retornos.push(ui.elemento("p", "Nenhum próximo contato nas propostas em aberto."));
  const area = ui.elemento("div", undefined, "painel-detalhes");
  const contatos = ui.cartao("Próximos contatos", ...retornos,
    ui.botao("Ver agenda", () => ctx.navegar("retornos"), true));
  area.append(contatos, ui.cartao("Situação das propostas", ...funil));
  const painelCompleto = ui.elemento("div", undefined, "pilha");
  painelCompleto.append(destaque, contagens, area);
  if (painel.recentes.length) {
    const recentes = painel.recentes.map((item) => {
      const registro = ui.elemento("div", undefined, "linha");
      const detalhes = ui.elemento("div");
      const situacao = item.acompanhamento.situacao;
      const etiqueta = ui.elemento("span", situacao, "status-proposta");
      etiqueta.dataset.situacao = situacao;
      detalhes.append(ui.elemento("strong", item.projeto.nome),
        ui.elemento("p", [item.clienteNome, ui.brl(Paisagismo.calcular(item.projeto, item.hora).preco)]
          .filter(Boolean).join(" · ")), etiqueta);
      registro.append(detalhes, ui.botao("Ver proposta no histórico", () => ctx.abrir(ctx.dados.salvos.indexOf(item)), true));
      return registro;
    });
    painelCompleto.append(ui.cartao("Propostas recentes", ...recentes));
  }
  return [painelCompleto];
};
