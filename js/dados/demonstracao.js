Paisagismo.criarDemonstracao = () => {
  const dados = Paisagismo.comercial.preparar(Paisagismo.modelo());
  const hora = Paisagismo.custos(dados.operacao).hora;
  const hoje = Paisagismo.comercial.hoje();
  const exemplos = [
    ["Cliente fictício A", "Jardim da Casa Aurora", "Enviada", hoje, "Confirmar escopo e prazo"],
    ["Cliente fictício B", "Pátio do Estúdio Ipê", "Planejada", "", ""],
    ["Cliente fictício C", "Varanda do Edifício Cedro", "Aprovada", "", ""],
  ];
  exemplos.forEach(([clienteNome, nome, situacao, proximo, acao], indice) => {
    const id = "demo-" + indice;
    dados.clientes.push({ id, nome: clienteNome });
    const projeto = structuredClone(dados.projeto);
    Object.assign(projeto, { nome, idProjeto: id, cliente: id, tipo: "Projeto paisagístico",
      escopo: "Estudo de implantação, proposta de espécies e apresentação do projeto.",
      prazo: "15 dias úteis após a aprovação", pagamento: "50% no início e 50% na entrega" });
    projeto.etapa[3][4] = true;
    projeto.etapa[7][4] = true;
    dados.salvos.push({ projeto, hora, clienteNome, acompanhamento: { situacao, proximo, acao },
      data: new Date(Date.now() - indice * 86400000).toISOString() });
  });
  return Paisagismo.comercial.preparar(dados);
};
