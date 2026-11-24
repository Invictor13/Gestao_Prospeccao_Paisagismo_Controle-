Paisagismo.criarDemonstracao = () => {
  const dados = Paisagismo.comercial.preparar(Paisagismo.modelo());
  const hora = Paisagismo.custos(dados.operacao).hora;
  const hoje = Paisagismo.comercial.hoje();
  const mesAtual = hoje.slice(0, 7);
  const exemplos = [
    ["Cliente fictício A", "Jardim da Casa Aurora", "Enviada", hoje, "Confirmar escopo e prazo", {
      endereco: "Rua das Palmeiras, 420 · Itaigara",
      areaTerreno: "240",
      tipoImovel: "Residencial unifamiliar",
      situacaoObra: "Já construído / Reforma",
      familia: "Casal com 2 crianças",
      pets: "Sim (1 cachorro de médio porte)",
      insolacao: "Sol pleno, Meia-sombra",
      materiais: "Madeira/Deck, Pedra natural, Iluminação, Baixa manutenção",
      briefingNotas: "Evitar espécies tóxicas para pets; área gourmet integrada ao jardim.",
    }, { entregue: hoje, reuniao: hoje, fechamento: "", inicio: "" }],
    ["Cliente fictício B", "Pátio do Estúdio Ipê", "Planejada", "", "", {
      endereco: "Av. Central, 1180 · Pituba",
      areaTerreno: "85",
      tipoImovel: "Comercial",
      situacaoObra: "Em obra",
      familia: "Equipe de 12 pessoas",
      pets: "Não",
      insolacao: "Meia-sombra, Luz difusa",
      materiais: "Concreto, Vasos autorais, Irrigação automatizada",
      briefingNotas: "Espaço de descompressão para clientes e reuniões ao ar livre.",
    }, { entregue: "", reuniao: "", fechamento: "", inicio: "" }],
    ["Cliente fictício C", "Varanda do Edifício Cedro", "Aprovada", "", "", {
      endereco: "Alameda das Flores, 90 · Horto",
      areaTerreno: "42",
      tipoImovel: "Residencial multifamiliar",
      situacaoObra: "Na planta / Planejamento",
      familia: "Casal",
      pets: "Sim (2 gatos)",
      insolacao: "Meia-sombra",
      materiais: "Horta/Frutíferas, Madeira/Deck, Baixa manutenção",
      briefingNotas: "Varanda com incidência de vento; priorizar vasos leves.",
    }, { entregue: hoje, reuniao: hoje, fechamento: hoje, inicio: hoje }],
  ];
  exemplos.forEach(([clienteNome, nome, situacao, proximo, acao, perfil, marcos], indice) => {
    const id = "demo-" + indice;
    dados.clientes.push({ id, nome: clienteNome, ...perfil });
    const projeto = structuredClone(dados.projeto);
    Object.assign(projeto, { nome, idProjeto: id, cliente: id, tipo: "Projeto paisagístico",
      local: perfil.endereco, area: perfil.areaTerreno,
      escopo: "Estudo de implantação, proposta de espécies e apresentação do projeto.",
      prazo: "15 dias úteis após a aprovação", pagamento: "50% no início e 50% na entrega" });
    projeto.etapa[3][4] = true;
    projeto.etapa[7][4] = true;
    dados.salvos.push({ projeto, hora, clienteNome, acompanhamento: { situacao, proximo, acao, marcos },
      data: new Date(Date.now() - indice * 86400000).toISOString() });
  });

  /* Histórico demonstrativo de 3 meses de custos da operação */
  const mesesBase = (desloc) => {
    const d = new Date(mesAtual + "-15T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + desloc);
    return d.toISOString().slice(0, 7);
  };
  const itensBase = dados.operacao.custos.map(([nome, valor, , cat]) => [nome, valor, cat || "Outros"]);
  const montarMes = (desloc, ajustes) => {
    const itens = itensBase.map(([n, v, c]) => [n, v + (ajustes[n] || 0), c]);
    const mensal = itens.reduce((s, [, v]) => s + v, 0);
    return { mes: mesesBase(desloc), mensal, horas: dados.operacao.horas, hora: mensal / dados.operacao.horas, itens };
  };
  dados.historicoCustos = [
    montarMes(-2, { Luz: -90, Telefone: -40, Marketing: -50 }),
    montarMes(-1, { Luz: -30, Condomínio: -20, Papelaria: 40 }),
    montarMes(0, {}),
  ];

  return Paisagismo.comercial.preparar(dados);
};
