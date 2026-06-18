// Portuguese (Brazil) translations.
// Keys use dotted notation. Add new namespaces as the system grows.

export const messages = {
  // Block category labels
  "categories.commerce": "Comércio",
  "categories.communication": "Comunicação",
  "categories.schedule": "Agenda",
  "categories.automation": "Automação",
  "categories.product": "Produto",
  "categories.marketing": "Marketing",
  "categories.sales": "Comercial",
  "categories.finance": "Finanças",
  "categories.legal": "Jurídico",
  "categories.media": "Mídia",
  "categories.data": "Dados",

  // Block names (in the order they appear in the registry)
  "blocks.products": "Produtos",
  "blocks.agents": "Agentes",
  "blocks.partners": "Vantagens",
  "blocks.perks": "Benefícios",
  "blocks.community": "Comunidade",
  "blocks.pages": "Páginas",
  "blocks.meetings": "Reuniões",
  "blocks.events": "Eventos",
  "blocks.tasks": "Tarefas",
  "blocks.knowledge": "Knowledge",
  "blocks.documents": "Documentos",
  "blocks.images": "Imagens",
  "blocks.videos": "Vídeos",
  "blocks.audios": "Áudios",
  "blocks.tables": "Tabelas",
  "blocks.forms": "Formulários",
  "blocks.links": "Links",
  "blocks.feeds": "Feeds",
  "blocks.apps": "Apps",
  "blocks.messages": "Mensagens",
  "blocks.notes": "Anotações",
  "blocks.locations": "Localizações",
  "blocks.feedbacks": "Feedbacks",
  "blocks.services": "Serviços",
  "blocks.contacts": "Contatos",
  "blocks.companies": "Empresas",
  "blocks.deals": "Oportunidades",
  "blocks.campaigns": "Campanhas",
  "blocks.experiences": "Experiências",
  "blocks.subscriptions": "Assinaturas",
  "blocks.routines": "Rotinas",

  // Experiences block
  "experiences.title": "Experiências",
  "experiences.subtitle":
    "Experiências oferecidas — workshops, retiros, vivências e eventos imersivos.",
  "experiences.create": "Nova experiência",
  "experiences.empty.title": "Nenhuma experiência cadastrada",
  "experiences.empty.body": 'Crie a primeira em "Nova experiência".',
  "experiences.fields.name": "Nome",
  "experiences.fields.headline": "Chamada",
  "experiences.fields.description": "Descrição",
  "experiences.fields.format": "Formato",
  "experiences.fields.status": "Status",
  "experiences.fields.location": "Local",
  "experiences.fields.startDate": "Início",
  "experiences.fields.endDate": "Término",
  "experiences.fields.duration": "Duração (min)",
  "experiences.fields.capacity": "Capacidade",
  "experiences.fields.price": "Preço",
  "experiences.fields.currency": "Moeda",
  "experiences.fields.coverImage": "Imagem de capa",
  "experiences.fields.tags": "Tags",
  "experiences.fields.host": "Anfitrião (UUID)",
  "experiences.format.IN_PERSON": "Presencial",
  "experiences.format.ONLINE": "Online",
  "experiences.format.HYBRID": "Híbrido",
  "experiences.format.SELF_PACED": "Auto-instrutivo",
  "experiences.status.DRAFT": "Rascunho",
  "experiences.status.SCHEDULED": "Agendada",
  "experiences.status.OPEN": "Aberta",
  "experiences.status.SOLD_OUT": "Esgotada",
  "experiences.status.IN_PROGRESS": "Acontecendo",
  "experiences.status.COMPLETED": "Concluída",
  "experiences.status.CANCELLED": "Cancelada",
  "experiences.filter.allStatus": "Todos os status",
  "experiences.filter.allFormats": "Todos os formatos",
  "experiences.search.placeholder": "Buscar nome, local…",

  // Routines block
  "routines.title": "Rotinas",
  "routines.subtitle":
    "Automações executadas pelos agentes — agendadas, manuais ou disparadas por eventos.",
  "routines.create": "Nova rotina",
  "routines.empty.title": "Nenhuma rotina configurada",
  "routines.empty.body": "Crie a primeira em \"Nova rotina\".",
  "routines.search.placeholder": "Buscar nome, agente, prompt…",
  "routines.filter.allStatus": "Todos os status",
  "routines.filter.allTriggers": "Todos os gatilhos",
  "routines.fields.name": "Nome",
  "routines.fields.description": "Descrição",
  "routines.fields.prompt": "Prompt",
  "routines.fields.promptHint":
    "Texto enviado ao agente. Use {{variável}} para placeholders.",
  "routines.fields.agent": "Agente",
  "routines.fields.trigger": "Gatilho",
  "routines.fields.cron": "Cron",
  "routines.fields.timezone": "Timezone",
  "routines.fields.eventBlock": "Bloco do evento",
  "routines.fields.eventType": "Tipo de evento",
  "routines.fields.inputs": "Inputs padrão (JSON)",
  "routines.fields.outputFormat": "Formato de saída",
  "routines.fields.tags": "Tags",
  "routines.fields.status": "Status & agente",
  "routines.trigger.MANUAL": "Manual",
  "routines.trigger.SCHEDULE": "Agendado",
  "routines.trigger.EVENT": "Evento",
  "routines.status.DRAFT": "Rascunho",
  "routines.status.ACTIVE": "Ativa",
  "routines.status.PAUSED": "Pausada",
  "routines.status.ARCHIVED": "Arquivada",
  "routines.runStatus.QUEUED": "Na fila",
  "routines.runStatus.RUNNING": "Rodando",
  "routines.runStatus.SUCCESS": "Sucesso",
  "routines.runStatus.FAILED": "Falhou",
  "routines.runStatus.CANCELLED": "Cancelada",
  "routines.runNow": "Rodar agora",
  "routines.pause": "Pausar",
  "routines.resume": "Retomar",
  "routines.lastRunAt": "Último run",
  "routines.nextRunAt": "Próximo",
  "routines.runCount": "{count} execuções",
  "routines.run.title": "Detalhes da execução",
  "routines.run.history": "Execuções",
  "routines.run.empty": "Nenhuma execução ainda.",
  "routines.run.trigger": "Gatilho",
  "routines.run.startedAt": "Início",
  "routines.run.completedAt": "Fim",
  "routines.run.duration": "Duração",
  "routines.run.tokens": "Tokens",
  "routines.run.input": "Input",
  "routines.run.output": "Output",
  "routines.run.error": "Erro",
  "routines.run.toastSuccess": "Rotina executada com sucesso",
  "routines.run.toastFailed": "Rotina falhou — veja o detalhe da execução",
  "routines.wizard.title": "Nova rotina",
  "routines.wizard.next": "Próximo",
  "routines.wizard.back": "Voltar",
  "routines.wizard.activate": "Ativar agora",
  "routines.wizard.saveDraft": "Salvar como rascunho",
  "routines.wizard.steps.identity": "Identidade",
  "routines.wizard.steps.agent": "Agente",
  "routines.wizard.steps.trigger": "Gatilho",
  "routines.wizard.steps.inputs": "Inputs",
  "routines.wizard.steps.prompt": "Prompt",
  "routines.wizard.steps.review": "Revisão",
  "routines.wizard.identity.namePlaceholder":
    "Ex: Resumo diário de oportunidades",
  "routines.wizard.identity.descriptionPlaceholder":
    "O que essa rotina faz e por que ela existe.",
  "routines.wizard.agent.help":
    "Escolha qual agente vai executar essa rotina. Use os filtros para encontrar o ideal.",
  "routines.wizard.trigger.manualHelp":
    'Roda quando alguém clicar em "Rodar agora".',
  "routines.wizard.trigger.scheduleHelp":
    "Roda em horários definidos por uma expressão cron.",
  "routines.wizard.trigger.eventHelp":
    "Roda quando algo acontece em outro bloco do sistema.",
  "routines.wizard.trigger.manualNote":
    'Sem disparador automático. Você pode rodar essa rotina a qualquer momento pelo botão "Rodar agora".',
  "routines.wizard.inputs.help":
    "Defina inputs padrão que ficam disponíveis no prompt como {{variável}}. Você pode sobrescrever na hora de rodar.",
  "routines.wizard.review.identity": "Identidade",
  "routines.wizard.review.agent": "Agente",
  "routines.wizard.review.trigger": "Gatilho",
  "routines.wizard.review.inputs": "Inputs padrão",
  "routines.wizard.review.prompt": "Prompt",
  "routines.wizard.steps.flow": "Fluxo",
  "routines.wizard.identity.subtitle":
    "Como essa rotina deve ser identificada na sua organização.",
  "routines.wizard.trigger.subtitle": "Quando essa rotina deve rodar.",
  "routines.wizard.flow.subtitle":
    "Desenhe o fluxo de execução. Clique num passo para configurar o agente, prompt e formato de saída. Use o botão + abaixo de cada passo para adicionar outro logo depois.",
  "routines.wizard.flow.invalidWarning":
    "{count} passo(s) ainda sem agente ou prompt — preencha pra continuar.",
  "routines.wizard.review.subtitle":
    "Confira tudo antes de salvar. Você pode voltar a qualquer passo pelo cabeçalho.",
  "routines.wizard.review.flow": "Fluxo",
  "routines.wizard.review.stepCount": "Total de passos",
  "routines.detail.flow": "Fluxo",
  "routines.detail.flowEditHint":
    "Clique num passo para editar; arraste para reposicionar; use + para adicionar passos.",
  "routines.detail.flowTraceHint":
    "Visualizando uma execução: passos verdes rodaram com sucesso, vermelhos falharam.",
  "routines.clearTrace": "Sair do modo execução",
  "routines.tooltip.name":
    "Como essa rotina aparece nas listas e nos logs. Use algo descritivo.",
  "routines.tooltip.description":
    "Detalhe o objetivo da rotina pra quem for ler depois (você ou outra pessoa do time).",
  "routines.tooltip.tags":
    "Etiquetas para agrupar rotinas relacionadas. Ajuda em buscas e filtros.",
  "routines.tooltip.triggerManual":
    'Você precisa clicar em "Rodar agora" cada vez. Bom para automações ad-hoc.',
  "routines.tooltip.triggerSchedule":
    "Roda automaticamente em horários definidos (ex: toda segunda às 9h).",
  "routines.tooltip.triggerEvent":
    'Roda quando algo acontece em outro bloco do sistema (ex: "deal vira WON").',
  "routines.tooltip.trigger": "O que faz a rotina começar a rodar.",
  "routines.tooltip.flow":
    "Sequência de passos que a rotina executa. Cada passo é um agente respondendo um prompt; o output de um passo pode virar input do próximo.",

  // Common UI
  "common.back": "Voltar",
  "common.save": "Salvar",
  "common.savedAt": "Salvo {time}",
  "common.cancel": "Cancelar",
  "common.delete": "Excluir",
  "common.create": "Criar",
  "common.confirmDelete": 'Excluir "{name}"?',
  "common.tags.add": "Adicionar tag…",
  "common.notes": "Notas",
  "common.view.kanban": "Visualização kanban",
  "common.view.list": "Visualização lista",
  "common.view.grid": "Visualização grid",

  // ============================================================
  // Ledger - Phase 1.5.4
  // ============================================================

  // Sub-panel
  "ledger.subpanel.chart_of_accounts": "Plano de Contas",
  "ledger.subpanel.journal_entries": "Lançamentos",

  // Page titles & headers
  "ledger.accounts.list.title": "Plano de Contas",
  "ledger.accounts.list.description":
    "Visualize todas as contas e seus saldos atuais.",
  "ledger.accounts.list.empty_state": "Nenhuma conta encontrada.",
  "ledger.accounts.list.search_placeholder": "Buscar por código ou nome",

  // Accounts list columns
  "ledger.accounts.column.code": "Código",
  "ledger.accounts.column.name": "Nome",
  "ledger.accounts.column.type": "Tipo",
  "ledger.accounts.column.currency": "Moeda",
  "ledger.accounts.column.balance": "Saldo",

  // Account types (singular)
  "ledger.account_type.asset": "Ativo",
  "ledger.account_type.liability": "Passivo",
  "ledger.account_type.equity": "Patrimônio",
  "ledger.account_type.revenue": "Receita",
  "ledger.account_type.expense": "Despesa",

  // Account detail page
  "ledger.account.detail.balance_label": "Saldo atual",
  "ledger.account.detail.total_debits": "Total de débitos",
  "ledger.account.detail.total_credits": "Total de créditos",
  "ledger.account.detail.statement_title": "Extrato",
  "ledger.account.detail.statement_with_count": "Extrato — {count} linhas",
  "ledger.account.detail.statement_with_count_one": "Extrato — 1 linha",
  "ledger.account.detail.load_more": "Carregar mais",
  "ledger.account.detail.no_movements": "Nenhuma movimentação registrada.",
  "ledger.account.detail.statement_empty":
    "Esta conta ainda não tem lançamentos.",

  // Statement table columns
  "ledger.statement.column.date": "Data",
  "ledger.statement.column.description": "Descrição",
  "ledger.statement.column.debit": "Débito",
  "ledger.statement.column.credit": "Crédito",
  "ledger.statement.column.balance": "Saldo",
  "ledger.statement.column.entry": "Lançamento",
  "ledger.statement.column.source": "Origem",
  "ledger.statement.column.direction": "Direção",
  "ledger.statement.column.amount": "Valor",
  "ledger.statement.action.view": "Ver",
  "ledger.statement.loading": "Carregando…",
  "ledger.statement.empty": "Nenhuma movimentação nesta conta.",
  "ledger.statement.load_failed": "Falha ao carregar mais linhas.",

  // Entries list page
  "ledger.entries.list.title": "Lançamentos Contábeis",
  "ledger.entries.list.description":
    "Histórico completo de todas as movimentações financeiras.",
  "ledger.entries.list.empty_state": "Nenhum lançamento encontrado.",

  // Entry detail page
  "ledger.entry.detail.title": "Detalhes do Lançamento",
  "ledger.entry.detail.posted_at": "Data",
  "ledger.entry.detail.description": "Descrição",
  "ledger.entry.detail.source": "Origem",
  "ledger.entry.detail.lines_title": "Linhas",
  "ledger.entry.detail.reversal_badge": "Estorno",
  "ledger.entry.detail.reversed_badge": "Estornado",
  "ledger.entry.detail.reversed_by": "Estornado por",
  "ledger.entry.detail.reverses": "Estorna",
  "ledger.entry.detail.section_details": "Detalhes",
  "ledger.entry.detail.source_id": "ID de origem",
  "ledger.entry.detail.created_at": "Criado em",
  "ledger.entry.detail.idempotency_key": "Chave de idempotência",
  "ledger.entry.detail.metadata": "Metadados",
  "ledger.entry.detail.lines_with_count": "Linhas ({count})",
  "ledger.entry.detail.line.account": "Conta",
  "ledger.entry.detail.line.type": "Tipo",
  "ledger.entry.detail.line.direction": "Direção",
  "ledger.entry.detail.line.amount": "Valor",

  // Source kinds (badges) — matches JournalEntrySourceKind enum
  "ledger.source_kind.transaction": "Transação",
  "ledger.source_kind.commission": "Comissão",
  "ledger.source_kind.refund": "Reembolso",
  "ledger.source_kind.manual_adjustment": "Ajuste manual",
  "ledger.source_kind.seed": "Seed inicial",
  "ledger.source_kind.reversal": "Estorno",

  // Common errors
  "error.common.unknown": "Ocorreu um erro inesperado. Tente novamente.",

  // Ledger errors
  "error.ledger.account_not_found": "Conta {accountCode} não encontrada.",
  "error.ledger.account_archived": "A conta {accountCode} está arquivada.",
  "error.ledger.invalid_currency": "Moeda inválida: {received}.",
  "error.ledger.unsupported_currency": "Moeda não suportada: {received}.",
  "error.ledger.currency_mismatch":
    "Conflito de moeda na conta {accountCode}: esperado {accountCurrency}, recebido {lineCurrency}.",
  "error.ledger.insufficient_lines":
    "Lançamento precisa ter ao menos duas linhas.",
  "error.ledger.non_positive_amount": "Valores devem ser maiores que zero.",
  "error.ledger.unbalanced_entry": "Lançamento desbalanceado.",
  "error.ledger.invalid_source_id": "Identificador de origem inválido: {received}.",
  "error.ledger.invalid_source_kind": "Tipo de origem inválido: {received}.",
  "error.ledger.idempotency_conflict":
    "Conflito de idempotência: a chave {idempotencyKey} já foi usada com payload diferente.",
  "error.ledger.entry_not_found": "Lançamento {entryId} não encontrado.",
  "error.ledger.invalid_cursor": "Cursor de paginação inválido.",
  "error.ledger.statement_limit_exceeded":
    "Limite de extrato excedido (máximo {max}).",
  "error.ledger.cannot_reverse_reversal":
    "Não é possível estornar um estorno.",
  "error.ledger.entry_already_reversed":
    "Lançamento {originalEntryId} já foi estornado.",
  "error.ledger.missing_reversal_reason": "Motivo do estorno é obrigatório.",
  "error.ledger.error": "Erro no sistema contábil.",

  // Domain events errors (used by UI when these surface)
  "error.domain_events.idempotency_conflict":
    "Conflito de idempotência ao gravar evento.",
  "error.domain_events.handler_execution": "Erro ao processar evento.",
  "error.domain_events.error": "Erro no sistema de eventos.",

  // Money errors
  "error.money.currency_mismatch":
    "Operação entre valores em moedas diferentes.",
  "error.money.invalid": "Valor monetário inválido.",

  // ============================================================
  // Common (shared across ≥3 features) - Phase 1.5.5
  // ============================================================

  // Actions
  "common.actions.save": "Salvar",
  "common.actions.cancel": "Cancelar",
  "common.actions.delete": "Excluir",
  "common.actions.edit": "Editar",
  "common.actions.create": "Criar",
  "common.actions.close": "Fechar",
  "common.actions.confirm": "Confirmar",
  "common.actions.back": "Voltar",
  "common.actions.next": "Próximo",
  "common.actions.submit": "Enviar",
  "common.actions.search": "Buscar",
  "common.actions.filter": "Filtrar",
  "common.actions.sort": "Ordenar",
  "common.actions.export": "Exportar",
  "common.actions.import": "Importar",
  "common.actions.reset": "Redefinir",
  "common.actions.apply": "Aplicar",
  "common.actions.refresh": "Atualizar",
  "common.actions.try_again": "Tentar novamente",
  "common.actions.load_more": "Carregar mais",
  "common.actions.view_details": "Ver detalhes",

  // States
  "common.states.loading": "Carregando…",
  "common.states.error": "Erro ao carregar",
  "common.states.empty": "Nenhum resultado",
  "common.states.success": "Concluído",
  "common.states.saving": "Salvando…",
  "common.states.deleting": "Excluindo…",
  "common.states.processing": "Processando…",
  "common.states.no_results": "Nenhum resultado encontrado",
  "common.states.no_results_for_query": "Nenhum resultado para \"{query}\"",

  // Placeholders
  "common.placeholders.search": "Buscar…",
  "common.placeholders.select": "Selecione…",
  "common.placeholders.type_to_filter": "Digite para filtrar",

  // Confirmations
  "common.confirmations.are_you_sure": "Tem certeza?",
  "common.confirmations.this_cannot_be_undone":
    "Esta ação não pode ser desfeita.",
  "common.confirmations.type_to_confirm":
    "Digite \"{value}\" para confirmar",

  // Feedback
  "common.feedback.saved_successfully": "Salvo com sucesso",
  "common.feedback.deleted_successfully": "Excluído com sucesso",
  "common.feedback.created_successfully": "Criado com sucesso",
  "common.feedback.updated_successfully": "Atualizado com sucesso",
  "common.feedback.error_occurred": "Ocorreu um erro",

  // Units (cravado em 1.5.6a-bis)
  "common.units.months_one": "{count} mês",
  "common.units.months_other": "{count} meses",
  "common.units.models_one": "{count} modelo",
  "common.units.models_other": "{count} modelos",
  "common.units.scenarios_one": "{count} cenário",
  "common.units.scenarios_other": "{count} cenários",
  "common.units.of_total": "{current} de {total}",

  // Time
  "common.time.today": "Hoje",
  "common.time.yesterday": "Ontem",
  "common.time.this_week": "Esta semana",
  "common.time.this_month": "Este mês",
  "common.time.last_updated": "Última atualização",
  "common.time.never": "Nunca",

  // ============================================================
  // Navigation (sidebar + sub-panel chrome) - Phase 1.5.5
  // ============================================================

  // Sidebar top-level
  "nav.sidebar.dashboard": "Dashboard",
  "nav.sidebar.chat": "Chat",
  "nav.sidebar.organization": "Organização",
  "nav.sidebar.knowledge": "Conhecimento",
  "nav.sidebar.handbook": "Handbook",
  "nav.sidebar.network": "Rede",
  "nav.sidebar.marketplace": "Marketplace",
  "nav.sidebar.ledger": "Ledger",
  "nav.sidebar.agents": "Agentes",
  "nav.sidebar.areas": "Áreas",
  "nav.sidebar.tools": "Ferramentas",
  "nav.sidebar.blocks": "Blocos",
  "nav.sidebar.integrations": "Integrações",
  "nav.sidebar.home": "Início",
  "nav.sidebar.learn": "Aprender",
  "nav.sidebar.explore": "Explorar",
  "nav.sidebar.exercise": "Exercício",
  "nav.sidebar.nutrition": "Nutrição",
  "nav.sidebar.hydration": "Hidratação",
  "nav.sidebar.sleep": "Sono",
  "nav.sidebar.recovery": "Recuperação",
  "nav.sidebar.notifications": "Notificações",
  "nav.sidebar.memories": "Memórias",
  "nav.sidebar.help_center": "Central de Ajuda",
  "nav.sidebar.organize": "Organizar",
  "nav.sidebar.sell": "Vender",
  "nav.sidebar.earn": "Ganhos",
  "nav.sidebar.members": "Membros",
  "nav.sidebar.role_overrides": "Permissões",
  "nav.sidebar.roadmap": "Roadmap",
  "nav.sidebar.fitness_spaces": "Espaços Fitness",
  "nav.sidebar.work": "Trabalho",
  "nav.sidebar.workflow": "Fluxo de Trabalho",

  // Sub-panel chrome (generic, used in every panel)
  "nav.subpanel.collapse": "Recolher painel",
  "nav.subpanel.expand": "Expandir painel",

  // Breadcrumb (only segments that are NOT top-level features —
  // top-level segments reuse nav.sidebar.*)
  "nav.breadcrumb.home": "Início",
  "nav.breadcrumb.new": "Novo",
  "nav.breadcrumb.settings": "Configurações",

  // ============================================================
  // Shell (top-bar / profile dropdown / errors) - Phase 1.5.5
  // ============================================================

  // Sidebar header
  "shell.sidebar.pin": "Fixar barra lateral",
  "shell.sidebar.unpin": "Desfixar barra lateral",
  "shell.sidebar.administrator": "Administrador",

  // Profile dropdown
  "shell.profile.view_profile": "Ver perfil",
  "shell.profile.settings": "Configurações",
  "shell.profile.appearance": "Aparência",
  "shell.profile.theme.light": "Claro",
  "shell.profile.theme.dark": "Escuro",
  "shell.profile.language": "Idioma",
  "shell.profile.logout": "Sair",

  // Error boundaries (generic chrome)
  "shell.error.something_went_wrong": "Algo deu errado",
  "shell.error.try_again": "Tentar novamente",
  "shell.error.go_home": "Voltar ao início",
  "shell.error.go_back": "Voltar",
  "shell.error.page_not_found": "Página não encontrada",
  "shell.error.page_not_found_description":
    "A página que você procura não existe ou foi movida.",
  "shell.error.temporary_issue":
    "Algo deu errado. Geralmente é um problema temporário.",

  // ============================================================
  // Commissions - Phase 1.5.6a
  // ============================================================

  // Page header
  "commissions.page.title": "Estruturas de Comissão",
  "commissions.page.description":
    "Defina como o time de vendas D2D é remunerado e veja o impacto na margem.",

  // Tabs
  "commissions.tabs.structures": "Estruturas",
  "commissions.tabs.simulator": "Simulador",

  // Structures list
  "commissions.structures.banner":
    "Estruturas de comissão definem como seus reps são pagos — bônus de cadastro únicos somados a residuais mensais. Apenas uma pode estar ativa por vez.",
  "commissions.structures.new_button": "Nova estrutura",
  "commissions.structures.empty_title": "Nenhuma estrutura de comissão ainda",
  "commissions.structures.empty_description":
    "Crie sua primeira estrutura para definir como o time D2D ganha bônus e residuais.",
  "commissions.structures.active_badge": "Ativa",
  "commissions.structures.stat_residual": "Residual",
  "commissions.structures.stat_clawback": "Clawback",
  "commissions.structures.stat_clawback_days": "{days} dias",
  "commissions.structures.stat_tiers": "Faixas",
  "commissions.structures.stat_tiers_configured": "{count} configuradas",
  "commissions.structures.accelerator_label": "{value}x acelerador",
  "commissions.structures.action_edit": "Editar",
  "commissions.structures.action_activate": "Ativar",
  "commissions.structures.action_deactivate": "Desativar",
  "commissions.structures.action_delete": "Excluir",
  "commissions.structures.confirm_delete": 'Excluir "{name}"?',

  // Editor
  "commissions.editor.title_create": "Nova Estrutura de Comissão",
  "commissions.editor.title_edit": "Editar Estrutura de Comissão",
  "commissions.editor.subtitle_create":
    "Configure um novo plano de remuneração para o time D2D.",
  "commissions.editor.subtitle_edit":
    "Atualize como os reps são remunerados sob este plano.",
  "commissions.editor.field.name": "Nome da Estrutura",
  "commissions.editor.field.name_placeholder":
    'ex.: "Lançamento 2026" ou "Verão"',
  "commissions.editor.field.active": "Ativa",
  "commissions.editor.section.residual_clawback": "Residual & Clawback",
  "commissions.editor.field.residual_percent": "Residual (%)",
  "commissions.editor.field.residual_help":
    "% do pagamento mensal de cada assinante que vai ao rep que o cadastrou, todo mês.",
  "commissions.editor.field.clawback_window": "Janela de clawback (dias)",
  "commissions.editor.field.clawback_help":
    "Se um assinante cancelar dentro desta janela, o bônus de cadastro do rep é estornado. Padrão: 30-90 dias.",
  "commissions.editor.field.notes": "Notas (opcional)",
  "commissions.editor.field.notes_placeholder":
    "Notas internas sobre este plano de comissão…",
  "commissions.editor.section.tier_bonuses": "Bônus de Cadastro por Faixa",
  "commissions.editor.section.tier_bonuses_help":
    "Bônus único em dinheiro por novo assinante. Faixas mais altas = bônus maiores para incentivar vendas premium.",
  "commissions.editor.field.bonus": "Bônus ($)",
  "commissions.editor.field.threshold": "Limite Acel.",
  "commissions.editor.field.multiplier": "Multiplicador",
  "commissions.editor.accelerator_help":
    "Acelerador: quando um rep ultrapassa o % de meta, o bônus é multiplicado (ex.: 1,5x = 50% a mais).",
  "commissions.editor.action_save_create": "Criar Estrutura",
  "commissions.editor.action_save_edit": "Salvar Alterações",

  // Simulator
  "commissions.simulator.no_active_title": "Nenhuma estrutura ativa",
  "commissions.simulator.no_active_description":
    "Vá para a aba Estruturas e ative uma. O simulador usa as taxas da estrutura ativa para calcular os resultados.",
  "commissions.simulator.intro":
    "Modele cenários para ver como mudanças afetam o custo total de comissão.",
  "commissions.simulator.input.sales_team_title": "Time de Vendas",
  "commissions.simulator.input.sales_team_tooltip":
    "Quantos reps porta-a-porta você tem e a média mensal de vendas por rep.",
  "commissions.simulator.input.reps": "Reps",
  "commissions.simulator.input.sales_per_rep": "Vendas/Rep/Mês",
  "commissions.simulator.input.new_subs_per_month":
    "{count} novos assinantes/mês",
  "commissions.simulator.input.subs_title": "Assinantes Existentes",
  "commissions.simulator.input.subs_tooltip":
    "Sua base ativa atual. Dirige o cálculo do residual — % mensal contínuo pago aos reps sobre assinantes retidos.",
  "commissions.simulator.input.subs_total": "Total Ativos",
  "commissions.simulator.input.accelerator_title": "Acelerador",
  "commissions.simulator.input.accelerator_tooltip":
    "Top reps que ultrapassam a meta ganham multiplicador no bônus de cadastro. Defina que % do time deve atingir esse nível.",
  "commissions.simulator.input.accelerator_label":
    "% Reps Ultrapassando Meta",
  "commissions.simulator.input.billing_title": "Mix de Cobrança",
  "commissions.simulator.input.billing_tooltip":
    "Como assinantes pagam. Planos semestral/anual têm desconto, então o mix afeta receita média e cálculo de residual.",
  "commissions.simulator.input.billing_monthly": "Mensal %",
  "commissions.simulator.input.billing_biannual": "Semestral %",
  "commissions.simulator.input.billing_annual": "Anual %",
  "commissions.simulator.input.billing_must_total":
    "Deve totalizar 100% (atual {value}%)",
  "commissions.simulator.input.tier_title": "Mix de Vendas por Faixa",
  "commissions.simulator.input.tier_tooltip":
    "% de novos cadastros em cada faixa. Faixas maiores têm bônus maiores. Afeta custo médio por cadastro.",
  "commissions.simulator.input.tier_must_total":
    "Deve totalizar 100% (atual {value}%)",
  "commissions.simulator.input.tier_bonus_label": "{value} de bônus",
  "commissions.simulator.metric.new_subs": "Novos Assinantes/Mês",
  "commissions.simulator.metric.new_subs_sublabel":
    "Total de cadastros novos somando todos os reps",
  "commissions.simulator.metric.signup_bonuses": "Bônus de Cadastro",
  "commissions.simulator.metric.signup_bonuses_sublabel":
    "Bônus únicos pagos neste mês",
  "commissions.simulator.metric.monthly_residuals": "Residuais Mensais",
  "commissions.simulator.metric.monthly_residuals_sublabel":
    "Pagamentos contínuos sobre assinantes retidos",
  "commissions.simulator.metric.total_commission": "Comissão Total",
  "commissions.simulator.metric.total_commission_sublabel":
    "Bônus + residuais combinados",
  "commissions.simulator.mini.pct_of_revenue": "% da Receita",
  "commissions.simulator.mini.annual_cost": "Custo Anual",
  "commissions.simulator.mini.cost_per_new_sub": "Custo/Novo Sub",
  "commissions.simulator.mini.residual_rate": "Taxa Residual",
  "commissions.simulator.breakdown.title": "Detalhamento por Faixa",
  "commissions.simulator.breakdown.subs_summary":
    "{newSubs} novos + {existingSubs} existentes",
  "commissions.simulator.breakdown.per_month_suffix": "/mês",
  "commissions.simulator.breakdown.bonus_per_sub": "{value}/sub bônus",
  "commissions.simulator.breakdown.upfront": "{value} adiantado",
  "commissions.simulator.breakdown.residual": "{value} residual",
  "commissions.simulator.warning_title":
    "Comissão excede 20% da receita",
  "commissions.simulator.warning_description":
    "Considere reduzir bônus, baixar o % residual ou apertar os limites do acelerador.",

  // Toasts
  "commissions.feedback.created": "Estrutura criada.",
  "commissions.feedback.updated": "Estrutura atualizada.",
  "commissions.feedback.deleted": "Estrutura excluída.",
  "commissions.feedback.activated": "Estrutura ativada.",
  "commissions.feedback.deactivated": "Estrutura desativada.",
  "commissions.feedback.save_failed": "Falha ao salvar a estrutura.",

  // ============================================================
  // Financials - Phase 1.5.6a-bis
  // ============================================================

  // Projections Agent panel
  "financials.agent.display_name": "Arquiteto de Projeções",
  "financials.agent.subtitle": "Modelagem financeira & análise what-if",
  "financials.agent.placeholder": "Pergunte sobre projeções…",
  "financials.agent.empty_state":
    "Eu gerencio todas as suas projeções financeiras. Peça para rodar cenários, ajustar premissas, comparar modelos, ou construir novas projeções a partir de dados ao vivo do sistema.",
  "financials.agent.prompt_what_scenarios": "Quais cenários temos?",
  "financials.agent.prompt_default_run":
    "Rode uma projeção com os defaults atuais do sistema",
  "financials.agent.prompt_what_if_reps":
    "O que acontece se dobrarmos os reps de vendas?",

  // Scenario manager (saved scenarios)
  "financials.scenarios.title": "Cenários",
  "financials.scenarios.placeholder": "Nome do cenário…",
  "financials.scenarios.action_save": "Salvar",
  "financials.scenarios.section_saved": "Salvos",
  "financials.scenarios.action_load_title": "Carregar este cenário",
  "financials.scenarios.action_delete_title": "Excluir este cenário",
  "financials.scenarios.error_enter_name":
    "Digite um nome para o cenário",
  "financials.scenarios.error_no_results": "Sem resultados para salvar",
  "financials.scenarios.error_save_failed": "Falha ao salvar",
  "financials.scenarios.confirm_delete": 'Excluir cenário "{name}"?',
  "financials.scenarios.feedback.saved": "Cenário salvo",
  "financials.scenarios.feedback.loaded": "Cenário carregado",
  "financials.scenarios.feedback.deleted": "Cenário excluído",

  // Charts
  "financials.charts.projection_title": "Projeção de {months} meses",
  "financials.charts.projection_description":
    "Receita, custos, lucro e lucro acumulado ao longo de {months} meses",
  "financials.charts.legend_revenue": "Receita",
  "financials.charts.legend_costs": "Custos",
  "financials.charts.legend_profit": "Lucro",
  "financials.charts.legend_cumulative_profit": "Lucro acumulado",
  "financials.charts.no_data": "Sem dados para exibir",
  "financials.charts.empty_title": "Sem resultados para o gráfico",
  "financials.charts.empty_description":
    "Configure os inputs do cenário para gerar gráficos.",
  "financials.charts.revenue_by_tier_title": "Receita por faixa em {label}",
  "financials.charts.revenue_by_tier_description":
    "Contribuição de receita em {label} por cada faixa de assinatura",
  "financials.charts.pl_waterfall_title": "Cascata de DRE em {label}",
  "financials.charts.pl_waterfall_description":
    "Como a receita flui pelos custos até a margem líquida",
  "financials.charts.cost_breakdown_title": "Composição de custos em {label}",
  "financials.charts.cost_breakdown_description":
    "Para onde sua receita vai — margem, COGS, comissões e overhead",
  "financials.charts.operation_breakeven_title": "Breakeven da operação",
  "financials.charts.operation_breakeven_description":
    "Lucro acumulado ao longo de 24 meses — breakeven {status}",
  "financials.charts.operation_breakeven_not_reached": "não alcançado",
  "financials.charts.operation_breakeven_at_month": "no mês {month}",
  "financials.charts.month_label": "M{month}",
  "financials.charts.opex_scaled_legend": "OPEX (escalado)",
  "financials.charts.bar_revenue": "Receita",
  "financials.charts.bar_product": "Produto",
  "financials.charts.bar_fulfillment": "Fulfillment",
  "financials.charts.bar_commission": "Comissão",
  "financials.charts.bar_kickbacks": "Kickbacks",
  "financials.charts.bar_overhead": "Overhead",
  "financials.charts.bar_net": "Líquido",
  "financials.charts.pie_net_margin": "Margem líquida",
  "financials.charts.pie_cogs": "COGS",
  "financials.charts.pie_commissions": "Comissões",
  "financials.charts.pie_overhead": "Overhead",

  // Metrics panel
  "financials.metrics.empty_title": "Nenhum resultado ainda",
  "financials.metrics.empty_description":
    "Configure os inputs do cenário para ver as projeções financeiras.",
  "financials.metrics.per_tier_breakdown": "Detalhamento por faixa",

  "financials.metrics.ltv_cac.title": "Análise LTV / CAC",
  "financials.metrics.ltv_cac.description":
    "Valor vitalício vs custo de aquisição por cliente",
  "financials.metrics.ltv_cac.tooltip":
    "Compara quanto um cliente vale ao longo da sua vida (LTV) com quanto custa adquiri-lo (CAC). Uma razão de 3x+ é saudável.",
  "financials.metrics.ltv_cac.blended_ltv": "LTV Combinado",
  "financials.metrics.ltv_cac.blended_ltv_sub": "Valor vitalício por cliente",
  "financials.metrics.ltv_cac.blended_cac": "CAC Combinado",
  "financials.metrics.ltv_cac.blended_cac_sub": "Custo para adquirir um cliente",
  "financials.metrics.ltv_cac.ratio": "LTV : CAC",
  "financials.metrics.ltv_cac.ratio_short": "LTV:CAC",
  "financials.metrics.ltv_cac.payback_period": "Período de Payback",
  "financials.metrics.ltv_cac.healthy": "Saudável (3x+ é ótimo)",
  "financials.metrics.ltv_cac.needs_improvement":
    "Precisa melhorar (mire em 3x+)",
  "financials.metrics.ltv_cac.losing_money": "Perdendo dinheiro na aquisição",
  "financials.metrics.ltv_cac.months_to_recover": "Meses para recuperar o CAC",
  "financials.metrics.ltv_cac.ltv_label": "LTV",
  "financials.metrics.ltv_cac.cac_label": "CAC",
  "financials.metrics.ltv_cac.payback_label": "Payback",

  "financials.metrics.sales.title": "Canal de Reps de Vendas",
  "financials.metrics.sales.description":
    "Quantidade de reps, novos assinantes e crescimento",
  "financials.metrics.sales.tooltip":
    "Métricas do seu canal de aquisição via reps — reps iniciais, geração de assinantes no mês 1, e reps projetados no mês 12.",
  "financials.metrics.sales.mo1_reps": "Reps Mês 1",
  "financials.metrics.sales.mo1_new_subs": "Novos Subs Mês 1",
  "financials.metrics.sales.reps_mo12": "Reps no Mês 12",

  "financials.metrics.revenue.title": "Receita",
  "financials.metrics.revenue.description":
    "Receita total e receita por assinante",
  "financials.metrics.revenue.tooltip":
    "Receita recorrente total para o período selecionado, mais a receita média combinada por assinante em todas as faixas e ciclos de cobrança.",
  "financials.metrics.revenue.label": "Receita",
  "financials.metrics.revenue.revenue_per_sub": "Receita/Sub",
  "financials.metrics.revenue.arr": "ARR de Saída",

  "financials.metrics.cogs.title": "COGS",
  "financials.metrics.cogs.description":
    "Custos de produto, fulfillment e por assinante",
  "financials.metrics.cogs.tooltip":
    "Custo dos bens vendidos — custos totais de produto, despesas de fulfillment e o custo combinado por assinante.",
  "financials.metrics.cogs.total": "COGS Total",
  "financials.metrics.cogs.fulfillment": "Fulfillment",
  "financials.metrics.cogs.cost_per_sub": "Custo/Sub",

  "financials.metrics.commissions.title": "Comissões",
  "financials.metrics.commissions.description":
    "Despesa total, por sub e % da receita",
  "financials.metrics.commissions.tooltip":
    "Despesa total com comissões incluindo bônus iniciais e pagamentos residuais, detalhada por assinante e como percentual da receita total.",
  "financials.metrics.commissions.total": "Comissão Total",
  "financials.metrics.commissions.per_sub": "Comissão/Sub",
  "financials.metrics.commissions.percent_of_revenue": "% da Receita",

  "financials.metrics.partners.title": "Parceiros & Breakage",
  "financials.metrics.partners.description":
    "Receita de kickback e economias de crédito",
  "financials.metrics.partners.tooltip":
    "Receita proveniente de kickbacks de marcas parceiras. Economias de breakage representam COGS evitados por créditos não resgatados — já refletido em valores menores de COGS.",
  "financials.metrics.partners.kickback_revenue": "Receita de Kickback",
  "financials.metrics.partners.breakage_savings": "Economia de Breakage",

  "financials.metrics.margins.title": "Margens",
  "financials.metrics.margins.description":
    "Margem bruta e líquida em valores e percentual",
  "financials.metrics.margins.tooltip":
    "Margem bruta (receita menos COGS) e margem líquida (após todas as despesas, incluindo comissões e overhead).",
  "financials.metrics.margins.gross": "Margem Bruta",
  "financials.metrics.margins.gross_percent": "Margem Bruta %",
  "financials.metrics.margins.net": "Margem Líquida",
  "financials.metrics.margins.net_percent": "Margem Líquida %",

  "financials.metrics.profit_split.title": "Divisão de Lucro",
  "financials.metrics.profit_split.description":
    "Como os lucros do canal são divididos entre as partes",
  "financials.metrics.profit_split.tooltip":
    "Após todos os custos, o lucro líquido restante é dividido entre as partes definidas conforme os percentuais acordados.",
  "financials.metrics.profit_split.unnamed": "Sem nome",
  "financials.metrics.profit_split.undistributed_percent":
    "Não distribuído ({percent}%)",

  "financials.metrics.tier_details.title": "Detalhes por Faixa",
  "financials.metrics.tier_details.description":
    "Receita, COGS e margem por faixa de assinatura",
  "financials.metrics.tier_details.tooltip":
    "Análise detalhada por faixa mostrando contagem de assinantes, receita por assinante, estrutura de custos, margem e valor vitalício para cada faixa.",
  "financials.metrics.tier_details.subscribers_count": "{count} assinantes",
  "financials.metrics.tier_details.margin_label": "{value} de margem",
  "financials.metrics.tier_details.rev_per_sub": "Rec: {value}/sub",
  "financials.metrics.tier_details.cogs_per_sub": "COGS: {value}/sub",
  "financials.metrics.tier_details.ltv_label": "LTV: {value}",
  "financials.metrics.tier_details.avg_life": "Vida média",
  "financials.metrics.tier_details.months_short": "{months} m",

  // Executive summary
  "financials.summary.empty_title": "Nenhum resultado ainda",
  "financials.summary.empty_description":
    "Configure os inputs do cenário para ver o resumo executivo.",

  "financials.summary.verdict.net_margin": "Margem Líquida",
  "financials.summary.verdict.net_margin_sub": "{value}/mês",
  "financials.summary.verdict.ltv_cac": "Razão LTV:CAC",
  "financials.summary.verdict.ltv_cac_sub": "LTV {ltv} / CAC {cac}",
  "financials.summary.verdict.breakeven": "Breakeven",
  "financials.summary.verdict.breakeven_month": "Mês {month}",
  "financials.summary.verdict.breakeven_year1": "Dentro do Ano 1",
  "financials.summary.verdict.breakeven_year2": "Ano 2",
  "financials.summary.verdict.breakeven_negative":
    "Lucro acumulado permanece negativo",

  "financials.summary.margin.interpretation.strong":
    "Economia unitária forte — sustenta escala agressiva",
  "financials.summary.margin.interpretation.healthy":
    "Margens saudáveis — espaço para investir em crescimento",
  "financials.summary.margin.interpretation.thin":
    "Margens apertadas — monitore os custos de perto",
  "financials.summary.margin.interpretation.breakeven":
    "Empatando — otimize antes de escalar",
  "financials.summary.margin.interpretation.negative":
    "Margens negativas — reestruture custos antes de escalar",

  "financials.summary.ltvcac.interpretation.infinite":
    "Infinito — churn zero significa que clientes nunca saem",
  "financials.summary.ltvcac.interpretation.excellent":
    "Excelente — cada dólar gasto adquire 5x+ em valor vitalício",
  "financials.summary.ltvcac.interpretation.healthy":
    "Saudável — economia unitária sustenta a escala",
  "financials.summary.ltvcac.interpretation.cautious":
    "Cauteloso — positivo mas com pouca margem para erro",
  "financials.summary.ltvcac.interpretation.barely_positive":
    "Mal positivo — custo de aquisição quase iguala valor vitalício",
  "financials.summary.ltvcac.interpretation.negative":
    "Negativo — você perde dinheiro em cada cliente adquirido",

  "financials.summary.breakeven.interpretation.never":
    "Não atinge breakeven dentro de 24 meses",
  "financials.summary.breakeven.interpretation.fast":
    "Payback rápido — modelo eficiente em capital",
  "financials.summary.breakeven.interpretation.solid":
    "Sólido — lucratividade dentro do Ano 1",
  "financials.summary.breakeven.interpretation.moderate":
    "Runway moderado — planeje 18 meses de financiamento",
  "financials.summary.breakeven.interpretation.long":
    "Runway longo necessário — 2+ anos para lucratividade",

  "financials.summary.key_metrics.title": "Métricas-chave",
  "financials.summary.key_metrics.mrr": "MRR",
  "financials.summary.key_metrics.arr": "ARR de Saída",
  "financials.summary.key_metrics.gross_margin": "Margem Bruta",
  "financials.summary.key_metrics.new_subs_per_mo": "Novos Subs/Mês",
  "financials.summary.key_metrics.commission_pct_revenue":
    "Comissão % da Receita",
  "financials.summary.key_metrics.cost_per_sub": "Custo/Assinante",
  "financials.summary.key_metrics.payback_period": "Período de Payback",
  "financials.summary.key_metrics.months_value": "{months} meses",
  "financials.summary.key_metrics.mo24_subscribers": "Assinantes no Mês 24",

  "financials.summary.provenance.title": "Fontes das Premissas",
  "financials.summary.provenance.tier_pricing": "Preços por Faixa",
  "financials.summary.provenance.tiers_configured":
    "{count} faixas configuradas",
  "financials.summary.provenance.commissions": "Comissões",
  "financials.summary.provenance.commissions_detail":
    "${bonus} de bônus + {residual}% residual",
  "financials.summary.provenance.opex": "OPEX",
  "financials.summary.provenance.opex_scaled":
    "Auto-escalado a partir de {count} categorias",
  "financials.summary.provenance.opex_fixed": "Fixo em {value}/mês",
  "financials.summary.provenance.sales_rep_channel": "Canal de Reps de Vendas",
  "financials.summary.provenance.sales_rep_detail":
    "{reps} reps, {sales} vendas/rep/mês",
  "financials.summary.provenance.partner_kickbacks": "Kickbacks de Parceiros",
  "financials.summary.provenance.partners_count":
    "{count} parceiros ativos",
  "financials.summary.provenance.source_plans": "Página de Planos",
  "financials.summary.provenance.source_promoters": "Página de Promoters",
  "financials.summary.provenance.source_operations_live":
    "Página de Operações (ao vivo)",
  "financials.summary.provenance.source_manual_override": "Override manual",
  "financials.summary.provenance.live_badge": "Ao vivo",
  "financials.summary.provenance.source_manual_input": "Entrada manual",
  "financials.summary.provenance.source_brands": "Página de Marcas",

  "financials.summary.trajectory.title": "Trajetória de 24 Meses",
  "financials.summary.trajectory.month_label": "Mês {month}",
  "financials.summary.trajectory.subs_label": "{count} subs",
  "financials.summary.trajectory.cum_label": "Acum: {value}",

  "financials.summary.validation.title": "Notas de Validação",
  "financials.summary.validation.billing_distribution":
    "Distribuição de cobrança soma {value}%, não 100%",
  "financials.summary.validation.tier_distribution":
    "Distribuição de assinantes por faixa soma {value}%, não 100%",
  "financials.summary.validation.deeply_negative":
    "Margem líquida está profundamente negativa — revise as premissas de custos",
  "financials.summary.validation.profit_split_total":
    "Percentuais de divisão de lucro totalizam {value}%, não 100%",
  "financials.summary.validation.churn_optimistic":
    "Churn médio abaixo de 2% é muito otimista para um negócio de assinatura",
  "financials.summary.validation.churn_high":
    "Churn médio acima de 15% é muito alto — estratégia de retenção necessária",

  // P&L statement
  "financials.pl.title": "DRE — {period}",
  "financials.pl.empty_title": "Nenhum resultado ainda",
  "financials.pl.empty_description":
    "Configure os inputs do cenário para ver a DRE.",
  "financials.pl.revenue": "Receita",
  "financials.pl.total_revenue": "Receita Total",
  "financials.pl.tier_subs": "{tier} ({count} assinantes)",
  "financials.pl.cogs": "Custo dos Produtos Vendidos",
  "financials.pl.total_cogs": "COGS Total",
  "financials.pl.product_costs": "Custos de Produto (Créditos & Vestuário)",
  "financials.pl.fulfillment_shipping": "Fulfillment & Envio",
  "financials.pl.gross_profit": "Lucro Bruto",
  "financials.pl.opex": "Despesas Operacionais",
  "financials.pl.total_opex": "OpEx Total",
  "financials.pl.sales_commissions": "Comissões de Vendas",
  "financials.pl.overhead": "Overhead Operacional",
  "financials.pl.overhead_scaled": "Overhead Operacional (escalado)",
  "financials.pl.other_income": "Outras Receitas",
  "financials.pl.total_other_income": "Total de Outras Receitas",
  "financials.pl.partner_kickbacks": "Kickbacks de Parceiros",
  "financials.pl.breakage_note":
    "Economia de breakage de créditos de {value} já refletida em COGS reduzido ({percent} não resgatado)",
  "financials.pl.net_income": "Lucro Líquido",
  "financials.pl.profit_distribution": "Distribuição de Lucro",
  "financials.pl.distributed": "Distribuído ({percent}%)",
  "financials.pl.party_label": "{name} ({percent}%)",
  "financials.pl.unnamed": "Sem nome",
  "financials.pl.undistributed": "Não distribuído ({percent}%)",

  // Profit cascade (shared/party) — rendered in both the Projection
  // Spreadsheet and the P&L Statement (S3). Labels carry the (−)/(=)
  // operators to make the cascade read top-to-bottom.
  "financials.cascade.revenue": "Receita",
  "financials.cascade.shared_costs": "(−) Custos compartilhados",
  "financials.cascade.distributable": "(=) Lucro distribuível",
  "financials.cascade.party_gross": "Fatia bruta",
  "financials.cascade.party_cost": "(−) Custos da party",
  "financials.cascade.level_unnamed": "Nível sem nome",
  "financials.cascade.undistributed": "Não distribuído / perda não alocada",
  "financials.cascade.undistributed_tooltip":
    "Resíduo positivo quando as parties somam menos de 100%; negativo quando é uma perda do canal absorvida (mês de prejuízo sem responsável definido).",
  "financials.cascade.channel_result": "(=) Resultado do canal",

  // Profit split — shared between P&L Statement and Metrics panel
  "financials.profit_split.over_allocated.label": "Sobre-alocado:",
  "financials.profit_split.over_allocated.body":
    "soma dos repasses de profit-split é {total}% — excede 100% em {overage}%. As cotas configuradas não podem ser todas pagas; reduza uma ou mais porcentagens.",

  // Cohort spreadsheet — top-level chrome
  "financials.cohort.view_label": "Visualizar:",
  "financials.cohort.view_aggregate": "Todas as safras (base — agregado)",
  "financials.cohort.empty_state": "Dados de safras indisponíveis.",
  // Per-cohort lifecycle table
  "financials.cohort.lifecycle.acquired_in_month": "Adquiridos no mês",
  "financials.cohort.lifecycle.gross_label": "Bruto:",
  "financials.cohort.lifecycle.chargebacks_label": "Chargebacks:",
  "financials.cohort.lifecycle.net_label": "Líquido:",
  "financials.cohort.lifecycle.lifetime_profit_label": "Lucro vitalício:",
  "financials.cohort.lifecycle.payback_label": "Payback:",
  // Per-cohort table headers
  "financials.cohort.lifecycle.month_abbr": "Mês",
  "financials.cohort.lifecycle.lifetime_header": "Vitalício",
  // Aggregate cohort table
  "financials.cohort.aggregate.title": "Todas as Safras (Agregado)",
  "financials.cohort.aggregate.active_last_label": "Ativos (último):",
  "financials.cohort.aggregate.window_revenue_label": "Receita da janela:",
  "financials.cohort.aggregate.window_profit_label": "Lucro da janela:",

  // Scenario builder — short labels
  "financials.scenario_builder.add_ons.title": "Add-ons",
  "financials.scenario_builder.path_scale.label": "Path Scale",
  "financials.scenario_builder.path_scale.description":
    "Balança inteligente que rastreia métricas de saúde dos assinantes.",
  // Rep schedule override
  "financials.scenario_builder.rep_schedule.override": "Override",
  "financials.scenario_builder.rep_schedule.off": "Desligado",
  "financials.scenario_builder.rep_schedule.column_period": "Período",
  "financials.scenario_builder.rep_schedule.column_growth":
    "Crescimento / período (%)",
  "financials.scenario_builder.rep_schedule.column_sales_per_rep":
    "Vendas / rep",
  "financials.scenario_builder.rep_schedule.column_reps_end":
    "Reps no final",
  // Overhead categories
  "financials.scenario_builder.overhead.empty_state":
    "Nenhuma categoria de overhead ainda. Adicione uma para começar a rastrear OpEx mensal.",
  "financials.scenario_builder.overhead.add_category": "Adicionar categoria",
  "financials.scenario_builder.overhead.pre_launch_baseline":
    "Linha de base pré-lançamento:",
  "financials.scenario_builder.overhead.milestones.column_at_subs":
    "Em ≥ assinantes",
  "financials.scenario_builder.overhead.milestones.column_monthly_cost":
    "Custo mensal",
  "financials.scenario_builder.overhead.milestones.add":
    "Adicionar marco",
  // Reference package picker
  "financials.scenario_builder.product_pack.title": "Pacote de Referência",
  "financials.scenario_builder.product_pack.none_option":
    "Nenhum — usar heurística de orçamento de vestuário",
  "financials.scenario_builder.product_pack.per_tier_cogs_header":
    "COGS por faixa de {pack_name}",
  // Tier summary + math display
  "financials.scenario_builder.tier_summary.per_month_suffix": "/mês",
  "financials.scenario_builder.tier_summary.months_abbr": "m",
  "financials.scenario_builder.tier_summary.equals_separator": " = ",
  "financials.scenario_builder.tier_summary.profit_label": "Lucro",
  "financials.scenario_builder.tier_summary.margin_paren": "({percent}%)",

  // Scenario builder — long-form helper descriptions (Thread F.3)
  "financials.scenario_builder.welcome_kit.description":
    "{cost} / novo assinante · cobrado uma vez na aquisição. Entra no CAC e na despesa de aquisição do mês.",
  "financials.scenario_builder.buck_platform.description":
    "{cost}/sub/mês · cobrado todo mês sobre cada assinante ativo.",
  "financials.scenario_builder.path_scale.purchase_description":
    "Pagamos ao fornecedor {amount} por novo assinante no momento do cadastro para adquirir a Path Scale. A unidade é nossa — sem pagamentos adicionais, independentemente de churn.",
  "financials.scenario_builder.path_scale.lease_description":
    "Pagamos ao fornecedor {fee}/sub/mês durante os primeiros {months} meses em que cada assinante permanece ativo. Após isso, a balança é nossa — sem pagamentos adicionais.",
  "financials.scenario_builder.reference_package.description":
    "Ancora o COGS por assinante nos produtos por faixa de um pacote real. O custo de cada faixa na projeção passa a ser a soma de (qtd × custo das mercadorias) dos produtos da variante daquela faixa — substituindo o palpite da heurística de orçamento de vestuário.",

  // Models list
  "financials.models.title": "Projeções",
  "financials.models.subtitle":
    "Crie e compare modelos de projeção financeira para sua operação.",
  "financials.models.loading": "Carregando modelos...",
  "financials.models.untitled": "Modelo sem título",
  "financials.models.add_model": "Adicionar Modelo",
  "financials.models.view_cards": "Visualização em cartões",
  "financials.models.view_table": "Visualização em tabela",
  "financials.models.empty_title": "Nenhum modelo ainda",
  "financials.models.empty_description":
    "Crie seu primeiro modelo financeiro para simular cenários de DRE, comparar margens e planejar sua operação.",
  "financials.models.confirm_delete": 'Excluir modelo "{name}"?',
  "financials.models.feedback.deleted": "Modelo excluído",
  "financials.models.ratio_x": "{value}x",
  "financials.models.breakeven.never": "Nunca",
  "financials.models.breakeven.month_short": "Mês {month}",
  "financials.models.breakeven.month_long": "Mês {month}",
  "financials.models.column.model": "Modelo",
  "financials.models.column.mrr": "MRR",
  "financials.models.column.arr": "ARR de Saída",
  "financials.models.column.net_margin": "Margem Líquida",
  "financials.models.column.gross_margin": "Margem Bruta",
  "financials.models.column.new_subs_per_mo": "Novos Subs/Mês",
  "financials.models.column.ltv_cac": "LTV:CAC",
  "financials.models.column.breakeven": "Breakeven",
  "financials.models.column.created": "Criado",

  // Projection spreadsheet
  "financials.projection.empty": "Nenhum resultado ainda",
  "financials.projection.tier_indent": "  └ {tier}",
  "financials.projection.tier_indent_with_pct": "  └ {tier} ({percent})",
  "financials.projection.tier_subindent": "      └ {tier}",
  "financials.projection.tier_subindent_with_count": "      └ {tier} ({count} assinantes)",
  "financials.projection.row.buck_license": "Licença Buck",
  "financials.projection.row.buck_tokens": "Tokens Buck",
  "financials.projection.section.sales_team": "Equipe de Vendas",
  "financials.sales_team.reps": "Representantes de Vendas",
  "financials.sales_team.reps_tooltip": "Reps ativos — a base da força de vendas. Cada nível de liderança acima adiciona 1 gestor por span de reps.",
  "financials.projection.section.member_earnings": "Ganhos do Time de Vendas",
  "financials.projection.section.earnings": "Ganhos",
  "financials.member_earnings.section_tooltip": "Quanto UM indivíduo em cada papel ganha por mês — um rep presente desde o mês 1 (upfront + residual que rampa conforme o book amadurece) e um gestor representativo por nível (override sobre um span). Topo → base.",
  "financials.member_earnings.rep": "Representante de Vendas",
  "financials.member_earnings.rep_tooltip": "Um rep vendendo na taxa de vendas-por-rep do cenário desde o mês 1. Comissão upfront em cada venda mais residual sobre o book ainda ativo dele.",
  "financials.member_earnings.upfront": "Upfront",
  "financials.member_earnings.residual": "Residual",
  "financials.projection.section.subscribers": "Assinantes",
  "financials.projection.section.revenue": "Receita",
  "financials.projection.section.cogs": "Custo dos Produtos",
  "financials.projection.section.opex": "Despesas Operacionais",
  "financials.projection.section.bottom_line": "Resultado",
  "financials.projection.section.profit_split": "Divisão de Lucro",
  "financials.projection.row.gross_new_sales": "Vendas Brutas Novas",
  "financials.projection.row.chargebacks": "Chargebacks",
  "financials.projection.row.net_new_subs": "Novos Assinantes",
  "financials.projection.row.lost_to_churn": "Churn",
  "financials.projection.row.total_active": "Assinantes Ativos",
  "financials.projection.row.subscription_revenue": "Receita de Assinatura",
  "financials.projection.row.monthly_billing": "  └ Cobrança Mensal",
  "financials.projection.row.biannual_billing": "  └ Cobrança Semestral",
  "financials.projection.row.annual_billing": "  └ Cobrança Anual",
  "financials.projection.row.product_fulfillment": "Produto & Fulfillment",
  "financials.projection.row.product_cost": "Custo do Produto",
  "financials.projection.row.shipping": "Frete",
  "financials.projection.row.handling": "Manuseio",
  "financials.projection.row.payment_processing": "Processamento de Pagamento",
  "financials.projection.row.gross_profit": "Lucro Bruto",
  "financials.projection.row.gross_margin_pct": "Margem Bruta %",
  "financials.projection.row.commissions": "Comissões",
  "financials.projection.row.commissions_upfront": "Upfront",
  "financials.projection.row.commissions_residual": "Residual",
  "financials.projection.row.welcome_kit": "Welcome Kit",
  "financials.projection.row.buck": "Buck",
  "financials.projection.row.add_ons": "Add-Ons",
  "financials.projection.row.path_scale": "Path Scale",
  "financials.projection.row.overhead": "Overhead",
  "financials.projection.row.total_opex": "OpEx Total",
  "financials.projection.row.net_profit": "Lucro Líquido",
  "financials.projection.row.cumulative_profit": "Lucro Acumulado",
  "financials.projection.row.net_margin_pct": "Margem Líquida %",
  "financials.projection.column.total_avg": "Total/Méd",
  // Projection — Active Reps + Active by Plan & Cycle (Thread visual parity)
  "financials.projection.row.active_reps": "Reps Ativos",
  "financials.projection.section.active_by_plan_cycle": "Ativos por Plano & Ciclo",
  "financials.projection.cycle_label.monthly": "Mensal",
  "financials.projection.cycle_label.biannual": "Semestral",
  "financials.projection.cycle_label.annual": "Anual",

  // Cohort spreadsheet
  "financials.cohort.empty":
    "Nenhum resultado ainda. Configure os inputs para gerar a análise de cohort.",
  "financials.cohort.section.acquisition": "Aquisição",
  "financials.cohort.section.costs": "Custos",
  "financials.cohort.section.profitability": "Lucratividade",
  "financials.cohort.row.active_reps": "Reps Ativos",
  "financials.cohort.row.total_active_subs": "Total Subs Ativos",
  "financials.cohort.row.monthly_revenue": "Receita Mensal",
  "financials.cohort.row.cumulative_revenue": "Receita Acumulada",
  "financials.cohort.row.cogs": "COGS",
  "financials.cohort.row.total_costs": "Custos Totais",
  "financials.cohort.row.monthly_net_profit": "Lucro Líquido Mensal",
  "financials.cohort.row.monthly_margin_pct": "Margem Mensal %",
  "financials.cohort.column.metric": "Métrica",
  "financials.cohort.column.month_long": "Mês {month}",
  "financials.cohort.column.total": "Total",
  "financials.export.button": "Exportar para Excel",
  "financials.export.exporting": "Exportando…",
  "financials.export.sheet.projection": "Projeção",
  "financials.export.sheet.cohort_aggregate": "Cohort (Agregado)",
  "financials.export.sheet.cohort_lifecycle": "Cohort Mês {month}",
  "financials.export.success": "Projeção exportada",
  "financials.export.error": "Falha ao exportar a projeção",

  // Accounting basis — regime contábil (sub-etapa 2: differentiation
  // between accrual and cash flow across the three financial tabs).
  "financials.basis.badge.accrual": "Regime de competência (Accrual)",
  "financials.basis.badge.cash": "Regime de caixa (Cash flow)",
  "financials.basis.tooltip.accrual":
    "Receita reconhecida no mês em que o serviço é prestado. Reflete performance operacional, base para LTV:CAC e margem.",
  "financials.basis.tooltip.cash":
    "Receita reconhecida no mês em que o cliente paga. Planos biannual/annual aparecem como lump na cobrança. Base para tesouraria e runway.",
  "financials.basis.reconciliation.accrual": "Receita reconhecida",
  "financials.basis.reconciliation.cash": "Caixa coletado",
  "financials.basis.reconciliation.deferred": "Receita diferida",
  "financials.basis.reconciliation.tooltip":
    "Caixa coletado menos receita reconhecida. Diferença é receita pré-paga ainda não entregue (planos biannual/annual cujo serviço se estende além do mês fechado).",

  // Toolbar — financial-page-client
  "financials.toolbar.breadcrumb_finances": "Finanças",
  "financials.toolbar.assumptions_title": "Premissas",
  "financials.toolbar.projection_title": "Projeção",
  "financials.toolbar.model_name_placeholder": "Nome do modelo...",
  "financials.toolbar.button.save_model": "Salvar modelo",
  "financials.toolbar.button.saving": "Salvando...",
  "financials.toolbar.button.remix": "Remix",
  "financials.toolbar.button.remixing": "Remixando...",
  "financials.toolbar.button.duplicate": "Duplicar",
  "financials.toolbar.button.duplicating": "Duplicando...",
  "financials.toolbar.button.deleting": "Excluindo...",
  "financials.toolbar.button.full_screen": "Tela cheia",
  "financials.toolbar.button.exit_full_screen": "Minimizar",
  "financials.toolbar.tab.summary": "Resumo",
  "financials.toolbar.tab.statement": "DRE",
  "financials.toolbar.tab.spreadsheet": "Planilha",
  "financials.toolbar.tab.cohort": "Cohort",
  "financials.toolbar.tab.metrics": "Métricas",
  "financials.toolbar.tab.charts": "Gráficos",
  "financials.toolbar.perspective.label": "Ver como",
  "financials.toolbar.perspective.general": "Geral",
  "financials.toolbar.perspective.parties_group": "Partes",
  "financials.toolbar.perspective.members_group": "Papéis",
  "financials.toolbar.time_period.month": "Mês",
  "financials.toolbar.time_period.quarter": "Trimestre",
  "financials.toolbar.time_period.semester": "Semestre",
  "financials.toolbar.time_period.year": "Ano",
  "financials.toolbar.time_period.custom": "Personalizado",
  "financials.toolbar.time_period.custom_months": "{months} meses",
  "financials.toolbar.time_period.month_short": "mês",
  "financials.toolbar.color.green": "Verde",
  "financials.toolbar.color.blue": "Azul",
  "financials.toolbar.color.yellow": "Amarelo",
  "financials.toolbar.color.orange": "Laranja",
  "financials.toolbar.color.red": "Vermelho",
  "financials.toolbar.color.purple": "Roxo",
  "financials.toolbar.color.gray": "Cinza",
  "financials.toolbar.error.enter_model_name": "Digite um nome para o modelo",
  "financials.toolbar.error.no_results_to_save":
    "Sem resultados para salvar — execute o cenário primeiro",
  "financials.toolbar.error.save_failed": "Falha ao salvar",
  "financials.toolbar.error.save_failed_connection":
    "Falha ao salvar — verifique sua conexão",
  "financials.toolbar.error.describe_changes": "Descreva as mudanças desejadas",
  "financials.toolbar.error.remix_failed": "Falha no remix",
  "financials.toolbar.error.enter_duplicate_name": "Digite um nome para a cópia",
  "financials.toolbar.error.no_results_to_duplicate": "Sem resultados para duplicar",
  "financials.toolbar.error.duplicate_failed": "Falha ao duplicar",
  "financials.toolbar.error.delete_failed": "Falha ao excluir",
  "financials.toolbar.feedback.remixed":
    "Modelo remixado — revise as premissas atualizadas",
  "financials.toolbar.feedback.duplicated": "Modelo duplicado",
  "financials.toolbar.remix_dialog.title": "Remix do Modelo",
  "financials.toolbar.remix_dialog.description":
    "Descreva como você quer mudar a projeção. Um agente de IA ajustará os valores das premissas e gerará projeções atualizadas.",
  "financials.toolbar.remix_dialog.placeholder":
    "Ex.: Torne mais agressivo — comece com 20 reps crescendo a 15%/mês, reduza overhead para R$15k, e aumente o residual para 8%...",
  "financials.toolbar.duplicate_dialog.title": "Duplicar Modelo",
  "financials.toolbar.duplicate_dialog.description":
    "Crie uma cópia deste modelo com novo nome e cor. Todas as premissas e projeções serão duplicadas.",
  "financials.toolbar.duplicate_dialog.color_label": "Cor",
  "financials.toolbar.duplicate_dialog.name_label": "Nome do Modelo",
  "financials.toolbar.delete_dialog.title": "Excluir Modelo",
  "financials.toolbar.delete_dialog.description_prefix": "Tem certeza que deseja excluir",
  "financials.toolbar.delete_dialog.description_suffix": "?",

  // Builder — scenario-builder.tsx
  "financials.builder.linked_badge.expenses": "Despesas",
  "financials.builder.linked_badge.from_plans": "Dos Planos",
  "financials.builder.linked_badge.plans_linked": "{count} planos vinculados",

  "financials.builder.overhead.title": "Overhead",
  "financials.builder.overhead.description_fixed": "Custos operacionais mensais fixos",
  "financials.builder.overhead.description_auto_scaled":
    "Auto-escalado da página de Operações",
  "financials.builder.overhead.tooltip":
    "Custos operacionais como aluguel, salários, software e admin. Pode ser um valor mensal fixo ou auto-escalado da página de Operações com base em milestones de assinantes.",
  "financials.builder.overhead.mode_fixed": "Fixo",
  "financials.builder.overhead.mode_auto_scaled": "Auto-escalado",
  "financials.builder.overhead.field_monthly_overhead": "Overhead Mensal ($)",
  "financials.builder.overhead.field_monthly_overhead_tooltip":
    "Seus custos mensais fixos totais que não escalam com assinantes — aluguel, salários, software, seguros, admin etc.",
  "financials.builder.overhead.operations_categories": "Categorias da Página de Operações",
  "financials.builder.overhead.per_month_amount": "{amount}/mês",
  "financials.builder.overhead.scale_note_prefix":
    "Custos escalam automaticamente conforme assinantes ultrapassam milestones definidos na",
  "financials.builder.overhead.operations_page_link": "página de Operações",
  "financials.builder.overhead.no_opex_prefix": "Nenhum dado de OPEX encontrado. Configure milestones de custos na",
  "financials.builder.overhead.no_opex_suffix": "primeiro.",

  "financials.builder.sales_reps.title": "Representantes de Vendas",
  "financials.builder.sales_reps.description":
    "Reps, produtividade & crescimento mensal",
  "financials.builder.sales_reps.tooltip":
    "Sua força de vendas porta-a-porta. Defina headcount inicial, produtividade e quão rápido a equipe cresce a cada mês. Reps compõem — 10 reps crescendo 10%/mês viram 26 reps no mês 12.",
  "financials.builder.sales_reps.field_starting_reps": "Reps Iniciais",
  "financials.builder.sales_reps.field_starting_reps_tooltip":
    "Quantos reps de vendas você começa no mês 1. Esta é sua linha base — a equipe cresce a partir daqui com base na taxa de crescimento mensal.",
  "financials.builder.sales_reps.field_sales_per_rep": "Vendas/Rep/Mês",
  "financials.builder.sales_reps.field_sales_per_rep_tooltip":
    "Quantas novas assinaturas cada rep fecha por mês em média. Multiplique pelos reps ativos para o total mensal de aquisição deste canal.",
  "financials.builder.sales_reps.field_growth_rate": "Crescimento %/Mês",
  "financials.builder.sales_reps.field_growth_rate_tooltip":
    "Quão rápido sua equipe de vendas cresce a cada mês. A 10%, você vai de 10 reps a 11 no próximo mês, 12 no seguinte, e assim por diante — composto.",
  "financials.builder.sales_reps.summary_mo1": "Mês 1: {reps} reps × {sales} vendas =",
  "financials.builder.sales_reps.summary_new_subs": "{count} novos subs",
  "financials.builder.sales_reps.summary_mo12_prefix": "Mês 12:",
  "financials.builder.sales_reps.summary_mo12_value": "{reps} reps → {subs} subs",

  "financials.builder.commission.title": "Estrutura de Comissão",
  "financials.builder.commission.description": "Como reps são pagos por venda",
  "financials.builder.commission.tooltip":
    "Defina como os reps de vendas D2D são compensados — bônus upfront (flat $ ou % do preço do plano), residual contínuo, aceleradores e prazo de pagamento.",
  "financials.builder.commission.upfront_section": "Comissão Upfront",
  "financials.builder.commission.residual_section": "Residual (contínuo)",
  "financials.builder.commission.accelerator_section": "Acelerador",
  "financials.builder.commission.type_flat": "$ Fixo",
  "financials.builder.commission.type_percent": "% do Plano",
  "financials.builder.commission.field_bonus_per_sale": "Bônus por Venda ($)",
  "financials.builder.commission.field_bonus_per_sale_tooltip":
    "Um valor fixo em dólares pago ao rep por cada nova assinatura fechada, independente do plano que o assinante escolheu.",
  "financials.builder.commission.field_percent_of_plan": "% do Preço do Plano",
  "financials.builder.commission.field_percent_of_plan_tooltip":
    "O rep ganha esta porcentagem do preço mensal do plano do assinante como bônus upfront. 100% significa que o rep ganha a receita total do primeiro mês.",
  "financials.builder.commission.field_payout_delay": "Atraso de Pagamento (meses)",
  "financials.builder.commission.field_payout_delay_tooltip":
    "Quantos meses após a venda antes da comissão upfront ser paga. 0 = imediato. 2 = pago dois meses após a venda fechar. Atrasos melhoram o fluxo de caixa.",
  "financials.builder.commission.field_residual_percent": "Residual %/mês",
  "financials.builder.commission.field_residual_percent_tooltip":
    "Uma porcentagem mensal contínua da receita de cada assinante paga ao rep que vendeu. Repete todo mês que o assinante permanece ativo.",
  "financials.builder.commission.field_residual_delay": "Inicia Após (meses)",
  "financials.builder.commission.field_residual_delay_tooltip":
    "Quantos meses após a venda antes do rep começar a ganhar residual. 0 = residual começa imediatamente. 3 = o rep não recebe nada por 3 meses, então o residual começa a partir do mês 4.",
  "financials.builder.commission.field_percent_hitting": "% Atingindo Acelerador",
  "financials.builder.commission.field_percent_hitting_tooltip":
    "Que porcentagem dos seus reps excedem a meta de vendas e ganham o bônus do acelerador.",
  "financials.builder.commission.field_multiplier": "Multiplicador",
  "financials.builder.commission.field_multiplier_tooltip":
    "Multiplicador de bônus para reps de alto desempenho. Em 1.5x, um rep ganhando $50 de bônus recebe $75 quando atinge a meta do acelerador.",
  "financials.builder.commission.summary_upfront_label": "Upfront",
  "financials.builder.commission.summary_upfront_percent": "{percent} do preço do plano",
  "financials.builder.commission.summary_upfront_flat": "{amount} fixo",
  "financials.builder.commission.summary_paid_immediately": "pago imediatamente",
  "financials.builder.commission.summary_paid_after": "pago após {months} mês(es)",
  "financials.builder.commission.summary_residual_value": "{percent}/mês",
  "financials.builder.commission.summary_residual_word": "residual",
  "financials.builder.commission.summary_residual_delay": " (começa após {months} mês(es))",

  "financials.builder.profit_split.title": "Divisão de Lucros",
  "financials.builder.profit_split.description":
    "Como o lucro do canal é dividido entre as partes",
  "financials.builder.profit_split.tooltip":
    "Após todos os custos (COGS, comissões, overhead), o lucro restante deste canal de vendas é dividido entre as partes definidas aqui. Os percentuais devem totalizar 100%.",
  "financials.builder.profit_split.empty":
    "Nenhuma parte definida. Adicione partes para dividir o lucro do canal.",
  "financials.builder.profit_split.party_name_label": "Nome da Parte",
  "financials.builder.profit_split.party_name_placeholder":
    "Ex.: ComeçaAI, Investidor, Parceiro",
  "financials.builder.profit_split.split_percent_label": "Divisão %",
  "financials.builder.profit_split.split_percent_tooltip":
    "Que porcentagem do lucro líquido do canal esta parte recebe.",
  "financials.builder.profit_split.add_party": "Adicionar Parte",
  "financials.builder.profit_split.unnamed": "Sem nome",
  "financials.builder.profit_split.total_label": "Total",
  "financials.builder.profit_split.must_be_100": "(deve ser 100%)",

  // Loss handling (S3.5) — controls inside the Profit Split card.
  "financials.builder.loss_handling.label": "Tratamento de prejuízo",
  "financials.builder.loss_handling.tooltip":
    "Em meses de prejuízo do canal (distribuível negativo): Proporcional divide a perda entre as partes pelo %; Absorvido tira a perda do rateio — vai para o responsável escolhido ou para 'Não distribuído'.",
  "financials.builder.loss_handling.proportional": "Proporcional",
  "financials.builder.loss_handling.absorbed": "Absorvido",
  "financials.builder.loss_handling.bearer_label": "Quem absorve o prejuízo",
  "financials.builder.loss_handling.bearer_none": "Não distribuído (nenhuma parte)",

  // Cost attribution card (S3.5) — per-rubric shared vs. party.
  "financials.builder.attribution.title": "Atribuição de Custos",
  "financials.builder.attribution.description":
    "Quais custos são compartilhados vs. de uma parte específica",
  "financials.builder.attribution.tooltip":
    "Cada rubrica de custo pode ser Compartilhada (deduzida antes do rateio, afetando todas as partes) ou atribuída a uma parte (deduzida só da fatia dela). Padrão: tudo Compartilhado.",
  "financials.builder.attribution.shared": "Compartilhado",
  "financials.builder.attribution.rubric_cogs": "COGS",
  "financials.builder.attribution.rubric_commission": "Comissões",
  "financials.builder.attribution.rubric_chargeback": "Chargebacks",
  "financials.builder.attribution.rubric_overhead": "Overhead operacional",
  "financials.builder.attribution.rubric_buck": "Plataforma Buck",
  "financials.builder.attribution.rubric_addon": "Add-ons",
  "financials.builder.attribution.rubric_welcomeKit": "Welcome Kit",
  "financials.builder.attribution.rubric_leadership_commission": "Comissão de liderança",

  "financials.builder.leadership_commission.title": "Comissão de liderança",
  "financials.builder.leadership_commission.description": "Sobretaxas de liderança empilhadas sobre a produção do canal",
  "financials.builder.leadership_commission.tooltip": "Pirâmide de liderança (ex.: local, regional, VP) acima dos vendedores. Cada nível ganha uma sobretaxa % sobre a produção mensal, ponderada pelo mix das suas qualificações. Um nível ativa quando os reps ativos cruzam seu span acumulado. Custo 0 quando desabilitado. Roteie compartilhado vs. parte no card \"Atribuição de Custos\".",
  "financials.builder.leadership_commission.enabled_label": "Status",
  "financials.builder.leadership_commission.enabled_on": "Habilitado",
  "financials.builder.leadership_commission.enabled_off": "Desabilitado",
  "financials.builder.leadership_commission.base_label": "Base de cálculo",
  "financials.builder.leadership_commission.base_revenue": "Receita",
  "financials.builder.leadership_commission.base_margin": "Margem bruta",
  "financials.builder.leadership_commission.base_rep_commission": "Comissão do vendedor",
  "financials.builder.leadership_commission.order_hint": "Pirâmide de comissionamento: os vendedores são a base; cada nível fica acima e ativa quando a força de vendas cruza o span acumulado.",
  "financials.builder.leadership_commission.level_name_label": "Nível {n}",
  "financials.builder.leadership_commission.level_name_placeholder": "Ex.: Local, Regional, VP",
  "financials.builder.leadership_commission.reps_base_label": "Vendedores (base)",
  "financials.builder.leadership_commission.reps_base_hint": "{n} reps na base · todo nível fica acima deles",
  "financials.builder.leadership_commission.level_activates_at": "Ativa com ≥ {n} reps ativos",
  "financials.builder.leadership_commission.qualifications_label": "Qualificações",
  "financials.builder.leadership_commission.no_qualifications": "Sem qualificações — 100% deste nível recebe a taxa base acima. Adicione uma para dividir o mix entre qualificações.",
  "financials.builder.leadership_commission.qual_name_label": "Qualificação",
  "financials.builder.leadership_commission.qual_name_placeholder": "Ex.: Bronze, Prata, Ouro",
  "financials.builder.leadership_commission.qual_rate_label": "Taxa %",
  "financials.builder.leadership_commission.qual_rate_tooltip": "Sobretaxa % que esta qualificação ganha sobre a produção do nível.",
  "financials.builder.leadership_commission.qual_mix_label": "Mix %",
  "financials.builder.leadership_commission.qual_mix_tooltip": "Proporção de gestores nesta qualificação — pondera a taxa efetiva do nível (média ponderada de base + qualificações).",
  "financials.builder.leadership_commission.add_qualification": "Adicionar qualificação",
  "financials.builder.leadership_commission.base_tier_label": "Base",
  "financials.builder.leadership_commission.base_tier_hint": "Sem qualificação (padrão do nível)",
  "financials.builder.leadership_commission.base_rate_label": "Taxa base %",
  "financials.builder.leadership_commission.base_rate_tooltip": "Taxa de override do nível para quem não tem qualificação. Todo nível tem uma taxa base — sem qualificações, 100% das pessoas recebem essa taxa.",
  "financials.builder.leadership_commission.base_mix_label": "Mix %",
  "financials.builder.leadership_commission.base_mix_tooltip": "Proporção de pessoas na base (sem qualificação). Base + qualificações devem somar 100%.",
  "financials.builder.leadership_commission.role_label": "Cargo",
  "financials.builder.leadership_commission.role_tooltip": "O nome deste nível de liderança (ex.: Local Manager, Regional Manager, VP).",
  "financials.builder.leadership_commission.level_span_label": "Span",
  "financials.builder.leadership_commission.span_help_base": "Reps / unidade",
  "financials.builder.leadership_commission.span_help_nested": "{unit} / unidade",
  "financials.builder.leadership_commission.level_span_prev_fallback": "nível {n}",
  "financials.builder.leadership_commission.level_span_tooltip": "Quantas unidades do nível imediatamente abaixo ficam sob uma unidade deste nível. O nível 1 conta reps (ex.: 20 = 1 gestor a cada 20 reps); o próximo nível conta esses gestores, e assim por diante. O nível ativa quando os reps ativos ≥ o produto acumulado dos spans da base até aqui.",
  "financials.builder.leadership_commission.base_header": "Base",
  "financials.builder.leadership_commission.add_level": "Adicionar nível",

  "financials.builder.chargebacks.title": "Chargebacks",
  "financials.builder.chargebacks.description": "Taxa projetada de chargeback e taxas",
  "financials.builder.chargebacks.tooltip":
    "Porcentagem de novos assinantes que farão chargeback da compra. Chargebacks reduzem assinantes líquidos e geram taxas do processador mais perda de COGS dos produtos enviados.",
  "financials.builder.chargebacks.field_rate": "Taxa de Chargeback %",
  "financials.builder.chargebacks.field_rate_tooltip":
    "Que porcentagem dos novos assinantes fará chargeback a cada mês. Ex.: 2% significa 2 a cada 100 novas vendas resultam em chargeback.",
  "financials.builder.chargebacks.field_fee": "Taxa por Chargeback ($)",
  "financials.builder.chargebacks.field_fee_tooltip":
    "A taxa cobrada pelo processador de pagamento por evento de chargeback, tipicamente $15-25.",
  "financials.builder.chargebacks.summary":
    "~{cbs} chargebacks/mês de {gross} novas vendas → {net} novos assinantes líquidos",

  "financials.builder.plans.title": "Planos",
  "financials.builder.plans.description":
    "Estrutura dos planos & alavancas de desempenho",
  "financials.builder.plans.tooltip":
    "A estrutura dos planos é somente leitura das suas configurações de Planos. As premissas de desempenho — mix de assinantes, churn, comportamento de cobrança — são as alavancas que movem suas projeções.",
  "financials.builder.plans.global_defaults": "Padrões Globais",
  "financials.builder.plans.field_monthly_pct": "Mensal %",
  "financials.builder.plans.field_monthly_pct_tooltip":
    "% padrão de assinantes pagando mês-a-mês. Planos individuais podem sobrescrever isso na seção de Sobreposições.",
  "financials.builder.plans.field_biannual_pct": "Semestral %",
  "financials.builder.plans.field_biannual_pct_tooltip":
    "% padrão de assinantes pagando a cada 6 meses (semestralmente).",
  "financials.builder.plans.field_annual_pct": "Anual %",
  "financials.builder.plans.field_annual_pct_tooltip":
    "% padrão de assinantes pagando anualmente.",
  "financials.builder.plans.must_total_100": "Deve totalizar 100% (atual {current})",
  "financials.builder.plans.field_credit_redemption": "Resgate de Crédito %",
  "financials.builder.plans.field_credit_redemption_tooltip":
    "% padrão de créditos que assinantes realmente usam. Planos podem sobrescrever individualmente. Créditos não resgatados viram lucro de breakage.",
  "financials.builder.plans.plan_structure": "Estrutura do Plano",
  "financials.builder.plans.price_per_month": "{amount}/mês",
  "financials.builder.plans.price_per_quarter": "{amount}/sem",
  "financials.builder.plans.price_per_year": "{amount}/ano",
  "financials.builder.plans.credits_per_month": "{amount} créditos/mês",
  "financials.builder.plans.apparel_per_month": "{amount} vestuário/mês",
  "financials.builder.plans.no_credits_apparel": "Sem créditos ou vestuário",
  "financials.builder.plans.trial_days": "trial de {days} dias",
  "financials.builder.plans.setup_fee": "{amount} taxa de setup",
  "financials.builder.plans.est_cost_label": "Custo est.",
  "financials.builder.plans.est_cost_value": "{amount}/sub/mês",
  "financials.builder.plans.performance_section": "Desempenho",
  "financials.builder.plans.field_subscriber_mix": "Mix de Assinantes %",
  "financials.builder.plans.field_subscriber_mix_tooltip":
    "Que porcentagem dos seus assinantes totais escolhe este plano. Todos os planos devem somar 100%.",
  "financials.builder.plans.field_monthly_churn": "Churn Mensal %",
  "financials.builder.plans.field_monthly_churn_tooltip":
    "Taxa mensal de cancelamento deste plano. 6% de churn mensal = ~17 meses de tempo médio de vida. Churn só começa após o período de compromisso mínimo.",
  "financials.builder.plans.field_min_commit": "Compromisso Mín. (meses)",
  "financials.builder.plans.field_min_commit_tooltip":
    "Meses mínimos que um assinante fica preso antes de poder cancelar. Durante esse período o churn é 0 (assinantes não podem sair). Vem das suas configurações de plano.",

  "financials.builder.overrides.title": "Sobreposições",
  "financials.builder.overrides.tag_billing": "cobrança",
  "financials.builder.overrides.tag_redemption": "resgate",
  "financials.builder.overrides.billing_mix": "Mix de Cobrança",
  "financials.builder.overrides.billing_mix_global": "Mix de Cobrança (global)",
  "financials.builder.overrides.field_mo": "Mês %",
  "financials.builder.overrides.field_mo_tooltip":
    "Porcentagem dos assinantes deste plano pagando mensalmente. Sobrescreve o mix global para este plano específico.",
  "financials.builder.overrides.field_qtr": "Sem %",
  "financials.builder.overrides.field_qtr_tooltip":
    "Porcentagem dos assinantes deste plano pagando semestralmente.",
  "financials.builder.overrides.field_ann": "Ano %",
  "financials.builder.overrides.field_ann_tooltip":
    "Porcentagem dos assinantes deste plano pagando anualmente.",
  "financials.builder.overrides.credit_redemption": "Resgate de Crédito",
  "financials.builder.overrides.credit_redemption_global": "Resgate de Crédito (global)",
  "financials.builder.overrides.field_redemption": "Resgate %",
  "financials.builder.overrides.field_redemption_tooltip":
    "Que porcentagem dos créditos é resgatada pelos assinantes deste plano. Membros de planos superiores tendem a resgatar mais. Sobrescreve a taxa global.",

  // ============================================================
  // Organization (Phase 1.5.6b — Identity & People, Phase A)
  // ============================================================

  // Sub-panel
  "organization.subpanel.title": "Organização",
  "organization.subpanel.profile_category": "Perfil",
  "organization.subpanel.general_information": "Informações Gerais",
  "organization.subpanel.contact_information": "Informações de Contato",
  "organization.subpanel.locations": "Localizações",
  "organization.subpanel.business_hours": "Horários de Atendimento",
  "organization.subpanel.regional_settings": "Configurações Regionais",
  "organization.subpanel.structure_category": "Estrutura",
  "organization.subpanel.hierarchy": "Hierarquia",
  "organization.subpanel.departments": "Departamentos",
  "organization.subpanel.members": "Membros",
  "organization.subpanel.org_chart": "Organograma",
  "organization.subpanel.network_map": "Mapa de Rede",
  "organization.coming_soon": "Esta funcionalidade está em desenvolvimento.",
  "organization.subpanel.dashboard": "Painel",
  "organization.subpanel.access_category": "Acesso",
  "organization.subpanel.permissions": "Permissões",
  "organization.subpanel.roles": "Papéis",
  "organization.roles.title": "Papéis personalizados",
  "organization.roles.description":
    "Crie papéis nomeados para sua organização e atribua a membros. Papéis somam ao papel de sistema do membro — nunca o substituem.",
  "organization.roles.create_button": "Novo papel",
  "organization.roles.loading": "Carregando papéis…",
  "organization.roles.empty_title": "Nenhum papel personalizado ainda",
  "organization.roles.empty_description":
    "Papéis personalizados permitem nomear um grupo de pessoas na sua organização. As permissões são adicionadas a um papel depois que ele existe.",
  "organization.roles.col_name": "Papel",
  "organization.roles.col_permissions": "Permissões",
  "organization.roles.col_members": "Membros",
  "organization.roles.col_actions": "Ações",
  "organization.roles.no_permissions": "Sem permissões ainda",
  "organization.roles.permission_count": "{count} permissões",
  "organization.roles.member_count": "{count} membros",
  "organization.roles.edit_action": "Editar papel",
  "organization.roles.delete_action": "Excluir papel",
  "organization.roles.form.create_title": "Novo papel",
  "organization.roles.form.edit_title": "Editar papel",
  "organization.roles.form.create_description": "Nomeie um papel personalizado para sua organização.",
  "organization.roles.form.edit_description": "Atualize o nome, a chave ou a descrição deste papel.",
  "organization.roles.form.name_label": "Nome",
  "organization.roles.form.name_placeholder": "ex.: Gerente Regional",
  "organization.roles.form.key_label": "Chave",
  "organization.roles.form.key_placeholder": "ex.: gerente-regional",
  "organization.roles.form.key_hint": "Identificador em minúsculas, kebab-case. Uso interno.",
  "organization.roles.form.description_label": "Descrição",
  "organization.roles.form.description_placeholder": "Para que serve este papel? (opcional)",
  "organization.roles.form.save_create": "Criar papel",
  "organization.roles.form.save_edit": "Salvar alterações",
  "organization.roles.form.saving": "Salvando…",
  "organization.roles.error.reserved": "Este nome ou chave é reservado para um papel de sistema.",
  "organization.roles.error.duplicate": "Já existe um papel com esta chave.",
  "organization.roles.error.invalid": "Informe um nome válido e uma chave em kebab-case.",
  "organization.roles.delete.title": "Excluir papel?",
  "organization.roles.delete.description":
    "Excluir “{name}” o remove de {count} membro(s). Isso não pode ser desfeito.",
  "organization.roles.delete.confirm": "Excluir papel",
  "organization.roles.delete.cancel": "Cancelar",
  "organization.roles.feedback.created": "Papel criado",
  "organization.roles.feedback.updated": "Papel atualizado",
  "organization.roles.feedback.deleted": "Papel excluído",
  "organization.roles.feedback.load_error": "Não foi possível carregar os papéis",
  "organization.roles.feedback.save_error": "Não foi possível salvar o papel",
  "organization.roles.feedback.delete_error": "Não foi possível excluir o papel",
  "organization.roles.grants.open": "Editar permissões",
  "organization.roles.grants.title": "Permissões — {name}",
  "organization.roles.grants.additive_hint":
    "Estas permissões são somadas ao papel-base de cada membro. Papéis personalizados só concedem — nunca removem.",
  "organization.roles.grants.loading": "Carregando permissões…",
  "organization.roles.grants.close": "Concluir",
  "organization.roles.grants.load_error": "Não foi possível carregar as permissões deste papel",
  "organization.roles.grants.save_error": "Não foi possível atualizar a permissão",
  "organization.roles.grants.role_not_found": "Este papel não existe mais",
  "organization.roles.grants.invalid_grant": "Essa permissão não pode ser concedida",
  "organization.permissions.title": "Permissões",
  "organization.permissions.subtitle":
    "O que cada papel concede no modelo de permissões.",
  "organization.permissions.honest_banner":
    "Esta matriz mostra o que cada papel concede no modelo de permissões. Hoje a autorização é aplicada por nome de papel — um membro que detém o papel passa no gate. O modelo recurso × ação abaixo foi observado e concorda com esse enforcement; está armado (testado em shadow) mas ainda não ativo — o enforcement ativo chega com o editor da matriz. Recursos marcados “modelo — sem superfície” ainda não têm rota.",
  "organization.permissions.resource_header": "Recurso",
  "organization.permissions.action_header": "Ação",
  "organization.permissions.inert_badge": "Definido — enforcement incremental",
  "organization.permissions.inert_legend":
    "Papéis com escopo de departamento estão definidos no modelo mas ainda não são usados como gates de acesso. O enforcement é incremental.",
  "organization.permissions.ghost_badge": "Modelo — sem superfície",
  "organization.permissions.ghost_legend":
    "Recursos marcados “modelo — sem superfície” estão declarados no modelo de permissões mas ainda não têm rota onde enforçar; vão enforçar quando forem construídos.",
  "organization.permissions.grant_updated": "Permissão atualizada.",
  "organization.permissions.grant_update_error":
    "Não foi possível atualizar a permissão. Tente novamente.",
  "organization.permissions.grant_forbidden":
    "Apenas um super admin pode editar permissões.",
  "organization.permissions.grant_locked":
    "Esta permissão não é editável.",
  "organization.role_overrides.title": "Permissões por organização",
  "organization.role_overrides.subtitle":
    "Sobreponha a matriz padrão para esta organização — conceda ou negue permissões por papel.",
  "organization.role_overrides.read_only":
    "Você pode visualizar, mas só o Proprietário edita as permissões da organização.",
  "organization.role_overrides.system_roles": "Papéis de sistema",
  "organization.role_overrides.custom_roles": "Papéis personalizados",
  "organization.role_overrides.no_custom_roles":
    "Nenhum papel personalizado criado ainda.",
  "organization.role_overrides.saved": "Permissão atualizada.",
  "organization.role_overrides.floor_locked":
    "Não é possível remover permissões essenciais do Proprietário.",
  "organization.role_overrides.forbidden": "Você não tem permissão para esta alteração.",
  "organization.role_overrides.error": "Falha ao atualizar a permissão.",
  "organization.role_overrides.floor_tooltip":
    "Permissão essencial do Proprietário — não pode ser negada.",
  "organization.role_overrides.badge_grant": "concedido",
  "organization.role_overrides.badge_deny": "negado",
  "organization.role_overrides.effect_inherit": "Herdar",
  "organization.role_overrides.effect_grant": "Conceder",
  "organization.role_overrides.effect_deny": "Negar",
  "organization.permissions.role.OWNER": "Proprietário",
  "organization.permissions.role.ADMIN": "Administrador",
  "organization.permissions.role.MEMBER": "Membro",
  "organization.permissions.role.DEPARTMENT_HEAD": "Líder de Departamento",
  "organization.permissions.role.DEPARTMENT_MANAGER": "Gerente de Departamento",
  "organization.permissions.role.DEPARTMENT_MEMBER": "Membro de Departamento",
  "organization.permissions.resource.org": "Organização",
  "organization.permissions.resource.org_settings": "Configurações",
  "organization.permissions.resource.org_billing": "Cobrança",
  "organization.permissions.resource.org_hierarchy": "Hierarquia",
  "organization.permissions.resource.members": "Membros",
  "organization.permissions.resource.departments": "Departamentos",
  "organization.permissions.resource.locations": "Localizações",
  "organization.permissions.resource.audit_log": "Log de Auditoria",
  "organization.permissions.resource.integrations": "Integrações",
  "organization.permissions.resource.blocks_schema": "Schema de Blocks",
  "organization.permissions.resource.blocks_data": "Dados de Blocks",
  "organization.permissions.action.read": "Ler",
  "organization.permissions.action.create": "Criar",
  "organization.permissions.action.update": "Atualizar",
  "organization.permissions.action.delete": "Excluir",
  "organization.permissions.action.invite": "Convidar",
  "organization.dashboard.title": "Painel Consolidado",
  "organization.dashboard.description":
    "Visão agregada desta organização e de todas as sub-organizações.",
  "organization.dashboard.empty": "Nenhuma organização ativa.",
  "organization.dashboard.leaf_hint": "Esta organização não tem sub-organizações.",
  "organization.dashboard.total_orgs": "Organizações",
  "organization.dashboard.total_departments": "Departamentos",
  "organization.dashboard.total_locations": "Localizações",
  "organization.dashboard.total_members": "Membros",
  "organization.dashboard.col_org": "Organização",
  "organization.dashboard.col_departments": "Departamentos",
  "organization.dashboard.col_locations": "Localizações",
  "organization.dashboard.col_members": "Membros",

  // Profile (legacy aggregated form)
  "organization.profile.title": "Perfil da Organização",
  "organization.profile.description":
    "Gerencie os detalhes e preferências da sua organização.",
  "organization.profile.section.general_information": "Informações Gerais",
  "organization.profile.section.contact_information": "Informações de Contato",
  "organization.profile.section.regional_settings": "Configurações Regionais",
  "organization.profile.section.legal": "Legal",
  "organization.profile.field.organization_name": "Nome da Organização",
  "organization.profile.field.organization_name_placeholder": "ex. ComeçaAI",
  "organization.profile.field.description_label": "Descrição",
  "organization.profile.field.description_placeholder":
    "Breve descrição da sua organização",
  "organization.profile.field.website": "Website",
  "organization.profile.field.website_placeholder": "https://suaempresa.com",
  "organization.profile.field.support_email": "E-mail de Suporte",
  "organization.profile.field.support_email_placeholder":
    "suporte@suaempresa.com",
  "organization.profile.field.phone": "Telefone",
  "organization.profile.field.phone_placeholder": "+55 (11) 0000-0000",
  "organization.profile.field.address": "Endereço",
  "organization.profile.field.address_placeholder":
    "Endereço, cidade, estado, CEP",
  "organization.profile.field.default_language": "Idioma Padrão",
  "organization.profile.field.timezone": "Fuso Horário",
  "organization.profile.field.currency": "Moeda",
  "organization.profile.field.legal_name": "Razão Social",
  "organization.profile.field.legal_name_placeholder": "Nome jurídico completo",
  "organization.profile.field.tax_id": "CNPJ / Tax ID",
  "organization.profile.field.tax_id_placeholder": "XX-XXXXXXX",

  // General Information form
  "organization.profile.general.title": "Informações Gerais",
  "organization.profile.general.description":
    "Detalhes básicos sobre sua organização, incluindo nome, indústria e missão.",
  "organization.profile.general.identity_title": "Identidade da Organização",
  "organization.profile.general.identity_description":
    "Nome da organização, razão social e identificação fiscal.",
  "organization.profile.general.legal_name_help":
    "Usado em contratos, faturas e documentos oficiais.",
  "organization.profile.general.about_title": "Sobre",
  "organization.profile.general.about_description":
    "Descreva sua organização, sua missão e presença online.",
  "organization.profile.general.description_placeholder":
    "Breve descrição da sua organização e do que ela faz",
  "organization.profile.general.mission_label": "Missão",
  "organization.profile.general.mission_placeholder":
    "O que move sua organização?",
  "organization.profile.general.details_title": "Detalhes da Empresa",
  "organization.profile.general.details_description":
    "Indústria, tamanho e ano de fundação.",
  "organization.profile.general.industry_label": "Indústria",
  "organization.profile.general.industry_placeholder": "Selecione a indústria",
  "organization.profile.general.size_label": "Tamanho da Empresa",
  "organization.profile.general.size_placeholder": "Selecione o tamanho",
  "organization.profile.general.founded_label": "Ano de Fundação",
  "organization.profile.general.founded_placeholder": "ex. 2016",
  "organization.profile.general.org_name_placeholder": "ex. Bucked Up",

  // Industries
  "organization.industry.health_wellness": "Saúde & Bem-estar",
  "organization.industry.supplements": "Suplementos & Nutrição",
  "organization.industry.fitness": "Fitness & Esportes",
  "organization.industry.ecommerce": "E-Commerce",
  "organization.industry.saas": "SaaS / Tecnologia",
  "organization.industry.retail": "Varejo",
  "organization.industry.food_beverage": "Alimentação & Bebidas",
  "organization.industry.beauty": "Beleza & Cuidados Pessoais",
  "organization.industry.other": "Outro",

  // Company sizes
  "organization.size.1_10": "1-10 funcionários",
  "organization.size.11_50": "11-50 funcionários",
  "organization.size.51_200": "51-200 funcionários",
  "organization.size.201_500": "201-500 funcionários",
  "organization.size.501_1000": "501-1.000 funcionários",
  "organization.size.1000_plus": "1.000+ funcionários",

  // Contact form
  "organization.contact.title": "Informações de Contato",
  "organization.contact.description":
    "Como clientes, parceiros e membros da equipe podem entrar em contato com sua organização.",
  "organization.contact.primary_title": "Contato Principal",
  "organization.contact.primary_description":
    "Endereços de e-mail e telefones para consultas de clientes e parceiros.",
  "organization.contact.support_email_help":
    "Exibido a clientes e parceiros para consultas gerais.",
  "organization.contact.sales_email_label": "E-mail Comercial",
  "organization.contact.sales_email_placeholder": "comercial@suaempresa.com",
  "organization.contact.main_phone_label": "Telefone Principal",
  "organization.contact.support_phone_label": "Telefone de Suporte",
  "organization.contact.headquarters_title": "Endereço da Sede",
  "organization.contact.headquarters_description":
    "A localização física principal da sua organização.",
  "organization.contact.street_label": "Rua / Endereço",
  "organization.contact.street_placeholder": "Rua Principal, 123",
  "organization.contact.street2_label": "Complemento",
  "organization.contact.street2_placeholder": "Sala 100, Bloco A",
  "organization.contact.city_label": "Cidade",
  "organization.contact.city_placeholder": "São Paulo",
  "organization.contact.state_label": "Estado / Província",
  "organization.contact.state_placeholder": "SP",
  "organization.contact.zip_label": "CEP / Código Postal",
  "organization.contact.zip_placeholder": "01310-000",
  "organization.contact.country_label": "País",
  "organization.contact.country_placeholder": "Brasil",
  "organization.contact.social_title": "Presença Social & Web",
  "organization.contact.social_description":
    "Links para os perfis de mídia social e canais online da sua organização.",
  "organization.contact.social_instagram": "Instagram",
  "organization.contact.social_facebook": "Facebook",
  "organization.contact.social_linkedin": "LinkedIn",
  "organization.contact.social_twitter": "X (Twitter)",
  "organization.contact.social_youtube": "YouTube",
  "organization.contact.social_tiktok": "TikTok",

  // Locations
  "organization.locations.title": "Localizações",
  "organization.locations.description":
    "Gerencie as lojas, escritórios e outras localizações físicas da sua organização.",
  "organization.locations.add": "Adicionar Localização",
  "organization.locations.add_first": "Adicionar Primeira Localização",
  "organization.locations.empty_title": "Nenhuma localização ainda",
  "organization.locations.empty_description":
    "Adicione sua sede, lojas e outras localizações para que sua equipe e parceiros saibam onde você opera.",
  "organization.locations.headquarters_title": "Sede",
  "organization.locations.headquarters_description":
    "A localização principal da sua organização.",
  "organization.locations.other_title": "Outras Localizações",
  "organization.locations.all_title": "Todas as Localizações",
  "organization.locations.other_description":
    "Lojas, escritórios, depósitos e outras localizações físicas.",
  "organization.locations.other_empty":
    "Nenhuma localização adicional ainda.",
  "organization.locations.dialog.add_title": "Adicionar Localização",
  "organization.locations.dialog.edit_title": "Editar Localização",
  "organization.locations.dialog.add_description":
    "Adicione uma nova loja, escritório ou depósito à sua organização.",
  "organization.locations.dialog.edit_description":
    "Atualize os detalhes desta localização.",
  "organization.locations.field.name": "Nome da Localização",
  "organization.locations.field.name_placeholder": "ex. Loja Centro",
  "organization.locations.field.type": "Tipo",
  "organization.locations.field.is_headquarters":
    "Esta é a localização da sede",
  "organization.locations.field.street": "Rua / Endereço",
  "organization.locations.field.street_placeholder": "Rua Principal, 123",
  "organization.locations.field.street2": "Complemento",
  "organization.locations.field.street2_placeholder": "Sala 100",
  "organization.locations.field.city": "Cidade",
  "organization.locations.field.city_placeholder": "Cidade",
  "organization.locations.field.state": "Estado",
  "organization.locations.field.state_placeholder": "Estado",
  "organization.locations.field.zip": "CEP",
  "organization.locations.field.zip_placeholder": "CEP",
  "organization.locations.field.country": "País",
  "organization.locations.field.country_placeholder": "Brasil",
  "organization.locations.field.phone": "Telefone",
  "organization.locations.field.phone_placeholder": "+55 (11) 0000-0000",
  "organization.locations.field.email": "E-mail",
  "organization.locations.field.email_placeholder": "local@empresa.com",
  "organization.locations.field.notes": "Notas",
  "organization.locations.field.notes_placeholder":
    "Quaisquer detalhes adicionais sobre esta localização...",
  "organization.locations.action.update": "Atualizar",
  "organization.locations.action.add": "Adicionar Localização",
  "organization.locations.no_address": "Nenhum endereço informado",
  "organization.locations.hq_badge": "SEDE",
  "organization.locations.type.headquarters": "Sede",
  "organization.locations.type.office": "Escritório",
  "organization.locations.type.store": "Loja / Varejo",
  "organization.locations.type.warehouse": "Depósito",
  "organization.locations.type.other": "Outro",
  "organization.locations.search_placeholder": "Buscar por nome, cidade, estado…",
  "organization.locations.filter_all_types": "Todos os tipos",
  "organization.locations.not_found": "Nenhuma localização encontrada",
  "organization.locations.not_found_hint": "Adicione a primeira em \"Adicionar Localização\".",
  "organization.locations.delete_confirm": "Excluir \"{name}\"?",
  "organization.locations.saved_at": "Salvo {time}",
  "organization.locations.field.is_active": "Ativa",
  "organization.locations.field.is_headquarters_label": "Sede principal",
  "organization.locations.section.identification": "Identificação",
  "organization.locations.section.address": "Endereço",
  "organization.locations.section.contact": "Contato",
  "organization.locations.section.notes": "Notas",
  "organization.locations.hq_hint": "Apenas uma localização pode ser sede.",
  "organization.locations.active_in_use": "Em uso",
  "organization.locations.archived": "Arquivada",

  // Business hours
  "organization.business_hours.title": "Horários de Atendimento",
  "organization.business_hours.description":
    "Defina os horários de funcionamento da sua organização. Eles são exibidos a parceiros e clientes.",
  "organization.business_hours.weekly_title": "Programação Semanal",
  "organization.business_hours.weekly_description":
    "Ative ou desative cada dia e defina os horários de funcionamento.",
  "organization.business_hours.support_title": "Disponibilidade de Suporte",
  "organization.business_hours.support_description":
    "Expectativas de tempo de resposta e informações sobre programação de feriados.",
  "organization.business_hours.response_label": "Tempo de Resposta do Suporte",
  "organization.business_hours.response_help":
    "Tempo de resposta esperado exibido a parceiros e clientes.",
  "organization.business_hours.response.1h": "Em até 1 hora",
  "organization.business_hours.response.4h": "Em até 4 horas",
  "organization.business_hours.response.8h": "Em até 8 horas",
  "organization.business_hours.response.24h": "Em até 24 horas",
  "organization.business_hours.response.48h": "Em até 48 horas",
  "organization.business_hours.holiday_label": "Aviso de Feriados",
  "organization.business_hours.holiday_placeholder":
    "ex. Fechado em todos os principais feriados nacionais",
  "organization.business_hours.holiday_help":
    "Uma breve nota sobre programação de feriados exibida a parceiros.",
  "organization.business_hours.closed": "Fechado",
  "organization.business_hours.to": "às",
  "organization.business_hours.day.monday": "Segunda-feira",
  "organization.business_hours.day.tuesday": "Terça-feira",
  "organization.business_hours.day.wednesday": "Quarta-feira",
  "organization.business_hours.day.thursday": "Quinta-feira",
  "organization.business_hours.day.friday": "Sexta-feira",
  "organization.business_hours.day.saturday": "Sábado",
  "organization.business_hours.day.sunday": "Domingo",

  // Regional settings
  "organization.regional.title": "Configurações Regionais",
  "organization.regional.description":
    "Configure idioma, fuso horário, moeda e preferências de formatação para sua organização.",
  "organization.regional.language_section_title": "Idioma & Fuso Horário",
  "organization.regional.language_section_description":
    "Idioma e fuso horário principais usados em toda a plataforma.",
  "organization.regional.language_label": "Idioma Padrão",
  "organization.regional.language_help":
    "Idioma principal usado em toda a plataforma e nas comunicações.",
  "organization.regional.timezone_label": "Fuso Horário",
  "organization.regional.timezone_help":
    "Usado para agendamento, relatórios e exibição de horários em toda a plataforma.",
  "organization.regional.currency_section_title": "Moeda & Números",
  "organization.regional.currency_section_description":
    "Moeda padrão e formatação numérica para comissões, pagamentos e preços.",
  "organization.regional.currency_label": "Moeda Principal",
  "organization.regional.currency_help":
    "Moeda padrão para comissões, pagamentos e preços de produtos.",
  "organization.regional.number_format_label": "Formato Numérico",
  "organization.regional.formatting_section_title": "Formatação",
  "organization.regional.formatting_section_description":
    "Preferências de exibição de datas e sistema de medidas.",
  "organization.regional.date_format_label": "Formato de Data",
  "organization.regional.measurement_label": "Sistema de Medidas",
  "organization.regional.measurement_help":
    "Usado para pesos de produtos, dimensões de envio e cálculos relacionados.",
  "organization.regional.measurement.imperial": "Imperial (lb, oz, in)",
  "organization.regional.measurement.metric": "Métrico (kg, g, cm)",

  // Feedback (toasts)
  "organization.feedback.profile_saved": "Perfil salvo",
  "organization.feedback.general_information_saved":
    "Informações gerais salvas",
  "organization.feedback.contact_information_saved":
    "Informações de contato salvas",
  "organization.feedback.business_hours_saved":
    "Horários de atendimento salvos",
  "organization.feedback.regional_settings_saved":
    "Configurações regionais salvas",
  "organization.feedback.location_added": "Localização adicionada",
  "organization.feedback.location_updated": "Localização atualizada",
  "organization.feedback.location_deleted": "Localização excluída",

  // Errors
  "error.organization.save_failed": "Falha ao salvar",
  "error.organization.location_save_failed": "Falha ao salvar localização",
  "error.organization.location_delete_failed": "Falha ao excluir localização",
  "error.organization.locations_load_failed":
    "Falha ao carregar localizações",
  "error.organization.location_name_required":
    "Nome da localização é obrigatório",

  // ============================================================
  // Organization — Users (Etapa 1.5.6b-tris Phase ε)
  // ============================================================
  "organization.users.column.name": "Nome",
  "organization.users.column.network": "Rede",
  "organization.users.column.profile_type": "Tipo de Perfil",
  "organization.users.column.roles": "Cargos",
  "organization.users.column.status": "Status",
  "organization.users.column.last_login": "Último acesso",
  "organization.users.column.created": "Criado em",
  "organization.users.column.never": "Nunca",
  "organization.users.column.select_all": "Selecionar todos",
  "organization.users.column.select_row": "Selecionar linha",
  "organization.users.action.suspend": "Suspender",
  "organization.users.action.activate": "Ativar",
  "organization.users.status.active": "Ativo",
  "organization.users.status.pending": "Pendente",
  "organization.users.status.suspended": "Suspenso",
  "organization.users.status.terminated": "Encerrado",
  "organization.users.network.internal": "Interno",
  "organization.users.network.external": "Externo",

  // user-table.tsx — header
  "organization.users.header.title": "Membros",
  "organization.users.header.description":
    "Gerencie todos os membros da sua rede — equipe interna e canais externos.",
  "organization.users.count_label": "membro",

  // user-table.tsx — toolbar / filters
  "organization.users.toolbar.search_placeholder": "Buscar por nome ou e-mail…",
  "organization.users.toolbar.count": "{count} membros",
  "organization.users.filter.network_all": "Todas as Redes",
  "organization.users.filter.status_all": "Todos os Status",
  "organization.users.filter.profile_type_all": "Todos os Tipos",
  "organization.users.filter.role_all": "Todos os Cargos",

  // user-table.tsx — actions
  "organization.users.action.add_member": "Adicionar Membro",
  "organization.users.action.create_member": "Criar Membro",
  "organization.users.action.save_changes": "Salvar Alterações",
  "organization.users.action.saving": "Salvando…",
  "organization.users.action.reset_password": "Redefinir Senha",
  "organization.users.action.cancel_password_reset": "Cancelar redefinição de senha",
  "organization.users.action.done": "Pronto",
  "organization.users.action.send_invite": "Enviar Convite",

  // user-table.tsx — modal (create/edit)
  "organization.users.modal.add_title": "Adicionar Membro",
  "organization.users.modal.edit_title": "Editar Membro",
  "organization.users.modal.add_description":
    "Adicione um novo membro à rede. Uma senha temporária será gerada para que ele possa fazer login.",
  "organization.users.modal.edit_description":
    "Atualize os detalhes deste membro, tipo de perfil e cargos.",
  "organization.users.modal.delete_confirm":
    'Excluir "{name}"? Esta ação não pode ser desfeita.',
  "organization.users.modal.first_name_label": "Nome",
  "organization.users.modal.first_name_placeholder": "Nome",
  "organization.users.modal.last_name_label": "Sobrenome",
  "organization.users.modal.last_name_placeholder": "Sobrenome",
  "organization.users.modal.email_label": "E-mail",
  "organization.users.modal.email_placeholder": "usuario@empresa.com",
  "organization.users.modal.phone_label": "Telefone",
  "organization.users.modal.phone_placeholder": "+55 (11) 0000-0000",
  "organization.users.modal.password_label": "Senha",
  "organization.users.modal.password_hint":
    "(opcional — uma senha temporária é gerada se deixado em branco)",
  "organization.users.modal.password_placeholder": "Deixe em branco para gerar automaticamente",
  "organization.users.modal.password_show": "Mostrar senha",
  "organization.users.modal.password_hide": "Ocultar senha",
  "organization.users.modal.new_password_label": "Nova Senha",
  "organization.users.modal.new_password_placeholder": "Digite a nova senha",
  "organization.users.modal.profile_type_label": "Tipo de Perfil",
  "organization.users.modal.profile_type_placeholder": "Selecione um tipo de perfil…",
  "organization.users.modal.roles_label": "Cargos",
  "organization.users.modal.invite_title": "Convidar Membro",
  "organization.users.modal.invite_description":
    "Envie um convite por e-mail para adicionar um novo membro à organização.",
  "organization.users.modal.role_label": "Função",
  "organization.users.role.member": "Membro",
  "organization.users.role.admin": "Administrador",
  "organization.users.role.owner": "Proprietário",

  // user-table.tsx — invite (temporary password dialog)
  "organization.users.invite.title": "Usuário Criado",
  "organization.users.invite.description":
    "Compartilhe estas credenciais de login com {name}. Esta senha não será exibida novamente.",
  "organization.users.invite.email_label": "E-mail",
  "organization.users.invite.temp_password_label": "Senha Temporária",
  "organization.users.invite.copy_password": "Copiar senha",

  // user-table.tsx — feedback
  "organization.users.feedback.member_created": "Membro criado",
  "organization.users.feedback.member_updated": "Membro atualizado",
  "organization.users.feedback.member_deleted": "Membro excluído",
  "organization.users.feedback.member_activated": "Membro ativado",
  "organization.users.feedback.member_suspended": "Membro suspenso",
  "organization.users.feedback.password_reset": "Senha redefinida",
  "organization.users.feedback.password_copied": "Senha copiada para a área de transferência",
  "organization.users.feedback.invitation_sent": "Convite enviado para {email}",

  // user-table.tsx — errors
  "error.organization.users.required_fields":
    "Nome, e-mail e tipo de perfil são obrigatórios",
  "error.organization.users.save_failed": "Falha ao salvar",
  "error.organization.users.invitation_already_exists":
    "Já existe um convite pendente para este e-mail",

  // ============================================================
  // Organization — Departments (Etapa 1.5.6b-tris Phase ε)
  // ============================================================
  "organization.departments.tree.title": "Departamentos",
  "organization.departments.tree.description":
    "Gerencie sua estrutura organizacional — divisões, departamentos e equipes.",
  "organization.departments.tree.add_button": "Adicionar Departamento",
  "organization.departments.tree.header_department": "Departamento",
  "organization.departments.tree.header_head": "Responsável",
  "organization.departments.tree.header_members": "Membros",
  "organization.departments.tree.empty":
    "Nenhum departamento ainda. Crie seu primeiro departamento para começar.",
  "organization.departments.tree.delete_confirm":
    'Excluir "{name}"? Os subdepartamentos se tornarão de nível superior.',
  "organization.departments.tree.edit_title": "Editar",
  "organization.departments.tree.delete_title": "Excluir",
  "organization.hierarchy.title": "Hierarquia de Organizações",
  "organization.hierarchy.description":
    "Navegue a árvore de sub-organizações e opere uma sub-org através desta.",
  "organization.hierarchy.empty":
    "Esta organização não tem sub-organizações.",
  "organization.hierarchy.operate_button": "Operar esta sub-org",
  "organization.hierarchy.banner_text":
    "Você está operando {child} — uma sub-organização — através de {parent}.",
  "organization.hierarchy.banner_exit": "Sair do contexto",
  "organization.hierarchy.depts_panel_title": "Departamentos de {child}",
  "organization.hierarchy.add_dept_button": "Adicionar departamento",
  "organization.hierarchy.form_create_title": "Criar departamento em {child}",
  "organization.hierarchy.form_create_description":
    "Este departamento será criado na sub-organização {child}, não na sua organização.",
  "organization.hierarchy.create_confirm": "Criar o departamento “{name}” em {child}?",
  "organization.hierarchy.delete_confirm": "Excluir o departamento “{name}” em {child}?",
  "organization.hierarchy.depts_empty": "Nenhum departamento em {child}.",
  "organization.feedback.vertical_dept_created": "Departamento criado em {child}.",
  "organization.feedback.vertical_dept_deleted": "Departamento excluído de {child}.",
  "error.organization.org_vertical_forbidden":
    "Você não tem autorização para operar esta organização (não é uma sub-org da sua).",
  "error.organization.vertical_write_failed":
    "Falha ao gravar na sub-organização. Tente novamente.",

  "organization.departments.detail.back": "Voltar para Departamentos",
  "organization.departments.detail.head_label": "Responsável pelo Departamento",
  "organization.departments.detail.sub_departments": "Subdepartamentos",
  "organization.departments.detail.no_sub_departments": "Nenhum subdepartamento.",
  "organization.departments.detail.members": "Membros",
  "organization.departments.detail.no_members": "Nenhum membro ainda.",
  "organization.departments.detail.add": "Adicionar",
  "organization.departments.detail.select_person_placeholder":
    "Selecione uma pessoa…",
  "organization.departments.detail.led_by": "Liderado por {name}",
  "organization.departments.detail.part_of": "Parte de {name}",
  "organization.departments.detail.remove_title": "Remover",

  "organization.departments.form.edit_title": "Editar Departamento",
  "organization.departments.form.create_title": "Criar Departamento",
  "organization.departments.form.edit_description":
    "Atualize os detalhes deste departamento.",
  "organization.departments.form.create_description":
    "Adicione um novo departamento à sua organização.",
  "organization.departments.form.name_label": "Nome *",
  "organization.departments.form.name_placeholder": "ex. Engenharia",
  "organization.departments.form.description_label": "Descrição",
  "organization.departments.form.description_placeholder":
    "O que este departamento faz?",
  "organization.departments.form.parent_label": "Departamento Pai",
  "organization.departments.form.parent_none_placeholder":
    "Nenhum (nível superior)",
  "organization.departments.form.parent_none_option":
    "Nenhum (nível superior)",
  "organization.departments.form.head_label": "Responsável pelo Departamento",
  "organization.departments.form.head_none_placeholder":
    "Nenhum responsável atribuído",
  "organization.departments.form.head_none_option":
    "Nenhum responsável atribuído",
  "organization.departments.form.color_label": "Cor",
  "organization.departments.form.color.indigo": "Índigo",
  "organization.departments.form.color.green": "Verde",
  "organization.departments.form.color.pink": "Rosa",
  "organization.departments.form.color.amber": "Âmbar",
  "organization.departments.form.color.purple": "Roxo",
  "organization.departments.form.color.cyan": "Ciano",
  "organization.departments.form.color.red": "Vermelho",
  "organization.departments.form.color.orange": "Laranja",
  "organization.departments.form.save_changes": "Salvar Alterações",
  "organization.departments.form.create_department": "Criar Departamento",
  "organization.departments.form.saving": "Salvando…",

  "organization.feedback.department_created": "Departamento criado",
  "organization.feedback.department_updated": "Departamento atualizado",
  "organization.feedback.department_deleted": "Departamento excluído",
  "organization.feedback.member_added": "Membro adicionado",
  "organization.feedback.member_removed": "Membro removido",

  "error.organization.department_delete_failed":
    "Falha ao excluir departamento",
  "error.organization.member_add_failed": "Falha ao adicionar membro",
  "error.organization.name_required": "Nome é obrigatório",

  // ============================================================
  // Org Chart Canvas (Etapa 1.5.6b-tris — Phase ε)
  // ============================================================
  "organization.org_chart.title": "Organograma",
  "organization.org_chart.description":
    "Visão interativa da sua estrutura organizacional interna e linhas de reporte.",
  "organization.org_chart.loading": "Carregando organograma…",
  "organization.org_chart.filter.all_departments": "Todos os Departamentos",
  "organization.org_chart.badge.people_count": "{count} pessoas",

  // ============================================================
  // Network Map Canvas (Etapa 1.5.6b-tris — Phase ε)
  // ============================================================
  "organization.network_map.title": "Mapa da Rede",
  "organization.network_map.description":
    "Visão interativa da sua rede externa — patrocinadores, downlines e relações de parceria.",
  "organization.network_map.loading": "Carregando mapa da rede…",
  "organization.network_map.empty.title":
    "Nenhum perfil de rede externa ainda",
  "organization.network_map.empty.description":
    "Parceiros externos aparecerão aqui assim que forem adicionados à rede.",
  "organization.network_map.badge.partners_count": "{count} parceiros",

  // ============================================================
  // Partners (Etapa 1.5.6b — Phase C)
  // ============================================================
  "partners.list.title": "Rede de Parceiros",
  "partners.list.description":
    "Gerencie marcas parceiras e suas configurações de desconto/comissão por tier.",
  "partners.list.empty":
    'Nenhum parceiro ainda. Clique em "Novo Parceiro" para adicionar.',
  "partners.list.tab_partners": "Parceiros",
  "partners.list.tab_matrix": "Matriz de Tiers",
  "partners.list.tab_estimator": "Estimador de Receita",
  "partners.list.new_partner": "Novo Parceiro",
  "partners.list.import": "Importar Planilha",
  "partners.list.export": "Exportar Planilha",

  "partners.card.kickback_label": "Comissão",
  "partners.card.tier_discounts_label": "Descontos por Tier",
  "partners.card.tiers_count": "{count} tiers",
  "partners.card.inactive": "Inativo",

  "partners.form.edit_title": "Editar Parceiro",
  "partners.form.new_title": "Novo Parceiro",
  "partners.form.name": "Nome",
  "partners.form.key": "Chave",
  "partners.form.key_placeholder": "snake_case_minusculo",
  "partners.form.category": "Categoria",
  "partners.form.website_url": "URL do Site",
  "partners.form.logo_url": "URL do Logo",
  "partners.form.url_placeholder": "https://...",
  "partners.form.discount_description": "Descrição do Desconto",
  "partners.form.discount_description_placeholder":
    "ex.: 20% de desconto em todos os produtos para assinantes do ComeçaAI",
  "partners.form.kickback_type": "Tipo de Comissão",
  "partners.form.kickback_percent": "Comissão %",
  "partners.form.kickback_amount": "Valor da Comissão ($)",
  "partners.form.active": "Ativo",
  "partners.form.update": "Atualizar",
  "partners.form.create": "Criar",

  "partners.form.category.supplements": "Suplementos",
  "partners.form.category.fitness": "Fitness",
  "partners.form.category.apparel": "Vestuário",
  "partners.form.category.nutrition": "Nutrição",
  "partners.form.category.recovery": "Recuperação",
  "partners.form.category.technology": "Tecnologia",
  "partners.form.category.other": "Outro",

  "partner.kickback_type.NONE": "Nenhuma",
  "partner.kickback_type.PERCENT_OF_SALE": "% sobre Venda",
  "partner.kickback_type.FLAT_PER_REFERRAL": "Fixo por Indicação",
  "partner.kickback_type.FLAT_PER_MONTH": "Fixo por Mês",

  "partners.kickback.empty":
    "Nenhum parceiro ativo com acordo de comissão. Configure comissões nos cards primeiro.",
  "partners.kickback.inputs_title": "Indicações Mensais por Parceiro",
  "partners.kickback.inputs_description":
    "Estime indicações mensais de cada parceiro para ver os custos projetados de comissão.",
  "partners.kickback.referrals_unit": "indicações/mês",
  "partners.kickback.results_title": "Projeção de Custo de Comissão",
  "partners.kickback.total_referrals": "Total de Indicações/Mês",
  "partners.kickback.monthly_cost": "Custo Mensal de Comissão",
  "partners.kickback.annual_cost": "Custo Anual de Comissão",
  "partners.kickback.avg_per_referral": "Custo Médio/Indicação",
  "partners.kickback.per_partner_breakdown": "Detalhamento por Parceiro",
  "partners.kickback.refs_label": "{count} indicações",
  "partners.kickback.per_month": "{value}/mês",

  "partners.tier_assignment.empty":
    "Nenhum parceiro ativo. Crie e ative parceiros primeiro.",
  "partners.tier_assignment.description":
    "Defina percentuais de desconto para cada combinação parceiro × tier.",
  "partners.tier_assignment.save_all": "Salvar Tudo",
  "partners.tier_assignment.column_partner": "Parceiro",

  "partners.feedback.created": "Criado",
  "partners.feedback.updated": "Atualizado",
  "partners.feedback.deleted": "Excluído",
  "partners.feedback.matrix_saved": "Atribuições de tier salvas",

  "error.partners.save_failed": "Falha ao salvar",
  "error.partners.delete_failed": "Falha ao excluir",
  "error.partners.matrix_save_failed": "Falha ao salvar atribuições",

  // ============================================================
  // Profile (Etapa 1.5.6b — Phase C, IDENTITY)
  // ============================================================
  "profile.title": "Perfil",
  "profile.description":
    "Gerencie suas informações pessoais e configurações de conta.",
  "profile.section.picture": "Foto de perfil",
  "profile.section.personal": "Informações pessoais",
  "profile.section.account": "Detalhes da conta",
  "profile.field.full_name": "Nome completo",
  "profile.field.email": "E-mail",
  "profile.field.phone": "Telefone",
  "profile.field.role": "Cargo",
  "profile.field.account_id": "ID da conta",
  "profile.field.status": "Status",
  "profile.field.created": "Criado em",
  "profile.field.last_login": "Último login",
  "profile.placeholder.name": "Seu nome",
  "profile.placeholder.email": "seu@email.com",
  "profile.placeholder.phone": "+55 (11) 91234-5678",
  "profile.last_login.label": "Último login: {value}",
  "profile.feedback.updated": "Perfil atualizado",
  "profile.feedback.avatar_updated": "Avatar atualizado",
  "profile.status.ACTIVE": "Ativo",
  "profile.status.INVITED": "Convidado",
  "profile.status.INACTIVE": "Inativo",

  "error.profile.name_required": "Nome é obrigatório",
  "error.profile.email_required": "E-mail é obrigatório",
  "error.profile.save_failed": "Falha ao salvar",
  "error.profile.avatar_upload_failed": "Falha ao enviar avatar",

  // ============================================================
  // Network — Phase 1.5.6b-bis
  // ============================================================

  // Subpanel chrome
  "network.subpanel.title": "Rede",
  "network.subpanel.all_members": "Todos os membros",
  "network.subpanel.org_chart": "Organograma",
  "network.subpanel.network_map": "Mapa da rede",
  "network.subpanel.internal": "Rede interna",
  "network.subpanel.external": "Rede externa",
  "network.subpanel.no_departments": "Nenhum departamento.",
  "network.subpanel.no_channels": "Nenhum canal.",
  "network.subpanel.manage": "Gerenciar rede",

  // Manage dialog
  "network.manage.title": "Gerenciar",
  "network.manage.description": "Tipos de perfil e cargos.",
  "network.manage.tab.profiles": "Tipos de perfil",
  "network.manage.tab.roles": "Cargos",
  "network.manage.close": "Fechar",
  "network.manage.new": "Novo",
  "network.manage.loading": "Carregando…",
  "network.manage.none_yet": "Nenhum ainda.",
  "network.manage.profile_types.description":
    "Tipos de perfil definem o tipo de membro (cargo interno ou canal externo).",
  "network.manage.profile_types.internal": "Rede interna",
  "network.manage.profile_types.external": "Rede externa",
  "network.manage.profile_types.confirm_delete":
    'Excluir o tipo de perfil "{name}"? Esta ação não pode ser desfeita.',
  "network.manage.profile_types.cannot_delete":
    "Não é possível excluir (em uso)",
  "network.manage.profile_types.delete": "Excluir",
  "network.manage.profile_types.edit": "Editar",
  "network.manage.roles.description":
    "Cargos controlam o que os membros podem fazer na rede.",
  "network.manage.roles.general": "Geral",
  "network.manage.roles.internal": "Rede interna",
  "network.manage.roles.external": "Rede externa",
  "network.manage.roles.confirm_delete":
    'Excluir o cargo "{name}"? Esta ação não pode ser desfeita.',
  "network.manage.roles.system_role": "Cargo do sistema",
  "network.manage.roles.delete": "Excluir",
  "network.manage.roles.edit": "Editar",

  // Network type enum
  "network.type.INTERNAL": "Interna",
  "network.type.EXTERNAL": "Externa",
  "network.type.both": "Ambas as redes",
  "network.type.internal_only": "Apenas interna",
  "network.type.external_only": "Apenas externa",

  // Profile status enum
  "network.profile.status.ACTIVE": "Ativo",
  "network.profile.status.PENDING": "Pendente",
  "network.profile.status.SUSPENDED": "Suspenso",
  "network.profile.status.TERMINATED": "Encerrado",

  // Profile types — list/table
  "network.profile_types.list.search_placeholder": "Buscar tipos de perfil...",
  "network.profile_types.list.column.name": "Nome",
  "network.profile_types.list.column.type": "Tipo",
  "network.profile_types.list.column.custom_fields": "Campos personalizados",
  "network.profile_types.list.column.profiles": "Perfis",
  "network.profile_types.list.column.status": "Status",
  "network.profile_types.list.fields_count": "{count} campos",
  "network.profile_types.list.status.active": "Ativo",
  "network.profile_types.list.status.inactive": "Inativo",
  "network.profile_types.list.action.edit": "Editar",
  "network.profile_types.list.action.deactivate": "Desativar",
  "network.profile_types.list.action.activate": "Ativar",
  "network.profile_types.list.confirm_deactivate":
    "Desativar este tipo de perfil?",

  // Profile types — detail/form
  "network.profile_types.detail.network_type_label": "Tipo de rede *",
  "network.profile_types.detail.network_type.internal_hint":
    "Funcionários, gerentes, vendedores",
  "network.profile_types.detail.network_type.external_hint":
    "Promotores, influenciadores, instrutores",
  "network.profile_types.detail.display_name_label": "Nome de exibição *",
  "network.profile_types.detail.display_name_placeholder":
    "ex.: Gerente regional",
  "network.profile_types.detail.slug_label": "Slug *",
  "network.profile_types.detail.slug_placeholder": "ex.: regional_manager",
  "network.profile_types.detail.slug_hint":
    "Identificador único. Não pode ser alterado após a criação.",
  "network.profile_types.detail.description_label": "Descrição",
  "network.profile_types.detail.description_placeholder":
    "Breve descrição deste tipo de perfil",
  "network.profile_types.detail.color_label": "Cor do badge",
  "network.profile_types.detail.sort_order_label": "Ordem de exibição",
  "network.profile_types.detail.active_label":
    "Ativo (visível no assistente e na criação de perfil)",
  "network.profile_types.detail.wizard_fields_label":
    "Campos personalizados do assistente",
  "network.profile_types.detail.wizard_fields_hint":
    "Campos que aparecem no Passo 6 do assistente de criação de perfil para este tipo.",
  "network.profile_types.detail.creating": "Criando...",
  "network.profile_types.detail.saving": "Salvando...",
  "network.profile_types.detail.create_button": "Criar tipo de perfil",
  "network.profile_types.detail.save_button": "Salvar alterações",
  "network.profile_types.detail.cancel": "Cancelar",

  // Profile types — wizard fields editor
  "network.profile_types.field_editor.empty":
    "Nenhum campo personalizado ainda. Adicione campos para coletar dados específicos do perfil.",
  "network.profile_types.field_editor.unnamed": "Campo sem nome",
  "network.profile_types.field_editor.required_badge": "obrigatório",
  "network.profile_types.field_editor.label_label": "Rótulo *",
  "network.profile_types.field_editor.label_placeholder": "Rótulo de exibição",
  "network.profile_types.field_editor.key_label": "Chave *",
  "network.profile_types.field_editor.key_placeholder": "snake_case_key",
  "network.profile_types.field_editor.type_label": "Tipo",
  "network.profile_types.field_editor.step_label": "Passo do assistente",
  "network.profile_types.field_editor.step_2": "Passo 2 — Identidade",
  "network.profile_types.field_editor.step_3": "Passo 3 — Hierarquia",
  "network.profile_types.field_editor.step_6": "Passo 6 — Atributos estendidos",
  "network.profile_types.field_editor.placeholder_label": "Placeholder",
  "network.profile_types.field_editor.placeholder_hint":
    "Texto opcional de placeholder",
  "network.profile_types.field_editor.required_field": "Campo obrigatório",
  "network.profile_types.field_editor.options_label": "Opções",
  "network.profile_types.field_editor.option_placeholder":
    "Digite uma opção e pressione Enter",
  "network.profile_types.field_editor.add_field": "Adicionar campo",

  // Profile type field types enum
  "network.profile_types.field_type.text": "texto",
  "network.profile_types.field_type.email": "email",
  "network.profile_types.field_type.phone": "telefone",
  "network.profile_types.field_type.number": "número",
  "network.profile_types.field_type.textarea": "texto longo",
  "network.profile_types.field_type.select": "seleção",
  "network.profile_types.field_type.multi_select": "seleção múltipla",
  "network.profile_types.field_type.toggle": "alternar",
  "network.profile_types.field_type.date": "data",
  "network.profile_types.field_type.url": "url",

  // Roles — list/table
  "network.roles.list.search_placeholder": "Buscar cargos...",
  "network.roles.list.column.role": "Cargo",
  "network.roles.list.column.slug": "Slug",
  "network.roles.list.column.network": "Rede",
  "network.roles.list.column.inherits_from": "Herda de",
  "network.roles.list.column.members": "Membros",
  "network.roles.list.confirm_delete":
    'Excluir o cargo "{name}"? Esta ação não pode ser desfeita.',
  "network.roles.list.action.edit": "Editar",
  "network.roles.list.action.delete": "Excluir",

  // Roles — detail/form
  "network.roles.detail.system_role_title": "Cargo do sistema",
  "network.roles.detail.system_role_hint":
    "Alguns campos em cargos do sistema não podem ser modificados.",
  "network.roles.detail.display_name_label": "Nome de exibição *",
  "network.roles.detail.display_name_placeholder": "ex.: Gerente regional",
  "network.roles.detail.slug_label": "Slug *",
  "network.roles.detail.slug_placeholder": "ex.: regional_manager",
  "network.roles.detail.description_label": "Descrição",
  "network.roles.detail.description_placeholder":
    "Pelo que este cargo é responsável?",
  "network.roles.detail.network_type_label": "Tipo de rede",
  "network.roles.detail.network_type_placeholder": "Ambas as redes",
  "network.roles.detail.parent_role_label": "Herda de (cargo pai)",
  "network.roles.detail.parent_role_placeholder":
    "Sem cargo pai (cargo de nível superior)",
  "network.roles.detail.parent_role_none": "Sem cargo pai (cargo de nível superior)",
  "network.roles.detail.parent_role_hint":
    "Este cargo herdará todas as permissões do cargo pai.",
  "network.roles.detail.creating": "Criando...",
  "network.roles.detail.saving": "Salvando...",
  "network.roles.detail.create_button": "Criar cargo",
  "network.roles.detail.save_button": "Salvar alterações",
  "network.roles.detail.cancel": "Cancelar",

  // Permissions — matrix
  "network.permissions.matrix.system_title": "Cargo do sistema",
  "network.permissions.matrix.system_hint":
    "Permissões de cargos do sistema não podem ser modificadas.",
  "network.permissions.matrix.saving": "Salvando...",
  "network.permissions.matrix.count_of_total": "{assigned} / {total}",

  // Profiles — list/table
  "network.profiles.list.search_placeholder": "Buscar perfis...",
  "network.profiles.list.column.name": "Nome",
  "network.profiles.list.column.network": "Rede",
  "network.profiles.list.column.profile_type": "Tipo de perfil",
  "network.profiles.list.column.status": "Status",
  "network.profiles.list.column.rank": "Rank",

  // Wizard — common chrome
  "network.wizard.title": "Assistente",
  "network.wizard.common.step_indicator": "Passo {current} de {total}",
  "network.wizard.common.back": "Voltar",
  "network.wizard.common.next": "Continuar",
  "network.wizard.common.finish": "Concluir",
  "network.wizard.common.cancel": "Cancelar",
  "network.wizard.common.required_field": "Campo obrigatório",

  // Wizard — short labels in progress bar
  "network.wizard.label.network": "Rede",
  "network.wizard.label.identity": "Identidade",
  "network.wizard.label.hierarchy": "Hierarquia",
  "network.wizard.label.roles": "Cargos",
  "network.wizard.label.comp_plan": "Remuneração",
  "network.wizard.label.details": "Detalhes",
  "network.wizard.label.review": "Revisão",
  "network.wizard.label.step_n": "Passo {n}",

  // Wizard — Step 1 (Network Type)
  "network.wizard.step1.title": "Tipo de rede",
  "network.wizard.step1.description":
    "Selecione a qual rede este perfil pertence.",
  "network.wizard.step1.internal_label": "Interna",
  "network.wizard.step1.internal_description":
    "Funcionários, gerentes e equipe de vendas",
  "network.wizard.step1.external_label": "Externa",
  "network.wizard.step1.external_description":
    "Promotores, influenciadores, instrutores e parceiros",
  "network.wizard.step1.select_profile_type": "Selecione o tipo de perfil",
  "network.wizard.step1.for_network_internal": "para a rede interna",
  "network.wizard.step1.for_network_external": "para a rede externa",

  // Wizard — Step 2 (Identity)
  "network.wizard.step2.title": "Identidade",
  "network.wizard.step2.description":
    "Informações básicas para este perfil.",
  "network.wizard.step2.first_name_label": "Nome *",
  "network.wizard.step2.first_name_placeholder": "Joana",
  "network.wizard.step2.last_name_label": "Sobrenome *",
  "network.wizard.step2.last_name_placeholder": "Silva",
  "network.wizard.step2.email_label": "Endereço de e-mail *",
  "network.wizard.step2.email_placeholder": "joana@exemplo.com",
  "network.wizard.step2.email_taken":
    "Este e-mail já está cadastrado na rede.",
  "network.wizard.step2.phone_label": "Telefone",
  "network.wizard.step2.phone_placeholder": "+55 (11) 91234-5678",
  "network.wizard.step2.avatar_label": "Foto de perfil",
  "network.wizard.step2.avatar_change": "Alterar foto",
  "network.wizard.step2.avatar_upload": "Enviar foto",
  "network.wizard.step2.avatar_remove": "Remover",
  "network.wizard.step2.avatar_hint":
    "PNG, JPG até 2MB. Armazenado localmente por enquanto.",

  // Wizard — Step 3 (Hierarchy)
  "network.wizard.step3.title": "Posicionamento na hierarquia",
  "network.wizard.step3.description":
    "Defina o supervisor e as atribuições de equipe para este perfil.",
  "network.wizard.step3.parent_label": "Supervisor / Upline",
  "network.wizard.step3.parent_optional": "(opcional)",
  "network.wizard.step3.parent_search_placeholder":
    "Buscar por nome ou e-mail...",
  "network.wizard.step3.searching": "Buscando...",
  "network.wizard.step3.teams_label": "Atribuições de equipe",
  "network.wizard.step3.no_teams": "Nenhuma equipe criada ainda.",
  "network.wizard.step3.team_members_count": "{count} membros",

  // Wizard — Step 4 (Roles)
  "network.wizard.step4.title": "Atribuição de cargos",
  "network.wizard.step4.description":
    "Atribua cargos para controlar o que este perfil pode acessar.",
  "network.wizard.step4.perms_count": "{count} permissões",
  "network.wizard.step4.no_roles_warning":
    "Nenhum cargo selecionado. Este perfil não terá permissões de acesso.",

  // Wizard — Step 5 (Compensation)
  "network.wizard.step5.title": "Plano de remuneração",
  "network.wizard.step5.description":
    "Selecione o plano de remuneração para este membro da rede externa.",
  "network.wizard.step5.no_plans":
    "Nenhum plano de remuneração configurado ainda. Você pode atribuir um depois.",
  "network.wizard.step5.commission_suffix": "comissão",

  // Wizard — Step 6 (Attributes)
  "network.wizard.step6.title": "Informações adicionais",
  "network.wizard.step6.no_fields":
    "Nenhum campo adicional para este tipo de perfil.",
  "network.wizard.step6.description":
    "Forneça detalhes específicos para {type}.",
  "network.wizard.step6.description_fallback": "este tipo de perfil",
  "network.wizard.step6.select_option": "Selecione uma opção",

  // Wizard — Step 7 (Review)
  "network.wizard.step7.title": "Revisar e confirmar",
  "network.wizard.step7.description":
    "Verifique tudo antes de criar o perfil.",
  "network.wizard.step7.edit": "Editar",
  "network.wizard.step7.section.network_type": "Rede e tipo",
  "network.wizard.step7.section.identity": "Identidade",
  "network.wizard.step7.section.hierarchy": "Hierarquia",
  "network.wizard.step7.section.roles": "Cargos",
  "network.wizard.step7.section.compensation": "Remuneração",
  "network.wizard.step7.section.attributes": "Informações adicionais",
  "network.wizard.step7.row.network": "Rede",
  "network.wizard.step7.row.profile_type": "Tipo de perfil",
  "network.wizard.step7.row.name": "Nome",
  "network.wizard.step7.row.email": "E-mail",
  "network.wizard.step7.row.phone": "Telefone",
  "network.wizard.step7.parent_id": "ID do supervisor:",
  "network.wizard.step7.no_parent": "Nenhum supervisor atribuído",
  "network.wizard.step7.teams_assigned":
    "{count} equipe(s) atribuída(s)",
  "network.wizard.step7.roles_assigned":
    "{count} cargo(s) atribuído(s)",
  "network.wizard.step7.no_roles": "Nenhum cargo atribuído",
  "network.wizard.step7.comp_plan_selected": "Plano de remuneração selecionado",
  "network.wizard.step7.no_comp_plan":
    "Nenhum plano de remuneração selecionado",
  "network.wizard.step7.creating": "Criando perfil...",
  "network.wizard.step7.create_button": "Criar perfil",

  // Network feedback / errors
  "error.network.unexpected": "Ocorreu um erro inesperado",
  "error.network.profile.create_failed":
    "Ocorreu um erro inesperado. Tente novamente.",

  // Promoters — Agreement editor
  "network.promoters.agreement.editor.title.new": "Novo Acordo de Parceiro",
  "network.promoters.agreement.editor.title.edit": "Editar Acordo",
  "network.promoters.agreement.editor.description":
    "Combine um plano de comissão com termos de pagamento e regras de clawback.",
  "network.promoters.agreement.editor.field.name.label": "Nome do Acordo",
  "network.promoters.agreement.editor.field.name.placeholder":
    'ex. "Apex — Lançamento 2026"',
  "network.promoters.agreement.editor.field.partner.label": "Parceiro D2D",
  "network.promoters.agreement.editor.field.partner.placeholder":
    "Selecione o parceiro",
  "network.promoters.agreement.editor.field.plan.label": "Plano de Comissão",
  "network.promoters.agreement.editor.field.plan.placeholder":
    "Selecione o plano",
  "network.promoters.agreement.editor.field.status.label": "Status",
  "network.promoters.agreement.editor.status.draft": "Rascunho",
  "network.promoters.agreement.editor.status.active": "Ativo",
  "network.promoters.agreement.editor.status.suspended": "Suspenso",
  "network.promoters.agreement.editor.status.terminated": "Encerrado",
  "network.promoters.agreement.editor.field.cadence.label":
    "Cadência de Pagamento",
  "network.promoters.agreement.editor.cadence.weekly": "Semanal",
  "network.promoters.agreement.editor.cadence.biweekly": "Quinzenal",
  "network.promoters.agreement.editor.cadence.monthly": "Mensal",
  "network.promoters.agreement.editor.field.hold.label":
    "Período de Retenção (dias)",
  "network.promoters.agreement.editor.field.effective_from.label":
    "Vigente A Partir De",
  "network.promoters.agreement.editor.field.notes.label": "Notas",
  "network.promoters.agreement.editor.clawback.title": "Regras de Clawback",
  "network.promoters.agreement.editor.clawback.description":
    "Se um cliente cancelar dentro da janela, esta % do bônus adiantado é estornada.",
  "network.promoters.agreement.editor.clawback.add": "Adicionar",
  "network.promoters.agreement.editor.clawback.days_placeholder": "Dias",
  "network.promoters.agreement.editor.clawback.days_suffix": "dias =",
  "network.promoters.agreement.editor.clawback.percent_placeholder": "%",
  "network.promoters.agreement.editor.clawback.percent_suffix": "% de clawback",
  "network.promoters.agreement.editor.submit.create": "Criar Acordo",
  "network.promoters.agreement.editor.submit.save": "Salvar Alterações",
  "network.promoters.agreement.editor.submit.saving": "Salvando...",
  "network.promoters.agreement.editor.feedback.created": "Acordo criado",
  "network.promoters.agreement.editor.feedback.updated": "Acordo atualizado",

  // Promoters — Commission Plan editor
  "network.promoters.plan.editor.title.new": "Novo Plano de Comissão",
  "network.promoters.plan.editor.title.edit": "Editar {name} v{version}",
  "network.promoters.plan.editor.description":
    "Defina bônus adiantados e taxas residuais por faixa de assinatura e cargo.",
  "network.promoters.plan.editor.field.name.label": "Nome do Plano",
  "network.promoters.plan.editor.field.name.placeholder":
    'ex. "Lançamento 2026"',
  "network.promoters.plan.editor.field.active.label": "Ativo",
  "network.promoters.plan.editor.field.base_residual.label":
    "Residual Base (%)",
  "network.promoters.plan.editor.field.effective_from.label":
    "Vigente A Partir De",
  "network.promoters.plan.editor.field.effective_to.label": "Vigente Até",
  "network.promoters.plan.editor.field.notes.label": "Notas",
  "network.promoters.plan.editor.field.notes.placeholder": "Notas internas...",
  "network.promoters.plan.editor.rates.title": "Taxas por Faixa e Cargo",
  "network.promoters.plan.editor.rates.description":
    "Bônus adiantado ($) e residual (%) para cada cargo em cada faixa de assinatura.",
  "network.promoters.plan.editor.rates.col.tier": "Faixa",
  "network.promoters.plan.editor.rates.col.bonus": "Bônus $",
  "network.promoters.plan.editor.rates.col.residual": "Resid %",
  "network.promoters.plan.editor.role.rep": "Rep",
  "network.promoters.plan.editor.role.team_lead": "Líder de Equipe",
  "network.promoters.plan.editor.role.regional_leader": "Líder Regional",
  "network.promoters.plan.editor.submit.create": "Criar Plano",
  "network.promoters.plan.editor.submit.save": "Salvar Alterações",
  "network.promoters.plan.editor.submit.saving": "Salvando...",
  "network.promoters.plan.editor.feedback.created": "Plano criado",
  "network.promoters.plan.editor.feedback.updated": "Plano atualizado",

  // Promoters — D2D Partner editor
  "network.promoters.d2d_partner.editor.title.new": "Novo Parceiro D2D",
  "network.promoters.d2d_partner.editor.title.edit": "Editar Parceiro D2D",
  "network.promoters.d2d_partner.editor.description":
    "Detalhes da empresa externa de vendas D2D.",
  "network.promoters.d2d_partner.editor.field.name.label": "Nome da Empresa",
  "network.promoters.d2d_partner.editor.field.name.placeholder":
    "ex. Apex Door Knockers",
  "network.promoters.d2d_partner.editor.field.active.label": "Ativo",
  "network.promoters.d2d_partner.editor.field.contact_name.label":
    "Nome do Contato",
  "network.promoters.d2d_partner.editor.field.email.label": "E-mail",
  "network.promoters.d2d_partner.editor.field.phone.label": "Telefone",
  "network.promoters.d2d_partner.editor.field.notes.label": "Notas",
  "network.promoters.d2d_partner.editor.submit.create": "Criar Parceiro",
  "network.promoters.d2d_partner.editor.submit.save": "Salvar Alterações",
  "network.promoters.d2d_partner.editor.submit.saving": "Salvando...",
  "network.promoters.d2d_partner.editor.feedback.created": "Parceiro criado",
  "network.promoters.d2d_partner.editor.feedback.updated":
    "Parceiro atualizado",

  // Promoters — Org Tree editor
  "network.promoters.org_tree.editor.empty":
    "Nenhum nó organizacional ainda. Adicione um Líder Regional para começar.",
  "network.promoters.org_tree.editor.placeholder.name": "Nome",
  "network.promoters.org_tree.editor.placeholder.email": "E-mail (opcional)",
  "network.promoters.org_tree.editor.action.add": "Adicionar",
  "network.promoters.org_tree.editor.action.cancel": "Cancelar",
  "network.promoters.org_tree.editor.action.add_regional_leader":
    "Adicionar Líder Regional",
  "network.promoters.org_tree.editor.title.add_report":
    "Adicionar subordinado",
  "network.promoters.org_tree.editor.title.remove": "Remover",
  "network.promoters.org_tree.editor.confirm_delete":
    'Remover "{name}" e todos os seus subordinados?',
  "network.promoters.org_tree.editor.role.rep": "Rep",
  "network.promoters.org_tree.editor.role.team_lead": "Líder de Equipe",
  "network.promoters.org_tree.editor.role.regional_leader": "Líder Regional",
  "network.promoters.org_tree.editor.feedback.added": "Adicionado",
  "network.promoters.org_tree.editor.feedback.removed": "Removido",

  // Promoters — Errors
  "error.network.promoters.agreement.save_failed":
    "Falha ao salvar o acordo",
  "error.network.promoters.plan.save_failed": "Falha ao salvar o plano",
  "error.network.promoters.d2d_partner.save_failed":
    "Falha ao salvar o parceiro",
  "error.network.promoters.org_tree.add_failed": "Falha ao adicionar",

  // Promoters — Tab labels
  "network.promoters.tabs.plans": "Planos",
  "network.promoters.tabs.partners": "Parceiros",
  "network.promoters.tabs.agreements": "Acordos",
  "network.promoters.tabs.overrides": "Overrides",
  "network.promoters.tabs.accelerators": "Aceleradores",
  "network.promoters.tabs.ledger": "Lançamentos",
  "network.promoters.tabs.simulator": "Simulador",

  // Promoters — Accelerators tab
  "network.promoters.accelerators.description":
    "Escalonamento de bônus por volume. Reps que vendem mais em um período recebem multiplicadores maiores nos bônus iniciais.",
  "network.promoters.accelerators.plan_label": "Plano:",
  "network.promoters.accelerators.plan_placeholder": "Selecione o plano",
  "network.promoters.accelerators.section_title": "Faixas de Performance",
  "network.promoters.accelerators.add_tier": "Adicionar Faixa",
  "network.promoters.accelerators.empty":
    "Sem faixas de performance. Todos os reps recebem o bônus base.",
  "network.promoters.accelerators.save_button": "Salvar Faixas de Performance",
  "network.promoters.accelerators.field.label": "Rótulo",
  "network.promoters.accelerators.field.label_placeholder": "Bronze",
  "network.promoters.accelerators.field.min_sales": "Vendas Mín.",
  "network.promoters.accelerators.field.max_sales": "Vendas Máx.",
  "network.promoters.accelerators.field.multiplier": "Multiplicador",
  "network.promoters.accelerators.field.bonus_flat": "Fixo $",

  // Promoters — Agreements tab
  "network.promoters.agreements.description":
    "Acordos de parceiro combinam um plano de comissão com regras de clawback e cronogramas de pagamento. Cada Parceiro D2D recebe um acordo atribuído.",
  "network.promoters.agreements.new_button": "Novo Acordo",
  "network.promoters.agreements.empty_title": "Nenhum acordo ainda",
  "network.promoters.agreements.empty_description":
    "Crie um acordo para atribuir um plano de comissão a um Parceiro D2D.",
  "network.promoters.agreements.confirm_delete": 'Excluir "{name}"?',
  "network.promoters.agreements.clawback_label": "Clawback:",
  "network.promoters.agreements.status.active": "ATIVO",
  "network.promoters.agreements.status.draft": "RASCUNHO",
  "network.promoters.agreements.status.suspended": "SUSPENSO",
  "network.promoters.agreements.status.terminated": "ENCERRADO",
  "network.promoters.agreements.cadence.weekly": "Semanal",
  "network.promoters.agreements.cadence.biweekly": "Quinzenal",
  "network.promoters.agreements.cadence.monthly": "Mensal",
  "network.promoters.agreements.cadence.quarterly": "Trimestral",
  "network.promoters.agreements.metric.payout": "Pagamento",
  "network.promoters.agreements.metric.hold": "Retenção",
  "network.promoters.agreements.metric.hold_days": "{days} dias",
  "network.promoters.agreements.metric.effective": "Vigência",
  "network.promoters.agreements.metric.ledger": "Lançamentos",
  "network.promoters.agreements.metric.ledger_entries":
    "{count} lançamentos",

  // Promoters — Plans tab
  "network.promoters.plans.description":
    "Planos de comissão definem bônus iniciais e taxas residuais por tier de assinatura e função. Apenas um plano pode estar ativo por vez.",
  "network.promoters.plans.new_button": "Novo Plano",
  "network.promoters.plans.empty_title": "Nenhum plano de comissão ainda",
  "network.promoters.plans.empty_description":
    "Crie seu primeiro plano para definir como reps D2D ganham bônus e residuais.",
  "network.promoters.plans.confirm_delete": 'Excluir "{name} v{version}"?',
  "network.promoters.plans.active_badge": "Ativo",
  "network.promoters.plans.residual_suffix": "{value} residual",
  "network.promoters.plans.action.duplicate": "Duplicar",
  "network.promoters.plans.action.activate": "Ativar",
  "network.promoters.plans.action.deactivate": "Desativar",
  "network.promoters.plans.metric.residual": "Residual",
  "network.promoters.plans.metric.overrides": "Overrides",
  "network.promoters.plans.metric.overrides_count": "{count} regras",
  "network.promoters.plans.metric.agreements": "Acordos",
  "network.promoters.plans.metric.effective": "Vigência",

  // Promoters — Partners (D2D) tab
  "network.promoters.partners.description":
    "Empresas externas de vendas D2D que vendem suas assinaturas. Cada parceiro tem sua própria árvore organizacional com Líderes Regionais, Líderes de Equipe e Reps.",
  "network.promoters.partners.new_button": "Novo Parceiro",
  "network.promoters.partners.empty_title": "Nenhum Parceiro D2D ainda",
  "network.promoters.partners.empty_description":
    "Adicione sua primeira empresa de vendas D2D para começar a montar árvores organizacionais.",
  "network.promoters.partners.confirm_delete":
    'Excluir "{name}" e todos os seus nós organizacionais?',
  "network.promoters.partners.inactive_badge": "Inativo",
  "network.promoters.partners.hide_org_tree": "Ocultar Árvore Organizacional",
  "network.promoters.partners.show_org_tree": "Mostrar Árvore Organizacional",
  "network.promoters.partners.people_count": "{count} pessoas",
  "network.promoters.partners.metric.regional": "Regionais",
  "network.promoters.partners.metric.team_leads": "Líderes de Equipe",
  "network.promoters.partners.metric.reps": "Reps",
  "network.promoters.partners.metric.agreements": "Acordos",

  // Promoters — Ledger tab
  "network.promoters.ledger.description":
    "Cada evento de comissão é registrado aqui: ganho, retido, liberado, estornado e ajustado.",
  "network.promoters.ledger.empty": "Nenhum lançamento encontrado.",
  "network.promoters.ledger.page_of": "Página {page} de {total}",
  "network.promoters.ledger.entries_count": "{count} lançamentos",
  "network.promoters.ledger.summary.earned": "Ganho",
  "network.promoters.ledger.summary.held": "Em retenção",
  "network.promoters.ledger.summary.released": "Liberado",
  "network.promoters.ledger.summary.clawed_back": "Estornado",
  "network.promoters.ledger.entry_type.earned": "Ganho",
  "network.promoters.ledger.entry_type.held": "Em retenção",
  "network.promoters.ledger.entry_type.released": "Liberado",
  "network.promoters.ledger.entry_type.clawed_back": "Estornado",
  "network.promoters.ledger.entry_type.adjusted": "Ajustado",
  "network.promoters.ledger.role.rl": "LR",
  "network.promoters.ledger.role.tl": "LE",
  "network.promoters.ledger.role.rep": "Rep",
  "network.promoters.ledger.source.upfront_bonus": "Bônus Inicial",
  "network.promoters.ledger.source.residual": "Residual",
  "network.promoters.ledger.source.override": "Override",
  "network.promoters.ledger.source.accelerator_bonus": "Acelerador",
  "network.promoters.ledger.source.clawback": "Clawback",
  "network.promoters.ledger.source.manual_adjustment": "Manual",
  "network.promoters.ledger.filter.partner": "Parceiro",
  "network.promoters.ledger.filter.type": "Tipo",
  "network.promoters.ledger.filter.source": "Origem",
  "network.promoters.ledger.filter.all_partners": "Todos os parceiros",
  "network.promoters.ledger.filter.all_types": "Todos os tipos",
  "network.promoters.ledger.filter.all_sources": "Todas as origens",
  "network.promoters.ledger.column.date": "Data",
  "network.promoters.ledger.column.person": "Pessoa",
  "network.promoters.ledger.column.partner": "Parceiro",
  "network.promoters.ledger.column.type": "Tipo",
  "network.promoters.ledger.column.source": "Origem",
  "network.promoters.ledger.column.amount": "Valor",
  "network.promoters.ledger.column.description": "Descrição",

  // Promoters — Overrides tab
  "network.promoters.overrides.description":
    "Quando um rep vende, seu upline recebe overrides. Defina o valor do override por nível de função para cada plano.",
  "network.promoters.overrides.plan_label": "Plano:",
  "network.promoters.overrides.plan_placeholder": "Selecione o plano",
  "network.promoters.overrides.save_button": "Salvar Overrides",
  "network.promoters.overrides.role_override_title": "Override de {role}",
  "network.promoters.overrides.role.team_lead": "Líder de Equipe",
  "network.promoters.overrides.role.regional_leader": "Líder Regional",
  "network.promoters.overrides.type.flat": "$ Fixo por venda",
  "network.promoters.overrides.type.percent_of_bonus": "% do bônus do rep",
  "network.promoters.overrides.type.percent_of_revenue": "% da receita",
  "network.promoters.overrides.field.type": "Tipo de Override",
  "network.promoters.overrides.field.value_flat": "Valor ($)",
  "network.promoters.overrides.field.value_percent": "Valor (%)",
  "network.promoters.overrides.field.notes": "Notas",
  "network.promoters.overrides.field.notes_placeholder": "Opcional",

  // Promoters — Feedback toasts
  "network.promoters.feedback.accelerators_saved":
    "Faixas de performance salvas",
  "network.promoters.feedback.agreement_deleted": "Acordo excluído",
  "network.promoters.feedback.plan_activated": "Plano ativado",
  "network.promoters.feedback.plan_deactivated": "Plano desativado",
  "network.promoters.feedback.plan_deleted": "Plano excluído",
  "network.promoters.feedback.plan_duplicated":
    'Criada v{version} de "{name}"',
  "network.promoters.feedback.partner_deleted": "Parceiro excluído",
  "network.promoters.feedback.overrides_saved": "Regras de override salvas",

  // Promoters — Errors (extended)
  "error.network.promoters.accelerators.save_failed":
    "Falha ao salvar faixas de performance",
  "error.network.promoters.plan.delete_with_agreements":
    "Não é possível excluir um plano com acordos ativos",
  "error.network.promoters.plan.duplicate_failed":
    "Falha ao duplicar o plano",
  "error.network.promoters.partners.delete_with_agreements":
    "Não é possível excluir parceiro com acordos ativos",
  "error.network.promoters.overrides.save_failed":
    "Falha ao salvar overrides",

  // Network — Promoters page header
  "network.promoters.page.title": "Promotores",
  "network.promoters.page.description":
    "Gerencie comissões de promotores porta-a-porta — planos, árvores organizacionais, acordos e rastreamento de pagamentos.",

  // Network — Permissions page
  "network.permissions.page.title": "Permissões",
  "network.permissions.page.description":
    "Permissões do sistema. Atribua-as a cargos na seção de Cargos.",
  "network.permissions.page.actions_count": "{count} ações",

  // Network — Profile Types list
  "network.profile_types.list.title": "Tipos de Perfil",
  "network.profile_types.list.description":
    "Configure os tipos de perfis na sua rede e seus campos do assistente.",
  "network.profile_types.list.new_button": "Novo Tipo de Perfil",

  // Network — Profile Type new
  "network.profile_types.new.title": "Novo Tipo de Perfil",
  "network.profile_types.new.description":
    "Defina uma nova categoria de perfil com campos personalizados do assistente.",

  // Network — Profile Type detail
  "network.profile_types.detail.title": "Editar: {name}",
  "network.profile_types.detail.description":
    "Modifique as configurações do tipo de perfil e os campos do assistente.",

  // Network — Profiles list
  "network.profiles.list.title": "Perfis",
  "network.profiles.list.description_one": "{count} perfil na rede",
  "network.profiles.list.description_other": "{count} perfis na rede",
  "network.profiles.list.add_button": "Adicionar Perfil",

  // Network — Profile new
  "network.profiles.new.title": "Adicionar Perfil",
  "network.profiles.new.description":
    "Crie um novo membro interno ou externo da rede.",

  // Network — Profile detail
  "network.profiles.detail.edit_button": "Editar Perfil",
  "network.profiles.detail.email_label": "Email",
  "network.profiles.detail.phone_label": "Telefone",
  "network.profiles.detail.supervisor_label": "Supervisor",
  "network.profiles.detail.additional_information": "Informações Adicionais",
  "network.profiles.detail.roles_title": "Cargos",
  "network.profiles.detail.no_roles": "Nenhum cargo atribuído",
  "network.profiles.detail.rank_title": "Rank",
  "network.profiles.detail.no_rank": "Nenhum rank atribuído",
  "network.profiles.detail.compensation_title": "Remuneração",
  "network.profiles.detail.no_plan": "Nenhum plano atribuído",
  "network.profiles.detail.teams_title": "Equipes",

  // Network — Roles list
  "network.roles.list.title": "Cargos e Permissões",
  "network.roles.list.description":
    "Defina cargos, configure permissões e controle o acesso na sua rede.",
  "network.roles.list.new_button": "Novo Cargo",

  // Network — Role new
  "network.roles.new.title": "Novo Cargo",
  "network.roles.new.description":
    "Crie um novo cargo com permissões personalizadas.",

  // Network — Role detail
  "network.roles.detail.back_to_roles": "Voltar para Cargos",
  "network.roles.detail.network_type_internal": "Interno",
  "network.roles.detail.network_type_external": "Externo",
  "network.roles.detail.system_role": "Cargo do Sistema",
  "network.roles.detail.tab_settings": "Configurações do Cargo",
  "network.roles.detail.tab_permissions": "Permissões",

  // Forms — Field types (15)
  "forms.field_types.TEXT.label": "Texto curto",
  "forms.field_types.TEXT.description": "Entrada de texto de uma linha",
  "forms.field_types.TEXTAREA.label": "Texto longo",
  "forms.field_types.TEXTAREA.description": "Área de texto multilinha",
  "forms.field_types.NUMBER.label": "Número",
  "forms.field_types.NUMBER.description": "Entrada numérica",
  "forms.field_types.EMAIL.label": "E-mail",
  "forms.field_types.EMAIL.description": "Entrada de endereço de e-mail",
  "forms.field_types.PHONE.label": "Telefone",
  "forms.field_types.PHONE.description": "Entrada de número de telefone",
  "forms.field_types.DATE.label": "Data",
  "forms.field_types.DATE.description": "Seletor de data",
  "forms.field_types.TIME.label": "Hora",
  "forms.field_types.TIME.description": "Seletor de hora",
  "forms.field_types.SELECT.label": "Lista suspensa",
  "forms.field_types.SELECT.description": "Lista suspensa de escolha única",
  "forms.field_types.MULTI_SELECT.label": "Multi-seleção",
  "forms.field_types.MULTI_SELECT.description":
    "Caixas de seleção de múltipla escolha",
  "forms.field_types.CHECKBOX.label": "Caixa de seleção",
  "forms.field_types.CHECKBOX.description": "Caixa de seleção única",
  "forms.field_types.RADIO.label": "Botões de rádio",
  "forms.field_types.RADIO.description":
    "Botões de rádio de escolha única",
  "forms.field_types.FILE_UPLOAD.label": "Upload de arquivo",
  "forms.field_types.FILE_UPLOAD.description": "Anexo de arquivo",
  "forms.field_types.RATING.label": "Avaliação",
  "forms.field_types.RATING.description": "Escala de avaliação numérica",
  "forms.field_types.YES_NO.label": "Sim / Não",
  "forms.field_types.YES_NO.description": "Alternância binária sim/não",
  "forms.field_types.SIGNATURE.label": "Assinatura",
  "forms.field_types.SIGNATURE.description": "Painel de captura de assinatura",

  // Forms — Statuses (3)
  "forms.statuses.DRAFT.label": "Rascunho",
  "forms.statuses.ACTIVE.label": "Ativo",
  "forms.statuses.CLOSED.label": "Fechado",

  // Forms — Builder toolbar
  "forms.builder.toolbar.close_form": "Fechar formulário",
  "forms.builder.toolbar.publish": "Publicar",
  "forms.builder.toolbar.responses": "Respostas",

  // Forms — Builder tabs
  "forms.builder.tabs.builder": "Construtor",
  "forms.builder.tabs.settings": "Configurações",

  // Forms — Builder body
  "forms.builder.add_section": "Adicionar seção",

  // Forms — Sidebar
  "forms.builder.sidebar.add_field_heading": "Adicionar campo",

  // Forms — Section
  "forms.builder.section.untitled": "Seção sem título",
  "forms.builder.section.empty": "Nenhum campo ainda. Clique em “Adicionar campo” ou use a barra lateral.",
  "forms.builder.section.add_field": "Adicionar campo",

  // Forms — Field row & drag previews
  "forms.builder.fields_count_one": "{count} campo",
  "forms.builder.fields_count_other": "{count} campos",
  "forms.builder.responses_count_one": "{count} resposta",
  "forms.builder.responses_count_other": "{count} respostas",

  // Forms — Field config dialog
  "forms.builder.field_config.title_edit": "Editar campo",
  "forms.builder.field_config.title_add": "Adicionar campo",
  "forms.builder.field_config.label": "Rótulo",
  "forms.builder.field_config.label_placeholder":
    "ex.: Qual é o seu nome?",
  "forms.builder.field_config.field_type": "Tipo de campo",
  "forms.builder.field_config.placeholder_label": "Placeholder (opcional)",
  "forms.builder.field_config.placeholder_placeholder":
    "Texto de placeholder exibido na entrada",
  "forms.builder.field_config.help_text_label": "Texto de ajuda (opcional)",
  "forms.builder.field_config.help_text_placeholder":
    "Instruções adicionais para o respondente",
  "forms.builder.field_config.required": "Obrigatório",
  "forms.builder.field_config.choices": "Opções",
  "forms.builder.field_config.option_placeholder": "Opção {index}",
  "forms.builder.field_config.add_option": "Adicionar opção",
  "forms.builder.field_config.save_changes": "Salvar alterações",

  // Forms — Builder feedback (toasts)
  "forms.builder.feedback.form_published": "Formulário publicado!",
  "forms.builder.feedback.form_closed": "Formulário fechado",

  // Forms — Builder errors
  "error.forms.builder.publish_failed": "Falha ao publicar formulário",
  "error.forms.builder.close_failed": "Falha ao fechar formulário",

  // Forms — List page (chrome)
  "forms.list.title": "Formulários",
  "forms.list.description":
    "Formulários de captação, pesquisas e modelos estruturados de coleta de dados.",
  "forms.list.create_form": "Criar formulário",
  "forms.list.import": "Importar",
  "forms.list.search_placeholder": "Buscar por nome ou descrição…",
  "forms.list.items_count": "{count} itens",
  "forms.list.filter.all_status": "Todos os status",
  "forms.list.stats.total": "Total",
  "forms.list.stats.active": "Ativos",
  "forms.list.stats.draft": "Rascunhos",
  "forms.list.stats.total_responses": "Total de respostas",

  // Forms — List columns
  "forms.list.column.name": "Nome",
  "forms.list.column.status": "Status",
  "forms.list.column.access": "Acesso",
  "forms.list.column.responses": "Respostas",
  "forms.list.column.created": "Criado",
  "forms.list.column.open_form": "Abrir formulário",

  // Forms — Access modes
  "forms.access.PUBLIC.label": "Público",
  "forms.access.PRIVATE.label": "Privado",

  // Forms — Empty state
  "forms.empty.title": "Nenhum formulário ainda",
  "forms.empty.description":
    "Crie formulários de captação, pesquisas e modelos de coleta de dados. Formulários podem ser compartilhados com parceiros e clientes para reunir informações estruturadas.",
  "forms.empty.create_first": "Criar seu primeiro formulário",
  "forms.empty.list_description":
    "Crie um formulário ou importe de um serviço externo.",

  // Forms — Create modal
  "forms.create.title": "Criar formulário",
  "forms.create.tab.blank": "Formulário em branco",
  "forms.create.tab.templates": "Modelos",
  "forms.create.name_label": "Nome",
  "forms.create.name_placeholder":
    "ex.: Onboarding de Equipe, Feedback de Cliente",
  "forms.create.description_label": "Descrição (opcional)",
  "forms.create.description_placeholder": "Para que serve este formulário?",
  "forms.create.submit_blank": "Criar formulário em branco",
  "forms.create.submitting": "Criando…",
  "forms.create.templates_hint":
    "Escolha um modelo pronto para começar rapidamente. Você pode personalizá-lo após a criação.",

  // Forms — Delete dialog
  "forms.delete.title": "Excluir formulário",
  "forms.delete.confirm_message":
    "Tem certeza que deseja excluir “{name}”? Todas as seções, campos e respostas serão removidos permanentemente. Esta ação não pode ser desfeita.",

  // Forms — Settings (page-level)
  "forms.settings.name_label": "Nome do formulário",
  "forms.settings.description_label": "Descrição",
  "forms.settings.description_placeholder":
    "Descreva para que serve este formulário",
  "forms.settings.thank_you_label": "Mensagem de agradecimento",
  "forms.settings.thank_you_placeholder":
    "Exibida após o envio do formulário",
  "forms.settings.access_mode_label": "Modo de acesso",
  "forms.settings.access_mode.public": "Público (qualquer pessoa com o link)",
  "forms.settings.access_mode.private": "Privado (senha obrigatória)",
  "forms.settings.access_password_label": "Senha de acesso",
  "forms.settings.access_password_placeholder":
    "Defina uma senha para acessar o formulário",
  "forms.settings.max_responses_label": "Máximo de respostas (opcional)",
  "forms.settings.max_responses_placeholder":
    "Deixe vazio para ilimitado",
  "forms.settings.save_button": "Salvar configurações",

  // Forms — Responses (table + detail)
  "forms.responses.back_to_form": "Voltar ao formulário",
  "forms.responses.title": "Respostas — {name}",
  "forms.responses.description_one": "{count} resposta no total",
  "forms.responses.description_other": "{count} respostas no total",
  "forms.responses.search_placeholder": "Buscar por nome ou e-mail…",
  "forms.responses.column.submitter": "Quem enviou",
  "forms.responses.column.status": "Status",
  "forms.responses.column.submitted": "Enviado",
  "forms.responses.column.view_response": "Ver resposta",
  "forms.responses.anonymous": "Anônimo",
  "forms.responses.detail.title": "Detalhe da resposta",
  "forms.responses.detail.submitter": "Remetente:",
  "forms.responses.detail.submitted": "Enviado:",
  "forms.responses.status.PENDING": "Pendente",
  "forms.responses.status.PROCESSING": "Processando",
  "forms.responses.status.READY": "Processado",
  "forms.responses.status.ERROR": "Erro",
  "forms.responses.value.yes": "Sim",
  "forms.responses.value.no": "Não",

  // Forms — Templates (catalog UI)
  "forms.templates.field_count_one": "{count} campo",
  "forms.templates.field_count_other": "{count} campos",
  "forms.templates.use_template": "Usar modelo",
  "forms.templates.category.Internal": "Interno",
  "forms.templates.category.Customer": "Cliente",
  "forms.templates.category.Partners": "Parceiros",
  "forms.templates.category.Events": "Eventos",
  "forms.templates.category.Support": "Suporte",
  "forms.templates.team-onboarding.name":
    "Questionário de onboarding de equipe",
  "forms.templates.team-onboarding.description":
    "Colete informações essenciais de novos membros durante o onboarding.",
  "forms.templates.customer-feedback.name":
    "Pesquisa de feedback de cliente",
  "forms.templates.customer-feedback.description":
    "Reúna feedback de clientes sobre a experiência com seus produtos ou serviços.",
  "forms.templates.partner-application.name":
    "Formulário de aplicação para parceiros",
  "forms.templates.partner-application.description":
    "Formulário de captação para parceiros ou afiliados se candidatarem ao seu programa.",
  "forms.templates.product-interest.name":
    "Pesquisa de interesse em produtos",
  "forms.templates.product-interest.description":
    "Entenda o interesse dos clientes nos seus produtos, sensibilidade a preços e prioridades de funcionalidades.",
  "forms.templates.event-registration.name":
    "Formulário de inscrição em evento",
  "forms.templates.event-registration.description":
    "Colete inscrições e preferências para eventos, webinars ou meetups.",
  "forms.templates.nps-survey.name": "Pesquisa NPS",
  "forms.templates.nps-survey.description":
    "Pesquisa Net Promoter Score — formato rápido de uma única pergunta com follow-up.",
  "forms.templates.support-ticket.name": "Formulário de chamado de suporte",
  "forms.templates.support-ticket.description":
    "Captação estruturada de solicitações de suporte com categorização e severidade.",
  "forms.templates.knowledge-contribution.name":
    "Formulário de contribuição de conhecimento",
  "forms.templates.knowledge-contribution.description":
    "Permita que membros da equipe ou comunidade enviem artigos, dicas ou recursos de conhecimento.",

  // Forms — Import modal
  "forms.import.title": "Importar formulário",
  "forms.import.format_label": "Formato",
  "forms.import.file_label": "Arquivo",
  "forms.import.format.google_forms.label": "Google Forms (JSON)",
  "forms.import.format.google_forms.description":
    "Exporte seu Google Form como JSON",
  "forms.import.format.typeform.label": "Typeform (JSON)",
  "forms.import.format.typeform.description":
    "Exporte seu Typeform como JSON",
  "forms.import.format.surveymonkey.label": "SurveyMonkey (CSV)",
  "forms.import.format.surveymonkey.description":
    "Exporte os resultados da pesquisa como CSV",
  "forms.import.click_to_select": "Clique para selecionar um arquivo {accept}",
  "forms.import.file_size_kb": "({size} KB)",
  "forms.import.submit": "Importar formulário",
  "forms.import.submitting": "Importando…",

  // Forms — Feedback toasts
  "forms.feedback.form_created": "Formulário criado",
  "forms.feedback.form_deleted": "Formulário excluído",
  "forms.feedback.settings_saved": "Configurações salvas",
  "forms.feedback.response_deleted": "Resposta excluída",
  "forms.feedback.template_applied": "Formulário criado a partir do modelo",
  "forms.import.feedback.imported_successfully":
    "Formulário importado com sucesso",

  // Forms — Errors
  "error.forms.name_required": "Nome é obrigatório",
  "error.forms.create_failed": "Falha ao criar formulário",
  "error.forms.delete_failed": "Falha ao excluir formulário",
  "error.forms.update_failed": "Falha ao salvar configurações",
  "error.forms.response_delete_failed": "Falha ao excluir resposta",
  "error.forms.template_apply_failed":
    "Falha ao criar formulário a partir do modelo",
  "error.forms.import.no_file_selected":
    "Por favor, selecione um arquivo",
  "error.forms.import.failed": "Falha ao importar formulário",

  // ============================================================
  // Tables Admin (Phase 1.5.6d-β.1)
  // ============================================================

  // Tables — Field types (camelCase values stored in Prisma as String)
  "tables.field_types.singleLineText.label": "Texto curto",
  "tables.field_types.singleLineText.description":
    "Entrada de texto de uma linha",
  "tables.field_types.multilineText.label": "Texto longo",
  "tables.field_types.multilineText.description":
    "Área de texto multilinha",
  "tables.field_types.number.label": "Número",
  "tables.field_types.number.description": "Entrada numérica",
  "tables.field_types.currency.label": "Moeda",
  "tables.field_types.currency.description": "Valor monetário com símbolo",
  "tables.field_types.percent.label": "Porcentagem",
  "tables.field_types.percent.description": "Valor percentual",
  "tables.field_types.singleSelect.label": "Seleção única",
  "tables.field_types.singleSelect.description":
    "Escolha uma opção em uma lista",
  "tables.field_types.multiSelect.label": "Multi-seleção",
  "tables.field_types.multiSelect.description":
    "Escolha múltiplas opções em uma lista",
  "tables.field_types.checkbox.label": "Caixa de seleção",
  "tables.field_types.checkbox.description": "Verdadeiro ou falso",
  "tables.field_types.date.label": "Data",
  "tables.field_types.date.description": "Data do calendário",
  "tables.field_types.url.label": "URL",
  "tables.field_types.url.description": "Endereço de página web",
  "tables.field_types.email.label": "E-mail",
  "tables.field_types.email.description":
    "Endereço de e-mail",
  "tables.field_types.linkedRecord.label": "Registro vinculado",
  "tables.field_types.linkedRecord.description":
    "Vínculo com registros de outra tabela",
  "tables.field_types.media.label": "Mídia",
  "tables.field_types.media.description": "Imagens ou vídeos",
  "tables.field_types.attachment.label": "Anexo",
  "tables.field_types.attachment.description": "Arquivos anexados",
  "tables.field_types.createdTime.label": "Criado em",
  "tables.field_types.createdTime.description":
    "Data e hora de criação do registro",
  "tables.field_types.lastModifiedTime.label": "Modificado em",
  "tables.field_types.lastModifiedTime.description":
    "Data e hora da última modificação",
  "tables.field_types.autoNumber.label": "Número automático",
  "tables.field_types.autoNumber.description":
    "Número incrementado automaticamente",
  "tables.field_types.formula.label": "Fórmula",
  "tables.field_types.formula.description":
    "Valor calculado a partir de outros campos",
  "tables.field_types.rollup.label": "Rollup",
  "tables.field_types.rollup.description":
    "Agregação sobre registros vinculados",
  "tables.field_types.lookup.label": "Lookup",
  "tables.field_types.lookup.description":
    "Valor consultado em registros vinculados",
  "tables.field_types.count.label": "Contagem",
  "tables.field_types.count.description":
    "Número de registros vinculados",

  // Tables — Cells
  "tables.cells.text.aria_label": "Editar texto",
  "tables.cells.number.aria_label": "Editar número",
  "tables.cells.date.aria_label": "Editar data",
  "tables.cells.url.aria_label_url": "Editar URL",
  "tables.cells.url.aria_label_email": "Editar e-mail",
  "tables.cells.checkbox.checked": "Marcado",
  "tables.cells.checkbox.unchecked": "Desmarcado",
  "tables.cells.select.no_choices_configured":
    "Nenhuma opção configurada",
  "tables.cells.linked_record.id_preview": "{id}…",
  "tables.cells.linked_record.overflow_count": "+{count}",
  "tables.cells.media.empty_state": "Sem mídia",
  "tables.cells.media.uploading": "Enviando…",
  "tables.cells.media.add_more": "Adicionar mais",
  "tables.cells.media.drop_or_click": "Solte arquivos ou clique",
  "tables.cells.media.remove": "Remover",
  "tables.cells.media.previous": "Anterior",
  "tables.cells.media.next": "Próximo",
  "tables.cells.media.gallery_position": "{current} / {total}",
  "tables.cells.media.thumbnail_aria": "Miniatura {index}",
  "tables.cells.media.overflow_count": "+{count}",
  "tables.cells.media.files_count": "{count} arquivos",
  "tables.cells.media.file_input_label": "Selecionar arquivos",

  // Tables — Toolbar
  "tables.toolbar.search_placeholder": "Buscar registros…",
  "tables.toolbar.search_aria": "Buscar registros",
  "tables.toolbar.records_count": "{count} registros",
  "tables.toolbar.records_count_filtered":
    "{shown} / {total} registros",
  "tables.toolbar.add_field": "Campo",
  "tables.toolbar.add_record": "Registro",

  // Tables — Grid (column headers, rows, footer, empty)
  "tables.grid.column_header.drag_handle": "Reordenar coluna",
  "tables.grid.column_header.primary_key_short": "PK",
  "tables.grid.column_header.primary_key_title": "Chave primária",
  "tables.grid.column_header.row_number_title": "Número da linha",
  "tables.grid.row.drag_handle": "Reordenar linha",
  "tables.grid.row.delete_record": "Excluir registro",
  "tables.grid.footer.new_record": "Novo registro",
  "tables.grid.empty.no_search_match":
    "Nenhum registro corresponde à sua busca",

  // Tables — View (header chrome)
  "tables.view.back_to_tables": "Voltar para Tabelas",
  "tables.view.no_description": "Sem descrição",
  "tables.view.process_button": "Processar",
  "tables.view.processing_badge": "Processando…",
  "tables.view.add_field": "Adicionar campo",
  "tables.view.fields_count": "{count} campos",
  "tables.view.records_count": "{count} registros",
  "tables.view.chunks_count": "{count} chunks",
  "tables.view.status.pending": "Pendente",
  "tables.view.status.processing": "Processando",
  "tables.view.status.ready": "Pronto",
  "tables.view.status.error": "Erro",

  // Tables — Field config modal
  "tables.field_config.title_add": "Adicionar campo",
  "tables.field_config.title_edit": "Editar campo",
  "tables.field_config.name_label": "Nome",
  "tables.field_config.name_placeholder": "ex.: Preço, Status, E-mail",
  "tables.field_config.type_label": "Tipo",
  "tables.field_config.description_label": "Descrição (opcional)",
  "tables.field_config.description_placeholder":
    "O que este campo armazena?",
  "tables.field_config.precision_label": "Precisão decimal",
  "tables.field_config.precision_integer": "0 (inteiro)",
  "tables.field_config.currency_symbol_label": "Símbolo monetário",
  "tables.field_config.choices_label": "Opções",
  "tables.field_config.add_choice": "Adicionar opção",
  "tables.field_config.add_choice_placeholder": "Adicionar uma opção…",
  "tables.field_config.remove_choice": "Remover opção",
  "tables.field_config.link_to_table_label": "Vincular à tabela",
  "tables.field_config.no_tables_available":
    "Nenhuma outra tabela disponível para vincular. Crie outra tabela primeiro.",
  "tables.field_config.select_table_placeholder":
    "Selecione uma tabela…",
  "tables.field_config.required_field": "Campo obrigatório",
  "tables.field_config.add_button": "Adicionar campo",
  "tables.field_config.update_button": "Atualizar campo",
  "tables.field_config.adding": "Adicionando…",
  "tables.field_config.updating": "Atualizando…",

  // Tables — Feedback toasts
  "tables.feedback.record_deleted": "Registro excluído",
  "tables.feedback.field_added": "Campo adicionado",
  "tables.feedback.field_updated": "Campo atualizado",
  "tables.feedback.processed_for_knowledge":
    "Tabela processada para a base de conhecimento",

  // Tables — Errors
  "error.tables.upload_failed": "Falha no upload",
  "error.tables.processing_failed": "Falha no processamento",
  "error.tables.record_add_failed": "Falha ao adicionar registro",
  "error.tables.cell_save_failed": "Falha ao salvar",
  "error.tables.column_reorder_failed": "Falha ao reordenar colunas",
  "error.tables.row_reorder_failed": "Falha ao reordenar linhas",
  "error.tables.field_name_required": "Nome do campo é obrigatório",
  "error.tables.linked_table_required":
    "Por favor, selecione uma tabela para vincular",
  "error.tables.field_create_failed": "Falha ao adicionar campo",
  "error.tables.field_update_failed": "Falha ao atualizar campo",
  "error.tables.unexpected_error": "Ocorreu um erro inesperado",

  // Tables — Import (Airtable)
  "tables.import.airtable.header.title": "Importar do Airtable",
  "tables.import.airtable.header.step_1_base": "1. Base",
  "tables.import.airtable.header.step_2_table": "2. Tabela",
  "tables.import.airtable.header.step_3_fields": "3. Campos",
  "tables.import.airtable.header.step_4_import": "4. Importar",
  "tables.import.airtable.steps.bases.intro":
    "Selecione uma base do Airtable para importar.",
  "tables.import.airtable.steps.bases.loading": "Carregando bases…",
  "tables.import.airtable.steps.bases.empty":
    "Nenhuma base encontrada. Verifique se o seu token do Airtable tem acesso a pelo menos uma base.",
  "tables.import.airtable.steps.tables.intro":
    "Selecione uma tabela para importar.",
  "tables.import.airtable.steps.tables.loading": "Carregando tabelas…",
  "tables.import.airtable.steps.tables.fields_count": "{count} campos",
  "tables.import.airtable.steps.tables.fields_count_with_description":
    "{count} campos — {description}",
  "tables.import.airtable.steps.mapping.intro":
    "Revise os mapeamentos de campos. Ajuste os tipos, renomeie campos ou ignore os que não precisar.",
  "tables.import.airtable.steps.mapping.col_airtable_field":
    "Campo do Airtable",
  "tables.import.airtable.steps.mapping.col_internal_type": "Tipo interno",
  "tables.import.airtable.steps.mapping.col_internal_name": "Nome interno",
  "tables.import.airtable.steps.mapping.col_skip": "Ignorar",
  "tables.import.airtable.steps.mapping.fields_selected":
    "{active} de {total} campos selecionados",
  "tables.import.airtable.steps.mapping.import_button": "Importar {table}",
  "tables.import.airtable.steps.progress.importing": "Importando {table}…",
  "tables.import.airtable.steps.progress.records_imported":
    "{count} registros importados",
  "tables.import.airtable.steps.progress.do_not_close":
    "Isto pode levar alguns minutos para tabelas grandes. Não feche este diálogo.",
  "tables.import.airtable.steps.progress.error_title": "Falha na importação",
  "tables.import.airtable.steps.progress.error_unknown":
    "Ocorreu um erro desconhecido",
  "tables.import.airtable.steps.progress.partial_imported":
    "{count} registros foram importados antes do erro.",
  "tables.import.airtable.steps.progress.success_title":
    "Importação concluída",
  "tables.import.airtable.steps.progress.success_summary":
    "Importados com sucesso {count} registros de {table}.",
  "tables.import.airtable.navigation.view_table": "Ver tabela",
  "error.tables.import.airtable.load_bases_failed":
    "Falha ao carregar bases",
  "error.tables.import.airtable.connect_failed":
    "Falha ao conectar com o Airtable",
  "error.tables.import.airtable.load_tables_failed":
    "Falha ao carregar tabelas",
  "error.tables.import.airtable.fetch_tables_failed":
    "Falha ao buscar tabelas",
  "error.tables.import.airtable.import_failed":
    "Falha ao importar",
  "error.tables.import.airtable.start_failed":
    "Falha ao iniciar importação",

  // ─── Tables: list/chrome (Phase 1.5.6d-β.3) ────────────────────────
  "tables.list.title": "Tabelas",
  "tables.list.description":
    "Conjuntos de dados estruturados, tabelas de consulta e dados de referência para operações e relatórios.",
  "tables.list.create_table": "Criar tabela",
  "tables.list.import_from_airtable": "Importar do Airtable",
  "tables.list.search_placeholder": "Buscar por nome ou descrição…",
  "tables.list.items_count": "{count} itens",
  "tables.list.stats.total": "Total",
  "tables.list.stats.ready": "Prontas",
  "tables.list.stats.processing": "Processando",
  "tables.list.stats.total_records": "Total de registros",
  "tables.list.filter.all_status": "Todos os status",
  "tables.list.column.name": "Nome",
  "tables.list.column.fields": "Campos",
  "tables.list.column.records": "Registros",
  "tables.list.column.status": "Status",
  "tables.list.column.created": "Criada em",
  "tables.list.row.actions.open": "Abrir tabela",
  "tables.list.row.actions.activate": "Ativar",
  "tables.list.row.actions.deactivate": "Desativar",
  "tables.list.status.pending": "Pendente",
  "tables.list.status.processing": "Processando",
  "tables.list.status.ready": "Pronta",
  "tables.list.status.error": "Erro",

  // ─── Tables: empty state ───────────────────────────────────────────
  "tables.empty.title": "Nenhuma tabela ainda",
  "tables.empty.description":
    "Crie conjuntos de dados estruturados e tabelas de consulta. Tabelas ajudam a organizar dados de referência para operações, cálculos de comissão e relatórios.",
  "tables.empty.short_description":
    "Crie uma tabela ou importe do Airtable.",
  "tables.empty.cta_create": "Crie sua primeira tabela",

  // ─── Tables: create modal ──────────────────────────────────────────
  "tables.create.title": "Criar tabela",
  "tables.create.field_name_label": "Nome",
  "tables.create.field_name_placeholder":
    "ex.: Produtos, Faixas de Comissão",
  "tables.create.field_description_label": "Descrição (opcional)",
  "tables.create.field_description_placeholder":
    "Que dados esta tabela vai armazenar?",
  "tables.create.submit": "Criar tabela",
  "tables.create.submitting": "Criando…",

  // ─── Tables: delete dialogs ────────────────────────────────────────
  "tables.delete.title": "Excluir tabela",
  "tables.delete.confirmation":
    "Tem certeza que deseja excluir \"{name}\"? Todos os campos, registros e dados associados serão removidos permanentemente. Esta ação não pode ser desfeita.",
  "tables.fields.delete.title": "Excluir campo",
  "tables.fields.delete.confirmation":
    "Tem certeza que deseja excluir o campo \"{name}\"? Todos os dados armazenados nesta coluna serão removidos permanentemente de cada registro. Esta ação não pode ser desfeita.",

  // ─── Tables: feedback ──────────────────────────────────────────────
  "tables.feedback.table_created": "Tabela criada",
  "tables.feedback.table_deleted": "Tabela excluída",
  "tables.feedback.activated": "Ativada",
  "tables.feedback.deactivated": "Desativada",

  // ─── Tables: errors (chrome) ───────────────────────────────────────
  "error.tables.name_required": "Nome é obrigatório",
  "error.tables.create_failed": "Falha ao criar tabela",
  "error.tables.delete_failed": "Falha ao excluir tabela",

  // ─── Apps: providers (Template D) ──────────────────────────────────
  "apps.providers.oura.label": "Oura Ring",
  "apps.providers.oura.description":
    "Acompanhamento de sono, atividade e prontidão pelo seu Oura Ring.",
  "apps.providers.oura.token_auth.portal.url":
    "https://cloud.ouraring.com/personal-access-tokens",
  "apps.providers.oura.token_auth.portal.label":
    "Portal de Tokens da Oura",
  "apps.providers.oura.token_auth.token.label":
    "Token de Acesso Pessoal",
  "apps.providers.oura.token_auth.token.placeholder":
    "Cole seu token de acesso pessoal Oura",
  "apps.providers.oura.token_auth.steps.0":
    "Entre na sua conta Oura em cloud.ouraring.com",
  "apps.providers.oura.token_auth.steps.1":
    "Vá em Personal Access Tokens nas configurações da conta",
  "apps.providers.oura.token_auth.steps.2":
    "Crie um novo token e copie-o",
  "apps.providers.oura.token_auth.steps.3":
    "Cole o token abaixo para conectar os dados do seu Oura Ring",

  "apps.providers.whoop.label": "WHOOP",
  "apps.providers.whoop.description":
    "Recuperação, esforço, sono e dados de treino da sua pulseira WHOOP.",
  "apps.providers.whoop.token_auth.portal.url":
    "https://developer.whoop.com",
  "apps.providers.whoop.token_auth.portal.label":
    "Portal Developer da WHOOP",
  "apps.providers.whoop.token_auth.token.label":
    "Token de Acesso da API",
  "apps.providers.whoop.token_auth.token.placeholder":
    "Cole seu token de acesso da API WHOOP",
  "apps.providers.whoop.token_auth.steps.0":
    "Entre no Portal Developer da WHOOP em developer.whoop.com",
  "apps.providers.whoop.token_auth.steps.1":
    "Crie ou selecione seu aplicativo",
  "apps.providers.whoop.token_auth.steps.2":
    "Gere um token de acesso com os escopos necessários",
  "apps.providers.whoop.token_auth.steps.3":
    "Cole o token abaixo para conectar os dados do seu WHOOP",

  "apps.providers.apple_health.label": "Apple Health",
  "apps.providers.apple_health.description":
    "Dados de saúde agregados do Apple Health via ponte Terra API.",
  "apps.providers.apple_health.token_auth.portal.url":
    "https://tryterra.co",
  "apps.providers.apple_health.token_auth.portal.label":
    "Painel da Terra",
  "apps.providers.apple_health.token_auth.token.label":
    "Chave de API Terra",
  "apps.providers.apple_health.token_auth.token.placeholder":
    "Cole sua chave de API Terra",
  "apps.providers.apple_health.token_auth.steps.0":
    "Cadastre-se em tryterra.co e crie um novo projeto",
  "apps.providers.apple_health.token_auth.steps.1":
    "Copie sua chave de API do painel da Terra",
  "apps.providers.apple_health.token_auth.steps.2":
    "Cole-a abaixo — usamos a Terra como ponte para sincronizar dados do Apple Health",
  "apps.providers.apple_health.token_auth.steps.3":
    "Após conectar, você autorizará o compartilhamento de dados no seu iPhone",

  // ─── Apps: token auth flow (Template K) ────────────────────────────
  "apps.token_auth.modal.connect_title": "Conectar app",
  "apps.token_auth.modal.connect_subtitle":
    "Escolha um app de saúde para conectar. Seus dados serão sincronizados e disponibilizados aos agentes de IA.",
  "apps.token_auth.modal.connect_app_title": "Conectar {name}",
  "apps.token_auth.modal.instructions_title": "Como conectar:",
  "apps.token_auth.modal.open_portal": "Abrir {label}",
  "apps.token_auth.modal.scopes_title": "Dados que serão sincronizados:",
  "apps.token_auth.modal.security_note":
    "Seu token é criptografado e armazenado com segurança. É usado apenas para sincronizar dados do seu dispositivo.",

  "apps.token_auth.actions.connect": "Conectar",
  "apps.token_auth.actions.connecting": "Conectando…",
  "apps.token_auth.actions.connected": "Conectado",
  "apps.token_auth.actions.cancel": "Cancelar",
  "apps.token_auth.actions.retry": "Tentar novamente",

  // ─── Apps: statuses (Template D, reuses KnowledgeDocumentStatus) ───
  "apps.statuses.PENDING.label": "Não conectado",
  "apps.statuses.PROCESSING.label": "Sincronizando",
  "apps.statuses.READY.label": "Conectado",
  "apps.statuses.ERROR.label": "Erro",

  // ─── Apps: data point statuses (re-uses KnowledgeDocumentStatus) ──
  "apps.data_point_statuses.PENDING.label": "Pendente",
  "apps.data_point_statuses.PROCESSING.label": "Processando",
  "apps.data_point_statuses.READY.label": "Pronto",
  "apps.data_point_statuses.ERROR.label": "Erro",

  // ─── Apps: data categories (Template D) ────────────────────────────
  "apps.data_categories.SLEEP.label": "Sono",
  "apps.data_categories.SLEEP.description":
    "Duração do sono, fases (profundo, REM, leve), eficiência, hora de dormir/acordar e métricas de descanso.",
  "apps.data_categories.ACTIVITY.label": "Atividade",
  "apps.data_categories.ACTIVITY.description":
    "Passos diários, calorias gastas, minutos ativos, distância percorrida e detalhamento de intensidade.",
  "apps.data_categories.RECOVERY.label": "Recuperação",
  "apps.data_categories.RECOVERY.description":
    "Pontuação de recuperação, HRV (variabilidade), frequência cardíaca em repouso, SpO2 e temperatura da pele.",
  "apps.data_categories.HEART_RATE.label": "Frequência cardíaca",
  "apps.data_categories.HEART_RATE.description":
    "Leituras contínuas de frequência cardíaca, FC repouso/média/máxima e zonas de FC.",
  "apps.data_categories.WORKOUT.label": "Treino",
  "apps.data_categories.WORKOUT.description":
    "Sessões de exercício com tipo, duração, esforço/intensidade, calorias e FC durante a atividade.",
  "apps.data_categories.READINESS.label": "Prontidão",
  "apps.data_categories.READINESS.description":
    "Pontuação diária de prontidão baseada em qualidade do sono, recuperação, equilíbrio de atividade e temperatura corporal.",
  "apps.data_categories.BODY.label": "Corpo",
  "apps.data_categories.BODY.description":
    "Medidas corporais incluindo peso, altura, IMC, percentual de gordura e FC máxima.",
  "apps.data_categories.APP_NUTRITION.label": "Nutrição",
  "apps.data_categories.APP_NUTRITION.description":
    "Ingestão calórica, macronutrientes (proteína, carboidrato, gordura), fibra, açúcar e hidratação.",
  "apps.data_categories.APP_OTHER.label": "Outros",
  "apps.data_categories.APP_OTHER.description":
    "Métricas adicionais e dados de outros dispositivos conectados.",

  // ─── Apps: sync frequency options (Template D) ─────────────────────
  "apps.sync_frequency.15.label": "A cada 15 minutos",
  "apps.sync_frequency.30.label": "A cada 30 minutos",
  "apps.sync_frequency.60.label": "A cada hora",
  "apps.sync_frequency.360.label": "A cada 6 horas",
  "apps.sync_frequency.720.label": "A cada 12 horas",
  "apps.sync_frequency.1440.label": "Diariamente",
  "apps.sync_frequency.10080.label": "Semanalmente",

  // ─── Apps: list page (chrome) ──────────────────────────────────────
  "apps.list.title": "Apps",
  "apps.list.description":
    "Conecte apps de saúde para sincronizar dados com sua base de conhecimento.",
  "apps.list.connect_app": "Conectar app",
  "apps.list.search_placeholder": "Buscar por nome ou descrição…",
  "apps.list.items_count": "{count} itens",
  "apps.list.stats.total": "Total",
  "apps.list.stats.connected": "Conectados",
  "apps.list.stats.syncing": "Sincronizando",
  "apps.list.stats.data_points": "Pontos de dados",
  "apps.list.filters.all_status": "Todos os status",
  "apps.list.columns.app": "App",
  "apps.list.columns.category": "Categoria",
  "apps.list.columns.status": "Status",
  "apps.list.columns.data_points": "Pontos de dados",
  "apps.list.columns.last_sync": "Última sincronização",
  "apps.list.actions.sync_now": "Sincronizar agora",
  "apps.list.actions.settings": "Configurações",
  "apps.list.actions.disconnect": "Desconectar",
  "apps.list.actions.delete": "Excluir",
  "apps.list.last_sync_never": "Nunca",
  "apps.list.dash": "—",

  // ─── Apps: category labels (App.category enum) ─────────────────────
  "apps.categories.FITNESS.label": "Fitness",
  "apps.categories.HEALTH.label": "Saúde",
  "apps.categories.NUTRITION.label": "Nutrição",
  "apps.categories.OTHER.label": "Outros",

  // ─── Apps: empty state ─────────────────────────────────────────────
  "apps.empty.title": "Nenhum app conectado",
  "apps.empty.description":
    "Conecte apps como Oura Ring, WHOOP e Apple Health para sincronizar dados de saúde automaticamente. Seus agentes de IA podem então usar esses dados para insights personalizados.",
  "apps.empty.cta": "Conecte seu primeiro app",
  "apps.empty.list_title": "Nenhum app ainda",
  "apps.empty.list_description":
    "Conecte apps de saúde para sincronizar automaticamente seus dados na base de conhecimento.",

  // ─── Apps: detail page ─────────────────────────────────────────────
  "apps.detail.back": "Voltar para Apps",
  "apps.detail.actions.test": "Testar",
  "apps.detail.actions.sync_now": "Sincronizar agora",
  "apps.detail.actions.disconnect": "Desconectar",
  "apps.detail.actions.connect": "Conectar",
  "apps.detail.tabs.overview": "Visão geral",
  "apps.detail.tabs.data": "Dados",
  "apps.detail.tabs.logs": "Logs",
  "apps.detail.tabs.settings": "Configurações",

  "apps.detail.about.title": "Sobre",
  "apps.detail.about.category": "Categoria",
  "apps.detail.about.auth_type": "Tipo de autenticação",
  "apps.detail.about.created": "Criado em",
  "apps.detail.about.website": "Site",
  "apps.detail.about.visit": "Visitar",

  "apps.detail.connection.title": "Conexão",
  "apps.detail.connection.status": "Status",
  "apps.detail.connection.connected_since": "Conectado desde",
  "apps.detail.connection.last_sync": "Última sincronização",
  "apps.detail.connection.never": "Nunca",
  "apps.detail.connection.dash": "—",

  "apps.detail.stats.title": "Pontos de dados",
  "apps.detail.stats.total": "Total",
  "apps.detail.stats.ready": "Prontos",
  "apps.detail.stats.pending": "Pendentes",
  "apps.detail.stats.sync_logs": "Logs de sync",

  "apps.detail.categories.title": "Categorias de dados suportadas",

  "apps.detail.data.filter_all": "Todas as categorias",
  "apps.detail.data.empty": "Nenhum ponto de dados sincronizado ainda.",
  "apps.detail.data.sync_now": "Sincronizar agora",
  "apps.detail.data.expand": "Expandir",
  "apps.detail.data.collapse": "Recolher",
  "apps.detail.data.processing_failed": "Falha no processamento.",
  "apps.detail.data.not_processed": "Ainda não processado.",

  "apps.detail.logs.empty": "Nenhum log de sincronização ainda.",
  "apps.detail.logs.records": "{count} registros",
  "apps.detail.logs.no_details": "—",

  "apps.detail.settings.title": "Configuração de sincronização",
  "apps.detail.settings.frequency_label": "Frequência de sincronização",
  "apps.detail.settings.frequency_help":
    "Com que frequência sincronizar dados de {name} automaticamente.",
  "apps.detail.settings.categories_label": "Categorias de dados habilitadas",
  "apps.detail.settings.categories_help":
    "Selecione quais tipos de dados sincronizar deste app.",
  "apps.detail.settings.save": "Salvar configurações",
  "apps.detail.settings.saving": "Salvando…",

  // ─── Apps: data dialog ─────────────────────────────────────────────
  "apps.data_dialog.title": "{name} — Pontos de dados",
  "apps.data_dialog.total": "{count} no total",
  "apps.data_dialog.ready": "{count} prontos",
  "apps.data_dialog.empty": "Nenhum ponto de dados sincronizado ainda.",
  "apps.data_dialog.expand": "Expandir",
  "apps.data_dialog.collapse": "Recolher",
  "apps.data_dialog.processing_failed": "Falha no processamento.",
  "apps.data_dialog.not_processed": "Ainda não processado.",
  "apps.data_dialog.filter_all": "Todas as categorias",

  // ─── Apps: settings dialog ─────────────────────────────────────────
  "apps.settings_dialog.title": "Configurações de {name}",
  "apps.settings_dialog.frequency_label": "Frequência de sincronização",
  "apps.settings_dialog.frequency_help":
    "Com que frequência sincronizar dados de {name} automaticamente.",
  "apps.settings_dialog.categories_label": "Categorias de dados",
  "apps.settings_dialog.categories_help":
    "Selecione quais tipos de dados sincronizar deste app.",
  "apps.settings_dialog.save": "Salvar configurações",
  "apps.settings_dialog.saving": "Salvando…",
  "apps.settings_dialog.cancel": "Cancelar",

  // ─── Apps: delete dialog ───────────────────────────────────────────
  "apps.delete_dialog.title": "Excluir app",
  "apps.delete_dialog.confirm_no_data":
    "Tem certeza que deseja excluir \"{name}\"? Esta ação não pode ser desfeita.",
  "apps.delete_dialog.confirm_one":
    "Tem certeza que deseja excluir \"{name}\"? Isso removerá permanentemente {count} ponto de dados sincronizado e todo conteúdo associado. Esta ação não pode ser desfeita.",
  "apps.delete_dialog.confirm_other":
    "Tem certeza que deseja excluir \"{name}\"? Isso removerá permanentemente {count} pontos de dados sincronizados e todo conteúdo associado. Esta ação não pode ser desfeita.",
  "apps.delete_dialog.cancel": "Cancelar",
  "apps.delete_dialog.delete": "Excluir",

  // ─── Apps: feedback (toasts) ───────────────────────────────────────
  "apps.feedback.disconnected": "Desconectado",
  "apps.feedback.connected": "{name} conectado!",
  "apps.feedback.connected_query":
    "{name} conectado com sucesso!",
  "apps.feedback.app_connected_success":
    "App conectado com sucesso!",
  "apps.feedback.test_passed": "Teste de conexão aprovado",
  "apps.feedback.sync_started": "Sincronizando {name}…",
  "apps.feedback.sync_completed": "Sincronização concluída",
  "apps.feedback.synced": "{name} sincronizado",
  "apps.feedback.disconnected_named": "{name} desconectado",
  "apps.feedback.settings_saved": "Configurações salvas",
  "apps.feedback.app_deleted": "App excluído",

  // ─── Apps: errors ──────────────────────────────────────────────────
  "error.apps.connect_failed":
    "Falha ao conectar. Verifique seu token e tente novamente.",
  "error.apps.network": "Erro de rede. Verifique sua conexão e tente novamente.",
  "error.apps.disconnect_failed": "Falha ao desconectar",
  "error.apps.test_failed": "Teste de conexão falhou",
  "error.apps.sync_failed": "Sincronização falhou",
  "error.apps.save_settings_failed": "Falha ao salvar configurações",
  "error.apps.delete_failed": "Falha ao excluir app",
  "error.apps.app_not_found":
    "App \"{slug}\" não encontrado no banco de dados. Execute prisma seed primeiro.",
  "error.apps.connection_failed": "Falha na conexão: {message}",
  "error.apps.sync_named_failed": "Falha ao sincronizar {name}",

  // ─── Feeds: statuses ───────────────────────────────────────────────
  "feeds.statuses.PENDING.label": "Pendente",
  "feeds.statuses.PROCESSING.label": "Sincronizando",
  "feeds.statuses.READY.label": "Pronto",
  "feeds.statuses.ERROR.label": "Erro",

  // ─── Feeds: sync intervals ─────────────────────────────────────────
  "feeds.sync_intervals.HOURLY.label": "A cada hora",
  "feeds.sync_intervals.HOURLY.description": "Verificar novos artigos a cada hora",
  "feeds.sync_intervals.DAILY.label": "Diariamente",
  "feeds.sync_intervals.DAILY.description": "Verificar novos artigos uma vez por dia",
  "feeds.sync_intervals.WEEKLY.label": "Semanalmente",
  "feeds.sync_intervals.WEEKLY.description": "Verificar novos artigos uma vez por semana",

  // ─── Feeds: list page ──────────────────────────────────────────────
  "feeds.list.title": "Feeds",
  "feeds.list.description":
    "Assine feeds RSS para importar artigos automaticamente para sua base de conhecimento.",
  "feeds.list.add_feed_button": "Adicionar feed",
  "feeds.list.search_placeholder": "Buscar por nome ou URL…",
  "feeds.list.filter_all_status": "Todos os status",
  "feeds.list.columns.name": "Nome",
  "feeds.list.columns.frequency": "Frequência",
  "feeds.list.columns.articles": "Artigos",
  "feeds.list.columns.status": "Status",
  "feeds.list.columns.last_checked": "Última verificação",
  "feeds.list.last_checked_never": "Nunca",
  "feeds.list.row_actions.view_articles": "Ver artigos",
  "feeds.list.row_actions.sync_now": "Sincronizar agora",
  "feeds.list.row_actions.settings": "Configurações",
  "feeds.list.row_actions.activate": "Ativar",
  "feeds.list.row_actions.deactivate": "Desativar",
  "feeds.list.row_actions.delete": "Excluir",
  "feeds.list.stats.total": "Total",
  "feeds.list.stats.active": "Ativos",
  "feeds.list.stats.articles": "Artigos",
  "feeds.list.stats.error": "Erro",
  "feeds.list.items_count": "{count} itens",

  // ─── Feeds: empty state ────────────────────────────────────────────
  "feeds.empty.title": "Nenhum feed ainda",
  "feeds.empty.description":
    "Adicione URLs de feeds RSS para monitorar blogs e fontes de notícias automaticamente. Novos artigos que combinarem com seus critérios serão importados para sua base de conhecimento de forma agendada.",
  "feeds.empty.add_first": "Adicione seu primeiro feed",

  // ─── Feeds: add modal ──────────────────────────────────────────────
  "feeds.add_modal.title": "Adicionar feed RSS",
  "feeds.add_modal.feed_url.label": "URL do feed",
  "feeds.add_modal.feed_url.placeholder": "https://blog.exemplo.com/rss.xml",
  "feeds.add_modal.feed_url.help":
    "URL de feed RSS ou Atom. URLs de blog com auto-descoberta de feed também funcionam.",
  "feeds.add_modal.frequency.label": "Frequência de verificação",
  "feeds.add_modal.instructions.label": "Instruções para o agente",
  "feeds.add_modal.instructions.placeholder":
    "Descreva o que você está procurando em linguagem natural. Por exemplo: \"Tenho interesse em apps de fitness, startups que captaram dinheiro, lançamentos de produtos e qualquer coisa relacionada a IA aplicada à saúde.\"",
  "feeds.add_modal.instructions.help":
    "Um agente de IA lerá o título, resumo e categorias de cada artigo para decidir se combina com sua intenção. Seja descritivo — quanto mais contexto você dá, melhores os resultados.",
  "feeds.add_modal.advanced.toggle": "Filtros avançados e opções",
  "feeds.add_modal.advanced.keyword_count": "{count} palavras-chave",
  "feeds.add_modal.include_keywords.label": "Palavras-chave para incluir (opcional)",
  "feeds.add_modal.include_keywords.placeholder":
    "Digite a palavra-chave e pressione Enter",
  "feeds.add_modal.include_keywords.help":
    "Pré-filtre por palavra-chave antes da avaliação por IA. Os artigos precisam combinar com pelo menos uma palavra-chave para serem considerados.",
  "feeds.add_modal.exclude_keywords.label": "Palavras-chave para excluir (opcional)",
  "feeds.add_modal.exclude_keywords.placeholder":
    "Digite a palavra-chave e pressione Enter",
  "feeds.add_modal.max_articles.label": "Máximo de artigos por sincronização",
  "feeds.add_modal.name.label": "Nome (opcional)",
  "feeds.add_modal.name.placeholder": "Detectado automaticamente do feed",
  "feeds.add_modal.description.label": "Descrição (opcional)",
  "feeds.add_modal.description.placeholder": "Sobre o que é este feed?",
  "feeds.add_modal.submit.adding": "Adicionando…",
  "feeds.add_modal.submit.add": "Adicionar feed",

  // ─── Feeds: settings dialog ────────────────────────────────────────
  "feeds.settings_dialog.title": "Configurações do feed",
  "feeds.settings_dialog.name.label": "Nome",
  "feeds.settings_dialog.frequency.label": "Frequência de verificação",
  "feeds.settings_dialog.instructions.label": "Instruções para o agente",
  "feeds.settings_dialog.instructions.placeholder":
    "Descreva em linguagem natural quais tipos de artigos você deseja…",
  "feeds.settings_dialog.instructions.help":
    "Um agente de IA avalia cada artigo de acordo com estas instruções durante a sincronização.",
  "feeds.settings_dialog.include_keywords.label": "Palavras-chave para incluir",
  "feeds.settings_dialog.exclude_keywords.label": "Palavras-chave para excluir",
  "feeds.settings_dialog.max_articles.label": "Máximo de artigos por sincronização",
  "feeds.settings_dialog.cancel": "Cancelar",
  "feeds.settings_dialog.save": "Salvar alterações",
  "feeds.settings_dialog.saving": "Salvando…",

  // ─── Feeds: entries dialog ─────────────────────────────────────────
  "feeds.entries_dialog.articles_count": "{count} artigos",
  "feeds.entries_dialog.checked_at": "Verificado {date}",
  "feeds.entries_dialog.search_placeholder": "Filtrar artigos…",
  "feeds.entries_dialog.no_articles": "Nenhum artigo encontrado",
  "feeds.entries_dialog.empty_selection":
    "Selecione um artigo da lista para ver seu conteúdo",
  "feeds.entries_dialog.entry.error_scrape": "Falha ao extrair conteúdo deste artigo.",
  "feeds.entries_dialog.entry.pending": "Este artigo ainda não foi extraído.",
  "feeds.entries_dialog.entry.no_content": "Sem conteúdo disponível para este artigo.",
  "feeds.entries_dialog.actions.open_site": "Abrir site",
  "feeds.entries_dialog.actions.sync_now": "Sincronizar agora",

  // ─── Feeds: delete dialog ──────────────────────────────────────────
  "feeds.delete_dialog.title": "Excluir feed",
  "feeds.delete_dialog.confirm":
    "Tem certeza de que deseja excluir \"{name}\"? Todos os artigos importados e o histórico de sincronização serão removidos permanentemente. Esta ação não pode ser desfeita.",
  "feeds.delete_dialog.cancel": "Cancelar",
  "feeds.delete_dialog.delete": "Excluir",

  // ─── Feeds: feedback ───────────────────────────────────────────────
  "feeds.feedback.added": "Feed adicionado — sincronizando artigos",
  "feeds.feedback.deleted": "Feed excluído",
  "feeds.feedback.activated": "Feed ativado",
  "feeds.feedback.deactivated": "Feed desativado",
  "feeds.feedback.settings_saved": "Configurações salvas",
  "feeds.feedback.syncing": "Sincronizando feed…",
  "feeds.feedback.sync_complete_one": "Sincronização concluída — 1 novo artigo",
  "feeds.feedback.sync_complete_other": "Sincronização concluída — {count} novos artigos",

  // ─── Feeds: errors ─────────────────────────────────────────────────
  "error.feeds.url_required": "URL do feed é obrigatória",
  "error.feeds.invalid_url": "Por favor, informe uma URL válida",
  "error.feeds.add_failed": "Falha ao adicionar feed",
  "error.feeds.save_failed": "Falha ao salvar",
  "error.feeds.sync_failed": "Falha na sincronização",
  "error.feeds.delete_failed": "Falha ao excluir feed",

  // ─── Links: statuses ───────────────────────────────────────────────
  "links.statuses.PENDING.label": "Pendente",
  "links.statuses.PROCESSING.label": "Extraindo",
  "links.statuses.PROCESSING.crawling.label": "Rastreando",
  "links.statuses.READY.label": "Pronto",
  "links.statuses.ERROR.label": "Erro",

  // ─── Links: scrape modes ───────────────────────────────────────────
  "links.scrape_modes.SINGLE.label": "Página única",
  "links.scrape_modes.SINGLE.description": "Extrair conteúdo de uma única URL",
  "links.scrape_modes.FULL_SITE.label": "Site inteiro",
  "links.scrape_modes.FULL_SITE.description": "Rastrear todas as páginas sob este domínio",

  // ─── Links: list page ──────────────────────────────────────────────
  "links.list.title": "Links",
  "links.list.description":
    "Adicione URLs para extrair e importar conteúdo da web para sua base de conhecimento.",
  "links.list.add_link_button": "Adicionar link",
  "links.list.search_placeholder": "Buscar por nome, URL ou domínio…",
  "links.list.filter_all_status": "Todos os status",
  "links.list.columns.name": "Nome",
  "links.list.columns.domain": "Domínio",
  "links.list.columns.content": "Conteúdo",
  "links.list.columns.status": "Status",
  "links.list.columns.last_scraped": "Última extração",
  "links.list.row_actions.view_content": "Ver conteúdo",
  "links.list.row_actions.open_url": "Abrir URL",
  "links.list.row_actions.rescrape": "Re-extrair",
  "links.list.row_actions.recrawl": "Re-rastrear",
  "links.list.row_actions.activate": "Ativar",
  "links.list.row_actions.deactivate": "Desativar",
  "links.list.row_actions.delete": "Excluir",
  "links.list.content.chars_short": "{count} caracteres",
  "links.list.content.chars_thousands": "{count}K caracteres",
  "links.list.content.chars_millions": "{count}M caracteres",
  "links.list.content.pages_count": "{scraped} páginas",
  "links.list.content.pages_progress": "{scraped}/{total} páginas",
  "links.list.status.crawling_progress": "Rastreando {scraped}/{total}",
  "links.list.stats.total": "Total",
  "links.list.stats.ready": "Prontos",
  "links.list.stats.processing": "Processando",
  "links.list.stats.error": "Erro",
  "links.list.items_count": "{count} itens",

  // ─── Links: empty state ────────────────────────────────────────────
  "links.empty.title": "Nenhum link ainda",
  "links.empty.description":
    "Adicione URLs para extrair e importar conteúdo de páginas web automaticamente para sua base de conhecimento. Mantenha seu conhecimento atualizado com fontes externas.",
  "links.empty.add_first": "Adicione seu primeiro link",

  // ─── Links: add modal ──────────────────────────────────────────────
  "links.add_modal.title": "Adicionar link",
  "links.add_modal.url.label": "URL",
  "links.add_modal.url.placeholder": "https://exemplo.com/docs",
  "links.add_modal.scrape_mode.label": "Modo de extração",
  "links.add_modal.max_pages.label": "Máximo de páginas",
  "links.add_modal.max_pages.help": "Rastrear até {count} páginas sob esta URL",
  "links.add_modal.name.label": "Nome (opcional)",
  "links.add_modal.name.placeholder": "Detectado automaticamente do título da página",
  "links.add_modal.description.label": "Descrição (opcional)",
  "links.add_modal.description.placeholder": "Sobre o que é esta página?",
  "links.add_modal.submit.adding": "Adicionando…",
  "links.add_modal.submit.add_link": "Adicionar link",
  "links.add_modal.submit.add_and_crawl": "Adicionar e rastrear site",

  // ─── Links: crawl progress ─────────────────────────────────────────
  "links.crawl_progress.starting": "Iniciando rastreamento…",
  "links.crawl_progress.crawling":
    "Rastreando… {scraped} de {total} páginas extraídas",
  "links.crawl_progress.percent_complete": "{percent}% concluído",
  "links.crawl_progress.errors_one": "1 erro",
  "links.crawl_progress.errors_other": "{count} erros",
  "links.crawl_progress.last_scraped": "Última extraída: {label}",

  // ─── Links: content dialog ─────────────────────────────────────────
  "links.content_dialog.scraped_at": "Extraído em {date}",
  "links.content_dialog.crawled_at": "Rastreado em {date}",
  "links.content_dialog.pages_count": "{count} páginas",
  "links.content_dialog.scraping_in_progress": "Extração em andamento…",
  "links.content_dialog.scraping_not_started": "A extração ainda não começou.",
  "links.content_dialog.error_default": "Ocorreu um erro durante a extração.",
  "links.content_dialog.no_content_extracted":
    "Nenhum conteúdo foi extraído desta página.",
  "links.content_dialog.search_placeholder": "Filtrar páginas…",
  "links.content_dialog.no_pages": "Nenhuma página encontrada",
  "links.content_dialog.empty_selection":
    "Selecione uma página da lista para ver seu conteúdo",
  "links.content_dialog.page.error_scrape": "Falha ao extrair esta página.",
  "links.content_dialog.page.no_content": "Sem conteúdo disponível para esta página.",
  "links.content_dialog.actions.open_url": "Abrir URL",
  "links.content_dialog.actions.rescrape": "Re-extrair",
  "links.content_dialog.actions.recrawl": "Re-rastrear",

  // ─── Links: delete dialog ──────────────────────────────────────────
  "links.delete_dialog.title": "Excluir link",
  "links.delete_dialog.confirm":
    "Tem certeza de que deseja excluir \"{name}\"? O conteúdo extraído e todos os dados associados serão removidos permanentemente. Esta ação não pode ser desfeita.",
  "links.delete_dialog.cancel": "Cancelar",
  "links.delete_dialog.delete": "Excluir",

  // ─── Links: feedback ───────────────────────────────────────────────
  "links.feedback.added_scraping": "Link adicionado — extração em andamento",
  "links.feedback.added_crawling": "Site adicionado — rastreamento em andamento",
  "links.feedback.deleted": "Link excluído",
  "links.feedback.activated": "Ativado",
  "links.feedback.deactivated": "Desativado",
  "links.feedback.rescraping": "Re-extraindo…",
  "links.feedback.recrawling": "Re-rastreando…",
  "links.feedback.rescrape_complete": "Re-extração concluída",
  "links.feedback.recrawl_started": "Re-rastreamento iniciado",

  // ─── Links: errors ─────────────────────────────────────────────────
  "error.links.url_required": "URL é obrigatória",
  "error.links.invalid_url": "Por favor, informe uma URL válida",
  "error.links.add_failed": "Falha ao adicionar link",
  "error.links.delete_failed": "Falha ao excluir link",
  "error.links.rescrape_failed": "Falha na re-extração",
  "error.links.recrawl_failed": "Falha no re-rastreamento",

  // ═══════════════════════════════════════════════════════════════════
  // KNOWLEDGE MEDIA — shared statuses (documents/images/videos/audios)
  // ═══════════════════════════════════════════════════════════════════
  "knowledge.media.statuses.pending.label": "Pendente",
  "knowledge.media.statuses.processing.label": "Processando",
  "knowledge.media.statuses.ready.label": "Pronto",
  "knowledge.media.statuses.error.label": "Erro",

  // ─── Documents: list page ──────────────────────────────────────────
  "documents.list.title": "Documentos",
  "documents.list.description":
    "Guias, políticas, SOPs e materiais de referência para sua equipe e parceiros.",
  "documents.list.upload_button": "Enviar documento",
  "documents.list.new_folder_button": "Nova pasta",
  "documents.list.search_placeholder": "Buscar por nome, descrição ou arquivo…",
  "documents.list.items_count": "{count} item(ns)",
  "documents.list.filter_all_types": "Todos os tipos",
  "documents.list.filter_all_status": "Todos os status",
  "documents.list.breadcrumb_root": "Todos os documentos",
  "documents.list.folder_count_docs": "{count} doc(s)",
  "documents.list.folder_count_subfolders": "{count} pasta(s)",
  "documents.columns.name": "Nome",
  "documents.columns.type": "Tipo",
  "documents.columns.size": "Tamanho",
  "documents.columns.status": "Status",
  "documents.columns.uploaded": "Enviado",
  "documents.columns.actions.view": "Visualizar",
  "documents.columns.actions.download": "Baixar",
  "documents.columns.actions.move_to_folder": "Mover para pasta",
  "documents.columns.actions.move_to_root": "Raiz (sem pasta)",
  "documents.columns.actions.activate": "Ativar",
  "documents.columns.actions.deactivate": "Desativar",
  "documents.columns.actions.delete": "Excluir",
  "documents.empty.title": "Nenhum documento ainda",
  "documents.empty.description":
    "Envie guias, políticas, SOPs e outros materiais de referência. Documentos ficam disponíveis para sua equipe e podem ser compartilhados com parceiros.",
  "documents.empty.upload_first": "Enviar seu primeiro documento",
  "documents.upload.title": "Enviar documento",
  "documents.upload.drop_here": "Solte um arquivo aqui ou clique para procurar",
  "documents.upload.accepted_formats": "PDF, DOCX, TXT, MD ou CSV",
  "documents.upload.field_name": "Nome",
  "documents.upload.field_name_placeholder": "Nome do documento",
  "documents.upload.field_description": "Descrição (opcional)",
  "documents.upload.field_description_placeholder": "Sobre o que é este documento?",
  "documents.upload.button_idle": "Enviar documento",
  "documents.upload.button_uploading": "Enviando…",
  "documents.viewer.title": "Visualizador de documento",
  "documents.viewer.field_name": "Nome",
  "documents.viewer.field_description": "Descrição",
  "documents.viewer.field_description_placeholder": "Adicione uma descrição…",
  "documents.viewer.action_download": "Baixar",
  "documents.viewer.action_save": "Salvar",
  "documents.viewer.action_process": "Processar",
  "documents.viewer.action_reprocess": "Reprocessar",
  "documents.viewer.uploaded_at": "Enviado em {date}",
  "documents.viewer.chunks_count": "{count} chunk(s)",
  "documents.viewer.tab_preview": "Pré-visualização",
  "documents.viewer.tab_text": "Texto extraído",
  "documents.viewer.state_pending":
    "Documento ainda não processado. Clique em “Processar” para extrair o texto.",
  "documents.viewer.state_processing": "Processando documento…",
  "documents.viewer.state_error":
    "Falha no processamento. Clique em “Reprocessar” para tentar novamente.",
  "documents.viewer.no_text": "Nenhum conteúdo de texto extraído.",
  "documents.feedback.uploaded": "Documento enviado. Processamento iniciado…",
  "documents.feedback.updated": "Documento atualizado",
  "documents.feedback.deleted": "Documento excluído",
  "documents.feedback.activated": "Ativado",
  "documents.feedback.deactivated": "Desativado",
  "documents.feedback.processing_started": "Processamento iniciado",
  "documents.feedback.moved_to_folder": "Movido para a pasta",
  "documents.feedback.moved_to_root": "Movido para a raiz",
  "documents.feedback.folder_deleted": "Pasta excluída",
  "error.documents.select_file": "Selecione um arquivo",
  "error.documents.name_required": "Nome é obrigatório",
  "error.documents.upload_failed": "Falha no envio do arquivo",
  "error.documents.save_failed": "Falha ao salvar documento",
  "error.documents.update_failed": "Falha ao atualizar",
  "error.documents.delete_failed": "Falha ao excluir documento",
  "error.documents.processing_failed": "Falha no processamento",
  "error.documents.folder_delete_failed": "Falha ao excluir pasta",

  // ─── Images: list page ─────────────────────────────────────────────
  "images.list.title": "Imagens",
  "images.list.description":
    "Fotos, capturas de tela, diagramas e ativos visuais para sua base de conhecimento.",
  "images.list.upload_button": "Enviar imagem",
  "images.list.new_folder_button": "Nova pasta",
  "images.list.search_placeholder": "Buscar por nome, descrição ou arquivo…",
  "images.list.items_count": "{count} item(ns)",
  "images.list.filter_all_types": "Todos os tipos",
  "images.list.filter_all_status": "Todos os status",
  "images.list.breadcrumb_root": "Todas as imagens",
  "images.list.folder_count_images": "{count} imagem(ns)",
  "images.list.folder_count_subfolders": "{count} pasta(s)",
  "images.columns.name": "Nome",
  "images.columns.type": "Tipo",
  "images.columns.dimensions": "Dimensões",
  "images.columns.size": "Tamanho",
  "images.columns.status": "Status",
  "images.columns.uploaded": "Enviado",
  "images.columns.actions.view": "Visualizar",
  "images.columns.actions.download": "Baixar",
  "images.columns.actions.move_to_folder": "Mover para pasta",
  "images.columns.actions.move_to_root": "Raiz (sem pasta)",
  "images.columns.actions.activate": "Ativar",
  "images.columns.actions.deactivate": "Desativar",
  "images.columns.actions.delete": "Excluir",
  "images.empty.title": "Nenhuma imagem ainda",
  "images.empty.description":
    "Envie fotos, capturas de tela, diagramas e outros ativos visuais. As imagens serão analisadas pela IA para gerar descrições de texto pesquisáveis.",
  "images.empty.upload_first": "Enviar sua primeira imagem",
  "images.upload.title": "Enviar imagem",
  "images.upload.drop_here": "Solte uma imagem aqui ou clique para procurar",
  "images.upload.accepted_formats": "PNG, JPG, WEBP, GIF, SVG ou TIFF",
  "images.upload.field_name": "Nome",
  "images.upload.field_name_placeholder": "Nome da imagem",
  "images.upload.field_description": "Descrição (opcional)",
  "images.upload.field_description_placeholder": "Sobre o que é esta imagem?",
  "images.upload.button_idle": "Enviar imagem",
  "images.upload.button_uploading": "Enviando…",
  "images.viewer.title": "Visualizador de imagem",
  "images.viewer.field_name": "Nome",
  "images.viewer.field_description": "Descrição",
  "images.viewer.field_description_placeholder": "Adicione uma descrição…",
  "images.viewer.action_download": "Baixar",
  "images.viewer.action_save": "Salvar",
  "images.viewer.action_process": "Processar",
  "images.viewer.action_reprocess": "Reprocessar",
  "images.viewer.uploaded_at": "Enviado em {date}",
  "images.viewer.chunks_count": "{count} chunk(s)",
  "images.viewer.tab_preview": "Pré-visualização",
  "images.viewer.tab_description": "Descrição por IA",
  "images.viewer.state_pending":
    "Imagem ainda não processada. Clique em “Processar” para gerar uma descrição.",
  "images.viewer.state_processing": "Processando imagem…",
  "images.viewer.state_error":
    "Falha no processamento. Clique em “Reprocessar” para tentar novamente.",
  "images.viewer.no_description": "Nenhuma descrição por IA gerada ainda.",
  "images.feedback.uploaded": "Imagem enviada. Processamento iniciado…",
  "images.feedback.updated": "Imagem atualizada",
  "images.feedback.deleted": "Imagem excluída",
  "images.feedback.activated": "Ativado",
  "images.feedback.deactivated": "Desativado",
  "images.feedback.processing_started": "Processamento iniciado",
  "images.feedback.moved_to_folder": "Movido para a pasta",
  "images.feedback.moved_to_root": "Movido para a raiz",
  "images.feedback.folder_deleted": "Pasta excluída",
  "error.images.select_file": "Selecione um arquivo",
  "error.images.name_required": "Nome é obrigatório",
  "error.images.upload_failed": "Falha no envio do arquivo",
  "error.images.save_failed": "Falha ao salvar imagem",
  "error.images.update_failed": "Falha ao atualizar",
  "error.images.delete_failed": "Falha ao excluir imagem",
  "error.images.processing_failed": "Falha no processamento",
  "error.images.folder_delete_failed": "Falha ao excluir pasta",

  // ─── Videos: list page ─────────────────────────────────────────────
  "videos.list.title": "Vídeos",
  "videos.list.description":
    "Conteúdo de vídeo transcrito com diarização de locutores por IA para sua base de conhecimento.",
  "videos.list.upload_button": "Enviar vídeo",
  "videos.list.new_folder_button": "Nova pasta",
  "videos.list.search_placeholder": "Buscar por nome, descrição ou arquivo…",
  "videos.list.items_count": "{count} item(ns)",
  "videos.list.filter_all_types": "Todos os tipos",
  "videos.list.filter_all_status": "Todos os status",
  "videos.list.breadcrumb_root": "Todos os vídeos",
  "videos.list.folder_count_videos": "{count} vídeo(s)",
  "videos.list.folder_count_subfolders": "{count} pasta(s)",
  "videos.columns.name": "Nome",
  "videos.columns.type": "Tipo",
  "videos.columns.duration": "Duração",
  "videos.columns.size": "Tamanho",
  "videos.columns.status": "Status",
  "videos.columns.uploaded": "Enviado",
  "videos.columns.actions.view": "Visualizar",
  "videos.columns.actions.download": "Baixar",
  "videos.columns.actions.move_to_folder": "Mover para pasta",
  "videos.columns.actions.move_to_root": "Raiz (sem pasta)",
  "videos.columns.actions.activate": "Ativar",
  "videos.columns.actions.deactivate": "Desativar",
  "videos.columns.actions.delete": "Excluir",
  "videos.empty.title": "Nenhum vídeo ainda",
  "videos.empty.description":
    "Envie conteúdo de vídeo para ser automaticamente transcrito com diarização de locutores. As transcrições viram conhecimento pesquisável para seus agentes de IA.",
  "videos.empty.upload_first": "Enviar seu primeiro vídeo",
  "videos.upload.title": "Enviar vídeo",
  "videos.upload.drop_here": "Solte um arquivo aqui ou clique para procurar",
  "videos.upload.accepted_formats": "MP4, MOV, WEBM ou AVI",
  "videos.upload.transcription_note":
    "Os vídeos serão transcritos com diarização de locutores",
  "videos.upload.field_name": "Nome",
  "videos.upload.field_name_placeholder": "Nome do vídeo",
  "videos.upload.field_description": "Descrição (opcional)",
  "videos.upload.field_description_placeholder": "Sobre o que é este vídeo?",
  "videos.upload.button_idle": "Enviar vídeo",
  "videos.upload.button_uploading": "Enviando…",
  "videos.viewer.title": "Visualizador de vídeo",
  "videos.viewer.field_name": "Nome",
  "videos.viewer.field_description": "Descrição",
  "videos.viewer.field_description_placeholder": "Adicione uma descrição…",
  "videos.viewer.action_download": "Baixar",
  "videos.viewer.action_save": "Salvar",
  "videos.viewer.action_transcribe": "Transcrever",
  "videos.viewer.action_retranscribe": "Re-transcrever",
  "videos.viewer.uploaded_at": "Enviado em {date}",
  "videos.viewer.chunks_count": "{count} chunk(s)",
  "videos.viewer.tab_preview": "Pré-visualização",
  "videos.viewer.tab_transcript": "Transcrição",
  "videos.viewer.state_pending":
    "Vídeo ainda não transcrito. Clique em “Transcrever” para começar.",
  "videos.viewer.state_processing": "Transcrevendo vídeo…",
  "videos.viewer.state_error":
    "Falha na transcrição. Clique em “Re-transcrever” para tentar novamente.",
  "videos.viewer.no_transcript": "Nenhuma transcrição disponível.",
  "videos.feedback.uploaded": "Vídeo enviado. Transcrição iniciada…",
  "videos.feedback.updated": "Vídeo atualizado",
  "videos.feedback.deleted": "Vídeo excluído",
  "videos.feedback.activated": "Ativado",
  "videos.feedback.deactivated": "Desativado",
  "videos.feedback.transcription_started": "Transcrição iniciada",
  "videos.feedback.moved_to_folder": "Movido para a pasta",
  "videos.feedback.moved_to_root": "Movido para a raiz",
  "videos.feedback.folder_deleted": "Pasta excluída",
  "error.videos.select_file": "Selecione um arquivo",
  "error.videos.name_required": "Nome é obrigatório",
  "error.videos.upload_failed": "Falha no envio do arquivo",
  "error.videos.save_failed": "Falha ao salvar vídeo",
  "error.videos.update_failed": "Falha ao atualizar",
  "error.videos.delete_failed": "Falha ao excluir vídeo",
  "error.videos.transcription_failed": "Falha na transcrição",
  "error.videos.folder_delete_failed": "Falha ao excluir pasta",

  // ─── Audios: list page ─────────────────────────────────────────────
  "audios.list.title": "Áudios",
  "audios.list.description":
    "Conteúdo de áudio transcrito com diarização de locutores por IA para sua base de conhecimento.",
  "audios.list.upload_button": "Enviar áudio",
  "audios.list.new_folder_button": "Nova pasta",
  "audios.list.search_placeholder": "Buscar por nome, descrição ou arquivo…",
  "audios.list.items_count": "{count} item(ns)",
  "audios.list.filter_all_types": "Todos os tipos",
  "audios.list.filter_all_status": "Todos os status",
  "audios.list.breadcrumb_root": "Todos os áudios",
  "audios.list.folder_count_audios": "{count} áudio(s)",
  "audios.list.folder_count_subfolders": "{count} pasta(s)",
  "audios.columns.name": "Nome",
  "audios.columns.type": "Tipo",
  "audios.columns.duration": "Duração",
  "audios.columns.size": "Tamanho",
  "audios.columns.status": "Status",
  "audios.columns.uploaded": "Enviado",
  "audios.columns.actions.view": "Visualizar",
  "audios.columns.actions.download": "Baixar",
  "audios.columns.actions.move_to_folder": "Mover para pasta",
  "audios.columns.actions.move_to_root": "Raiz (sem pasta)",
  "audios.columns.actions.activate": "Ativar",
  "audios.columns.actions.deactivate": "Desativar",
  "audios.columns.actions.delete": "Excluir",
  "audios.empty.title": "Nenhum áudio ainda",
  "audios.empty.description":
    "Envie conteúdo de áudio para ser automaticamente transcrito com diarização de locutores. As transcrições viram conhecimento pesquisável para seus agentes de IA.",
  "audios.empty.upload_first": "Enviar seu primeiro áudio",
  "audios.upload.title": "Enviar áudio",
  "audios.upload.drop_here": "Solte um arquivo de áudio aqui ou clique para procurar",
  "audios.upload.accepted_formats": "MP3, WAV, OGG, FLAC, AAC ou M4A",
  "audios.upload.transcription_note":
    "O áudio será transcrito com diarização de locutores",
  "audios.upload.field_name": "Nome",
  "audios.upload.field_name_placeholder": "Nome do áudio",
  "audios.upload.field_description": "Descrição (opcional)",
  "audios.upload.field_description_placeholder": "Sobre o que é este áudio?",
  "audios.upload.button_idle": "Enviar áudio",
  "audios.upload.button_uploading": "Enviando…",
  "audios.viewer.title": "Visualizador de áudio",
  "audios.viewer.field_name": "Nome",
  "audios.viewer.field_description": "Descrição",
  "audios.viewer.field_description_placeholder": "Adicione uma descrição…",
  "audios.viewer.action_download": "Baixar",
  "audios.viewer.action_save": "Salvar",
  "audios.viewer.action_transcribe": "Transcrever",
  "audios.viewer.action_retranscribe": "Re-transcrever",
  "audios.viewer.uploaded_at": "Enviado em {date}",
  "audios.viewer.chunks_count": "{count} chunk(s)",
  "audios.viewer.tab_player": "Player",
  "audios.viewer.tab_transcript": "Transcrição",
  "audios.viewer.state_pending":
    "Áudio ainda não transcrito. Clique em “Transcrever” para começar.",
  "audios.viewer.state_processing": "Transcrevendo áudio…",
  "audios.viewer.state_error":
    "Falha na transcrição. Clique em “Re-transcrever” para tentar novamente.",
  "audios.viewer.no_transcript": "Nenhuma transcrição disponível.",
  "audios.feedback.uploaded": "Áudio enviado. Transcrição iniciada…",
  "audios.feedback.updated": "Áudio atualizado",
  "audios.feedback.deleted": "Áudio excluído",
  "audios.feedback.activated": "Ativado",
  "audios.feedback.deactivated": "Desativado",
  "audios.feedback.transcription_started": "Transcrição iniciada",
  "audios.feedback.moved_to_folder": "Movido para a pasta",
  "audios.feedback.moved_to_root": "Movido para a raiz",
  "audios.feedback.folder_deleted": "Pasta excluída",
  "error.audios.select_file": "Selecione um arquivo",
  "error.audios.name_required": "Nome é obrigatório",
  "error.audios.upload_failed": "Falha no envio do arquivo",
  "error.audios.save_failed": "Falha ao salvar áudio",
  "error.audios.update_failed": "Falha ao atualizar",
  "error.audios.delete_failed": "Falha ao excluir áudio",
  "error.audios.transcription_failed": "Falha na transcrição",
  "error.audios.folder_delete_failed": "Falha ao excluir pasta",

  // ═══════════════════════════════════════════════════════════════════
  // KNOWLEDGE — meta-feature shell (1.5.6e)
  // ═══════════════════════════════════════════════════════════════════
  // ─── Dashboard ─────────────────────────────────────────────────────
  "knowledge.dashboard.title": "Todas as fontes",
  "knowledge.dashboard.summary":
    "{total} itens no total em {count} fontes",
  "knowledge.dashboard.empty.title": "Nenhuma fonte selecionada",
  "knowledge.dashboard.empty.description":
    "Use “Gerenciar fontes” na barra lateral para adicionar blocos.",

  // ─── Manage Sources dialog ─────────────────────────────────────────
  "knowledge.manage.title": "Gerenciar fontes",
  "knowledge.manage.description":
    "Escolha quais blocos serão fontes de conhecimento. Categorias e ordem espelham a ferramenta Blocos.",
  "knowledge.manage.available_sources": "Fontes disponíveis",
  "knowledge.manage.selected_sources": "Fontes selecionadas",
  "knowledge.manage.all_added": "Todos os blocos adicionados.",
  "knowledge.manage.none_selected": "Nenhuma fonte selecionada ainda.",
  "knowledge.manage.fallback_category": "Outros",
  "knowledge.manage.action.add": "Adicionar como fonte",
  "knowledge.manage.action.remove": "Remover fonte",
  "knowledge.manage.feedback.saved": "Fontes atualizadas",
  "error.knowledge.manage.save_failed": "Falha ao salvar configurações",

  // ─── Knowledge Tables empty state ──────────────────────────────────
  "knowledge.tables.empty.title": "Tabelas",
  "knowledge.tables.empty.description":
    "Conjuntos de dados estruturados, tabelas de referência e dados auxiliares para operações e relatórios.",
  "knowledge.tables.empty.import_airtable": "Importar do Airtable",
  "knowledge.tables.empty.create": "Criar tabela",
  "knowledge.tables.empty.heading": "Nenhuma tabela ainda",
  "knowledge.tables.empty.body":
    "Crie conjuntos de dados estruturados e tabelas de referência. As tabelas ajudam a organizar dados para operações, cálculos de comissão e relatórios.",
  "knowledge.tables.empty.cta": "Crie sua primeira tabela",

  // ─── Knowledge Create Table modal ──────────────────────────────────
  "knowledge.tables.create.title": "Criar tabela",
  "knowledge.tables.create.name_label": "Nome",
  "knowledge.tables.create.name_placeholder":
    "Ex.: Produtos, Faixas de comissão",
  "knowledge.tables.create.description_label": "Descrição (opcional)",
  "knowledge.tables.create.description_placeholder":
    "Quais dados esta tabela armazenará?",
  "knowledge.tables.create.creating": "Criando...",
  "knowledge.tables.create.submit": "Criar tabela",
  "knowledge.tables.feedback.created": "Tabela criada",
  "error.knowledge.tables.name_required": "Nome é obrigatório",
  "error.knowledge.tables.create_failed": "Falha ao criar tabela",

  // ─── Airtable Import wizard ────────────────────────────────────────
  "knowledge.airtable.title": "Importar do Airtable",
  "knowledge.airtable.step.base": "1. Base",
  "knowledge.airtable.step.table": "2. Tabela",
  "knowledge.airtable.step.fields": "3. Campos",
  "knowledge.airtable.step.import": "4. Importar",
  "knowledge.airtable.select_base.prompt":
    "Selecione uma base do Airtable para importar.",
  "knowledge.airtable.loading_bases": "Carregando bases...",
  "knowledge.airtable.no_bases":
    "Nenhuma base encontrada. Verifique se seu token do Airtable tem acesso a pelo menos uma base.",
  "knowledge.airtable.select_table.prompt": "Selecione uma tabela para importar.",
  "knowledge.airtable.loading_tables": "Carregando tabelas...",
  "knowledge.airtable.fields_count": "{count} campos",
  "knowledge.airtable.field_mapping.prompt":
    "Revise os mapeamentos de campos. Ajuste tipos, renomeie campos ou pule campos que não precisa.",
  "knowledge.airtable.field_mapping.airtable_field": "Campo do Airtable",
  "knowledge.airtable.field_mapping.internal_type": "Tipo interno",
  "knowledge.airtable.field_mapping.internal_name": "Nome interno",
  "knowledge.airtable.field_mapping.skip": "Pular",
  "knowledge.airtable.field_mapping.selected_count":
    "{active} de {total} campos selecionados",
  "knowledge.airtable.field_mapping.import_action": "Importar {name}",
  "knowledge.airtable.importing.title": "Importando {name}...",
  "knowledge.airtable.importing.records": "{count} registros importados",
  "knowledge.airtable.importing.warning":
    "Isso pode levar alguns minutos para tabelas grandes. Não feche este diálogo.",
  "knowledge.airtable.failed.title": "Falha na importação",
  "knowledge.airtable.failed.unknown_error": "Ocorreu um erro desconhecido",
  "knowledge.airtable.failed.partial":
    "{count} registros foram importados antes do erro.",
  "knowledge.airtable.complete.title": "Importação concluída",
  "knowledge.airtable.complete.body":
    "Importados com sucesso {count} registros de {name}.",
  "knowledge.airtable.view_table": "Ver tabela",
  "error.knowledge.airtable.load_bases_failed": "Falha ao carregar bases",
  "error.knowledge.airtable.connect_failed": "Falha ao conectar com o Airtable",
  "error.knowledge.airtable.load_tables_failed": "Falha ao carregar tabelas",
  "error.knowledge.airtable.fetch_tables_failed": "Falha ao buscar tabelas",
  "error.knowledge.airtable.import_failed": "Falha na importação",
  "error.knowledge.airtable.start_import_failed": "Falha ao iniciar importação",

  // Meeting Prep
  "meeting_prep.tool.name": "Preparação de Reuniões",
  "meeting_prep.tool.short_description":
    "Prepare-se para reuniões importantes com role-play multi-agente.",
  "meeting_prep.tool.description":
    "Capture o contexto da reunião, ative um painel de especialistas, monte um plano estratégico, ensaie por role-play e entre com checklist em mãos.",
  "meeting_prep.tool.beta_badge": "Beta",

  "meeting_prep.list.title": "Preparação de Reuniões",
  "meeting_prep.list.description":
    "Sessões que você preparou. Cada sessão guarda briefing, painel, plano, ensaio e debrief.",
  "meeting_prep.list.new_session": "Nova sessão",
  "meeting_prep.list.empty_title": "Nenhuma sessão ainda",
  "meeting_prep.list.empty_body":
    "Crie uma nova sessão para capturar o contexto de uma reunião próxima.",
  "meeting_prep.list.column.title": "Título",
  "meeting_prep.list.column.type": "Tipo",
  "meeting_prep.list.column.status": "Status",
  "meeting_prep.list.column.updated": "Atualizada",
  "meeting_prep.list.column.actions": "",
  "meeting_prep.list.untitled": "Sessão sem título",
  "meeting_prep.list.delete": "Excluir",
  "meeting_prep.list.delete_confirm":
    "Excluir esta sessão? Não pode ser desfeito.",

  "meeting_prep.status.draft": "Rascunho",
  "meeting_prep.status.briefed": "Briefing pronto",
  "meeting_prep.status.specialists_ready": "Especialistas prontos",
  "meeting_prep.status.plan_ready": "Plano pronto",
  "meeting_prep.status.rehearsed": "Ensaiada",
  "meeting_prep.status.closed": "Concluída",

  "meeting_prep.briefing.crumb": "Ferramentas",
  "meeting_prep.briefing.title": "Briefing da reunião",
  "meeting_prep.briefing.description":
    "Descreva o contexto da reunião. Defaults inteligentes — tudo é editável. Salva automaticamente.",
  "meeting_prep.briefing.progress": "{filled} de {total} seções",
  "meeting_prep.briefing.autosave_idle": "Tudo salvo",
  "meeting_prep.briefing.autosave_pending": "Salvando…",
  "meeting_prep.briefing.optional": "Opcional",
  "meeting_prep.briefing.recommended": "Recomendado",

  "meeting_prep.briefing.section.identification": "1. Identificação",
  "meeting_prep.briefing.section.identification_help":
    "O que é a reunião e quando acontece.",
  "meeting_prep.briefing.section.objective": "2. Objetivo de negócio",
  "meeting_prep.briefing.section.objective_help":
    "O que você quer alcançar — concreto e mensurável.",
  "meeting_prep.briefing.section.participants": "3. Participantes",
  "meeting_prep.briefing.section.participants_help":
    "Quem mais está na sala. Pelo menos um.",
  "meeting_prep.briefing.section.outcome": "4. Resultado desejado",
  "meeting_prep.briefing.section.outcome_help":
    "Como é o sucesso — e o resultado mínimo aceitável.",
  "meeting_prep.briefing.section.context": "5. Contexto adicional",
  "meeting_prep.briefing.section.context_help":
    "Histórico, restrições e tom — afia todas as outras etapas.",

  "meeting_prep.field.title": "Título da reunião",
  "meeting_prep.field.title_placeholder":
    "ex. Board do Q1 · Negociação Acme · 1:1 com Sara",
  "meeting_prep.field.meeting_type": "Tipo",
  "meeting_prep.field.meeting_type_placeholder": "Escolha um tipo",
  "meeting_prep.field.scheduled_at": "Quando acontece",
  "meeting_prep.field.duration": "Duração estimada",
  "meeting_prep.field.duration_value": "{minutes} min",

  "meeting_prep.meeting_type.one_on_one": "1:1",
  "meeting_prep.meeting_type.commercial": "Comercial / Vendas",
  "meeting_prep.meeting_type.board": "Board / Diretoria",
  "meeting_prep.meeting_type.hr_feedback": "RH / Feedback / Performance",
  "meeting_prep.meeting_type.negotiation": "Negociação",
  "meeting_prep.meeting_type.interview": "Entrevista",
  "meeting_prep.meeting_type.kickoff": "Kickoff",
  "meeting_prep.meeting_type.partnership": "Parceria",
  "meeting_prep.meeting_type.investor": "Investidor",
  "meeting_prep.meeting_type.other": "Outro",

  "meeting_prep.field.objective": "Objetivo",
  "meeting_prep.field.objective_placeholder.one_on_one":
    "ex. Desbloquear a entrega da Acme e alinhar prioridades da próxima semana.",
  "meeting_prep.field.objective_placeholder.commercial":
    "ex. Avançar o deal Acme para a etapa de proposta com compromisso explícito.",
  "meeting_prep.field.objective_placeholder.board":
    "ex. Aprovar o plano do Q1 e o delta de orçamento de marketing.",
  "meeting_prep.field.objective_placeholder.hr_feedback":
    "ex. Entregar feedback estruturado e alinhar plano de 30 dias.",
  "meeting_prep.field.objective_placeholder.negotiation":
    "ex. Chegar a um acordo que respeite minha BATNA e crie ganho mútuo.",
  "meeting_prep.field.objective_placeholder.interview":
    "ex. Decidir se o candidato atende à barra do papel sênior.",
  "meeting_prep.field.objective_placeholder.kickoff":
    "ex. Definir escopo, prazos e papéis sem zonas cinzentas.",
  "meeting_prep.field.objective_placeholder.partnership":
    "ex. Identificar se os interesses convergem para um piloto.",
  "meeting_prep.field.objective_placeholder.investor":
    "ex. Gerar interesse para uma próxima conversa com o sócio decisor.",
  "meeting_prep.field.objective_placeholder.other":
    "ex. Sair com uma decisão clara registrada por escrito.",
  "meeting_prep.field.objective_placeholder.default":
    "Descreva o que você quer alcançar em uma ou duas frases.",
  "meeting_prep.field.suggest_objectives": "Sugerir 3 objetivos",
  "meeting_prep.field.suggest_objectives_loading": "Gerando ideias…",
  "meeting_prep.field.suggest_objectives_use": "Usar este",
  "meeting_prep.field.suggest_objectives_dismiss": "Descartar sugestões",

  "meeting_prep.participants.add": "Adicionar participante",
  "meeting_prep.participants.remove": "Remover",
  "meeting_prep.participants.empty":
    "Nenhum participante ainda — adicione pelo menos um.",
  "meeting_prep.participant.name": "Nome",
  "meeting_prep.participant.name_placeholder": "ex. Sara Lima",
  "meeting_prep.participant.role": "Cargo",
  "meeting_prep.participant.role_placeholder": "ex. VP de Vendas",
  "meeting_prep.participant.organization": "Organização",
  "meeting_prep.participant.organization_placeholder": "ex. Acme S.A.",
  "meeting_prep.participant.relationship": "Relação",
  "meeting_prep.participant.profile_notes": "Perfil observado",
  "meeting_prep.participant.profile_notes_placeholder":
    "O que você já observou — estilo de comunicação, gatilhos, histórico.",

  "meeting_prep.relationship.subordinate": "Subordinado",
  "meeting_prep.relationship.peer": "Par",
  "meeting_prep.relationship.superior": "Superior",
  "meeting_prep.relationship.client": "Cliente",
  "meeting_prep.relationship.supplier": "Fornecedor",
  "meeting_prep.relationship.partner": "Parceiro",
  "meeting_prep.relationship.unknown": "Desconhecido",

  "meeting_prep.field.desired_outcome":
    "Como será sua reunião se ela for um sucesso?",
  "meeting_prep.field.desired_outcome_placeholder":
    "Descreva um estado de sucesso concreto — o que é verdade ao final que não era no início.",
  "meeting_prep.field.batna": "Resultado mínimo aceitável (BATNA)",
  "meeting_prep.field.batna_placeholder":
    "Qual seu plano B se o ideal não rolar?",

  "meeting_prep.field.history": "Histórico relevante",
  "meeting_prep.field.history_placeholder":
    "O que aconteceu antes que importa para esta reunião?",
  "meeting_prep.field.constraints": "Restrições",
  "meeting_prep.field.constraints_placeholder":
    "ex. confidencialidade, política interna, prazo, orçamento.",
  "meeting_prep.field.tone_tags": "Tom desejado",
  "meeting_prep.tone.formal": "Formal",
  "meeting_prep.tone.consultive": "Consultivo",
  "meeting_prep.tone.assertive": "Assertivo",
  "meeting_prep.tone.collaborative": "Colaborativo",
  "meeting_prep.tone.empathetic": "Empático",
  "meeting_prep.tone.direct": "Direto",

  "meeting_prep.validation.title": "Antes de continuar",
  "meeting_prep.validation.missing_title":
    "Adicione um título — ele orienta todas as outras etapas.",
  "meeting_prep.validation.missing_meeting_type":
    "Escolha um tipo para o sistema personalizar as sugestões.",
  "meeting_prep.validation.missing_objective":
    "Descreva o objetivo — sem ele o plano não foca.",
  "meeting_prep.validation.missing_participants":
    "Adicione pelo menos um participante.",
  "meeting_prep.validation.missing_desired_outcome":
    "Descreva como é o sucesso desta reunião.",
  "meeting_prep.validation.suggest_batna":
    "Definir uma BATNA dá pé ao role-play — você sabe quando recuar.",
  "meeting_prep.validation.suggest_tone":
    "Escolher um tom evita que o plano saia genérico.",
  "meeting_prep.validation.suggest_history":
    "Mesmo uma frase de histórico afia muito as sugestões de personas.",

  "meeting_prep.summary.title": "Brief consolidado",
  "meeting_prep.summary.placeholder":
    "Após validar, seu contexto vai aparecer resumido aqui. Você pode editar.",
  "meeting_prep.summary.regenerate": "Regerar",
  "meeting_prep.summary.regenerating": "Regerando…",

  "meeting_prep.actions.save_draft": "Salvar rascunho",
  "meeting_prep.actions.validate_continue": "Validar e continuar",
  "meeting_prep.actions.continue_anyway": "Continuar mesmo assim",
  "meeting_prep.actions.cancel": "Cancelar",
  "meeting_prep.actions.back_to_list": "Voltar para sessões",

  "meeting_prep.feedback.draft_saved": "Rascunho salvo",
  "meeting_prep.feedback.briefed":
    "Briefing pronto — especialistas liberados na próxima etapa.",
  "meeting_prep.feedback.session_deleted": "Sessão excluída",
  "error.meeting_prep.session_not_found": "Sessão não encontrada",
  "error.meeting_prep.suggest_failed":
    "Não consegui gerar sugestões — tente novamente.",
  "error.meeting_prep.validate_failed":
    "Falha na validação — tente novamente.",

  // Painel de especialistas — feature 02
  "meeting_prep.specialists.crumb": "Especialistas",
  "meeting_prep.specialists.title": "Painel de especialistas",
  "meeting_prep.specialists.description":
    "Ative os especialistas que vão ler sua reunião sob a lente de cada um. Selecione 1 a 5.",
  "meeting_prep.specialists.tab.archetype": "Arquétipos",
  "meeting_prep.specialists.tab.inspired": "Inspirados",
  "meeting_prep.specialists.tab.custom": "Custom",
  "meeting_prep.specialists.selected_count":
    "{count} de {max} selecionados",
  "meeting_prep.specialists.select_min":
    "Selecione pelo menos um especialista para convocar.",
  "meeting_prep.specialists.select_max":
    "Limite de 5 — remova um para adicionar outro.",
  "meeting_prep.specialists.convene": "Convocar painel",
  "meeting_prep.specialists.add_to_panel": "Adicionar ao painel",
  "meeting_prep.specialists.remove_from_panel": "Remover",
  "meeting_prep.specialists.next_step": "Avançar para o plano",
  "meeting_prep.specialists.streaming": "Gerando…",
  "meeting_prep.specialists.complete": "Pronto",
  "meeting_prep.specialists.queued": "Na fila",
  "meeting_prep.specialists.error": "Erro — tente regerar.",

  "meeting_prep.specialists.section.situation": "Leitura da situação",
  "meeting_prep.specialists.section.priorities": "Priorizar",
  "meeting_prep.specialists.section.avoid": "Evitar",
  "meeting_prep.specialists.section.question": "Pergunta para você",
  "meeting_prep.specialists.section.anchor": "Frase-âncora",

  "meeting_prep.specialists.action.regenerate": "Regerar",
  "meeting_prep.specialists.action.pin": "Pin para o plano",
  "meeting_prep.specialists.action.unpin": "Despinear",
  "meeting_prep.specialists.action.remove": "Remover do painel",
  "meeting_prep.specialists.action.add_custom": "Adicionar custom",

  "meeting_prep.specialists.custom.title": "Especialista custom",
  "meeting_prep.specialists.custom.description":
    "Descreva o papel em 1-2 frases. Output fica só nessa sessão e não é salvo na biblioteca.",
  "meeting_prep.specialists.custom.placeholder":
    "ex. Uma diretora sênior de marketing B2B cética com plays de alcance amplo.",

  "meeting_prep.specialists.inspired.toggle":
    "Personas inspiradas (configuração do workspace)",
  "meeting_prep.specialists.inspired.toggle_help":
    "Desative para esconder modelos de raciocínio inspirados em figuras públicas.",
  "meeting_prep.specialists.inspired.disabled_body":
    "Este workspace tem a biblioteca de personas inspiradas desativada. Um admin pode reativar nas configurações.",
  "meeting_prep.specialists.inspired.disclaimer":
    "Interpretação por IA dos princípios públicos atribuídos a {name}. Não são declarações reais de {name}.",
  "meeting_prep.specialists.inspired.style_prefix": "Estilo de {name}",
  "meeting_prep.specialists.inspired.sources": "Fontes públicas",
  "meeting_prep.specialists.inspired.principles": "Princípios de raciocínio",
  "meeting_prep.specialists.inspired.show_card": "Ver detalhes",
  "meeting_prep.specialists.inspired.hide_card": "Esconder detalhes",

  "meeting_prep.specialists.empty_panel.title":
    "Nenhum especialista ativado ainda",
  "meeting_prep.specialists.empty_panel.body":
    "Selecione alguns na galeria e convoque o painel.",

  "meeting_prep.feedback.specialists_ready":
    "Painel pronto — revise e pin o que mais importa para o plano.",

  // Plano de preparação — feature 03
  "meeting_prep.plan.crumb": "Plano",
  "meeting_prep.plan.title": "Plano de preparação",
  "meeting_prep.plan.description":
    "Brief em uma tela só, pra ler 30 minutos antes da reunião. Streamed e editável por seção.",
  "meeting_prep.plan.empty.title": "Nenhum plano ainda",
  "meeting_prep.plan.empty.body":
    "Gere o plano a partir do seu contexto e dos especialistas ativados. Os pinados têm peso extra.",
  "meeting_prep.plan.action.generate": "Gerar plano",
  "meeting_prep.plan.action.regenerate_all": "Regerar tudo",
  "meeting_prep.plan.action.regenerating": "Gerando…",
  "meeting_prep.plan.action.regenerate_section": "Regerar seção",
  "meeting_prep.plan.action.edit": "Editar",
  "meeting_prep.plan.action.save": "Salvar",
  "meeting_prep.plan.action.cancel": "Cancelar",
  "meeting_prep.plan.action.copy_md": "Copiar como Markdown",
  "meeting_prep.plan.action.print": "Imprimir / PDF",
  "meeting_prep.plan.action.continue": "Avançar para o role-play",

  "meeting_prep.plan.toc.title": "Seções",
  "meeting_prep.plan.stale.title": "Plano desatualizado",
  "meeting_prep.plan.stale.body":
    "O contexto ou os pins mudaram depois deste plano. Regenere para atualizar.",
  "meeting_prep.plan.stale.dismiss": "Dispensar",
  "meeting_prep.plan.generated_at": "Gerado {when}",
  "meeting_prep.plan.edited_at": "Editado {when}",

  "meeting_prep.plan.section.executive_summary": "Resumo executivo",
  "meeting_prep.plan.section.objectives": "Os 3 objetivos",
  "meeting_prep.plan.section.counterpart_motives": "O que o outro lado provavelmente quer",
  "meeting_prep.plan.section.risks": "Riscos",
  "meeting_prep.plan.section.opportunities": "Oportunidades",
  "meeting_prep.plan.section.anticipated_questions": "Perguntas que vão te fazer",
  "meeting_prep.plan.section.my_questions": "Perguntas que VOCÊ deve fazer",
  "meeting_prep.plan.section.objections": "Objeções esperadas",
  "meeting_prep.plan.section.anchor_phrases": "Frases-âncora",
  "meeting_prep.plan.section.plan_b": "Plano B",
  "meeting_prep.plan.section.materials_checklist": "Materiais a levar",

  "meeting_prep.plan.label.rationale": "Por quê",
  "meeting_prep.plan.label.mitigation": "Mitigação",
  "meeting_prep.plan.label.suggested_answer": "Resposta sugerida",
  "meeting_prep.plan.label.reveals": "O que revela",
  "meeting_prep.plan.label.response": "Como responder",
  "meeting_prep.plan.label.opening": "Abertura",
  "meeting_prep.plan.label.pivot": "Pivot",
  "meeting_prep.plan.label.closing": "Fechamento",
  "meeting_prep.plan.placeholder.text":
    "Escreva um parágrafo. Salva no clique do botão abaixo — auto-save no blur.",

  "meeting_prep.feedback.plan_ready":
    "Plano pronto — leia de cima a baixo antes da reunião.",
  "meeting_prep.feedback.plan_section_regenerated": "Seção regerada.",
  "meeting_prep.feedback.plan_md_copied":
    "Markdown copiado para a área de transferência.",

  // ─── Organization members page ───────────────────────────────────────────────
  "organization.members.title": "Membros",
  "organization.members.description":
    "Gerencie os membros da organização e convites pendentes.",
  "organization.members.invite_button": "Convidar membro",
  "organization.members.active_section": "Membros ativos ({count})",
  "organization.members.col_name": "Nome",
  "organization.members.col_email": "E-mail",
  "organization.members.col_role": "Função",
  "organization.members.col_joined": "Entrou em",
  "organization.members.empty_active": "Nenhum membro ativo.",
  "organization.members.pending_section": "Convites pendentes ({count})",
  "organization.members.col_expires": "Expira em",
  "organization.members.col_actions": "Ações",
  "organization.members.empty_pending": "Nenhum convite pendente.",
  "organization.members.invite_dialog_title": "Convidar novo membro",
  "organization.members.invite_dialog_description":
    "Envie um convite por e-mail para adicionar alguém à organização.",
  "organization.members.invite_error_fallback": "Falha ao enviar convite",
  "organization.members.invite_already_exists":
    "Já existe um convite pendente para este e-mail",
  "organization.members.network_error": "Erro de rede. Tente novamente.",
  "organization.members.invite_field_email": "E-mail",
  "organization.members.invite_field_email_placeholder": "nome@empresa.com",
  "organization.members.invite_field_role": "Função",
  "organization.members.role_member": "Membro",
  "organization.members.role_admin": "Admin",
  "organization.members.role_owner": "Owner",
  "organization.members.custom_role.add": "Adicionar papel",
  "organization.members.custom_role.remove_action": "Remover papel",
  "organization.members.custom_role.assigned": "Papel atribuído",
  "organization.members.custom_role.removed": "Papel removido",
  "organization.members.custom_role.assign_error": "Não foi possível atribuir o papel",
  "organization.members.custom_role.remove_error": "Não foi possível remover o papel",
  "organization.members.role_updated": "Papel atualizado.",
  "organization.members.role_update_error":
    "Não foi possível atualizar o papel. Tente novamente.",
  "organization.members.last_owner_error":
    "A organização precisa manter ao menos um owner.",
  "organization.members.permission_error":
    "Você não tem permissão para fazer esta alteração.",
  "organization.members.confirm_promote_owner":
    "Promover este membro a Owner? Owners têm controle total da organização.",
  "organization.members.confirm_demote_owner":
    "Alterar o papel deste owner? Ele perderá os privilégios de owner.",
  "organization.members.cancel": "Cancelar",
  "organization.members.sending": "Enviando...",
  "organization.members.send_invite": "Enviar convite",

  // ─── Invitation accept form ───────────────────────────────────────────────────
  "invitations.accept.heading": "Você foi convidado",
  "invitations.accept.subheading": "para",
  "invitations.accept.error_password_mismatch": "As senhas não coincidem",
  "invitations.accept.error_fallback": "Falha ao aceitar convite",
  "invitations.accept.logged_as": "Logado como",
  "invitations.accept.accepting": "Aceitando...",
  "invitations.accept.accept_button": "Aceitar convite",
  "invitations.accept.login_prompt": "Faça login com",
  "invitations.accept.login_prompt_suffix": "para aceitar este convite.",
  "invitations.accept.login_link": "Fazer login",
  "invitations.accept.field_email": "E-mail",
  "invitations.accept.field_password": "Senha",
  "invitations.accept.password_placeholder": "Mínimo 8 caracteres",
  "invitations.accept.hide_password": "Ocultar",
  "invitations.accept.show_password": "Mostrar",
  "invitations.accept.field_confirm_password": "Confirmar senha",
  "invitations.accept.confirm_password_placeholder": "Repita a senha",
  "invitations.accept.creating": "Criando conta...",
  "invitations.accept.create_and_accept": "Criar conta e aceitar",
  "invitations.accept.redirecting": "Redirecionando para",

  // ─── Invitation status views ──────────────────────────────────────────────────
  "invitations.view.not_found_title": "Convite não encontrado",
  "invitations.view.not_found_body":
    "Este link de convite não é válido ou já foi removido.",
  "invitations.view.go_home": "Ir para a home",
  "invitations.view.expired_title": "Convite expirado",
  "invitations.view.expired_body":
    "Este convite expirou. Solicite um novo convite ao administrador da organização.",
  "invitations.view.unavailable_title": "Convite indisponível",
  "invitations.view.already_accepted": "Este convite já foi aceito.",
  "invitations.view.declined": "Este convite foi recusado.",
  "invitations.view.already_expired": "Este convite expirou.",
} as const;

export type MessageKey = keyof typeof messages;
