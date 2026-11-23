Paisagismo.telaEtapas = (ctx) => {
  const ui = Paisagismo.ui;
  const etapas = ctx.dados.projeto.etapa;
  const total = ui.elemento("output", undefined, "valor-financeiro");
  const exibir = () => {
    ui.mostrarValor(total, ui.numero(Paisagismo.horasProjeto(etapas)) + " h");
  };
  const grade = ui.elemento("div", undefined, "grade grade-cadastro");
  const resumo = ui.cartao("Horas estimadas", total);
  resumo.classList.add("preco", "resumo", "resumo-operacao");
  grade.append(ui.editor("Atividades e durações", "Horas estimadas", etapas, ctx.aoAlterar(exibir),
    ["Atividade", "Horas"], { tipo: "etapa", ordenar: true }), resumo);
  exibir();
  return [ui.cabecalho("Etapas do projeto", "Estime o tempo de trabalho de cada atividade."), grade];
};
