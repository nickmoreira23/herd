import type { MessageKey } from "./pt-BR";

export const messages: Record<MessageKey, string> = {
  // Block category labels
  "categories.commerce": "Commerce",
  "categories.communication": "Communication",
  "categories.schedule": "Schedule",
  "categories.automation": "Automation",
  "categories.product": "Product",
  "categories.marketing": "Marketing",
  "categories.sales": "Sales",
  "categories.finance": "Finance",
  "categories.legal": "Legal",
  "categories.media": "Media",
  "categories.data": "Data",

  // Block names
  "blocks.products": "Products",
  "blocks.agents": "Agents",
  "blocks.partners": "Perks",
  "blocks.perks": "Benefits",
  "blocks.community": "Community",
  "blocks.pages": "Pages",
  "blocks.meetings": "Meetings",
  "blocks.events": "Events",
  "blocks.tasks": "Tasks",
  "blocks.knowledge": "Knowledge",
  "blocks.documents": "Documents",
  "blocks.images": "Images",
  "blocks.videos": "Videos",
  "blocks.audios": "Audio",
  "blocks.tables": "Tables",
  "blocks.forms": "Forms",
  "blocks.links": "Links",
  "blocks.feeds": "Feeds",
  "blocks.apps": "Apps",
  "blocks.messages": "Messages",
  "blocks.notes": "Notes",
  "blocks.locations": "Locations",
  "blocks.feedbacks": "Feedback",
  "blocks.services": "Services",
  "blocks.contacts": "Contacts",
  "blocks.companies": "Companies",
  "blocks.deals": "Deals",
  "blocks.campaigns": "Campaigns",
  "blocks.experiences": "Experiences",
  "blocks.subscriptions": "Subscriptions",
  "blocks.routines": "Routines",

  // Experiences block
  "experiences.title": "Experiences",
  "experiences.subtitle":
    "Curated offerings — workshops, retreats, immersive events.",
  "experiences.create": "New experience",
  "experiences.empty.title": "No experiences yet",
  "experiences.empty.body": 'Create the first one with "New experience".',
  "experiences.fields.name": "Name",
  "experiences.fields.headline": "Headline",
  "experiences.fields.description": "Description",
  "experiences.fields.format": "Format",
  "experiences.fields.status": "Status",
  "experiences.fields.location": "Location",
  "experiences.fields.startDate": "Start",
  "experiences.fields.endDate": "End",
  "experiences.fields.duration": "Duration (min)",
  "experiences.fields.capacity": "Capacity",
  "experiences.fields.price": "Price",
  "experiences.fields.currency": "Currency",
  "experiences.fields.coverImage": "Cover image",
  "experiences.fields.tags": "Tags",
  "experiences.fields.host": "Host (UUID)",
  "experiences.format.IN_PERSON": "In-person",
  "experiences.format.ONLINE": "Online",
  "experiences.format.HYBRID": "Hybrid",
  "experiences.format.SELF_PACED": "Self-paced",
  "experiences.status.DRAFT": "Draft",
  "experiences.status.SCHEDULED": "Scheduled",
  "experiences.status.OPEN": "Open",
  "experiences.status.SOLD_OUT": "Sold out",
  "experiences.status.IN_PROGRESS": "In progress",
  "experiences.status.COMPLETED": "Completed",
  "experiences.status.CANCELLED": "Cancelled",
  "experiences.filter.allStatus": "All statuses",
  "experiences.filter.allFormats": "All formats",
  "experiences.search.placeholder": "Search name, location…",

  // Routines block
  "routines.title": "Routines",
  "routines.subtitle":
    "Automations executed by agents — scheduled, manual, or event-triggered.",
  "routines.create": "New routine",
  "routines.empty.title": "No routines yet",
  "routines.empty.body": 'Create the first one with "New routine".',
  "routines.search.placeholder": "Search name, agent, prompt…",
  "routines.filter.allStatus": "All statuses",
  "routines.filter.allTriggers": "All triggers",
  "routines.fields.name": "Name",
  "routines.fields.description": "Description",
  "routines.fields.prompt": "Prompt",
  "routines.fields.promptHint":
    "Text sent to the agent. Use {{variable}} for placeholders.",
  "routines.fields.agent": "Agent",
  "routines.fields.trigger": "Trigger",
  "routines.fields.cron": "Cron",
  "routines.fields.timezone": "Timezone",
  "routines.fields.eventBlock": "Event block",
  "routines.fields.eventType": "Event type",
  "routines.fields.inputs": "Default inputs (JSON)",
  "routines.fields.outputFormat": "Output format",
  "routines.fields.tags": "Tags",
  "routines.fields.status": "Status & agent",
  "routines.trigger.MANUAL": "Manual",
  "routines.trigger.SCHEDULE": "Scheduled",
  "routines.trigger.EVENT": "Event",
  "routines.status.DRAFT": "Draft",
  "routines.status.ACTIVE": "Active",
  "routines.status.PAUSED": "Paused",
  "routines.status.ARCHIVED": "Archived",
  "routines.runStatus.QUEUED": "Queued",
  "routines.runStatus.RUNNING": "Running",
  "routines.runStatus.SUCCESS": "Success",
  "routines.runStatus.FAILED": "Failed",
  "routines.runStatus.CANCELLED": "Cancelled",
  "routines.runNow": "Run now",
  "routines.pause": "Pause",
  "routines.resume": "Resume",
  "routines.lastRunAt": "Last run",
  "routines.nextRunAt": "Next",
  "routines.runCount": "{count} runs",
  "routines.run.title": "Run details",
  "routines.run.history": "Runs",
  "routines.run.empty": "No runs yet.",
  "routines.run.trigger": "Trigger",
  "routines.run.startedAt": "Started",
  "routines.run.completedAt": "Completed",
  "routines.run.duration": "Duration",
  "routines.run.tokens": "Tokens",
  "routines.run.input": "Input",
  "routines.run.output": "Output",
  "routines.run.error": "Error",
  "routines.run.toastSuccess": "Routine ran successfully",
  "routines.run.toastFailed": "Routine failed — see run details",
  "routines.wizard.title": "New routine",
  "routines.wizard.next": "Next",
  "routines.wizard.back": "Back",
  "routines.wizard.activate": "Activate now",
  "routines.wizard.saveDraft": "Save as draft",
  "routines.wizard.steps.identity": "Identity",
  "routines.wizard.steps.agent": "Agent",
  "routines.wizard.steps.trigger": "Trigger",
  "routines.wizard.steps.inputs": "Inputs",
  "routines.wizard.steps.prompt": "Prompt",
  "routines.wizard.steps.review": "Review",
  "routines.wizard.identity.namePlaceholder": "e.g. Daily deals summary",
  "routines.wizard.identity.descriptionPlaceholder":
    "What this routine does and why it exists.",
  "routines.wizard.agent.help":
    "Pick the agent that will run this routine. Use the filters to find the right one.",
  "routines.wizard.trigger.manualHelp":
    'Runs when someone clicks "Run now".',
  "routines.wizard.trigger.scheduleHelp":
    "Runs on a recurring schedule defined by a cron expression.",
  "routines.wizard.trigger.eventHelp":
    "Runs when something happens in another block of the system.",
  "routines.wizard.trigger.manualNote":
    'No automatic trigger. You can run this routine at any time using "Run now".',
  "routines.wizard.inputs.help":
    "Define default inputs available to the prompt as {{variable}}. You can override them at run time.",
  "routines.wizard.review.identity": "Identity",
  "routines.wizard.review.agent": "Agent",
  "routines.wizard.review.trigger": "Trigger",
  "routines.wizard.review.inputs": "Default inputs",
  "routines.wizard.review.prompt": "Prompt",
  "routines.wizard.steps.flow": "Flow",
  "routines.wizard.identity.subtitle":
    "How this routine should be identified across your organization.",
  "routines.wizard.trigger.subtitle": "When this routine should run.",
  "routines.wizard.flow.subtitle":
    "Design the execution flow. Click a step to set its agent, prompt, and output format. Use the + button under any step to add another right after it.",
  "routines.wizard.flow.invalidWarning":
    "{count} step(s) still missing an agent or prompt — fill them in to continue.",
  "routines.wizard.review.subtitle":
    "Double-check everything before saving. You can jump back to any step from the header.",
  "routines.wizard.review.flow": "Flow",
  "routines.wizard.review.stepCount": "Total steps",
  "routines.detail.flow": "Flow",
  "routines.detail.flowEditHint":
    "Click a step to edit; drag to reposition; use + to add steps.",
  "routines.detail.flowTraceHint":
    "Viewing a past run: green steps succeeded, red steps failed.",
  "routines.clearTrace": "Exit run view",
  "routines.tooltip.name":
    "How this routine shows up in lists and logs. Be descriptive.",
  "routines.tooltip.description":
    "Spell out what this routine is for so future readers (you or teammates) get it.",
  "routines.tooltip.tags":
    "Labels to group related routines. Useful for search and filtering.",
  "routines.tooltip.triggerManual":
    'You click "Run now" every time. Good for ad-hoc automations.',
  "routines.tooltip.triggerSchedule":
    "Runs on a schedule (e.g. every Monday at 9 AM).",
  "routines.tooltip.triggerEvent":
    'Runs when something happens in another block (e.g. "deal flips to WON").',
  "routines.tooltip.trigger": "What kicks the routine off.",
  "routines.tooltip.flow":
    "The ordered sequence the routine executes. Each step is one agent answering one prompt; a step’s output can flow into the next.",

  // Common UI
  "common.back": "Back",
  "common.save": "Save",
  "common.savedAt": "Saved {time}",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.create": "Create",
  "common.confirmDelete": 'Delete "{name}"?',
  "common.tags.add": "Add tag…",
  "common.notes": "Notes",
  "common.view.kanban": "Kanban view",
  "common.view.list": "List view",
  "common.view.grid": "Grid view",

  // ============================================================
  // Ledger - Phase 1.5.4
  // ============================================================

  // Sub-panel
  "ledger.subpanel.chart_of_accounts": "Chart of Accounts",
  "ledger.subpanel.journal_entries": "Journal Entries",

  // Page titles & headers
  "ledger.accounts.list.title": "Chart of Accounts",
  "ledger.accounts.list.description":
    "View all accounts and their current balances.",
  "ledger.accounts.list.empty_state": "No accounts found.",
  "ledger.accounts.list.search_placeholder": "Search by code or name",

  // Accounts list columns
  "ledger.accounts.column.code": "Code",
  "ledger.accounts.column.name": "Name",
  "ledger.accounts.column.type": "Type",
  "ledger.accounts.column.currency": "Currency",
  "ledger.accounts.column.balance": "Balance",

  // Account types (singular)
  "ledger.account_type.asset": "Asset",
  "ledger.account_type.liability": "Liability",
  "ledger.account_type.equity": "Equity",
  "ledger.account_type.revenue": "Revenue",
  "ledger.account_type.expense": "Expense",

  // Account detail page
  "ledger.account.detail.balance_label": "Current balance",
  "ledger.account.detail.total_debits": "Total debits",
  "ledger.account.detail.total_credits": "Total credits",
  "ledger.account.detail.statement_title": "Statement",
  "ledger.account.detail.statement_with_count": "Statement — {count} lines",
  "ledger.account.detail.statement_with_count_one": "Statement — 1 line",
  "ledger.account.detail.load_more": "Load more",
  "ledger.account.detail.no_movements": "No movements recorded.",
  "ledger.account.detail.statement_empty":
    "This account has no entries yet.",

  // Statement table columns
  "ledger.statement.column.date": "Date",
  "ledger.statement.column.description": "Description",
  "ledger.statement.column.debit": "Debit",
  "ledger.statement.column.credit": "Credit",
  "ledger.statement.column.balance": "Balance",
  "ledger.statement.column.entry": "Entry",
  "ledger.statement.column.source": "Source",
  "ledger.statement.column.direction": "Direction",
  "ledger.statement.column.amount": "Amount",
  "ledger.statement.action.view": "View",
  "ledger.statement.loading": "Loading…",
  "ledger.statement.empty": "No movements in this account.",
  "ledger.statement.load_failed": "Failed to load more lines.",

  // Entries list page
  "ledger.entries.list.title": "Journal Entries",
  "ledger.entries.list.description":
    "Complete history of all financial movements.",
  "ledger.entries.list.empty_state": "No entries found.",

  // Entry detail page
  "ledger.entry.detail.title": "Entry Details",
  "ledger.entry.detail.posted_at": "Date",
  "ledger.entry.detail.description": "Description",
  "ledger.entry.detail.source": "Source",
  "ledger.entry.detail.lines_title": "Lines",
  "ledger.entry.detail.reversal_badge": "Reversal",
  "ledger.entry.detail.reversed_badge": "Reversed",
  "ledger.entry.detail.reversed_by": "Reversed by",
  "ledger.entry.detail.reverses": "Reverses",
  "ledger.entry.detail.section_details": "Details",
  "ledger.entry.detail.source_id": "Source ID",
  "ledger.entry.detail.created_at": "Created at",
  "ledger.entry.detail.idempotency_key": "Idempotency key",
  "ledger.entry.detail.metadata": "Metadata",
  "ledger.entry.detail.lines_with_count": "Lines ({count})",
  "ledger.entry.detail.line.account": "Account",
  "ledger.entry.detail.line.type": "Type",
  "ledger.entry.detail.line.direction": "Direction",
  "ledger.entry.detail.line.amount": "Amount",

  // Source kinds (badges) — matches JournalEntrySourceKind enum
  "ledger.source_kind.transaction": "Transaction",
  "ledger.source_kind.commission": "Commission",
  "ledger.source_kind.refund": "Refund",
  "ledger.source_kind.manual_adjustment": "Manual adjustment",
  "ledger.source_kind.seed": "Initial seed",
  "ledger.source_kind.reversal": "Reversal",

  // Common errors
  "error.common.unknown": "An unexpected error occurred. Please try again.",

  // Ledger errors
  "error.ledger.account_not_found": "Account {accountCode} not found.",
  "error.ledger.account_archived": "Account {accountCode} is archived.",
  "error.ledger.invalid_currency": "Invalid currency: {received}.",
  "error.ledger.unsupported_currency": "Unsupported currency: {received}.",
  "error.ledger.currency_mismatch":
    "Currency mismatch on account {accountCode}: expected {accountCurrency}, got {lineCurrency}.",
  "error.ledger.insufficient_lines": "Entry must have at least two lines.",
  "error.ledger.non_positive_amount": "Amounts must be greater than zero.",
  "error.ledger.unbalanced_entry": "Unbalanced entry.",
  "error.ledger.invalid_source_id": "Invalid source identifier: {received}.",
  "error.ledger.invalid_source_kind": "Invalid source kind: {received}.",
  "error.ledger.idempotency_conflict":
    "Idempotency conflict: key {idempotencyKey} was already used with different payload.",
  "error.ledger.entry_not_found": "Entry {entryId} not found.",
  "error.ledger.invalid_cursor": "Invalid pagination cursor.",
  "error.ledger.statement_limit_exceeded":
    "Statement limit exceeded (max {max}).",
  "error.ledger.cannot_reverse_reversal": "Cannot reverse a reversal.",
  "error.ledger.entry_already_reversed":
    "Entry {originalEntryId} has already been reversed.",
  "error.ledger.missing_reversal_reason": "Reversal reason is required.",
  "error.ledger.error": "Ledger error.",

  // Domain events errors
  "error.domain_events.idempotency_conflict":
    "Idempotency conflict while recording event.",
  "error.domain_events.handler_execution": "Error processing event.",
  "error.domain_events.error": "Domain events error.",

  // Money errors
  "error.money.currency_mismatch":
    "Operation between values in different currencies.",
  "error.money.invalid": "Invalid monetary value.",

  // ============================================================
  // Common (shared across ≥3 features) - Phase 1.5.5
  // ============================================================

  // Actions
  "common.actions.save": "Save",
  "common.actions.cancel": "Cancel",
  "common.actions.delete": "Delete",
  "common.actions.edit": "Edit",
  "common.actions.create": "Create",
  "common.actions.close": "Close",
  "common.actions.confirm": "Confirm",
  "common.actions.back": "Back",
  "common.actions.next": "Next",
  "common.actions.submit": "Submit",
  "common.actions.search": "Search",
  "common.actions.filter": "Filter",
  "common.actions.sort": "Sort",
  "common.actions.export": "Export",
  "common.actions.import": "Import",
  "common.actions.reset": "Reset",
  "common.actions.apply": "Apply",
  "common.actions.refresh": "Refresh",
  "common.actions.try_again": "Try again",
  "common.actions.load_more": "Load more",
  "common.actions.view_details": "View details",

  // States
  "common.states.loading": "Loading…",
  "common.states.error": "Failed to load",
  "common.states.empty": "No results",
  "common.states.success": "Done",
  "common.states.saving": "Saving…",
  "common.states.deleting": "Deleting…",
  "common.states.processing": "Processing…",
  "common.states.no_results": "No results found",
  "common.states.no_results_for_query": "No results for \"{query}\"",

  // Placeholders
  "common.placeholders.search": "Search…",
  "common.placeholders.select": "Select…",
  "common.placeholders.type_to_filter": "Type to filter",

  // Confirmations
  "common.confirmations.are_you_sure": "Are you sure?",
  "common.confirmations.this_cannot_be_undone":
    "This action cannot be undone.",
  "common.confirmations.type_to_confirm":
    "Type \"{value}\" to confirm",

  // Feedback
  "common.feedback.saved_successfully": "Saved successfully",
  "common.feedback.deleted_successfully": "Deleted successfully",
  "common.feedback.created_successfully": "Created successfully",
  "common.feedback.updated_successfully": "Updated successfully",
  "common.feedback.error_occurred": "An error occurred",

  // Units (cravado em 1.5.6a-bis)
  "common.units.months_one": "{count} month",
  "common.units.months_other": "{count} months",
  "common.units.models_one": "{count} model",
  "common.units.models_other": "{count} models",
  "common.units.scenarios_one": "{count} scenario",
  "common.units.scenarios_other": "{count} scenarios",
  "common.units.of_total": "{current} of {total}",

  // Time
  "common.time.today": "Today",
  "common.time.yesterday": "Yesterday",
  "common.time.this_week": "This week",
  "common.time.this_month": "This month",
  "common.time.last_updated": "Last updated",
  "common.time.never": "Never",

  // ============================================================
  // Navigation - Phase 1.5.5
  // ============================================================

  "nav.sidebar.dashboard": "Dashboard",
  "nav.sidebar.chat": "Chat",
  "nav.sidebar.organization": "Organization",
  "nav.sidebar.knowledge": "Knowledge",
  "nav.sidebar.network": "Network",
  "nav.sidebar.marketplace": "Marketplace",
  "nav.sidebar.ledger": "Ledger",
  "nav.sidebar.agents": "Agents",
  "nav.sidebar.tools": "Tools",
  "nav.sidebar.blocks": "Blocks",
  "nav.sidebar.integrations": "Integrations",

  "nav.subpanel.collapse": "Collapse panel",
  "nav.subpanel.expand": "Expand panel",

  "nav.breadcrumb.home": "Home",
  "nav.breadcrumb.new": "New",
  "nav.breadcrumb.settings": "Settings",

  // ============================================================
  // Shell - Phase 1.5.5
  // ============================================================

  "shell.sidebar.pin": "Pin sidebar",
  "shell.sidebar.unpin": "Unpin sidebar",
  "shell.sidebar.administrator": "Administrator",

  "shell.profile.view_profile": "View profile",
  "shell.profile.settings": "Settings",
  "shell.profile.appearance": "Appearance",
  "shell.profile.theme.light": "Light",
  "shell.profile.theme.dark": "Dark",
  "shell.profile.language": "Language",
  "shell.profile.logout": "Sign out",

  "shell.error.something_went_wrong": "Something went wrong",
  "shell.error.try_again": "Try again",
  "shell.error.go_home": "Back to home",
  "shell.error.go_back": "Go back",
  "shell.error.page_not_found": "Page not found",
  "shell.error.page_not_found_description":
    "The page you are looking for does not exist or has been moved.",
  "shell.error.temporary_issue":
    "Something went wrong. This is usually a temporary issue.",

  // ============================================================
  // Commissions - Phase 1.5.6a
  // ============================================================

  "commissions.page.title": "Commission Structures",
  "commissions.page.description":
    "Define how the D2D sales team gets paid and see the margin impact.",

  "commissions.tabs.structures": "Structures",
  "commissions.tabs.simulator": "Simulator",

  "commissions.structures.banner":
    "Commission structures define how your sales reps get paid — one-time signup bonuses plus ongoing monthly residuals. Only one can be active at a time.",
  "commissions.structures.new_button": "New Structure",
  "commissions.structures.empty_title": "No commission structures yet",
  "commissions.structures.empty_description":
    "Create your first structure to define how your D2D sales team earns bonuses and residual income.",
  "commissions.structures.active_badge": "Active",
  "commissions.structures.stat_residual": "Residual",
  "commissions.structures.stat_clawback": "Clawback",
  "commissions.structures.stat_clawback_days": "{days} days",
  "commissions.structures.stat_tiers": "Tiers",
  "commissions.structures.stat_tiers_configured": "{count} configured",
  "commissions.structures.accelerator_label": "{value}x accelerator",
  "commissions.structures.action_edit": "Edit",
  "commissions.structures.action_activate": "Activate",
  "commissions.structures.action_deactivate": "Deactivate",
  "commissions.structures.action_delete": "Delete",
  "commissions.structures.confirm_delete": 'Delete "{name}"?',

  "commissions.editor.title_create": "New Commission Structure",
  "commissions.editor.title_edit": "Edit Commission Structure",
  "commissions.editor.subtitle_create":
    "Set up a new compensation plan for your D2D sales team.",
  "commissions.editor.subtitle_edit":
    "Update how your sales reps are compensated under this plan.",
  "commissions.editor.field.name": "Structure Name",
  "commissions.editor.field.name_placeholder":
    'e.g. "Launch 2026" or "Summer Push"',
  "commissions.editor.field.active": "Active",
  "commissions.editor.section.residual_clawback": "Residual & Clawback",
  "commissions.editor.field.residual_percent": "Residual (%)",
  "commissions.editor.field.residual_help":
    "% of each subscriber's monthly payment that goes to the rep who signed them up, every month.",
  "commissions.editor.field.clawback_window": "Clawback Window (days)",
  "commissions.editor.field.clawback_help":
    "If a subscriber cancels within this window, the rep's signup bonus is taken back. Standard: 30-90 days.",
  "commissions.editor.field.notes": "Notes (optional)",
  "commissions.editor.field.notes_placeholder":
    "Internal notes about this commission plan…",
  "commissions.editor.section.tier_bonuses": "Per-Tier Signup Bonuses",
  "commissions.editor.section.tier_bonuses_help":
    "One-time cash bonus per new subscriber. Higher tiers = higher bonuses to incentivize premium sales.",
  "commissions.editor.field.bonus": "Bonus ($)",
  "commissions.editor.field.threshold": "Accel. Threshold",
  "commissions.editor.field.multiplier": "Multiplier",
  "commissions.editor.accelerator_help":
    "Accelerator: when a rep exceeds the threshold % of quota, their bonus is multiplied (e.g. 1.5x = 50% more).",
  "commissions.editor.action_save_create": "Create Structure",
  "commissions.editor.action_save_edit": "Save Changes",

  "commissions.simulator.no_active_title": "No active commission structure",
  "commissions.simulator.no_active_description":
    "Switch to the Structures tab and activate one first. The simulator uses the active structure's rates to calculate results.",
  "commissions.simulator.intro":
    "Model different scenarios to see how changes affect your total commission costs.",
  "commissions.simulator.input.sales_team_title": "Sales Team",
  "commissions.simulator.input.sales_team_tooltip":
    "How many door-to-door reps you have and their average monthly sales output.",
  "commissions.simulator.input.reps": "Reps",
  "commissions.simulator.input.sales_per_rep": "Sales/Rep/Mo",
  "commissions.simulator.input.new_subs_per_month":
    "{count} new subscribers/month",
  "commissions.simulator.input.subs_title": "Existing Subscribers",
  "commissions.simulator.input.subs_tooltip":
    "Your current active subscriber count. This drives the residual commission calculation — the ongoing monthly % you pay reps on retained subscribers.",
  "commissions.simulator.input.subs_total": "Total Active",
  "commissions.simulator.input.accelerator_title": "Accelerator",
  "commissions.simulator.input.accelerator_tooltip":
    "Top reps who exceed their sales quota earn a bonus multiplier on their signup commission. Set what % of your team you expect to hit this level.",
  "commissions.simulator.input.accelerator_label":
    "% Reps Exceeding Quota",
  "commissions.simulator.input.billing_title": "Billing Mix",
  "commissions.simulator.input.billing_tooltip":
    "How subscribers pay. Quarterly/annual plans are discounted, so this mix affects average revenue per subscriber and residual calculations.",
  "commissions.simulator.input.billing_monthly": "Monthly %",
  "commissions.simulator.input.billing_quarterly": "Quarterly %",
  "commissions.simulator.input.billing_annual": "Annual %",
  "commissions.simulator.input.billing_must_total":
    "Must total 100% (now {value}%)",
  "commissions.simulator.input.tier_title": "Tier Sales Mix",
  "commissions.simulator.input.tier_tooltip":
    "What % of new signups go to each tier? Higher tiers have bigger bonuses. This mix affects your average cost per signup.",
  "commissions.simulator.input.tier_must_total":
    "Must total 100% (now {value}%)",
  "commissions.simulator.input.tier_bonus_label": "{value} bonus",
  "commissions.simulator.metric.new_subs": "New Subs/Month",
  "commissions.simulator.metric.new_subs_sublabel":
    "Total new signups across all reps",
  "commissions.simulator.metric.signup_bonuses": "Signup Bonuses",
  "commissions.simulator.metric.signup_bonuses_sublabel":
    "One-time bonuses paid this month",
  "commissions.simulator.metric.monthly_residuals": "Monthly Residuals",
  "commissions.simulator.metric.monthly_residuals_sublabel":
    "Ongoing payments on retained subs",
  "commissions.simulator.metric.total_commission": "Total Commission",
  "commissions.simulator.metric.total_commission_sublabel":
    "Bonuses + residuals combined",
  "commissions.simulator.mini.pct_of_revenue": "% of Revenue",
  "commissions.simulator.mini.annual_cost": "Annual Cost",
  "commissions.simulator.mini.cost_per_new_sub": "Cost/New Sub",
  "commissions.simulator.mini.residual_rate": "Residual Rate",
  "commissions.simulator.breakdown.title": "Per-Tier Breakdown",
  "commissions.simulator.breakdown.subs_summary":
    "{newSubs} new + {existingSubs} existing",
  "commissions.simulator.breakdown.per_month_suffix": "/mo",
  "commissions.simulator.breakdown.bonus_per_sub": "{value}/sub bonus",
  "commissions.simulator.breakdown.upfront": "{value} upfront",
  "commissions.simulator.breakdown.residual": "{value} residual",
  "commissions.simulator.warning_title":
    "Commission exceeds 20% of revenue",
  "commissions.simulator.warning_description":
    "Consider reducing bonuses, lowering the residual %, or tightening accelerator thresholds.",

  "commissions.feedback.created": "Structure created.",
  "commissions.feedback.updated": "Structure updated.",
  "commissions.feedback.deleted": "Structure deleted.",
  "commissions.feedback.activated": "Structure activated.",
  "commissions.feedback.deactivated": "Structure deactivated.",
  "commissions.feedback.save_failed": "Failed to save structure.",

  // ============================================================
  // Financials - Phase 1.5.6a-bis
  // ============================================================

  "financials.agent.display_name": "Projections Architect",
  "financials.agent.subtitle": "Financial modeling & what-if analysis",
  "financials.agent.placeholder": "Ask about projections…",
  "financials.agent.empty_state":
    "I manage all your financial projections. Ask me to run scenarios, tweak assumptions, compare models, or build new projections from live system data.",
  "financials.agent.prompt_what_scenarios": "What scenarios do we have?",
  "financials.agent.prompt_default_run":
    "Run a projection with current system defaults",
  "financials.agent.prompt_what_if_reps":
    "What happens if we double our sales reps?",

  "financials.scenarios.title": "Scenarios",
  "financials.scenarios.placeholder": "Scenario name…",
  "financials.scenarios.action_save": "Save",
  "financials.scenarios.section_saved": "Saved",
  "financials.scenarios.action_load_title": "Load this scenario",
  "financials.scenarios.action_delete_title": "Delete this scenario",
  "financials.scenarios.error_enter_name": "Enter a scenario name",
  "financials.scenarios.error_no_results": "No results to save",
  "financials.scenarios.error_save_failed": "Failed to save",
  "financials.scenarios.confirm_delete": 'Delete scenario "{name}"?',
  "financials.scenarios.feedback.saved": "Scenario saved",
  "financials.scenarios.feedback.loaded": "Scenario loaded",
  "financials.scenarios.feedback.deleted": "Deleted",

  "financials.charts.projection_title": "{months}-Month Projection",
  "financials.charts.projection_description":
    "Revenue, costs, profit, and cumulative profit over {months} months",
  "financials.charts.legend_revenue": "Revenue",
  "financials.charts.legend_costs": "Costs",
  "financials.charts.legend_profit": "Profit",
  "financials.charts.legend_cumulative_profit": "Cumulative profit",
  "financials.charts.no_data": "No data to display",
  "financials.charts.empty_title": "No results to chart",
  "financials.charts.empty_description":
    "Configure the scenario inputs to generate charts.",
  "financials.charts.revenue_by_tier_title": "{label} Revenue by Tier",
  "financials.charts.revenue_by_tier_description":
    "{label} revenue contribution from each subscription tier",
  "financials.charts.pl_waterfall_title": "{label} P&L Waterfall",
  "financials.charts.pl_waterfall_description":
    "How revenue flows through costs to net margin",
  "financials.charts.cost_breakdown_title": "{label} Cost Breakdown",
  "financials.charts.cost_breakdown_description":
    "Where your revenue goes — margin, COGS, commissions, and overhead",
  "financials.charts.operation_breakeven_title": "Operation Breakeven",
  "financials.charts.operation_breakeven_description":
    "Cumulative profit over 24 months — breakeven {status}",
  "financials.charts.operation_breakeven_not_reached": "not reached",
  "financials.charts.operation_breakeven_at_month": "at month {month}",
  "financials.charts.month_label": "M{month}",
  "financials.charts.opex_scaled_legend": "OPEX (scaled)",
  "financials.charts.bar_revenue": "Revenue",
  "financials.charts.bar_product": "Product",
  "financials.charts.bar_fulfillment": "Fulfillment",
  "financials.charts.bar_commission": "Commission",
  "financials.charts.bar_kickbacks": "Kickbacks",
  "financials.charts.bar_overhead": "Overhead",
  "financials.charts.bar_net": "Net",
  "financials.charts.pie_net_margin": "Net Margin",
  "financials.charts.pie_cogs": "COGS",
  "financials.charts.pie_commissions": "Commissions",
  "financials.charts.pie_overhead": "Overhead",

  // Metrics panel
  "financials.metrics.empty_title": "No results yet",
  "financials.metrics.empty_description":
    "Configure the scenario inputs to see financial projections.",
  "financials.metrics.per_tier_breakdown": "Per-Tier Breakdown",

  "financials.metrics.ltv_cac.title": "LTV / CAC Analysis",
  "financials.metrics.ltv_cac.description":
    "Lifetime value vs acquisition cost per customer",
  "financials.metrics.ltv_cac.tooltip":
    "Compares how much a customer is worth over their lifetime (LTV) to how much it costs to acquire them (CAC). A ratio of 3x+ is healthy.",
  "financials.metrics.ltv_cac.blended_ltv": "Blended LTV",
  "financials.metrics.ltv_cac.blended_ltv_sub": "Lifetime value per customer",
  "financials.metrics.ltv_cac.blended_cac": "Blended CAC",
  "financials.metrics.ltv_cac.blended_cac_sub": "Cost to acquire a customer",
  "financials.metrics.ltv_cac.ratio": "LTV : CAC",
  "financials.metrics.ltv_cac.ratio_short": "LTV:CAC",
  "financials.metrics.ltv_cac.payback_period": "Payback Period",
  "financials.metrics.ltv_cac.healthy": "Healthy (3x+ is great)",
  "financials.metrics.ltv_cac.needs_improvement":
    "Needs improvement (aim for 3x+)",
  "financials.metrics.ltv_cac.losing_money": "Losing money on acquisition",
  "financials.metrics.ltv_cac.months_to_recover": "Months to recover CAC",
  "financials.metrics.ltv_cac.ltv_label": "LTV",
  "financials.metrics.ltv_cac.cac_label": "CAC",
  "financials.metrics.ltv_cac.payback_label": "Payback",

  "financials.metrics.sales.title": "Sales Rep Channel",
  "financials.metrics.sales.description":
    "Rep count, new subscribers & growth",
  "financials.metrics.sales.tooltip":
    "Metrics from your sales rep acquisition channel — starting reps, month-1 subscriber generation, and projected reps at month 12.",
  "financials.metrics.sales.mo1_reps": "Mo 1 Reps",
  "financials.metrics.sales.mo1_new_subs": "Mo 1 New Subs",
  "financials.metrics.sales.reps_mo12": "Reps @ Mo 12",

  "financials.metrics.revenue.title": "Revenue",
  "financials.metrics.revenue.description":
    "Total revenue & revenue per subscriber",
  "financials.metrics.revenue.tooltip":
    "Total recurring revenue for the selected period, plus the blended average revenue per subscriber across all tiers and billing cycles.",
  "financials.metrics.revenue.label": "Revenue",
  "financials.metrics.revenue.revenue_per_sub": "Revenue/Sub",
  "financials.metrics.revenue.arr": "ARR",

  "financials.metrics.cogs.title": "COGS",
  "financials.metrics.cogs.description":
    "Product, fulfillment & per-subscriber costs",
  "financials.metrics.cogs.tooltip":
    "Cost of goods sold — total product costs, fulfillment expenses, and the blended cost per subscriber.",
  "financials.metrics.cogs.total": "Total COGS",
  "financials.metrics.cogs.fulfillment": "Fulfillment",
  "financials.metrics.cogs.cost_per_sub": "Cost/Sub",

  "financials.metrics.commissions.title": "Commissions",
  "financials.metrics.commissions.description":
    "Total expense, per-sub & % of revenue",
  "financials.metrics.commissions.tooltip":
    "Total commission expense including upfront bonuses and residual payments, broken down per subscriber and as a percentage of total revenue.",
  "financials.metrics.commissions.total": "Total Commission",
  "financials.metrics.commissions.per_sub": "Commission/Sub",
  "financials.metrics.commissions.percent_of_revenue": "% of Revenue",

  "financials.metrics.partners.title": "Partners & Breakage",
  "financials.metrics.partners.description":
    "Kickback revenue & credit savings",
  "financials.metrics.partners.tooltip":
    "Revenue from partner brand kickbacks. Breakage savings represent COGS avoided from unredeemed credits — already reflected in lower COGS figures.",
  "financials.metrics.partners.kickback_revenue": "Kickback Revenue",
  "financials.metrics.partners.breakage_savings": "Breakage Savings",

  "financials.metrics.margins.title": "Margins",
  "financials.metrics.margins.description":
    "Gross & net margin in dollars and percent",
  "financials.metrics.margins.tooltip":
    "Gross margin (revenue minus COGS) and net margin (after all expenses including commissions and overhead).",
  "financials.metrics.margins.gross": "Gross Margin",
  "financials.metrics.margins.gross_percent": "Gross Margin %",
  "financials.metrics.margins.net": "Net Margin",
  "financials.metrics.margins.net_percent": "Net Margin %",

  "financials.metrics.profit_split.title": "Profit Split",
  "financials.metrics.profit_split.description":
    "How channel profits are divided between parties",
  "financials.metrics.profit_split.tooltip":
    "After all costs, the remaining net profit is split among the defined parties according to their agreed percentages.",
  "financials.metrics.profit_split.unnamed": "Unnamed",
  "financials.metrics.profit_split.undistributed_percent":
    "Undistributed ({percent}%)",

  "financials.metrics.tier_details.title": "Per-Tier Details",
  "financials.metrics.tier_details.description":
    "Revenue, COGS & margin per subscription tier",
  "financials.metrics.tier_details.tooltip":
    "Detailed per-tier analysis showing subscriber count, revenue per subscriber, cost structure, margin, and lifetime value for each tier.",
  "financials.metrics.tier_details.subscribers_count": "{count} subscribers",
  "financials.metrics.tier_details.margin_label": "{value} margin",
  "financials.metrics.tier_details.rev_per_sub": "Rev: {value}/sub",
  "financials.metrics.tier_details.cogs_per_sub": "COGS: {value}/sub",
  "financials.metrics.tier_details.ltv_label": "LTV: {value}",
  "financials.metrics.tier_details.avg_life": "Avg life",
  "financials.metrics.tier_details.months_short": "{months} mo",

  // Executive summary
  "financials.summary.empty_title": "No results yet",
  "financials.summary.empty_description":
    "Configure the scenario inputs to see the executive summary.",

  "financials.summary.verdict.net_margin": "Net Margin",
  "financials.summary.verdict.net_margin_sub": "{value}/mo",
  "financials.summary.verdict.ltv_cac": "LTV:CAC Ratio",
  "financials.summary.verdict.ltv_cac_sub": "LTV {ltv} / CAC {cac}",
  "financials.summary.verdict.breakeven": "Breakeven",
  "financials.summary.verdict.breakeven_month": "Month {month}",
  "financials.summary.verdict.breakeven_year1": "Within Year 1",
  "financials.summary.verdict.breakeven_year2": "Year 2",
  "financials.summary.verdict.breakeven_negative":
    "Cumulative profit stays negative",

  "financials.summary.margin.interpretation.strong":
    "Strong unit economics — supports aggressive scaling",
  "financials.summary.margin.interpretation.healthy":
    "Healthy margins — room to invest in growth",
  "financials.summary.margin.interpretation.thin":
    "Thin margins — monitor costs closely",
  "financials.summary.margin.interpretation.breakeven":
    "Breaking even — optimize before scaling",
  "financials.summary.margin.interpretation.negative":
    "Negative margins — restructure costs before scaling",

  "financials.summary.ltvcac.interpretation.infinite":
    "Infinite — zero churn means customers never leave",
  "financials.summary.ltvcac.interpretation.excellent":
    "Excellent — every dollar spent acquires 5x+ in lifetime value",
  "financials.summary.ltvcac.interpretation.healthy":
    "Healthy — unit economics support scaling",
  "financials.summary.ltvcac.interpretation.cautious":
    "Cautious — positive but low margin for error",
  "financials.summary.ltvcac.interpretation.barely_positive":
    "Barely positive — acquisition cost nearly equals lifetime value",
  "financials.summary.ltvcac.interpretation.negative":
    "Negative — you lose money on every customer acquired",

  "financials.summary.breakeven.interpretation.never":
    "Does not break even within 24 months",
  "financials.summary.breakeven.interpretation.fast":
    "Fast payback — capital efficient model",
  "financials.summary.breakeven.interpretation.solid":
    "Solid — profitability within Year 1",
  "financials.summary.breakeven.interpretation.moderate":
    "Moderate runway — plan for 18 months of funding",
  "financials.summary.breakeven.interpretation.long":
    "Long runway needed — 2+ years to profitability",

  "financials.summary.key_metrics.title": "Key Metrics",
  "financials.summary.key_metrics.mrr": "MRR",
  "financials.summary.key_metrics.arr": "ARR",
  "financials.summary.key_metrics.gross_margin": "Gross Margin",
  "financials.summary.key_metrics.new_subs_per_mo": "New Subs/Mo",
  "financials.summary.key_metrics.commission_pct_revenue":
    "Commission % of Revenue",
  "financials.summary.key_metrics.cost_per_sub": "Cost/Subscriber",
  "financials.summary.key_metrics.payback_period": "Payback Period",
  "financials.summary.key_metrics.months_value": "{months} months",
  "financials.summary.key_metrics.mo24_subscribers": "Mo 24 Subscribers",

  "financials.summary.provenance.title": "Assumption Sources",
  "financials.summary.provenance.tier_pricing": "Tier Pricing",
  "financials.summary.provenance.tiers_configured": "{count} tiers configured",
  "financials.summary.provenance.commissions": "Commissions",
  "financials.summary.provenance.commissions_detail":
    "${bonus} bonus + {residual}% residual",
  "financials.summary.provenance.opex": "OPEX",
  "financials.summary.provenance.opex_scaled":
    "Auto-scaled from {count} categories",
  "financials.summary.provenance.opex_fixed": "Fixed at {value}/mo",
  "financials.summary.provenance.sales_rep_channel": "Sales Rep Channel",
  "financials.summary.provenance.sales_rep_detail":
    "{reps} reps, {sales} sales/rep/mo",
  "financials.summary.provenance.partner_kickbacks": "Partner Kickbacks",
  "financials.summary.provenance.partners_count": "{count} active partners",
  "financials.summary.provenance.source_plans": "Plans page",
  "financials.summary.provenance.source_promoters": "Promoters page",
  "financials.summary.provenance.source_operations_live":
    "Operations page (live)",
  "financials.summary.provenance.source_manual_override": "Manual override",
  "financials.summary.provenance.live_badge": "Live",
  "financials.summary.provenance.source_manual_input": "Manual input",
  "financials.summary.provenance.source_brands": "Brands page",

  "financials.summary.trajectory.title": "24-Month Trajectory",
  "financials.summary.trajectory.month_label": "Mo {month}",
  "financials.summary.trajectory.subs_label": "{count} subs",
  "financials.summary.trajectory.cum_label": "Cum: {value}",

  "financials.summary.validation.title": "Validation Notes",
  "financials.summary.validation.billing_distribution":
    "Billing distribution sums to {value}%, not 100%",
  "financials.summary.validation.tier_distribution":
    "Tier subscriber distribution sums to {value}%, not 100%",
  "financials.summary.validation.deeply_negative":
    "Net margin is deeply negative — review cost assumptions",
  "financials.summary.validation.profit_split_total":
    "Profit split percentages total {value}%, not 100%",
  "financials.summary.validation.churn_optimistic":
    "Average churn below 2% is very optimistic for a subscription business",
  "financials.summary.validation.churn_high":
    "Average churn above 15% is very high — retention strategy needed",

  // P&L statement
  "financials.pl.title": "{period} P&L Statement",
  "financials.pl.empty_title": "No results yet",
  "financials.pl.empty_description":
    "Configure the scenario inputs to see the P&L statement.",
  "financials.pl.revenue": "Revenue",
  "financials.pl.total_revenue": "Total Revenue",
  "financials.pl.tier_subs": "{tier} ({count} subs)",
  "financials.pl.cogs": "Cost of Goods Sold",
  "financials.pl.total_cogs": "Total COGS",
  "financials.pl.product_costs": "Product Costs (Credits & Apparel)",
  "financials.pl.fulfillment_shipping": "Fulfillment & Shipping",
  "financials.pl.gross_profit": "Gross Profit",
  "financials.pl.opex": "Operating Expenses",
  "financials.pl.total_opex": "Total OpEx",
  "financials.pl.sales_commissions": "Sales Commissions",
  "financials.pl.overhead": "Operational Overhead",
  "financials.pl.overhead_scaled": "Operational Overhead (scaled)",
  "financials.pl.other_income": "Other Income",
  "financials.pl.total_other_income": "Total Other Income",
  "financials.pl.partner_kickbacks": "Partner Kickbacks",
  "financials.pl.breakage_note":
    "Credit breakage savings of {value} already reflected in reduced COGS ({percent} unredeemed)",
  "financials.pl.net_income": "Net Income",
  "financials.pl.profit_distribution": "Profit Distribution",
  "financials.pl.distributed": "Distributed ({percent}%)",
  "financials.pl.party_label": "{name} ({percent}%)",
  "financials.pl.unnamed": "Unnamed",
  "financials.pl.undistributed": "Undistributed ({percent}%)",

  // Models list
  "financials.models.title": "Projections",
  "financials.models.subtitle":
    "Build and compare financial projection models for your operation.",
  "financials.models.loading": "Loading models...",
  "financials.models.untitled": "Untitled Model",
  "financials.models.add_model": "Add Model",
  "financials.models.view_cards": "Card view",
  "financials.models.view_table": "Table view",
  "financials.models.empty_title": "No models yet",
  "financials.models.empty_description":
    "Create your first financial model to simulate P&L scenarios, compare margins, and plan your operation.",
  "financials.models.confirm_delete": 'Delete model "{name}"?',
  "financials.models.feedback.deleted": "Model deleted",
  "financials.models.ratio_x": "{value}x",
  "financials.models.breakeven.never": "Never",
  "financials.models.breakeven.month_short": "Mo {month}",
  "financials.models.breakeven.month_long": "Month {month}",
  "financials.models.column.model": "Model",
  "financials.models.column.mrr": "MRR",
  "financials.models.column.arr": "ARR",
  "financials.models.column.net_margin": "Net Margin",
  "financials.models.column.gross_margin": "Gross Margin",
  "financials.models.column.new_subs_per_mo": "New Subs/Mo",
  "financials.models.column.ltv_cac": "LTV:CAC",
  "financials.models.column.breakeven": "Breakeven",
  "financials.models.column.created": "Created",

  // Projection spreadsheet
  "financials.projection.empty": "No results yet",
  "financials.projection.tier_indent": "  └ {tier}",
  "financials.projection.section.subscribers": "Subscribers",
  "financials.projection.section.revenue": "Revenue",
  "financials.projection.section.cogs": "Cost of Goods",
  "financials.projection.section.opex": "Operating Expenses",
  "financials.projection.section.bottom_line": "Bottom Line",
  "financials.projection.section.profit_split": "Profit Split",
  "financials.projection.row.gross_new_sales": "Gross New Sales",
  "financials.projection.row.chargebacks": "Chargebacks",
  "financials.projection.row.net_new_subs": "Net New Subs",
  "financials.projection.row.lost_to_churn": "Lost to Churn",
  "financials.projection.row.total_active": "Total Active",
  "financials.projection.row.subscription_revenue": "Subscription Revenue",
  "financials.projection.row.monthly_billing": "  └ Monthly Billing",
  "financials.projection.row.quarterly_billing": "  └ Quarterly Billing",
  "financials.projection.row.annual_billing": "  └ Annual Billing",
  "financials.projection.row.product_fulfillment": "Product & Fulfillment",
  "financials.projection.row.gross_profit": "Gross Profit",
  "financials.projection.row.gross_margin_pct": "Gross Margin %",
  "financials.projection.row.commissions": "Commissions",
  "financials.projection.row.overhead": "Overhead",
  "financials.projection.row.total_opex": "Total OpEx",
  "financials.projection.row.net_profit": "Net Profit",
  "financials.projection.row.cumulative_profit": "Cumulative Profit",
  "financials.projection.row.net_margin_pct": "Net Margin %",
  "financials.projection.column.total_avg": "Total/Avg",

  // Cohort spreadsheet
  "financials.cohort.empty":
    "No results yet. Configure inputs to generate the cohort analysis.",
  "financials.cohort.section.acquisition": "Acquisition",
  "financials.cohort.section.costs": "Costs",
  "financials.cohort.section.profitability": "Profitability",
  "financials.cohort.row.active_reps": "Active Reps",
  "financials.cohort.row.total_active_subs": "Total Active Subs",
  "financials.cohort.row.monthly_revenue": "Monthly Revenue",
  "financials.cohort.row.cumulative_revenue": "Cumulative Revenue",
  "financials.cohort.row.cogs": "COGS",
  "financials.cohort.row.total_costs": "Total Costs",
  "financials.cohort.row.monthly_net_profit": "Monthly Net Profit",
  "financials.cohort.row.monthly_margin_pct": "Monthly Margin %",
  "financials.cohort.column.metric": "Metric",
  "financials.cohort.column.month_long": "Month {month}",
  "financials.cohort.column.total": "Total",

  // Toolbar — financial-page-client
  "financials.toolbar.breadcrumb_finances": "Finances",
  "financials.toolbar.assumptions_title": "Assumptions",
  "financials.toolbar.projection_title": "Projection",
  "financials.toolbar.model_name_placeholder": "Model name...",
  "financials.toolbar.button.save_model": "Save Model",
  "financials.toolbar.button.saving": "Saving...",
  "financials.toolbar.button.remix": "Remix",
  "financials.toolbar.button.remixing": "Remixing...",
  "financials.toolbar.button.duplicate": "Duplicate",
  "financials.toolbar.button.duplicating": "Duplicating...",
  "financials.toolbar.button.deleting": "Deleting...",
  "financials.toolbar.button.full_screen": "Full screen",
  "financials.toolbar.button.exit_full_screen": "Exit full screen",
  "financials.toolbar.tab.summary": "Summary",
  "financials.toolbar.tab.statement": "Statement",
  "financials.toolbar.tab.spreadsheet": "Spreadsheet",
  "financials.toolbar.tab.cohort": "Cohort",
  "financials.toolbar.tab.metrics": "Metrics",
  "financials.toolbar.tab.charts": "Charts",
  "financials.toolbar.time_period.month": "Month",
  "financials.toolbar.time_period.quarter": "Quarter",
  "financials.toolbar.time_period.semester": "Semester",
  "financials.toolbar.time_period.year": "Year",
  "financials.toolbar.time_period.custom": "Custom",
  "financials.toolbar.time_period.custom_months": "{months}-Month",
  "financials.toolbar.time_period.month_short": "mo",
  "financials.toolbar.color.green": "Green",
  "financials.toolbar.color.blue": "Blue",
  "financials.toolbar.color.yellow": "Yellow",
  "financials.toolbar.color.orange": "Orange",
  "financials.toolbar.color.red": "Red",
  "financials.toolbar.color.purple": "Purple",
  "financials.toolbar.color.gray": "Gray",
  "financials.toolbar.error.enter_model_name": "Enter a model name",
  "financials.toolbar.error.no_results_to_save":
    "No results to save — run the scenario first",
  "financials.toolbar.error.save_failed": "Failed to save",
  "financials.toolbar.error.save_failed_connection":
    "Failed to save — check your connection",
  "financials.toolbar.error.describe_changes": "Describe the changes you want",
  "financials.toolbar.error.remix_failed": "Remix failed",
  "financials.toolbar.error.enter_duplicate_name": "Enter a name for the duplicate",
  "financials.toolbar.error.no_results_to_duplicate": "No results to duplicate",
  "financials.toolbar.error.duplicate_failed": "Failed to duplicate",
  "financials.toolbar.error.delete_failed": "Failed to delete",
  "financials.toolbar.feedback.remixed":
    "Model remixed — review the updated assumptions",
  "financials.toolbar.feedback.duplicated": "Model duplicated",
  "financials.toolbar.remix_dialog.title": "Remix Model",
  "financials.toolbar.remix_dialog.description":
    "Describe how you want to change the projection. An AI agent will adjust the premise values and generate updated projections.",
  "financials.toolbar.remix_dialog.placeholder":
    "e.g., Make this more aggressive — start with 20 reps growing at 15%/mo, reduce overhead to $15k, and increase the residual to 8%...",
  "financials.toolbar.duplicate_dialog.title": "Duplicate Model",
  "financials.toolbar.duplicate_dialog.description":
    "Create a copy of this model with a new name and color. All assumptions and projections will be duplicated.",
  "financials.toolbar.duplicate_dialog.color_label": "Color",
  "financials.toolbar.duplicate_dialog.name_label": "Model Name",
  "financials.toolbar.delete_dialog.title": "Delete Model",
  "financials.toolbar.delete_dialog.description_prefix": "Are you sure you want to delete",
  "financials.toolbar.delete_dialog.description_suffix": "?",

  // Builder — scenario-builder.tsx
  "financials.builder.linked_badge.expenses": "Expenses",
  "financials.builder.linked_badge.from_plans": "From Plans",
  "financials.builder.linked_badge.plans_linked": "{count} plans linked",

  "financials.builder.overhead.title": "Overhead",
  "financials.builder.overhead.description_fixed": "Fixed monthly operating costs",
  "financials.builder.overhead.description_auto_scaled":
    "Auto-scaled from Operations page",
  "financials.builder.overhead.tooltip":
    "Operational costs like rent, salaries, software, and admin. Can be a fixed monthly amount or automatically scaled from your Operations page based on subscriber milestones.",
  "financials.builder.overhead.mode_fixed": "Fixed",
  "financials.builder.overhead.mode_auto_scaled": "Auto-scaled",
  "financials.builder.overhead.field_monthly_overhead": "Monthly Overhead ($)",
  "financials.builder.overhead.field_monthly_overhead_tooltip":
    "Your total fixed monthly costs that don't scale with subscribers — office rent, salaries, software subscriptions, insurance, admin, etc.",
  "financials.builder.overhead.operations_categories": "Operations Page Categories",
  "financials.builder.overhead.per_month_amount": "{amount}/mo",
  "financials.builder.overhead.scale_note_prefix":
    "Costs scale automatically as subscribers cross milestone thresholds defined on the",
  "financials.builder.overhead.operations_page_link": "Operations page",
  "financials.builder.overhead.no_opex_prefix": "No OPEX data found. Set up cost milestones on the",
  "financials.builder.overhead.no_opex_suffix": "first.",

  "financials.builder.sales_reps.title": "Sales Representatives",
  "financials.builder.sales_reps.description":
    "Reps, productivity & monthly growth",
  "financials.builder.sales_reps.tooltip":
    "Your door-to-door sales force. Define starting headcount, productivity, and how fast the team grows each month. Reps compound — 10 reps growing at 10%/mo becomes 26 reps by month 12.",
  "financials.builder.sales_reps.field_starting_reps": "Starting Reps",
  "financials.builder.sales_reps.field_starting_reps_tooltip":
    "How many sales reps you start with in month 1. This is your baseline — the team grows from here based on your monthly growth rate.",
  "financials.builder.sales_reps.field_sales_per_rep": "Sales/Rep/Mo",
  "financials.builder.sales_reps.field_sales_per_rep_tooltip":
    "How many new subscriptions each rep closes per month on average. Multiply by active reps to get total monthly acquisition from this channel.",
  "financials.builder.sales_reps.field_growth_rate": "Growth %/Mo",
  "financials.builder.sales_reps.field_growth_rate_tooltip":
    "How fast your sales team grows each month. At 10%, you go from 10 reps to 11 next month, 12 the month after, and so on — compounding over time.",
  "financials.builder.sales_reps.summary_mo1": "Mo 1: {reps} reps × {sales} sales =",
  "financials.builder.sales_reps.summary_new_subs": "{count} new subs",
  "financials.builder.sales_reps.summary_mo12_prefix": "Mo 12:",
  "financials.builder.sales_reps.summary_mo12_value": "{reps} reps → {subs} subs",

  "financials.builder.commission.title": "Commission Structure",
  "financials.builder.commission.description": "How reps are paid per sale",
  "financials.builder.commission.tooltip":
    "Define how your D2D sales reps are compensated — upfront bonus (flat $ or % of plan price), ongoing residual, accelerators, and payout timing.",
  "financials.builder.commission.upfront_section": "Upfront Commission",
  "financials.builder.commission.residual_section": "Residual (ongoing)",
  "financials.builder.commission.accelerator_section": "Accelerator",
  "financials.builder.commission.type_flat": "Flat $",
  "financials.builder.commission.type_percent": "% of Plan",
  "financials.builder.commission.field_bonus_per_sale": "Bonus per Sale ($)",
  "financials.builder.commission.field_bonus_per_sale_tooltip":
    "A fixed dollar amount paid to the rep for each new subscription they close, regardless of which plan the subscriber chose.",
  "financials.builder.commission.field_percent_of_plan": "% of Plan Price",
  "financials.builder.commission.field_percent_of_plan_tooltip":
    "The rep earns this percentage of the subscriber's monthly plan price as their upfront bonus. 100% means the rep earns the full first month's revenue.",
  "financials.builder.commission.field_payout_delay": "Payout Delay (months)",
  "financials.builder.commission.field_payout_delay_tooltip":
    "How many months after the sale before the upfront commission is paid. 0 = immediate. 2 = paid two months after the sale closes. Delays improve cash flow.",
  "financials.builder.commission.field_residual_percent": "Residual %/mo",
  "financials.builder.commission.field_residual_percent_tooltip":
    "An ongoing monthly percentage of each subscriber's revenue paid to the rep who sold them. This repeats every month the subscriber stays active.",
  "financials.builder.commission.field_residual_delay": "Starts After (months)",
  "financials.builder.commission.field_residual_delay_tooltip":
    "How many months after the sale before the rep starts earning residual. 0 = residual begins immediately. 3 = the rep gets nothing for 3 months, then residual kicks in from month 4 onward.",
  "financials.builder.commission.field_percent_hitting": "% Hitting Accelerator",
  "financials.builder.commission.field_percent_hitting_tooltip":
    "What percentage of your reps exceed their sales quota and earn the accelerator bonus.",
  "financials.builder.commission.field_multiplier": "Multiplier",
  "financials.builder.commission.field_multiplier_tooltip":
    "The bonus multiplier for top-performing reps. At 1.5x, a rep earning a $50 bonus gets $75 when they hit their accelerator threshold.",
  "financials.builder.commission.summary_upfront_label": "Upfront",
  "financials.builder.commission.summary_upfront_percent": "{percent} of plan price",
  "financials.builder.commission.summary_upfront_flat": "{amount} flat",
  "financials.builder.commission.summary_paid_immediately": "paid immediately",
  "financials.builder.commission.summary_paid_after": "paid after {months} mo",
  "financials.builder.commission.summary_residual_value": "{percent}/mo",
  "financials.builder.commission.summary_residual_word": "residual",
  "financials.builder.commission.summary_residual_delay": " (starts after {months} mo)",

  "financials.builder.profit_split.title": "Profit Split",
  "financials.builder.profit_split.description":
    "How channel profits are divided between parties",
  "financials.builder.profit_split.tooltip":
    "After all costs (COGS, commissions, overhead), the remaining profit from this sales channel is split between the parties defined here. Percentages should total 100%.",
  "financials.builder.profit_split.empty":
    "No parties defined. Add parties to split the channel profits.",
  "financials.builder.profit_split.party_name_label": "Party Name",
  "financials.builder.profit_split.party_name_placeholder":
    "e.g. HERD, Investor, Partner",
  "financials.builder.profit_split.split_percent_label": "Split %",
  "financials.builder.profit_split.split_percent_tooltip":
    "What percentage of the channel's net profit this party receives.",
  "financials.builder.profit_split.add_party": "Add Party",
  "financials.builder.profit_split.unnamed": "Unnamed",
  "financials.builder.profit_split.total_label": "Total",
  "financials.builder.profit_split.must_be_100": "(must be 100%)",

  "financials.builder.chargebacks.title": "Chargebacks",
  "financials.builder.chargebacks.description": "Projected chargeback rate and fees",
  "financials.builder.chargebacks.tooltip":
    "Percentage of new subscribers who will dispute/chargeback their purchase. Chargebacks reduce your net subscribers and incur processor fees plus lost COGS on shipped products.",
  "financials.builder.chargebacks.field_rate": "Chargeback Rate %",
  "financials.builder.chargebacks.field_rate_tooltip":
    "What percentage of new subscribers will chargeback each month. E.g., 2% means 2 out of every 100 new sales result in a chargeback.",
  "financials.builder.chargebacks.field_fee": "Fee per Chargeback ($)",
  "financials.builder.chargebacks.field_fee_tooltip":
    "The payment processor fee you pay per chargeback event, typically $15-25.",
  "financials.builder.chargebacks.summary":
    "~{cbs} chargebacks/mo from {gross} new sales → {net} net new subscribers",

  "financials.builder.plans.title": "Plans",
  "financials.builder.plans.description":
    "Plan structure & performance levers",
  "financials.builder.plans.tooltip":
    "Plan structure is read-only from your Plans settings. Performance assumptions — subscriber mix, churn, billing behavior — are the levers that move your projections.",
  "financials.builder.plans.global_defaults": "Global Defaults",
  "financials.builder.plans.field_monthly_pct": "Monthly %",
  "financials.builder.plans.field_monthly_pct_tooltip":
    "Default % of subscribers paying month-to-month. Individual plans can override this in their Overrides section.",
  "financials.builder.plans.field_quarterly_pct": "Quarterly %",
  "financials.builder.plans.field_quarterly_pct_tooltip":
    "Default % of subscribers paying quarterly.",
  "financials.builder.plans.field_annual_pct": "Annual %",
  "financials.builder.plans.field_annual_pct_tooltip":
    "Default % of subscribers paying annually.",
  "financials.builder.plans.must_total_100": "Must total 100% (now {current})",
  "financials.builder.plans.field_credit_redemption": "Credit Redemption %",
  "financials.builder.plans.field_credit_redemption_tooltip":
    "Default % of credits subscribers actually use. Plans can override this individually. Unredeemed credits become breakage profit.",
  "financials.builder.plans.plan_structure": "Plan Structure",
  "financials.builder.plans.price_per_month": "{amount}/mo",
  "financials.builder.plans.price_per_quarter": "{amount}/qtr",
  "financials.builder.plans.price_per_year": "{amount}/yr",
  "financials.builder.plans.credits_per_month": "{amount} credits/mo",
  "financials.builder.plans.apparel_per_month": "{amount} apparel/mo",
  "financials.builder.plans.no_credits_apparel": "No credits or apparel",
  "financials.builder.plans.trial_days": "{days}-day trial",
  "financials.builder.plans.setup_fee": "{amount} setup fee",
  "financials.builder.plans.est_cost_label": "Est. cost",
  "financials.builder.plans.est_cost_value": "{amount}/sub/mo",
  "financials.builder.plans.performance_section": "Performance",
  "financials.builder.plans.field_subscriber_mix": "Subscriber Mix %",
  "financials.builder.plans.field_subscriber_mix_tooltip":
    "What percentage of your total subscribers choose this plan. All plans should add up to 100%.",
  "financials.builder.plans.field_monthly_churn": "Monthly Churn %",
  "financials.builder.plans.field_monthly_churn_tooltip":
    "Monthly cancellation rate for this plan. 6% monthly churn = ~17 month average lifetime. Churn only starts after the minimum commitment period expires.",
  "financials.builder.plans.field_min_commit": "Min Commit (mo)",
  "financials.builder.plans.field_min_commit_tooltip":
    "Minimum months a subscriber is locked in before they can cancel. During this period churn is 0 (subscribers can't leave). Sourced from your plan settings.",

  "financials.builder.overrides.title": "Overrides",
  "financials.builder.overrides.tag_billing": "billing",
  "financials.builder.overrides.tag_redemption": "redemption",
  "financials.builder.overrides.billing_mix": "Billing Mix",
  "financials.builder.overrides.billing_mix_global": "Billing Mix (global)",
  "financials.builder.overrides.field_mo": "Mo %",
  "financials.builder.overrides.field_mo_tooltip":
    "Percentage of this plan's subscribers paying monthly. Override the global billing mix for this specific plan.",
  "financials.builder.overrides.field_qtr": "Qtr %",
  "financials.builder.overrides.field_qtr_tooltip":
    "Percentage of this plan's subscribers paying quarterly.",
  "financials.builder.overrides.field_ann": "Ann %",
  "financials.builder.overrides.field_ann_tooltip":
    "Percentage of this plan's subscribers paying annually.",
  "financials.builder.overrides.credit_redemption": "Credit Redemption",
  "financials.builder.overrides.credit_redemption_global": "Credit Redemption (global)",
  "financials.builder.overrides.field_redemption": "Redemption %",
  "financials.builder.overrides.field_redemption_tooltip":
    "What percentage of credits get redeemed by this plan's subscribers. Higher-tier members tend to redeem more. Overrides the global rate.",

  // ============================================================
  // Organization (Phase 1.5.6b — Identity & People, Phase A)
  // ============================================================

  // Sub-panel
  "organization.subpanel.title": "Organization",
  "organization.subpanel.profile_category": "Profile",
  "organization.subpanel.general_information": "General Information",
  "organization.subpanel.contact_information": "Contact Information",
  "organization.subpanel.locations": "Locations",
  "organization.subpanel.business_hours": "Business Hours",
  "organization.subpanel.regional_settings": "Regional Settings",

  // Profile (legacy aggregated form)
  "organization.profile.title": "Organization Profile",
  "organization.profile.description":
    "Manage your organization details and preferences.",
  "organization.profile.section.general_information": "General Information",
  "organization.profile.section.contact_information": "Contact Information",
  "organization.profile.section.regional_settings": "Regional Settings",
  "organization.profile.section.legal": "Legal",
  "organization.profile.field.organization_name": "Organization Name",
  "organization.profile.field.organization_name_placeholder": "e.g. HERD",
  "organization.profile.field.description_label": "Description",
  "organization.profile.field.description_placeholder":
    "Brief description of your organization",
  "organization.profile.field.website": "Website",
  "organization.profile.field.website_placeholder": "https://yourcompany.com",
  "organization.profile.field.support_email": "Support Email",
  "organization.profile.field.support_email_placeholder":
    "support@yourcompany.com",
  "organization.profile.field.phone": "Phone Number",
  "organization.profile.field.phone_placeholder": "+1 (555) 000-0000",
  "organization.profile.field.address": "Address",
  "organization.profile.field.address_placeholder":
    "Street address, city, state, zip",
  "organization.profile.field.default_language": "Default Language",
  "organization.profile.field.timezone": "Timezone",
  "organization.profile.field.currency": "Currency",
  "organization.profile.field.legal_name": "Legal Entity Name",
  "organization.profile.field.legal_name_placeholder":
    "Full legal name of your company",
  "organization.profile.field.tax_id": "Tax ID / EIN",
  "organization.profile.field.tax_id_placeholder": "XX-XXXXXXX",

  // General Information form
  "organization.profile.general.title": "General Information",
  "organization.profile.general.description":
    "Basic details about your organization, including name, industry, and mission.",
  "organization.profile.general.identity_title": "Organization Identity",
  "organization.profile.general.identity_description":
    "Your organization's name, legal entity, and tax identification.",
  "organization.profile.general.legal_name_help":
    "Used in contracts, invoices, and official documents.",
  "organization.profile.general.about_title": "About",
  "organization.profile.general.about_description":
    "Describe your organization, its mission, and online presence.",
  "organization.profile.general.description_placeholder":
    "Brief description of your organization and what you do",
  "organization.profile.general.mission_label": "Mission Statement",
  "organization.profile.general.mission_placeholder":
    "What drives your organization?",
  "organization.profile.general.details_title": "Company Details",
  "organization.profile.general.details_description":
    "Industry, size, and founding information.",
  "organization.profile.general.industry_label": "Industry",
  "organization.profile.general.industry_placeholder": "Select industry",
  "organization.profile.general.size_label": "Company Size",
  "organization.profile.general.size_placeholder": "Select size",
  "organization.profile.general.founded_label": "Year Founded",
  "organization.profile.general.founded_placeholder": "e.g. 2016",
  "organization.profile.general.org_name_placeholder": "e.g. Bucked Up",

  // Industries
  "organization.industry.health_wellness": "Health & Wellness",
  "organization.industry.supplements": "Supplements & Nutrition",
  "organization.industry.fitness": "Fitness & Sports",
  "organization.industry.ecommerce": "E-Commerce",
  "organization.industry.saas": "SaaS / Technology",
  "organization.industry.retail": "Retail",
  "organization.industry.food_beverage": "Food & Beverage",
  "organization.industry.beauty": "Beauty & Personal Care",
  "organization.industry.other": "Other",

  // Company sizes
  "organization.size.1_10": "1-10 employees",
  "organization.size.11_50": "11-50 employees",
  "organization.size.51_200": "51-200 employees",
  "organization.size.201_500": "201-500 employees",
  "organization.size.501_1000": "501-1,000 employees",
  "organization.size.1000_plus": "1,000+ employees",

  // Contact form
  "organization.contact.title": "Contact Information",
  "organization.contact.description":
    "How customers, partners, and team members can reach your organization.",
  "organization.contact.primary_title": "Primary Contact",
  "organization.contact.primary_description":
    "Email addresses and phone numbers for customer and partner inquiries.",
  "organization.contact.support_email_help":
    "Displayed to customers and partners for general inquiries.",
  "organization.contact.sales_email_label": "Sales Email",
  "organization.contact.sales_email_placeholder": "sales@yourcompany.com",
  "organization.contact.main_phone_label": "Main Phone Number",
  "organization.contact.support_phone_label": "Support Phone Number",
  "organization.contact.headquarters_title": "Headquarters Address",
  "organization.contact.headquarters_description":
    "Your organization's primary physical location.",
  "organization.contact.street_label": "Street Address",
  "organization.contact.street_placeholder": "123 Main Street",
  "organization.contact.street2_label": "Street Address Line 2",
  "organization.contact.street2_placeholder": "Suite 100, Building A",
  "organization.contact.city_label": "City",
  "organization.contact.city_placeholder": "American Fork",
  "organization.contact.state_label": "State / Province",
  "organization.contact.state_placeholder": "UT",
  "organization.contact.zip_label": "ZIP / Postal Code",
  "organization.contact.zip_placeholder": "84003",
  "organization.contact.country_label": "Country",
  "organization.contact.country_placeholder": "United States",
  "organization.contact.social_title": "Social & Web Presence",
  "organization.contact.social_description":
    "Links to your organization's social media profiles and online channels.",
  "organization.contact.social_instagram": "Instagram",
  "organization.contact.social_facebook": "Facebook",
  "organization.contact.social_linkedin": "LinkedIn",
  "organization.contact.social_twitter": "X (Twitter)",
  "organization.contact.social_youtube": "YouTube",
  "organization.contact.social_tiktok": "TikTok",

  // Locations
  "organization.locations.title": "Locations",
  "organization.locations.description":
    "Manage your organization's stores, offices, and other physical locations.",
  "organization.locations.add": "Add Location",
  "organization.locations.add_first": "Add Your First Location",
  "organization.locations.empty_title": "No locations yet",
  "organization.locations.empty_description":
    "Add your headquarters, stores, and other locations so your team and partners know where you operate.",
  "organization.locations.headquarters_title": "Headquarters",
  "organization.locations.headquarters_description":
    "Your organization's primary location.",
  "organization.locations.other_title": "Other Locations",
  "organization.locations.all_title": "All Locations",
  "organization.locations.other_description":
    "Stores, offices, warehouses, and other physical locations.",
  "organization.locations.other_empty":
    "No additional locations added yet.",
  "organization.locations.dialog.add_title": "Add Location",
  "organization.locations.dialog.edit_title": "Edit Location",
  "organization.locations.dialog.add_description":
    "Add a new store, office, or warehouse to your organization.",
  "organization.locations.dialog.edit_description":
    "Update this location's details.",
  "organization.locations.field.name": "Location Name",
  "organization.locations.field.name_placeholder": "e.g. Downtown Store",
  "organization.locations.field.type": "Type",
  "organization.locations.field.is_headquarters":
    "This is the headquarters location",
  "organization.locations.field.street": "Street Address",
  "organization.locations.field.street_placeholder": "123 Main Street",
  "organization.locations.field.street2": "Street Address Line 2",
  "organization.locations.field.street2_placeholder": "Suite 100",
  "organization.locations.field.city": "City",
  "organization.locations.field.city_placeholder": "City",
  "organization.locations.field.state": "State",
  "organization.locations.field.state_placeholder": "State",
  "organization.locations.field.zip": "ZIP",
  "organization.locations.field.zip_placeholder": "ZIP",
  "organization.locations.field.country": "Country",
  "organization.locations.field.country_placeholder": "United States",
  "organization.locations.field.phone": "Phone",
  "organization.locations.field.phone_placeholder": "+1 (555) 000-0000",
  "organization.locations.field.email": "Email",
  "organization.locations.field.email_placeholder": "location@company.com",
  "organization.locations.field.notes": "Notes",
  "organization.locations.field.notes_placeholder":
    "Any additional details about this location...",
  "organization.locations.action.update": "Update",
  "organization.locations.action.add": "Add Location",
  "organization.locations.no_address": "No address provided",
  "organization.locations.hq_badge": "HQ",
  "organization.locations.type.headquarters": "Headquarters",
  "organization.locations.type.office": "Office",
  "organization.locations.type.store": "Store / Retail",
  "organization.locations.type.warehouse": "Warehouse",
  "organization.locations.type.other": "Other",

  // Business hours
  "organization.business_hours.title": "Business Hours",
  "organization.business_hours.description":
    "Set your organization's operating hours. These are displayed to partners and customers.",
  "organization.business_hours.weekly_title": "Weekly Schedule",
  "organization.business_hours.weekly_description":
    "Toggle each day on or off and set the operating hours.",
  "organization.business_hours.support_title": "Support Availability",
  "organization.business_hours.support_description":
    "Response time expectations and holiday schedule information.",
  "organization.business_hours.response_label": "Support Response Time",
  "organization.business_hours.response_help":
    "Expected response time displayed to partners and customers.",
  "organization.business_hours.response.1h": "Within 1 hour",
  "organization.business_hours.response.4h": "Within 4 hours",
  "organization.business_hours.response.8h": "Within 8 hours",
  "organization.business_hours.response.24h": "Within 24 hours",
  "organization.business_hours.response.48h": "Within 48 hours",
  "organization.business_hours.holiday_label": "Holiday Closure Notice",
  "organization.business_hours.holiday_placeholder":
    "e.g. Closed on all major US holidays",
  "organization.business_hours.holiday_help":
    "A brief note about holiday schedules shown to partners.",
  "organization.business_hours.closed": "Closed",
  "organization.business_hours.to": "to",
  "organization.business_hours.day.monday": "Monday",
  "organization.business_hours.day.tuesday": "Tuesday",
  "organization.business_hours.day.wednesday": "Wednesday",
  "organization.business_hours.day.thursday": "Thursday",
  "organization.business_hours.day.friday": "Friday",
  "organization.business_hours.day.saturday": "Saturday",
  "organization.business_hours.day.sunday": "Sunday",

  // Regional settings
  "organization.regional.title": "Regional Settings",
  "organization.regional.description":
    "Configure language, timezone, currency, and formatting preferences for your organization.",
  "organization.regional.language_section_title": "Language & Timezone",
  "organization.regional.language_section_description":
    "Primary language and timezone used across the platform.",
  "organization.regional.language_label": "Default Language",
  "organization.regional.language_help":
    "Primary language used across the platform and communications.",
  "organization.regional.timezone_label": "Timezone",
  "organization.regional.timezone_help":
    "Used for scheduling, reporting, and displaying times across the platform.",
  "organization.regional.currency_section_title": "Currency & Numbers",
  "organization.regional.currency_section_description":
    "Default currency and number formatting for commissions, payouts, and pricing.",
  "organization.regional.currency_label": "Primary Currency",
  "organization.regional.currency_help":
    "Default currency for commissions, payouts, and product pricing.",
  "organization.regional.number_format_label": "Number Format",
  "organization.regional.formatting_section_title": "Formatting",
  "organization.regional.formatting_section_description":
    "Date display and measurement system preferences.",
  "organization.regional.date_format_label": "Date Format",
  "organization.regional.measurement_label": "Measurement System",
  "organization.regional.measurement_help":
    "Used for product weights, shipping dimensions, and related calculations.",
  "organization.regional.measurement.imperial": "Imperial (lb, oz, in)",
  "organization.regional.measurement.metric": "Metric (kg, g, cm)",

  // Feedback (toasts)
  "organization.feedback.profile_saved": "Profile saved",
  "organization.feedback.general_information_saved":
    "General information saved",
  "organization.feedback.contact_information_saved":
    "Contact information saved",
  "organization.feedback.business_hours_saved": "Business hours saved",
  "organization.feedback.regional_settings_saved": "Regional settings saved",
  "organization.feedback.location_added": "Location added",
  "organization.feedback.location_updated": "Location updated",
  "organization.feedback.location_deleted": "Location deleted",

  // Errors
  "error.organization.save_failed": "Failed to save",
  "error.organization.location_save_failed": "Failed to save location",
  "error.organization.location_delete_failed": "Failed to delete location",
  "error.organization.locations_load_failed": "Failed to load locations",
  "error.organization.location_name_required": "Location name is required",

  // ============================================================
  // Organization — Users (Etapa 1.5.6b-tris Phase ε)
  // ============================================================
  "organization.users.column.name": "Name",
  "organization.users.column.network": "Network",
  "organization.users.column.profile_type": "Profile Type",
  "organization.users.column.roles": "Roles",
  "organization.users.column.status": "Status",
  "organization.users.column.last_login": "Last Login",
  "organization.users.column.created": "Created",
  "organization.users.column.never": "Never",
  "organization.users.column.select_all": "Select all",
  "organization.users.column.select_row": "Select row",
  "organization.users.action.suspend": "Suspend",
  "organization.users.action.activate": "Activate",
  "organization.users.status.active": "Active",
  "organization.users.status.pending": "Pending",
  "organization.users.status.suspended": "Suspended",
  "organization.users.status.terminated": "Terminated",
  "organization.users.network.internal": "Internal",
  "organization.users.network.external": "External",

  // user-table.tsx — header
  "organization.users.header.title": "Members",
  "organization.users.header.description":
    "Manage all members across your network — internal team and external channels.",
  "organization.users.count_label": "member",

  // user-table.tsx — toolbar / filters
  "organization.users.toolbar.search_placeholder": "Search by name or email…",
  "organization.users.toolbar.count": "{count} members",
  "organization.users.filter.network_all": "All Networks",
  "organization.users.filter.status_all": "All Statuses",
  "organization.users.filter.profile_type_all": "All Types",
  "organization.users.filter.role_all": "All Roles",

  // user-table.tsx — actions
  "organization.users.action.add_member": "Add Member",
  "organization.users.action.create_member": "Create Member",
  "organization.users.action.save_changes": "Save Changes",
  "organization.users.action.saving": "Saving…",
  "organization.users.action.reset_password": "Reset Password",
  "organization.users.action.cancel_password_reset": "Cancel password reset",
  "organization.users.action.done": "Done",

  // user-table.tsx — modal (create/edit)
  "organization.users.modal.add_title": "Add Member",
  "organization.users.modal.edit_title": "Edit Member",
  "organization.users.modal.add_description":
    "Add a new member to the network. A temporary password will be generated so they can log in.",
  "organization.users.modal.edit_description":
    "Update this member's details, profile type, and roles.",
  "organization.users.modal.delete_confirm":
    'Delete "{name}"? This cannot be undone.',
  "organization.users.modal.first_name_label": "First Name",
  "organization.users.modal.first_name_placeholder": "First name",
  "organization.users.modal.last_name_label": "Last Name",
  "organization.users.modal.last_name_placeholder": "Last name",
  "organization.users.modal.email_label": "Email",
  "organization.users.modal.email_placeholder": "user@company.com",
  "organization.users.modal.phone_label": "Phone",
  "organization.users.modal.phone_placeholder": "+1 (555) 000-0000",
  "organization.users.modal.password_label": "Password",
  "organization.users.modal.password_hint":
    "(optional — a temp password is generated if left blank)",
  "organization.users.modal.password_placeholder": "Leave blank for auto-generated",
  "organization.users.modal.password_show": "Show password",
  "organization.users.modal.password_hide": "Hide password",
  "organization.users.modal.new_password_label": "New Password",
  "organization.users.modal.new_password_placeholder": "Enter new password",
  "organization.users.modal.profile_type_label": "Profile Type",
  "organization.users.modal.profile_type_placeholder": "Select a profile type…",
  "organization.users.modal.roles_label": "Roles",

  // user-table.tsx — invite (temporary password dialog)
  "organization.users.invite.title": "User Created",
  "organization.users.invite.description":
    "Share these login credentials with {name}. This password will not be shown again.",
  "organization.users.invite.email_label": "Email",
  "organization.users.invite.temp_password_label": "Temporary Password",
  "organization.users.invite.copy_password": "Copy password",

  // user-table.tsx — feedback
  "organization.users.feedback.member_created": "Member created",
  "organization.users.feedback.member_updated": "Member updated",
  "organization.users.feedback.member_deleted": "Member deleted",
  "organization.users.feedback.member_activated": "Member activated",
  "organization.users.feedback.member_suspended": "Member suspended",
  "organization.users.feedback.password_reset": "Password has been reset",
  "organization.users.feedback.password_copied": "Password copied to clipboard",

  // user-table.tsx — errors
  "error.organization.users.required_fields":
    "First name, email, and profile type are required",
  "error.organization.users.save_failed": "Failed to save",

  // ============================================================
  // Organization — Departments (Etapa 1.5.6b-tris Phase ε)
  // ============================================================
  "organization.departments.tree.title": "Departments",
  "organization.departments.tree.description":
    "Manage your organizational structure — divisions, departments, and teams.",
  "organization.departments.tree.add_button": "Add Department",
  "organization.departments.tree.header_department": "Department",
  "organization.departments.tree.header_head": "Head",
  "organization.departments.tree.header_members": "Members",
  "organization.departments.tree.empty":
    "No departments yet. Create your first department to get started.",
  "organization.departments.tree.delete_confirm":
    'Delete "{name}"? Sub-departments will become top-level.',
  "organization.departments.tree.edit_title": "Edit",
  "organization.departments.tree.delete_title": "Delete",

  "organization.departments.detail.back": "Back to Departments",
  "organization.departments.detail.head_label": "Department Head",
  "organization.departments.detail.sub_departments": "Sub-departments",
  "organization.departments.detail.no_sub_departments": "No sub-departments.",
  "organization.departments.detail.members": "Members",
  "organization.departments.detail.no_members": "No members yet.",
  "organization.departments.detail.add": "Add",
  "organization.departments.detail.select_person_placeholder":
    "Select a person...",
  "organization.departments.detail.led_by": "Led by {name}",
  "organization.departments.detail.part_of": "Part of {name}",
  "organization.departments.detail.remove_title": "Remove",

  "organization.departments.form.edit_title": "Edit Department",
  "organization.departments.form.create_title": "Create Department",
  "organization.departments.form.edit_description":
    "Update this department's details.",
  "organization.departments.form.create_description":
    "Add a new department to your organization.",
  "organization.departments.form.name_label": "Name *",
  "organization.departments.form.name_placeholder": "e.g., Engineering",
  "organization.departments.form.description_label": "Description",
  "organization.departments.form.description_placeholder":
    "What does this department do?",
  "organization.departments.form.parent_label": "Parent Department",
  "organization.departments.form.parent_none_placeholder": "None (top-level)",
  "organization.departments.form.parent_none_option": "None (top-level)",
  "organization.departments.form.head_label": "Department Head",
  "organization.departments.form.head_none_placeholder": "No head assigned",
  "organization.departments.form.head_none_option": "No head assigned",
  "organization.departments.form.color_label": "Color",
  "organization.departments.form.color.indigo": "Indigo",
  "organization.departments.form.color.green": "Green",
  "organization.departments.form.color.pink": "Pink",
  "organization.departments.form.color.amber": "Amber",
  "organization.departments.form.color.purple": "Purple",
  "organization.departments.form.color.cyan": "Cyan",
  "organization.departments.form.color.red": "Red",
  "organization.departments.form.color.orange": "Orange",
  "organization.departments.form.save_changes": "Save Changes",
  "organization.departments.form.create_department": "Create Department",
  "organization.departments.form.saving": "Saving...",

  "organization.feedback.department_created": "Department created",
  "organization.feedback.department_updated": "Department updated",
  "organization.feedback.department_deleted": "Department deleted",
  "organization.feedback.member_added": "Member added",
  "organization.feedback.member_removed": "Member removed",

  "error.organization.department_delete_failed": "Failed to delete department",
  "error.organization.member_add_failed": "Failed to add member",
  "error.organization.name_required": "Name is required",

  // ============================================================
  // Org Chart Canvas (Etapa 1.5.6b-tris — Phase ε)
  // ============================================================
  "organization.org_chart.title": "Org Chart",
  "organization.org_chart.description":
    "Interactive view of your internal organizational structure and reporting lines.",
  "organization.org_chart.loading": "Loading org chart…",
  "organization.org_chart.filter.all_departments": "All Departments",
  "organization.org_chart.badge.people_count": "{count} people",

  // ============================================================
  // Network Map Canvas (Etapa 1.5.6b-tris — Phase ε)
  // ============================================================
  "organization.network_map.title": "Network Map",
  "organization.network_map.description":
    "Interactive view of your external network — sponsors, downlines, and partner relationships.",
  "organization.network_map.loading": "Loading network map…",
  "organization.network_map.empty.title": "No external network profiles yet",
  "organization.network_map.empty.description":
    "External partners will appear here once added to the network.",
  "organization.network_map.badge.partners_count": "{count} partners",

  // ============================================================
  // Partners (Etapa 1.5.6b — Phase C)
  // ============================================================
  "partners.list.title": "Partner Network",
  "partners.list.description":
    "Manage partner brands and their tier-specific discount/kickback configurations.",
  "partners.list.empty":
    'No partners yet. Click "New Partner" to add one.',
  "partners.list.tab_partners": "Partners",
  "partners.list.tab_matrix": "Tier Matrix",
  "partners.list.tab_estimator": "Revenue Estimator",
  "partners.list.new_partner": "New Partner",
  "partners.list.import": "Import Spreadsheet",
  "partners.list.export": "Export Spreadsheet",

  "partners.card.kickback_label": "Kickback",
  "partners.card.tier_discounts_label": "Tier Discounts",
  "partners.card.tiers_count": "{count} tiers",
  "partners.card.inactive": "Inactive",

  "partners.form.edit_title": "Edit Partner",
  "partners.form.new_title": "New Partner",
  "partners.form.name": "Name",
  "partners.form.key": "Key",
  "partners.form.key_placeholder": "lowercase_snake_case",
  "partners.form.category": "Category",
  "partners.form.website_url": "Website URL",
  "partners.form.logo_url": "Logo URL",
  "partners.form.url_placeholder": "https://...",
  "partners.form.discount_description": "Discount Description",
  "partners.form.discount_description_placeholder":
    "e.g., 20% off all products for HERD subscribers",
  "partners.form.kickback_type": "Kickback Type",
  "partners.form.kickback_percent": "Kickback %",
  "partners.form.kickback_amount": "Kickback Amount ($)",
  "partners.form.active": "Active",
  "partners.form.update": "Update",
  "partners.form.create": "Create",

  "partners.form.category.supplements": "Supplements",
  "partners.form.category.fitness": "Fitness",
  "partners.form.category.apparel": "Apparel",
  "partners.form.category.nutrition": "Nutrition",
  "partners.form.category.recovery": "Recovery",
  "partners.form.category.technology": "Technology",
  "partners.form.category.other": "Other",

  "partner.kickback_type.NONE": "None",
  "partner.kickback_type.PERCENT_OF_SALE": "% of Sale",
  "partner.kickback_type.FLAT_PER_REFERRAL": "Flat per Referral",
  "partner.kickback_type.FLAT_PER_MONTH": "Flat per Month",

  "partners.kickback.empty":
    "No active partners with kickback agreements. Configure kickbacks on partner cards first.",
  "partners.kickback.inputs_title": "Monthly Referrals by Partner",
  "partners.kickback.inputs_description":
    "Estimate monthly referrals from each partner to see projected kickback costs.",
  "partners.kickback.referrals_unit": "referrals/mo",
  "partners.kickback.results_title": "Kickback Cost Projection",
  "partners.kickback.total_referrals": "Total Referrals/Mo",
  "partners.kickback.monthly_cost": "Monthly Kickback Cost",
  "partners.kickback.annual_cost": "Annual Kickback Cost",
  "partners.kickback.avg_per_referral": "Avg Cost/Referral",
  "partners.kickback.per_partner_breakdown": "Per-Partner Breakdown",
  "partners.kickback.refs_label": "{count} refs",
  "partners.kickback.per_month": "{value}/mo",

  "partners.tier_assignment.empty":
    "No active partners. Create and activate partners first.",
  "partners.tier_assignment.description":
    "Set discount percentages for each partner × tier combination.",
  "partners.tier_assignment.save_all": "Save All",
  "partners.tier_assignment.column_partner": "Partner",

  "partners.feedback.created": "Created",
  "partners.feedback.updated": "Updated",
  "partners.feedback.deleted": "Deleted",
  "partners.feedback.matrix_saved": "Tier assignments saved",

  "error.partners.save_failed": "Failed to save",
  "error.partners.delete_failed": "Failed to delete",
  "error.partners.matrix_save_failed": "Failed to save assignments",

  // ============================================================
  // Profile (Etapa 1.5.6b — Phase C, IDENTITY)
  // ============================================================
  "profile.title": "Profile",
  "profile.description":
    "Manage your personal information and account settings.",
  "profile.section.picture": "Profile Picture",
  "profile.section.personal": "Personal Information",
  "profile.section.account": "Account Details",
  "profile.field.full_name": "Full Name",
  "profile.field.email": "Email Address",
  "profile.field.phone": "Phone Number",
  "profile.field.role": "Role",
  "profile.field.account_id": "Account ID",
  "profile.field.status": "Status",
  "profile.field.created": "Created",
  "profile.field.last_login": "Last Login",
  "profile.placeholder.name": "Your name",
  "profile.placeholder.email": "your@email.com",
  "profile.placeholder.phone": "+1 (555) 123-4567",
  "profile.last_login.label": "Last login: {value}",
  "profile.feedback.updated": "Profile updated",
  "profile.feedback.avatar_updated": "Avatar updated",
  "profile.status.ACTIVE": "Active",
  "profile.status.INVITED": "Invited",
  "profile.status.INACTIVE": "Inactive",

  "error.profile.name_required": "Name is required",
  "error.profile.email_required": "Email is required",
  "error.profile.save_failed": "Failed to save",
  "error.profile.avatar_upload_failed": "Failed to upload avatar",

  // ============================================================
  // Network — Phase 1.5.6b-bis
  // ============================================================

  // Subpanel chrome
  "network.subpanel.title": "Network",
  "network.subpanel.all_members": "All Members",
  "network.subpanel.org_chart": "Org Chart",
  "network.subpanel.network_map": "Network Map",
  "network.subpanel.internal": "Internal Network",
  "network.subpanel.external": "External Network",
  "network.subpanel.no_departments": "No departments yet.",
  "network.subpanel.no_channels": "No channels yet.",
  "network.subpanel.manage": "Manage Network",

  // Manage dialog
  "network.manage.title": "Manage",
  "network.manage.description": "Profile Types and Roles.",
  "network.manage.tab.profiles": "Profile Types",
  "network.manage.tab.roles": "Roles",
  "network.manage.close": "Close",
  "network.manage.new": "New",
  "network.manage.loading": "Loading…",
  "network.manage.none_yet": "None yet.",
  "network.manage.profile_types.description":
    "Profile types define the kind of member (internal role or external channel).",
  "network.manage.profile_types.internal": "Internal Network",
  "network.manage.profile_types.external": "External Network",
  "network.manage.profile_types.confirm_delete":
    'Delete profile type "{name}"? This cannot be undone.',
  "network.manage.profile_types.cannot_delete": "Cannot delete (in use)",
  "network.manage.profile_types.delete": "Delete",
  "network.manage.profile_types.edit": "Edit",
  "network.manage.roles.description":
    "Roles control what members can do across the network.",
  "network.manage.roles.general": "General",
  "network.manage.roles.internal": "Internal Network",
  "network.manage.roles.external": "External Network",
  "network.manage.roles.confirm_delete":
    'Delete role "{name}"? This cannot be undone.',
  "network.manage.roles.system_role": "System role",
  "network.manage.roles.delete": "Delete",
  "network.manage.roles.edit": "Edit",

  // Network type enum
  "network.type.INTERNAL": "Internal",
  "network.type.EXTERNAL": "External",
  "network.type.both": "Both networks",
  "network.type.internal_only": "Internal only",
  "network.type.external_only": "External only",

  // Profile status enum
  "network.profile.status.ACTIVE": "Active",
  "network.profile.status.PENDING": "Pending",
  "network.profile.status.SUSPENDED": "Suspended",
  "network.profile.status.TERMINATED": "Terminated",

  // Profile types — list/table
  "network.profile_types.list.search_placeholder": "Search profile types...",
  "network.profile_types.list.column.name": "Name",
  "network.profile_types.list.column.type": "Type",
  "network.profile_types.list.column.custom_fields": "Custom Fields",
  "network.profile_types.list.column.profiles": "Profiles",
  "network.profile_types.list.column.status": "Status",
  "network.profile_types.list.fields_count": "{count} fields",
  "network.profile_types.list.status.active": "Active",
  "network.profile_types.list.status.inactive": "Inactive",
  "network.profile_types.list.action.edit": "Edit",
  "network.profile_types.list.action.deactivate": "Deactivate",
  "network.profile_types.list.action.activate": "Activate",
  "network.profile_types.list.confirm_deactivate":
    "Deactivate this profile type?",

  // Profile types — detail/form
  "network.profile_types.detail.network_type_label": "Network Type *",
  "network.profile_types.detail.network_type.internal_hint":
    "Employees, managers, sales reps",
  "network.profile_types.detail.network_type.external_hint":
    "Promoters, influencers, trainers",
  "network.profile_types.detail.display_name_label": "Display Name *",
  "network.profile_types.detail.display_name_placeholder":
    "e.g., Regional Manager",
  "network.profile_types.detail.slug_label": "Slug *",
  "network.profile_types.detail.slug_placeholder": "e.g., regional_manager",
  "network.profile_types.detail.slug_hint":
    "Unique identifier. Cannot be changed after creation.",
  "network.profile_types.detail.description_label": "Description",
  "network.profile_types.detail.description_placeholder":
    "Brief description of this profile type",
  "network.profile_types.detail.color_label": "Badge Color",
  "network.profile_types.detail.sort_order_label": "Sort Order",
  "network.profile_types.detail.active_label":
    "Active (visible in wizard and profile creation)",
  "network.profile_types.detail.wizard_fields_label": "Custom Wizard Fields",
  "network.profile_types.detail.wizard_fields_hint":
    "Fields that appear in Step 6 of the profile creation wizard for this type.",
  "network.profile_types.detail.creating": "Creating...",
  "network.profile_types.detail.saving": "Saving...",
  "network.profile_types.detail.create_button": "Create Profile Type",
  "network.profile_types.detail.save_button": "Save Changes",
  "network.profile_types.detail.cancel": "Cancel",

  // Profile types — wizard fields editor
  "network.profile_types.field_editor.empty":
    "No custom fields yet. Add fields to collect profile-specific data.",
  "network.profile_types.field_editor.unnamed": "Unnamed field",
  "network.profile_types.field_editor.required_badge": "required",
  "network.profile_types.field_editor.label_label": "Label *",
  "network.profile_types.field_editor.label_placeholder": "Display label",
  "network.profile_types.field_editor.key_label": "Key *",
  "network.profile_types.field_editor.key_placeholder": "snake_case_key",
  "network.profile_types.field_editor.type_label": "Type",
  "network.profile_types.field_editor.step_label": "Wizard Step",
  "network.profile_types.field_editor.step_2": "Step 2 — Identity",
  "network.profile_types.field_editor.step_3": "Step 3 — Hierarchy",
  "network.profile_types.field_editor.step_6": "Step 6 — Extended Attributes",
  "network.profile_types.field_editor.placeholder_label": "Placeholder",
  "network.profile_types.field_editor.placeholder_hint":
    "Optional placeholder text",
  "network.profile_types.field_editor.required_field": "Required field",
  "network.profile_types.field_editor.options_label": "Options",
  "network.profile_types.field_editor.option_placeholder":
    "Type option and press Enter",
  "network.profile_types.field_editor.add_field": "Add Field",

  // Profile type field types enum
  "network.profile_types.field_type.text": "text",
  "network.profile_types.field_type.email": "email",
  "network.profile_types.field_type.phone": "phone",
  "network.profile_types.field_type.number": "number",
  "network.profile_types.field_type.textarea": "textarea",
  "network.profile_types.field_type.select": "select",
  "network.profile_types.field_type.multi_select": "multi_select",
  "network.profile_types.field_type.toggle": "toggle",
  "network.profile_types.field_type.date": "date",
  "network.profile_types.field_type.url": "url",

  // Roles — list/table
  "network.roles.list.search_placeholder": "Search roles...",
  "network.roles.list.column.role": "Role",
  "network.roles.list.column.slug": "Slug",
  "network.roles.list.column.network": "Network",
  "network.roles.list.column.inherits_from": "Inherits From",
  "network.roles.list.column.members": "Members",
  "network.roles.list.confirm_delete":
    'Delete role "{name}"? This cannot be undone.',
  "network.roles.list.action.edit": "Edit",
  "network.roles.list.action.delete": "Delete",

  // Roles — detail/form
  "network.roles.detail.system_role_title": "System Role",
  "network.roles.detail.system_role_hint":
    "Some fields on system roles cannot be modified.",
  "network.roles.detail.display_name_label": "Display Name *",
  "network.roles.detail.display_name_placeholder": "e.g., Regional Manager",
  "network.roles.detail.slug_label": "Slug *",
  "network.roles.detail.slug_placeholder": "e.g., regional_manager",
  "network.roles.detail.description_label": "Description",
  "network.roles.detail.description_placeholder":
    "What is this role responsible for?",
  "network.roles.detail.network_type_label": "Network Type",
  "network.roles.detail.network_type_placeholder": "Both networks",
  "network.roles.detail.parent_role_label": "Inherits From (Parent Role)",
  "network.roles.detail.parent_role_placeholder": "No parent (top-level role)",
  "network.roles.detail.parent_role_none": "No parent (top-level role)",
  "network.roles.detail.parent_role_hint":
    "This role will inherit all permissions from the parent role.",
  "network.roles.detail.creating": "Creating...",
  "network.roles.detail.saving": "Saving...",
  "network.roles.detail.create_button": "Create Role",
  "network.roles.detail.save_button": "Save Changes",
  "network.roles.detail.cancel": "Cancel",

  // Permissions — matrix
  "network.permissions.matrix.system_title": "System Role",
  "network.permissions.matrix.system_hint":
    "Permissions for system roles cannot be modified.",
  "network.permissions.matrix.saving": "Saving...",
  "network.permissions.matrix.count_of_total": "{assigned} / {total}",

  // Profiles — list/table
  "network.profiles.list.search_placeholder": "Search profiles...",
  "network.profiles.list.column.name": "Name",
  "network.profiles.list.column.network": "Network",
  "network.profiles.list.column.profile_type": "Profile Type",
  "network.profiles.list.column.status": "Status",
  "network.profiles.list.column.rank": "Rank",

  // Wizard — common chrome
  "network.wizard.title": "Wizard",
  "network.wizard.common.step_indicator": "Step {current} of {total}",
  "network.wizard.common.back": "Back",
  "network.wizard.common.next": "Continue",
  "network.wizard.common.finish": "Finish",
  "network.wizard.common.cancel": "Cancel",
  "network.wizard.common.required_field": "Required field",

  // Wizard — short labels in progress bar
  "network.wizard.label.network": "Network",
  "network.wizard.label.identity": "Identity",
  "network.wizard.label.hierarchy": "Hierarchy",
  "network.wizard.label.roles": "Roles",
  "network.wizard.label.comp_plan": "Comp Plan",
  "network.wizard.label.details": "Details",
  "network.wizard.label.review": "Review",
  "network.wizard.label.step_n": "Step {n}",

  // Wizard — Step 1 (Network Type)
  "network.wizard.step1.title": "Network Type",
  "network.wizard.step1.description":
    "Select which network this profile belongs to.",
  "network.wizard.step1.internal_label": "Internal",
  "network.wizard.step1.internal_description":
    "Employees, managers, and sales staff",
  "network.wizard.step1.external_label": "External",
  "network.wizard.step1.external_description":
    "Promoters, influencers, trainers, and partners",
  "network.wizard.step1.select_profile_type": "Select Profile Type",
  "network.wizard.step1.for_network_internal": "for internal network",
  "network.wizard.step1.for_network_external": "for external network",

  // Wizard — Step 2 (Identity)
  "network.wizard.step2.title": "Identity",
  "network.wizard.step2.description": "Basic information for this profile.",
  "network.wizard.step2.first_name_label": "First Name *",
  "network.wizard.step2.first_name_placeholder": "Jane",
  "network.wizard.step2.last_name_label": "Last Name *",
  "network.wizard.step2.last_name_placeholder": "Doe",
  "network.wizard.step2.email_label": "Email Address *",
  "network.wizard.step2.email_placeholder": "jane@example.com",
  "network.wizard.step2.email_taken":
    "This email is already registered in the network.",
  "network.wizard.step2.phone_label": "Phone Number",
  "network.wizard.step2.phone_placeholder": "+1 (555) 000-0000",
  "network.wizard.step2.avatar_label": "Profile Photo",
  "network.wizard.step2.avatar_change": "Change Photo",
  "network.wizard.step2.avatar_upload": "Upload Photo",
  "network.wizard.step2.avatar_remove": "Remove",
  "network.wizard.step2.avatar_hint":
    "PNG, JPG up to 2MB. Stored locally for now.",

  // Wizard — Step 3 (Hierarchy)
  "network.wizard.step3.title": "Hierarchy Placement",
  "network.wizard.step3.description":
    "Set the supervisor and team assignments for this profile.",
  "network.wizard.step3.parent_label": "Supervisor / Upline",
  "network.wizard.step3.parent_optional": "(optional)",
  "network.wizard.step3.parent_search_placeholder":
    "Search by name or email...",
  "network.wizard.step3.searching": "Searching...",
  "network.wizard.step3.teams_label": "Team Assignments",
  "network.wizard.step3.no_teams": "No teams created yet.",
  "network.wizard.step3.team_members_count": "{count} members",

  // Wizard — Step 4 (Roles)
  "network.wizard.step4.title": "Role Assignment",
  "network.wizard.step4.description":
    "Assign roles to control what this profile can access.",
  "network.wizard.step4.perms_count": "{count} perms",
  "network.wizard.step4.no_roles_warning":
    "No roles selected. This profile will have no access permissions.",

  // Wizard — Step 5 (Compensation)
  "network.wizard.step5.title": "Compensation Plan",
  "network.wizard.step5.description":
    "Select the compensation plan for this external network member.",
  "network.wizard.step5.no_plans":
    "No compensation plans configured yet. You can assign one later.",
  "network.wizard.step5.commission_suffix": "commission",

  // Wizard — Step 6 (Attributes)
  "network.wizard.step6.title": "Additional Information",
  "network.wizard.step6.no_fields":
    "No additional fields for this profile type.",
  "network.wizard.step6.description": "Provide details specific to {type}.",
  "network.wizard.step6.description_fallback": "this profile type",
  "network.wizard.step6.select_option": "Select an option",

  // Wizard — Step 7 (Review)
  "network.wizard.step7.title": "Review & Confirm",
  "network.wizard.step7.description":
    "Check everything before creating the profile.",
  "network.wizard.step7.edit": "Edit",
  "network.wizard.step7.section.network_type": "Network & Type",
  "network.wizard.step7.section.identity": "Identity",
  "network.wizard.step7.section.hierarchy": "Hierarchy",
  "network.wizard.step7.section.roles": "Roles",
  "network.wizard.step7.section.compensation": "Compensation",
  "network.wizard.step7.section.attributes": "Additional Information",
  "network.wizard.step7.row.network": "Network",
  "network.wizard.step7.row.profile_type": "Profile Type",
  "network.wizard.step7.row.name": "Name",
  "network.wizard.step7.row.email": "Email",
  "network.wizard.step7.row.phone": "Phone",
  "network.wizard.step7.parent_id": "Parent ID:",
  "network.wizard.step7.no_parent": "No supervisor assigned",
  "network.wizard.step7.teams_assigned": "{count} team(s) assigned",
  "network.wizard.step7.roles_assigned": "{count} role(s) assigned",
  "network.wizard.step7.no_roles": "No roles assigned",
  "network.wizard.step7.comp_plan_selected": "Compensation plan selected",
  "network.wizard.step7.no_comp_plan": "No compensation plan selected",
  "network.wizard.step7.creating": "Creating Profile...",
  "network.wizard.step7.create_button": "Create Profile",

  // Network feedback / errors
  "error.network.unexpected": "An unexpected error occurred",
  "error.network.profile.create_failed":
    "An unexpected error occurred. Please try again.",

  // Promoters — Agreement editor
  "network.promoters.agreement.editor.title.new": "New Partner Agreement",
  "network.promoters.agreement.editor.title.edit": "Edit Agreement",
  "network.promoters.agreement.editor.description":
    "Bundle a commission plan with payout terms and clawback rules.",
  "network.promoters.agreement.editor.field.name.label": "Agreement Name",
  "network.promoters.agreement.editor.field.name.placeholder":
    'e.g. "Apex — Launch 2026"',
  "network.promoters.agreement.editor.field.partner.label": "D2D Partner",
  "network.promoters.agreement.editor.field.partner.placeholder":
    "Select partner",
  "network.promoters.agreement.editor.field.plan.label": "Commission Plan",
  "network.promoters.agreement.editor.field.plan.placeholder": "Select plan",
  "network.promoters.agreement.editor.field.status.label": "Status",
  "network.promoters.agreement.editor.status.draft": "Draft",
  "network.promoters.agreement.editor.status.active": "Active",
  "network.promoters.agreement.editor.status.suspended": "Suspended",
  "network.promoters.agreement.editor.status.terminated": "Terminated",
  "network.promoters.agreement.editor.field.cadence.label": "Payout Cadence",
  "network.promoters.agreement.editor.cadence.weekly": "Weekly",
  "network.promoters.agreement.editor.cadence.biweekly": "Biweekly",
  "network.promoters.agreement.editor.cadence.monthly": "Monthly",
  "network.promoters.agreement.editor.field.hold.label": "Hold Period (days)",
  "network.promoters.agreement.editor.field.effective_from.label":
    "Effective From",
  "network.promoters.agreement.editor.field.notes.label": "Notes",
  "network.promoters.agreement.editor.clawback.title": "Clawback Rules",
  "network.promoters.agreement.editor.clawback.description":
    "If a customer cancels within the window, this % of the upfront bonus is clawed back.",
  "network.promoters.agreement.editor.clawback.add": "Add",
  "network.promoters.agreement.editor.clawback.days_placeholder": "Days",
  "network.promoters.agreement.editor.clawback.days_suffix": "days =",
  "network.promoters.agreement.editor.clawback.percent_placeholder": "%",
  "network.promoters.agreement.editor.clawback.percent_suffix": "% clawback",
  "network.promoters.agreement.editor.submit.create": "Create Agreement",
  "network.promoters.agreement.editor.submit.save": "Save Changes",
  "network.promoters.agreement.editor.submit.saving": "Saving...",
  "network.promoters.agreement.editor.feedback.created": "Agreement created",
  "network.promoters.agreement.editor.feedback.updated": "Agreement updated",

  // Promoters — Commission Plan editor
  "network.promoters.plan.editor.title.new": "New Commission Plan",
  "network.promoters.plan.editor.title.edit": "Edit {name} v{version}",
  "network.promoters.plan.editor.description":
    "Define upfront bonuses and residual rates by subscription tier and role.",
  "network.promoters.plan.editor.field.name.label": "Plan Name",
  "network.promoters.plan.editor.field.name.placeholder": 'e.g. "Launch 2026"',
  "network.promoters.plan.editor.field.active.label": "Active",
  "network.promoters.plan.editor.field.base_residual.label":
    "Base Residual (%)",
  "network.promoters.plan.editor.field.effective_from.label": "Effective From",
  "network.promoters.plan.editor.field.effective_to.label": "Effective To",
  "network.promoters.plan.editor.field.notes.label": "Notes",
  "network.promoters.plan.editor.field.notes.placeholder": "Internal notes...",
  "network.promoters.plan.editor.rates.title": "Rates by Tier & Role",
  "network.promoters.plan.editor.rates.description":
    "Upfront bonus ($) and residual (%) for each role at each subscription tier.",
  "network.promoters.plan.editor.rates.col.tier": "Tier",
  "network.promoters.plan.editor.rates.col.bonus": "Bonus $",
  "network.promoters.plan.editor.rates.col.residual": "Resid %",
  "network.promoters.plan.editor.role.rep": "Rep",
  "network.promoters.plan.editor.role.team_lead": "Team Lead",
  "network.promoters.plan.editor.role.regional_leader": "Regional Leader",
  "network.promoters.plan.editor.submit.create": "Create Plan",
  "network.promoters.plan.editor.submit.save": "Save Changes",
  "network.promoters.plan.editor.submit.saving": "Saving...",
  "network.promoters.plan.editor.feedback.created": "Plan created",
  "network.promoters.plan.editor.feedback.updated": "Plan updated",

  // Promoters — D2D Partner editor
  "network.promoters.d2d_partner.editor.title.new": "New D2D Partner",
  "network.promoters.d2d_partner.editor.title.edit": "Edit D2D Partner",
  "network.promoters.d2d_partner.editor.description":
    "External D2D sales company details.",
  "network.promoters.d2d_partner.editor.field.name.label": "Company Name",
  "network.promoters.d2d_partner.editor.field.name.placeholder":
    "e.g. Apex Door Knockers",
  "network.promoters.d2d_partner.editor.field.active.label": "Active",
  "network.promoters.d2d_partner.editor.field.contact_name.label":
    "Contact Name",
  "network.promoters.d2d_partner.editor.field.email.label": "Email",
  "network.promoters.d2d_partner.editor.field.phone.label": "Phone",
  "network.promoters.d2d_partner.editor.field.notes.label": "Notes",
  "network.promoters.d2d_partner.editor.submit.create": "Create Partner",
  "network.promoters.d2d_partner.editor.submit.save": "Save Changes",
  "network.promoters.d2d_partner.editor.submit.saving": "Saving...",
  "network.promoters.d2d_partner.editor.feedback.created": "Partner created",
  "network.promoters.d2d_partner.editor.feedback.updated": "Partner updated",

  // Promoters — Org Tree editor
  "network.promoters.org_tree.editor.empty":
    "No org nodes yet. Add a Regional Leader to start.",
  "network.promoters.org_tree.editor.placeholder.name": "Name",
  "network.promoters.org_tree.editor.placeholder.email": "Email (optional)",
  "network.promoters.org_tree.editor.action.add": "Add",
  "network.promoters.org_tree.editor.action.cancel": "Cancel",
  "network.promoters.org_tree.editor.action.add_regional_leader":
    "Add Regional Leader",
  "network.promoters.org_tree.editor.title.add_report": "Add report",
  "network.promoters.org_tree.editor.title.remove": "Remove",
  "network.promoters.org_tree.editor.confirm_delete":
    'Remove "{name}" and all their reports?',
  "network.promoters.org_tree.editor.role.rep": "Rep",
  "network.promoters.org_tree.editor.role.team_lead": "Team Lead",
  "network.promoters.org_tree.editor.role.regional_leader": "Regional Leader",
  "network.promoters.org_tree.editor.feedback.added": "Added",
  "network.promoters.org_tree.editor.feedback.removed": "Removed",

  // Promoters — Errors
  "error.network.promoters.agreement.save_failed": "Failed to save agreement",
  "error.network.promoters.plan.save_failed": "Failed to save plan",
  "error.network.promoters.d2d_partner.save_failed": "Failed to save partner",
  "error.network.promoters.org_tree.add_failed": "Failed to add",

  // Promoters — Tab labels
  "network.promoters.tabs.plans": "Plans",
  "network.promoters.tabs.partners": "Partners",
  "network.promoters.tabs.agreements": "Agreements",
  "network.promoters.tabs.overrides": "Overrides",
  "network.promoters.tabs.accelerators": "Accelerators",
  "network.promoters.tabs.ledger": "Ledger",
  "network.promoters.tabs.simulator": "Simulator",

  // Promoters — Accelerators tab
  "network.promoters.accelerators.description":
    "Volume-based bonus escalation. Reps who sell more in a period get higher multipliers on their upfront bonuses.",
  "network.promoters.accelerators.plan_label": "Plan:",
  "network.promoters.accelerators.plan_placeholder": "Select plan",
  "network.promoters.accelerators.section_title": "Performance Tiers",
  "network.promoters.accelerators.add_tier": "Add Tier",
  "network.promoters.accelerators.empty":
    "No performance tiers. All reps earn the base bonus.",
  "network.promoters.accelerators.save_button": "Save Performance Tiers",
  "network.promoters.accelerators.field.label": "Label",
  "network.promoters.accelerators.field.label_placeholder": "Bronze",
  "network.promoters.accelerators.field.min_sales": "Min Sales",
  "network.promoters.accelerators.field.max_sales": "Max Sales",
  "network.promoters.accelerators.field.multiplier": "Multiplier",
  "network.promoters.accelerators.field.bonus_flat": "Flat $",

  // Promoters — Agreements tab
  "network.promoters.agreements.description":
    "Partner agreements bundle a commission plan with clawback rules and payout schedules. Each D2D Partner gets assigned an agreement.",
  "network.promoters.agreements.new_button": "New Agreement",
  "network.promoters.agreements.empty_title": "No agreements yet",
  "network.promoters.agreements.empty_description":
    "Create an agreement to assign a commission plan to a D2D Partner.",
  "network.promoters.agreements.confirm_delete": 'Delete "{name}"?',
  "network.promoters.agreements.clawback_label": "Clawback:",
  "network.promoters.agreements.status.active": "ACTIVE",
  "network.promoters.agreements.status.draft": "DRAFT",
  "network.promoters.agreements.status.suspended": "SUSPENDED",
  "network.promoters.agreements.status.terminated": "TERMINATED",
  "network.promoters.agreements.cadence.weekly": "Weekly",
  "network.promoters.agreements.cadence.biweekly": "Biweekly",
  "network.promoters.agreements.cadence.monthly": "Monthly",
  "network.promoters.agreements.cadence.quarterly": "Quarterly",
  "network.promoters.agreements.metric.payout": "Payout",
  "network.promoters.agreements.metric.hold": "Hold",
  "network.promoters.agreements.metric.hold_days": "{days} days",
  "network.promoters.agreements.metric.effective": "Effective",
  "network.promoters.agreements.metric.ledger": "Ledger",
  "network.promoters.agreements.metric.ledger_entries": "{count} entries",

  // Promoters — Plans tab
  "network.promoters.plans.description":
    "Commission plans define upfront bonuses and residual rates per subscription tier and role. Only one plan can be active at a time.",
  "network.promoters.plans.new_button": "New Plan",
  "network.promoters.plans.empty_title": "No commission plans yet",
  "network.promoters.plans.empty_description":
    "Create your first plan to define how D2D reps earn bonuses and residuals.",
  "network.promoters.plans.confirm_delete": 'Delete "{name} v{version}"?',
  "network.promoters.plans.active_badge": "Active",
  "network.promoters.plans.residual_suffix": "{value} residual",
  "network.promoters.plans.action.duplicate": "Duplicate",
  "network.promoters.plans.action.activate": "Activate",
  "network.promoters.plans.action.deactivate": "Deactivate",
  "network.promoters.plans.metric.residual": "Residual",
  "network.promoters.plans.metric.overrides": "Overrides",
  "network.promoters.plans.metric.overrides_count": "{count} rules",
  "network.promoters.plans.metric.agreements": "Agreements",
  "network.promoters.plans.metric.effective": "Effective",

  // Promoters — Partners (D2D) tab
  "network.promoters.partners.description":
    "External D2D sales companies that sell your subscriptions. Each partner has its own org tree with Regional Leaders, Team Leads, and Reps.",
  "network.promoters.partners.new_button": "New Partner",
  "network.promoters.partners.empty_title": "No D2D Partners yet",
  "network.promoters.partners.empty_description":
    "Add your first D2D sales company to start building org trees.",
  "network.promoters.partners.confirm_delete":
    'Delete "{name}" and all org nodes?',
  "network.promoters.partners.inactive_badge": "Inactive",
  "network.promoters.partners.hide_org_tree": "Hide Org Tree",
  "network.promoters.partners.show_org_tree": "Show Org Tree",
  "network.promoters.partners.people_count": "{count} people",
  "network.promoters.partners.metric.regional": "Regional",
  "network.promoters.partners.metric.team_leads": "Team Leads",
  "network.promoters.partners.metric.reps": "Reps",
  "network.promoters.partners.metric.agreements": "Agreements",

  // Promoters — Ledger tab
  "network.promoters.ledger.description":
    "Every commission event is recorded here: earned, held, released, clawed back, and adjusted.",
  "network.promoters.ledger.empty": "No ledger entries found.",
  "network.promoters.ledger.page_of": "Page {page} of {total}",
  "network.promoters.ledger.entries_count": "{count} entries",
  "network.promoters.ledger.summary.earned": "Earned",
  "network.promoters.ledger.summary.held": "Held",
  "network.promoters.ledger.summary.released": "Released",
  "network.promoters.ledger.summary.clawed_back": "Clawed Back",
  "network.promoters.ledger.entry_type.earned": "Earned",
  "network.promoters.ledger.entry_type.held": "Held",
  "network.promoters.ledger.entry_type.released": "Released",
  "network.promoters.ledger.entry_type.clawed_back": "Clawed Back",
  "network.promoters.ledger.entry_type.adjusted": "Adjusted",
  "network.promoters.ledger.role.rl": "RL",
  "network.promoters.ledger.role.tl": "TL",
  "network.promoters.ledger.role.rep": "Rep",
  "network.promoters.ledger.source.upfront_bonus": "Upfront Bonus",
  "network.promoters.ledger.source.residual": "Residual",
  "network.promoters.ledger.source.override": "Override",
  "network.promoters.ledger.source.accelerator_bonus": "Accelerator",
  "network.promoters.ledger.source.clawback": "Clawback",
  "network.promoters.ledger.source.manual_adjustment": "Manual",
  "network.promoters.ledger.filter.partner": "Partner",
  "network.promoters.ledger.filter.type": "Type",
  "network.promoters.ledger.filter.source": "Source",
  "network.promoters.ledger.filter.all_partners": "All partners",
  "network.promoters.ledger.filter.all_types": "All types",
  "network.promoters.ledger.filter.all_sources": "All sources",
  "network.promoters.ledger.column.date": "Date",
  "network.promoters.ledger.column.person": "Person",
  "network.promoters.ledger.column.partner": "Partner",
  "network.promoters.ledger.column.type": "Type",
  "network.promoters.ledger.column.source": "Source",
  "network.promoters.ledger.column.amount": "Amount",
  "network.promoters.ledger.column.description": "Description",

  // Promoters — Overrides tab
  "network.promoters.overrides.description":
    "When a rep sells, their upline earns overrides. Define the override amount per role level for each plan.",
  "network.promoters.overrides.plan_label": "Plan:",
  "network.promoters.overrides.plan_placeholder": "Select plan",
  "network.promoters.overrides.save_button": "Save Overrides",
  "network.promoters.overrides.role_override_title": "{role} Override",
  "network.promoters.overrides.role.team_lead": "Team Lead",
  "network.promoters.overrides.role.regional_leader": "Regional Leader",
  "network.promoters.overrides.type.flat": "Flat $ per sale",
  "network.promoters.overrides.type.percent_of_bonus": "% of rep bonus",
  "network.promoters.overrides.type.percent_of_revenue": "% of revenue",
  "network.promoters.overrides.field.type": "Override Type",
  "network.promoters.overrides.field.value_flat": "Value ($)",
  "network.promoters.overrides.field.value_percent": "Value (%)",
  "network.promoters.overrides.field.notes": "Notes",
  "network.promoters.overrides.field.notes_placeholder": "Optional",

  // Promoters — Feedback toasts
  "network.promoters.feedback.accelerators_saved": "Performance tiers saved",
  "network.promoters.feedback.agreement_deleted": "Agreement deleted",
  "network.promoters.feedback.plan_activated": "Plan activated",
  "network.promoters.feedback.plan_deactivated": "Plan deactivated",
  "network.promoters.feedback.plan_deleted": "Plan deleted",
  "network.promoters.feedback.plan_duplicated":
    'Created v{version} of "{name}"',
  "network.promoters.feedback.partner_deleted": "Partner deleted",
  "network.promoters.feedback.overrides_saved": "Override rules saved",

  // Promoters — Errors (extended)
  "error.network.promoters.accelerators.save_failed":
    "Failed to save performance tiers",
  "error.network.promoters.plan.delete_with_agreements":
    "Cannot delete a plan with active agreements",
  "error.network.promoters.plan.duplicate_failed": "Failed to duplicate plan",
  "error.network.promoters.partners.delete_with_agreements":
    "Cannot delete partner with active agreements",
  "error.network.promoters.overrides.save_failed": "Failed to save overrides",

  // Network — Promoters page header
  "network.promoters.page.title": "Promoters",
  "network.promoters.page.description":
    "Manage door-to-door promoter commissions — plans, org trees, agreements, and payout tracking.",

  // Network — Permissions page
  "network.permissions.page.title": "Permissions",
  "network.permissions.page.description":
    "System permissions. Assign them to roles in the Roles section.",
  "network.permissions.page.actions_count": "{count} actions",

  // Network — Profile Types list
  "network.profile_types.list.title": "Profile Types",
  "network.profile_types.list.description":
    "Configure the types of profiles in your network and their wizard fields.",
  "network.profile_types.list.new_button": "New Profile Type",

  // Network — Profile Type new
  "network.profile_types.new.title": "New Profile Type",
  "network.profile_types.new.description":
    "Define a new profile category with custom wizard fields.",

  // Network — Profile Type detail
  "network.profile_types.detail.title": "Edit: {name}",
  "network.profile_types.detail.description":
    "Modify profile type settings and wizard fields.",

  // Network — Profiles list
  "network.profiles.list.title": "Profiles",
  "network.profiles.list.description_one": "{count} profile in the network",
  "network.profiles.list.description_other": "{count} profiles in the network",
  "network.profiles.list.add_button": "Add Profile",

  // Network — Profile new
  "network.profiles.new.title": "Add Profile",
  "network.profiles.new.description":
    "Create a new internal or external network member.",

  // Network — Profile detail
  "network.profiles.detail.edit_button": "Edit Profile",
  "network.profiles.detail.email_label": "Email",
  "network.profiles.detail.phone_label": "Phone",
  "network.profiles.detail.supervisor_label": "Supervisor",
  "network.profiles.detail.additional_information": "Additional Information",
  "network.profiles.detail.roles_title": "Roles",
  "network.profiles.detail.no_roles": "No roles assigned",
  "network.profiles.detail.rank_title": "Rank",
  "network.profiles.detail.no_rank": "No rank assigned",
  "network.profiles.detail.compensation_title": "Compensation",
  "network.profiles.detail.no_plan": "No plan assigned",
  "network.profiles.detail.teams_title": "Teams",

  // Network — Roles list
  "network.roles.list.title": "Roles & Permissions",
  "network.roles.list.description":
    "Define roles, set permissions, and control access across your network.",
  "network.roles.list.new_button": "New Role",

  // Network — Role new
  "network.roles.new.title": "New Role",
  "network.roles.new.description":
    "Create a new role with custom permissions.",

  // Network — Role detail
  "network.roles.detail.back_to_roles": "Back to Roles",
  "network.roles.detail.network_type_internal": "Internal",
  "network.roles.detail.network_type_external": "External",
  "network.roles.detail.system_role": "System Role",
  "network.roles.detail.tab_settings": "Role Settings",
  "network.roles.detail.tab_permissions": "Permissions",

  // Forms — Field types (15)
  "forms.field_types.TEXT.label": "Short Text",
  "forms.field_types.TEXT.description": "Single-line text input",
  "forms.field_types.TEXTAREA.label": "Long Text",
  "forms.field_types.TEXTAREA.description": "Multi-line text area",
  "forms.field_types.NUMBER.label": "Number",
  "forms.field_types.NUMBER.description": "Numeric input",
  "forms.field_types.EMAIL.label": "Email",
  "forms.field_types.EMAIL.description": "Email address input",
  "forms.field_types.PHONE.label": "Phone",
  "forms.field_types.PHONE.description": "Phone number input",
  "forms.field_types.DATE.label": "Date",
  "forms.field_types.DATE.description": "Date picker",
  "forms.field_types.TIME.label": "Time",
  "forms.field_types.TIME.description": "Time picker",
  "forms.field_types.SELECT.label": "Dropdown",
  "forms.field_types.SELECT.description": "Single-choice dropdown",
  "forms.field_types.MULTI_SELECT.label": "Multi-Select",
  "forms.field_types.MULTI_SELECT.description":
    "Multiple-choice checkboxes",
  "forms.field_types.CHECKBOX.label": "Checkbox",
  "forms.field_types.CHECKBOX.description": "Single checkbox toggle",
  "forms.field_types.RADIO.label": "Radio",
  "forms.field_types.RADIO.description": "Single-choice radio buttons",
  "forms.field_types.FILE_UPLOAD.label": "File Upload",
  "forms.field_types.FILE_UPLOAD.description": "File attachment",
  "forms.field_types.RATING.label": "Rating",
  "forms.field_types.RATING.description": "Numeric rating scale",
  "forms.field_types.YES_NO.label": "Yes / No",
  "forms.field_types.YES_NO.description": "Binary yes/no toggle",
  "forms.field_types.SIGNATURE.label": "Signature",
  "forms.field_types.SIGNATURE.description": "Signature capture pad",

  // Forms — Statuses (3)
  "forms.statuses.DRAFT.label": "Draft",
  "forms.statuses.ACTIVE.label": "Active",
  "forms.statuses.CLOSED.label": "Closed",

  // Forms — Builder toolbar
  "forms.builder.toolbar.close_form": "Close Form",
  "forms.builder.toolbar.publish": "Publish",
  "forms.builder.toolbar.responses": "Responses",

  // Forms — Builder tabs
  "forms.builder.tabs.builder": "Builder",
  "forms.builder.tabs.settings": "Settings",

  // Forms — Builder body
  "forms.builder.add_section": "Add Section",

  // Forms — Sidebar
  "forms.builder.sidebar.add_field_heading": "Add Field",

  // Forms — Section
  "forms.builder.section.untitled": "Untitled Section",
  "forms.builder.section.empty":
    "No fields yet. Click “Add Field” or use the sidebar.",
  "forms.builder.section.add_field": "Add Field",

  // Forms — Field row & drag previews
  "forms.builder.fields_count_one": "{count} field",
  "forms.builder.fields_count_other": "{count} fields",
  "forms.builder.responses_count_one": "{count} response",
  "forms.builder.responses_count_other": "{count} responses",

  // Forms — Field config dialog
  "forms.builder.field_config.title_edit": "Edit Field",
  "forms.builder.field_config.title_add": "Add Field",
  "forms.builder.field_config.label": "Label",
  "forms.builder.field_config.label_placeholder":
    "e.g. What is your name?",
  "forms.builder.field_config.field_type": "Field Type",
  "forms.builder.field_config.placeholder_label": "Placeholder (optional)",
  "forms.builder.field_config.placeholder_placeholder":
    "Placeholder text shown in the input",
  "forms.builder.field_config.help_text_label": "Help Text (optional)",
  "forms.builder.field_config.help_text_placeholder":
    "Additional instructions for the respondent",
  "forms.builder.field_config.required": "Required",
  "forms.builder.field_config.choices": "Choices",
  "forms.builder.field_config.option_placeholder": "Option {index}",
  "forms.builder.field_config.add_option": "Add Option",
  "forms.builder.field_config.save_changes": "Save Changes",

  // Forms — Builder feedback (toasts)
  "forms.builder.feedback.form_published": "Form published!",
  "forms.builder.feedback.form_closed": "Form closed",

  // Forms — Builder errors
  "error.forms.builder.publish_failed": "Failed to publish form",
  "error.forms.builder.close_failed": "Failed to close form",

  // Forms — List page (chrome)
  "forms.list.title": "Forms",
  "forms.list.description":
    "Intake forms, surveys, and structured data collection templates.",
  "forms.list.create_form": "Create Form",
  "forms.list.import": "Import",
  "forms.list.search_placeholder": "Search by name or description...",
  "forms.list.items_count": "{count} items",
  "forms.list.filter.all_status": "All Status",
  "forms.list.stats.total": "Total",
  "forms.list.stats.active": "Active",
  "forms.list.stats.draft": "Draft",
  "forms.list.stats.total_responses": "Total Responses",

  // Forms — List columns
  "forms.list.column.name": "Name",
  "forms.list.column.status": "Status",
  "forms.list.column.access": "Access",
  "forms.list.column.responses": "Responses",
  "forms.list.column.created": "Created",
  "forms.list.column.open_form": "Open Form",

  // Forms — Access modes
  "forms.access.PUBLIC.label": "Public",
  "forms.access.PRIVATE.label": "Private",

  // Forms — Empty state
  "forms.empty.title": "No forms yet",
  "forms.empty.description":
    "Create intake forms, surveys, and data collection templates. Forms can be shared with partners and customers to gather structured information.",
  "forms.empty.create_first": "Create your first form",
  "forms.empty.list_description":
    "Create a form or import from an external service.",

  // Forms — Create modal
  "forms.create.title": "Create Form",
  "forms.create.tab.blank": "Blank Form",
  "forms.create.tab.templates": "Templates",
  "forms.create.name_label": "Name",
  "forms.create.name_placeholder":
    "e.g. Team Onboarding, Customer Feedback",
  "forms.create.description_label": "Description (optional)",
  "forms.create.description_placeholder": "What is this form for?",
  "forms.create.submit_blank": "Create Blank Form",
  "forms.create.submitting": "Creating...",
  "forms.create.templates_hint":
    "Choose a pre-made template to get started quickly. You can customize it after creation.",

  // Forms — Delete dialog
  "forms.delete.title": "Delete form",
  "forms.delete.confirm_message":
    "Are you sure you want to delete “{name}”? All sections, fields, and responses will be permanently removed. This action cannot be undone.",

  // Forms — Settings (page-level)
  "forms.settings.name_label": "Form Name",
  "forms.settings.description_label": "Description",
  "forms.settings.description_placeholder": "Describe what this form is for",
  "forms.settings.thank_you_label": "Thank You Message",
  "forms.settings.thank_you_placeholder":
    "Shown after the form is submitted",
  "forms.settings.access_mode_label": "Access Mode",
  "forms.settings.access_mode.public": "Public (anyone with the link)",
  "forms.settings.access_mode.private": "Private (password required)",
  "forms.settings.access_password_label": "Access Password",
  "forms.settings.access_password_placeholder":
    "Enter a password for form access",
  "forms.settings.max_responses_label": "Max Responses (optional)",
  "forms.settings.max_responses_placeholder": "Leave empty for unlimited",
  "forms.settings.save_button": "Save Settings",

  // Forms — Responses (table + detail)
  "forms.responses.back_to_form": "Back to Form",
  "forms.responses.title": "Responses — {name}",
  "forms.responses.description_one": "{count} total response",
  "forms.responses.description_other": "{count} total responses",
  "forms.responses.search_placeholder": "Search by name or email...",
  "forms.responses.column.submitter": "Submitter",
  "forms.responses.column.status": "Status",
  "forms.responses.column.submitted": "Submitted",
  "forms.responses.column.view_response": "View Response",
  "forms.responses.anonymous": "Anonymous",
  "forms.responses.detail.title": "Response Detail",
  "forms.responses.detail.submitter": "Submitter:",
  "forms.responses.detail.submitted": "Submitted:",
  "forms.responses.status.PENDING": "Pending",
  "forms.responses.status.PROCESSING": "Processing",
  "forms.responses.status.READY": "Processed",
  "forms.responses.status.ERROR": "Error",
  "forms.responses.value.yes": "Yes",
  "forms.responses.value.no": "No",

  // Forms — Templates (catalog UI)
  "forms.templates.field_count_one": "{count} field",
  "forms.templates.field_count_other": "{count} fields",
  "forms.templates.use_template": "Use Template",
  "forms.templates.category.Internal": "Internal",
  "forms.templates.category.Customer": "Customer",
  "forms.templates.category.Partners": "Partners",
  "forms.templates.category.Events": "Events",
  "forms.templates.category.Support": "Support",
  "forms.templates.team-onboarding.name":
    "Team Onboarding Questionnaire",
  "forms.templates.team-onboarding.description":
    "Collect essential information from new team members during onboarding.",
  "forms.templates.customer-feedback.name": "Customer Feedback Survey",
  "forms.templates.customer-feedback.description":
    "Gather feedback from customers about their experience with your products or services.",
  "forms.templates.partner-application.name": "Partner Application Form",
  "forms.templates.partner-application.description":
    "Intake form for prospective partners or affiliates applying to your program.",
  "forms.templates.product-interest.name": "Product Interest Survey",
  "forms.templates.product-interest.description":
    "Understand customer interest in your products, pricing sensitivity, and feature priorities.",
  "forms.templates.event-registration.name": "Event Registration Form",
  "forms.templates.event-registration.description":
    "Collect registrations and preferences for events, webinars, or meetups.",
  "forms.templates.nps-survey.name": "NPS Survey",
  "forms.templates.nps-survey.description":
    "Net Promoter Score survey — quick single-question format with follow-up.",
  "forms.templates.support-ticket.name": "Support Ticket Form",
  "forms.templates.support-ticket.description":
    "Structured support request intake with categorization and severity.",
  "forms.templates.knowledge-contribution.name":
    "Knowledge Contribution Form",
  "forms.templates.knowledge-contribution.description":
    "Allow team members or community to submit knowledge articles, tips, or resources.",

  // Forms — Import modal
  "forms.import.title": "Import Form",
  "forms.import.format_label": "Format",
  "forms.import.file_label": "File",
  "forms.import.format.google_forms.label": "Google Forms (JSON)",
  "forms.import.format.google_forms.description":
    "Export your Google Form as JSON",
  "forms.import.format.typeform.label": "Typeform (JSON)",
  "forms.import.format.typeform.description":
    "Export your Typeform as JSON",
  "forms.import.format.surveymonkey.label": "SurveyMonkey (CSV)",
  "forms.import.format.surveymonkey.description":
    "Export survey results as CSV",
  "forms.import.click_to_select": "Click to select a {accept} file",
  "forms.import.file_size_kb": "({size} KB)",
  "forms.import.submit": "Import Form",
  "forms.import.submitting": "Importing...",

  // Forms — Feedback toasts
  "forms.feedback.form_created": "Form created",
  "forms.feedback.form_deleted": "Form deleted",
  "forms.feedback.settings_saved": "Settings saved",
  "forms.feedback.response_deleted": "Response deleted",
  "forms.feedback.template_applied": "Form created from template",
  "forms.import.feedback.imported_successfully":
    "Form imported successfully",

  // Forms — Errors
  "error.forms.name_required": "Name is required",
  "error.forms.create_failed": "Failed to create form",
  "error.forms.delete_failed": "Failed to delete form",
  "error.forms.update_failed": "Failed to save settings",
  "error.forms.response_delete_failed": "Failed to delete response",
  "error.forms.template_apply_failed":
    "Failed to create form from template",
  "error.forms.import.no_file_selected": "Please select a file",
  "error.forms.import.failed": "Failed to import form",

  // ============================================================
  // Tables Admin (Phase 1.5.6d-β.1)
  // ============================================================

  // Tables — Field types
  "tables.field_types.singleLineText.label": "Single line text",
  "tables.field_types.singleLineText.description":
    "Single line text input",
  "tables.field_types.multilineText.label": "Long text",
  "tables.field_types.multilineText.description": "Multiline text area",
  "tables.field_types.number.label": "Number",
  "tables.field_types.number.description": "Numeric input",
  "tables.field_types.currency.label": "Currency",
  "tables.field_types.currency.description":
    "Monetary value with symbol",
  "tables.field_types.percent.label": "Percent",
  "tables.field_types.percent.description": "Percentage value",
  "tables.field_types.singleSelect.label": "Single select",
  "tables.field_types.singleSelect.description":
    "Choose one option from a list",
  "tables.field_types.multiSelect.label": "Multi-select",
  "tables.field_types.multiSelect.description":
    "Choose multiple options from a list",
  "tables.field_types.checkbox.label": "Checkbox",
  "tables.field_types.checkbox.description": "True or false",
  "tables.field_types.date.label": "Date",
  "tables.field_types.date.description": "Calendar date",
  "tables.field_types.url.label": "URL",
  "tables.field_types.url.description": "Web page address",
  "tables.field_types.email.label": "Email",
  "tables.field_types.email.description": "Email address",
  "tables.field_types.linkedRecord.label": "Linked record",
  "tables.field_types.linkedRecord.description":
    "Link to records in another table",
  "tables.field_types.media.label": "Media",
  "tables.field_types.media.description": "Images or videos",
  "tables.field_types.attachment.label": "Attachment",
  "tables.field_types.attachment.description": "Attached files",
  "tables.field_types.createdTime.label": "Created time",
  "tables.field_types.createdTime.description":
    "Record creation date and time",
  "tables.field_types.lastModifiedTime.label": "Last modified time",
  "tables.field_types.lastModifiedTime.description":
    "Date and time of the last modification",
  "tables.field_types.autoNumber.label": "Auto number",
  "tables.field_types.autoNumber.description":
    "Automatically incremented number",
  "tables.field_types.formula.label": "Formula",
  "tables.field_types.formula.description":
    "Value computed from other fields",
  "tables.field_types.rollup.label": "Rollup",
  "tables.field_types.rollup.description":
    "Aggregation over linked records",
  "tables.field_types.lookup.label": "Lookup",
  "tables.field_types.lookup.description":
    "Value looked up in linked records",
  "tables.field_types.count.label": "Count",
  "tables.field_types.count.description": "Number of linked records",

  // Tables — Cells
  "tables.cells.text.aria_label": "Edit text",
  "tables.cells.number.aria_label": "Edit number",
  "tables.cells.date.aria_label": "Edit date",
  "tables.cells.url.aria_label_url": "Edit URL",
  "tables.cells.url.aria_label_email": "Edit email",
  "tables.cells.checkbox.checked": "Checked",
  "tables.cells.checkbox.unchecked": "Unchecked",
  "tables.cells.select.no_choices_configured": "No choices configured",
  "tables.cells.linked_record.id_preview": "{id}…",
  "tables.cells.linked_record.overflow_count": "+{count}",
  "tables.cells.media.empty_state": "No media",
  "tables.cells.media.uploading": "Uploading…",
  "tables.cells.media.add_more": "Add more",
  "tables.cells.media.drop_or_click": "Drop files or click",
  "tables.cells.media.remove": "Remove",
  "tables.cells.media.previous": "Previous",
  "tables.cells.media.next": "Next",
  "tables.cells.media.gallery_position": "{current} / {total}",
  "tables.cells.media.thumbnail_aria": "Thumbnail {index}",
  "tables.cells.media.overflow_count": "+{count}",
  "tables.cells.media.files_count": "{count} files",
  "tables.cells.media.file_input_label": "Select files",

  // Tables — Toolbar
  "tables.toolbar.search_placeholder": "Search records…",
  "tables.toolbar.search_aria": "Search records",
  "tables.toolbar.records_count": "{count} records",
  "tables.toolbar.records_count_filtered": "{shown} / {total} records",
  "tables.toolbar.add_field": "Field",
  "tables.toolbar.add_record": "Record",

  // Tables — Grid
  "tables.grid.column_header.drag_handle": "Reorder column",
  "tables.grid.column_header.primary_key_short": "PK",
  "tables.grid.column_header.primary_key_title": "Primary key",
  "tables.grid.column_header.row_number_title": "Row number",
  "tables.grid.row.drag_handle": "Reorder row",
  "tables.grid.row.delete_record": "Delete record",
  "tables.grid.footer.new_record": "New record",
  "tables.grid.empty.no_search_match": "No records match your search",

  // Tables — View
  "tables.view.back_to_tables": "Back to Tables",
  "tables.view.no_description": "No description",
  "tables.view.process_button": "Process",
  "tables.view.processing_badge": "Processing…",
  "tables.view.add_field": "Add field",
  "tables.view.fields_count": "{count} fields",
  "tables.view.records_count": "{count} records",
  "tables.view.chunks_count": "{count} chunks",
  "tables.view.status.pending": "Pending",
  "tables.view.status.processing": "Processing",
  "tables.view.status.ready": "Ready",
  "tables.view.status.error": "Error",

  // Tables — Field config modal
  "tables.field_config.title_add": "Add field",
  "tables.field_config.title_edit": "Edit field",
  "tables.field_config.name_label": "Name",
  "tables.field_config.name_placeholder": "e.g. Price, Status, Email",
  "tables.field_config.type_label": "Type",
  "tables.field_config.description_label": "Description (optional)",
  "tables.field_config.description_placeholder":
    "What does this field store?",
  "tables.field_config.precision_label": "Decimal precision",
  "tables.field_config.precision_integer": "0 (integer)",
  "tables.field_config.currency_symbol_label": "Currency symbol",
  "tables.field_config.choices_label": "Choices",
  "tables.field_config.add_choice": "Add choice",
  "tables.field_config.add_choice_placeholder": "Add a choice…",
  "tables.field_config.remove_choice": "Remove choice",
  "tables.field_config.link_to_table_label": "Link to table",
  "tables.field_config.no_tables_available":
    "No other tables available to link to. Create another table first.",
  "tables.field_config.select_table_placeholder": "Select a table…",
  "tables.field_config.required_field": "Required field",
  "tables.field_config.add_button": "Add field",
  "tables.field_config.update_button": "Update field",
  "tables.field_config.adding": "Adding…",
  "tables.field_config.updating": "Updating…",

  // Tables — Feedback toasts
  "tables.feedback.record_deleted": "Record deleted",
  "tables.feedback.field_added": "Field added",
  "tables.feedback.field_updated": "Field updated",
  "tables.feedback.processed_for_knowledge":
    "Table processed for knowledge base",

  // Tables — Errors
  "error.tables.upload_failed": "Upload failed",
  "error.tables.processing_failed": "Processing failed",
  "error.tables.record_add_failed": "Failed to add record",
  "error.tables.cell_save_failed": "Failed to save",
  "error.tables.column_reorder_failed": "Failed to reorder columns",
  "error.tables.row_reorder_failed": "Failed to reorder rows",
  "error.tables.field_name_required": "Field name is required",
  "error.tables.linked_table_required": "Please select a table to link to",
  "error.tables.field_create_failed": "Failed to add field",
  "error.tables.field_update_failed": "Failed to update field",
  "error.tables.unexpected_error": "An unexpected error occurred",

  // Tables — Import (Airtable)
  "tables.import.airtable.header.title": "Import from Airtable",
  "tables.import.airtable.header.step_1_base": "1. Base",
  "tables.import.airtable.header.step_2_table": "2. Table",
  "tables.import.airtable.header.step_3_fields": "3. Fields",
  "tables.import.airtable.header.step_4_import": "4. Import",
  "tables.import.airtable.steps.bases.intro":
    "Select an Airtable base to import from.",
  "tables.import.airtable.steps.bases.loading": "Loading bases…",
  "tables.import.airtable.steps.bases.empty":
    "No bases found. Make sure your Airtable token has access to at least one base.",
  "tables.import.airtable.steps.tables.intro": "Select a table to import.",
  "tables.import.airtable.steps.tables.loading": "Loading tables…",
  "tables.import.airtable.steps.tables.fields_count": "{count} fields",
  "tables.import.airtable.steps.tables.fields_count_with_description":
    "{count} fields — {description}",
  "tables.import.airtable.steps.mapping.intro":
    "Review field mappings. Adjust types, rename fields, or skip fields you don't need.",
  "tables.import.airtable.steps.mapping.col_airtable_field":
    "Airtable Field",
  "tables.import.airtable.steps.mapping.col_herd_type": "HERD Type",
  "tables.import.airtable.steps.mapping.col_herd_name": "HERD Name",
  "tables.import.airtable.steps.mapping.col_skip": "Skip",
  "tables.import.airtable.steps.mapping.fields_selected":
    "{active} of {total} fields selected",
  "tables.import.airtable.steps.mapping.import_button": "Import {table}",
  "tables.import.airtable.steps.progress.importing": "Importing {table}…",
  "tables.import.airtable.steps.progress.records_imported":
    "{count} records imported",
  "tables.import.airtable.steps.progress.do_not_close":
    "This may take a few minutes for large tables. Do not close this dialog.",
  "tables.import.airtable.steps.progress.error_title": "Import Failed",
  "tables.import.airtable.steps.progress.error_unknown":
    "An unknown error occurred",
  "tables.import.airtable.steps.progress.partial_imported":
    "{count} records were imported before the error.",
  "tables.import.airtable.steps.progress.success_title": "Import Complete",
  "tables.import.airtable.steps.progress.success_summary":
    "Successfully imported {count} records from {table}.",
  "tables.import.airtable.navigation.view_table": "View Table",
  "error.tables.import.airtable.load_bases_failed": "Failed to load bases",
  "error.tables.import.airtable.connect_failed":
    "Failed to connect to Airtable",
  "error.tables.import.airtable.load_tables_failed":
    "Failed to load tables",
  "error.tables.import.airtable.fetch_tables_failed":
    "Failed to fetch tables",
  "error.tables.import.airtable.import_failed": "Import failed",
  "error.tables.import.airtable.start_failed": "Failed to start import",
};
