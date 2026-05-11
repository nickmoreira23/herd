---
title: Modelo de Integrações
description: Arquitetura conceitual das integrações do HERD — eixo horizontal vs. vertical e eixo raso vs. profundo.
locale: pt-BR
uid: herd.category.integrations.integration-model
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Modelo de Integrações

Toda conexão externa no HERD é uma integração. Não existe conceito secundário ("connector", "extension", "plugin") — um guarda-chuva único, uma raiz de código (`src/lib/integrations/`), uma superfície de admin (`/admin/integrations`). O modelo de integrações descreve como as integrações são organizadas e o porquê.

## Business

Integrações dão aos operadores do HERD acesso às ferramentas que já utilizam. Recharge para assinaturas, Gorgias para suporte, Slack para notificações, Zoom para meetings. Em vez de reconstruir o que esses sistemas fazem, o HERD se conecta a eles via protocolos padrão (OAuth, webhooks, APIs REST).

O catálogo de integrações é limitado por finalidade, não por contagem de vendors. O HERD espera manter dezenas de integrações ao longo de sua vida — não centenas. Cada integração carrega um custo real de manutenção: gestão de credenciais, rotação de tokens OAuth, validação de assinatura de webhooks, drift de versão de API. Adicionar uma integração é um compromisso arquitetural, não uma entrada de configuração.

## Product

Da perspectiva de um operador, uma integração é algo que ele habilita uma vez, configura minimamente e depois esquece. O admin UI em `/admin/integrations` lista as integrações disponíveis por categoria, mostra o status de conexão e exibe eventuais erros de sincronização. Integrações baseadas em OAuth levam o operador por um fluxo de consentimento padrão; integrações via API token solicitam uma chave que o HERD armazena criptografada.

Uma vez conectada, uma integração pode rodar silenciosamente em background (sincronizando assinaturas, roteando webhooks) ou expor superfícies de uso ativo (navegar tickets do Gorgias, buscar gravações do Zoom). A profundidade dessa experiência depende da profundidade da integração — ver Architecture.

## Architecture

A arquitetura de integrações do HERD tem dois eixos independentes.

### Eixo 1 — Horizontal vs. Vertical

**Horizontal** (o padrão) significa que a integração vive em `src/lib/integrations/` e compartilha a mesma infraestrutura de todas as outras integrações: fluxos OAuth, armazenamento de tokens em `MemberConnection`, ingestão de webhooks em `IntegrationWebhookEvent`, criptografia de credenciais, logs de sync em `IntegrationSyncLog`. Integrações horizontais diferem apenas em seu cliente de API e, para as mais profundas, em seus handlers de webhook.

**Vertical** significa que a integração ganha seu próprio sub-sistema de domínio quando as regras de negócio de sua categoria justificam separação estrutural. Payment é o primeiro vertical: assinaturas, eventos de faturamento, mapeamento de tiers e reconciliação de cobranças seguem regras que não se aplicam a nenhuma outra categoria. Um vertical é uma *categoria* de integrações com semântica de domínio compartilhada — não simplesmente uma integração profunda.

Verticais são raros. O critério é "as integrações desse tipo compartilham regras de domínio que exigem seus próprios models, serviços ou invariantes?" Dois ou três verticais são realistas em um horizonte de dois anos.

### Eixo 2 — Raso vs. Profundo

**Integrações rasas** implementam autorização OAuth e chamadas de API somente-leitura. Conectam, recuperam dados quando solicitadas e desconectam sem deixar rastro. A maioria das integrações sociais, de analytics e de modelos de IA é rasa por design.

**Integrações profundas** adicionam operações de escrita, webhooks de entrada, sincronização de estado, validação de assinatura de webhook e deduplicação. Mantêm estado contínuo (tokens que expiram, eventos que devem ser processados exatamente uma vez, cursores de sync). Integrações profundas exigem mais superfície operacional: monitoramento de expiração de tokens, tratamento de retry para entregas de webhook com falha, e logs de sync auditáveis.

### A Matriz dos Dois Eixos

| | Horizontal | Vertical |
|---|---|---|
| **Rasa** | A maioria das integrações — OAuth + read. Exemplos: Instagram, YouTube, Mixpanel, ElevenLabs. | Hipotético — uma categoria vertical cujas integrações só leem. Improvável na prática. |
| **Profunda** | Profunda horizontal — ciclo de vida completo com infraestrutura compartilhada. Exemplos: Gorgias (tickets + webhooks), Slack (read + write + notificações), Zoom (meetings + gravações). | Profunda vertical — models de domínio próprios + infraestrutura compartilhada sobrescrita. Exemplo: Payment (Recharge — assinaturas + webhooks + mapeamento de tiers + reconciliação de cobranças). |

O Eixo 1 (horizontal/vertical) é uma questão de *complexidade de model de domínio*. O Eixo 2 (raso/profundo) é uma questão de *complexidade de protocolo*. São ortogonais: ser profundo não torna uma integração vertical.

### Organização do Código

```
src/lib/integrations/          ← infraestrutura horizontal compartilhada (destino futuro)
src/lib/services/recharge.ts   ← cliente API do Recharge (profundo, vertical — payment)
src/lib/services/gorgias.ts    ← cliente API do Gorgias (profundo, horizontal — support)
src/lib/services/intercom.ts   ← cliente API do Intercom (profundo, horizontal — support)
src/app/api/integrations/      ← CRUD admin + rotas REST por integração
src/app/api/webhooks/          ← receptores de webhook de entrada (gorgias, intercom, recharge)
src/app/api/integrations/oauth/ ← autorização OAuth + callback
```

Para convenções de tenancy (como cada call site resolve a organização atual), consulte a seção Tenancy do `AGENTS.md`.

## Operations

Adicionando uma nova integração: decidir o Eixo 1 (horizontal ou, se as regras de categoria justificarem, um novo vertical) e o Eixo 2 (raso ou profundo). Integrações rasas horizontais requerem um cliente de API em `src/lib/services/`, rotas em `src/app/api/integrations/{slug}/`, e um componente de overview em `src/components/integrations/overviews/`. Integrações profundas adicionalmente requerem um receptor de webhook em `src/app/api/webhooks/{slug}/`, middleware de validação de assinatura e instrumentação de sync logs.

Retirando uma integração: definir `status` como `DISABLED` no banco, revogar as credenciais da plataforma e arquivar o código correspondente. Não deletar receptores de webhook até que todos os eventos pendentes tenham sido drenados.

## Glossary

- **Integration**: Conexão entre o HERD e um serviço externo específico, identificada por um `slug` (ex.: `recharge`, `gorgias`, `zoom`).
- **Integração rasa**: OAuth + chamadas de API somente-leitura. Sem webhooks de entrada ou sincronização de estado.
- **Integração profunda**: OAuth + read/write + webhooks de entrada + sincronização de estado + validação de assinatura + deduplicação.
- **Integração horizontal**: Usa a infraestrutura de integração compartilhada (armazenamento de tokens, tabela de webhooks, sync logs) sem models específicos de domínio.
- **Integração vertical**: Categoria de integrações que compartilha regras de negócio de domínio que exigem seus próprios models ou invariantes (ex.: Payment).
- **MemberConnection**: Registro por-perfil que armazena tokens OAuth para integrações que suportam conexões pessoais.
- **IntegrationWebhookEvent**: Payload de webhook de entrada armazenado antes do processamento, habilitando replay e auditoria.

## Changelog

- **2026-05-11** — Publicação inicial. Entry do modelo de integrações criado durante discovery da Camada 1 (Integration & Payment Foundation).
