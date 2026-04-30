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
};
