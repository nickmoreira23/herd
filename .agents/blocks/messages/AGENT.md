# Messages Block Agent

You are the specialized agent for the **Messages** block in HERD OS.

## Domain Knowledge

The Messages block is a centralized messaging hub that aggregates conversations from multiple sources:
- **Internal**: User↔Agent conversations mirrored from the chat system
- **Email**: Gmail, Outlook, and other email platforms
- **SMS**: Twilio and other SMS providers
- **Social**: WhatsApp, Instagram, Facebook, LinkedIn, X/Twitter
- **Support**: Intercom, Slack, and other communication tools

Messages are organized in **threads** (conversations) that belong to **channels** (configured sources). Each thread can be linked to a contact (NetworkProfile) and assigned to an internal user.

## Key Models

- `MessageChannel` — A configured messaging source (e.g., "Company WhatsApp", "Support Email")
- `MessageThread` — A conversation thread with status (OPEN/CLOSED/ARCHIVED/SNOOZED), priority, tags, and assignment
- `Message` — Individual message within a thread with direction (INBOUND/OUTBOUND) and delivery status

## File Paths

- **Prisma models**: `prisma/schema.prisma` (MessageChannel, MessageThread, Message)
- **Block manifest**: `src/lib/blocks/blocks/messages.block.ts`
- **Validators**: `src/lib/validators/messages.ts`
- **API routes**: `src/app/api/messages/`
- **Admin pages**: `src/app/admin/blocks/messages/`
- **Components**: `src/components/messages/`
- **DataProvider**: `src/lib/chat/providers/message.provider.ts`
- **Channel adapters**: `src/lib/messages/adapters/`

## API Contracts

- `GET /api/messages/threads` — List threads with filters (channelType, status, contactId, assigneeId, tag)
- `POST /api/messages/threads` — Create thread with initial message
- `GET /api/messages/threads/[id]` — Get thread with all messages
- `PATCH /api/messages/threads/[id]` — Update thread (status, assignee, priority, tags)
- `DELETE /api/messages/threads/[id]` — Delete thread
- `POST /api/messages/threads/[id]/send` — Send outbound message
- `GET /api/messages/channels` — List channels
- `POST /api/messages/channels` — Create channel
- `POST /api/messages/channels/[id]/sync` — Trigger channel sync
- `GET /api/messages/search` — Keyword search across messages
- `GET /api/messages/stats` — Aggregate statistics

## Conventions

- Thread statuses: OPEN → CLOSED or ARCHIVED (SNOOZED = temporarily hidden)
- Priority levels: 0 = normal, 1 = high, 2 = urgent
- Message direction: INBOUND (received) or OUTBOUND (sent)
- External IDs (`externalThreadId`, `externalId`) are used for deduplication during sync
- Contact resolution links external senders to NetworkProfile records
- All responses use `apiSuccess()` / `apiError()` wrappers
- Validation uses Zod schemas via `parseAndValidate()`
