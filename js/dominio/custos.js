Paisagismo.custos = ({ horas, custos }) => {
  const meses = { mensal: 1, trimestral: 3, anual: 12 };
  const mensal = custos.reduce((total, [, valor, periodicidade]) => total + valor / meses[periodicidade ?? "mensal"], 0);
  return { mensal, anual: mensal * 12, hora: mensal / horas };
};
