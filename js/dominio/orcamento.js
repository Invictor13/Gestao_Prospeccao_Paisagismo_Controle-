Paisagismo.calcular = (projeto, hora) => {
  const horas = Paisagismo.horasProjeto(projeto.etapa);
  const minimo = horas * hora;
  const despesas = projeto.despesas.reduce((total, [, valor, quantidade]) => total + valor * (quantidade ?? 1), 0);
  const base = minimo + despesas;
  const impostos = base * (projeto.impostos / 100);
  const custo = base + impostos;
  const taxa = projeto.lucro / 100;
  const lucro = projeto.modoLucro === "margem" ? custo * taxa / (1 - taxa) : custo * taxa;
  const bruto = custo + lucro;
  const desconto = bruto * ((projeto.desconto ?? 0) / 100);
  return { horas, hora, minimo, despesas, base, impostos, custo, lucro, desconto, preco: bruto - desconto };
};
