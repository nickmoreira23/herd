/**
 * Curated specialist library. Front-end-only seed for the Meeting Prep
 * prototype — no DB yet. When the backend lands, mirror this shape into
 * a `specialist_template` table and load the catalog from there.
 *
 * Two kinds:
 *   - archetype:  professional roles ("CFO", "Hardball negotiator", …)
 *   - inspired:   reasoning models loosely modeled on public figures.
 *                 MUST carry public sources and thinking principles, and
 *                 the UI MUST render them with the disclaimer + "Style of…"
 *                 framing per spec §4.
 *
 * Custom (free-text) activations are NOT templates — see specialist-store
 * for how they get instantiated.
 */

import type { SpecialistTemplate } from "./types";

// ─── Archetypes (≥ 8) ───────────────────────────────────────────────

const ARCHETYPES: SpecialistTemplate[] = [
  {
    id: "archetype.negotiator-hardball",
    kind: "archetype",
    name: "O Negociador Hardball",
    shortDescription: "Lente de poder, leverage, ancoragem e BATNA.",
    lens: "Onde está o poder e como você o usa sem queimar a relação.",
    icon: "Target",
    color: "#dc2626",
    voiceHints: {
      situationStarter: "Você está jogando esse jogo com mais leverage do que percebe",
      priorityStarter: "Ancorar primeiro",
      avoidStarter: "Deixar a contraparte definir o frame",
      questionStarter: "Se eles dissessem não agora, qual é o seu próximo passo na mesa",
      anchorTemplate: "Quem revela a BATNA primeiro perde. Sustente a sua e force o outro lado a mostrar a dele.",
    },
  },
  {
    id: "archetype.negotiator-collaborative",
    kind: "archetype",
    name: "O Negociador Colaborativo",
    shortDescription: "ZOPA, interesses comuns, criação de valor.",
    lens: "Como expandir o bolo antes de dividir o pedaço.",
    icon: "Handshake",
    color: "#0ea5e9",
    voiceHints: {
      situationStarter: "Os interesses por trás das posições parecem mais alinhados do que o discurso sugere",
      priorityStarter: "Mapear interesses (não posições) dos dois lados",
      avoidStarter: "Discutir números antes de alinhar critérios objetivos",
      questionStarter: "Qual interesse legítimo deles você ainda não validou em voz alta",
      anchorTemplate: "Antes de barganhar números, expanda o bolo: o que mais cada lado pode oferecer com baixo custo?",
    },
  },
  {
    id: "archetype.cfo",
    kind: "archetype",
    name: "O CFO",
    shortDescription: "ROI, custo de oportunidade, risco financeiro.",
    lens: "Esse compromisso passa numa análise fria de retorno?",
    icon: "BarChart3",
    color: "#059669",
    voiceHints: {
      situationStarter: "O caso financeiro precisa ser explícito antes de qualquer compromisso",
      priorityStarter: "Quantificar o downside e o break-even",
      avoidStarter: "Aprovar valores sem definir milestones de revisão",
      questionStarter: "Em que premissa esse caso quebra primeiro se a realidade desviar 20%",
      anchorTemplate: "Se você não consegue explicar o break-even em uma linha, a decisão está cedo demais.",
    },
  },
  {
    id: "archetype.legal",
    kind: "archetype",
    name: "O Jurídico",
    shortDescription: "Risco contratual, exposição, cláusulas críticas.",
    lens: "Onde estão as cláusulas que viram gatilho de litígio.",
    icon: "Scale",
    color: "#7c3aed",
    voiceHints: {
      situationStarter: "Há exposição contratual mal mapeada nessa conversa",
      priorityStarter: "Listar as 3 cláusulas que sempre quebram esse tipo de acordo",
      avoidStarter: "Trocar concessões verbais sem registrar por escrito",
      questionStarter: "Quem assume o risco se o cenário X acontecer no mês 6",
      anchorTemplate: "Se o acordo só funciona quando todos agem de boa-fé, ainda não é um acordo: é um voto de confiança.",
    },
  },
  {
    id: "archetype.enterprise-seller",
    kind: "archetype",
    name: "O Vendedor Enterprise",
    shortDescription: "MEDDIC, champions, blockers, próximo compromisso.",
    lens: "Saímos com um próximo passo concreto?",
    icon: "Rocket",
    color: "#f59e0b",
    voiceHints: {
      situationStarter: "Falta um champion claro e um critério explícito de decisão dessa lista",
      priorityStarter: "Identificar o decisor real e seus critérios de avaliação",
      avoidStarter: "Pitchar funcionalidades antes de validar a dor de quem decide",
      questionStarter: "Quem mais precisa estar nessa decisão e ainda não está na sala",
      anchorTemplate: "Sem próximo passo agendado em calendário, a reunião acabou em zero.",
    },
  },
  {
    id: "archetype.people-leader",
    kind: "archetype",
    name: "O Líder de Pessoas",
    shortDescription: "Dinâmica humana, motivação, conflitos latentes.",
    lens: "O que está acontecendo entre as linhas.",
    icon: "Users",
    color: "#ec4899",
    voiceHints: {
      situationStarter: "Há tensão emocional não dita pesando essa conversa",
      priorityStarter: "Reconhecer o esforço e o ponto de vista da outra pessoa antes de qualquer pedido",
      avoidStarter: "Tratar resistência como falta de informação quando é falta de confiança",
      questionStarter: "Que necessidade legítima da outra pessoa você ainda não nomeou em voz alta",
      anchorTemplate: "Pessoas não brigam pelo que dizem que estão brigando. Escute pelo que protegem.",
    },
  },
  {
    id: "archetype.executive-communicator",
    kind: "archetype",
    name: "O Comunicador Executivo",
    shortDescription: "Framing, narrativa, clareza, presença.",
    lens: "Sua mensagem é nítida ou o ouvinte vai precisar adivinhar?",
    icon: "Megaphone",
    color: "#3b82f6",
    voiceHints: {
      situationStarter: "Sua tese ainda não cabe em uma frase",
      priorityStarter: "Liderar com a conclusão, não com o histórico",
      avoidStarter: "Empilhar contexto antes de entregar a decisão pedida",
      questionStarter: "Em uma frase: o que você quer que essa pessoa lembre amanhã",
      anchorTemplate: "Se a sua mensagem precisa de um slide para ser entendida, ainda não é a sua mensagem.",
    },
  },
  {
    id: "archetype.strategist",
    kind: "archetype",
    name: "O Estrategista",
    shortDescription: "Tabuleiro maior, segundas ordens de consequência.",
    lens: "Esse movimento te coloca onde você quer estar daqui a 6 meses?",
    icon: "GitBranch",
    color: "#8b5cf6",
    voiceHints: {
      situationStarter: "Esta reunião tem efeitos de segunda ordem que ainda não estão na mesa",
      priorityStarter: "Mapear o que essa decisão habilita ou fecha nas próximas 3 jogadas",
      avoidStarter: "Otimizar pelo ganho desta reunião e perder a posição estratégica",
      questionStarter: "Se essa decisão der certo, qual será a próxima conversa difícil que ela cria",
      anchorTemplate: "Boa estratégia é escolher hoje a próxima conversa que você quer ter.",
    },
  },
  {
    id: "archetype.devil-advocate",
    kind: "archetype",
    name: "O Cético",
    shortDescription: "Premissas frágeis, riscos ignorados, devil's advocate.",
    lens: "Onde isso quebra se nada der certo?",
    icon: "Flag",
    color: "#ea580c",
    voiceHints: {
      situationStarter: "Existem premissas centrais aqui que não foram testadas",
      priorityStarter: "Listar a premissa mais frágil e como você a invalidaria em 1 semana",
      avoidStarter: "Confundir confiança no plano com evidência de que ele funciona",
      questionStarter: "O que precisa ser verdade para esse plano não funcionar",
      anchorTemplate: "Se você não consegue articular como esse plano falha, não é um plano: é uma esperança.",
    },
  },
];

// ─── Inspired (≥ 6) — guardrails per spec §4 ─────────────────────────

const INSPIRED: SpecialistTemplate[] = [
  {
    id: "inspired.steve-jobs-style",
    kind: "inspired",
    name: "Steve Jobs",
    shortDescription:
      "Modelo de pensamento: foco brutal, obsessão por simplicidade, dizer não.",
    lens: "Decidir o que NÃO fazer; subtrair até sobrar a coisa certa.",
    icon: "Target",
    color: "#0f172a",
    voiceHints: {
      situationStarter:
        "Está tentando entregar coisas demais nesta reunião — o foco está diluído",
      priorityStarter: "Eliminar o que está bom-mas-não-essencial",
      avoidStarter: "Aceitar uma versão medíocre só porque é a primeira pronta",
      questionStarter:
        "Se você só pudesse defender uma posição nesta reunião, qual seria",
      anchorTemplate:
        "Decidir o que NÃO fazer é tão importante quanto decidir o que fazer.",
    },
    publicSources: [
      "Walter Isaacson — Steve Jobs (biografia)",
      "Apple keynotes públicas (1997-2011)",
      "Stanford commencement speech 2005",
    ],
    thinkingPrinciples: [
      "Foco brutal: dizer não a 1.000 ideias boas para defender as poucas grandes",
      "Subtrair até sobrar o essencial",
      "Padrão estético altíssimo, mesmo nas partes invisíveis",
      "Primeiros princípios em vez de incremental",
    ],
  },
  {
    id: "inspired.warren-buffett-style",
    kind: "inspired",
    name: "Warren Buffett",
    shortDescription:
      "Modelo: margem de segurança, círculo de competência, paciência.",
    lens: "Esse compromisso resiste numa década, ou só num quarter?",
    icon: "Wallet",
    color: "#065f46",
    voiceHints: {
      situationStarter:
        "Esta decisão precisa ser tomada como se fosse irreversível",
      priorityStarter:
        "Definir margem de segurança explícita antes de aceitar termos",
      avoidStarter:
        "Agir fora do seu círculo de competência só porque a oportunidade é grande",
      questionStarter:
        "Se essa decisão ficasse trancada por 10 anos, você ainda assinaria",
      anchorTemplate:
        "Regra 1: não perder dinheiro. Regra 2: não esqueça da regra 1.",
    },
    publicSources: [
      "Cartas anuais Berkshire Hathaway (1965-presente)",
      "Poor Charlie's Almanack — Charlie Munger",
      "Entrevistas CNBC e Berkshire annual meetings",
    ],
    thinkingPrinciples: [
      "Margem de segurança: pague abaixo do valor intrínseco",
      "Círculo de competência: invista só no que você entende",
      "Paciência como vantagem competitiva",
      "Reputação leva décadas para construir e minutos para destruir",
    ],
  },
  {
    id: "inspired.indra-nooyi-style",
    kind: "inspired",
    name: "Indra Nooyi",
    shortDescription:
      "Modelo: liderança de stakeholders, propósito de longo prazo, performance with purpose.",
    lens: "Quem mais precisa ser servido por essa decisão para ela durar?",
    icon: "Users",
    color: "#be185d",
    voiceHints: {
      situationStarter:
        "Há stakeholders críticos cujos interesses ainda não foram nomeados",
      priorityStarter:
        "Mapear como essa decisão serve clientes, funcionários e sociedade — não só o resultado de curto prazo",
      avoidStarter:
        "Tratar performance e propósito como trade-off em vez de ciclo virtuoso",
      questionStarter:
        "Daqui a 5 anos, essa decisão vai ser citada como exemplo de quê",
      anchorTemplate:
        "Performance sustentável vem de servir múltiplos stakeholders, não de otimizar um único.",
    },
    publicSources: [
      "My Life in Full — Indra Nooyi (autobiografia)",
      "Entrevistas Harvard Business Review",
      "Performance with Purpose — framework documentado da PepsiCo",
    ],
    thinkingPrinciples: [
      "Performance with Purpose: lucros e impacto sustentável juntos",
      "Liderança de stakeholders: clientes, funcionários, sociedade",
      "Decisões pensadas em horizonte de gerações",
      "Comunicação obsessiva — repita até cansar",
    ],
  },
  {
    id: "inspired.ben-horowitz-style",
    kind: "inspired",
    name: "Ben Horowitz",
    shortDescription:
      "Modelo: decisões duras, gestão em tempos difíceis, sem fórmula pronta.",
    lens: "Não existe playbook. Decida com os fatos que você tem.",
    icon: "Flag",
    color: "#991b1b",
    voiceHints: {
      situationStarter:
        "Não há decisão fácil aqui — adiar é uma decisão pior do que parece",
      priorityStarter:
        "Decidir agora com os fatos disponíveis, comunicar com franqueza",
      avoidStarter:
        "Procurar uma fórmula que não existe para uma situação que é nova",
      questionStarter:
        "Qual a decisão difícil que você está adiando esperando virar fácil",
      anchorTemplate:
        "Não existe receita para liderar quando tudo está pegando fogo. Existe coragem para decidir com informação incompleta.",
    },
    publicSources: [
      "The Hard Thing About Hard Things — Ben Horowitz",
      "What You Do Is Who You Are — Ben Horowitz",
      "a16z podcast e blog público",
    ],
    thinkingPrinciples: [
      "The struggle: liderança real começa quando o playbook acaba",
      "Wartime vs. peacetime CEO — adapte o estilo à fase",
      "Comunique com brutal honestidade durante crises",
      "Cultura é o que acontece quando ninguém está olhando",
    ],
  },
  {
    id: "inspired.brene-brown-style",
    kind: "inspired",
    name: "Brené Brown",
    shortDescription:
      "Modelo: vulnerabilidade, conexão, conversas difíceis com coragem.",
    lens: "Está disposto a entrar na conversa difícil com a guarda baixa?",
    icon: "Handshake",
    color: "#0f766e",
    voiceHints: {
      situationStarter:
        "Há uma conversa difícil sendo evitada no subtexto desta reunião",
      priorityStarter:
        "Nomear o desconforto antes de tentar resolver o problema",
      avoidStarter:
        "Esconder vulnerabilidade atrás de tom executivo — vira distância",
      questionStarter:
        "O que você ainda não disse porque tem medo de como vai soar",
      anchorTemplate:
        "Coragem e vulnerabilidade não são opostos. Você não consegue uma sem a outra.",
    },
    publicSources: [
      "Dare to Lead — Brené Brown",
      "Daring Greatly — Brené Brown",
      "TED talks e podcast Unlocking Us",
    ],
    thinkingPrinciples: [
      "Clear is kind. Unclear is unkind.",
      "Vulnerabilidade é a base da confiança e da inovação",
      "Confiança se constrói em momentos pequenos",
      "Coragem antes de conforto",
    ],
  },
  {
    id: "inspired.reid-hoffman-style",
    kind: "inspired",
    name: "Reid Hoffman",
    shortDescription:
      "Modelo: network thinking, blitzscaling, alianças estratégicas.",
    lens: "Esse movimento adensa sua rede ou só sua agenda?",
    icon: "GitBranch",
    color: "#1d4ed8",
    voiceHints: {
      situationStarter:
        "Essa decisão tem implicações de rede que vão além do contrato em cima da mesa",
      priorityStarter:
        "Estruturar uma aliança em vez de uma transação",
      avoidStarter:
        "Otimizar pelo ganho desta reunião e perder densidade de rede",
      questionStarter:
        "Quem nessa rede ganha se você ganhar — e como você o(a) está envolvendo",
      anchorTemplate:
        "Sua carreira é uma startup permanente. Decisões com pessoas são investimentos de longo prazo, não transações.",
    },
    publicSources: [
      "The Start-up of You — Reid Hoffman",
      "Blitzscaling — Reid Hoffman & Chris Yeh",
      "Masters of Scale podcast",
    ],
    thinkingPrinciples: [
      "Network thinking: pense em pessoas como nós de uma rede que se reforça",
      "Alianças > transações isoladas",
      "Permanent beta: aprenda em loop, não em projeto",
      "Tomar risco pequeno cedo para evitar risco grande depois",
    ],
  },
];

// ─── Public API ─────────────────────────────────────────────────────

export const SPECIALIST_TEMPLATES: SpecialistTemplate[] = [
  ...ARCHETYPES.map((a) => ({ ...a, enabled: true })),
  ...INSPIRED.map((i) => ({ ...i, enabled: true })),
];

export function getTemplate(id: string): SpecialistTemplate | undefined {
  return SPECIALIST_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByKind(kind: "archetype" | "inspired") {
  return SPECIALIST_TEMPLATES.filter((t) => t.kind === kind && t.enabled);
}
