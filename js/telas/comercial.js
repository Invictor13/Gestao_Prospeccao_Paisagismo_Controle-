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

  function dadosProjeto(ctx, atualizar) {
    const projeto = ctx.dados.projeto;
    const grade = ui.elemento("div", undefined, "formulario-comercial");
    const opcoes = [["", "Selecione um cliente"], ...ctx.dados.clientes.map((c) => [c.id, c.nome])];
    grade.append(rotular("Cliente", seletor("Cliente", opcoes, projeto.cliente, ui.editar(projeto, "cliente", atualizar))),
      campo("Tipo de serviço", projeto, "tipo", atualizar),
      campo("Local do projeto", projeto, "local", atualizar),
      campo("Área estimada (m²)", projeto, "area", atualizar),
      campo("Escopo", projeto, "escopo", atualizar, "longo"),
      campo("Exclusões", projeto, "exclusoes", atualizar, "longo"),
      campo("Prazo previsto", projeto, "prazo", atualizar),
      campo("Validade da proposta", projeto, "validade", atualizar, "date"),
      campo("Título da proposta", projeto, "tituloProposta", atualizar),
      campo("Condições de pagamento", projeto, "pagamento", atualizar, "longo"),
      campo("Observações internas", projeto, "notas", atualizar, "longo"));
    return ui.cartao("Dados comerciais", grade, ui.botao("Gerenciar clientes", () => ctx.navegar("clientes"), true));
  }

  function clientes(ctx) {
    const lista = ui.elemento("div", undefined, "pilha");
    const atualizar = ctx.aoAlterar(() => {});
    function exibir() {
      lista.replaceChildren(...ctx.dados.clientes.map((cliente) => {
        const detalhes = ui.elemento("details", undefined, "cartao");
        const titulo = ui.elemento("summary", cliente.nome || "Novo cliente");
        const grade = ui.elemento("div", undefined, "formulario-comercial");
        const campos = [["Nome ou empresa", "nome"], ["Pessoa de contato", "contato"],
          ["Telefone", "telefone", "tel"], ["E-mail", "email", "email"], ["Observações internas", "notas", "longo"]];
        for (const [rotulo, chave, tipo] of campos) {
          grade.append(campo(rotulo, cliente, chave, () => {
            if (!atualizar()) return false;
            titulo.textContent = cliente.nome || "Novo cliente";
            return true;
          }, tipo));
        }
        detalhes.append(titulo, grade);
        return detalhes;
      }));
      if (!ctx.dados.clientes.length) lista.append(ui.cartao("Nenhum cliente cadastrado",
        ui.elemento("p", "Cadastre um cliente para vincular seus projetos e propostas.")));
    }
    const adicionar = ui.botao("Cadastrar cliente", () => {
      const cliente = Object.fromEntries(regras.camposCliente.map((chave) => [chave, ""]));
      cliente.id = regras.id();
      ctx.dados.clientes.unshift(cliente);
      ctx.gravar("Cliente cadastrado.");
      exibir();
      lista.firstElementChild.open = true;
      lista.firstElementChild.querySelector("input").focus();
    });
    exibir();
    return [ui.cabecalho("Clientes", "Guarde os contatos de quem contrata seus projetos.", adicionar), lista];
  }

  function modelos(ctx) {
    const lista = ui.elemento("div", undefined, "pilha");
    const atualizar = ctx.aoAlterar(() => {});
    function exibir() {
      lista.replaceChildren(...ctx.dados.modelos.map((modelo) => {
        const detalhes = ui.elemento("details", undefined, "cartao");
        const titulo = ui.elemento("summary", modelo.nome || "Modelo sem nome");
        const nome = campo("Nome do modelo", modelo, "nome", () => {
          if (!atualizar()) return false;
          titulo.textContent = modelo.nome || "Modelo sem nome";
          return true;
        });
        const aplicar = ui.botao("Aplicar ao rascunho", () => ctx.aplicarModelo(modelo));
        detalhes.append(titulo, nome, ui.editor("Etapas do modelo", "Horas", modelo.etapas, atualizar,
          ["Etapa", "Horas"], { ordenar: true }), aplicar);
        return detalhes;
      }));
    }
    const criar = ui.botao("Criar a partir do rascunho", () => {
      ctx.dados.modelos.unshift({ nome: ctx.dados.projeto.nome || "Novo modelo",
        etapas: ctx.dados.projeto.etapa.map(([nome, horas]) => [nome, horas]) });
      ctx.gravar("Modelo criado.");
      exibir();
      lista.firstElementChild.open = true;
    });
    exibir();
    return [ui.cabecalho("Modelos de serviço", "Reutilize uma estimativa inicial de etapas e horas.", criar), lista];
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
    const pendentes = ctx.dados.salvos.map((item, indice) => ({ item, indice }))
      .filter(({ item: { acompanhamento: a } }) => a.proximo && !["Aprovada", "Recusada"].includes(a.situacao))
      .sort((a, b) => a.item.acompanhamento.proximo.localeCompare(b.item.acompanhamento.proximo));
    const grupos = [["Atrasados", (dia) => dia < hoje], ["Hoje", (dia) => dia === hoje],
      ["Agendados", (dia) => dia > hoje]];
    const lista = ui.elemento("div", undefined, "pilha");
    for (const [titulo, pertence] of grupos) {
      const linhas = pendentes.filter(({ item }) => pertence(item.acompanhamento.proximo)).map(({ item, indice }) => {
        const linha = ui.elemento("div", undefined, "linha");
        const texto = ui.elemento("div");
        texto.append(ui.elemento("strong", [item.clienteNome, item.projeto.nome].filter(Boolean).join(" · ")),
          ui.elemento("p", regras.formatarData(item.acompanhamento.proximo) + " · " + (item.acompanhamento.acao || "Retomar contato")));
        linha.append(texto, ui.botao("Abrir", () => ctx.abrir(indice), true));
        return linha;
      });
      lista.append(ui.cartao(titulo, ...linhas.length ? linhas : [ui.elemento("p", "Nenhum retorno nesta faixa.")]));
    }
    return [ui.cabecalho("Próximos contatos", "Acompanhe os retornos registrados nas propostas."), lista];
  }

  return { seletor, rotular, dadosProjeto, clientes, modelos, acompanhamento, realizadas, retornos };
})();
