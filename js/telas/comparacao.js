Paisagismo.telaComparacao = (ctx, referencia) => {
  const ui = Paisagismo.ui;
  const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const rascunho = { projeto: ctx.dados.projeto, hora: Paisagismo.custos(ctx.dados.operacao).hora };
  const cenarios = [rascunho, ...ctx.dados.salvos];
  const voltar = ui.botao("Voltar ao orçamento", () => ctx.navegar("orcamento"), true);
  const topo = ui.cabecalho("Comparar cenários", "A diferença mostra quanto o cenário varia em relação à base.", voltar);

  function seletor(rotulo, inicial) {
    const label = ui.elemento("label", undefined, "campo");
    const select = ui.elemento("select");
    cenarios.forEach(({ projeto, data: salvo }, indice) => {
      const nome = projeto.nome.trim() || "Sem nome";
      const descricao = salvo ? nome + " · " + data.format(new Date(salvo)) : "Rascunho atual · " + nome;
      const opcao = ui.elemento("option", descricao);
      opcao.value = indice;
      select.append(opcao);
    });
    select.value = inicial;
    label.append(ui.elemento("span", rotulo), select);
    return { label, select };
  }

  const base = seletor("Base de comparação", Math.max(1, cenarios.indexOf(referencia)));
  const cenario = seletor("Cenário", 0);
  const seletores = ui.elemento("div", undefined, "seletores-comparacao");
  seletores.append(base.label, cenario.label);
  const tabela = ui.elemento("table", undefined, "tabela-comparacao");
  const titulos = ui.elemento("tr");
  for (const rotulo of ["Indicador", "Base", "Cenário", "Diferença"]) {
    const coluna = ui.elemento("th", rotulo);
    coluna.scope = "col";
    titulos.append(coluna);
  }
  const cabecalho = ui.elemento("thead");
  cabecalho.append(titulos);
  const corpo = ui.elemento("tbody");
  tabela.append(cabecalho, corpo);
  const mudancas = ui.elemento("div");
  const horas = (valor) => ui.numero(valor) + " h";
  const indicadores = [
    ["horas", "Horas de trabalho", horas],
    ["hora", "Custo por hora", ui.brl],
    ["despesas", "Despesas diretas", ui.brl],
    ["custo", "Custo total", ui.brl],
    ["preco", "Preço final", ui.brl],
  ];

  function exibir() {
    const calcular = (selecao) => {
      const { projeto, hora } = cenarios[selecao.value];
      return Paisagismo.calcular(projeto, hora);
    };
    const a = calcular(base.select);
    const b = calcular(cenario.select);
    corpo.replaceChildren(...indicadores.map(([chave, rotulo, formatar]) => {
      const linha = ui.elemento("tr");
      const titulo = ui.elemento("th", rotulo);
      titulo.scope = "row";
      const delta = b[chave] - a[chave];
      const limite = chave === "horas" ? 0.0000005 : 0.005;
      const diferenca = Math.abs(delta) < limite ? formatar(0) : (delta > 0 ? "+" : "") + formatar(delta);
      linha.append(titulo, ...[formatar(a[chave]), formatar(b[chave]), diferenca].map((valor) => ui.elemento("td", valor)));
      return linha;
    }));
    const projetoA = cenarios[base.select.value].projeto;
    const projetoB = cenarios[cenario.select.value].projeto;
    const alteracoes = [];
    function compararItens(listaA, listaB, formatar, obterValor, categoria) {
      function agrupar(lista) {
        const valores = new Map();
        for (const item of lista) {
          const nome = item[0].trim() || "Item sem nome";
          valores.set(nome, (valores.get(nome) ?? 0) + obterValor(item));
        }
        return valores;
      }
      const antes = agrupar(listaA);
      const depois = agrupar(listaB);
      for (const nome of new Set([...antes.keys(), ...depois.keys()])) {
        if (antes.get(nome) === depois.get(nome)) continue;
        const valor = (mapa) => mapa.has(nome) ? formatar(mapa.get(nome)) : "Ausente";
        alteracoes.push(ui.linha(categoria + " · " + nome, valor(antes) + " → " + valor(depois), "strong").bloco);
      }
    }
    compararItens(projetoA.etapa, projetoB.etapa, horas, ([, tempo]) => tempo, "Etapa");
    compararItens(projetoA.despesas, projetoB.despesas, ui.brl,
      ([, valor, qtd]) => valor * (qtd ?? 1), "Despesa");
    for (const [chave, rotulo] of [["impostos", "Impostos"], ["lucro", "Percentual de lucro"], ["desconto", "Desconto"]]) {
      const antes = projetoA[chave] ?? 0;
      const depois = projetoB[chave] ?? 0;
      if (antes !== depois) alteracoes.push(ui.linha(rotulo, ui.numero(antes) + "% → " + ui.numero(depois) + "%", "strong").bloco);
    }
    if (projetoA.modoLucro !== projetoB.modoLucro) {
      const modo = (projeto) => projeto.modoLucro === "margem" ? "Margem" : "Acréscimo";
      alteracoes.push(ui.linha("Base do lucro", modo(projetoA) + " → " + modo(projetoB), "strong").bloco);
    }
    mudancas.replaceChildren(...(alteracoes.length ? alteracoes :
      [ui.elemento("p", "As etapas, despesas e os percentuais são iguais nos cenários selecionados.")]));
  }

  base.select.addEventListener("change", exibir);
  cenario.select.addEventListener("change", exibir);
  exibir();
  const paineis = ui.elemento("div", undefined, "pilha");
  paineis.append(ui.cartao("Cenários selecionados", seletores, tabela), ui.cartao("Alterações na composição", mudancas));
  return [topo, paineis];
};
