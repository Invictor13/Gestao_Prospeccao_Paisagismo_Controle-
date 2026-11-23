Paisagismo.criarSessao = (inicial, persistir) => {
  let dados = inicial;
  let versaoPendente = null;

  function gravarEstado(estado) {
    try {
      persistir(estado);
      return true;
    } catch {
      return false;
    }
  }

  function repetir() {
    if (!gravarEstado(dados)) return false;
    versaoPendente = null;
    return true;
  }

  return {
    get dados() { return dados; },
    get versaoPendente() { return versaoPendente; },
    gravar() {
      return versaoPendente === null && gravarEstado(dados);
    },
    salvarVersao(criarVersao) {
      if (versaoPendente === null) {
        versaoPendente = criarVersao();
        dados.salvos.unshift(versaoPendente);
      }
      return repetir();
    },
    repetir,
    restaurar(backupValidado) {
      if (!gravarEstado(backupValidado)) return false;
      dados = backupValidado;
      versaoPendente = null;
      return true;
    },
  };
};
