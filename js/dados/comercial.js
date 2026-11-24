Paisagismo.comercial = (() => {
  const situacoes = ["Planejada", "Enviada", "Aprovada", "Recusada"];
  const prazoContato = ["ultimo", "proximo"];
  const etapasFluxo = [
    ["entregue", "Orçamento entregue"],
    ["reuniao", "Reunião"],
    ["fechamento", "Fechamento"],
    ["inicio", "Início do trabalho"],
  ];
  const categoriasCusto = ["Escritório", "Trabalho", "Pessoas", "Crescimento"];
  const camposCliente = [
    "nome", "contato", "telefone", "email", "notas",
    "endereco", "areaTerreno", "tipoImovel",
    "situacaoObra", "familia", "pets", "insolacao", "materiais", "briefingNotas",
  ];
  const camposProjeto = ["cliente", "tipo", "local", "area", "escopo", "exclusoes",
    "prazo", "validade", "pagamento", "notas", "tituloProposta", "idProjeto"];
  const texto = (valor) => typeof valor === "string";
  const numero = (valor) => Number.isFinite(valor) && valor >= 0;
  const dataValida = (valor) => valor === "" || (/^\d{4}-\d{2}-\d{2}$/.test(valor)
    && Number.isFinite(Date.parse(valor)) && new Date(valor).toISOString().slice(0, 10) === valor);
  const mesValido = (valor) => typeof valor === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);

  function completar(objeto, campos) {
    for (const campo of campos) {
      if (!(campo in objeto)) objeto[campo] = "";
      if (!texto(objeto[campo])) throw new Error("Dado comercial inválido.");
    }
  }

  function prepararDeslocamento(deslocamento) {
    const padrao = {
      km: 0,
      idaVolta: true,
      visitas: 1,
      consumo: 10,
      combustivel: 6.5,
      pedagio: 0,
    };
    if (!deslocamento || typeof deslocamento !== "object" || Array.isArray(deslocamento)) return padrao;
    const resultado = { ...padrao, ...deslocamento };
    if (!numero(resultado.km) || !numero(resultado.visitas) || !numero(resultado.pedagio)
      || !Number.isFinite(resultado.consumo) || resultado.consumo <= 0
      || !numero(resultado.combustivel) || typeof resultado.idaVolta !== "boolean") {
      throw new Error("Parâmetros de deslocamento inválidos.");
    }
    return resultado;
  }

  function prepararProjeto(projeto) {
    completar(projeto, camposProjeto);
    projeto.desconto ??= 0;
    projeto.modoLucro ??= "acrescimo";
    projeto.traslado = prepararDeslocamento(projeto.traslado);
    if (!Number.isFinite(projeto.desconto) || projeto.desconto < 0 || projeto.desconto > 100
      || !["acrescimo", "margem"].includes(projeto.modoLucro)
      || (projeto.modoLucro === "margem" && projeto.lucro >= 100)
      || !dataValida(projeto.validade)) throw new Error("Condições comerciais inválidas.");
  }

  function prepararHistoricoCustos(lista) {
    if (!Array.isArray(lista)) throw new Error("Histórico de custos inválido.");
    for (const item of lista) {
      if (!item || typeof item !== "object" || Array.isArray(item)
        || !mesValido(item.mes) || !numero(item.mensal) || !numero(item.hora)
        || !Number.isFinite(item.horas) || item.horas <= 0
        || !Array.isArray(item.itens)) {
        throw new Error("Registro mensal de custos inválido.");
      }
    }
    return lista;
  }

  function preparar(dados) {
    dados.clientes ??= [];
    dados.modelos ??= [
      { nome: "Consultoria", etapas: [["Briefing", 1], ["Visita técnica", 2], ["Orientações e entrega", 2]] },
      { nome: "Projeto executivo", etapas: [["Briefing", 2], ["Levantamento", 6], ["Projeto executivo", 12], ["Revisão e entrega", 4]] },
      { nome: "Projeto com modelagem 3D", etapas: Paisagismo.modelo().projeto.etapa },
    ];
    dados.deslocamentoPadrao = prepararDeslocamento(dados.deslocamentoPadrao);
    dados.historicoCustos = prepararHistoricoCustos(dados.historicoCustos ?? []);
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
      acompanhamento.marcos ??= {};
      if (!acompanhamento.marcos || typeof acompanhamento.marcos !== "object" || Array.isArray(acompanhamento.marcos)) {
        throw new Error("Marcos comerciais inválidos.");
      }
      for (const [chave] of etapasFluxo) {
        if (!(chave in acompanhamento.marcos)) acompanhamento.marcos[chave] = "";
        if (!dataValida(acompanhamento.marcos[chave])) throw new Error("Data de marco comercial inválida.");
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

  function calcularTraslado(params) {
    const km = Number(params?.km) || 0;
    const visitas = Number(params?.visitas) || 0;
    const fator = params?.idaVolta === false ? 1 : 2;
    const consumo = Math.max(0.1, Number(params?.consumo) || 10);
    const combustivel = Number(params?.combustivel) || 0;
    const pedagio = Number(params?.pedagio) || 0;
    const distanciaTotal = km * fator * visitas;
    const litros = distanciaTotal / consumo;
    const valor = Math.round(((litros * combustivel) + pedagio) * 100) / 100;
    return { distanciaTotal, litros, valor };
  }

  function categoriaCusto(item) {
    const explicita = typeof item?.[3] === "string" ? item[3].trim() : "";
    if (explicita) return explicita;
    const nome = String(item?.[0] || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    if (/agua|luz|energia|telefone|internet|iptu|condominio|aluguel|gas|alvara|limpeza/.test(nome)) return "Escritório";
    if (/papelaria|software|computador|equipamento|licenca|ferramenta/.test(nome)) return "Trabalho";
    if (/pro-labore|prolabore|estagiario|faxina|contabilidade|terceirizado|funcionario|salario/.test(nome)) return "Pessoas";
    if (/marketing|curso|associac|conselho|evento|anuncio/.test(nome)) return "Crescimento";
    return "Outros";
  }

  const hoje = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const formatarData = (data) => data ? data.split("-").reverse().join("/") : "";
  const formatarMes = (mes) => {
    if (!mes) return "";
    const [ano, num] = mes.split("-");
    const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return (nomes[Number(num) - 1] || num) + "/" + ano;
  };
  const id = () => crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");
  const chaveProjeto = (projeto) => projeto.idProjeto || JSON.stringify([projeto.cliente, projeto.nome.trim()]);
  return {
    preparar, prepararProjeto, calcularTraslado, categoriaCusto, camposCliente, situacoes, etapasFluxo, categoriasCusto,
    hoje, formatarData, formatarMes, id, chaveProjeto,
  };
})();
