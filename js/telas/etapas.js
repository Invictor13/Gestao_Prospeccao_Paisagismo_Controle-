Paisagismo.telaEtapas = (ctx) => {
  const ui = Paisagismo.ui;
  const etapas = ctx.dados.projeto.etapa;
  const total = ui.linha("Horas estimadas");
  const exibir = () => {
    total.resultado.value = ui.numero(Paisagismo.horasProjeto(etapas)) + " h";
  };
  const grade = ui.elemento("div", undefined, "grade grade-cadastro");
  const resumo = ui.cartao("Tempo de serviço", total.bloco);
  resumo.classList.add("resumo", "resumo-operacao");
  grade.append(ui.editor("Atividades e durações", "Horas estimadas", etapas, ctx.aoAlterar(exibir),
    ["Atividade", "Horas"], { tipo: "etapa", ordenar: true }), resumo);
  exibir();
  return [ui.cabecalho("Etapas do projeto", "Estime o tempo de trabalho de cada atividade."), grade];
};
