Paisagismo.ui = (() => {
  const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const numeros = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 });
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

  function linha(rotulo, valor, tag = "output") {
    const bloco = elemento("div", undefined, "linha");
    const resultado = elemento(tag, valor);
    bloco.append(elemento("span", rotulo), resultado);
    return { bloco, resultado };
  }

  function mostrarValor(campo, valor) {
    if (campo.textContent === valor) return;
    if (campo.textContent && window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches) {
      animacoesValor.get(campo)?.cancel();
      const animacao = campo.animate?.([{ opacity: .65 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
      if (animacao) animacoesValor.set(campo, animacao);
    }
    campo.textContent = valor;
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

  function editor(titulo, unidade, itens, atualizar, colunas, opcoes = {}) {
    const lista = elemento("div", undefined, "lista-itens");
    let removido;
    const desfazer = botao("Desfazer remoção", () => {
      const { indice, item } = removido;
      itens.splice(indice, 0, item);
      if (atualizar()) {
        desfazer.hidden = true;
        renderizar();
        lista.children[indice].querySelector("textarea").focus();
      } else itens.splice(indice, 1);
    }, true);
    desfazer.hidden = true;
    const adicionar = botao("+ Adicionar item", () => {
      itens.push(["Novo item", 0]);
      if (atualizar()) {
        renderizar();
        const novo = lista.lastElementChild.querySelector("textarea");
        novo.focus();
        novo.select();
      } else itens.pop();
    }, true);
    adicionar.classList.add("adicionar");

    function renderizar() {
      lista.replaceChildren(...itens.map((item, indice) => {
        const grupo = elemento("div", undefined, "editor");
        let subtotal;
        const atualizarSubtotal = () => {
          if (subtotal) subtotal.value = reais.format(item[1] * (item[2] ?? 1));
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
            renderizar();
            (lista.children[indice]?.querySelector("textarea") || adicionar).focus();
          } else itens.splice(indice, 0, item);
        }, true);
        remover.classList.add("remover");
        remover.title = "Remover item";
        remover.setAttribute("aria-label", "Remover item " + (indice + 1));
        const nome = elemento("div", undefined, "nome-item");
        const rotuloDetalhes = elemento("summary", "Detalhes de " + (item[0] || "item"));
        nome.dataset.valor = item[0];
        const texto = entrada("Nome do item " + (indice + 1), item[0], (valor) => {
          if (!editar(0, valor)) return false;
          nome.dataset.valor = valor;
          rotuloDetalhes.textContent = "Detalhes de " + (valor || "item");
          return true;
        }, undefined, "textarea");
        texto.rows = 1;
        nome.append(texto);
        grupo.append(nome,
          entrada(unidade + " do item " + (indice + 1), item[1], (v) => editar(1, v)), remover);
        if (opcoes.tipo || opcoes.ordenar) {
          const detalhes = elemento("details", undefined, "detalhes-item");
          const extras = elemento("div", undefined, "formulario-comercial");
          detalhes.append(rotuloDetalhes, extras);
          if (opcoes.tipo === "despesa") {
            subtotal = elemento("output");
            atualizarSubtotal();
            extras.append(campo("Quantidade", item[2] ?? 1, (v) => editar(2, v)),
              campo("Unidade", item[3] ?? "", (v) => editar(3, v)),
              rotuloSubtotal(subtotal));
          }
          if (opcoes.tipo === "custo") {
            const comercial = Paisagismo.telasComerciais;
            const periodos = [["mensal", "Mensal"], ["trimestral", "Trimestral"], ["anual", "Anual"]];
            extras.append(comercial.rotular("Periodicidade", comercial.seletor("Periodicidade", periodos,
              item[2] ?? "mensal", (v) => editar(2, v))), campo("Categoria", item[3] ?? "", (v) => editar(3, v)));
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
              renderizar();
              lista.children[destino].querySelector("summary").focus();
            };
            if (indice > 0) extras.append(botao("Mover acima", () => mover(indice - 1), true));
            if (indice < itens.length - 1) extras.append(botao("Mover abaixo", () => mover(indice + 1), true));
          }
          grupo.append(detalhes);
        }
        return grupo;
      }));
    }
    renderizar();
    const topo = elemento("div", undefined, "editor-topo");
    const acoes = elemento("div", undefined, "acoes");
    acoes.append(desfazer, adicionar);
    topo.append(elemento("h2", titulo), acoes);
    const cabecalho = elemento("div", undefined, "editor editor-cabecalho");
    cabecalho.setAttribute("aria-hidden", "true");
    cabecalho.append(...colunas.map((rotulo) => elemento("span", rotulo)));
    const controles = elemento("div", undefined, "editor-controles");
    controles.append(topo, cabecalho);
    const bloco = elemento("section", undefined, "cartao");
    bloco.append(controles, lista);
    return bloco;
  }

  function rotuloSubtotal(subtotal) {
    const bloco = elemento("div", undefined, "campo");
    bloco.append(elemento("span", "Subtotal do item"), subtotal);
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

  return { elemento, botao, cabecalho, cartao, linha, campo, editor, editar, mostrarValor,
    brl: (valor) => reais.format(valor), numero: (valor) => numeros.format(valor) };
})();
