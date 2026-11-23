(() => {
  const { armazenamento, modelo, telaCustos, telaEtapas, telasOrcamento } = Paisagismo;
  const conteudo = document.querySelector("#conteudo");
  const aviso = document.querySelector("#status");
  const navegacao = document.querySelectorAll("[data-tela]");
  const arquivo = document.querySelector("#arquivo");
  const persistencia = document.querySelector("#persistencia");
  const previaBackup = document.querySelector("#prever-backup");
  const tentarGravar = document.querySelector("#tentar-gravar");
  let dados;
  let tela = "orcamento";
  const { clientes, modelos, retornos } = Paisagismo.telasComerciais;
  const telas = { ...telasOrcamento, custos: telaCustos, etapas: telaEtapas, clientes, modelos, retornos,
    comparar: Paisagismo.telaComparacao, proposta: Paisagismo.telaProposta };

  function preferencia(seletor, chave, classe) {
    const controle = document.querySelector(seletor);
    try {
      controle.checked = localStorage.getItem(chave) === "true";
    } catch {
      controle.checked = false;
    }
    const aplicar = () => document.body.classList.toggle(classe, controle.checked);
    aplicar();
    controle.addEventListener("change", () => {
      aplicar();
      try {
        localStorage.setItem(chave, String(controle.checked));
      } catch {
        // A preferência ainda vale durante a sessão.
      }
    });
  }
  preferencia("#animar-fundo", "paisagismo.animarFundo", "fundo-animado");
  preferencia("#modo-compacto", "paisagismo.modoCompacto", "listas-compactas");

  function status(mensagem = "") {
    aviso.textContent = mensagem;
    aviso.hidden = !mensagem;
  }

  try {
    dados = armazenamento.carregar();
  } catch {
    dados = Paisagismo.comercial.preparar(modelo());
    status("Os dados locais não puderam ser lidos. Você pode recuperar seus dados por um backup.");
  }

  const sessao = Paisagismo.criarSessao(dados, armazenamento.gravar);

  function indicarGravacao(ok, mensagem = "") {
    tentarGravar.hidden = ok;
    if (ok) {
      persistencia.textContent = "Dados salvos neste navegador";
      status(mensagem);
    } else {
      persistencia.textContent = "Alterações somente nesta sessão";
      status(sessao.versaoPendente
        ? "Orçamento pendente de gravação. Tente novamente ou exporte um backup antes de fechar."
        : "As alterações estão nesta sessão. Tente novamente ou exporte um backup antes de fechar.");
    }
    return ok;
  }

  function gravar(mensagem = "") {
    return indicarGravacao(sessao.gravar(), mensagem);
  }

  tentarGravar.addEventListener("click", () => {
    const pendente = sessao.versaoPendente;
    if (indicarGravacao(sessao.repetir(), pendente ? "Orçamento salvo neste navegador." : "Alterações salvas neste navegador.")
      && ["historico", "orcamento", "salvo"].includes(tela)) {
      if (tela === "salvo") navegar(tela, itemAberto);
      else navegar(tela);
    }
  });

  function aoAlterar(exibir) {
    return () => {
      try {
        armazenamento.ler(JSON.stringify(dados));
      } catch {
        status("O valor informado está fora do intervalo de cálculo.");
        return false;
      }
      gravar();
      exibir();
      return true;
    };
  }

  let itemAberto;
  function navegar(destino, item) {
    tela = destino;
    itemAberto = item;
    for (const botao of navegacao) {
      if (botao.dataset.tela === destino || (["salvo", "comparar", "proposta"].includes(destino) && botao.dataset.tela === "historico")) {
        botao.setAttribute("aria-current", "page");
      } else botao.removeAttribute("aria-current");
    }
    const pagina = document.createElement("div");
    pagina.className = "entrada-tela";
    pagina.append(...telas[destino](ctx, item));
    conteudo.replaceChildren(pagina);
    window.scrollTo(0, 0);
  }

  const ctx = {
    get dados() { return dados; },
    get versaoPendente() { return sessao.versaoPendente; },
    navegar, status, gravar, aoAlterar,
    salvarVersao(criarVersao) {
      return indicarGravacao(sessao.salvarVersao(criarVersao), "Orçamento salvo neste navegador.");
    },
    abrir: (indice) => navegar("salvo", dados.salvos[indice]),
    duplicar(item, revisao = false) {
      const copia = structuredClone(item.projeto);
      if (!revisao) {
        copia.nome += " (cópia)";
        copia.idProjeto = Paisagismo.comercial.id();
      }
      if (revisao && !copia.idProjeto) copia.idProjeto = Paisagismo.comercial.chaveProjeto(item.projeto);
      const hora = Paisagismo.custos(dados.operacao).hora;
      if (!Object.values(Paisagismo.calcular(copia, hora)).every(Number.isFinite)) {
        status("A cópia excede o intervalo de cálculo com o custo por hora atual.");
        return;
      }
      if (!window.confirm("Substituir o rascunho atual pela cópia? O cálculo usará o custo por hora atual.")) return;
      dados.projeto = copia;
      gravar("Cópia aberta como rascunho com o custo por hora atual.");
      navegar("orcamento");
    },
    aplicarModelo(modeloServico) {
      if (!window.confirm("Aplicar " + (modeloServico.nome || "este modelo")
        + "? As etapas do rascunho serão substituídas. Cliente, despesas e percentuais serão mantidos.")) return;
      const projeto = { ...dados.projeto, etapa: structuredClone(modeloServico.etapas), tipo: modeloServico.nome };
      const hora = Paisagismo.custos(dados.operacao).hora;
      if (!Object.values(Paisagismo.calcular(projeto, hora)).every(Number.isFinite)) {
        status("As etapas do modelo excedem o intervalo de cálculo.");
        return;
      }
      dados.projeto = projeto;
      gravar("Modelo aplicado ao rascunho.");
      navegar("etapas");
    },
    novo() {
      if (!window.confirm("Substituir o rascunho atual por um orçamento em branco?")) return;
      dados.projeto = { ...modelo().projeto, etapa: [], despesas: [] };
      Paisagismo.comercial.prepararProjeto(dados.projeto);
      dados.projeto.idProjeto = Paisagismo.comercial.id();
      gravar("Novo orçamento iniciado.");
      navegar("orcamento");
    },
  };

  for (const botao of navegacao) botao.addEventListener("click", () => navegar(botao.dataset.tela));
  document.querySelector("#exportar").addEventListener("click", () => armazenamento.exportar(dados));
  document.querySelector("#exportar-antes").addEventListener("click", () => armazenamento.exportar(dados));
  document.querySelector("#importar").addEventListener("click", () => arquivo.click());
  arquivo.addEventListener("change", async () => {
    const selecionado = arquivo.files[0];
    arquivo.value = "";
    if (!selecionado) return;
    let backup;
    try {
      backup = armazenamento.ler(await selecionado.text());
    } catch {
      status("Este arquivo não é um backup válido do sistema.");
      return;
    }
    const data = Number.isFinite(Date.parse(backup.exportadoEm))
      ? "Exportado em " + new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" })
        .format(new Date(backup.exportadoEm)) + ". "
      : "";
    const projetos = new Set(backup.salvos.map(({ projeto }) => Paisagismo.comercial.chaveProjeto(projeto)));
    document.querySelector("#resumo-backup").textContent = data
      + backup.clientes.length + " cliente(s), " + projetos.size + " projeto(s), "
      + backup.salvos.length + " versão(ões) e um rascunho.";
    previaBackup.returnValue = "";
    previaBackup.showModal();
    previaBackup.addEventListener("close", () => {
      if (previaBackup.returnValue !== "restaurar") return;
      if (!sessao.restaurar(backup)) {
        status("O backup não pôde ser gravado. Os dados atuais foram mantidos. Libere espaço e tente importar novamente.");
        return;
      }
      dados = sessao.dados;
      indicarGravacao(true, "Backup restaurado.");
      navegar(["salvo", "comparar", "proposta"].includes(tela) ? "historico" : tela);
    }, { once: true });
  });
  navegar(tela);
})();
