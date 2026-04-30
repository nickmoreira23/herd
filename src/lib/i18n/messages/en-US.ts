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
};
