Paisagismo.resumirPainel = (salvos, hoje, pendente) => {
  const vigentes = new Map();
  for (const item of salvos) {
    if (item === pendente) continue;
    const chave = Paisagismo.comercial.chaveProjeto(item.projeto);
    const anterior = vigentes.get(chave);
    if (!anterior || Date.parse(item.data) > Date.parse(anterior.data)) vigentes.set(chave, item);
  }

  const registros = [...vigentes.values()];
  const abertas = registros.filter(({ acompanhamento }) => ["Planejada", "Enviada"].includes(acompanhamento.situacao));
  const retornos = abertas.filter(({ acompanhamento }) => acompanhamento.proximo)
    .sort((a, b) => a.acompanhamento.proximo.localeCompare(b.acompanhamento.proximo));
  return {
    abertas: abertas.length,
    aRetomar: retornos.filter(({ acompanhamento }) => acompanhamento.proximo <= hoje).length,
    aprovadas: registros.filter(({ acompanhamento }) => acompanhamento.situacao === "Aprovada").length,
    potencial: abertas.reduce((total, { projeto, hora }) => total + Paisagismo.calcular(projeto, hora).preco, 0),
    retornos,
    recentes: registros.sort((a, b) => Date.parse(b.data) - Date.parse(a.data)).slice(0, 4),
    funil: Paisagismo.comercial.situacoes.map((situacao) =>
      [situacao, registros.filter((item) => item.acompanhamento.situacao === situacao).length]),
  };
};
