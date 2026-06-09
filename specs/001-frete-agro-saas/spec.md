# Feature Specification: FreteAgro — Plataforma SaaS para Gestão de Frota Agrícola

**Feature Branch**: `001-frete-agro-saas`

**Created**: 2026-06-08

**Status**: Draft

---

## Visão Geral

O FreteAgro é uma plataforma SaaS que digitaliza e centraliza o controle operacional e financeiro de frotas de caminhões que transportam cargas agrícolas (grãos, óleo de soja, farelo, fertilizantes e similares) no Brasil.

Donos de frota atualmente controlam viagens, despesas e pagamentos de motoristas em planilhas Excel e grupos de WhatsApp. O processo de acerto financeiro com motoristas — que recebem um percentual do frete com deduções de vales, adiantamentos e despesas — é feito de forma manual, gerando conflitos e erros. Não há visão em tempo real da saúde financeira da frota.

O FreteAgro resolve esse problema oferecendo um painel web para o dono da frota e um aplicativo mobile para motoristas de campo, com sincronização automática entre os dois.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Autenticação e Onboarding (Priority: P1)

O dono de frota se cadastra na plataforma, cria sua conta com os dados da frota, e ao acessar pela primeira vez é guiado a cadastrar o primeiro caminhão e motorista. Os motoristas recebem convite por WhatsApp e ativam suas contas no aplicativo mobile sem precisar se registrar do zero.

**Why this priority**: Sem autenticação nada funciona. O fluxo de onboarding guiado garante que o usuário consiga usar o sistema desde o primeiro acesso, reduzindo abandono.

**Independent Test**: Pode ser testado completamente criando uma conta de dono, recebendo o convite como motorista e acessando a tela inicial com o guia de primeiros passos — entrega valor imediato de "entrei no sistema e sei o que fazer a seguir".

**Acceptance Scenarios**:

1. **Given** um visitante acessa a plataforma, **When** preenche nome, e-mail, WhatsApp, senha, nome da frota e estado de operação e submete o formulário, **Then** uma conta de dono de frota é criada e o usuário é redirecionado ao painel inicial.
2. **Given** o dono acabou de criar a conta e o painel está vazio, **When** acessa o painel pela primeira vez, **Then** é exibida uma tela de boas-vindas com guia passo a passo para cadastrar o primeiro caminhão e o primeiro motorista.
3. **Given** o dono cadastrou um motorista no sistema, **When** o sistema envia o convite, **Then** o motorista recebe uma mensagem no WhatsApp com link de ativação da conta.
4. **Given** o motorista acessa o link de ativação, **When** define sua senha no aplicativo mobile, **Then** a conta é ativada e ele acessa o app com seus dados já preenchidos pelo dono.
5. **Given** um usuário esqueceu a senha, **When** solicita recuperação informando o e-mail, **Then** recebe um link de redefinição de senha por e-mail.
6. **Given** um usuário tem credenciais válidas, **When** faz login com e-mail e senha, **Then** acessa o painel correspondente ao seu perfil (dono → painel web, motorista → app mobile).
7. **Given** uma sessão expirou ou não existe, **When** o usuário tenta acessar qualquer rota protegida, **Then** é redirecionado para a tela de login.

---

### User Story 2 — Gestão da Frota (caminhões e motoristas) (Priority: P2)

O dono cadastra seus caminhões e motoristas, vincula exatamente um motorista a cada caminhão e mantém os cadastros atualizados sem perder histórico de operações passadas.

**Why this priority**: É o pilar estrutural da plataforma. Fretes, acertos e relatórios dependem de caminhões e motoristas cadastrados corretamente.

**Independent Test**: Pode ser testado cadastrando um caminhão, cadastrando um motorista com percentual de comissão e vinculando-os — entrega valor ao permitir ao dono organizar sua frota digitalmente pela primeira vez.

**Acceptance Scenarios**:

1. **Given** o dono está autenticado, **When** cadastra um caminhão com placa, modelo e tipo de carroceria, **Then** o caminhão aparece na lista da frota com status ativo.
2. **Given** o dono cadastra um motorista, **When** informa nome, WhatsApp e percentual de comissão, **Then** o motorista é registrado e o convite de ativação é disparado automaticamente.
3. **Given** um caminhão está sem motorista vinculado, **When** o dono associa um motorista ativo a ele, **Then** o vínculo é registrado e o painel de alertas não exibe mais esse caminhão como sem motorista.
4. **Given** um motorista já está vinculado a um caminhão, **When** o dono tenta vinculá-lo a um segundo caminhão simultaneamente, **Then** o sistema bloqueia a ação e exibe mensagem explicando a regra de 1 caminhão por motorista.
5. **Given** um caminhão ou motorista tem histórico de fretes, **When** o dono o inativa, **Then** o registro é inativado mas todo o histórico é preservado e consultável.
6. **Given** o dono acessa a lista de caminhões ou motoristas, **When** edita qualquer campo de um registro ativo, **Then** as alterações são salvas e refletidas em toda a plataforma.

---

### User Story 3 — Registro de Fretes (Priority: P3)

O dono da frota registra viagens com todos os dados operacionais — origem, destino, tipo de carga, quilometragem e valor bruto — e lança as despesas vinculadas a cada frete com comprovantes fotográficos.

**Why this priority**: O frete é a unidade central de negócio. Sem registrar fretes não há base para acertos financeiros nem para relatórios.

**Independent Test**: Pode ser testado criando um frete completo com despesas e verificando que o status do frete muda corretamente — entrega valor ao substituir imediatamente o papel na cabine e a planilha do dono.

**Acceptance Scenarios**:

1. **Given** o dono está autenticado, **When** registra um frete com origem, destino, tipo de carga (grão, óleo de soja, farelo, fertilizante, outro), caminhão, motorista, km inicial, km final e valor bruto do frete, **Then** o frete é salvo com status "em andamento".
2. **Given** um frete está registrado, **When** o dono lança uma despesa (combustível, borracharia, pátio, pedágio, outros) com valor, descrição e foto da nota fiscal, **Then** a despesa é vinculada ao frete e o total de despesas do frete é atualizado.
3. **Given** um frete tem km inicial e km final preenchidos e todas as despesas lançadas, **When** o dono marca o frete como concluído, **Then** o status muda para "concluído" e o frete fica disponível para acerto financeiro.
4. **Given** existem múltiplos fretes registrados, **When** o dono aplica filtros por período, motorista, status ou rota, **Then** somente os fretes correspondentes aos filtros são exibidos.
5. **Given** o dono tenta excluir um frete que já tem despesas ou acerto vinculado, **When** confirma a exclusão, **Then** o sistema impede a exclusão permanente e o frete é apenas inativado, com todo o histórico preservado.
6. **Given** um frete está registrado, **When** o dono consulta o frete, **Then** vê o status atual (em andamento / concluído / acerto pendente / acerto realizado) e o total de despesas vinculadas.

---

### User Story 4 — Acerto Financeiro com Motorista (Priority: P4)

O dono calcula automaticamente o valor devido ao motorista com base no percentual de comissão, lança deduções (vales, adiantamentos, despesas pagas pelo dono), confirma o saldo líquido e gera comprovante em PDF para envio por WhatsApp.

**Why this priority**: É o diferencial central da plataforma. Elimina o conflito e os erros do acerto manual, que é o maior ponto de dor descrito pelos usuários.

**Independent Test**: Pode ser testado completando um acerto de um frete fictício, com comissão e deduções, gerando o PDF e verificando os valores — entrega valor imediato ao eliminar o cálculo feito de cabeça ou em papel.

**Acceptance Scenarios**:

1. **Given** um frete está com status "concluído", **When** o dono abre o acerto do frete, **Then** o sistema exibe automaticamente o valor da comissão calculado como `valor bruto do frete × percentual de comissão do motorista`.
2. **Given** o dono está no acerto de um frete, **When** lança uma dedução (vale sacado, adiantamento recebido, despesa de oficina por conta do motorista) com valor e descrição, **Then** a dedução é adicionada à lista e o saldo líquido é recalculado imediatamente.
3. **Given** o acerto tem comissão e todas as deduções lançadas, **When** o dono consulta o resumo antes de confirmar, **Then** vê o detalhamento: valor bruto do frete, percentual e valor da comissão, cada dedução com descrição e valor, e o saldo líquido final (comissão − total de deduções).
4. **Given** o dono confirma o acerto, **When** clica em "Confirmar pagamento", **Then** o status do frete muda para "acerto realizado" e o acerto é registrado no histórico do motorista.
5. **Given** o acerto foi confirmado, **When** o dono solicita o comprovante, **Then** um PDF é gerado com nome do motorista, dados do frete, detalhamento da comissão, lista de deduções e saldo líquido final.
6. **Given** o dono acessa o histórico de acertos de um motorista, **When** consulta a lista, **Then** vê todos os acertos realizados com datas, valores e links para os comprovantes.
7. **Given** o motorista está autenticado no app, **When** acessa a seção "Meus ganhos", **Then** vê o saldo atual e o histórico de acertos realizados pelo dono.

---

### User Story 5 — Caixa da Frota (Priority: P5)

O dono visualiza o extrato financeiro completo da frota — entradas de fretes e saídas por categoria (comissão, manutenção, combustível, etc.) — e apura o lucro líquido real do período.

**Why this priority**: Completa a visão financeira da operação, permitindo ao dono saber com precisão se a frota está dando lucro, indo além do acerto individual por frete.

**Independent Test**: Pode ser testado lançando entradas e saídas de um mês e verificando se o extrato e o lucro líquido estão corretos — entrega valor ao substituir a planilha financeira do dono.

**Acceptance Scenarios**:

1. **Given** o dono acessa o extrato do caixa, **When** seleciona um período, **Then** vê todas as entradas (receitas de fretes concluídos) e saídas (comissões pagas, combustível, borracharia, pátio, pedágios, manutenção, salários, IPVA, seguro, outros) do período.
2. **Given** o dono vai lançar uma saída avulsa no caixa, **When** informa valor, data e categoria (comissão / manutenção / pátio / combustível / salário / impostos / outros), **Then** o lançamento é registrado e o extrato é atualizado.
3. **Given** o dono visualiza o extrato de um período, **When** consulta o resumo financeiro, **Then** o sistema exibe: total de receitas, total de despesas por categoria e lucro líquido real (receitas − todas as despesas).
4. **Given** o dono deseja analisar gastos, **When** acessa a composição de despesas por categoria, **Then** cada categoria exibe o total gasto e o percentual sobre o total de despesas do período.

---

### User Story 6 — Dashboard e Relatórios (Priority: P6)

O dono visualiza indicadores-chave da frota em um dashboard consolidado com gráficos de tendência e exporta relatórios financeiros para contador ou arquivo pessoal.

**Why this priority**: Transforma dados operacionais em inteligência de negócio, habilitando decisões sobre a frota com base em evidências.

**Independent Test**: Pode ser testado verificando que o dashboard exibe corretamente os KPIs de um período com fretes e acertos registrados, e que os relatórios são exportados corretamente.

**Acceptance Scenarios**:

1. **Given** o dono acessa o painel, **When** o dashboard carrega, **Then** exibe receita bruta, total de fretes, despesas totais e lucro líquido do período selecionado, sem necessidade de navegar por outras telas.
2. **Given** há acertos pendentes ou caminhões sem motorista vinculado, **When** o dono abre o dashboard, **Then** alertas destacados informam quais itens requerem atenção.
3. **Given** o dono acessa os gráficos, **When** seleciona um período, **Then** vê gráfico de receita versus despesa por mês e gráfico de composição de despesas por categoria.
4. **Given** o dono deseja exportar dados, **When** solicita relatório financeiro para um período, **Then** o sistema gera o arquivo no formato escolhido (PDF ou Excel) com receitas, despesas categorizadas e lucro líquido.
5. **Given** o dono quer analisar um período específico, **When** seleciona filtro de período (este mês, mês passado, últimos 3 meses, este ano, personalizado), **Then** todos os indicadores do dashboard são atualizados para o período selecionado.

---

### User Story 7 — Aplicativo Mobile do Motorista (Priority: P7)

O motorista usa o aplicativo no celular para registrar a viagem em tempo real — km, despesas com foto de comprovante — e encerra a viagem ao chegar no destino, com funcionamento offline em regiões sem sinal.

**Why this priority**: Elimina o papel na cabine e o WhatsApp de fotos. Sem o app do motorista, a entrada de dados de campo continua manual e o dono precisa importar tudo na mão.

**Independent Test**: Pode ser testado simulando uma viagem completa offline — iniciar, lançar despesas com foto, encerrar — e verificando que ao reconectar todos os dados sincronizam corretamente com o painel do dono.

**Acceptance Scenarios**:

1. **Given** o motorista está autenticado no app, **When** inicia uma viagem informando km inicial, origem, destino e tipo de carga, **Then** uma nova viagem é registrada e fica visível no painel do dono em tempo real.
2. **Given** o motorista está em viagem, **When** lança uma despesa (combustível, borracharia, pátio, pedágio) com valor e foto da nota fiscal tirada na hora, **Then** a despesa é vinculada à viagem e a foto é enviada ao sistema.
3. **Given** o motorista chegou ao destino, **When** encerra a viagem informando o km final, **Then** o app exibe um resumo da viagem (origem, destino, km percorridos, total de despesas lançadas) e o status muda para "aguardando acerto".
4. **Given** o motorista está em área sem sinal de internet, **When** inicia viagem ou lança despesas, **Then** os dados são armazenados localmente no dispositivo sem interrupção do fluxo de trabalho.
5. **Given** o motorista estava offline e reconectou à internet, **When** a conexão é restabelecida, **Then** todos os dados armazenados localmente são sincronizados automaticamente com o servidor, sem necessidade de ação do motorista.
6. **Given** o motorista está no app, **When** acessa "Meus ganhos", **Then** vê seu saldo atual e o histórico de acertos confirmados pelo dono.

---

### Edge Cases

- O que acontece quando o km final lançado pelo motorista é menor que o km inicial?
- Como o sistema trata um motorista inativado que tem fretes em andamento?
- O que acontece se o dono confirmar um acerto e depois quiser editá-lo?
- Como o sistema lida com foto de nota fiscal corrompida ou de formato não suportado?
- O que acontece se dois dispositivos do mesmo dono tentarem confirmar o mesmo acerto simultaneamente?
- Como tratar fretes sem valor bruto definido (frete ainda não faturado)?
- O que acontece se um caminhão for inativado enquanto tem um frete em andamento?

---

## Requirements *(mandatory)*

### Functional Requirements

#### Autenticação e Conta

- **FR-001**: O sistema DEVE permitir que donos de frota se cadastrem informando nome completo, e-mail, WhatsApp, senha, nome da frota e estado de operação.
- **FR-002**: O sistema DEVE validar que o e-mail informado no cadastro é único na plataforma.
- **FR-003**: O sistema DEVE permitir login com e-mail e senha para donos e motoristas.
- **FR-004**: O sistema DEVE proteger todas as rotas autenticadas, redirecionando sessões inválidas ou expiradas para a tela de login.
- **FR-005**: O sistema DEVE oferecer recuperação de senha por e-mail com link de redefinição.
- **FR-006**: O sistema DEVE enviar convite de ativação de conta ao motorista via WhatsApp quando o dono o cadastrar.
- **FR-007**: O motorista DEVE ser capaz de ativar sua conta e definir senha a partir do link recebido no WhatsApp, sem necessidade de preencher seus dados novamente.
- **FR-008**: Cada dono DEVE ter acesso exclusivamente aos dados da sua própria frota; dados de outras frotas nunca devem ser acessíveis.

#### Gestão da Frota

- **FR-009**: O sistema DEVE permitir ao dono cadastrar caminhões com placa, modelo e tipo de carroceria.
- **FR-010**: O sistema DEVE permitir ao dono cadastrar motoristas com nome, WhatsApp e percentual de comissão.
- **FR-011**: O sistema DEVE permitir vincular exatamente um motorista ativo a cada caminhão; a tentativa de vincular um motorista já ocupado a outro caminhão DEVE ser bloqueada com mensagem explicativa.
- **FR-012**: O sistema DEVE permitir ao dono editar qualquer campo de caminhões e motoristas ativos.
- **FR-013**: O sistema DEVE permitir ao dono inativar caminhões e motoristas, preservando todo o histórico de operações associadas.
- **FR-014**: O sistema DEVE exibir tela de boas-vindas guiada ao dono na primeira vez que acessa o painel, orientando o cadastro do primeiro caminhão e motorista.
- **FR-015**: O painel DEVE exibir alerta para caminhões sem motorista vinculado.

#### Registro de Fretes

- **FR-016**: O sistema DEVE permitir registrar fretes com: caminhão, motorista, origem, destino, tipo de carga, km inicial, km final e valor bruto.
- **FR-017**: O sistema DEVE permitir lançar despesas vinculadas a um frete, com categoria (combustível, borracharia, pátio, pedágio, outros), valor, descrição e foto da nota fiscal.
- **FR-018**: O sistema DEVE gerenciar o ciclo de status de cada frete: em andamento → concluído → acerto pendente → acerto realizado.
- **FR-019**: O sistema DEVE permitir buscar e filtrar fretes por período, motorista, status e rota.
- **FR-020**: O sistema DEVE impedir a exclusão permanente de fretes com despesas ou acertos vinculados, realizando apenas inativação (soft-delete) com preservação do histórico.

#### Acerto Financeiro com Motorista

- **FR-021**: O sistema DEVE calcular automaticamente o valor da comissão do motorista como `valor bruto do frete × percentual de comissão`, usando aritmética em centavos inteiros. O único arredondamento permitido é `valorComissao = Math.round(valorBruto × percentual / 100)` para resolução de centavo fracionário; `saldoFinal = valorComissao − totalDeducoes` DEVE ser exato, sem nenhum arredondamento adicional.
- **FR-022**: O sistema DEVE permitir lançar deduções no acerto (vales sacados, adiantamentos, despesas de oficina por conta do motorista) com valor e descrição.
- **FR-023**: O sistema DEVE exibir o resumo do acerto com: valor bruto do frete, percentual e valor da comissão, cada dedução itemizada, e saldo líquido final (comissão − total de deduções), antes da confirmação do pagamento.
- **FR-024**: O sistema DEVE registrar o acerto como "realizado" ao ser confirmado pelo dono, alterando o status do frete para "acerto realizado".
- **FR-025**: O sistema DEVE gerar comprovante de acerto em PDF contendo: nome e dados do motorista, dados do frete, comissão detalhada, lista de deduções com valores, e saldo líquido final.
- **FR-026**: O sistema DEVE manter histórico de todos os acertos realizados por motorista, consultável pelo dono.
- **FR-027**: O motorista DEVE conseguir visualizar no app seu saldo atual e histórico de acertos realizados.
- **FR-028**: O painel DEVE exibir alerta para fretes com status "acerto pendente".

#### Caixa da Frota

- **FR-029**: O sistema DEVE consolidar no extrato do caixa todas as entradas (receitas de fretes) e saídas (comissões, combustível, borracharia, pátio, pedágio, manutenção, salários, IPVA, seguro, outros) do período selecionado.
- **FR-030**: O sistema DEVE permitir ao dono lançar saídas avulsas no caixa com valor, data e categoria.
- **FR-031**: O sistema DEVE calcular e exibir o lucro líquido real do período (total de receitas − total de todas as despesas).
- **FR-032**: O sistema DEVE exibir a composição de despesas por categoria com total e percentual sobre o total de despesas.

#### Dashboard e Relatórios

- **FR-033**: O dashboard DEVE exibir, para o período selecionado: receita bruta, total de fretes realizados, despesas totais e lucro líquido.
- **FR-034**: O dashboard DEVE exibir gráfico de receita versus despesa por mês e gráfico de composição de despesas por categoria.
- **FR-035**: O dashboard DEVE suportar filtro de período com opções: este mês, mês passado, últimos 3 meses, este ano e personalizado.
- **FR-036**: O sistema DEVE permitir exportar relatórios financeiros em PDF e Excel para qualquer período selecionado.

#### Aplicativo Mobile do Motorista

- **FR-037**: O app DEVE permitir ao motorista iniciar uma viagem registrando km inicial, origem, destino e tipo de carga diretamente no celular.
- **FR-038**: O app DEVE permitir ao motorista lançar despesas durante a viagem com categoria, valor e foto da nota fiscal tirada na hora.
- **FR-039**: O app DEVE permitir ao motorista encerrar a viagem com km final, exibindo resumo com km percorridos e total de despesas lançadas.
- **FR-040**: O app DEVE funcionar offline para registro de viagens e despesas, armazenando os dados localmente no dispositivo.
- **FR-041**: O app DEVE sincronizar automaticamente todos os dados registrados offline com o servidor assim que a conexão com a internet for restabelecida, sem intervenção do motorista.

---

### Key Entities *(include if feature involves data)*

- **Dono da Frota (Fleet Owner)**: Usuário administrador. Possui uma frota, cadastra caminhões e motoristas, registra fretes e acertos, visualiza relatórios. Atributos: nome, e-mail, WhatsApp, nome da frota, estado de operação.

- **Motorista (Driver)**: Usuário de campo. Vinculado a exatamente um caminhão por vez. Recebe convite do dono, acessa apenas o app mobile, registra viagens e despesas, consulta seus próprios acertos. Atributos: nome, WhatsApp, percentual de comissão, status (ativo/inativo).

- **Caminhão (Truck)**: Veículo da frota. Possui exatamente um motorista ativo vinculado. Atributos: placa, modelo, tipo de carroceria, status (ativo/inativo).

- **Frete (Freight)**: Unidade central de negócio. Representa uma viagem de transporte de carga. Atributos: caminhão, motorista, origem, destino, tipo de carga, km inicial, km final, valor bruto, status do ciclo de vida (em andamento / concluído / acerto pendente / acerto realizado), data.

- **Despesa de Frete (Freight Expense)**: Custo operacional vinculado a um frete específico. Atributos: categoria (combustível, borracharia, pátio, pedágio, outros), valor, descrição, foto da nota fiscal, data.

- **Acerto (Settlement)**: Registro financeiro do pagamento ao motorista referente a um frete. Calculado como `valor bruto × percentual − deduções`. Atributos: frete associado, motorista, valor da comissão, lista de deduções, saldo líquido, data de confirmação, comprovante PDF.

- **Dedução de Acerto (Settlement Deduction)**: Item de desconto dentro de um acerto. Atributos: tipo (vale, adiantamento, despesa de oficina, outro), valor, descrição.

- **Lançamento de Caixa (Cash Flow Entry)**: Entrada ou saída financeira da frota, podendo ser derivada de fretes/acertos ou lançada manualmente. Atributos: tipo (entrada/saída), valor, categoria, descrição, data.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O dono consegue registrar uma viagem completa (frete + despesas) e gerar o acerto financeiro do motorista em menos de 5 minutos, sem precisar abrir uma planilha ou grupo de WhatsApp.
- **SC-002**: O cálculo do acerto financeiro (comissão − deduções) é 100% preciso — zero diferença entre o valor exibido pelo sistema e o valor calculado manualmente com as mesmas entradas.
- **SC-003**: O motorista consegue registrar uma despesa de viagem com foto no app em menos de 60 segundos em condições normais de uso.
- **SC-004**: Os dados registrados pelo motorista offline aparecem no painel do dono em até 30 segundos após a reconexão com a internet.
- **SC-005**: O dashboard carrega e exibe todos os KPIs do período em menos de 3 segundos para uma frota com até 50 caminhões e 12 meses de histórico.
- **SC-006**: O comprovante de acerto em PDF é gerado e disponibilizado para download em menos de 10 segundos após a confirmação do pagamento.
- **SC-007**: Donos de frota com até 20 caminhões conseguem migrar completamente do Excel/WhatsApp para o FreteAgro dentro de 1 semana de uso, sem necessidade de suporte técnico.
- **SC-008**: Zero acesso cruzado entre frotas — nenhum dono consegue visualizar dados de outra frota em qualquer circunstância.
- **SC-009**: O relatório financeiro em PDF e Excel contém todos os dados necessários para uma revisão contábil sem precisar de informações adicionais externas.
- **SC-010**: O app mobile do motorista funciona em dispositivos Android com versão 8.0 ou superior e iOS com versão 14.0 ou superior, cobrindo mais de 95% dos smartphones em uso no Brasil.

---

## Assumptions

- O sistema atende exclusivamente ao mercado brasileiro, com moeda Real (BRL) e contexto agrícola nacional.
- A comunicação de convites e comprovantes ao motorista usa WhatsApp como canal primário, pois é o aplicativo de comunicação dominante no setor.
- Donos de frota possuem acesso a um computador ou tablet para usar o painel web; o painel web é responsivo e funcional em telas a partir de 375 px, mas o fluxo principal do dono é otimizado para desktop.
- Motoristas usam smartphones Android ou iOS para acessar o aplicativo mobile.
- O percentual de comissão é fixo por motorista e configurado no cadastro; variações por frete são tratadas como exceção e podem ser ajustadas via deduções ou lançamentos manuais.
- Um único acerto é gerado por frete; não há múltiplos acertos parciais para um mesmo frete.
- O sistema não integra com sistemas de rastreamento GPS de veículos na versão inicial; a quilometragem é registrada manualmente pelo motorista.
- O sistema não processa pagamentos — é um sistema de controle e comprovação; a transferência financeira ao motorista ocorre fora da plataforma (PIX, dinheiro, etc.).
- Relatórios de exportação para contador atendem ao formato padrão de planilhas e PDFs; integração direta com sistemas contábeis (como sistemas ERP) está fora do escopo inicial.
- O sistema suporta frotas de até 200 caminhões sem degradação de performance perceptível ao usuário.
- Dados históricos de fretes anteriores ao uso do FreteAgro não precisam ser migrados automaticamente na versão inicial; importação de dados legados está fora do escopo.
