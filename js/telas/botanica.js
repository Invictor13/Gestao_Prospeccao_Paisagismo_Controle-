Paisagismo.botanica = (() => {
  const ui = Paisagismo.ui;
  const SVG_NS = "http://www.w3.org/2000/svg";

  function criarSvg(viewBox, classe) {
    if (typeof document.createElementNS !== "function") {
      const fallback = ui.elemento("span", undefined, classe);
      fallback.setAttribute("aria-hidden", "true");
      return fallback;
    }
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    if (classe) svg.setAttribute("class", classe);
    return svg;
  }

  function noSvg(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  function criarFolha({
    d,
    nervuraCentral,
    nervurasLaterais = [],
    fill,
    strokeNervura,
    classe = "",
    opacidadeNervura = "0.42",
    pivo = [0, 0],
    centro = [0, 0],
    ampRest = 1.1,
    freq = 0.85,
    fase = 0,
    inercia = 1,
  }) {
    const g = noSvg("g", { class: ("botanical-leaf " + classe).trim() });
    g.style.transformOrigin = pivo[0] + "px " + pivo[1] + "px";
    g.dataset.pivoX = String(pivo[0]);
    g.dataset.pivoY = String(pivo[1]);
    g.dataset.cx = String(centro[0]);
    g.dataset.cy = String(centro[1]);
    g.dataset.ampRest = String(ampRest);
    g.dataset.freq = String(freq);
    g.dataset.fase = String(fase);
    g.dataset.inercia = String(inercia);

    g.append(
      noSvg("path", { d, fill }),
      noSvg("path", {
        d: nervuraCentral,
        stroke: strokeNervura,
        "stroke-opacity": opacidadeNervura,
        "stroke-width": "1",
        "stroke-linecap": "round",
      }),
    );
    for (const dLat of nervurasLaterais) {
      g.append(noSvg("path", {
        d: dLat,
        stroke: strokeNervura,
        "stroke-opacity": "0.24",
        "stroke-width": "0.7",
        "stroke-linecap": "round",
      }));
    }
    return g;
  }

  /**
   * BotanicalBranch: Sistema de renderização botânica multicamadas (sombras projetadas,
   * vegetação intermediária de transição e vegetação principal detalhada) com física
   * individualizada por folha, parallax por profundidade e iluminação reativa.
   */
  function BotanicalBranch(variante = "luxury") {
    const caixa = ui.elemento("div", undefined, "botanical-branch botanical-branch-" + variante);
    caixa.setAttribute("aria-hidden", "true");
    if (typeof document.createElementNS !== "function") return caixa;

    const svg = criarSvg("0 0 760 270", "botanical-branch-svg");
    svg.setAttribute("preserveAspectRatio", "xMaxYMid slice");
    const defs = noSvg("defs");

    const gradPosteriori = noSvg("linearGradient", { id: "lux-back-" + variante, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    gradPosteriori.append(
      noSvg("stop", { offset: "0%", "stop-color": "#A9BD91", "stop-opacity": "0.34" }),
      noSvg("stop", { offset: "100%", "stop-color": "#4D7852", "stop-opacity": "0.12" }),
    );

    const gradTransicao = noSvg("linearGradient", { id: "lux-mid-soft-" + variante, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    gradTransicao.append(
      noSvg("stop", { offset: "0%", "stop-color": "#B8CBA0", "stop-opacity": "0.22" }),
      noSvg("stop", { offset: "100%", "stop-color": "#2E5A42", "stop-opacity": "0.08" }),
    );

    const gradFolhaClara = noSvg("linearGradient", { id: "lux-light-" + variante, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    gradFolhaClara.append(
      noSvg("stop", { offset: "0%", "stop-color": "#E4EBD9", "stop-opacity": "0.78" }),
      noSvg("stop", { offset: "45%", "stop-color": "#A9BD91", "stop-opacity": "0.66" }),
      noSvg("stop", { offset: "100%", "stop-color": "#4D7852", "stop-opacity": "0.44" }),
    );

    const gradFolhaMedia = noSvg("linearGradient", { id: "lux-mid-" + variante, x1: "10%", y1: "0%", x2: "90%", y2: "100%" });
    gradFolhaMedia.append(
      noSvg("stop", { offset: "0%", "stop-color": "#A9BD91", "stop-opacity": "0.86" }),
      noSvg("stop", { offset: "55%", "stop-color": "#4D7852", "stop-opacity": "0.80" }),
      noSvg("stop", { offset: "100%", "stop-color": "#1E4637", "stop-opacity": "0.72" }),
    );

    const gradFolhaProfunda = noSvg("linearGradient", { id: "lux-deep-" + variante, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    gradFolhaProfunda.append(
      noSvg("stop", { offset: "0%", "stop-color": "#748E79", "stop-opacity": "0.88" }),
      noSvg("stop", { offset: "60%", "stop-color": "#2E5A42", "stop-opacity": "0.90" }),
      noSvg("stop", { offset: "100%", "stop-color": "#122B21", "stop-opacity": "0.94" }),
    );

    defs.append(gradPosteriori, gradTransicao, gradFolhaClara, gradFolhaMedia, gradFolhaProfunda);
    svg.append(defs);

    /* Plano de fundo: Sombras botânicas projetadas estendendo-se para a região central */
    const sombras = noSvg("g", { class: "botanical-shadow-layer" });
    sombras.append(
      noSvg("path", {
        d: "M150 282 C170 210, 224 140, 294 58 C340 88, 356 172, 316 276 Z",
        fill: "#091A14",
        "fill-opacity": "0.24",
      }),
      noSvg("path", {
        d: "M420 282 C404 212, 434 134, 502 22 C558 58, 594 152, 566 254 Z",
        fill: "#091A14",
        "fill-opacity": "0.30",
      }),
      noSvg("ellipse", { cx: "328", cy: "152", rx: "110", ry: "58", fill: "#091A14", "fill-opacity": "0.16" }),
      noSvg("ellipse", { cx: "622", cy: "144", rx: "108", ry: "74", fill: "#091A14", "fill-opacity": "0.24" }),
    );
    svg.append(sombras);

    /* Plano intermediário: Vegetação secundária que cria a transição orgânica no centro */
    const posterior = noSvg("g", { class: "botanical-layer-back" });
    posterior.append(
      noSvg("path", {
        d: "M316 282 C304 214, 326 140, 382 36",
        stroke: "#A9BD91",
        "stroke-opacity": "0.24",
        "stroke-width": "1.2",
        "stroke-linecap": "round",
      }),
      noSvg("path", {
        d: "M642 280 C624 206, 638 122, 694 8",
        stroke: "#A9BD91",
        "stroke-opacity": "0.38",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
      }),
      noSvg("path", {
        d: "M464 280 C478 222, 506 174, 548 128",
        stroke: "#A9BD91",
        "stroke-opacity": "0.28",
        "stroke-width": "1.2",
        "stroke-linecap": "round",
      }),
    );

    const folhasIntermediarias = [
      /* Silhuetas sutis na zona de transição central (25% central) */
      {
        d: "M314 210 C270 198, 248 166, 260 134 C294 146, 314 176, 314 210 Z",
        nervuraCentral: "M314 210 Q286 172 264 138",
        nervurasLaterais: ["M296 186 Q282 182 272 170"],
        fill: "url(#lux-mid-soft-" + variante + ")",
        strokeNervura: "#E4EBD9",
        opacidadeNervura: "0.22",
        pivo: [314, 210],
        centro: [286, 172],
        ampRest: 0.9,
        freq: 0.62,
        fase: 0.4,
        inercia: 1.25,
      },
      {
        d: "M330 156 C368 148, 396 120, 398 92 C368 96, 342 122, 330 156 Z",
        nervuraCentral: "M330 156 Q364 124 392 96",
        nervurasLaterais: ["M352 134 Q368 130 380 120"],
        fill: "url(#lux-mid-soft-" + variante + ")",
        strokeNervura: "#E4EBD9",
        opacidadeNervura: "0.22",
        pivo: [330, 156],
        centro: [364, 124],
        ampRest: 1.0,
        freq: 0.68,
        fase: 1.3,
        inercia: 1.15,
      },
      {
        d: "M354 100 C316 86, 302 54, 318 24 C346 38, 358 68, 354 100 Z",
        nervuraCentral: "M354 100 Q334 62 321 29",
        nervurasLaterais: [],
        fill: "url(#lux-mid-soft-" + variante + ")",
        strokeNervura: "#E4EBD9",
        opacidadeNervura: "0.20",
        pivo: [354, 100],
        centro: [334, 62],
        ampRest: 1.15,
        freq: 0.74,
        fase: 2.1,
        inercia: 1.0,
      },
      /* Ramo de eucalipto posterior à direita */
      {
        d: "M640 218 C600 210, 580 182, 592 156 C620 162, 638 188, 640 218 Z",
        nervuraCentral: "M640 218 Q614 188 595 160",
        nervurasLaterais: ["M622 198 Q610 196 602 188"],
        fill: "url(#lux-back-" + variante + ")",
        strokeNervura: "#E4EBD9",
        opacidadeNervura: "0.32",
        pivo: [640, 218],
        centro: [614, 188],
        ampRest: 0.95,
        freq: 0.7,
        fase: 0.9,
        inercia: 1.2,
      },
      {
        d: "M652 164 C692 156, 720 126, 722 96 C692 102, 664 130, 652 164 Z",
        nervuraCentral: "M652 164 Q686 132 716 100",
        nervurasLaterais: ["M674 142 Q690 138 702 128"],
        fill: "url(#lux-back-" + variante + ")",
        strokeNervura: "#E4EBD9",
        opacidadeNervura: "0.32",
        pivo: [652, 164],
        centro: [686, 132],
        ampRest: 1.1,
        freq: 0.76,
        fase: 1.8,
        inercia: 1.1,
      },
      {
        d: "M668 106 C628 94, 614 60, 630 32 C658 46, 670 76, 668 106 Z",
        nervuraCentral: "M668 106 Q646 70 633 36",
        nervurasLaterais: ["M654 82 Q642 78 635 68"],
        fill: "url(#lux-back-" + variante + ")",
        strokeNervura: "#E4EBD9",
        opacidadeNervura: "0.32",
        pivo: [668, 106],
        centro: [648, 70],
        ampRest: 1.25,
        freq: 0.82,
        fase: 2.7,
        inercia: 0.95,
      },
      {
        d: "M682 58 C718 48, 742 20, 740 -10 C712 -4, 690 26, 682 58 Z",
        nervuraCentral: "M682 58 Q712 26 735 -4",
        nervurasLaterais: [],
        fill: "url(#lux-back-" + variante + ")",
        strokeNervura: "#E4EBD9",
        opacidadeNervura: "0.32",
        pivo: [682, 58],
        centro: [712, 26],
        ampRest: 1.35,
        freq: 0.9,
        fase: 3.4,
        inercia: 0.85,
      },
    ];
    for (const f of folhasIntermediarias) posterior.append(criarFolha(f));
    svg.append(posterior);

    /* Primeiro plano: Vegetação principal detalhada com nervuras e volumes */
    const principal = noSvg("g", { class: "botanical-layer-front" });
    principal.append(
      noSvg("path", {
        d: "M534 278 C528 204, 544 130, 598 12",
        stroke: "#A9BD91",
        "stroke-opacity": "0.64",
        "stroke-width": "2.2",
        "stroke-linecap": "round",
      }),
      noSvg("path", {
        d: "M542 174 C496 144, 460 102, 438 46",
        stroke: "#A9BD91",
        "stroke-opacity": "0.48",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
      }),
    );

    const folhasPrincipais = [
      {
        d: "M534 228 C472 226, 430 186, 440 146 C484 152, 522 186, 534 228 Z",
        nervuraCentral: "M534 228 Q486 188 444 150",
        nervurasLaterais: [
          "M508 208 Q486 210 468 198",
          "M488 190 Q470 188 456 176",
          "M470 172 Q456 170 448 160",
        ],
        fill: "url(#lux-deep-" + variante + ")",
        strokeNervura: "#E4EBD9",
        pivo: [534, 228],
        centro: [484, 186],
        ampRest: 0.85,
        freq: 0.65,
        fase: 0.2,
        inercia: 1.35,
      },
      {
        d: "M540 202 C594 208, 640 178, 648 138 C606 136, 562 164, 540 202 Z",
        nervuraCentral: "M540 202 Q594 172 642 142",
        nervurasLaterais: [
          "M570 186 Q592 188 614 176",
          "M594 172 Q612 170 628 158",
        ],
        fill: "url(#lux-mid-" + variante + ")",
        strokeNervura: "#FAF9F4",
        pivo: [540, 202],
        centro: [596, 172],
        ampRest: 1.0,
        freq: 0.72,
        fase: 1.1,
        inercia: 1.25,
      },
      {
        d: "M482 118 C434 114, 404 82, 412 50 C448 56, 476 84, 482 118 Z",
        nervuraCentral: "M482 118 Q446 84 416 54",
        nervurasLaterais: ["M460 96 Q442 96 428 86", "M444 80 Q430 78 422 68"],
        fill: "url(#lux-light-" + variante + ")",
        strokeNervura: "#18392D",
        opacidadeNervura: "0.32",
        pivo: [482, 118],
        centro: [446, 84],
        ampRest: 1.3,
        freq: 0.88,
        fase: 2.0,
        inercia: 0.92,
      },
      {
        d: "M550 142 C500 126, 478 84, 496 46 C530 66, 548 104, 550 142 Z",
        nervuraCentral: "M550 142 Q522 96 499 52",
        nervurasLaterais: ["M534 114 Q516 110 504 96", "M520 90 Q506 84 500 72"],
        fill: "url(#lux-deep-" + variante + ")",
        strokeNervura: "#E4EBD9",
        pivo: [550, 142],
        centro: [522, 94],
        ampRest: 1.15,
        freq: 0.78,
        fase: 2.8,
        inercia: 1.1,
      },
      {
        d: "M564 108 C618 100, 658 66, 662 26 C622 34, 582 68, 564 108 Z",
        nervuraCentral: "M564 108 Q612 68 656 31",
        nervurasLaterais: [
          "M594 84 Q614 82 632 70",
          "M616 64 Q632 60 644 50",
        ],
        fill: "url(#lux-light-" + variante + ")",
        strokeNervura: "#18392D",
        opacidadeNervura: "0.3",
        pivo: [564, 108],
        centro: [614, 68],
        ampRest: 1.25,
        freq: 0.84,
        fase: 3.6,
        inercia: 1.0,
      },
      {
        d: "M582 58 C548 38, 544 6, 564 -14 C584 6, 590 32, 582 58 Z",
        nervuraCentral: "M582 58 Q570 24 564 -8",
        nervurasLaterais: ["M574 32 Q564 26 560 16"],
        fill: "url(#lux-mid-" + variante + ")",
        strokeNervura: "#FAF9F4",
        pivo: [582, 58],
        centro: [570, 22],
        ampRest: 1.5,
        freq: 0.98,
        fase: 4.3,
        inercia: 0.8,
      },
      {
        d: "M594 30 C632 18, 660 -6, 658 -24 C628 -16, 604 4, 594 30 Z",
        nervuraCentral: "M594 30 Q626 4 652 -16",
        nervurasLaterais: [],
        fill: "url(#lux-light-" + variante + ")",
        strokeNervura: "#18392D",
        opacidadeNervura: "0.28",
        pivo: [594, 30],
        centro: [626, 4],
        ampRest: 1.65,
        freq: 1.06,
        fase: 5.1,
        inercia: 0.72,
      },
    ];

    for (const f of folhasPrincipais) principal.append(criarFolha(f));
    svg.append(principal);

    caixa.append(svg);
    return caixa;
  }

  function ativarAmbienteBotanico(header, caixaRamo) {
    if (typeof window === "undefined" || !caixaRamo?.querySelectorAll) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const camadaSombra = caixaRamo.querySelector(".botanical-shadow-layer");
    const camadaMedia = caixaRamo.querySelector(".botanical-layer-back");
    const camadaFrente = caixaRamo.querySelector(".botanical-layer-front");
    const folhas = Array.from(caixaRamo.querySelectorAll(".botanical-leaf")).map((el) => ({
      el,
      cx: Number(el.dataset.cx || 550),
      cy: Number(el.dataset.cy || 135),
      ampRest: Number(el.dataset.ampRest || 1.1),
      freq: Number(el.dataset.freq || 0.85),
      fase: Number(el.dataset.fase || 0),
      inercia: Number(el.dataset.inercia || 1),
      angulo: 0,
      vel: 0,
      brilho: 0,
    }));

    let visivel = true;
    let rafId = null;
    let hoverAtivo = false;
    let cursorNormX = 0;
    let cursorNormY = 0;
    let cursorSvgX = 560;
    let cursorSvgY = 135;
    let impulsoVento = 0;
    let ultimoClientX = null;
    let luzX = 80;
    let luzY = 18;
    let parX = 0;
    let parY = 0;
    let sombraLagX = 0;
    let sombraLagY = 0;
    let rectCache = null;
    let rectValidoAte = 0;

    function obterRect(agora) {
      if (!rectCache || agora > rectValidoAte) {
        rectCache = header.getBoundingClientRect();
        rectValidoAte = agora + 250;
      }
      return rectCache;
    }

    function iniciarLoop() {
      if (rafId !== null || !visivel || document.hidden) return;
      let ultimoT = performance.now();
      const passo = (agora) => {
        if (!header.isConnected) {
          rafId = null;
          return;
        }
        if (!visivel || document.hidden) {
          rafId = null;
          return;
        }
        const dt = Math.min(0.05, Math.max(0.008, (agora - ultimoT) / 1000));
        ultimoT = agora;
        const t = agora / 1000;

        /* Amortecimento de iluminação e parallax */
        const alvoLuzX = hoverAtivo ? (50 + cursorNormX * 42) : 80;
        const alvoLuzY = hoverAtivo ? (50 + cursorNormY * 40) : 18;
        luzX += (alvoLuzX - luzX) * Math.min(1, dt * 5.2);
        luzY += (alvoLuzY - luzY) * Math.min(1, dt * 5.2);
        header.style.setProperty("--luz-x", luzX.toFixed(2) + "%");
        header.style.setProperty("--luz-y", luzY.toFixed(2) + "%");

        const alvoParX = hoverAtivo ? cursorNormX : 0;
        const alvoParY = hoverAtivo ? cursorNormY : 0;
        parX += (alvoParX - parX) * Math.min(1, dt * 4.5);
        parY += (alvoParY - parY) * Math.min(1, dt * 4.5);
        sombraLagX += (parX - sombraLagX) * Math.min(1, dt * 2.6);
        sombraLagY += (parY - sombraLagY) * Math.min(1, dt * 2.6);

        impulsoVento *= Math.pow(0.06, dt);

        if (camadaSombra) {
          const sx = sombraLagX * 2.4 + Math.sin(t * 0.45) * 1.4;
          const sy = sombraLagY * 1.8 + Math.cos(t * 0.38) * 1.0;
          camadaSombra.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0)`;
        }
        if (camadaMedia) {
          const mx = parX * 5.0;
          const my = parY * 3.8;
          const mRot = Math.sin(t * 0.52 + 0.8) * 1.1 + impulsoVento * 0.14;
          camadaMedia.style.transform = `translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0) rotate(${mRot.toFixed(2)}deg)`;
        }
        if (camadaFrente) {
          const fx = parX * 9.8;
          const fy = parY * 7.2;
          const fRot = Math.sin(t * 0.62) * 1.35 + impulsoVento * 0.24;
          camadaFrente.style.transform = `translate3d(${fx.toFixed(2)}px, ${fy.toFixed(2)}px, 0) rotate(${fRot.toFixed(2)}deg)`;
        }

        /* Física individualizada por folha */
        for (const f of folhas) {
          const brisa = Math.sin(t * f.freq + f.fase) * f.ampRest
            + Math.sin(t * (f.freq * 1.65) + f.fase * 1.7) * (f.ampRest * 0.32);

          let alvoExtra = 0;
          let alvoBrilho = 0;
          if (hoverAtivo) {
            const dx = f.cx - cursorSvgX;
            const dy = f.cy - cursorSvgY;
            const dist = Math.hypot(dx, dy);
            const proximidade = Math.exp(-(dist * dist) / 22000);
            const onda = Math.sin(t * 3.1 - f.cx * 0.012 + f.fase) * 2.2;
            alvoExtra = (impulsoVento * (0.45 + proximidade * 1.1) + onda * (0.35 + proximidade)) / f.inercia;
            alvoBrilho = proximidade * 0.22;
          }

          const alvo = brisa + alvoExtra;
          const forca = (alvo - f.angulo) * (16 / f.inercia);
          f.vel = (f.vel + forca * dt) * Math.pow(0.18, dt);
          f.angulo += f.vel * dt * 10;
          f.brilho += (alvoBrilho - f.brilho) * Math.min(1, dt * 6);

          const escala = 1 + f.brilho * 0.14;
          f.el.style.transform = `rotate(${f.angulo.toFixed(2)}deg) scale(${escala.toFixed(3)})`;
          if (f.brilho > 0.01) {
            f.el.style.filter = `brightness(${(1 + f.brilho).toFixed(3)}) drop-shadow(0 8px 14px #06140e77)`;
          } else if (f.el.style.filter) {
            f.el.style.filter = "";
          }
        }

        rafId = window.requestAnimationFrame(passo);
      };
      rafId = window.requestAnimationFrame(passo);
    }

    header.addEventListener("pointerenter", (evento) => {
      hoverAtivo = true;
      header.classList.add("luz-ativa");
      ultimoClientX = evento.clientX;
      rectCache = null;
    });

    header.addEventListener("pointermove", (evento) => {
      const r = obterRect(performance.now());
      if (!r.width || !r.height) return;
      const nx = ((evento.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((evento.clientY - r.top) / r.height) * 2 - 1;
      cursorNormX = Math.max(-1, Math.min(1, nx));
      cursorNormY = Math.max(-1, Math.min(1, ny));

      /* Mapeia posição no card para coordenadas do viewBox 760x270 alinhado à direita */
      const larguraSvg = Math.min(r.width * 0.68, 760);
      const inicioSvg = r.right - larguraSvg;
      cursorSvgX = ((evento.clientX - inicioSvg) / Math.max(1, larguraSvg)) * 760;
      cursorSvgY = ((evento.clientY - r.top) / Math.max(1, r.height)) * 270;

      if (ultimoClientX !== null) {
        const dx = Math.max(-24, Math.min(24, evento.clientX - ultimoClientX));
        impulsoVento = Math.max(-14, Math.min(14, impulsoVento * 0.45 + dx * 0.55));
      }
      ultimoClientX = evento.clientX;
    });

    header.addEventListener("pointerleave", () => {
      hoverAtivo = false;
      ultimoClientX = null;
      header.classList.remove("luz-ativa");
    });

    if (typeof IntersectionObserver === "function") {
      const obs = new IntersectionObserver((entradas) => {
        visivel = Boolean(entradas[0]?.isIntersecting);
        if (visivel) iniciarLoop();
      }, { threshold: 0.05 });
      obs.observe(header);
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && visivel && header.isConnected) iniciarLoop();
    });

    iniciarLoop();
  }

  function LeafShadow(classe = "") {
    const el = ui.elemento("div", undefined, ("botanical-leaf-shadow " + classe).trim());
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  function OrganicPattern(classe = "") {
    const el = ui.elemento("div", undefined, ("botanical-organic-pattern " + classe).trim());
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  function OrganicSurface(tag = "section", classe = "", ...filhos) {
    const el = ui.elemento(tag, undefined, ("botanical-organic-surface " + classe).trim());
    if (filhos.length) el.append(...filhos);
    return el;
  }

  /**
   * BotanicalHeader: Painel principal Botanical Luxury em verde-floresta profundo,
   * com câmera fixa, rotação de indicadores a cada 4s e folhas interativas ao cursor.
   */
  function BotanicalHeader({ rotuloEl, valorEl, controles = null, rodape = null }) {
    const header = OrganicSurface("header", "botanical-luxury-hero");
    const ramo = BotanicalBranch("luxury");
    header.append(LeafShadow(), OrganicPattern(), ramo);

    const conteudo = ui.elemento("div", undefined, "botanical-hero-conteudo");
    const esquerda = ui.elemento("div", undefined, "botanical-hero-esquerda");
    const blocoValor = ui.elemento("div", undefined, "botanical-hero-valor");
    blocoValor.append(rotuloEl, valorEl);
    esquerda.append(blocoValor);

    if (controles) {
      controles.classList.add("botanical-hero-controles");
      esquerda.append(controles);
    }
    if (rodape) {
      esquerda.append(rodape);
    }

    conteudo.append(esquerda);
    header.append(conteudo);
    ativarAmbienteBotanico(header, ramo);
    return header;
  }

  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", () => {
      document.body?.classList?.toggle("pagina-inativa", document.hidden);
    });
  }

  /**
   * Ilustrações vetoriais semânticas e artísticas para os cards de acesso rápido:
   * pessoas (Clientes), documentos (Orçamentos), calendario (Contatos), maleta (Serviços).
   */
  function criarIlustracaoCard(tipo = "pessoas") {
    const caixa = ui.elemento("span", undefined, "atalho-ilustracao");
    caixa.dataset.ilustracao = tipo;
    caixa.setAttribute("aria-hidden", "true");
    if (typeof document.createElementNS !== "function") return caixa;

    const paletas = {
      pessoas: { clara: "#A9BD91", media: "#4D7852", escura: "#18392D", sombra: "#18392D" },
      documentos: { clara: "#9BB09D", media: "#5C7A65", escura: "#18392D", sombra: "#18392D" },
      calendario: { clara: "#E2B69E", media: "#BF805F", escura: "#8C4A2B", sombra: "#7D3618" },
      maleta: { clara: "#D8C08A", media: "#9A7B3E", escura: "#69511F", sombra: "#5A4418" },
    };
    const p = paletas[tipo] || paletas.pessoas;
    const svg = criarSvg("0 0 124 112", "atalho-ilustracao-svg");

    const defs = noSvg("defs");
    const gradA = noSvg("linearGradient", { id: "ilus-a-" + tipo, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    gradA.append(
      noSvg("stop", { offset: "0%", "stop-color": p.clara, "stop-opacity": "0.86" }),
      noSvg("stop", { offset: "100%", "stop-color": p.media, "stop-opacity": "0.62" }),
    );
    const gradB = noSvg("linearGradient", { id: "ilus-b-" + tipo, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    gradB.append(
      noSvg("stop", { offset: "0%", "stop-color": p.media, "stop-opacity": "0.9" }),
      noSvg("stop", { offset: "100%", "stop-color": p.escura, "stop-opacity": "0.82" }),
    );
    defs.append(gradA, gradB);
    svg.append(defs);

    const sombra = noSvg("g", { class: "atalho-ilus-sombra" });
    sombra.append(noSvg("ellipse", { cx: "76", cy: "72", rx: "38", ry: "26", fill: p.sombra, "fill-opacity": "0.13" }));
    svg.append(sombra);

    const cena = noSvg("g", { class: "atalho-ilus-cena" });

    if (tipo === "pessoas") {
      const pessoaFundo = noSvg("g", { class: "ilus-pessoa-fundo" });
      pessoaFundo.append(
        noSvg("circle", { cx: "88", cy: "38", r: "14", fill: "url(#ilus-a-pessoas)" }),
        noSvg("path", { d: "M64 98 C64 74, 74 60, 88 60 C104 60, 114 74, 114 98 Z", fill: "url(#ilus-a-pessoas)" }),
      );
      const pessoaFrente = noSvg("g", { class: "ilus-pessoa-frente" });
      pessoaFrente.append(
        noSvg("circle", { cx: "62", cy: "44", r: "16", fill: "url(#ilus-b-pessoas)" }),
        noSvg("path", { d: "M34 108 C34 80, 46 66, 62 66 C78 66, 90 80, 90 108 Z", fill: "url(#ilus-b-pessoas)" }),
      );
      cena.append(pessoaFundo, pessoaFrente);
    } else if (tipo === "documentos") {
      const docFundo = noSvg("g", { class: "ilus-doc-fundo" });
      docFundo.append(
        noSvg("rect", { x: "56", y: "18", width: "52", height: "72", rx: "9", fill: "url(#ilus-a-documentos)" }),
      );
      const docFrente = noSvg("g", { class: "ilus-doc-frente" });
      docFrente.append(
        noSvg("rect", { x: "38", y: "30", width: "56", height: "76", rx: "9", fill: "url(#ilus-b-documentos)" }),
        noSvg("path", { d: "M50 50 H80 M50 64 H76 M50 78 H68", stroke: "#FAF9F4", "stroke-opacity": "0.7", "stroke-width": "2.6", "stroke-linecap": "round" }),
      );
      cena.append(docFundo, docFrente);
    } else if (tipo === "calendario") {
      const calBase = noSvg("g", { class: "ilus-cal-base" });
      calBase.append(
        noSvg("rect", { x: "38", y: "26", width: "74", height: "74", rx: "12", fill: "url(#ilus-a-calendario)" }),
        noSvg("path", { d: "M38 44 C38 34, 44 26, 52 26 H98 C106 26, 112 34, 112 44 V50 H38 Z", fill: "url(#ilus-b-calendario)" }),
        noSvg("path", { d: "M56 18 V32 M94 18 V32", stroke: p.escura, "stroke-opacity": "0.65", "stroke-width": "3.2", "stroke-linecap": "round" }),
      );
      const calConfirma = noSvg("g", { class: "ilus-cal-confirma" });
      calConfirma.append(
        noSvg("circle", { cx: "75", cy: "74", r: "14", fill: "#FAF9F4", "fill-opacity": "0.86" }),
        noSvg("path", { d: "M68 74 L73 79 L83 68", stroke: p.escura, "stroke-width": "2.6", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      );
      cena.append(calBase, calConfirma);
    } else {
      /* maleta / portfólio de serviços */
      const maletaBase = noSvg("g", { class: "ilus-maleta-base" });
      maletaBase.append(
        noSvg("rect", { x: "36", y: "42", width: "76", height: "58", rx: "11", fill: "url(#ilus-a-maleta)" }),
      );
      const maletaTampa = noSvg("g", { class: "ilus-maleta-tampa" });
      maletaTampa.append(
        noSvg("path", { d: "M58 42 V32 C58 27, 62 24, 67 24 H81 C86 24, 90 27, 90 32 V42", stroke: p.escura, "stroke-opacity": "0.75", "stroke-width": "3.2", "stroke-linecap": "round" }),
        noSvg("path", { d: "M36 52 C36 46, 41 42, 47 42 H101 C107 42, 112 46, 112 52 V64 C92 70, 56 70, 36 64 Z", fill: "url(#ilus-b-maleta)" }),
        noSvg("rect", { x: "69", y: "60", width: "10", height: "8", rx: "3", fill: "#FAF9F4", "fill-opacity": "0.88" }),
      );
      cena.append(maletaBase, maletaTampa);
    }

    svg.append(cena);
    caixa.append(svg);
    return caixa;
  }

  /**
   * BotanicalQuickAccessCard: Card minimalista com exatamente 3 elementos visuais:
   * quantidade, título e ilustração vetorial semântica na lateral direita.
   */
  function BotanicalQuickAccessCard({ titulo, quantidade, destino, tema, ilustracao, aoNavegar }) {
    const card = ui.elemento("button", undefined, "atalho-categoria");
    card.type = "button";
    card.dataset.tom = tema;
    card.dataset.modulo = destino;
    card.addEventListener("click", () => aoNavegar(destino));

    const grupoTexto = ui.elemento("div", undefined, "atalho-texto-grupo");
    const num = ui.elemento("strong", undefined, "atalho-qtd");
    ui.animarNumero(num, ui.numero(quantidade));
    const rotulo = ui.elemento("span", titulo, "atalho-nome");
    grupoTexto.append(num, rotulo);

    card.append(grupoTexto, criarIlustracaoCard(ilustracao));
    return card;
  }

  /**
   * Ilustração artística de calendário para Agenda comercial,
   * com 4 estados dinâmicos: em-dia, futuro, hoje, atrasado.
   */
  function criarIlustracaoAgenda(estado = "em-dia") {
    const caixa = ui.elemento("span", undefined, "agenda-ilustracao");
    caixa.dataset.estado = estado;
    caixa.setAttribute("aria-hidden", "true");
    if (typeof document.createElementNS !== "function") return caixa;

    const paletas = {
      "em-dia": { clara: "#A9BD91", media: "#4D7852", escura: "#18392D", sombra: "#18392D" },
      futuro: { clara: "#9BB09D", media: "#5C7A65", escura: "#18392D", sombra: "#18392D" },
      hoje: { clara: "#E2CC96", media: "#C4A66B", escura: "#7A5D24", sombra: "#5A4418" },
      atrasado: { clara: "#E2B69E", media: "#BF805F", escura: "#8C4A2B", sombra: "#7D3618" },
    };
    const p = paletas[estado] || paletas["em-dia"];
    const svg = criarSvg("0 0 132 116", "agenda-ilustracao-svg");

    const defs = noSvg("defs");
    const gradA = noSvg("linearGradient", { id: "ag-a-" + estado, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    gradA.append(
      noSvg("stop", { offset: "0%", "stop-color": p.clara, "stop-opacity": "0.85" }),
      noSvg("stop", { offset: "100%", "stop-color": p.media, "stop-opacity": "0.58" }),
    );
    const gradB = noSvg("linearGradient", { id: "ag-b-" + estado, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    gradB.append(
      noSvg("stop", { offset: "0%", "stop-color": p.media, "stop-opacity": "0.9" }),
      noSvg("stop", { offset: "100%", "stop-color": p.escura, "stop-opacity": "0.82" }),
    );
    defs.append(gradA, gradB);
    svg.append(defs);

    const sombra = noSvg("g", { class: "agenda-ilus-sombra" });
    sombra.append(noSvg("ellipse", { cx: "80", cy: "76", rx: "40", ry: "26", fill: p.sombra, "fill-opacity": "0.13" }));
    svg.append(sombra);

    const corpo = noSvg("g", { class: "agenda-ilus-corpo" });
    corpo.append(
      noSvg("rect", { x: "38", y: "24", width: "78", height: "78", rx: "13", fill: "url(#ag-a-" + estado + ")" }),
      noSvg("path", { d: "M38 42 C38 32, 44 24, 52 24 H102 C110 24, 116 32, 116 42 V48 H38 Z", fill: "url(#ag-b-" + estado + ")" }),
      noSvg("path", { d: "M58 16 V30 M96 16 V30", stroke: p.escura, "stroke-opacity": "0.65", "stroke-width": "3.2", "stroke-linecap": "round" }),
    );

    const simbolo = noSvg("g", { class: "agenda-ilus-simbolo" });
    simbolo.append(noSvg("circle", { cx: "77", cy: "74", r: "16", fill: "#FAF9F4", "fill-opacity": "0.88" }));

    if (estado === "em-dia" || estado === "futuro") {
      simbolo.append(noSvg("path", {
        d: "M70 74 L75 79 L85 68",
        stroke: p.escura,
        "stroke-width": "2.6",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }));
    } else if (estado === "hoje") {
      simbolo.append(
        noSvg("circle", { cx: "77", cy: "74", r: "8.5", stroke: p.escura, "stroke-width": "2.1" }),
        noSvg("path", { d: "M77 69.5 V74.5 L80.5 76.5", stroke: p.escura, "stroke-width": "2.1", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      );
    } else {
      simbolo.append(
        noSvg("path", { d: "M77 66 V76", stroke: p.escura, "stroke-width": "2.8", "stroke-linecap": "round" }),
        noSvg("circle", { cx: "77", cy: "81.5", r: "1.7", fill: p.escura }),
      );
    }

    svg.append(corpo, simbolo);
    caixa.append(svg);
    return caixa;
  }

  /**
   * Símbolos SVG discretos para os 4 estados de Situação das propostas.
   */
  function criarSimboloSituacao(situacao) {
    const caixa = ui.elemento("span", undefined, "situacao-simbolo");
    caixa.dataset.situacao = situacao;
    caixa.setAttribute("aria-hidden", "true");
    if (typeof document.createElementNS !== "function") return caixa;

    const svg = criarSvg("0 0 24 24", "situacao-simbolo-svg");
    if (situacao === "Planejada") {
      svg.append(
        noSvg("rect", { class: "simb-doc-fundo", x: "8", y: "3", width: "11", height: "14", rx: "2.2", stroke: "currentColor", "stroke-width": "1.6", "stroke-opacity": "0.55" }),
        noSvg("rect", { class: "simb-doc-frente", x: "5", y: "6", width: "11", height: "14", rx: "2.2", fill: "#FAF9F4", stroke: "currentColor", "stroke-width": "1.7" }),
      );
    } else if (situacao === "Enviada") {
      svg.append(
        noSvg("path", { class: "simb-envio", d: "M21 3L10 14M21 3L14.5 21L10 14L3 9.5L21 3Z", stroke: "currentColor", "stroke-width": "1.7", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      );
    } else if (situacao === "Aprovada") {
      svg.append(
        noSvg("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", "stroke-width": "1.7" }),
        noSvg("path", { class: "simb-check", d: "M8.5 12.2L11 14.7L15.8 9.6", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      );
    } else {
      svg.append(
        noSvg("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", "stroke-width": "1.7" }),
        noSvg("path", { class: "simb-recusa", d: "M9.2 9.2L14.8 14.8M14.8 9.2L9.2 14.8", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round" }),
      );
    }
    caixa.append(svg);
    return caixa;
  }

  return {
    BotanicalBranch,
    BotanicalQuickAccessCard,
    criarIlustracaoAgenda,
    criarSimboloSituacao,
    LeafShadow,
    OrganicPattern,
    OrganicSurface,
    BotanicalHeader,
    ativarAmbienteBotanico,
  };
})();
