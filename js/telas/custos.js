Paisagismo.telaCustos = (ctx) => {
  const ui = Paisagismo.ui;
  const operacao = ctx.dados.operacao;
  const mensal = ui.linha("Custo mensal");
  const anual = ui.linha("Custo anual");
  const hora = ui.elemento("output", undefined, "valor-financeiro");
  const exibir = () => {
    const total = Paisagismo.custos(operacao);
    mensal.resultado.value = ui.brl(total.mensal);
    anual.resultado.value = ui.brl(total.anual);
    ui.mostrarValor(hora, ui.brl(total.hora));
  };
  const grade = ui.elemento("div", undefined, "grade grade-cadastro");
  const atualizar = ctx.aoAlterar(exibir);
  const resumo = ui.elemento("div", undefined, "pilha resumo resumo-operacao");
  const destaque = ui.cartao("Custo por hora", hora);
  destaque.classList.add("preco");
  resumo.append(destaque, ui.cartao("Custo de operação",
      ui.campo("Horas mensais de referência", operacao.horas, ui.editar(operacao, "horas", atualizar), 0.01),
      mensal.bloco, anual.bloco));
  grade.append(ui.editor("Despesas da operação (R$)", "Valor por período em reais", operacao.custos, atualizar,
    ["Despesa", "Valor (R$)"], { tipo: "custo", colunas: true,
      porPagina: window.matchMedia?.("(min-width: 1041px) and (min-height: 900px)").matches
        ? 22 : window.matchMedia?.("(min-width: 1041px)").matches ? 14 : 8 }), resumo);
  exibir();
  return [ui.cabecalho("Custos da operação", "Defina as despesas fixas e a base mensal de horas."), grade];
};
