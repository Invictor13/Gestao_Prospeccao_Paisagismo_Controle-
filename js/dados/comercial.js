Paisagismo.comercial = (() => {
  const situacoes = ["Planejada", "Enviada", "Aprovada", "Recusada"];
  const prazoContato = ["ultimo", "proximo"];
  const camposCliente = ["nome", "contato", "telefone", "email", "notas"];
  const camposProjeto = ["cliente", "tipo", "local", "area", "escopo", "exclusoes",
    "prazo", "validade", "pagamento", "notas", "tituloProposta", "idProjeto"];
  const texto = (valor) => typeof valor === "string";
  const dataValida = (valor) => valor === "" || (/^\d{4}-\d{2}-\d{2}$/.test(valor)
    && Number.isFinite(Date.parse(valor)) && new Date(valor).toISOString().slice(0, 10) === valor);

  function completar(objeto, campos) {
    for (const campo of campos) {
      if (!(campo in objeto)) objeto[campo] = "";
      if (!texto(objeto[campo])) throw new Error("Dado comercial inválido.");
    }
  }

  function prepararProjeto(projeto) {
    completar(projeto, camposProjeto);
    projeto.desconto ??= 0;
    projeto.modoLucro ??= "acrescimo";
    if (!Number.isFinite(projeto.desconto) || projeto.desconto < 0 || projeto.desconto > 100
      || !["acrescimo", "margem"].includes(projeto.modoLucro)
      || (projeto.modoLucro === "margem" && projeto.lucro >= 100)
      || !dataValida(projeto.validade)) throw new Error("Condições comerciais inválidas.");
  }

  function preparar(dados) {
    dados.clientes ??= [];
    dados.modelos ??= [
      { nome: "Consultoria", etapas: [["Briefing", 1], ["Visita técnica", 2], ["Orientações e entrega", 2]] },
      { nome: "Projeto executivo", etapas: [["Briefing", 2], ["Levantamento", 6], ["Projeto executivo", 12], ["Revisão e entrega", 4]] },
      { nome: "Projeto com modelagem 3D", etapas: Paisagismo.modelo().projeto.etapa },
    ];
    if (!Array.isArray(dados.clientes) || !Array.isArray(dados.modelos)) throw new Error("Cadastros inválidos.");
    for (const cliente of dados.clientes) {
      if (!cliente || typeof cliente !== "object" || Array.isArray(cliente)) throw new Error("Cliente inválido.");
      completar(cliente, ["id", ...camposCliente]);
    }
    const ids = new Set(dados.clientes.map(({ id }) => id));
    if (ids.has("") || ids.size !== dados.clientes.length) throw new Error("Identificação de cliente inválida.");
    for (const modelo of dados.modelos) {
      if (!texto(modelo?.nome) || !Array.isArray(modelo.etapas) || !modelo.etapas.every(
        (etapa) => Array.isArray(etapa) && etapa.length === 2 && texto(etapa[0])
          && Number.isFinite(etapa[1]) && etapa[1] >= 0,
      )) throw new Error("Modelo de serviço inválido.");
    }
    prepararProjeto(dados.projeto);
    for (const item of dados.salvos) {
      prepararProjeto(item.projeto);
      item.clienteNome ??= dados.clientes.find(({ id }) => id === item.projeto.cliente)?.nome ?? "";
      item.acompanhamento ??= { situacao: situacoes[0] };
      const acompanhamento = item.acompanhamento;
      if (!texto(item.clienteNome) || !situacoes.includes(acompanhamento.situacao)
        || typeof acompanhamento !== "object") throw new Error("Acompanhamento inválido.");
      completar(acompanhamento, [...prazoContato, "acao", "motivo", "emitida"]);
      if (![...prazoContato, "emitida"].every((campo) => dataValida(acompanhamento[campo]))) {
        throw new Error("Data comercial inválida.");
      }
      item.realizadas ??= item.projeto.etapa.map(() => 0);
      if (!Array.isArray(item.realizadas) || item.realizadas.length !== item.projeto.etapa.length
        || item.realizadas.some((valor) => !Number.isFinite(valor) || valor < 0)
        || !Number.isFinite(item.realizadas.reduce((total, valor) => total + valor, 0))) {
        throw new Error("Horas realizadas inválidas.");
      }
    }
    return dados;
  }

  const hoje = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const formatarData = (data) => data ? data.split("-").reverse().join("/") : "";
  const id = () => crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");
  const chaveProjeto = (projeto) => projeto.idProjeto || JSON.stringify([projeto.cliente, projeto.nome.trim()]);
  return { preparar, prepararProjeto, camposCliente, situacoes, hoje, formatarData, id, chaveProjeto };
})();
