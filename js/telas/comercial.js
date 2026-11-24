Paisagismo.telasComerciais = (() => {
  const ui = Paisagismo.ui;
  const regras = Paisagismo.comercial;

  const tiposImovel = [
    ["", "Selecione o tipo"],
    ["Residencial unifamiliar", "Residencial unifamiliar (monofamiliar)"],
    ["Residencial multifamiliar", "Residencial multifamiliar (condomínio/prédio)"],
    ["Comercial", "Comercial"],
    ["Corporativo / Institucional", "Corporativo / Institucional"],
    ["Chácara / Sítio", "Chácara / Sítio"],
  ];
  const situacoesObra = [
    ["", "Selecione o estágio"],
    ["Na planta / Planejamento", "Na planta / Planejamento"],
    ["Em obra", "Em obra"],
    ["Já construído / Reforma", "Já construído / Reforma"],
  ];
  const opcoesInsolacao = ["Sol pleno", "Meia-sombra", "Sombra", "Luz difusa"];
  const opcoesMateriais = [
    "Madeira/Deck", "Pedra natural", "Concreto", "Iluminação",
    "Irrigação", "Horta/Frutíferas", "Baixa manutenção", "Vasos autorais",
  ];

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
    entrada.value = objeto[chave] ?? "";
    entrada.addEventListener("input", () => {
      if (entrada.validity.valid) ui.editar(objeto, chave, atualizar)(entrada.value);
    });
    return rotular(rotulo, entrada);
  }

  function seletorMultiplo(rotulo, opcoes, objeto, chave, atualizar) {
    const bloco = ui.elemento("div", undefined, "campo campo-completo");
    bloco.append(ui.elemento("span", rotulo));
    const gradeChips = ui.elemento("div", undefined, "chips-selecao");
    const lerAtivos = () => new Set(
      (objeto[chave] || "").split(",").map((s) => s.trim()).filter(Boolean),
    );
    const ativos = lerAtivos();
    for (const opcao of opcoes) {
      const btn = ui.elemento("button", opcao, "chip-opcao");
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(ativos.has(opcao)));
      btn.addEventListener("click", () => {
        if (ativos.has(opcao)) ativos.delete(opcao);
        else ativos.add(opcao);
        const novoValor = [...ativos].join(", ");
        if (ui.editar(objeto, chave, atualizar)(novoValor)) {
          btn.setAttribute("aria-pressed", String(ativos.has(opcao)));
        }
      });
      gradeChips.append(btn);
    }
    bloco.append(gradeChips);
    return bloco;
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

  function resumoBriefingCliente(cliente) {
    if (!cliente) return "";
    return [
      cliente.tipoImovel,
      cliente.areaTerreno && cliente.areaTerreno + " m²",
      cliente.situacaoObra,
      cliente.insolacao && "Luz: " + cliente.insolacao,
      cliente.pets && "Pets: " + cliente.pets,
      cliente.familia && "Uso: " + cliente.familia,
      cliente.materiais && "Preferências: " + cliente.materiais,
    ].filter(Boolean).join(" · ");
  }

  function dadosProjeto(ctx, atualizar) {
    const projeto = ctx.dados.projeto;
    const grade = ui.elemento("div", undefined, "formulario-comercial");
    const opcoes = [["", "Selecione um cliente"], ...ctx.dados.clientes.map((c) => [c.id, c.nome])];
    const campoLocal = campo("Local do projeto", projeto, "local", atualizar);
    const campoArea = campo("Área estimada (m²)", projeto, "area", atualizar);
    const boxBriefing = ui.elemento("div", undefined, "resumo-briefing-projeto");
    const atualizarBriefing = () => {
      const cli = ctx.dados.clientes.find((c) => c.id === projeto.cliente);
      const texto = resumoBriefingCliente(cli);
      boxBriefing.textContent = texto ? "Briefing do cliente: " + texto : "";
      boxBriefing.hidden = !texto;
    };
    const seletorCliente = seletor("Cliente", opcoes, projeto.cliente, (idCliente) => {
      if (!ui.editar(projeto, "cliente", atualizar)(idCliente)) return false;
      const cli = ctx.dados.clientes.find((c) => c.id === idCliente);
      if (cli) {
        let alterou = false;
        if (!projeto.local && cli.endereco) {
          projeto.local = cli.endereco;
          const inp = campoLocal.querySelector("input");
          if (inp) inp.value = cli.endereco;
          alterou = true;
        }
        if (!projeto.area && cli.areaTerreno) {
          projeto.area = cli.areaTerreno;
          const inp = campoArea.querySelector("input");
          if (inp) inp.value = cli.areaTerreno;
          alterou = true;
        }
        if (alterou) atualizar();
      }
      atualizarBriefing();
      return true;
    });
    atualizarBriefing();

    const grupos = [
      ["Projeto", [
        rotular("Cliente", seletorCliente),
        campo("Tipo de serviço", projeto, "tipo", atualizar),
        campoLocal,
        campoArea,
        boxBriefing,
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

    const adicionar = ui.botao("Cadastrar cliente", criarNovoCliente);
    const painel = ui.cabecalho("Clientes", "Contatos, dados do terreno e estudo preliminar de cada cliente.", adicionar);

    function exibir(inicio, fim) {
      const vazio = !ctx.dados.clientes.length;
      painel.hidden = vazio;
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
          const infoContato = [
            cliente.tipoImovel,
            cliente.areaTerreno && cliente.areaTerreno + " m²",
            cliente.contato,
            cliente.telefone,
            cliente.email,
          ].filter(Boolean).join(" · ");
          subtextoContato.textContent = infoContato || "Clique para preencher contato e dados do imóvel";
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

        const aoEditarCliente = () => {
          if (!atualizar()) return false;
          atualizarResumo();
          return true;
        };

        /* Nível 1: Contato e dados essenciais do imóvel */
        const grade = ui.elemento("div", undefined, "formulario-comercial");
        const camposEssenciais = [
          ["Nome ou empresa", "nome"],
          ["Pessoa de contato", "contato"],
          ["Telefone", "telefone", "tel"],
          ["E-mail", "email", "email"],
          ["Endereço do terreno / imóvel", "endereco"],
          ["Área a ser trabalhada (m²)", "areaTerreno"],
        ];
        for (const [rotulo, chave, tipo] of camposEssenciais) {
          grade.append(campo(rotulo, cliente, chave, aoEditarCliente, tipo));
        }
        grade.append(
          rotular("Tipo de imóvel", seletor("Tipo de imóvel", tiposImovel, cliente.tipoImovel || "",
            ui.editar(cliente, "tipoImovel", aoEditarCliente))),
          campo("Observações internas", cliente, "notas", aoEditarCliente, "longo"),
        );

        /* Nível 2: Estudo preliminar / Informações avançadas */
        const blocoAvancado = ui.elemento("details", undefined, "subcartao-briefing");
        const resumoAvancado = ui.elemento("summary", "Estudo preliminar e informações avançadas");
        const gradeAvancada = ui.elemento("div", undefined, "formulario-comercial");
        gradeAvancada.append(
          rotular("Situação do local", seletor("Situação do local", situacoesObra, cliente.situacaoObra || "",
            ui.editar(cliente, "situacaoObra", aoEditarCliente))),
          campo("Integrantes da família / usuários", cliente, "familia", aoEditarCliente),
          campo("Possui animais / pets?", cliente, "pets", aoEditarCliente),
          seletorMultiplo("Insolação / luminosidade do ambiente", opcoesInsolacao, cliente, "insolacao", aoEditarCliente),
          seletorMultiplo("Materiais e elementos de preferência", opcoesMateriais, cliente, "materiais", aoEditarCliente),
          campo("Notas técnicas do estudo preliminar", cliente, "briefingNotas", aoEditarCliente, "longo"),
        );
        blocoAvancado.append(resumoAvancado, gradeAvancada);

        const rodapeCliente = ui.elemento("div", undefined, "rodape-registro-exclusao");
        const btnExcluirCli = ui.botao("Excluir cliente", () => {
          if (!window.confirm("Excluir o cliente \"" + (cliente.nome || "Novo cliente") + "\"? As propostas já salvas serão mantidas.")) return;
          const pos = ctx.dados.clientes.indexOf(cliente);
          if (pos < 0) return;
          ctx.dados.clientes.splice(pos, 1);
          if (ctx.dados.projeto.cliente === cliente.id) ctx.dados.projeto.cliente = "";
          ctx.gravar("Cliente excluído.");
          paginas.atualizar(ctx.dados.clientes.length);
        }, true);
        btnExcluirCli.classList.add("btn-remover-contextual");
        rodapeCliente.append(btnExcluirCli);

        detalhes.append(titulo, grade, blocoAvancado, rodapeCliente);
        return detalhes;
      }));
      if (vazio) {
        lista.append(ui.estadoVazio(
          "Clientes",
          "Nenhum cliente cadastrado ainda. Registre contatos, dados do terreno e estudo preliminar para vincular às propostas.",
          ui.botao("Cadastrar cliente", criarNovoCliente),
          "clientes",
        ));
      }
    }
    paginas.atualizar(ctx.dados.clientes.length);
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

        const acoesCard = ui.elemento("div", undefined, "acoes acoes-card-modelo");
        const botaoEditar = ui.botao("Editar", () => editarModelo(modelo, inicio + indice), true);
        const botaoExcluir = ui.botao("Excluir", () => excluirModelo(modelo), true);
        botaoExcluir.classList.add("btn-remover-contextual");
        const botaoAplicar = ui.botao("Aplicar modelo", () => ctx.aplicarModelo(modelo));
        acoesCard.append(botaoAplicar, botaoEditar, botaoExcluir);
        const card = ui.cartao(modelo.nome || "Modelo sem nome", topoCard, resumo, previa, acoesCard);
        return card;
      }));
    }, "Páginas de modelos");
    function excluirModelo(modelo) {
      if (!window.confirm("Excluir o modelo \"" + (modelo.nome || "Modelo sem nome") + "\"?")) return;
      const pos = ctx.dados.modelos.indexOf(modelo);
      if (pos < 0) return;
      ctx.dados.modelos.splice(pos, 1);
      ctx.gravar("Modelo de serviço excluído.");
      exibir(Math.max(0, pos - 1));
    }
    function editarModelo(modelo, indice) {
      const voltar = ui.botao("Voltar aos modelos", () => {
        exibir(indice);
        lista.children[paginas.paginaDe(indice)]?.querySelector("button")?.focus();
      }, true);
      const acoes = ui.elemento("div", undefined, "acoes");
      acoes.append(voltar, ui.botao("Excluir modelo", () => excluirModelo(modelo), true),
        ui.botao("Aplicar ao rascunho", () => ctx.aplicarModelo(modelo)));
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
      if (!ctx.dados.modelos.length) {
        area.replaceChildren(ui.estadoVazio(
          "Modelos de serviço",
          "Nenhum modelo salvo ainda. Crie um modelo a partir do orçamento atual para reutilizar suas etapas.",
          ui.botao("Criar a partir do rascunho", () => criarModeloDoRascunho()),
          "historico",
        ));
        return;
      }
      paginas.mostrar(ctx.dados.modelos.length, indice);
      area.replaceChildren(topo, lista, paginas.controles);
    }
    function criarModeloDoRascunho() {
      const modelo = { nome: ctx.dados.projeto.nome || "Novo modelo",
        etapas: ctx.dados.projeto.etapa.map(([nome, horas]) => [nome, horas]) };
      ctx.dados.modelos.unshift(modelo);
      ctx.gravar("Modelo criado.");
      editarModelo(modelo, 0);
    }
    const criar = ui.botao("Criar a partir do rascunho", criarModeloDoRascunho);
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
    campo("Próxima ação", registro, "acao", atualizar));
    for (const [chave, rotulo] of regras.etapasFluxo) {
      grade.append(campo("Data · " + rotulo, registro.marcos, chave, atualizar, "date"));
    }
    grade.append(campo("Motivo de perda", registro, "motivo", atualizar, "longo"));
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
      return [ui.estadoVazio(
        "Próximos contatos",
        "Nenhum retorno agendado. Informe a data do próximo contato em um orçamento salvo para acompanhar sua agenda comercial.",
        ui.botao("Ver orçamentos salvos", () => ctx.navegar("historico")),
        "retornos",
      )];
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
          const excluirContato = ui.botao("Excluir", () => {
            if (!window.confirm("Remover este contato agendado da agenda?")) return;
            item.acompanhamento.proximo = "";
            item.acompanhamento.acao = "";
            ctx.gravar("Contato removido da agenda.");
            pendentes = obterPendentes();
            if (!pendentes.length) ctx.navegar("retornos");
            else paginas.atualizar(pendentes.length);
          }, true);
          excluirContato.classList.add("btn-remover-contextual");
          acoesItem.append(reagendar, excluirContato, ui.botao("Abrir", () => ctx.abrir(indice), true));
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
