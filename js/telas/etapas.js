Paisagismo.telaEtapas = (ctx) => {
  const ui = Paisagismo.ui;
  const etapas = ctx.dados.projeto.etapa;
  const total = ui.elemento("output", undefined, "valor-financeiro");
  const subtitulo = ui.elemento("div", undefined, "subtitulo-preco");
  const contagemAtividades = ui.elemento("span");
  const contagemEntregaveis = ui.elemento("span", undefined, "badge-margem");
  subtitulo.append(contagemAtividades, contagemEntregaveis);
  const ranking = ui.elemento("div", undefined, "ranking-barras");

  const exibir = () => {
    const somaHoras = Paisagismo.horasProjeto(etapas);
    ui.mostrarValor(total, ui.numero(somaHoras) + " h");
    const entregaveis = etapas.filter(([, , , , publica]) => publica === true).length;
    contagemAtividades.textContent = etapas.length + (etapas.length === 1 ? " atividade" : " atividades");
    contagemEntregaveis.textContent = entregaveis + (entregaveis === 1 ? " entregável" : " entregáveis");

    const maiores = etapas
      .map(([nome, horas], i) => ({ nome: nome || "Atividade " + (i + 1), horas: Number(horas) || 0 }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5);
    const baseHoras = Math.max(0.01, somaHoras);
    ranking.replaceChildren(...(maiores.length ? maiores.map(({ nome, horas }) => {
      const pct = Math.min(100, Math.round((horas / baseHoras) * 100));
      const item = ui.elemento("div", undefined, "item-ranking");
      const topo = ui.elemento("div", undefined, "topo-ranking");
      topo.append(ui.elemento("span", nome), ui.elemento("strong", ui.numero(horas) + " h · " + pct + "%"));
      const trilha = ui.elemento("div", undefined, "trilha-ranking");
      const barra = ui.elemento("div", undefined, "barra-preenchimento");
      barra.setAttribute("style", "width:" + Math.max(4, pct) + "%");
      trilha.append(barra);
      item.append(topo, trilha);
      return item;
    }) : [ui.elemento("p", "Adicione atividades para visualizar a distribuição de esforço.")]));
  };

  const grade = ui.elemento("div", undefined, "grade grade-cadastro");
  const destaque = ui.cartao("Horas estimadas", total, subtitulo);
  destaque.classList.add("preco");
  const distribuicao = ui.cartao("Distribuição de esforço", ranking);
  const resumo = ui.elemento("div", undefined, "pilha resumo resumo-operacao");
  resumo.append(destaque, distribuicao);

  grade.append(ui.editor("Atividades e durações (h)", "Horas estimadas", etapas, ctx.aoAlterar(exibir),
    ["Atividade", "Horas"], { tipo: "etapa", ordenar: true, colunas: true,
      porPagina: window.matchMedia?.("(min-width: 1041px)").matches ? 14 : 8 }), resumo);
  exibir();
  return [ui.cabecalho("Etapas do projeto", "Estime o tempo de trabalho de cada atividade."), grade];
};
