> Para agentes de IA: esta entrada documenta a mini-spec de R2.5 (Network split). Status: draft (planned). Antes de iniciar execução de R2.5, releia esta entry e a foundation cravada em R2.

# R2.5 — Network Split (Organization + Directory)

R2.5 split o top-level Network atual em duas top-level features distintas: Organization (estrutura institucional) e Directory (estrutura de pessoas). Inclui channel disambiguation (URL `/admin/network/channels/` libera o termo "channel" para messaging).

## Business

Network atual mistura duas naturezas: estrutura institucional (multimarket → market → company → departments → channels institucionais) e estrutura de pessoas (profiles, types, roles, permissions, promoters, onboarding/invites). Ambas são commercializáveis independentemente — holdings, franquias e multinacionais precisam estrutura institucional própria; pessoas precisam um directory autônomo. Manter as duas embaladas como "Network" mascara duas propostas de valor distintas e dificulta evolução.

## Product

Usuário verá dois sidebar items distintos no lugar de "Network":

- **Organization** — institutional structure: hierarchy multimarket/market/company, channels institucionais, departments.
- **Directory** — people: profiles, types, roles, permission matrix, promoters, onboarding/invites.

Channels institucionais (org channels) ficam em Organization. Channels de messaging continuam separados — não confundir os dois conceitos.

## Architecture

### Organization (top-level feature)

- Hierarchy multimarket → market → company.
- Channels institucionais.
- Departments.
- Models Prisma com prefixo `Network*` movem semanticamente para Organization (sem rename de model nesta etapa — refator de schema é etapa separada futura).

### Directory (top-level feature)

- NetworkProfile.
- Profile types.
- Roles.
- Permission matrix.
- Promoters.
- Onboarding/invites.

### Channel disambiguation

Renomear URL `/admin/network/channels/` para `/admin/directory/external-profile-types/` (libera "channel" para messaging, que é o uso canônico daqui em diante).

### Sidebar

Dois items novos (Organization, Directory) substituem o item Network atual.

### Pré-condição

R2 (top-level features foundation) cravou FeatureManifest type real + featureRegistry. R2.5 produz dois primeiros manifests `kind: "top_level_feature"`: `organization.feature.ts` e `directory.feature.ts`.

## Operations

- Namespace i18n split em `network.*` → `organization.*` + `directory.*`. Migrar keys mecanicamente; deprecar `network.*` ao final.
- Workflow de criar profile vai para Directory.
- Workflow de configurar departments fica em Organization.
- Endpoints `api/network/*` divididos em `api/organization/*` + `api/directory/*` conforme owner conceitual.

## Glossary

- **Organization**: top-level feature com estrutura institucional (multimarket, market, company, departments, channels institucionais).
- **Directory**: top-level feature com estrutura de pessoas (profiles, roles, permissions, promoters, onboarding).
- **Profile**: entry de pessoa no Directory.
- **ProfileType**: classificação tipada de profiles (interno vs externo, roles operacionais).
- **Channel**: termo polissêmico — em Organization significa channel institucional (canal organizacional); em messaging significa canal de comunicação. Distinção crítica.
- **Promoter**: profile especial — internal promoter (funcionário) vs external promoter (parceiro indicador).

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned para R2.5 (depois de R2 cravar foundation top-level).
