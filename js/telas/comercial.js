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
    entrada.setAttribute("aria-label", rotulo);
    entrada.addEventListener("input", () => {
      if (entrada.validity?.valid !== false) ui.editar(objeto, chave, atualizar)(entrada.value);
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
      grade.classList?.remove("aba-comercial-entrando");
      void grade.offsetWidth;
      grade.replaceChildren(...grupos[indice][1]);
      grade.classList?.add("aba-comercial-entrando");
    }
    seletorGrupo.append(...botoes);
    const painel = ui.elemento("div", undefined, "pilha");
    painel.append(seletorGrupo, grade);
    exibir(0);
    return painel;
  }

  function clientes(ctx) {
    const pagina = ui.elemento("div", undefined, "gestao-pagina clientes-pagina");
    const normalizar = (t) => String(t || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    function propostasDoCliente(cliente) {
      const mapa = new Map();
      ctx.dados.salvos.forEach((item, indice) => {
        if (item.projeto.cliente !== cliente.id) return;
        const chave = regras.chaveProjeto(item.projeto);
        const atual = mapa.get(chave);
        if (!atual || String(item.data) > String(atual.item.data)) {
          mapa.set(chave, { item, indice });
        }
      });
      return [...mapa.values()];
    }

    function excluirCliente(cliente) {
      if (!window.confirm("Excluir o cliente \"" + (cliente.nome || "sem nome") + "\"? As propostas já salvas serão mantidas.")) return;
      const pos = ctx.dados.clientes.indexOf(cliente);
      if (pos < 0) return;
      ctx.dados.clientes.splice(pos, 1);
      if (ctx.dados.projeto.cliente === cliente.id) ctx.dados.projeto.cliente = "";
      ctx.gravar("Cliente excluído.");
      renderizar();
    }

    function abrirModalCliente(clienteExistente, ancora, abaInicial = "pessoais") {
      const novo = !clienteExistente;
      const rascunho = novo
        ? { ...Object.fromEntries(regras.camposCliente.map((c) => [c, ""])), id: regras.id() }
        : structuredClone(clienteExistente);
      const snapshot = JSON.stringify(rascunho);
      let abaAtiva = abaInicial;
      const noop = () => true;

      ui.abrirModalContextual({
        titulo: novo ? "Novo cliente" : (rascunho.nome || "Editar cliente"),
        subtitulo: novo ? "Cadastro na carteira comercial" : (rascunho.tipoImovel || "Carteira de clientes"),
        tamanho: "padrao",
        origemEl: ancora,
        modo: "edicao",
        textoConfirmar: "Salvar",
        estaAlterado: () => JSON.stringify(rascunho) !== snapshot,
        aoConfirmar: () => {
          if (novo) {
            ctx.dados.clientes.unshift(rascunho);
            ctx.gravar("Cliente cadastrado.");
          } else {
            Object.assign(clienteExistente, rascunho);
            for (const s of ctx.dados.salvos) {
              if (s.projeto.cliente === clienteExistente.id) s.clienteNome = clienteExistente.nome;
            }
            ctx.gravar("Dados do cliente atualizados.");
          }
          renderizar();
        },
        montar: ({ adicionarAcaoEsquerda, definirConfirmarDesabilitado, atualizarTitulo }) => {
          const wrap = ui.elemento("div", undefined, "cliente-modal-corpo");
          const barraAbas = ui.elemento("div", undefined, "flora-tabs");
          barraAbas.setAttribute("role", "tablist");
          const painelAba = ui.elemento("div", undefined, "cliente-modal-aba");
          const erroNome = ui.elemento("small", "Informe o nome do cliente para salvar.", "cliente-modal-erro");
          erroNome.hidden = Boolean(rascunho.nome.trim());

          const validar = () => {
            const ok = Boolean(rascunho.nome.trim());
            erroNome.hidden = ok;
            definirConfirmarDesabilitado(!ok);
          };

          const campoLocal = (rot, chave, tipo = "text") => {
            const c = campo(rot, rascunho, chave, () => {
              if (chave === "nome") {
                atualizarTitulo(rascunho.nome.trim() || (novo ? "Novo cliente" : "Editar cliente"), rascunho.tipoImovel || "Carteira de clientes");
                validar();
              }
              return true;
            }, tipo);
            return c;
          };

          const abas = [
            {
              id: "pessoais",
              rotulo: "Dados pessoais",
              render: () => {
                const grade = ui.elemento("div", undefined, "formulario-comercial");
                const cNome = campoLocal("Nome ou empresa *", "nome");
                cNome.classList.add("campo-completo");
                grade.append(
                  cNome,
                  campoLocal("Pessoa de contato", "contato"),
                  campoLocal("Telefone", "telefone", "tel"),
                  campoLocal("E-mail", "email", "email"),
                );
                return grade;
              },
            },
            {
              id: "imovel",
              rotulo: "Imóvel e terreno",
              render: () => {
                const grade = ui.elemento("div", undefined, "formulario-comercial");
                const cEnd = campoLocal("Endereço do terreno / imóvel", "endereco");
                cEnd.classList.add("campo-completo");
                grade.append(
                  cEnd,
                  campoLocal("Área a ser trabalhada (m²)", "areaTerreno"),
                  rotular("Tipo de imóvel", seletor("Tipo de imóvel", tiposImovel, rascunho.tipoImovel || "", (v) => {
                    rascunho.tipoImovel = v;
                    atualizarTitulo(rascunho.nome.trim() || "Editar cliente", v || "Carteira de clientes");
                    return true;
                  })),
                  rotular("Situação do local", seletor("Situação do local", situacoesObra, rascunho.situacaoObra || "", (v) => {
                    rascunho.situacaoObra = v;
                    return true;
                  })),
                );
                return grade;
              },
            },
            {
              id: "briefing",
              rotulo: "Estudo preliminar",
              render: () => {
                const grade = ui.elemento("div", undefined, "formulario-comercial");
                grade.append(
                  campoLocal("Integrantes da família / usuários", "familia"),
                  campoLocal("Possui animais / pets?", "pets"),
                  seletorMultiplo("Insolação / luminosidade", opcoesInsolacao, rascunho, "insolacao", noop),
                  seletorMultiplo("Materiais e elementos de preferência", opcoesMateriais, rascunho, "materiais", noop),
                  campoLocal("Notas técnicas do estudo preliminar", "briefingNotas", "longo"),
                );
                return grade;
              },
            },
            {
              id: "propostas",
              rotulo: "Projetos e propostas",
              render: () => {
                const lista = propostasDoCliente(rascunho);
                if (!lista.length) {
                  return ui.estadoVazioBotanico({
                    variante: "documentos",
                    estado: "vazio",
                    titulo: "Nenhuma proposta vinculada",
                    descricao: "Os orçamentos salvos para este cliente aparecerão aqui.",
                  });
                }
                const ul = ui.elemento("div", undefined, "pilha");
                for (const { item, indice } of lista) {
                  const calc = Paisagismo.calcular(item.projeto, item.hora);
                  const row = ui.elemento("div", undefined, "linha cliente-modal-item");
                  const info = ui.elemento("div");
                  info.append(
                    ui.elemento("strong", item.projeto.nome || "Orçamento"),
                    ui.elemento("small", ui.brl(calc.preco) + " · " + item.acompanhamento.situacao, "cliente-modal-sub"),
                  );
                  const btn = ui.botao("Abrir", () => ctx.abrir(indice), true);
                  row.append(info, btn);
                  ul.append(row);
                }
                return ul;
              },
            },
            {
              id: "contatos",
              rotulo: "Histórico de contatos",
              render: () => {
                const registros = ctx.dados.salvos
                  .filter((s) => s.projeto.cliente === rascunho.id && (s.acompanhamento.ultimo || s.acompanhamento.proximo || s.acompanhamento.acao))
                  .sort((a, b) => String(b.data).localeCompare(String(a.data)));
                if (!registros.length) {
                  return ui.estadoVazioBotanico({
                    variante: "calendario",
                    estado: "vazio",
                    titulo: "Nenhum registro de contato",
                    descricao: "As datas e retornos comerciais registrados nos orçamentos aparecerão aqui.",
                  });
                }
                const ul = ui.elemento("div", undefined, "pilha");
                for (const item of registros) {
                  const row = ui.elemento("div", undefined, "linha cliente-modal-item");
                  const info = ui.elemento("div");
                  const resumo = [
                    item.acompanhamento.ultimo && "Último: " + regras.formatarData(item.acompanhamento.ultimo),
                    item.acompanhamento.proximo && "Próximo: " + regras.formatarData(item.acompanhamento.proximo),
                    item.acompanhamento.acao,
                  ].filter(Boolean).join(" · ");
                  info.append(ui.elemento("strong", item.projeto.nome || "Orçamento"), ui.elemento("small", resumo, "cliente-modal-sub"));
                  row.append(info);
                  ul.append(row);
                }
                return ul;
              },
            },
            {
              id: "observacoes",
              rotulo: "Observações",
              render: () => {
                const grade = ui.elemento("div", undefined, "formulario-comercial");
                const cNotas = campoLocal("Observações internas", "notas", "longo");
                cNotas.classList.add("campo-completo");
                grade.append(cNotas);
                return grade;
              },
            },
          ];

          const botoesAbas = abas.map((aba) => {
            const b = ui.elemento("button", aba.rotulo, "flora-tab-btn");
            b.type = "button";
            b.setAttribute("role", "tab");
            b.addEventListener("click", () => {
              abaAtiva = aba.id;
              atualizarAba();
            });
            return b;
          });
          barraAbas.append(...botoesAbas);

          function atualizarAba() {
            abas.forEach((aba, idx) => {
              const ativo = aba.id === abaAtiva;
              botoesAbas[idx].setAttribute("aria-selected", String(ativo));
              if (ativo) painelAba.replaceChildren(aba.render());
            });
          }

          if (!novo) {
            const btnEx = ui.botao("Excluir cliente", () => {
              if (!window.confirm("Excluir o cliente \"" + (clienteExistente.nome || "sem nome") + "\"?")) return;
              const pos = ctx.dados.clientes.indexOf(clienteExistente);
              if (pos >= 0) ctx.dados.clientes.splice(pos, 1);
              if (ctx.dados.projeto.cliente === clienteExistente.id) ctx.dados.projeto.cliente = "";
              ctx.gravar("Cliente excluído.");
              document.querySelector(".flora-ct-dialog")?.close?.();
              document.querySelector(".flora-ct-dialog")?.remove?.();
              renderizar();
            }, true);
            btnEx.classList.add("flora-ct-btn-remover");
            adicionarAcaoEsquerda(btnEx);
          }

          validar();
          atualizarAba();
          wrap.append(barraAbas, erroNome, painelAba);
          return wrap;
        },
      });
    }

    let modoLista = false;
    let termoBusca = "";
    const btnNovo = ui.botao("Cadastrar cliente", (e) => abrirModalCliente(null, e?.currentTarget));
    btnNovo.classList.add("orcamento-salvar-destaque");

    function renderizar() {
      const header = ui.cabecalhoBotanico({
        titulo: "Clientes",
        indicadores: [
          { rotulo: "Clientes cadastrados", valor: String(ctx.dados.clientes.length) },
        ],
        acoes: [btnNovo],
      });

      if (!ctx.dados.clientes.length) {
        const vazio = ui.estadoVazioBotanico({
          variante: "clientes",
          estado: "vazio",
          titulo: "Nenhum cliente cadastrado",
          descricao: "Cadastre clientes para vincular contatos, dados do terreno e estudo preliminar às propostas.",
          acaoPrincipal: ui.botao("Cadastrar cliente", (e) => abrirModalCliente(null, e?.currentTarget)),
        });
        pagina.replaceChildren(header, vazio);
        return;
      }

      const barra = ui.elemento("div", undefined, "gestao-barra-filtros");
      const buscaWrap = ui.elemento("div", undefined, "gestao-busca-wrap");
      const buscaInput = ui.elemento("input", undefined, "gestao-busca-input");
      buscaInput.type = "search";
      buscaInput.value = termoBusca;
      buscaInput.placeholder = "Buscar por nome, contato ou projeto...";
      buscaInput.setAttribute("aria-label", "Buscar clientes");
      buscaWrap.append(buscaInput);

      const modoWrap = ui.elemento("div", undefined, "gestao-filtros-grupo");
      if (ctx.dados.clientes.length >= 6) {
        const btnGrade = ui.elemento("button", "Cards", "gestao-filtro-pill");
        btnGrade.type = "button";
        btnGrade.setAttribute("aria-pressed", String(!modoLista));
        const btnTabela = ui.elemento("button", "Lista", "gestao-filtro-pill");
        btnTabela.type = "button";
        btnTabela.setAttribute("aria-pressed", String(modoLista));
        btnGrade.addEventListener("click", () => { modoLista = false; renderizar(); });
        btnTabela.addEventListener("click", () => { modoLista = true; renderizar(); });
        modoWrap.append(btnGrade, btnTabela);
      }
      barra.append(buscaWrap, modoWrap);

      const areaLista = ui.elemento("div");
      const atualizarLista = () => {
        const termo = normalizar(termoBusca.trim());
        const filtrados = ctx.dados.clientes.filter((cli) => {
          if (!termo) return true;
          const projs = propostasDoCliente(cli).map(({ item }) => item.projeto.nome).join(" ");
          return normalizar([cli.nome, cli.contato, cli.telefone, cli.email, projs].filter(Boolean).join(" ")).includes(termo);
        });

        if (!filtrados.length) {
          areaLista.replaceChildren(ui.estadoVazioBotanico({
            variante: "clientes",
            estado: "busca",
            titulo: "Nenhum cliente encontrado",
            descricao: "Tente outro nome, telefone, e-mail ou projeto.",
            acaoPrincipal: ui.botao("Limpar busca", () => {
              termoBusca = "";
              buscaInput.value = "";
              atualizarLista();
            }, true),
          }));
          return;
        }

        const grid = ui.elemento("div", undefined, modoLista ? "clientes-lista-compacta" : "clientes-grid");
        grid.replaceChildren(...filtrados.map((cliente) => {
          const props = propostasDoCliente(cliente);
          const valorTotal = props.reduce((s, { item }) => s + Paisagismo.calcular(item.projeto, item.hora).preco, 0);
          const card = ui.elemento("article", undefined, "cartao cliente-card");

          const topo = ui.elemento("div", undefined, "cliente-card-topo");
          const idWrap = ui.elemento("div", undefined, "cliente-card-id");
          const avatar = ui.elemento("span", iniciaisNome(cliente.nome), "avatar-cliente");
          avatar.setAttribute("aria-hidden", "true");
          const titulos = ui.elemento("div", undefined, "cliente-card-titulos");
          titulos.append(ui.elemento("h2", cliente.nome || "Cliente sem nome", "cliente-card-nome"));
          const subProjeto = props[0]?.item?.projeto?.nome || cliente.tipoImovel || "";
          if (subProjeto) titulos.append(ui.elemento("small", subProjeto, "cliente-card-sub"));
          idWrap.append(avatar, titulos);

          const menu = ui.menuContextual({
            rotulo: "Ações para " + (cliente.nome || "cliente"),
            itens: [
              { rotulo: "Editar cadastro", acao: () => abrirModalCliente(cliente, card) },
              {
                rotulo: "Novo orçamento",
                acao: () => {
                  ctx.dados.projeto.cliente = cliente.id;
                  if (cliente.endereco && !ctx.dados.projeto.local) ctx.dados.projeto.local = cliente.endereco;
                  ctx.gravar("Cliente vinculado ao rascunho.");
                  ctx.navegar("orcamento");
                },
              },
              { rotulo: "Excluir", perigo: true, acao: () => excluirCliente(cliente) },
            ],
          });
          topo.append(idWrap, menu);

          const meta = ui.elemento("div", undefined, "cliente-card-meta");
          const contatoTexto = [cliente.telefone, cliente.email].filter(Boolean).join(" · ");
          if (contatoTexto) meta.append(ui.elemento("p", contatoTexto, "cliente-card-contato"));
          if (props.length) {
            meta.append(ui.elemento("p",
              props.length + (props.length === 1 ? " proposta" : " propostas") + " · " + ui.brl(valorTotal),
              "cliente-card-propostas"));
          }

          const rodape = ui.elemento("div", undefined, "cliente-card-rodape");
          const btnVer = ui.botao("Ver cliente", (e) => abrirModalCliente(cliente, e?.currentTarget), true);
          rodape.append(btnVer);

          card.append(topo, meta, rodape);
          return card;
        }));
        areaLista.replaceChildren(grid);
      };

      buscaInput.addEventListener("input", () => {
        termoBusca = buscaInput.value;
        atualizarLista();
      });

      atualizarLista();
      pagina.replaceChildren(header, barra, areaLista);
    }

    renderizar();
    return [pagina];
  }

  function modelos(ctx) {
    const pagina = ui.elemento("div", undefined, "gestao-pagina modelos-pagina");
    const SVG_NS = "http://www.w3.org/2000/svg";

    const fasesModelo = [
      { nome: "Levantamento", cor: "#1e4a38" },
      { nome: "Pré-projeto", cor: "#4d7852" },
      { nome: "Executivo & 3D", cor: "#5a7566" },
      { nome: "Finalização", cor: "#a8833e" },
    ];

    function faseAtividade(nome) {
      const t = String(nome || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
      if (/fechamento|briefing|referencia|campo|levantamento|visita/.test(t)) return "Levantamento";
      if (/pre-projeto|pre-executivo|conceito|estudo/.test(t)) return "Pré-projeto";
      if (/polimento|detalhamento|entrega|revisao|orientac|final/.test(t)) return "Finalização";
      if (/modelagem|3d|executivo|render/.test(t)) return "Executivo & 3D";
      return "Outras atividades";
    }

    function categoriaModelo(nome) {
      const t = String(nome || "").toLowerCase();
      if (t.includes("consultoria")) return "consultoria";
      if (t.includes("3d") || t.includes("modelagem")) return "modelagem3d";
      if (t.includes("executivo")) return "executivo";
      return "personalizado";
    }

    function ilustrarTipoModelo(nome) {
      const tipo = categoriaModelo(nome);
      if (typeof document.createElementNS !== "function") return ui.elemento("span", undefined, "modelo-icone-svg");
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 36 36");
      svg.setAttribute("fill", "none");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("class", "modelo-icone-svg");
      const s = { stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" };
      const add = (tag, attrs) => {
        const el = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        svg.append(el);
      };
      if (tipo === "consultoria") {
        add("circle", { ...s, cx: "18", cy: "16", r: "9" });
        add("path", { ...s, d: "M15 28h6M18 11v6M15 15l3 2 4-3" });
      } else if (tipo === "modelagem3d") {
        add("path", { ...s, d: "M18 6 L29 12 L18 18 L7 12 Z" });
        add("path", { ...s, d: "M7 12 V24 L18 30 V18 M29 12 V24 L18 30" });
      } else if (tipo === "executivo") {
        add("rect", { ...s, x: "7", y: "7", width: "22", height: "22", rx: "3" });
        add("path", { ...s, d: "M12 14h12M12 19h8M12 24h5" });
      } else {
        add("path", { ...s, d: "M18 29V11" });
        add("path", { ...s, d: "M18 21C12 20 9 15 11 10c5 1 7 5 7 11Z" });
        add("path", { ...s, d: "M18 16c6-1 9-6 7-11-5 1-7 5-7 11Z" });
      }
      return svg;
    }

    function excluirModelo(modelo, voltarLista = false) {
      if (!window.confirm("Excluir o modelo \"" + (modelo.nome || "Modelo sem nome") + "\"?")) return;
      const pos = ctx.dados.modelos.indexOf(modelo);
      if (pos < 0) return;
      ctx.dados.modelos.splice(pos, 1);
      ctx.gravar("Modelo de serviço excluído.");
      if (voltarLista || !ctx.dados.modelos.length) exibirBiblioteca();
      else exibirBiblioteca();
    }

    function duplicarModelo(modelo) {
      const copia = {
        nome: (modelo.nome || "Modelo") + " (cópia)",
        etapas: modelo.etapas.map(([n, h]) => [n, h]),
      };
      ctx.dados.modelos.unshift(copia);
      ctx.gravar("Modelo duplicado.");
      exibirBiblioteca();
    }

    function criarNovoModelo(doRascunho = false) {
      const modelo = doRascunho
        ? {
          nome: ctx.dados.projeto.nome || "Modelo do rascunho",
          etapas: ctx.dados.projeto.etapa.map(([nome, horas]) => [nome, horas]),
        }
        : {
          nome: "Novo modelo de serviço",
          etapas: [["Briefing e levantamento", 4], ["Estudo preliminar", 8], ["Entrega final", 4]],
        };
      ctx.dados.modelos.unshift(modelo);
      ctx.gravar("Modelo criado.");
      editarModelo(modelo);
    }

    function editarModelo(modeloOriginal) {
      const rascunho = {
        nome: modeloOriginal.nome || "",
        etapas: modeloOriginal.etapas.map(([n, h]) => [n, Number(h) || 0]),
      };
      let snapshotSalvo = JSON.stringify(rascunho);
      const alterado = () => JSON.stringify(rascunho) !== snapshotSalvo;

      function voltarParaBiblioteca() {
        if (alterado() && !window.confirm("Há alterações não salvas neste modelo. Descartar e voltar?")) return;
        exibirBiblioteca();
      }

      function salvarModelo() {
        modeloOriginal.nome = rascunho.nome.trim() || "Modelo sem nome";
        modeloOriginal.etapas = rascunho.etapas.map(([n, h]) => [String(n || "Atividade"), Math.max(0, Number(h) || 0)]);
        snapshotSalvo = JSON.stringify({ nome: modeloOriginal.nome, etapas: modeloOriginal.etapas });
        ctx.gravar("Modelo de serviço salvo.");
        atualizarCabecalhoEditor();
      }

      function abrirModalAtividade(indiceEtapa, ancora) {
        const atual = rascunho.etapas[indiceEtapa];
        if (!atual) return;
        let nomeEd = atual[0] || "";
        let horasEd = Number(atual[1]) || 0;

        ui.abrirModalContextual({
          titulo: "Detalhes da atividade",
          subtitulo: faseAtividade(nomeEd),
          tamanho: "compacto",
          origemEl: ancora,
          modo: "edicao",
          textoConfirmar: "Aplicar",
          estaAlterado: () => nomeEd !== atual[0] || horasEd !== atual[1],
          aoConfirmar: () => {
            rascunho.etapas[indiceEtapa][0] = nomeEd.trim() || "Atividade";
            rascunho.etapas[indiceEtapa][1] = Math.max(0, Number(horasEd) || 0);
            renderizarGrupos();
            atualizarCabecalhoEditor();
          },
          montar: ({ adicionarAcaoEsquerda }) => {
            const grade = ui.elemento("div", undefined, "formulario-comercial");
            const inpNome = ui.elemento("input");
            inpNome.type = "text";
            inpNome.value = nomeEd;
            inpNome.setAttribute("aria-label", "Nome da atividade");
            inpNome.addEventListener("input", () => { nomeEd = inpNome.value; });
            const cNome = rotular("Nome da atividade", inpNome);
            cNome.classList.add("campo-completo");

            const inpHoras = ui.elemento("input");
            inpHoras.type = "text";
            inpHoras.inputMode = "decimal";
            inpHoras.value = String(horasEd).replace(".", ",");
            inpHoras.setAttribute("aria-label", "Duração em horas");
            inpHoras.addEventListener("input", () => {
              const p = Number(String(inpHoras.value).replace(",", ".").replace(/[^\d.]/g, ""));
              if (Number.isFinite(p) && p >= 0) {
                inpHoras.classList.remove("campo-invalido");
                horasEd = p;
              } else {
                inpHoras.classList.add("campo-invalido");
              }
            });
            grade.append(cNome, rotular("Duração (horas)", inpHoras));

            const btnEx = ui.botao("Excluir atividade", () => {
              rascunho.etapas.splice(indiceEtapa, 1);
              document.querySelector(".flora-ct-dialog")?.close?.();
              document.querySelector(".flora-ct-dialog")?.remove?.();
              renderizarGrupos();
              atualizarCabecalhoEditor();
            }, true);
            btnEx.classList.add("flora-ct-btn-remover");
            adicionarAcaoEsquerda(btnEx);
            return grade;
          },
        });
      }

      const btnVoltar = ui.elemento("button", "← Modelos", "gestao-hero-voltar");
      btnVoltar.type = "button";
      btnVoltar.addEventListener("click", voltarParaBiblioteca);

      const btnAplicar = ui.botao("Aplicar ao rascunho", () => {
        ctx.aplicarModelo({
          nome: rascunho.nome || "Modelo",
          etapas: rascunho.etapas.map(([n, h]) => [n, h]),
        });
      }, true);
      const btnSalvar = ui.botao("Salvar modelo", salvarModelo);
      btnSalvar.classList.add("orcamento-salvar-destaque");
      const menuSec = ui.menuContextual({
        rotulo: "Mais opções do modelo",
        itens: [
          { rotulo: "Duplicar modelo", acao: () => duplicarModelo(rascunho) },
          { rotulo: "Excluir modelo", perigo: true, acao: () => excluirModelo(modeloOriginal, true) },
        ],
      });

      const headerWrap = ui.elemento("div");
      function atualizarCabecalhoEditor() {
        const horasTot = Paisagismo.horasProjeto(rascunho.etapas);
        const h = ui.cabecalhoBotanico({
          titulo: rascunho.nome.trim() || "Modelo sem nome",
          destaque: alterado() ? "· Alterações não salvas" : "· Salvo",
          navegacaoTopo: btnVoltar,
          indicadores: [
            { rotulo: "Duração total estimada", valor: ui.numero(horasTot) + " h" },
            { rotulo: "Atividades", valor: String(rascunho.etapas.length) },
          ],
          acoes: [btnAplicar, btnSalvar, menuSec],
        });
        headerWrap.replaceChildren(h);
      }

      const cardId = ui.elemento("section", undefined, "cartao modelo-editor-id");
      const inpNomeModelo = ui.elemento("input", undefined, "modelo-nome-input");
      inpNomeModelo.type = "text";
      inpNomeModelo.value = rascunho.nome;
      inpNomeModelo.setAttribute("aria-label", "Nome do modelo");
      inpNomeModelo.addEventListener("input", () => {
        rascunho.nome = inpNomeModelo.value;
        atualizarCabecalhoEditor();
      });
      const barraNova = ui.elemento("div", undefined, "modelo-editor-topo-id");
      const btnAddEtapa = ui.botao("+ Adicionar atividade", () => {
        rascunho.etapas.push(["Nova atividade", 2]);
        renderizarGrupos();
        atualizarCabecalhoEditor();
      }, true);
      barraNova.append(rotular("Nome do modelo", inpNomeModelo), btnAddEtapa);
      cardId.append(barraNova);

      const gruposWrap = ui.elemento("div", undefined, "modelo-grupos-wrap");

      function renderizarGrupos() {
        const horasTotais = Math.max(0.01, Paisagismo.horasProjeto(rascunho.etapas));
        const mapa = new Map([
          ["Levantamento", { nome: "Levantamento", cor: "#1e4a38", itens: [] }],
          ["Pré-projeto", { nome: "Pré-projeto", cor: "#4d7852", itens: [] }],
          ["Executivo & 3D", { nome: "Executivo & 3D", cor: "#5a7566", itens: [] }],
          ["Finalização", { nome: "Finalização", cor: "#a8833e", itens: [] }],
          ["Outras atividades", { nome: "Outras atividades", cor: "#6c796e", itens: [] }],
        ]);
        rascunho.etapas.forEach((etapa, indice) => {
          const f = faseAtividade(etapa[0]);
          mapa.get(f).itens.push({ etapa, indice });
        });

        const gruposVisiveis = [...mapa.values()].filter((g) => g.itens.length > 0);
        if (!gruposVisiveis.length) {
          gruposWrap.replaceChildren(ui.estadoVazioBotanico({
            variante: "modelos",
            estado: "vazio",
            titulo: "Nenhuma atividade neste modelo",
            descricao: "Adicione atividades para compor a estimativa de horas.",
            acaoPrincipal: ui.botao("+ Adicionar atividade", () => {
              rascunho.etapas.push(["Nova atividade", 2]);
              renderizarGrupos();
              atualizarCabecalhoEditor();
            }),
          }));
          return;
        }

        gruposWrap.replaceChildren(...gruposVisiveis.map((grupo) => {
          const cardGrupo = ui.elemento("section", undefined, "cartao modelo-fase-card");
          cardGrupo.setAttribute("style", "--cor-fase:" + grupo.cor);
          const horasGrupo = grupo.itens.reduce((s, { etapa }) => s + (Number(etapa[1]) || 0), 0);
          const pctGrupo = Math.round((horasGrupo / horasTotais) * 100);

          const topoGrupo = ui.elemento("div", undefined, "modelo-fase-topo");
          const titGrupo = ui.elemento("div", undefined, "modelo-fase-tit");
          const ponto = ui.elemento("i", undefined, "ranking-fase-ponto");
          ponto.setAttribute("style", "background:" + grupo.cor);
          titGrupo.append(ponto, ui.elemento("h2", grupo.nome));
          const resumoGrupo = ui.elemento("span",
            grupo.itens.length + (grupo.itens.length === 1 ? " atividade" : " atividades")
              + " · " + ui.numero(horasGrupo) + " h (" + pctGrupo + "%)",
            "modelo-fase-resumo");
          topoGrupo.append(titGrupo, resumoGrupo);

          const listaGrupo = ui.elemento("div", undefined, "modelo-etapas-lista");
          for (const { etapa, indice } of grupo.itens) {
            const linha = ui.elemento("div", undefined, "modelo-etapa-linha");
            const inpNome = ui.elemento("input", undefined, "modelo-etapa-nome");
            inpNome.type = "text";
            inpNome.value = etapa[0] || "";
            inpNome.setAttribute("aria-label", "Nome da atividade " + (indice + 1));
            inpNome.addEventListener("input", () => {
              etapa[0] = inpNome.value;
              atualizarCabecalhoEditor();
            });

            const horasWrap = ui.elemento("div", undefined, "modelo-etapa-horas-wrap");
            const inpHoras = ui.elemento("input", undefined, "modelo-etapa-horas");
            inpHoras.type = "text";
            inpHoras.inputMode = "decimal";
            inpHoras.value = String(etapa[1] ?? 0).replace(".", ",");
            inpHoras.setAttribute("aria-label", "Horas de " + (etapa[0] || "atividade"));
            inpHoras.addEventListener("input", () => {
              const p = Number(String(inpHoras.value).replace(",", ".").replace(/[^\d.]/g, ""));
              if (Number.isFinite(p) && p >= 0) {
                inpHoras.classList.remove("campo-invalido");
                etapa[1] = p;
                const novaSoma = grupo.itens.reduce((s, x) => s + (Number(x.etapa[1]) || 0), 0);
                const novoTot = Math.max(0.01, Paisagismo.horasProjeto(rascunho.etapas));
                resumoGrupo.textContent = grupo.itens.length + (grupo.itens.length === 1 ? " atividade" : " atividades")
                  + " · " + ui.numero(novaSoma) + " h (" + Math.round((novaSoma / novoTot) * 100) + "%)";
                atualizarCabecalhoEditor();
              } else {
                inpHoras.classList.add("campo-invalido");
              }
            });
            horasWrap.append(inpHoras, ui.elemento("span", "h"));

            const ctrl = ui.elemento("div", undefined, "modelo-etapa-controles");
            const btnSubir = ui.elemento("button", "↑", "modelo-etapa-mover");
            btnSubir.type = "button";
            btnSubir.title = "Mover para cima";
            btnSubir.setAttribute("aria-label", "Mover atividade para cima");
            btnSubir.disabled = indice === 0;
            btnSubir.addEventListener("click", () => {
              if (indice <= 0) return;
              [rascunho.etapas[indice - 1], rascunho.etapas[indice]] = [rascunho.etapas[indice], rascunho.etapas[indice - 1]];
              renderizarGrupos();
              atualizarCabecalhoEditor();
            });

            const btnDescer = ui.elemento("button", "↓", "modelo-etapa-mover");
            btnDescer.type = "button";
            btnDescer.title = "Mover para baixo";
            btnDescer.setAttribute("aria-label", "Mover atividade para baixo");
            btnDescer.disabled = indice >= rascunho.etapas.length - 1;
            btnDescer.addEventListener("click", () => {
              if (indice >= rascunho.etapas.length - 1) return;
              [rascunho.etapas[indice + 1], rascunho.etapas[indice]] = [rascunho.etapas[indice], rascunho.etapas[indice + 1]];
              renderizarGrupos();
              atualizarCabecalhoEditor();
            });

            const btnDet = ui.elemento("button", "Detalhes", "etapas-modal-link-btn");
            btnDet.type = "button";
            btnDet.addEventListener("click", () => abrirModalAtividade(indice, btnDet));

            const btnEx = ui.elemento("button", "×", "despesa-remover-btn");
            btnEx.type = "button";
            btnEx.title = "Remover atividade";
            btnEx.setAttribute("aria-label", "Remover " + (etapa[0] || "atividade"));
            btnEx.addEventListener("click", () => {
              rascunho.etapas.splice(indice, 1);
              renderizarGrupos();
              atualizarCabecalhoEditor();
            });

            ctrl.append(btnSubir, btnDescer, btnDet, btnEx);
            linha.append(inpNome, horasWrap, ctrl);
            listaGrupo.append(linha);
          }

          cardGrupo.append(topoGrupo, listaGrupo);
          return cardGrupo;
        }));
      }

      atualizarCabecalhoEditor();
      renderizarGrupos();
      pagina.replaceChildren(headerWrap, cardId, gruposWrap);
      btnVoltar.focus?.();
    }

    function exibirBiblioteca() {
      const btnDoRascunho = ui.botao("Criar a partir do rascunho", () => criarNovoModelo(true), true);
      const btnCriar = ui.botao("Criar modelo", () => criarNovoModelo(false));
      btnCriar.classList.add("orcamento-salvar-destaque");

      const header = ui.cabecalhoBotanico({
        titulo: "Modelos de serviço",
        indicadores: [
          { rotulo: "Modelos disponíveis", valor: String(ctx.dados.modelos.length) },
          { rotulo: "Horas no rascunho", valor: ui.numero(Paisagismo.horasProjeto(ctx.dados.projeto.etapa)) + " h" },
        ],
        acoes: [btnDoRascunho, btnCriar],
      });

      if (!ctx.dados.modelos.length) {
        const vazio = ui.estadoVazioBotanico({
          variante: "modelos",
          estado: "vazio",
          titulo: "Nenhum modelo de serviço",
          descricao: "Crie um modelo reutilizável ou salve as etapas do orçamento atual.",
          acaoPrincipal: ui.botao("Criar a partir do rascunho", () => criarNovoModelo(true)),
          acaoSecundaria: ui.botao("Criar modelo em branco", () => criarNovoModelo(false), true),
        });
        pagina.replaceChildren(header, vazio);
        return;
      }

      const grid = ui.elemento("div", undefined, "modelos-grid");
      grid.replaceChildren(...ctx.dados.modelos.map((modelo) => {
        const horasTotais = Paisagismo.horasProjeto(modelo.etapas);
        const card = ui.elemento("article", undefined, "cartao modelo-card");

        const topo = ui.elemento("div", undefined, "modelo-card-topo");
        const idWrap = ui.elemento("div", undefined, "modelo-card-id");
        const iconeWrap = ui.elemento("span", undefined, "modelo-card-icone");
        iconeWrap.append(ilustrarTipoModelo(modelo.nome));
        idWrap.append(iconeWrap, ui.elemento("h2", modelo.nome || "Modelo sem nome", "modelo-card-nome"));

        const menu = ui.menuContextual({
          rotulo: "Ações para " + (modelo.nome || "modelo"),
          itens: [
            { rotulo: "Duplicar modelo", acao: () => duplicarModelo(modelo) },
            { rotulo: "Excluir modelo", perigo: true, acao: () => excluirModelo(modelo) },
          ],
        });
        topo.append(idWrap, menu);

        const metricas = ui.elemento("div", undefined, "modelo-card-metricas");
        metricas.append(
          ui.elemento("strong", ui.numero(horasTotais) + " h", "modelo-card-horas"),
          ui.elemento("span", modelo.etapas.length + (modelo.etapas.length === 1 ? " atividade" : " atividades"), "modelo-card-qtd"),
        );

        /* Distribuição visual das horas por fase */
        const somaFases = new Map(fasesModelo.map((f) => [f.nome, 0]));
        let classificadas = 0;
        for (const [nomeEtapa, hEtapa] of modelo.etapas) {
          const f = faseAtividade(nomeEtapa);
          if (somaFases.has(f)) {
            const h = Number(hEtapa) || 0;
            somaFases.set(f, somaFases.get(f) + h);
            classificadas += h;
          }
        }
        const barraFases = ui.elemento("div", undefined, "modelo-card-barra");
        if (classificadas > 0) {
          for (const f of fasesModelo) {
            const v = somaFases.get(f.nome) || 0;
            if (v <= 0) continue;
            const seg = ui.elemento("span", undefined, "modelo-card-seg");
            seg.title = f.nome + ": " + ui.numero(v) + " h";
            seg.setAttribute("style", "width:" + ((v / classificadas) * 100).toFixed(1) + "%;background:" + f.cor);
            barraFases.append(seg);
          }
        }

        const acoes = ui.elemento("div", undefined, "modelo-card-acoes");
        const btnEditar = ui.botao("Editar", () => editarModelo(modelo), true);
        const btnAplicar = ui.botao("Aplicar modelo", () => ctx.aplicarModelo(modelo));
        acoes.append(btnEditar, btnAplicar);

        card.append(topo, metricas, barraFases, acoes);
        return card;
      }));

      pagina.replaceChildren(header, grid);
    }

    exibirBiblioteca();
    return [pagina];
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
    const pagina = ui.elemento("div", undefined, "gestao-pagina agenda-pagina");
    const hoje = regras.hoje();
    const limite7Dias = somarDias(hoje, 7);
    const [anoHoje, mesHoje] = hoje.split("-").map(Number);
    let mesExibido = new Date(Date.UTC(anoHoje, mesHoje - 1, 1));
    let dataSelecionada = "";

    const obterPendentes = () => ctx.dados.salvos
      .map((item, indice) => ({ item, indice }))
      .filter(({ item: { acompanhamento: a } }) => a.proximo && !["Aprovada", "Recusada"].includes(a.situacao))
      .sort((a, b) => a.item.acompanhamento.proximo.localeCompare(b.item.acompanhamento.proximo));

    function abrirModalAgendamento(ancora, itemAlvo = null) {
      const elegiveis = ctx.dados.salvos
        .map((item, indice) => ({ item, indice }))
        .filter(({ item }) => !["Aprovada", "Recusada"].includes(item.acompanhamento.situacao));

      if (!elegiveis.length) {
        if (window.confirm("Não há orçamentos ativos para vincular ao contato. Deseja criar um orçamento agora?")) {
          ctx.navegar("orcamento");
        }
        return;
      }

      let idxSelecionado = itemAlvo ? ctx.dados.salvos.indexOf(itemAlvo) : elegiveis[0].indice;
      let dataContato = itemAlvo?.acompanhamento?.proximo || dataSelecionada || hoje;
      let motivoAcao = itemAlvo?.acompanhamento?.acao || "";

      ui.abrirModalContextual({
        titulo: itemAlvo ? "Reagendar contato" : "Agendar contato",
        subtitulo: itemAlvo ? [itemAlvo.clienteNome, itemAlvo.projeto.nome].filter(Boolean).join(" · ") : "Vincular retorno a um orçamento",
        tamanho: "compacto",
        origemEl: ancora,
        modo: "edicao",
        textoConfirmar: "Salvar contato",
        estaAlterado: () => true,
        aoConfirmar: () => {
          const alvo = ctx.dados.salvos[idxSelecionado];
          if (!alvo || !dataContato) return;
          alvo.acompanhamento.proximo = dataContato;
          alvo.acompanhamento.acao = motivoAcao.trim();
          ctx.gravar("Contato agendado para " + regras.formatarData(dataContato) + ".");
          renderizar();
        },
        montar: ({ definirConfirmarDesabilitado }) => {
          const grade = ui.elemento("div", undefined, "formulario-comercial");
          if (!itemAlvo) {
            const opcoes = elegiveis.map(({ item, indice }) => [
              String(indice),
              [item.projeto.nome || "Orçamento", item.clienteNome].filter(Boolean).join(" · "),
            ]);
            const selOrc = seletor("Orçamento relacionado", opcoes, String(idxSelecionado), (v) => {
              idxSelecionado = Number(v);
              return true;
            });
            const cOrc = rotular("Orçamento relacionado", selOrc);
            cOrc.classList.add("campo-completo");
            grade.append(cOrc);
          }

          const inpData = ui.elemento("input");
          inpData.type = "date";
          inpData.value = dataContato;
          inpData.setAttribute("aria-label", "Data do contato");
          inpData.addEventListener("input", () => {
            dataContato = inpData.value;
            definirConfirmarDesabilitado(!dataContato);
          });
          grade.append(rotular("Data do retorno", inpData));

          const inpMotivo = ui.elemento("input");
          inpMotivo.type = "text";
          inpMotivo.value = motivoAcao;
          inpMotivo.placeholder = "Ex.: Validar revisão da proposta";
          inpMotivo.setAttribute("aria-label", "Motivo ou próxima ação");
          inpMotivo.addEventListener("input", () => { motivoAcao = inpMotivo.value; });
          const cMot = rotular("Motivo / próxima ação", inpMotivo);
          cMot.classList.add("campo-completo");
          grade.append(cMot);

          definirConfirmarDesabilitado(!dataContato);
          return grade;
        },
      });
    }

    function renderizar() {
      const pendentes = obterPendentes();
      const qtdHoje = pendentes.filter(({ item }) => item.acompanhamento.proximo === hoje).length;
      const qtdSete = pendentes.filter(({ item }) => item.acompanhamento.proximo > hoje && item.acompanhamento.proximo <= limite7Dias).length;
      const qtdAtrasados = pendentes.filter(({ item }) => item.acompanhamento.proximo < hoje).length;

      const btnAgendar = ui.botao("Agendar contato", (e) => abrirModalAgendamento(e?.currentTarget));
      btnAgendar.classList.add("orcamento-salvar-destaque");

      const header = ui.cabecalhoBotanico({
        titulo: "Próximos contatos",
        indicadores: [
          { rotulo: "Contatos de hoje", valor: String(qtdHoje), estado: qtdHoje > 0 ? "positivo" : "" },
          { rotulo: "Próximos sete dias", valor: String(qtdSete) },
          { rotulo: "Contatos atrasados", valor: String(qtdAtrasados), estado: qtdAtrasados > 0 ? "prejuizo" : "" },
        ],
        acoes: [btnAgendar],
      });

      const mapaDatas = new Map();
      for (const { item } of pendentes) {
        const d = item.acompanhamento.proximo;
        const info = mapaDatas.get(d) || { total: 0, atrasado: false };
        info.total += 1;
        if (d < hoje) info.atrasado = true;
        mapaDatas.set(d, info);
      }

      /* Painel esquerdo: Calendário mensal */
      const calCard = ui.elemento("section", undefined, "cartao calendario-card");
      const calTopo = ui.elemento("div", undefined, "calendario-topo");
      const ano = mesExibido.getUTCFullYear();
      const mes = mesExibido.getUTCMonth();
      const nomesMes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

      const btnAnt = ui.elemento("button", "‹", "calendario-nav-btn");
      btnAnt.type = "button";
      btnAnt.setAttribute("aria-label", "Mês anterior");
      btnAnt.addEventListener("click", () => {
        mesExibido = new Date(Date.UTC(ano, mes - 1, 1));
        renderizar();
      });

      const btnProx = ui.elemento("button", "›", "calendario-nav-btn");
      btnProx.type = "button";
      btnProx.setAttribute("aria-label", "Próximo mês");
      btnProx.addEventListener("click", () => {
        mesExibido = new Date(Date.UTC(ano, mes + 1, 1));
        renderizar();
      });

      const tituloMes = ui.elemento("h2", nomesMes[mes] + " " + ano, "calendario-mes-titulo");
      const navCal = ui.elemento("div", undefined, "calendario-nav");
      navCal.append(btnAnt, btnProx);
      calTopo.append(tituloMes, navCal);

      const semanaCab = ui.elemento("div", undefined, "calendario-semana");
      for (const s of ["D", "S", "T", "Q", "Q", "S", "S"]) {
        semanaCab.append(ui.elemento("span", s));
      }

      const diasGrade = ui.elemento("div", undefined, "calendario-dias");
      const primeiroDiaSemana = mesExibido.getUTCDay();
      const diasNoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();

      for (let i = 0; i < primeiroDiaSemana; i++) {
        diasGrade.append(ui.elemento("span", "", "calendario-vazio"));
      }
      for (let dia = 1; dia <= diasNoMes; dia++) {
        const iso = String(ano).padStart(4, "0") + "-" + String(mes + 1).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
        const info = mapaDatas.get(iso);
        const btnDia = ui.elemento("button", String(dia), "calendario-dia");
        btnDia.type = "button";
        if (iso === hoje) btnDia.dataset.hoje = "true";
        if (iso === dataSelecionada) btnDia.dataset.selecionado = "true";
        if (info) {
          btnDia.dataset.temContato = "true";
          if (info.atrasado) btnDia.dataset.atrasado = "true";
        }
        btnDia.setAttribute("aria-label", regras.formatarData(iso) + (info ? " (" + info.total + " contatos)" : ""));
        btnDia.addEventListener("click", () => {
          dataSelecionada = dataSelecionada === iso ? "" : iso;
          renderizar();
        });
        diasGrade.append(btnDia);
      }

      const calRodape = ui.elemento("div", undefined, "calendario-rodape");
      const btnHoje = ui.botao("Hoje", () => {
        mesExibido = new Date(Date.UTC(anoHoje, mesHoje - 1, 1));
        dataSelecionada = hoje;
        renderizar();
      }, true);
      calRodape.append(btnHoje);
      if (dataSelecionada) {
        calRodape.append(ui.botao("Ver todos", () => {
          dataSelecionada = "";
          renderizar();
        }, true));
      }
      calCard.append(calTopo, semanaCab, diasGrade, calRodape);

      /* Painel direito: Compromissos */
      const compCard = ui.elemento("section", undefined, "cartao compromissos-card");
      const compTopo = ui.elemento("div", undefined, "compromissos-topo");
      const compTitulo = dataSelecionada
        ? "Compromissos em " + regras.formatarData(dataSelecionada)
        : "Compromissos agendados";
      compTopo.append(ui.elemento("h2", compTitulo));

      const visiveis = dataSelecionada
        ? pendentes.filter(({ item }) => item.acompanhamento.proximo === dataSelecionada)
        : pendentes;

      if (!visiveis.length) {
        const msgVazio = dataSelecionada
          ? "Nenhum contato agendado para " + regras.formatarData(dataSelecionada) + "."
          : "Nenhum retorno agendado ainda. Agende o próximo contato de uma proposta para acompanhar aqui.";
        const vazio = ui.estadoVazioBotanico({
          variante: "calendario",
          estado: "vazio",
          titulo: dataSelecionada ? "Dia sem compromissos" : "Nenhum retorno agendado",
          descricao: msgVazio,
          acaoPrincipal: ui.botao("Agendar contato", (e) => abrirModalAgendamento(e?.currentTarget)),
          acaoSecundaria: dataSelecionada ? ui.botao("Ver todos os contatos", () => { dataSelecionada = ""; renderizar(); }, true) : null,
        });
        compCard.append(compTopo, vazio);
      } else {
        const listaComp = ui.elemento("div", undefined, "compromissos-lista");
        for (const { item, indice } of visiveis) {
          const d = item.acompanhamento.proximo;
          const urgencia = d < hoje ? "atrasado" : d === hoje ? "hoje" : "agendado";
          const linha = ui.elemento("article", undefined, "compromisso-item");
          linha.dataset.urgencia = urgencia;

          const colEsq = ui.elemento("div", undefined, "compromisso-info");
          const topoLinha = ui.elemento("div", undefined, "compromisso-topo-linha");
          const badgeData = ui.elemento("span", regras.formatarData(d), "badge-prazo");
          badgeData.dataset.urgencia = urgencia;
          const badgeSit = ui.elemento("span", item.acompanhamento.situacao, "status-proposta");
          badgeSit.dataset.situacao = item.acompanhamento.situacao;
          topoLinha.append(badgeData, badgeSit);

          const tituloItem = ui.elemento("strong", [item.clienteNome || "Sem cliente", item.projeto.nome || "Orçamento"].join(" · "), "compromisso-titulo");
          const motivoEl = ui.elemento("p", item.acompanhamento.acao || "Retomar contato comercial", "compromisso-motivo");
          colEsq.append(topoLinha, tituloItem, motivoEl);

          const acoesItem = ui.elemento("div", undefined, "compromisso-acoes");
          const btnConcluir = ui.botao("Concluir", () => {
            item.acompanhamento.ultimo = hoje;
            item.acompanhamento.proximo = "";
            ctx.gravar("Contato marcado como concluído.");
            renderizar();
          }, true);

          const menuCtx = ui.menuContextual({
            rotulo: "Ações do compromisso",
            itens: [
              { rotulo: "Reagendar", acao: () => abrirModalAgendamento(linha, item) },
              {
                rotulo: "Adiar +7 dias",
                acao: () => {
                  const base = d < hoje ? hoje : d;
                  item.acompanhamento.ultimo = hoje;
                  item.acompanhamento.proximo = somarDias(base, 7);
                  ctx.gravar("Contato reagendado para " + regras.formatarData(item.acompanhamento.proximo) + ".");
                  renderizar();
                },
              },
              { rotulo: "Consultar orçamento", acao: () => ctx.abrir(indice) },
              item.projeto.cliente ? { rotulo: "Ver clientes", acao: () => ctx.navegar("clientes") } : null,
              {
                rotulo: "Remover da agenda",
                perigo: true,
                acao: () => {
                  if (!window.confirm("Remover este contato agendado da agenda?")) return;
                  item.acompanhamento.proximo = "";
                  item.acompanhamento.acao = "";
                  ctx.gravar("Contato removido da agenda.");
                  renderizar();
                },
              },
            ],
          });

          acoesItem.append(btnConcluir, menuCtx);
          linha.append(colEsq, acoesItem);
          listaComp.append(linha);
        }
        compCard.append(compTopo, listaComp);
      }

      const gradeAgenda = ui.elemento("div", undefined, "agenda-grade");
      gradeAgenda.append(calCard, compCard);
      pagina.replaceChildren(header, gradeAgenda);
    }

    renderizar();
    return [pagina];
  }

  return { seletor, rotular, dadosProjeto, clientes, modelos, acompanhamento, realizadas, retornos };
})();
