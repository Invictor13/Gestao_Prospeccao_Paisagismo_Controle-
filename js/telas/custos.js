Paisagismo.telaCustos = (ctx) => {
  const ui = Paisagismo.ui;
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

  const exibir = () => {
    const total = Paisagismo.custos(operacao);
    mensal.resultado.value = ui.brl(total.mensal);
    anual.resultado.value = ui.brl(total.anual);
    ui.mostrarValor(hora, ui.brl(total.hora));
    infoBase.textContent = ui.numero(operacao.horas) + " h/mês";
    infoItens.textContent = operacao.custos.length + " itens";

    const maiores = operacao.custos
      .map(([nome, valor, periodo], i) => {
        const valorMensal = (Number(valor) || 0) / mesesPeriodo[periodo ?? "mensal"];
        return { nome: nome || "Despesa " + (i + 1), valorMensal };
      })
      .sort((a, b) => b.valorMensal - a.valorMensal)
      .slice(0, 4);
    const baseMensal = Math.max(0.01, total.mensal);
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
    }) : [ui.elemento("p", "Cadastre despesas para comparar os maiores custos da operação.")]));
  };

  const grade = ui.elemento("div", undefined, "grade grade-cadastro");
  const atualizar = ctx.aoAlterar(exibir);
  const resumo = ui.elemento("div", undefined, "pilha resumo resumo-operacao");
  const destaque = ui.cartao("Custo por hora", hora, subtituloHora);
  destaque.classList.add("preco");
  resumo.append(
    destaque,
    ui.cartao("Custo de operação",
      ui.campo("Horas mensais de referência", operacao.horas, ui.editar(operacao, "horas", atualizar), 0.01),
      mensal.bloco,
      anual.bloco),
    ui.cartao("Maiores custos mensais", ranking),
  );
  const porPagina = window.matchMedia?.("(min-width: 1041px) and (min-height: 820px)").matches
    ? 22 : window.matchMedia?.("(min-width: 1041px)").matches ? 14 : 8;
  grade.append(ui.editor("Despesas da operação (R$)", "Valor por período em reais", operacao.custos, atualizar,
    ["Despesa", "Valor (R$)"], { tipo: "custo", colunas: true, porPagina }), resumo);
  exibir();
  return [ui.cabecalho("Custos da operação", "Defina as despesas fixas e a base mensal de horas."), grade];
};
