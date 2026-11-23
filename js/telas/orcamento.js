Paisagismo.telasOrcamento = (() => {
  const ui = Paisagismo.ui;
  const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  function resumo(projeto, hora) {
    const preco = ui.elemento("strong");
    const destaque = ui.cartao("Preço final do projeto", preco);
    destaque.classList.add("preco");
    const campos = [
      ["hora", "Custo por hora"], ["horas", "Horas de trabalho"],
      ["minimo", "Valor mínimo viável"], ["despesas", "Despesas diretas"],
      ["base", "Valor sem impostos"], ["impostos", "Impostos"],
      ["custo", "Custo total do projeto"], ["lucro", "Lucro do projeto"],
      ["desconto", "Desconto comercial"],
    ].map(([chave, rotulo]) => ({ chave, ...ui.linha(rotulo) }));
    let realce;
    function exibir() {
      const valores = Paisagismo.calcular(projeto, hora);
      const novoPreco = ui.brl(valores.preco);
      if (preco.textContent && preco.textContent !== novoPreco
        && window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches) {
        realce?.cancel();
        realce = destaque.animate?.([{ backgroundColor: "#c2dfab" }, { backgroundColor: "#dcebc9" }],
          { duration: 300, easing: "ease-out" });
      }
      preco.textContent = novoPreco;
      for (const { chave, resultado } of campos) {
        resultado.value = chave === "horas" ? ui.numero(valores.horas) + " h" : ui.brl(valores[chave]);
      }
    }
    exibir();
    return { exibir, destaque, memoria: ui.cartao("Memória de cálculo", ...campos.map((item) => item.bloco)) };
  }

  function orcamento(ctx) {
    const projeto = ctx.dados.projeto;
    const hora = Paisagismo.custos(ctx.dados.operacao).hora;
    const resultado = resumo(projeto, hora);
    const atualizar = ctx.aoAlterar(resultado.exibir);
    const nome = ui.campo("Nome do projeto", projeto.nome, ui.editar(projeto, "nome", atualizar));
    const comparar = ui.botao("Comparar cenários", () => ctx.navegar("comparar"), true);
    comparar.hidden = !ctx.dados.salvos.length;
    const salvar = ui.botao(ctx.versaoPendente ? "Gravar versão pendente" : "Salvar orçamento", () => {
      if (!ctx.versaoPendente && !projeto.nome.trim()) {
        ctx.status("Informe o nome do projeto para salvar o orçamento.");
        nome.lastElementChild.focus();
        return;
      }
      const ok = ctx.salvarVersao(() => {
        const clienteNome = ctx.dados.clientes.find((cliente) => cliente.id === projeto.cliente)?.nome || "";
        projeto.idProjeto ||= Paisagismo.comercial.chaveProjeto(projeto);
        const versao = { data: new Date().toISOString(), hora, projeto: structuredClone(projeto),
          clienteNome, operacao: structuredClone(ctx.dados.operacao) };
        Paisagismo.comercial.preparar({ ...ctx.dados, salvos: [versao] });
        return versao;
      });
      salvar.textContent = ok ? "Salvar orçamento" : "Gravar versão pendente";
      comparar.hidden = false;
    });
    const novo = ui.botao("Novo orçamento", ctx.novo, true);
    const acoes = ui.elemento("div", undefined, "acoes");
    acoes.append(novo, ui.botao("Usar modelo", () => ctx.navegar("modelos"), true), salvar);
    const esquerda = ui.elemento("div", undefined, "pilha");
    const parametros = ui.elemento("div", undefined, "parametros");
    const ferramentas = Paisagismo.telasComerciais;
    const modo = ferramentas.seletor("Base do lucro", [["acrescimo", "Acréscimo sobre o custo"],
      ["margem", "Margem sobre o preço antes do desconto"]], projeto.modoLucro, (valor) => {
      if (!ui.editar(projeto, "modoLucro", atualizar)(valor)) return false;
      ctx.navegar("orcamento");
      return true;
    });
    const margem = projeto.modoLucro === "margem";
    parametros.append(nome,
      ui.campo("Impostos sobre o subtotal (%)", projeto.impostos, ui.editar(projeto, "impostos", atualizar)),
      ferramentas.rotular("Base do lucro", modo),
      ui.campo(margem ? "Margem antes do desconto (%)" : "Acréscimo de lucro sobre o custo (%)", projeto.lucro,
        ui.editar(projeto, "lucro", atualizar)),
      ui.campo("Desconto sobre o preço calculado (%)", projeto.desconto, ui.editar(projeto, "desconto", atualizar), 0, 100));
    const comercial = ui.elemento("details", undefined, "cartao");
    comercial.append(ui.elemento("summary", "Cliente, escopo e condições"),
      Paisagismo.telasComerciais.dadosProjeto(ctx, atualizar));
    esquerda.append(ui.cartao("Dados e percentuais", parametros),
      comercial, ui.editor("Despesas diretas", "Valor unitário em reais", projeto.despesas, atualizar,
        ["Despesa", "Unitário (R$)"], { tipo: "despesa" }));
    const direita = ui.elemento("div", undefined, "pilha resumo");
    direita.append(resultado.destaque, resultado.memoria, comparar);
    const grade = ui.elemento("div", undefined, "grade grade-orcamento");
    grade.append(esquerda, direita);
    return [ui.cabecalho("Orçamento", "Calcule o preço de um projeto de paisagismo.", acoes), grade];
  }

  function historico(ctx) {
    if (!ctx.dados.salvos.length) {
      const vazio = ui.cartao("Nenhum orçamento salvo",
        ui.elemento("p", "Salve um projeto para consultar seu preço e os valores usados no cálculo."),
        ui.botao("Ir para orçamento", () => ctx.navegar("orcamento"), true));
      vazio.classList.add("historico-vazio");
      return [ui.cabecalho("Orçamentos salvos", "Consulte as versões registradas de cada proposta."), vazio];
    }
    const comercial = Paisagismo.telasComerciais;
    const filtros = ui.elemento("div", undefined, "formulario-comercial filtros-historico");
    const busca = ui.elemento("input");
    busca.type = "search";
    const de = ui.elemento("input");
    de.type = "date";
    const ate = ui.elemento("input");
    ate.type = "date";
    const situacao = comercial.seletor("Situação", [["", "Todas"],
      ...Paisagismo.comercial.situacoes.map((s) => [s, s])], "", exibir);
    filtros.append(comercial.rotular("Buscar cliente ou projeto", busca), comercial.rotular("Situação", situacao),
      comercial.rotular("Salvo a partir de", de), comercial.rotular("Salvo até", ate));
    const lista = ui.elemento("div");
    const normalizar = (texto) => texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const diaLocal = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" });
    function exibir() {
      const termo = normalizar(busca.value.trim());
      const registros = ctx.dados.salvos.flatMap((item, indice) => {
        const dia = diaLocal.format(new Date(item.data));
        if (!normalizar(item.projeto.nome + " " + item.clienteNome).includes(termo)
          || (situacao.value && item.acompanhamento.situacao !== situacao.value)
          || (de.value && dia < de.value) || (ate.value && dia > ate.value)) return [];
        const linha = ui.elemento("div", undefined, "linha");
        const detalhes = ui.elemento("div");
        const valor = Paisagismo.calcular(item.projeto, item.hora).preco;
        detalhes.append(ui.elemento("strong", item.projeto.nome),
          ui.elemento("p", [item === ctx.versaoPendente && "Gravação pendente", item.clienteNome,
            item.acompanhamento.situacao, ui.brl(valor),
            data.format(new Date(item.data))].filter(Boolean).join(" · ")));
        linha.append(detalhes, ui.botao("Abrir", () => ctx.abrir(indice), true));
        return [linha];
      });
      lista.replaceChildren(...(registros.length ? registros : [ui.elemento("p", "Nenhum orçamento para estes filtros.")]));
    }
    for (const campo of [busca, de, ate]) campo.addEventListener("input", exibir);
    exibir();
    return [ui.cabecalho("Orçamentos salvos", "Consulte as versões registradas de cada proposta.",
      ui.botao("Comparar cenários", () => ctx.navegar("comparar"), true)),
      ui.cartao("Histórico", filtros, lista)];
  }

  function salvo(ctx, item) {
    const resultado = resumo(item.projeto, item.hora);
    const grade = ui.elemento("div", undefined, "grade");
    const detalhes = ui.elemento("div", undefined, "pilha");
    const listar = (itens, formatar) => itens.map(([nome, valor]) => ui.linha(nome, formatar(valor), "strong").bloco);
    detalhes.append(ui.cartao("Etapas", ...listar(item.projeto.etapa, (valor) => ui.numero(valor) + " h")),
      ui.cartao("Despesas diretas", ...listar(item.projeto.despesas.map(([nome, valor, quantidade]) =>
        [nome, valor * (quantidade ?? 1)]), ui.brl)),
      ui.cartao("Percentuais aplicados",
        ui.linha("Impostos", ui.numero(item.projeto.impostos) + "%", "strong").bloco,
        ui.linha(item.projeto.modoLucro === "margem" ? "Margem antes do desconto" : "Acréscimo sobre o custo",
          ui.numero(item.projeto.lucro) + "%", "strong").bloco,
        ui.linha("Desconto", ui.numero(item.projeto.desconto) + "%", "strong").bloco),
      Paisagismo.telasComerciais.acompanhamento(ctx, item),
      Paisagismo.telasComerciais.realizadas(ctx, item));
    const direita = ui.elemento("div", undefined, "pilha resumo");
    direita.append(resultado.destaque, resultado.memoria);
    grade.append(detalhes, direita);
    const chave = Paisagismo.comercial.chaveProjeto(item.projeto);
    const versoes = ctx.dados.salvos.flatMap((versao, indice) => {
      if (Paisagismo.comercial.chaveProjeto(versao.projeto) !== chave) return [];
      const linha = ui.elemento("div", undefined, "linha");
      linha.append(ui.elemento("span", data.format(new Date(versao.data))),
        versao === item ? ui.elemento("strong", "Versão aberta") : ui.botao("Abrir versão", () => ctx.abrir(indice), true));
      return [linha];
    });
    detalhes.append(ui.cartao("Versões deste projeto", ...versoes));
    if (item.operacao) {
      const custo = Paisagismo.custos(item.operacao);
      detalhes.append(ui.cartao("Base de custos da versão",
        ui.linha("Custo mensal equivalente", ui.brl(custo.mensal), "strong").bloco,
        ui.linha("Horas mensais de referência", ui.numero(item.operacao.horas) + " h", "strong").bloco));
    }
    const acoes = ui.elemento("div", undefined, "acoes");
    acoes.append(ui.botao("Voltar ao histórico", () => ctx.navegar("historico"), true),
      ui.botao("Comparar", () => ctx.navegar("comparar", item), true),
      ui.botao("Criar revisão", () => ctx.duplicar(item, true), true),
      ui.botao("Duplicar como novo projeto", () => ctx.duplicar(item), true),
      ui.botao("Prévia da proposta", () => ctx.navegar("proposta", item)));
    const descricao = (item === ctx.versaoPendente ? "Gravação pendente · " : "Salvo em ")
      + data.format(new Date(item.data));
    return [ui.cabecalho(item.projeto.nome, descricao, acoes), grade];
  }

  return { orcamento, historico, salvo };
})();
