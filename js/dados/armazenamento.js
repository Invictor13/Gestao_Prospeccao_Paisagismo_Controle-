Paisagismo.armazenamento = (() => {
  const chave = "paisagismo.precificacao.v1";
  const numero = (valor) => Number.isFinite(valor) && valor >= 0;
  const texto = (valor) => typeof valor === "string";
  const itens = (lista, extras) => Array.isArray(lista) && lista.every(
    (item) => Array.isArray(item) && item.length >= 2 && texto(item[0]) && numero(item[1])
      && extras.every((validar, indice) => item[indice + 2] == null || validar(item[indice + 2]))
      && item.length <= extras.length + 2,
  );
  const projetoValido = (projeto, hora) => projeto && texto(projeto.nome)
    && numero(projeto.impostos) && numero(projeto.lucro)
    && itens(projeto.etapa, [texto, texto, (valor) => typeof valor === "boolean"])
    && itens(projeto.despesas, [numero, texto])
    && Object.values(Paisagismo.calcular(projeto, hora)).every(numero);
  const operacaoValida = (operacao) => numero(operacao?.horas) && operacao.horas >= 0.01
    && itens(operacao.custos, [(valor) => ["mensal", "trimestral", "anual"].includes(valor), texto])
    && Object.values(Paisagismo.custos(operacao)).every(numero);

  function ler(conteudo) {
    const dados = JSON.parse(conteudo);
    const operacao = dados?.operacao;
    if (dados?.versao !== 1 || !operacaoValida(operacao) || !Array.isArray(dados.salvos)) {
      throw new Error("Formato de backup inválido.");
    }
    const custos = Paisagismo.custos(operacao);
    if (!Object.values(custos).every(numero) || !projetoValido(dados.projeto, custos.hora)
      || !dados.salvos.every((item) => item && texto(item.data)
        && Number.isFinite(Date.parse(item.data)) && numero(item.hora)
        && projetoValido(item.projeto, item.hora)
        && (item.operacao === undefined || operacaoValida(item.operacao)))) {
      throw new Error("O backup contém dados inválidos.");
    }
    return Paisagismo.comercial.preparar(dados);
  }

  function carregar() {
    const conteudo = localStorage.getItem(chave);
    return conteudo === null ? Paisagismo.comercial.preparar(Paisagismo.modelo()) : ler(conteudo);
  }

  function gravar(dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  function exportar(dados) {
    const arquivo = new Blob([JSON.stringify({ ...dados, exportadoEm: new Date().toISOString() }, null, 2)],
      { type: "application/json" });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = "backup-flora-em-folha.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { ler, carregar, gravar, exportar };
})();
