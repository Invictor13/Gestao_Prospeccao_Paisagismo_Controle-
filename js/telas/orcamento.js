Paisagismo.telasOrcamento = (() => {
  const ui = Paisagismo.ui;
  const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  function resumo(projeto, hora, ctx) {
    const preco = ui.elemento("strong", undefined, "valor-financeiro");
    const subtitulo = ui.elemento("div", undefined, "subtitulo-preco");
    const resumoHoras = ui.elemento("span", undefined, "atalhos-preco");
    const badgeMargem = ui.elemento("span", undefined, "badge-margem");
    subtitulo.append(resumoHoras, badgeMargem);
    const aviso = ui.elemento("p",
      "Atenção: o desconto comercial reduziu o preço final abaixo do custo total do projeto.",
      "aviso-margem");
    aviso.hidden = true;
    const destaque = ui.cartao("Preço final do projeto", preco, subtitulo, aviso);
    destaque.classList.add("preco");

    const fraseResumo = ui.elemento("p", "", "frase-resumo-orcamento");

    const definicoes = [
      ["hora", "Custo por hora", "Base operacional", "Custo mensal da operação dividido pelas horas mensais de referência."],
      ["horas", "Horas de trabalho", "Base operacional", "Soma de todas as horas estimadas nas etapas do projeto."],
      ["minimo", "Valor mínimo viável", "Base operacional", "Horas de trabalho multiplicadas pelo custo por hora da operação."],
      ["despesas", "Despesas diretas", "Base operacional", "Soma de custos extras exclusivos deste projeto (quantidade × valor unitário)."],
      ["base", "Valor sem impostos", "Tributos e custo", "Soma do valor mínimo viável com as despesas diretas."],
      ["impostos", "Impostos", "Tributos e custo", "Aplicados sobre o valor sem impostos conforme o percentual informado."],
      ["custo", "Custo total do projeto", "Tributos e custo", "Valor mínimo necessário para cobrir operação, despesas diretas e impostos."],
      ["lucro", "Lucro do projeto", "Margem e resultado", "Calculado como acréscimo sobre o custo ou margem sobre o preço antes do desconto."],
      ["desconto", "Desconto comercial", "Margem e resultado", "Redução aplicada sobre o preço calculado antes do desconto."],
    ];
    const grupos = new Map();
    const campos = definicoes.map(([chave, rotulo, grupoNome, explicacao]) => {
      const linha = ui.linha(rotulo, undefined, "output", explicacao);
      if (chave === "custo") linha.bloco.classList.add("linha-total");
      if (["impostos", "lucro", "desconto"].includes(chave)) linha.bloco.classList.add("linha-" + chave);
      if (!grupos.has(grupoNome)) {
        const secao = ui.elemento("div", undefined, "grupo-memoria");
        secao.append(ui.elemento("span", grupoNome, "titulo-grupo-memoria"));
        grupos.set(grupoNome, secao);
      }
      grupos.get(grupoNome).append(linha.bloco);
      return { chave, ...linha };
    });

    const barraComposicao = ui.elemento("div", undefined, "barra-composicao");
    const segCusto = ui.elemento("div", undefined, "segmento-composicao segmento-custo");
    const segImpostos = ui.elemento("div", undefined, "segmento-composicao segmento-impostos");
    const segLucro = ui.elemento("div", undefined, "segmento-composicao segmento-lucro");
    barraComposicao.append(segCusto, segImpostos, segLucro);

    const legenda = ui.elemento("div", undefined, "legenda-composicao");
    const criarItemLegenda = (cor, texto) => {
      const item = ui.elemento("span");
      const ponto = ui.elemento("i");
      ponto.setAttribute("style", "background:" + cor);
      const rotulo = ui.elemento("small", texto);
      item.append(ponto, rotulo);
      return { item, rotulo };
    };
    const legCusto = criarItemLegenda("var(--salvia)", "Base");
    const legImpostos = criarItemLegenda("var(--ocre)", "Impostos");
    const legLucro = criarItemLegenda("var(--floresta)", "Lucro líquido");
    legenda.append(legCusto.item, legImpostos.item, legLucro.item);

    let inicializado = false;
    function exibir() {
      const valores = Paisagismo.calcular(projeto, hora);
      const anterior = preco.textContent;
      ui.mostrarValor(preco, ui.brl(valores.preco));
      if (inicializado && anterior !== preco.textContent) {
        destaque.classList.add("preco-atualizado");
      }
      inicializado = true;

      for (const { chave, resultado } of campos) {
        resultado.value = chave === "horas" ? ui.numero(valores.horas) + " h" : ui.brl(valores[chave]);
      }

      const lucroLiquido = valores.preco - valores.custo;
      const margemEfetiva = valores.preco > 0 ? (lucroLiquido / valores.preco) * 100 : 0;
      const abaixoDoCusto = valores.preco + 0.004 < valores.custo;
      aviso.hidden = !abaixoDoCusto;
      if (ctx) {
        const linkHoras = ui.elemento("button", ui.numero(valores.horas) + " h ↗", "link-preco-atalho");
        linkHoras.type = "button";
        linkHoras.title = "Editar etapas do projeto";
        linkHoras.addEventListener("click", () => ctx.navegar("etapas"));
        const linkHora = ui.elemento("button", ui.brl(valores.hora) + "/h ↗", "link-preco-atalho");
        linkHora.type = "button";
        linkHora.title = "Editar custos da operação";
        linkHora.addEventListener("click", () => ctx.navegar("custos"));
        resumoHoras.replaceChildren(linkHoras, ui.elemento("span", "·"), linkHora);
      } else {
        resumoHoras.textContent = ui.numero(valores.horas) + " h · " + ui.brl(valores.hora) + "/h";
      }
      badgeMargem.textContent = abaixoDoCusto
        ? "Abaixo do custo"
        : "Resultado líquido: " + ui.percentual(Math.max(0, margemEfetiva));
      if (abaixoDoCusto) badgeMargem.dataset.alerta = "true";
      else delete badgeMargem.dataset.alerta;

      fraseResumo.textContent = abaixoDoCusto
        ? "O valor cobrado está " + ui.brl(Math.abs(lucroLiquido)) + " abaixo do custo total do projeto."
        : "Custo mínimo de " + ui.brl(valores.custo) + ". Cobrando " + ui.brl(valores.preco)
          + ", sobram " + ui.brl(Math.max(0, lucroLiquido)) + " livres (" + ui.percentual(Math.max(0, margemEfetiva)) + ").";
      if (abaixoDoCusto) fraseResumo.dataset.alerta = "true";
      else delete fraseResumo.dataset.alerta;

      const somaPartes = Math.max(0.01, valores.base + valores.impostos + Math.max(0, lucroLiquido));
      const pBase = Math.round((valores.base / somaPartes) * 100);
      const pImp = Math.round((valores.impostos / somaPartes) * 100);
      const pLuc = Math.max(0, 100 - pBase - pImp);
      segCusto.setAttribute("style", "width:" + Math.max(4, pBase) + "%");
      segImpostos.setAttribute("style", "width:" + Math.max(4, pImp) + "%");
      segLucro.setAttribute("style", "width:" + Math.max(0, pLuc) + "%");
      legCusto.rotulo.textContent = "Base " + pBase + "%";
      legImpostos.rotulo.textContent = "Impostos " + pImp + "%";
      legLucro.rotulo.textContent = "Lucro " + pLuc + "%";
    }
    exibir();
    return {
      exibir,
      destaque,
      memoria: ui.cartao("3 · Memória de cálculo", barraComposicao, legenda, ...grupos.values(), fraseResumo),
    };
  }

  function criarFluxograma(ctx, item, aoAtualizar) {
    const regras = Paisagismo.comercial;
    const hoje = regras.hoje();
    const marcos = item.acompanhamento.marcos;
    const trilha = ui.elemento("div", undefined, "fluxograma-proposta");
    trilha.setAttribute("role", "group");
    trilha.setAttribute("aria-label", "Etapas comerciais da proposta");

    for (const [chave, rotulo] of regras.etapasFluxo) {
      const dataMarco = marcos[chave] || "";
      const concluido = Boolean(dataMarco);
      const passo = ui.elemento("button", undefined, "etapa-fluxo");
      passo.type = "button";
      passo.dataset.concluido = String(concluido);
      passo.setAttribute("aria-pressed", String(concluido));
      const ponto = ui.elemento("span", concluido ? "✓" : "", "ponto-fluxo");
      ponto.setAttribute("aria-hidden", "true");
      const info = ui.elemento("span", undefined, "texto-fluxo");
      info.append(
        ui.elemento("strong", rotulo),
        ui.elemento("small", dataMarco ? regras.formatarData(dataMarco) : "Pendente"),
      );
      passo.append(ponto, info);
      passo.addEventListener("click", () => {
        marcos[chave] = marcos[chave] ? "" : hoje;
        if (item.acompanhamento.situacao !== "Recusada") {
          if (marcos.fechamento || marcos.inicio) item.acompanhamento.situacao = "Aprovada";
          else if (marcos.entregue || marcos.reuniao) item.acompanhamento.situacao = "Enviada";
          else item.acompanhamento.situacao = "Planejada";
        }
        ctx.gravar(marcos[chave] ? rotulo + " marcada em " + regras.formatarData(hoje) + "." : rotulo + " desmarcada.");
        aoAtualizar();
      });
      trilha.append(passo);
    }
    return trilha;
  }

  function orcamento(ctx) {
    const projeto = ctx.dados.projeto;
    const hora = Paisagismo.custos(ctx.dados.operacao).hora;
    const resultado = resumo(projeto, hora, ctx);
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
    acoes.append(novo, ui.botao("Usar modelo", () => ctx.navegar("modelos"), true), comparar, salvar);
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
    const explicacaoModo = ui.elemento("small", margem
      ? "Garante que o lucro líquido represente esse percentual do preço final."
      : "Aplica esse percentual diretamente sobre o custo total do projeto.",
    "dica-contextual-campo");
    const blocoModo = ferramentas.rotular("Base do lucro", modo);
    blocoModo.append(explicacaoModo);
    parametros.append(nome,
      ui.campo("Impostos sobre o subtotal (%)", projeto.impostos, ui.editar(projeto, "impostos", atualizar)),
      blocoModo,
      ui.campo(margem ? "Margem antes do desconto (%)" : "Acréscimo de lucro sobre o custo (%)", projeto.lucro,
        ui.editar(projeto, "lucro", atualizar)),
      ui.campo("Desconto sobre o preço calculado (%)", projeto.desconto, ui.editar(projeto, "desconto", atualizar), 0, 100));
    const clienteAtual = ctx.dados.clientes.find((c) => c.id === projeto.cliente);
    const rotuloComercial = clienteAtual
      ? "Cliente: " + clienteAtual.nome + " · Editar escopo"
      : "Editar cliente, escopo e condições";
    const comercial = ui.botao(rotuloComercial, () => {
      ui.abrirDialogo(comercial, "Cliente, escopo e condições",
        Paisagismo.telasComerciais.dadosProjeto(ctx, atualizar));
    }, true);
    const dados = ui.cartao("1 · Projeto e margens", parametros, comercial);
    dados.classList.add("orcamento-dados");
    esquerda.append(dados,
      ui.editor("2 · Despesas diretas (R$)", "Valor unitário em reais", projeto.despesas, atualizar,
        ["Despesa", "Unitário (R$)"], { tipo: "despesa", ctx }));
    const direita = ui.elemento("div", undefined, "pilha resumo");
    direita.append(resultado.destaque, resultado.memoria);
    const grade = ui.elemento("div", undefined, "grade grade-orcamento");
    grade.append(esquerda, direita);
    return [ui.cabecalho("Orçamento", "Siga os 3 passos abaixo para precificar seu projeto com segurança.", acoes), grade];
  }

  function historico(ctx) {
    if (!ctx.dados.salvos.length) {
      const vazio = ui.estadoVazio(
        "Orçamentos salvos",
        "Nenhum orçamento salvo ainda. Salve um projeto para consultar versões, preços e comparativos aqui.",
        ui.botao("Ir para orçamento", () => ctx.navegar("orcamento")),
        "historico",
      );
      vazio.classList.add("historico-vazio");
      return [vazio];
    }
    const comercial = Paisagismo.telasComerciais;
    const filtros = ui.elemento("div", undefined, "formulario-comercial filtros-historico");
    const busca = ui.elemento("input");
    busca.type = "search";
    busca.placeholder = "Ex.: Jardim, cliente...";
    const de = ui.elemento("input");
    de.type = "date";
    const ate = ui.elemento("input");
    ate.type = "date";
    const situacao = comercial.seletor("Situação", [["", "Todas"],
      ...Paisagismo.comercial.situacoes.map((s) => [s, s])], "", exibir);
    filtros.append(comercial.rotular("Buscar cliente ou projeto", busca), comercial.rotular("Situação", situacao),
      comercial.rotular("Salvo a partir de", de), comercial.rotular("Salvo até", ate));
    const lista = ui.elemento("div");
    let registros = [];
    const paginas = ui.paginador(6, (inicio, fim) => {
      lista.replaceChildren(...(registros.length ? registros.slice(inicio, fim)
        : [ui.elemento("p", "Nenhum orçamento para estes filtros.")]));
    }, "Páginas de orçamentos");
    const normalizar = (texto) => texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const diaLocal = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" });
    function exibir() {
      const termo = normalizar(busca.value.trim());
      registros = ctx.dados.salvos.flatMap((item, indice) => {
        const dia = diaLocal.format(new Date(item.data));
        if (!normalizar(item.projeto.nome + " " + item.clienteNome).includes(termo)
          || (situacao.value && item.acompanhamento.situacao !== situacao.value)
          || (de.value && dia < de.value) || (ate.value && dia > ate.value)) return [];
        const cartaoItem = ui.elemento("article", undefined, "cartao-proposta-item");
        const topoLinha = ui.elemento("div", undefined, "linha topo-proposta-item");
        const detalhes = ui.elemento("div");
        const calculado = Paisagismo.calcular(item.projeto, item.hora);
        const tituloLinha = ui.elemento("div", undefined, "titulo-status-proposta");
        const etiqueta = ui.elemento("span", item.acompanhamento.situacao, "status-proposta");
        etiqueta.dataset.situacao = item.acompanhamento.situacao;
        tituloLinha.append(ui.elemento("strong", item.projeto.nome), etiqueta);
        detalhes.append(
          tituloLinha,
          ui.elemento("p", [
            item === ctx.versaoPendente && "Gravação pendente",
            item.clienteNome,
            ui.brl(calculado.preco),
            ui.numero(calculado.horas) + " h",
            data.format(new Date(item.data)),
          ].filter(Boolean).join(" · ")),
        );
        const acoesLinha = ui.elemento("div", undefined, "acoes");
        if (item !== ctx.versaoPendente) {
          const btnExcluir = ui.botao("Excluir", () => {
            if (!window.confirm("Excluir o orçamento \"" + (item.projeto.nome || "sem nome") + "\"?")) return;
            const pos = ctx.dados.salvos.indexOf(item);
            if (pos < 0) return;
            ctx.dados.salvos.splice(pos, 1);
            ctx.gravar("Orçamento excluído.");
            if (!ctx.dados.salvos.length) ctx.navegar("historico");
            else exibir();
          }, true);
          btnExcluir.classList.add("btn-remover-contextual");
          acoesLinha.append(btnExcluir);
        }
        acoesLinha.append(
          ui.botao("Prévia", () => ctx.navegar("proposta", item), true),
          ui.botao("Abrir", () => ctx.abrir(indice)),
        );
        topoLinha.append(detalhes, acoesLinha);
        const fluxograma = criarFluxograma(ctx, item, exibir);
        cartaoItem.append(topoLinha, fluxograma);
        return [cartaoItem];
      });
      paginas.atualizar(registros.length, 0);
    }
    for (const campo of [busca, de, ate]) campo.addEventListener("input", exibir);
    exibir();
    return [ui.cabecalho("Orçamentos salvos", "Consulte as versões registradas e acompanhe o andamento de cada proposta.",
      ui.botao("Comparar cenários", () => ctx.navegar("comparar"), true)),
      ui.cartao("Histórico", filtros, lista, paginas.controles)];
  }

  function salvo(ctx, item) {
    const resultado = resumo(item.projeto, item.hora);
    const grade = ui.elemento("div", undefined, "grade");
    const detalhes = ui.elemento("div", undefined, "pilha");
    const listar = (itens, formatar) => itens.map(([nome, valor]) => ui.linha(nome, formatar(valor), "strong").bloco);
    const blocoFluxo = ui.cartao("Andamento comercial",
      criarFluxograma(ctx, item, () => ctx.navegar("salvo", item)));
    detalhes.append(
      blocoFluxo,
      ui.cartao("Etapas", ...listar(item.projeto.etapa, (valor) => ui.numero(valor) + " h")),
      ui.cartao("Despesas diretas", ...listar(item.projeto.despesas.map(([nome, valor, quantidade]) =>
        [nome, valor * (quantidade ?? 1)]), ui.brl)),
      ui.cartao("Percentuais aplicados",
        ui.linha("Impostos", ui.numero(item.projeto.impostos) + "%", "strong").bloco,
        ui.linha(item.projeto.modoLucro === "margem" ? "Margem antes do desconto" : "Acréscimo sobre o custo",
          ui.numero(item.projeto.lucro) + "%", "strong").bloco,
        ui.linha("Desconto", ui.numero(item.projeto.desconto) + "%", "strong").bloco),
      Paisagismo.telasComerciais.acompanhamento(ctx, item),
      Paisagismo.telasComerciais.realizadas(ctx, item),
    );
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
      ui.botao("Duplicar como novo projeto", () => ctx.duplicar(item), true));
    if (item !== ctx.versaoPendente) {
      const btnExcluirSalvo = ui.botao("Excluir orçamento", () => {
        if (!window.confirm("Excluir o orçamento \"" + (item.projeto.nome || "sem nome") + "\"?")) return;
        const pos = ctx.dados.salvos.indexOf(item);
        if (pos < 0) return;
        ctx.dados.salvos.splice(pos, 1);
        ctx.gravar("Orçamento excluído.");
        ctx.navegar("historico");
      }, true);
      acoes.append(btnExcluirSalvo);
    }
    acoes.append(ui.botao("Prévia da proposta", () => ctx.navegar("proposta", item)));
    const descricao = (item === ctx.versaoPendente ? "Gravação pendente · " : "Salvo em ")
      + data.format(new Date(item.data));
    return [ui.cabecalho(item.projeto.nome, descricao, acoes), grade];
  }

  return { orcamento, historico, salvo };
})();
