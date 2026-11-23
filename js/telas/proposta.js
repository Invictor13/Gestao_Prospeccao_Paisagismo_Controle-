Paisagismo.telaProposta = (ctx, item) => {
  const ui = Paisagismo.ui;
  const { projeto, hora, clienteNome, acompanhamento } = item;
  const { hoje, formatarData } = Paisagismo.comercial;
  const proposta = ui.elemento("article", undefined, "proposta");
  const logo = ui.elemento("img", undefined, "proposta-logo logo-flora");
  logo.src = "assets/flora-em-folha.png";
  logo.alt = "Flora em Folha";
  logo.width = 104;
  logo.height = 104;
  const titulo = ui.elemento("header", undefined, "proposta-cabecalho");
  titulo.append(logo, ui.elemento("h1", projeto.tituloProposta || "Proposta de paisagismo"),
    ui.elemento("p", projeto.nome));
  proposta.append(titulo);

  const dados = ui.elemento("dl", undefined, "proposta-dados");
  const dataEmissao = ui.elemento("dd", formatarData(acompanhamento.emitida || hoje()));
  dados.append(ui.elemento("dt", "Emissão"), dataEmissao);
  for (const [rotulo, valor] of [["Cliente", clienteNome], ["Serviço", projeto.tipo], ["Local", projeto.local],
    ["Área estimada", projeto.area && projeto.area + " m²"], ["Prazo", projeto.prazo],
    ["Validade", formatarData(projeto.validade)]]) {
    if (valor) dados.append(ui.elemento("dt", rotulo), ui.elemento("dd", valor));
  }
  proposta.append(dados);
  for (const [rotulo, texto] of [["Escopo", projeto.escopo], ["Exclusões", projeto.exclusoes]]) {
    if (texto.trim()) proposta.append(ui.cartao(rotulo, ui.elemento("p", texto)));
  }
  const entregas = projeto.etapa.filter(([nome, , , , publica]) => nome.trim() && publica === true);
  if (entregas.length) {
    const lista = ui.elemento("ul");
    lista.append(...entregas.map(([nome, , descricao]) => ui.elemento("li", descricao ? nome + " — " + descricao : nome)));
    proposta.append(ui.cartao("Entregáveis", lista));
  }
  const investimento = ui.elemento("strong", ui.brl(Paisagismo.calcular(projeto, hora).preco));
  const valor = ui.cartao("Investimento", investimento);
  valor.classList.add("proposta-valor");
  if (projeto.pagamento.trim()) valor.append(ui.elemento("p", projeto.pagamento));
  proposta.append(valor);
  const registrar = ui.botao("Registrar emissão", () => {
    if (!acompanhamento.emitida) {
      acompanhamento.emitida = hoje();
      dataEmissao.textContent = formatarData(acompanhamento.emitida);
      ctx.gravar("Emissão registrada nesta versão.");
      registrar.hidden = true;
    }
  });
  registrar.hidden = Boolean(acompanhamento.emitida);
  const imprimir = ui.botao("Imprimir ou salvar PDF", () => window.print());
  const acoes = ui.elemento("div", undefined, "acoes");
  acoes.append(ui.botao("Voltar à versão", () => ctx.navegar("salvo", item), true), registrar, imprimir);
  return [ui.cabecalho("Proposta para o cliente", "Confira a versão antes de imprimir ou salvar em PDF.", acoes), proposta];
};
