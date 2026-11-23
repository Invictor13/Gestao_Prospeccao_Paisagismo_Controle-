window.Paisagismo = {};

Paisagismo.modelo = () => ({
  versao: 1,
  operacao: {
    horas: 180,
    custos: [
      ["Água", 35], ["Luz", 500], ["Telefone", 300], ["Internet", 50],
      ["IPTU", 200], ["Condomínio", 100], ["Aluguel", 100], ["Faxina", 100],
      ["Gás", 100], ["Alvará", 100], ["Material de limpeza", 100],
      ["Papelaria e material de escritório", 100], ["Software", 100],
      ["Pró-labore", 3000], ["Estagiário", 100], ["Associações", 100],
      ["Contabilidade", 100], ["Marketing", 100], ["Conselho profissional", 100],
      ["Cursos", 100], ["Terceirizados/Funcionários", 10],
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
