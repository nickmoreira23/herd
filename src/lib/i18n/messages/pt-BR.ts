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
  "nav.sidebar.network": "Rede",
  "nav.sidebar.marketplace": "Marketplace",
  "nav.sidebar.ledger": "Ledger",
  "nav.sidebar.agents": "Agentes",
  "nav.sidebar.tools": "Ferramentas",
  "nav.sidebar.blocks": "Blocos",
  "nav.sidebar.integrations": "Integrações",

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
    "Como assinantes pagam. Planos trimestral/anual têm desconto, então o mix afeta receita média e cálculo de residual.",
  "commissions.simulator.input.billing_monthly": "Mensal %",
  "commissions.simulator.input.billing_quarterly": "Trimestral %",
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
} as const;

export type MessageKey = keyof typeof messages;
