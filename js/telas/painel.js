Paisagismo.telaPainel = (ctx) => {
  const ui = Paisagismo.ui;
  const hoje = Paisagismo.comercial.hoje();
  const painel = Paisagismo.resumirPainel(ctx.dados.salvos, hoje, ctx.versaoPendente);
  const indicadores = ui.elemento("div", undefined, "indicadores-painel");
  for (const [rotulo, valor] of [
    ["Propostas em aberto", ui.numero(painel.abertas)],
    ["Retornos até hoje", ui.numero(painel.aRetomar)],
    ["Propostas aprovadas", ui.numero(painel.aprovadas)],
    ["Valor em aberto", ui.brl(painel.potencial)],
  ]) {
    indicadores.append(ui.cartao(rotulo, ui.elemento("strong", valor, "valor-indicador")));
  }
  const funil = painel.funil.map(([situacao, quantidade]) => ui.linha(situacao, String(quantidade), "strong").bloco);
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
  const area = ui.elemento("div", undefined, "grade");
  const contatos = ui.cartao("Próximos contatos", ...retornos,
    ui.botao("Ver agenda", () => ctx.navegar("retornos"), true));
  area.append(contatos, ui.cartao("Situação das propostas", ...funil));
  const painelCompleto = ui.elemento("div", undefined, "pilha");
  painelCompleto.append(indicadores, area);
  return [ui.cabecalho("Visão geral", "Indicadores pela versão mais recente gravada de cada projeto.",
    ui.botao("Abrir orçamento", () => ctx.navegar("orcamento"))), painelCompleto];
};
