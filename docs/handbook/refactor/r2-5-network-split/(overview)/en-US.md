> For AI agents: this entry documents the R2.5 mini-spec (Network split). Status: draft (planned). Before starting R2.5 execution, re-read this entry and the foundation established in R2.

# R2.5 — Network Split (Organization + Directory)

R2.5 splits the current top-level Network into two distinct top-level features: Organization (institutional structure) and Directory (people structure). Includes channel disambiguation (URL `/admin/network/channels/` frees the term "channel" for messaging).

## Business

The current Network mixes two natures: institutional structure (multimarket → market → company → departments → institutional channels) and people structure (profiles, types, roles, permissions, promoters, onboarding/invites). Both are independently commercializable — holdings, franchises and multinationals need their own institutional structure; people need an autonomous directory. Keeping both bundled as "Network" masks two distinct value propositions and hinders evolution.

## Product

Users will see two distinct sidebar items in place of "Network":

- **Organization** — institutional structure: multimarket/market/company hierarchy, institutional channels, departments.
- **Directory** — people: profiles, types, roles, permission matrix, promoters, onboarding/invites.

Institutional channels (org channels) live in Organization. Messaging channels remain separate — do not conflate the two concepts.

## Architecture

### Organization (top-level feature)

- multimarket → market → company hierarchy.
- Institutional channels.
- Departments.
- Prisma models with the `Network*` prefix move semantically to Organization (no model rename in this stage — schema refactor is a separate future stage).

### Directory (top-level feature)

- NetworkProfile.
- Profile types.
- Roles.
- Permission matrix.
- Promoters.
- Onboarding/invites.

### Channel disambiguation

Rename URL `/admin/network/channels/` to `/admin/directory/external-profile-types/` (frees "channel" for messaging, the canonical usage going forward).

### Sidebar

Two new items (Organization, Directory) replace the current Network item.

### Pre-condition

R2 (top-level features foundation) establishes the real FeatureManifest type + featureRegistry. R2.5 produces the first two `kind: "top_level_feature"` manifests: `organization.feature.ts` and `directory.feature.ts`.

## Operations

- i18n namespace split: `network.*` → `organization.*` + `directory.*`. Migrate keys mechanically; deprecate `network.*` at the end.
- Profile creation workflow moves to Directory.
- Department configuration workflow stays in Organization.
- `api/network/*` endpoints split into `api/organization/*` + `api/directory/*` per conceptual owner.

## Glossary

- **Organization**: top-level feature with institutional structure (multimarket, market, company, departments, institutional channels).
- **Directory**: top-level feature with people structure (profiles, roles, permissions, promoters, onboarding).
- **Profile**: person entry in the Directory.
- **ProfileType**: typed classification of profiles (internal vs external, operational roles).
- **Channel**: polysemous term — in Organization it means institutional channel (organizational); in messaging it means communication channel. Critical distinction.
- **Promoter**: special profile — internal promoter (employee) vs external promoter (partner referrer).

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned for R2.5 (after R2 establishes the top-level foundation).
