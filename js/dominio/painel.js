Paisagismo.resumirPainel = (salvos, hoje, pendente, periodo = "tudo", operacao = null, historicoCustos = []) => {
  const vigentes = new Map();
  for (const item of salvos) {
    if (item === pendente) continue;
    const chave = Paisagismo.comercial.chaveProjeto(item.projeto);
    const anterior = vigentes.get(chave);
    if (!anterior || Date.parse(item.data) > Date.parse(anterior.data)) vigentes.set(chave, item);
  }

  const baseHoje = Date.parse((hoje || new Date().toISOString().slice(0, 10)) + "T23:59:59Z");
  const mesAtual = (hoje || new Date().toISOString().slice(0, 10)).slice(0, 7);
  const noPeriodo = (item) => {
    if (periodo === "tudo") return true;
    const ts = Date.parse(item.data);
    if (!Number.isFinite(ts)) return false;
    if (periodo === "mes") return new Date(ts).toISOString().slice(0, 7) === mesAtual;
    const dias = periodo === "30d" ? 30 : periodo === 90 || periodo === "90d" ? 90 : 0;
    if (!dias) return true;
    return ts >= baseHoje - dias * 86400000;
  };

  const todosRegistros = [...vigentes.values()];
  const registros = todosRegistros.filter(noPeriodo);
  const valorDe = ({ projeto, hora }) => Paisagismo.calcular(projeto, hora).preco;

  const abertas = registros.filter(({ acompanhamento }) => ["Planejada", "Enviada"].includes(acompanhamento.situacao));
  const aprovadasLista = registros.filter(({ acompanhamento }) => acompanhamento.situacao === "Aprovada");
  const recusadasLista = registros.filter(({ acompanhamento }) => acompanhamento.situacao === "Recusada");
  const retornos = abertas.filter(({ acompanhamento }) => acompanhamento.proximo)
    .sort((a, b) => a.acompanhamento.proximo.localeCompare(b.acompanhamento.proximo));
  const atrasados = retornos.filter(({ acompanhamento }) => acompanhamento.proximo < hoje).length;
  const paraHoje = retornos.filter(({ acompanhamento }) => acompanhamento.proximo === hoje).length;

  const potencial = abertas.reduce((total, item) => total + valorDe(item), 0);
  const valorAprovado = aprovadasLista.reduce((total, item) => total + valorDe(item), 0);
  const taxaConversao = registros.length > 0 ? (aprovadasLista.length / registros.length) * 100 : 0;

  const custosAtuais = operacao ? Paisagismo.custos(operacao) : { mensal: 0, hora: 0 };

  const mesesNomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mapaMeses = new Map();
  const refData = new Date(mesAtual + "-15T12:00:00Z");
  for (let i = 5; i >= 0; i--) {
    const d = new Date(refData);
    d.setUTCMonth(d.getUTCMonth() - i);
    const chaveMes = d.toISOString().slice(0, 7);
    const [ano, mes] = chaveMes.split("-");
    mapaMeses.set(chaveMes, {
      mes: chaveMes,
      rotulo: mesesNomes[Number(mes) - 1] + "/" + ano.slice(2),
      abertoValor: 0,
      aprovadoValor: 0,
      aprovadoAcumulado: 0,
      quantidade: 0,
    });
  }
  for (const item of registros) {
    const ts = Date.parse(item.data);
    if (!Number.isFinite(ts)) continue;
    const chaveMes = new Date(ts).toISOString().slice(0, 7);
    if (!mapaMeses.has(chaveMes)) continue;
    const entrada = mapaMeses.get(chaveMes);
    const preco = valorDe(item);
    entrada.quantidade += 1;
    if (item.acompanhamento.situacao === "Aprovada") entrada.aprovadoValor += preco;
    else if (["Planejada", "Enviada"].includes(item.acompanhamento.situacao)) entrada.abertoValor += preco;
  }

  let acumulado = 0;
  for (const entrada of mapaMeses.values()) {
    acumulado += entrada.aprovadoValor;
    entrada.aprovadoAcumulado = acumulado;
  }

  const funilDetalhado = Paisagismo.comercial.situacoes.map((situacao) => {
    const itens = registros.filter((item) => item.acompanhamento.situacao === situacao);
    return {
      situacao,
      quantidade: itens.length,
      valor: itens.reduce((soma, item) => soma + valorDe(item), 0),
    };
  });

  return {
    periodo,
    totalRegistros: todosRegistros.length,
    totalPeriodo: registros.length,
    abertas: abertas.length,
    aRetomar: atrasados + paraHoje,
    atrasados,
    paraHoje,
    aprovadas: aprovadasLista.length,
    recusadas: recusadasLista.length,
    potencial,
    valorAprovado,
    custoMensalAtual: custosAtuais.mensal,
    custoHoraAtual: custosAtuais.hora,
    taxaConversao,
    retornos,
    recentes: [...registros].sort((a, b) => Date.parse(b.data) - Date.parse(a.data)).slice(0, 5),
    funil: funilDetalhado.map(({ situacao, quantidade }) => [situacao, quantidade]),
    funilDetalhado,
    evolucao: [...mapaMeses.values()],
  };
};
