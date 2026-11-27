Paisagismo.appShell = (() => {
  const MODOS = ["expandido", "recolhido"];
  const CHAVE_MODO = "paisagismo.modoSidebar";

  const ROTAS = {
    principal: [
      { id: "painel", rotulo: "Visão geral", icone: "painel" },
      { id: "orcamento", rotulo: "Orçamento", icone: "orcamento" },
      { id: "etapas", rotulo: "Etapas do projeto", icone: "etapas" },
      { id: "custos", rotulo: "Custos da operação", icone: "custos" },
    ],
    gestao: [
      { id: "historico", rotulo: "Orçamentos salvos", icone: "historico" },
      { id: "clientes", rotulo: "Clientes", icone: "clientes" },
      { id: "retornos", rotulo: "Próximos contatos", icone: "retornos" },
      { id: "modelos", rotulo: "Modelos de serviço", icone: "modelos" },
    ],
  };

  const TITULOS = {
    painel: "Visão geral",
    orcamento: "Orçamento",
    etapas: "Etapas do projeto",
    custos: "Custos da operação",
    historico: "Orçamentos salvos",
    clientes: "Clientes",
    retornos: "Próximos contatos",
    modelos: "Modelos de serviço",
    salvo: "Orçamento salvo",
    comparar: "Comparar versões",
    proposta: "Proposta comercial",
  };

  function lerModoInicial(demo) {
    if (demo) return "expandido";
    try {
      const salvo = localStorage.getItem(CHAVE_MODO);
      return MODOS.includes(salvo) ? salvo : "expandido";
    } catch {
      return "expandido";
    }
  }

  function salvarModo(modo, demo) {
    if (demo) return;
    try {
      localStorage.setItem(CHAVE_MODO, modo);
    } catch {
      // Segue normalmente durante a sessão.
    }
  }

  function iniciar({ demo }) {
    const body = document.body;
    const btnRecolher = document.querySelector("#btn-recolher-sidebar");
    const backdrop = document.querySelector("#sidebar-backdrop");
    const menuMobile = document.querySelector("#menu-mobile");

    let modoAtual = lerModoInicial(demo);

    function aplicarModo(novoModo, persistir = false) {
      if (!MODOS.includes(novoModo)) return;
      modoAtual = novoModo;
      if (body?.dataset) body.dataset.sidebar = novoModo;
      if (persistir) salvarModo(novoModo, demo);

      if (btnRecolher) {
        const recolhido = novoModo === "recolhido";
        btnRecolher.setAttribute("aria-expanded", String(!recolhido));
        btnRecolher.setAttribute("aria-label", recolhido ? "Expandir menu lateral" : "Recolher menu lateral");
        btnRecolher.title = recolhido ? "Expandir menu" : "Recolher menu";
      }
      const gestao = document.querySelector("#menu-gestao");
      const ferramentas = document.querySelector("#ferramentas-sistema");
      if (novoModo === "recolhido") {
        if (gestao) gestao.open = false;
        if (ferramentas) ferramentas.open = false;
      }
    }

    aplicarModo(modoAtual, false);

    btnRecolher?.addEventListener("click", () => {
      aplicarModo(modoAtual === "recolhido" ? "expandido" : "recolhido", true);
    });

    /* Botão orgânico: ramo crescendo da borda cuja "flor" vermelha é o símbolo << / >> */
    if (btnRecolher && typeof document.createElementNS === "function") {
      const SVG_NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 68 46");
      svg.setAttribute("fill", "none");
      svg.setAttribute("class", "icone-flor-sidebar");
      svg.setAttribute("aria-hidden", "true");

      const no = (tag, attrs) => {
        const el = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
      };

      const ramo = no("g", { class: "flor-planta" });
      ramo.append(
        no("path", {
          class: "flor-caule",
          d: "M0 24 C11 24, 19 21, 31 23",
          stroke: "#4D7852",
          "stroke-width": "2.3",
          "stroke-linecap": "round",
        }),
        no("path", {
          class: "flor-folha-esq",
          d: "M12 23 C11 14, 17 9, 24 12 C22 18, 17 22, 12 23 Z",
          fill: "#4D7852",
        }),
        no("path", {
          class: "flor-folha-dir",
          d: "M19 23 C20 31, 26 35, 31 32 C29 27, 25 23, 19 23 Z",
          fill: "#748E79",
        }),
      );

      const florSetas = no("g", { class: "flor-botao" });
      florSetas.append(
        no("path", {
          d: "M44 15 L36 23 L44 31",
          stroke: "#C94A38",
          "stroke-width": "3",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }),
        no("path", {
          d: "M53 15 L45 23 L53 31",
          stroke: "#DF624F",
          "stroke-width": "3",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }),
      );

      svg.append(ramo, florSetas);
      btnRecolher.replaceChildren(svg);
    }

    /* Botão de recolher/expandir acompanha a altura do mouse ao se aproximar da borda da sidebar */
    const barraApp = document.querySelector(".barra-app");
    if (barraApp && btnRecolher && typeof window !== "undefined"
      && window.matchMedia?.("(hover: hover)").matches) {
      let sobreBotao = false;
      btnRecolher.addEventListener("pointerenter", () => { sobreBotao = true; });
      btnRecolher.addEventListener("pointerleave", () => { sobreBotao = false; });

      document.addEventListener("pointermove", (evento) => {
        if (window.innerWidth <= 1040) {
          barraApp.classList?.remove("borda-ativa");
          return;
        }
        const rect = barraApp.getBoundingClientRect?.();
        if (!rect) return;
        const pertoDaBorda = sobreBotao || (evento.clientX >= rect.right - 56 && evento.clientX <= rect.right + 34);
        barraApp.classList?.toggle("borda-ativa", pertoDaBorda);
        if (pertoDaBorda && barraApp.style) {
          const y = Math.max(28, Math.min(window.innerHeight - 28, evento.clientY));
          barraApp.style.setProperty("--btn-y", Math.round(y) + "px");
        }
      });
      document.addEventListener("pointerleave", () => {
        barraApp.classList?.remove("borda-ativa");
      });
    }

    /* Inserir composição botânica discreta na base da sidebar (fora dos textos) */
    const baseBotanica = document.querySelector("#sidebar-botanica-base");
    if (baseBotanica && Paisagismo.botanica?.BotanicalBranch) {
      baseBotanica.append(Paisagismo.botanica.BotanicalBranch("sidebar"));
    }

    /* Fechar submenu flutuante ao clicar fora ou pressionar Escape + navegação por teclado */
    const gestaoEl = document.querySelector("#menu-gestao");
    const ferramentasEl = document.querySelector("#ferramentas-sistema");
    if (typeof document.addEventListener === "function") {
      document.addEventListener("click", (evento) => {
        if (modoAtual !== "recolhido") return;
        if (gestaoEl?.open && !gestaoEl.contains?.(evento.target)) gestaoEl.open = false;
        if (ferramentasEl?.open && !ferramentasEl.contains?.(evento.target)) ferramentasEl.open = false;
      });
    }
    gestaoEl?.addEventListener?.("keydown", (evento) => {
      const itens = [...(gestaoEl.querySelectorAll?.(".submenu-nav .nav-item") || [])];
      if (!itens.length) return;
      const idx = itens.indexOf(document.activeElement);
      if (evento.key === "ArrowDown") {
        evento.preventDefault();
        if (!gestaoEl.open) gestaoEl.open = true;
        itens[(idx + 1) % itens.length]?.focus();
      } else if (evento.key === "ArrowUp") {
        evento.preventDefault();
        if (!gestaoEl.open) gestaoEl.open = true;
        itens[(idx - 1 + itens.length) % itens.length]?.focus();
      } else if (evento.key === "Home" && idx >= 0) {
        evento.preventDefault();
        itens[0]?.focus();
      } else if (evento.key === "End" && idx >= 0) {
        evento.preventDefault();
        itens[itens.length - 1]?.focus();
      }
    });

    function atualizarTelaAtiva(destino) {
      if (modoAtual === "recolhido" && gestaoEl?.open) gestaoEl.open = false;
      if (modoAtual === "expandido" && gestaoEl && ["historico", "clientes", "retornos", "modelos", "salvo", "comparar"].includes(destino)) {
        gestaoEl.open = true;
      }
    }

    function fecharMobile() {
      if (menuMobile) menuMobile.setAttribute("aria-expanded", "false");
      if (backdrop) backdrop.hidden = true;
    }

    backdrop?.addEventListener("click", fecharMobile);

    return {
      rotas: ROTAS,
      aplicarModo,
      atualizarTelaAtiva,
      fecharMobile,
      get modo() { return modoAtual; },
    };
  }

  return {
    MODOS,
    ROTAS,
    TITULOS,
    iniciar,
  };
})();
