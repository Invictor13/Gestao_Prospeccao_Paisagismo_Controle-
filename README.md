# Flora em Folha

Gestão offline de clientes, orçamentos e propostas de paisagismo.

## Como usar

1. Abra `index.html` com duplo clique e mantenha as pastas `assets`, `css` e `js` junto dele.
2. Confira as despesas fixas em **Custos da operação** e ajuste as horas mensais de referência.
3. Distribua as horas de trabalho em **Etapas do projeto**.
4. Em **Orçamento**, preencha o nome do projeto e ajuste despesas e percentuais. Use **Salvar orçamento** para registrar uma versão.
5. Use **Clientes** para cadastrar o contato e **Modelos de serviço** para reaproveitar as etapas. Na seção **Cliente, escopo e condições** do orçamento, vincule o cliente e informe os dados da proposta.
6. Abra uma versão em **Orçamentos salvos** para gerar a **Prévia da proposta**, imprimir ou salvar em PDF pelo navegador. Em **Etapas do projeto**, marque os itens que podem aparecer como entregáveis antes de salvar a versão.
7. Use o acompanhamento da versão para ajustar a situação, programar o próximo contato e lançar as horas realizadas. A tela **Próximos contatos** reúne esses retornos.
8. Use **Exportar backup** para guardar o rascunho, os custos, os clientes, os modelos e o histórico em JSON. **Importar backup** mostra uma prévia e oferece uma exportação dos dados atuais antes da substituição. Backups da versão anterior continuam aceitos.

O sistema grava as alterações no armazenamento do navegador quando disponível. Exporte um backup antes de mudar de navegador ou mover a pasta.

A **Visão geral** usa a versão gravada mais recente de cada projeto. Propostas em aberto incluem versões planejadas e enviadas. O valor em aberto soma os preços finais dessas versões.

Use **Abrir demonstração** no menu para testar com dados fictícios em outra aba. A demonstração não acessa o armazenamento local, desativa importação e exportação de backups e descarta alterações ao recarregar.

Se o navegador recusar a gravação de um orçamento, a versão aparece como **Gravação pendente** no histórico. Use **Tentar gravar novamente** para persistir a mesma versão ou exporte um backup antes de fechar a página. A restauração só substitui os dados da sessão depois que o backup validado for gravado.

## Testes

Execute `node --test` na raiz do projeto com Node.js 18 ou superior. Os testes usam os mesmos scripts carregados pelo HTML e simulam o armazenamento local. O aplicativo continua abrindo diretamente pelo `index.html`.

Abra um registro em **Orçamentos salvos** para criar uma revisão do mesmo projeto ou duplicá-lo como um novo projeto. A cópia ocupa o lugar do rascunho após confirmação e usa o custo por hora atual. Em **Comparar cenários**, selecione duas versões salvas ou use o rascunho em um dos lados. A diferença é calculada como cenário menos base.

## Estrutura

- `index.html` é o ponto de entrada e carrega os arquivos locais.
- `assets/` contém o logo usado na navegação e na proposta.
- `css/` contém os estilos de base e dos componentes.
- `js/dados/` contém o modelo extraído da planilha e o armazenamento.
- `js/dominio/` contém as regras de custos, horas e orçamento.
- `js/telas/` contém os formulários, o histórico e a memória de cálculo.
- `js/app.js` conecta as telas ao estado e ao armazenamento.

O modelo inicial reproduz o orçamento de R$ 3.052,81 da planilha. Os impostos incidem sobre o valor sem impostos, o acréscimo de lucro incide sobre o custo total com impostos e o desconto opcional é aplicado ao preço calculado. Os valores são arredondados na apresentação.
