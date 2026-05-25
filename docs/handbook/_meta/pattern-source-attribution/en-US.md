---
title: "Pattern: Source Attribution"
description: "Polymorphic source field on every event pointing to the originating record — drill-down, audit, reversal."
locale: en-US
uid: herd.meta.pattern-source-attribution
---

> For AI agents: this pattern is a critical invariant. When creating an events block in any tool, always include the polymorphic `source` field. Without it, drill-down and reversal become impossible. Decisions settled in the May 2026 architectural session.

# Pattern: Source Attribution

Every events block in any ComeçaAI tool carries a **polymorphic `source` field** pointing to the originating record that caused the event. The source identifies three things: the originating block (`source_block`), the specific record id (`source_id`), and the type of event that occurred (`source_type`). Without this attribution, three critical capabilities become impossible: drill-down, audit, and automatic reversal.

## Business

The motivation is trust. Systems that touch remuneration, points, recognition, and ranking only survive audit if every movement can be traced back to the business event that caused it. When a profile asks "how did I earn these 30 points?", the system needs to answer with the specific sale, in the specific product, for the specific customer — not with a generic explanation.

The consequence is twofold. For the profile, source attribution generates **operable transparency**: clicking the effect opens the cause. For the company, it generates **auditability**: every cent paid in commission, every point credited, every ranking position can be justified by traceable evidence. And when something goes wrong (sale canceled, chargeback, fraud detected), source attribution enables **automatic chained reversal** — the system knows which events derived from that sale and can revert them without manual intervention.

## Product

### Drill-down in action

Profile opens their Points balance and sees a line "Earned 30 pts from the sale of Moon Milk to Arthur on 2026-04-15". Clicks. The system uses the source to open the original sale in Marketplace — product, customer, value, date, seller. Profile understands exactly how the point was generated.

The same pattern crosses all progression tools:

- **Recognition event** with source pointing to `capacitation-events` — "Leveled up from Bronze to Silver on 2026-03-10" → click → opens the completed course that triggered the progression.
- **Remuneration event** with source pointing to `marketplace-orders` — "Commission of R$ 45 paid on 2026-04-01" → click → opens the original order.
- **Ranking points event** with source pointing to `products-sales` — "Ranking points credited on 2026-04-15" → click → opens the sale that generated them.

### Automatic reversal

When the originating event is canceled, all derived events can be automatically reverted. A canceled sale in Marketplace triggers a cascade: the corresponding points-event is reverted (compensating entry), the corresponding remuneration-event is reverted, recognition progress is recomputed if applicable. All via source attribution — the system knows which events point to the canceled sale.

## Architecture

### Source field schema

Every block with the `-events` suffix (see `pattern-block-level`) carries `source` as an embedded field:

```typescript
event {
  id, profile_id, value, occurred_at,
  source: {
    source_block: "products-sales" | "marketplace-orders" | "knowledge-content" | …
    source_id: <FK to specific record>
    source_type: "sale-completed" | "course-completed" | "order-paid" | …
  }
}
```

The three fields have distinct responsibilities:

- **`source_block`**: UID of the originating block. Ex: `herd.block.commerce.products-sales` or `herd.block.commerce.marketplace-orders`.
- **`source_id`**: id (FK) of the specific record inside that block. Points to the exact sale, the exact course, the exact order.
- **`source_type`**: discriminator of the event type inside the source_block. The same block can generate multiple event types (`sale-completed`, `sale-refunded`, `sale-amended`).

### Formalized cross-tool data flow

Source attribution formalizes data flow between tools as an explicit invariant:

| Source tool | Destination tool | Cross-tool kind |
|---|---|---|
| Marketplace | Remuneration | paid order generates commission event |
| Marketplace | Points | paid order generates points event |
| Marketplace | Ranking | paid order generates ranking-points event |
| Knowledge | Capacitation | course completion generates capacitation event |
| Capacitation | Recognition | level-up in capacitation generates recognition progress |
| Marketplace | Recognition | sale fulfills recognition track criteria |

Each arrow in this table becomes a formal `source_block` + `source_type` pair on the destination tool's events. This lets tools be **observers of other tools' events** without rigid coupling — each one knows which source patterns to listen for.

### Reversal via source

Reversal is mechanical:

1. The originating event is marked canceled/refunded in its owning tool.
2. The cascade handler searches by `source_block` + `source_id` across all `-events` blocks in the platform.
3. For each derived event found, it generates a **compensating entry** (an event with the value inverted + source pointing to the original).
4. Tools observe compensating entries and update balances/progress/positions.

Critical: never delete events. Reversal is always via compensating entry — preserves the audit trail.

## Operations

### Checklist for creating an events block

1. **`-events` suffix**: the block id follows the convention (e.g., `points-events`, `recognition-events`, `remuneration-events`). See `pattern-block-level`.
2. **Mandatory `source` field**: include it as an embedded type with `source_block` + `source_id` + `source_type`.
3. **`source_block` validation**: must reference a valid UID of an existing block. Add validation on insert.
4. **`source_id` validation**: valid FK at event creation time. No orphan events allowed.
5. **Document accepted `source_type` values**: each source_block has an enumerated set of possible source_types.
6. **Reversal handler**: when the originating block allows cancellation/refund, define a handler that searches for derived events via source attribution and generates compensating entries.
7. **Ledger cross-cuts**: events that involve money (remuneration-events) also become journal-entries in the Ledger via parallel source attribution.

### Anti-patterns to avoid

- **Event without source**: creating `points-events` without the source field. Breaks audit trail and drill-down.
- **Generic source**: using a free-form string instead of the structured triple (`source_block` + `source_id` + `source_type`). Breaks validation and automatic cascade.
- **Source duplicating data**: copying the sale's value inside the points-event. Wrong: source points, doesn't copy. Edits to the original sale reflect via FK.
- **Deleting events instead of reverting**: erasing an event breaks history. Always compensating entry.

## Glossary

- **source-attribution**: architectural pattern where every event carries a polymorphic reference to its originating record.
- **polymorphic-reference**: reference composed of (block_uid + id + type) that points to varied record types.
- **source-block**: source field pointing to the UID of the block where the originating record lives.
- **source-id**: source field pointing to the FK of the specific originating record.
- **source-type**: discriminator of the event type inside the source_block (e.g., sale-completed, sale-refunded).
- **drill-down**: navigation from the effect (derived event) to the cause (originating record).
- **audit-trail**: traceable history of events with identifiable origin, used for audit.
- **reversal-cascade**: automatic propagation of a reversal from an original event to all derived events, via source attribution.
- **compensating entry**: event with inverted value that neutralizes the effect of a prior event — preserves the audit trail (does not delete).

## Changelog

- **2026-05-04 (v1.0)** — Pattern settled in the R2.5 expanded architectural session (May 2026). Establishes source attribution as a mandatory invariant in every `-events` block. Enables drill-down, audit-trail, and automatic reversal-cascade. Cross-tool flow formalized via (source_block, source_type) pairs.
