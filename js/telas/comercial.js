Paisagismo.telasComerciais = (() => {
  const ui = Paisagismo.ui;
  const regras = Paisagismo.comercial;

  function seletor(rotulo, opcoes, valor, alterar) {
    const select = ui.elemento("select");
    select.setAttribute("aria-label", rotulo);
    for (const [chave, nome] of opcoes) {
      const opcao = ui.elemento("option", nome);
      opcao.value = chave;
      select.append(opcao);
    }
    select.value = valor;
    select.addEventListener("change", () => {
      if (alterar(select.value) === false) select.value = valor;
      else valor = select.value;
    });
    return select;
  }

  function rotular(rotulo, campo) {
    const label = ui.elemento("label", undefined, "campo");
    label.append(ui.elemento("span", rotulo), campo);
    return label;
  }

  function campo(rotulo, objeto, chave, atualizar, tipo = "text") {
    const entrada = ui.elemento(tipo === "longo" ? "textarea" : "input");
    if (tipo === "longo") entrada.rows = 3;
    else entrada.type = tipo;
    entrada.value = objeto[chave];
    entrada.addEventListener("input", () => {
      if (entrada.validity.valid) ui.editar(objeto, chave, atualizar)(entrada.value);
    });
    return rotular(rotulo, entrada);
  }

  function iniciaisNome(nome) {
    const partes = (nome || "").trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return "NC";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function somarDias(dataIso, dias) {
    const base = new Date(dataIso + "T12:00:00Z");
    base.setUTCDate(base.getUTCDate() + dias);
    return base.toISOString().slice(0, 10);
  }

  function dadosProjeto(ctx, atualizar) {
    const projeto = ctx.dados.projeto;
    const grade = ui.elemento("div", undefined, "formulario-comercial");
    const opcoes = [["", "Selecione um cliente"], ...ctx.dados.clientes.map((c) => [c.id, c.nome])];
    const grupos = [
      ["Projeto", [
        rotular("Cliente", seletor("Cliente", opcoes, projeto.cliente, ui.editar(projeto, "cliente", atualizar))),
        campo("Tipo de serviço", projeto, "tipo", atualizar),
        campo("Local do projeto", projeto, "local", atualizar),
        campo("Área estimada (m²)", projeto, "area", atualizar),
        ui.botao("Gerenciar clientes", () => ctx.navegar("clientes"), true),
      ]],
      ["Proposta", [
        campo("Título da proposta", projeto, "tituloProposta", atualizar),
        campo("Validade da proposta", projeto, "validade", atualizar, "date"),
        campo("Prazo previsto", projeto, "prazo", atualizar),
        campo("Escopo", projeto, "escopo", atualizar, "longo"),
        campo("Exclusões", projeto, "exclusoes", atualizar, "longo"),
      ]],
      ["Condições", [
        campo("Condições de pagamento", projeto, "pagamento", atualizar, "longo"),
        campo("Observações internas", projeto, "notas", atualizar, "longo"),
      ]],
    ];
    const seletorGrupo = ui.elemento("div", undefined, "acoes grupos-comerciais");
    const botoes = grupos.map(([rotulo], indice) => ui.botao(rotulo, () => exibir(indice), true));
    function exibir(indice) {
      for (const [posicao, botao] of botoes.entries()) botao.setAttribute("aria-pressed", String(posicao === indice));
      grade.replaceChildren(...grupos[indice][1]);
    }
    seletorGrupo.append(...botoes);
    const painel = ui.elemento("div", undefined, "pilha");
    painel.append(seletorGrupo, grade);
    exibir(0);
    return painel;
  }

  function clientes(ctx) {
    const lista = ui.elemento("div", undefined, "pilha");
    const paginas = ui.paginador(5, exibir, "Páginas de clientes");
    const atualizar = ctx.aoAlterar(() => {});

    function criarNovoCliente() {
      const cliente = Object.fromEntries(regras.camposCliente.map((chave) => [chave, ""]));
      cliente.id = regras.id();
      ctx.dados.clientes.unshift(cliente);
      ctx.gravar("Cliente cadastrado.");
      paginas.atualizar(ctx.dados.clientes.length, 0);
      lista.firstElementChild.open = true;
      lista.firstElementChild.querySelector("input").focus();
    }

    function exibir(inicio, fim) {
      lista.replaceChildren(...ctx.dados.clientes.slice(inicio, fim).map((cliente) => {
        const detalhes = ui.elemento("details", undefined, "cartao");
        const titulo = ui.elemento("summary");
        const resumoLinha = ui.elemento("div", undefined, "resumo-cliente");
        const identidade = ui.elemento("div", undefined, "identidade-cliente");
        const avatar = ui.elemento("span", iniciaisNome(cliente.nome), "avatar-cliente");
        avatar.setAttribute("aria-hidden", "true");
        const textos = ui.elemento("div", undefined, "dados-resumo-cliente");
        const nomeTexto = ui.elemento("strong", cliente.nome || "Novo cliente");
        const subtextoContato = ui.elemento("small");
        const atualizarResumo = () => {
          nomeTexto.textContent = cliente.nome || "Novo cliente";
          avatar.textContent = iniciaisNome(cliente.nome);
          const infoContato = [cliente.contato, cliente.telefone, cliente.email].filter(Boolean).join(" · ");
          subtextoContato.textContent = infoContato || "Clique para editar dados de contato";
        };
        atualizarResumo();
        textos.append(nomeTexto, subtextoContato);
        identidade.append(avatar, textos);

        const vinculados = new Set(
          ctx.dados.salvos
            .filter((s) => s.projeto.cliente === cliente.id)
            .map((s) => regras.chaveProjeto(s.projeto)),
        ).size;
        const badgeProjetos = ui.elemento("span",
          vinculados ? vinculados + (vinculados === 1 ? " projeto" : " projetos") : "Sem propostas salvas",
          "etiqueta-item");
        if (vinculados) badgeProjetos.dataset.destaque = "publico";
        resumoLinha.append(identidade, badgeProjetos);
        titulo.append(resumoLinha);

        const grade = ui.elemento("div", undefined, "formulario-comercial");
        const campos = [["Nome ou empresa", "nome"], ["Pessoa de contato", "contato"],
          ["Telefone", "telefone", "tel"], ["E-mail", "email", "email"], ["Observações internas", "notas", "longo"]];
        for (const [rotulo, chave, tipo] of campos) {
          grade.append(campo(rotulo, cliente, chave, () => {
            if (!atualizar()) return false;
            atualizarResumo();
            return true;
          }, tipo));
        }
        detalhes.append(titulo, grade);
        return detalhes;
      }));
      if (!ctx.dados.clientes.length) {
        lista.append(ui.estadoVazio(
          "Nenhum cliente cadastrado",
          "Cadastre um cliente para vincular seus projetos e propostas.",
          ["1. Registre contatos e notas", "2. Vincule ao orçamento", "3. Acompanhe propostas por cliente"],
          ui.botao("Cadastrar primeiro cliente", criarNovoCliente),
        ));
      }
    }
    const adicionar = ui.botao("Cadastrar cliente", criarNovoCliente);
    paginas.atualizar(ctx.dados.clientes.length);
    const painel = ui.cabecalho("Clientes", "Guarde os contatos de quem contrata seus projetos.", adicionar);
    return [painel, lista, paginas.controles];
  }

  function modelos(ctx) {
    const area = ui.elemento("div", undefined, "pilha tela-modelos");
    const lista = ui.elemento("div", undefined, "catalogo-modelos");
    const atualizar = ctx.aoAlterar(() => {});
    const paginas = ui.paginador(window.matchMedia?.("(max-width: 690px)").matches ? 3 : 6, (inicio, fim) => {
      lista.replaceChildren(...ctx.dados.modelos.slice(inicio, fim).map((modelo, indice) => {
        const horasTotais = Paisagismo.horasProjeto(modelo.etapas);
        const topoCard = ui.elemento("div", undefined, "topo-modelo");
        const icone = ui.elemento("span", iniciaisNome(modelo.nome || "M"), "icone-modelo");
        icone.setAttribute("aria-hidden", "true");
        const badges = ui.elemento("div", undefined, "badges-modelo");
        badges.append(
          ui.elemento("span", modelo.etapas.length + " etapas", "badge-modelo"),
          ui.elemento("span", ui.numero(horasTotais) + " h", "badge-modelo"),
        );
        topoCard.append(icone, badges);

        const resumo = ui.elemento("p", modelo.etapas.length + " etapas · "
          + ui.numero(horasTotais) + " h");
        const previa = ui.elemento("ul", undefined, "previa-etapas-modelo");
        for (const [nomeEtapa, hEtapa] of modelo.etapas.slice(0, 3)) {
          previa.append(ui.elemento("li", (nomeEtapa || "Etapa") + " (" + ui.numero(hEtapa) + "h)"));
        }
        if (modelo.etapas.length > 3) {
          previa.append(ui.elemento("li", "+" + (modelo.etapas.length - 3) + " etapas"));
        }

        const acoesCard = ui.elemento("div", undefined, "acoes");
        const botaoEditar = ui.botao("Editar modelo", () => editarModelo(modelo, inicio + indice), true);
        const botaoAplicar = ui.botao("Aplicar modelo", () => ctx.aplicarModelo(modelo));
        acoesCard.append(botaoEditar, botaoAplicar);
        const card = ui.cartao(modelo.nome || "Modelo sem nome", topoCard, resumo, previa, acoesCard);
        return card;
      }));
    }, "Páginas de modelos");
    function editarModelo(modelo, indice) {
      const voltar = ui.botao("Voltar aos modelos", () => {
        exibir(indice);
        lista.children[paginas.paginaDe(indice)].querySelector("button").focus();
      }, true);
      const acoes = ui.elemento("div", undefined, "acoes");
      acoes.append(voltar, ui.botao("Aplicar ao rascunho", () => ctx.aplicarModelo(modelo)));
      const editor = ui.editor("Etapas do modelo (h)", "Horas", modelo.etapas, atualizar,
        ["Etapa", "Horas"], { ordenar: true, colunas: true,
          porPagina: window.matchMedia?.("(max-width: 690px)").matches ? 2
            : window.matchMedia?.("(max-height: 650px)").matches ? 4 : 8 });
      const grade = ui.elemento("div", undefined, "grade-modelo");
      grade.append(ui.cartao("Identificação", campo("Nome do modelo", modelo, "nome", atualizar)), editor);
      area.replaceChildren(ui.cabecalho("Editar modelo", "Ajuste as etapas antes de aplicar ao rascunho.", acoes), grade);
      voltar.focus();
    }
    function exibir(indice = 0) {
      paginas.mostrar(ctx.dados.modelos.length, indice);
      area.replaceChildren(topo, lista, paginas.controles);
    }
    const criar = ui.botao("Criar a partir do rascunho", () => {
      const modelo = { nome: ctx.dados.projeto.nome || "Novo modelo",
        etapas: ctx.dados.projeto.etapa.map(([nome, horas]) => [nome, horas]) };
      ctx.dados.modelos.unshift(modelo);
      ctx.gravar("Modelo criado.");
      editarModelo(modelo, 0);
    });
    const topo = ui.cabecalho("Modelos de serviço", "Reutilize uma estimativa inicial de etapas e horas.", criar);
    exibir();
    return [area];
  }

  function acompanhamento(ctx, item) {
    const registro = item.acompanhamento;
    const atualizar = ctx.aoAlterar(() => {});
    const grade = ui.elemento("div", undefined, "formulario-comercial");
    grade.append(rotular("Situação", seletor("Situação", regras.situacoes.map((s) => [s, s]),
      registro.situacao, ui.editar(registro, "situacao", atualizar))),
    campo("Último contato", registro, "ultimo", atualizar, "date"),
    campo("Próximo contato", registro, "proximo", atualizar, "date"),
    campo("Próxima ação", registro, "acao", atualizar),
    campo("Motivo de perda", registro, "motivo", atualizar, "longo"));
    if (registro.emitida) grade.append(ui.elemento("p", "Emitida em " + regras.formatarData(registro.emitida)));
    return ui.cartao("Acompanhamento comercial", grade);
  }

  function realizadas(ctx, item) {
    const total = ui.linha("Estimadas / realizadas");
    const exibir = () => {
      const previsto = Paisagismo.horasProjeto(item.projeto.etapa);
      const feito = item.realizadas.reduce((soma, valor) => soma + valor, 0);
      total.resultado.value = ui.numero(previsto) + " h / " + ui.numero(feito) + " h";
    };
    const atualizar = ctx.aoAlterar(exibir);
    const etapas = item.projeto.etapa.map(([nome, estimado], indice) => {
      return ui.campo(nome + " · " + ui.numero(estimado) + " h estimadas", item.realizadas[indice],
        ui.editar(item.realizadas, indice, atualizar));
    });
    exibir();
    const painel = ui.elemento("details", undefined, "cartao");
    painel.append(ui.elemento("summary", "Horas realizadas por etapa"), total.bloco, ...etapas);
    return painel;
  }

  function retornos(ctx) {
    const hoje = regras.hoje();
    const obterPendentes = () => ctx.dados.salvos.map((item, indice) => ({ item, indice }))
      .filter(({ item: { acompanhamento: a } }) => a.proximo && !["Aprovada", "Recusada"].includes(a.situacao))
      .sort((a, b) => a.item.acompanhamento.proximo.localeCompare(b.item.acompanhamento.proximo));
    let pendentes = obterPendentes();
    const topo = ui.cabecalho("Próximos contatos", "Acompanhe os retornos registrados nas propostas.");
    if (!pendentes.length) {
      const vazio = ui.estadoVazio(
        "Nenhum retorno agendado",
        "Abra um orçamento salvo e informe a data do próximo contato no acompanhamento comercial.",
        ["1. Abra um orçamento salvo", "2. Defina a data do próximo contato", "3. Acompanhe os retornos aqui"],
        ui.botao("Ver orçamentos salvos", () => ctx.navegar("historico")),
      );
      return [topo, vazio];
    }
    const grupos = [
      ["Atrasados", "atrasado", (dia) => dia < hoje],
      ["Hoje", "hoje", (dia) => dia === hoje],
      ["Agendados", "agendado", (dia) => dia > hoje],
    ];
    const lista = ui.elemento("div", undefined, "pilha agenda-grupos");
    const paginas = ui.paginador(6, (inicio, fim) => {
      pendentes = obterPendentes();
      const visiveis = pendentes.slice(inicio, fim);
      lista.replaceChildren(...grupos.map(([titulo, urgencia, pertence]) => {
        const linhas = visiveis.filter(({ item }) => pertence(item.acompanhamento.proximo)).map(({ item, indice }) => {
          const linha = ui.elemento("div", undefined, "linha item-agenda");
          const texto = ui.elemento("div");
          const badgeData = ui.elemento("span", regras.formatarData(item.acompanhamento.proximo), "badge-prazo");
          badgeData.dataset.urgencia = urgencia;
          const badgeSituacao = ui.elemento("span", item.acompanhamento.situacao, "status-proposta");
          badgeSituacao.dataset.situacao = item.acompanhamento.situacao;
          texto.append(
            ui.elemento("strong", [item.clienteNome, item.projeto.nome].filter(Boolean).join(" · ")),
            ui.elemento("p", regras.formatarData(item.acompanhamento.proximo) + " · " + (item.acompanhamento.acao || "Retomar contato")),
            badgeData,
            badgeSituacao,
          );
          const acoesItem = ui.elemento("div", undefined, "acoes");
          const reagendar = ui.botao("+7 dias", () => {
            const base = item.acompanhamento.proximo < hoje ? hoje : item.acompanhamento.proximo;
            item.acompanhamento.ultimo = hoje;
            item.acompanhamento.proximo = somarDias(base, 7);
            ctx.gravar("Contato reagendado para " + regras.formatarData(item.acompanhamento.proximo) + ".");
            pendentes = obterPendentes();
            paginas.atualizar(pendentes.length);
            lista.querySelector("button")?.focus();
          }, true);
          acoesItem.append(reagendar, ui.botao("Abrir", () => ctx.abrir(indice), true));
          linha.append(texto, acoesItem);
          return linha;
        });
        const cardGrupo = ui.cartao(titulo, ...(linhas.length ? linhas : [ui.elemento("p", "Nenhum retorno nesta página.")]));
        cardGrupo.classList.add("grupo-agenda");
        cardGrupo.dataset.grupo = titulo;
        return cardGrupo;
      }));
    }, "Páginas de próximos contatos");
    paginas.atualizar(pendentes.length);
    return [topo, lista, paginas.controles];
  }

  return { seletor, rotular, dadosProjeto, clientes, modelos, acompanhamento, realizadas, retornos };
})();
