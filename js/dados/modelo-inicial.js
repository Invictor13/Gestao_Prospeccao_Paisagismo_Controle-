window.Paisagismo = {};

Paisagismo.modelo = () => ({
  versao: 1,
  operacao: {
    horas: 180,
    custos: [
      ["Água", 35, "mensal", "Escritório"],
      ["Luz", 500, "mensal", "Escritório"],
      ["Telefone", 300, "mensal", "Escritório"],
      ["Internet", 50, "mensal", "Escritório"],
      ["IPTU", 200, "mensal", "Escritório"],
      ["Condomínio", 100, "mensal", "Escritório"],
      ["Aluguel", 100, "mensal", "Escritório"],
      ["Faxina", 100, "mensal", "Pessoas"],
      ["Gás", 100, "mensal", "Escritório"],
      ["Alvará", 100, "mensal", "Escritório"],
      ["Material de limpeza", 100, "mensal", "Escritório"],
      ["Papelaria e material de escritório", 100, "mensal", "Trabalho"],
      ["Software", 100, "mensal", "Trabalho"],
      ["Pró-labore", 3000, "mensal", "Pessoas"],
      ["Estagiário", 100, "mensal", "Pessoas"],
      ["Associações", 100, "mensal", "Crescimento"],
      ["Contabilidade", 100, "mensal", "Pessoas"],
      ["Marketing", 100, "mensal", "Crescimento"],
      ["Conselho profissional", 100, "mensal", "Crescimento"],
      ["Cursos", 100, "mensal", "Crescimento"],
      ["Terceirizados/Funcionários", 10, "mensal", "Pessoas"],
    ],
  },
  projeto: {
    nome: "",
    impostos: 32,
    lucro: 30,
    etapa: [
      ["Fechamento orçamentário", 4], ["Pesquisa de referências", 4],
      ["Pesquisa de campo e levantamento de dados", 10], ["Elaboração do pré-projeto", 1],
      ["Projeto pré-executivo", 1], ["Reuniões e alterações do pré-executivo", 12],
      ["Modelagem 3D", 1], ["Projeto executivo", 1],
      ["Reuniões e alterações do executivo", 5], ["Correções na modelagem 3D", 4],
      ["Renderização", 7], ["Polimento e detalhamentos finais", 2], ["Entrega", 3],
    ],
    despesas: [
      ["Documentação", 100], ["Traslado", 0], ["Hospedagem", 0], ["Alimentação", 0],
      ["Seguro", 0], ["Plotagem", 0], ["Comissão", 0], ["Outros custos", 0],
    ],
  },
  salvos: [],
});
