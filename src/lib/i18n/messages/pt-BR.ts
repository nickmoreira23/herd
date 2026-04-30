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
  "financials.metrics.revenue.arr": "ARR",

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
  "financials.summary.key_metrics.arr": "ARR",
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
  "financials.models.column.arr": "ARR",
  "financials.models.column.net_margin": "Margem Líquida",
  "financials.models.column.gross_margin": "Margem Bruta",
  "financials.models.column.new_subs_per_mo": "Novos Subs/Mês",
  "financials.models.column.ltv_cac": "LTV:CAC",
  "financials.models.column.breakeven": "Breakeven",
  "financials.models.column.created": "Criado",

  // Projection spreadsheet
  "financials.projection.empty": "Nenhum resultado ainda",
  "financials.projection.tier_indent": "  └ {tier}",
  "financials.projection.section.subscribers": "Assinantes",
  "financials.projection.section.revenue": "Receita",
  "financials.projection.section.cogs": "Custo dos Produtos",
  "financials.projection.section.opex": "Despesas Operacionais",
  "financials.projection.section.bottom_line": "Resultado",
  "financials.projection.section.profit_split": "Divisão de Lucro",
  "financials.projection.row.gross_new_sales": "Vendas Brutas Novas",
  "financials.projection.row.chargebacks": "Chargebacks",
  "financials.projection.row.net_new_subs": "Novos Subs Líquidos",
  "financials.projection.row.lost_to_churn": "Perdidos para Churn",
  "financials.projection.row.total_active": "Total Ativos",
  "financials.projection.row.subscription_revenue": "Receita de Assinatura",
  "financials.projection.row.monthly_billing": "  └ Cobrança Mensal",
  "financials.projection.row.quarterly_billing": "  └ Cobrança Trimestral",
  "financials.projection.row.annual_billing": "  └ Cobrança Anual",
  "financials.projection.row.product_fulfillment": "Produto & Fulfillment",
  "financials.projection.row.gross_profit": "Lucro Bruto",
  "financials.projection.row.gross_margin_pct": "Margem Bruta %",
  "financials.projection.row.commissions": "Comissões",
  "financials.projection.row.overhead": "Overhead",
  "financials.projection.row.total_opex": "OpEx Total",
  "financials.projection.row.net_profit": "Lucro Líquido",
  "financials.projection.row.cumulative_profit": "Lucro Acumulado",
  "financials.projection.row.net_margin_pct": "Margem Líquida %",
  "financials.projection.column.total_avg": "Total/Méd",

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
} as const;

export type MessageKey = keyof typeof messages;
