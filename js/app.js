(() => {
  const { armazenamento, modelo, telaCustos, telaEtapas, telasOrcamento } = Paisagismo;
  const conteudo = document.querySelector("#conteudo");
  const aviso = document.querySelector("#status");
  const navegacao = document.querySelectorAll("[data-tela]");
  const arquivo = document.querySelector("#arquivo");
  const persistencia = document.querySelector("#persistencia");
  const previaBackup = document.querySelector("#prever-backup");
  const tentarGravar = document.querySelector("#tentar-gravar");
  const menu = document.querySelector("#menu-mobile");
  const ferramentas = document.querySelector("#ferramentas-sistema");
  const menuGestao = document.querySelector("#menu-gestao");
  const backdropSidebar = document.querySelector("#sidebar-backdrop");
  const modalSobreDev = document.querySelector("#sobre-dev");
  const rodapeInterno = document.querySelector(".rodape-interno");
  const btnAlternarRodape = document.querySelector("#alternar-rodape");
  btnAlternarRodape?.addEventListener("click", () => {
    const expandido = rodapeInterno?.classList.toggle("expandido");
    btnAlternarRodape.setAttribute("aria-expanded", String(Boolean(expandido)));
  });
  document.querySelector("#abrir-sobre-dev")?.addEventListener("click", () => {
    modalSobreDev?.showModal();
  });
  modalSobreDev?.addEventListener("click", (evento) => {
    if (evento.target === modalSobreDev) modalSobreDev.close();
  });
  const demo = /(?:^\?|&)demo=1(?:&|$)/.test(window.location?.search ?? "");
  const shell = Paisagismo.appShell?.iniciar?.({ demo });
  let dados;
  let tela = "painel";
  const { clientes, modelos, retornos } = Paisagismo.telasComerciais;
  const telas = { ...telasOrcamento, custos: telaCustos, etapas: telaEtapas, clientes, modelos, retornos,
    comparar: Paisagismo.telaComparacao, proposta: Paisagismo.telaProposta, painel: Paisagismo.telaPainel };

  function menuAberto(aberto) {
    menu.setAttribute("aria-expanded", String(aberto));
    if (backdropSidebar) backdropSidebar.hidden = !aberto;
  }
  menu.addEventListener("click", () => menuAberto(menu.getAttribute("aria-expanded") !== "true"));
  function aoEscapar(evento) {
    if (evento.key !== "Escape") return;
    if (menu.getAttribute("aria-expanded") === "true") {
      menuAberto(false);
      menu.focus();
    } else if (ferramentas.open) {
      ferramentas.open = false;
      ferramentas.querySelector("summary").focus();
    } else if (menuGestao?.open) {
      menuGestao.open = false;
      menuGestao.querySelector("summary")?.focus();
    }
  }
  document.querySelector(".barra-app").addEventListener("keydown", aoEscapar);
  if (typeof document.addEventListener === "function") document.addEventListener("keydown", aoEscapar);

  function preferencia(seletor, chave, classe) {
    const controle = document.querySelector(seletor);
    try {
      controle.checked = !demo && localStorage.getItem(chave) === "true";
    } catch {
      controle.checked = false;
    }
    const aplicar = () => document.body.classList.toggle(classe, controle.checked);
    aplicar();
    controle.addEventListener("change", () => {
      aplicar();
      if (demo) return;
      try {
        localStorage.setItem(chave, String(controle.checked));
      } catch {
        // A preferência ainda vale durante a sessão.
      }
    });
  }
  preferencia("#animar-fundo", "paisagismo.animarFundo", "fundo-animado");
  preferencia("#modo-compacto", "paisagismo.modoCompacto", "listas-compactas");

  let timerStatus = null;
  function status(mensagem = "", persistente = false) {
    if (timerStatus) {
      window.clearTimeout?.(timerStatus);
      timerStatus = null;
    }
    aviso.textContent = mensagem;
    aviso.hidden = !mensagem;
    const ehAlerta = persistente || !tentarGravar.hidden
      || /pendente|não pôde|não puderam|inválido|fora do intervalo|excede|erro/i.test(mensagem);
    if (ehAlerta) aviso.dataset.tipo = "alerta";
    else delete aviso.dataset.tipo;
    if (mensagem && !ehAlerta && window.matchMedia) {
      timerStatus = window.setTimeout?.(() => {
        if (aviso.textContent === mensagem && tentarGravar.hidden) aviso.hidden = true;
      }, 3600);
    }
  }
  aviso.addEventListener("click", () => {
    if (tentarGravar.hidden) aviso.hidden = true;
  });

  try {
    dados = demo ? Paisagismo.criarDemonstracao() : armazenamento.carregar();
  } catch {
    dados = Paisagismo.comercial.preparar(modelo());
    status("Os dados locais não puderam ser lidos. Você pode recuperar seus dados por um backup.");
  }

  const sessao = Paisagismo.criarSessao(dados, demo ? () => {} : armazenamento.gravar);
  if (demo) {
    for (const seletor of ["#exportar", "#importar", "#link-demonstracao"]) document.querySelector(seletor).hidden = true;
    document.querySelector("#aviso-demonstracao").hidden = false;
    persistencia.textContent = "Sessão de demonstração";
  }

  function indicarGravacao(ok, mensagem = "") {
    tentarGravar.hidden = ok;
    if (ok) {
      persistencia.textContent = demo ? "Alterações somente nesta demonstração" : "Dados salvos neste navegador";
      status(demo && mensagem ? mensagem.replace(" neste navegador", " na demonstração") : mensagem);
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
    shell?.atualizarTelaAtiva?.(destino);
    window.scrollTo(0, 0);
  }

  const ctx = {
    get dados() { return dados; },
    demonstracao: demo,
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

  for (const botao of navegacao) botao.addEventListener("click", () => {
    const aberto = menu.getAttribute("aria-expanded") === "true";
    menuAberto(false);
    ferramentas.open = false;
    if (menuGestao && document.body?.dataset?.sidebar === "recolhido") menuGestao.open = false;
    navegar(botao.dataset.tela);
    if (aberto) {
      const titulo = conteudo.querySelector("h1");
      titulo.tabIndex = -1;
      titulo.focus();
    }
  });
  document.querySelector("#exportar").addEventListener("click", () => { if (!demo) armazenamento.exportar(dados); });
  document.querySelector("#exportar-antes").addEventListener("click", () => { if (!demo) armazenamento.exportar(dados); });
  document.querySelector("#importar").addEventListener("click", () => { if (!demo) arquivo.click(); });
  arquivo.addEventListener("change", async () => {
    if (demo) return;
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

  /* Intro cinemática com a logo (uma vez por sessão, pulável e acessível) */
  const intro = document.querySelector("#intro-flora");
  if (intro && window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches) {
    let jaViu = false;
    try {
      jaViu = typeof sessionStorage !== "undefined" && sessionStorage.getItem("flora.introVista") === "1";
    } catch {
      jaViu = false;
    }
    if (!jaViu) {
      intro.hidden = false;
      let encerrada = false;
      const encerrarIntro = () => {
        if (encerrada) return;
        encerrada = true;
        try {
          if (typeof sessionStorage !== "undefined") sessionStorage.setItem("flora.introVista", "1");
        } catch {
          // Segue normalmente se sessionStorage não estiver disponível.
        }
        intro.classList.add("intro-saindo");
        window.setTimeout?.(() => { intro.hidden = true; }, 430);
      };
      intro.addEventListener("click", encerrarIntro);
      window.addEventListener?.("keydown", (evento) => {
        if (["Escape", "Enter", " "].includes(evento.key)) encerrarIntro();
      }, { once: true });
      window.setTimeout?.(encerrarIntro, 1280);
    }
  }

  /* Iluminação sutil reativa ao cursor nas superfícies editoriais */
  if (window.matchMedia?.("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) {
    conteudo.addEventListener("pointermove", (evento) => {
      const alvo = evento.target?.closest?.(".destaque-painel, .preco, .catalogo-modelos .cartao, .cartao-proposta-item");
      if (!alvo) return;
      const caixa = alvo.getBoundingClientRect();
      if (!caixa.width || !caixa.height) return;
      const x = Math.round(((evento.clientX - caixa.left) / caixa.width) * 100);
      const y = Math.round(((evento.clientY - caixa.top) / caixa.height) * 100);
      alvo.style.setProperty("--mx", x + "%");
      alvo.style.setProperty("--my", y + "%");
    });
  }
})();
