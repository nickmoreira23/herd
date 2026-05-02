> Para agentes de IA: este é o documento canônico do refator estrutural pré-1.5.6f. Antes de iniciar qualquer etapa (R0–R7), leia esta visão geral e a entrada da etapa específica em `docs/handbook/refactor/r{N}-{nome}/(overview)/`.

# Refator Estrutural Pré-1.5.6f

Esta camada agrupa as etapas do refator que precede a Phase 1.5.6f. O refator nasceu de um reconhecimento arquitetural durante o planejamento de 1.5.6f: o código produtivo havia acumulado classificações ad-hoc (campos como `domain` em manifests, `category` em blocks vs tools vs features) que não correspondiam à taxonomia canônica documentada no Handbook (`_meta/handbook`). Antes de construir camadas novas (Tools, Solutions, Networks plurais), o terreno precisava ser nivelado.

O refator não introduz comportamento novo. Ele alinha estruturas existentes — ou prepara o registro para receber estruturas alinhadas — antes que mais código seja escrito sobre fundação desalinhada.

## Business

Por que o refator existe comercialmente: cada etapa adiada do refator obrigaria toda etapa subsequente (R3 packages, R4 campaigns, R5 subscriptions, R7 agents) a re-litigar perguntas de fundação — "isto é um block ou tool?", "que campo classifica?", "onde mora?". A indecisão se propaga em código. R0 commit a fundação para que R1–R7 sejam mecânicos.

O retorno é indireto e diferido: features futuras nascem alinhadas, agentes (humanos e IA) tomam decisões de classificação consultando documentação canônica em vez de inferindo de código existente, e o ônus de manter consistência cai.

## Product

Invisível ao usuário final. Trabalho de fundação puro. O impacto chega via: features downstream entregues mais rápido (decisões já tomadas), bugs de classificação evitados (manifests não derivam significado de drift), e Handbook utilizável como fonte de verdade.

## Architecture

O refator está dividido em 9 etapas. R0 (já fechada) é o ponto de partida — fundação para tudo que segue.

| Etapa | Trabalho | Status |
|---|---|---|
| R0 | Foundation (limpeza pré-refator + reforma de conteúdo + schema bump do manifest) | done (2026-05-02) |
| R1 | Tools foundation (registry de tools, manifest paralelo) | planned |
| R2 | Top-level features foundation (registry de features, manifest paralelo) | planned |
| R2.5 | Network split (Organization + Directory como contextos distintos) | planned |
| R3 | Packages → block group (mover packages para dentro de products como group) | planned |
| R4 | Campaigns → tool (re-classificar de block para tool) | planned |
| R5 | Subscriptions split (separar contratos comerciais de assinaturas técnicas) | planned |
| R6 | Routines → top-level feature (re-classificar) | deferred |
| R7 | Agents → top-level feature (re-classificar) | planned |

Cada etapa tem entrada própria em `docs/handbook/refactor/r{N}-{nome}/(overview)/` documentando: motivação, decisões, mecânica de migração, e referência para o commit que fechou.

## Operations

Para agentes (humanos ou IA) trabalhando no refator:

1. Leia a entrada da etapa específica antes de propor mudanças. As decisões são canônicas e justificadas — improvisar contradiz o protocolo.
2. Consulte `_meta/handbook` para a árvore de decisão de classificação (block / block-group / tool / top-level-feature). O refator inteiro depende dessa taxonomia.
3. Etapas downstream (R3–R7) consomem decisões de R0 (kind discriminator) e R1/R2 (tool/feature manifests). Não pule a leitura das etapas anteriores.
4. Cada etapa fecha com commit + entrada do Handbook atualizada. Sem entrada, a etapa não está fechada.

## Changelog

- **2026-05-02 (R0 fecha)** — Foundation pronta. R0.0 (limpeza pré-refator), R0.1 (reforma de conteúdo arquitetural), R0.2 (schema bump do manifest) merged em main. R1–R7 destravados.
