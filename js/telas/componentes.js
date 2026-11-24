Paisagismo.ui = (() => {
  const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const numeros = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 });
  const percentuais = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  const animacoesValor = new WeakMap();

  function elemento(tag, texto, classe) {
    const item = document.createElement(tag);
    if (texto !== undefined) item.textContent = texto;
    if (classe) item.className = classe;
    return item;
  }

  function botao(texto, acao, secundario = false) {
    const item = elemento("button", texto, secundario ? "botao secundario" : "botao");
    item.type = "button";
    item.addEventListener("click", acao);
    return item;
  }

  function cabecalho(titulo, descricao, acoes) {
    const bloco = elemento("header", undefined, "cabecalho");
    const texto = elemento("div");
    texto.append(elemento("h1", titulo), elemento("p", descricao));
    bloco.append(texto);
    if (acoes) bloco.append(acoes);
    return bloco;
  }

  function cartao(titulo, ...filhos) {
    const bloco = elemento("section", undefined, "cartao");
    bloco.append(elemento("h2", titulo), ...filhos);
    return bloco;
  }

  function dica(rotulo, explicacao) {
    const icone = elemento("span", "?", "dica-formula");
    icone.title = explicacao;
    icone.setAttribute("aria-label", rotulo + ": " + explicacao);
    return icone;
  }

  function linha(rotulo, valor, tag = "output", explicacao = "") {
    const bloco = elemento("div", undefined, "linha");
    const resultado = elemento(tag, valor);
    const texto = elemento("span", rotulo);
    if (explicacao) texto.append(dica(rotulo, explicacao));
    bloco.append(texto, resultado);
    return { bloco, resultado };
  }

  function mostrarValor(campo, valor) {
    if (campo.textContent === valor) return;
    if (campo.textContent && window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches) {
      animacoesValor.get(campo)?.cancel();
      const animacao = campo.animate?.([
        { opacity: .58, transform: "translateY(2px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      if (animacao) animacoesValor.set(campo, animacao);
    }
    campo.textContent = valor;
  }

  function animarNumero(campo, textoFinal) {
    campo.textContent = textoFinal;
    if (window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches) {
      campo.animate?.([
        { opacity: 0, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    }
  }

  function estadoVazio(titulo, descricao, acao = null, icone = "historico") {
    const bloco = elemento("section", undefined, "cartao estado-vazio");
    bloco.dataset.icone = icone;
    const filhos = [elemento("h1", titulo), elemento("p", descricao)];
    if (acao) filhos.push(acao);
    bloco.append(...filhos);
    return bloco;
  }

  function entrada(rotulo, valor, atualizar, minimo, tag = "input", maximo) {
    const campo = elemento(tag);
    campo.setAttribute("aria-label", rotulo);
    const numerico = typeof valor === "number";
    const formatarEntrada = (numero) => String(numero).replace(".", ",");
    campo.value = numerico ? formatarEntrada(valor) : valor;
    if (numerico) {
      campo.inputMode = "decimal";
      campo.classList.add("entrada-numerica");
      campo.required = true;
      campo.addEventListener("blur", () => {
        campo.value = formatarEntrada(valor);
        campo.removeAttribute("aria-invalid");
        campo.setCustomValidity("");
      });
    }
    campo.addEventListener("input", () => {
      let novo = campo.value;
      if (numerico) {
        const texto = campo.value.trim();
        const formato = /^(?:\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[,.]\d+)?|[,.]\d+)$/.test(texto);
        const agrupado = /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(texto)
          && (texto.includes(",") || texto.indexOf(".") !== texto.lastIndexOf("."));
        novo = Number((agrupado ? texto.replaceAll(".", "") : texto).replace(",", "."));
        const valido = formato && Number.isFinite(novo) && novo >= (minimo ?? 0) && novo <= (maximo ?? Infinity);
        campo.setCustomValidity(valido ? "" : "Informe um número dentro do intervalo permitido.");
        if (!valido) {
          campo.setAttribute("aria-invalid", "true");
          return;
        }
        campo.removeAttribute("aria-invalid");
      }
      if (atualizar(novo)) valor = novo;
    });
    return campo;
  }

  function campo(rotulo, valor, atualizar, minimo, maximo) {
    const bloco = elemento("label", undefined, "campo");
    bloco.append(elemento("span", rotulo), entrada(rotulo, valor, atualizar, minimo, "input", maximo));
    return bloco;
  }

  function abrirDialogo(ancora, titulo, conteudo) {
    const modal = elemento("dialog", undefined, "dialogo-edicao");
    modal.setAttribute("aria-label", titulo);
    const form = elemento("form");
    form.method = "dialog";
    const fechar = elemento("button", "Fechar", "botao secundario");
    fechar.autofocus = true;
    form.append(fechar);
    const topo = elemento("div", undefined, "dialogo-topo");
    topo.append(elemento("h2", titulo), form);
    modal.append(topo, conteudo);
    modal.addEventListener("close", () => {
      modal.remove();
      ancora.focus();
    });
    ancora.parentElement.append(modal);
    modal.showModal();
    return modal;
  }

  function paginador(tamanho, exibir, rotulo) {
    let pagina = 0;
    let total = 0;
    const legenda = elemento("span", undefined, "paginacao-legenda");
    legenda.setAttribute("role", "status");
    const anterior = botao("Anterior", () => atualizar(total, pagina - 1), true);
    const proxima = botao("Próxima", () => atualizar(total, pagina + 1), true);
    const controles = elemento("nav", undefined, "paginacao");
    controles.setAttribute("aria-label", rotulo);
    controles.append(anterior, legenda, proxima);
    function atualizar(quantidade, destino = pagina) {
      total = quantidade;
      const paginas = Math.max(1, Math.ceil(total / tamanho));
      pagina = Math.max(0, Math.min(destino, paginas - 1));
      legenda.textContent = (pagina + 1) + " de " + paginas + " · " + total + (total === 1 ? " item" : " itens");
      controles.hidden = paginas <= 1;
      anterior.disabled = pagina === 0;
      proxima.disabled = pagina === paginas - 1;
      exibir(pagina * tamanho, (pagina + 1) * tamanho);
    }
    return { controles, atualizar, mostrar: (quantidade, indice) => atualizar(quantidade, Math.floor(indice / tamanho)),
      paginaDe: (indice) => indice % tamanho };
  }

  function editor(titulo, unidade, itens, atualizar, colunas, opcoes = {}) {
    const lista = elemento("div", undefined, "lista-itens");
    lista.setAttribute("role", "group");
    lista.setAttribute("aria-label", colunas.join(" · "));
    let atualizarBarrasVisiveis = () => {};
    let termoBusca = "";
    let filtroPeriodo = "";
    const normalizar = (t) => String(t || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const obterFiltrados = () => itens
      .map((item, indice) => ({ item, indice }))
      .filter(({ item }) => {
        if (termoBusca && !normalizar(item[0] + " " + (item[3] || "")).includes(termoBusca)) return false;
        if (filtroPeriodo && (item[2] ?? "mensal") !== filtroPeriodo) return false;
        return true;
      });

    const paginacao = paginador(opcoes.porPagina ?? 8, renderizar, "Páginas de " + titulo.toLowerCase());
    let removido;
    const desfazer = botao("Desfazer remoção", () => {
      const { indice, item } = removido;
      itens.splice(indice, 0, item);
      if (atualizar()) {
        desfazer.hidden = true;
        termoBusca = "";
        filtroPeriodo = "";
        if (campoBusca) campoBusca.value = "";
        if (seletorPeriodo) seletorPeriodo.value = "";
        paginacao.mostrar(itens.length, indice);
        lista.children[paginacao.paginaDe(indice)]?.querySelector("textarea")?.focus();
      } else itens.splice(indice, 1);
    }, true);
    desfazer.hidden = true;
    const adicionar = botao("+ Adicionar item", () => {
      itens.push(["Novo item", 0]);
      if (atualizar()) {
        termoBusca = "";
        filtroPeriodo = "";
        if (campoBusca) campoBusca.value = "";
        if (seletorPeriodo) seletorPeriodo.value = "";
        paginacao.mostrar(itens.length, itens.length - 1);
        const novo = lista.lastElementChild?.querySelector("textarea");
        novo?.focus();
        novo?.select();
      } else itens.pop();
    }, true);
    adicionar.classList.add("adicionar");

    function renderizar(inicio, fim) {
      const atualizadoresLinha = [];
      atualizarBarrasVisiveis = () => {
        for (const fn of atualizadoresLinha) fn();
      };
      const filtrados = obterFiltrados();
      if (!filtrados.length && (termoBusca || filtroPeriodo)) {
        lista.replaceChildren(elemento("p", "Nenhum item encontrado para o filtro informado."));
        return;
      }
      lista.replaceChildren(...filtrados.slice(inicio, fim).map(({ item, indice }) => {
        const grupo = elemento("div", undefined, "editor");
        let subtotal;
        let equivalenteMensal;
        let atualizarMeta = () => {};
        const meses = { mensal: 1, trimestral: 3, anual: 12 };
        const atualizarSubtotal = () => {
          if (subtotal) subtotal.value = reais.format(item[1] * (item[2] ?? 1));
          if (equivalenteMensal) {
            const divisor = meses[item[2] ?? "mensal"] || 1;
            equivalenteMensal.value = reais.format((Number(item[1]) || 0) / divisor);
          }
          atualizarBarrasVisiveis();
        };
        function editar(coluna, valor) {
          const anterior = item.slice();
          item[coluna] = valor;
          if (atualizar()) {
            atualizarSubtotal();
            return true;
          }
          item.splice(0, item.length, ...anterior);
          return false;
        }
        const remover = botao("×", () => {
          itens.splice(indice, 1);
          if (atualizar()) {
            removido = { indice, item };
            desfazer.hidden = false;
            const restantes = obterFiltrados();
            const proximo = Math.max(0, Math.min(indice, restantes.length - 1));
            paginacao.mostrar(restantes.length, proximo);
            (lista.children[paginacao.paginaDe(proximo)]?.querySelector("textarea") || adicionar).focus();
          } else itens.splice(indice, 0, item);
        }, true);
        remover.classList.add("remover");
        remover.title = "Remover item";
        remover.setAttribute("aria-label", "Remover item " + (indice + 1));

        const cabecalhoItem = elemento("div", undefined, "cabecalho-item-editor");
        const numeroBadge = elemento("span", String(indice + 1).padStart(2, "0"), "indice-item");
        numeroBadge.setAttribute("aria-hidden", "true");
        const nome = elemento("div", undefined, "nome-item");
        const detalhes = botao("Detalhes", () => {
          modal = abrirDialogo(detalhes, "Detalhes de " + (item[0] || "item"), extras);
        }, true);
        detalhes.classList.add("botao-detalhes-item");
        const extras = elemento("div", undefined, "formulario-comercial detalhes-formulario");
        let modal;
        const nomeDetalhes = () => {
          detalhes.setAttribute("aria-label", "Detalhes de " + (item[0] || "item " + (indice + 1)));
          nome.title = item[0] || "";
        };
        nomeDetalhes();
        nome.dataset.valor = item[0];
        const texto = entrada("Nome do item " + (indice + 1), item[0], (valor) => {
          if (!editar(0, valor)) return false;
          nome.dataset.valor = valor;
          nomeDetalhes();
          return true;
        }, undefined, "textarea");
        texto.rows = 1;
        nome.append(texto);
        cabecalhoItem.append(numeroBadge, nome);

        if (opcoes.tipo === "etapa") {
          const barra = elemento("div", undefined, "barra-proporcao barra-proporcao-base");
          const barraInterna = elemento("div", undefined, "barra-proporcao-interna");
          barra.append(barraInterna);
          grupo.append(barra);
          atualizarMeta = () => {
            const totalHoras = Math.max(0.01, itens.reduce((soma, [, h]) => soma + (Number(h) || 0), 0));
            const pct = Math.min(100, Math.round(((Number(item[1]) || 0) / totalHoras) * 100));
            barraInterna.setAttribute("style", "width:" + pct + "%");
            const info = [pct + "% do esforço", item[4] === true ? "Entregável na proposta" : "", item[3] || ""]
              .filter(Boolean).join(" · ");
            barra.title = info;
            if (item[4] === true) numeroBadge.dataset.destaque = "publico";
            else delete numeroBadge.dataset.destaque;
          };
          atualizadoresLinha.push(atualizarMeta);
        }

        if (opcoes.tipo === "custo") {
          const etiqueta = elemento("span", undefined, "etiqueta-item etiqueta-inline");
          cabecalhoItem.append(etiqueta);
          atualizarMeta = () => {
            const p = item[2] && item[2] !== "mensal" ? (item[2] === "anual" ? "Anual" : "Trim.") : "";
            const cat = item[3] || "";
            const info = [p, cat].filter(Boolean).join(" · ");
            etiqueta.textContent = info;
            etiqueta.hidden = !info;
          };
          atualizadoresLinha.push(atualizarMeta);
        }

        const acoesItem = elemento("div", undefined, "acoes-item");
        if (opcoes.tipo || opcoes.ordenar) acoesItem.append(detalhes);
        acoesItem.append(remover);
        grupo.append(cabecalhoItem, entrada(unidade + " do item " + (indice + 1), item[1], (v) => editar(1, v)), acoesItem);

        if (opcoes.tipo || opcoes.ordenar) {
          if (opcoes.tipo === "despesa") {
            subtotal = elemento("output");
            atualizarSubtotal();
            extras.append(campo("Quantidade", item[2] ?? 1, (v) => editar(2, v)),
              campo("Unidade", item[3] ?? "", (v) => editar(3, v)),
              rotuloValor("Subtotal do item", subtotal));
          }
          if (opcoes.tipo === "custo") {
            const comercial = Paisagismo.telasComerciais;
            const periodos = [["mensal", "Mensal"], ["trimestral", "Trimestral"], ["anual", "Anual"]];
            equivalenteMensal = elemento("output");
            atualizarSubtotal();
            extras.append(
              comercial.rotular("Periodicidade", comercial.seletor("Periodicidade", periodos,
                item[2] ?? "mensal", (v) => editar(2, v))),
              campo("Categoria", item[3] ?? "", (v) => editar(3, v)),
              rotuloValor("Custo mensal equivalente", equivalenteMensal),
            );
          }
          if (opcoes.tipo === "etapa") {
            const publico = elemento("input");
            publico.type = "checkbox";
            publico.checked = item[4] === true;
            publico.addEventListener("change", () => editar(4, publico.checked));
            extras.append(campo("Descrição para a proposta", item[2] ?? "", (v) => editar(2, v)),
              campo("Responsável", item[3] ?? "", (v) => editar(3, v)),
              Paisagismo.telasComerciais.rotular("Incluir entre os entregáveis", publico));
          }
          if (opcoes.ordenar) {
            const mover = (destino) => {
              [itens[indice], itens[destino]] = [itens[destino], itens[indice]];
              if (!atualizar()) {
                [itens[indice], itens[destino]] = [itens[destino], itens[indice]];
                return;
              }
              modal.close();
              paginacao.mostrar(itens.length, destino);
              lista.children[paginacao.paginaDe(destino)]?.querySelector("textarea")?.focus();
            };
            if (indice > 0) extras.append(botao("Mover acima", () => mover(indice - 1), true));
            if (indice < itens.length - 1) extras.append(botao("Mover abaixo", () => mover(indice + 1), true));
          }
        }
        return grupo;
      }));
      atualizarBarrasVisiveis();
    }

    let campoBusca;
    let seletorPeriodo;
    const topo = elemento("div", undefined, "editor-topo");
    const acoes = elemento("div", undefined, "acoes");
    if (opcoes.tipo === "custo") {
      campoBusca = elemento("input");
      campoBusca.type = "search";
      campoBusca.placeholder = "Buscar despesa...";
      campoBusca.className = "busca-compacta";
      campoBusca.setAttribute("aria-label", "Buscar despesa da operação");
      campoBusca.addEventListener("input", () => {
        termoBusca = normalizar(campoBusca.value.trim());
        paginacao.atualizar(obterFiltrados().length, 0);
      });
      acoes.append(campoBusca);
    }
    acoes.append(desfazer, adicionar);
    topo.append(elemento("h2", titulo), acoes);
    paginacao.atualizar(itens.length);
    const bloco = elemento("section", undefined, "cartao cartao-editor");
    if (opcoes.tipo) bloco.dataset.tipo = opcoes.tipo;
    if (opcoes.colunas) lista.classList.add("lista-dupla");
    bloco.append(topo, lista, paginacao.controles);
    return bloco;
  }

  function rotuloValor(rotulo, output) {
    const bloco = elemento("div", undefined, "campo");
    bloco.append(elemento("span", rotulo), output);
    return bloco;
  }

  function editar(objeto, chave, atualizar) {
    return (valor) => {
      const anterior = objeto[chave];
      objeto[chave] = valor;
      if (atualizar()) return true;
      objeto[chave] = anterior;
      return false;
    };
  }

  return { elemento, botao, cabecalho, cartao, linha, campo, editor, editar, mostrarValor, animarNumero,
    estadoVazio, paginador, abrirDialogo,
    brl: (valor) => reais.format(valor),
    numero: (valor) => numeros.format(valor),
    percentual: (valor) => percentuais.format(valor) + "%" };
})();
