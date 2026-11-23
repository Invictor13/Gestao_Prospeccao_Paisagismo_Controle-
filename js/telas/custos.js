Paisagismo.telaCustos = (ctx) => {
  const ui = Paisagismo.ui;
  const operacao = ctx.dados.operacao;
  const mensal = ui.linha("Custo mensal");
  const anual = ui.linha("Custo anual");
  const hora = ui.linha("Custo por hora");
  const exibir = () => {
    const total = Paisagismo.custos(operacao);
    mensal.resultado.value = ui.brl(total.mensal);
    anual.resultado.value = ui.brl(total.anual);
    hora.resultado.value = ui.brl(total.hora);
  };
  const grade = ui.elemento("div", undefined, "grade grade-cadastro");
  const atualizar = ctx.aoAlterar(exibir);
  const resumo = ui.cartao("Custo de operação",
      ui.campo("Horas mensais de referência", operacao.horas, ui.editar(operacao, "horas", atualizar), 0.01),
      mensal.bloco, anual.bloco, hora.bloco);
  resumo.classList.add("resumo", "resumo-operacao");
  grade.append(ui.editor("Despesas da operação", "Valor por período em reais", operacao.custos, atualizar,
    ["Despesa", "Valor (R$)"], { tipo: "custo" }), resumo);
  exibir();
  return [ui.cabecalho("Custos da operação", "Defina as despesas fixas e a base mensal de horas."), grade];
};
