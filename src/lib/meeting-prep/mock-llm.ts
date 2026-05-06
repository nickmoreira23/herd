/**
 * Front-end-only stand-ins for the LLM calls described in spec
 * `01-context-briefing.md`. Each helper simulates a small latency so the
 * UX matches what the eventual streamed Anthropic call will feel like —
 * good enough to validate flow and copy without burning tokens.
 *
 * Replace these with real API endpoints once the backend lands; the
 * call sites in the wizard already treat them as async.
 */

import type {
  AnchorPhrases,
  AnticipatedQuestion,
  MeetingContext,
  MeetingType,
  ObjectionItem,
  ObjectiveItem,
  Participant,
  PrepPlanSection,
  PrepPlanSections,
  RiskItem,
  SpecialistActivation,
  SpecialistOutput,
  SpecialistTemplate,
  ValidationResult,
} from "./types";
import { emptyPrepPlanSections } from "./types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const OBJECTIVE_TEMPLATES: Record<MeetingType, string[]> = {
  one_on_one: [
    "Alinhar prioridades da semana e desbloquear pendências do colaborador.",
    "Coletar sinais de engajamento e identificar riscos de retenção.",
    "Definir um plano de desenvolvimento concreto para os próximos 30 dias.",
  ],
  commercial: [
    "Avançar para a próxima etapa do funil com compromisso explícito do cliente.",
    "Mapear critérios de decisão e quem mais precisa estar envolvido.",
    "Apresentar proposta e negociar condições para fechar nos próximos 14 dias.",
  ],
  board: [
    "Aprovar o plano trimestral e os investimentos críticos do período.",
    "Reportar progresso vs. metas e endereçar riscos materiais.",
    "Construir alinhamento sobre uma decisão estratégica de longo prazo.",
  ],
  hr_feedback: [
    "Entregar feedback estruturado com 1 ponto forte e 1 ponto de evolução.",
    "Construir um plano de ação que o colaborador acredita ser exequível.",
    "Reduzir ambiguidade sobre expectativas do papel nos próximos 90 dias.",
  ],
  negotiation: [
    "Chegar a um acordo que respeite minha BATNA e crie ganho mútuo.",
    "Mapear os interesses por trás das posições antes de negociar números.",
    "Sair com próximos passos definidos mesmo sem fechamento integral hoje.",
  ],
  interview: [
    "Avaliar se o candidato preenche os requisitos críticos do papel.",
    "Comparar consistência entre experiência declarada e exemplos concretos.",
    "Vender a oportunidade caso identifique que é um match.",
  ],
  kickoff: [
    "Estabelecer escopo, prazos e papéis sem zonas cinzentas.",
    "Construir confiança inicial entre os times envolvidos.",
    "Definir o próximo marco verificável e quem é responsável.",
  ],
  partnership: [
    "Identificar onde os interesses convergem o suficiente para um piloto.",
    "Mapear riscos de imagem e operacionais antes de assinar nada.",
    "Sair com um termo de cooperação simples ou um descarte claro.",
  ],
  investor: [
    "Gerar interesse para uma próxima conversa com o sócio decisor.",
    "Receber feedback honesto sobre os pontos fracos da tese.",
    "Construir referência social via warm intros qualificadas.",
  ],
  other: [
    "Sair com uma decisão clara registrada por escrito.",
    "Reduzir ambiguidade sobre o tema central da reunião.",
    "Definir o próximo passo concreto com responsável e data.",
  ],
};

export interface SuggestObjectiveInput {
  title: string;
  meetingType: MeetingType | null;
  participants: Participant[];
}

export async function suggestObjective(
  input: SuggestObjectiveInput,
): Promise<string[]> {
  await delay(700 + Math.random() * 600);
  const type = input.meetingType ?? "other";
  const base = OBJECTIVE_TEMPLATES[type] ?? OBJECTIVE_TEMPLATES.other;
  return base;
}

export async function validateContext(
  ctx: MeetingContext,
): Promise<ValidationResult> {
  await delay(500 + Math.random() * 400);
  const missing: ValidationResult["missing"] = [];
  const suggestions: ValidationResult["suggestions"] = [];

  if (!ctx.title.trim())
    missing.push({ field: "title", messageKey: "missing_title" });
  if (!ctx.meetingType)
    missing.push({ field: "meetingType", messageKey: "missing_meeting_type" });
  if (!ctx.objective.trim())
    missing.push({ field: "objective", messageKey: "missing_objective" });
  if (ctx.participants.length === 0)
    missing.push({ field: "participants", messageKey: "missing_participants" });
  if (!ctx.desiredOutcome.trim())
    missing.push({
      field: "desiredOutcome",
      messageKey: "missing_desired_outcome",
    });

  if (!ctx.batna.trim())
    suggestions.push({ field: "batna", messageKey: "suggest_batna" });
  if (ctx.toneTags.length === 0)
    suggestions.push({ field: "toneTags", messageKey: "suggest_tone" });
  if (!ctx.historyNotes.trim())
    suggestions.push({ field: "historyNotes", messageKey: "suggest_history" });

  return {
    ok: missing.length === 0,
    missing,
    suggestions,
  };
}

export async function summarizeContext(ctx: MeetingContext): Promise<string> {
  await delay(900 + Math.random() * 700);
  const parts: string[] = [];

  if (ctx.title) {
    parts.push(`Reunião "${ctx.title}".`);
  }
  if (ctx.meetingType) {
    parts.push(`Formato: ${ctx.meetingType.replace(/_/g, " ")}.`);
  }
  if (ctx.objective) {
    parts.push(`Objetivo principal: ${ctx.objective}`);
  }
  if (ctx.participants.length > 0) {
    const names = ctx.participants
      .filter((p) => p.name.trim())
      .map((p) => `${p.name}${p.role ? ` (${p.role})` : ""}`)
      .join(", ");
    if (names) parts.push(`Participantes: ${names}.`);
  }
  if (ctx.desiredOutcome) {
    parts.push(`Sucesso = ${ctx.desiredOutcome}`);
  }
  if (ctx.batna) {
    parts.push(`Mínimo aceitável: ${ctx.batna}.`);
  }
  if (ctx.toneTags.length > 0) {
    parts.push(`Tom desejado: ${ctx.toneTags.join(", ")}.`);
  }

  return parts.join(" ");
}

// ─── Specialist activations (streaming) ───────────────────────────

/**
 * Best-effort topic extraction from the meeting context — pulled from the
 * objective + desired outcome. Used to give each specialist's output a
 * grounded reference instead of generic copy.
 */
function extractTopic(ctx: MeetingContext): string {
  const candidate =
    ctx.title.trim() ||
    ctx.objective.split(/[.!?]/)[0]?.trim() ||
    ctx.desiredOutcome.split(/[.!?]/)[0]?.trim() ||
    "esta reunião";
  return candidate.length > 80 ? candidate.slice(0, 77) + "…" : candidate;
}

function counterpartLabel(ctx: MeetingContext): string {
  const named = ctx.participants.find((p) => p.name.trim());
  if (named) {
    const role = named.role.trim();
    return role ? `${named.name} (${role})` : named.name;
  }
  return "a contraparte";
}

/**
 * Build a final SpecialistOutput by composing the template's voice hints
 * with topic-specific tokens. Mock-only — replace with real Anthropic
 * streaming when the backend lands.
 */
export function generateSpecialistOutput(
  template: SpecialistTemplate,
  ctx: MeetingContext,
): SpecialistOutput {
  const topic = extractTopic(ctx);
  const counterpart = counterpartLabel(ctx);
  const objective = ctx.objective.trim() || ctx.desiredOutcome.trim() || topic;
  const v = template.voiceHints;

  const situationRead = `${v.situationStarter}. Olhando o objetivo "${objective}" e a forma como ${counterpart} aparece no contexto, a leitura é que o terreno está movediço justamente onde você está mais confortável — e isso é o sinal que importa.`;

  const priorities = [
    `${v.priorityStarter}.`,
    `Definir antes da reunião o que é "sucesso mínimo" e o que é "sucesso ambicioso" para ${topic}.`,
    `Reservar os primeiros 5 minutos para alinhar agenda e critérios de decisão com ${counterpart}.`,
  ];

  const avoid = [
    `${v.avoidStarter}.`,
    "Reagir ao primeiro sinal emocional sem antes nomear o que viu.",
  ];

  const provocativeQuestion = `${v.questionStarter}?`;
  const anchorPhrase = v.anchorTemplate;

  return {
    situationRead,
    priorities,
    avoid,
    provocativeQuestion,
    anchorPhrase,
  };
}

/**
 * Custom (free-text) activation generator — when there is no template,
 * synthesize a generic-but-on-topic output from the user's description.
 */
export function generateCustomOutput(
  description: string,
  ctx: MeetingContext,
): SpecialistOutput {
  const topic = extractTopic(ctx);
  const counterpart = counterpartLabel(ctx);
  const role = description.trim() || "um especialista";
  return {
    situationRead: `Como ${role}, leio "${topic}" como uma situação onde o ângulo que mais merece atenção é o que ainda não foi nomeado em voz alta.`,
    priorities: [
      `Trazer para a mesa a métrica/critério que ${role} usaria primeiro.`,
      `Nomear explicitamente como ${counterpart} mede sucesso, antes de defender sua posição.`,
      `Reduzir o escopo da reunião para o que pode ser decidido hoje sem novos dados.`,
    ],
    avoid: [
      "Tratar essa conversa como continuação da última — comece pelos critérios.",
      "Aceitar uma decisão por inércia — proponha alternativas explícitas.",
    ],
    provocativeQuestion: `Se ${role} estivesse na sua cadeira, o que faria que você não está fazendo?`,
    anchorPhrase:
      "A perspectiva que falta é, quase sempre, a mais barata e a mais valiosa.",
  };
}

export type ActivationPhase =
  | "queued"
  | "streaming"
  | "situation"
  | "priorities"
  | "avoid"
  | "question"
  | "anchor"
  | "complete";

/**
 * Phase-by-phase reveal so the UI can render a "live" feel without a real
 * stream. The callback fires once per phase with the cumulative partial
 * output. Average end-to-end ~2-4s, well under the 30s acceptance target.
 */
export async function streamSpecialistActivation(
  finalOutput: SpecialistOutput,
  onPhase: (
    phase: ActivationPhase,
    partial: SpecialistOutput,
  ) => void,
): Promise<void> {
  const partial: SpecialistOutput = {
    situationRead: "",
    priorities: [],
    avoid: [],
    provocativeQuestion: "",
    anchorPhrase: "",
  };

  // Initial pause before anything streams — feels like a real "thinking…".
  await delay(300 + Math.random() * 400);

  // 1. Situation read
  partial.situationRead = finalOutput.situationRead;
  onPhase("situation", { ...partial });
  await delay(450 + Math.random() * 400);

  // 2. Priorities
  partial.priorities = [...finalOutput.priorities];
  onPhase("priorities", { ...partial });
  await delay(350 + Math.random() * 350);

  // 3. Avoid
  partial.avoid = [...finalOutput.avoid];
  onPhase("avoid", { ...partial });
  await delay(300 + Math.random() * 350);

  // 4. Provocative question
  partial.provocativeQuestion = finalOutput.provocativeQuestion;
  onPhase("question", { ...partial });
  await delay(250 + Math.random() * 300);

  // 5. Anchor phrase
  partial.anchorPhrase = finalOutput.anchorPhrase;
  onPhase("anchor", { ...partial });
  await delay(150);

  onPhase("complete", { ...partial });
}

// ─── Prep plan generation ──────────────────────────────────────────

/**
 * Cheap fingerprint of the inputs that drove a plan generation. Used
 * by the UI to flag "this plan is stale" when the user edits the
 * context or pin set after generating. No crypto here — front-end-only,
 * comparison is local.
 */
export function computeInputsSignature(
  ctx: MeetingContext,
  activations: SpecialistActivation[],
): string {
  const ctxBits = [
    ctx.title,
    ctx.meetingType ?? "-",
    ctx.objective.length,
    ctx.desiredOutcome.length,
    ctx.batna.length,
    ctx.participants.length,
    ctx.toneTags.join(","),
    ctx.constraints.length,
    ctx.historyNotes.length,
    ctx.summary.length,
  ].join("|");
  const actBits = activations
    .map((a) => `${a.id}:${a.pinned ? "p" : "u"}:${a.status}`)
    .sort()
    .join(",");
  return `${ctxBits}::${actBits}`;
}

function pickPinned(
  activations: SpecialistActivation[],
): SpecialistActivation[] {
  // Spec §7.1 — pinned activations get 2x weight. With 5+ pinned this
  // would crowd out the rest; cap at 3 so the synthesis still feels
  // like the model's voice.
  const pinned = activations.filter((a) => a.pinned).slice(0, 3);
  return pinned.length > 0 ? pinned : activations.slice(0, 3);
}

function firstSentence(s: string): string {
  if (!s) return "";
  const trimmed = s.trim();
  const idx = trimmed.search(/[.!?]/);
  return idx > 0 ? trimmed.slice(0, idx + 1) : trimmed;
}

function generateExecutiveSummary(
  ctx: MeetingContext,
  weighted: SpecialistActivation[],
): string {
  const counterpart = counterpartLabel(ctx);
  const stake =
    firstSentence(ctx.desiredOutcome) || firstSentence(ctx.objective) || "fechar uma decisão concreta";
  const tone =
    ctx.toneTags.length > 0
      ? ctx.toneTags.slice(0, 2).join(" e ")
      : "claro e direto";
  const lensSummary =
    weighted.length > 0
      ? `As lentes ativas (${weighted.map((a) => a.displayName).join(", ")}) convergem em uma leitura: o terreno crítico é onde você está mais confortável e por isso menos atento.`
      : "";
  return `O que está em jogo: ${stake} Você está conversando com ${counterpart} e o tom precisa ficar ${tone} sem perder firmeza. ${lensSummary}`.trim();
}

function generateObjectives(
  ctx: MeetingContext,
  weighted: SpecialistActivation[],
): ObjectiveItem[] {
  const out: ObjectiveItem[] = [];
  if (ctx.objective.trim()) {
    out.push({
      text: firstSentence(ctx.objective) || ctx.objective.slice(0, 100),
      rationale:
        "É o objetivo declarado do briefing — todo o resto da reunião é instrumental a ele.",
    });
  }
  // Pull priorities from the top-weighted specialists, dedup-ish.
  const seen = new Set<string>(out.map((o) => o.text.toLowerCase()));
  for (const a of weighted) {
    for (const p of a.output.priorities) {
      const key = p.slice(0, 60).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        text: p,
        rationale: `Sinal de ${a.displayName}${a.pinned ? " (pinado)" : ""} — entra com peso porque a lente é específica a esse contexto.`,
      });
      if (out.length >= 3) break;
    }
    if (out.length >= 3) break;
  }
  while (out.length < 3) {
    out.push({
      text: "Sair com próximos passos por escrito antes de encerrar.",
      rationale:
        "Default de toda reunião decisória: sem registro, a clareza dura até o próximo café.",
    });
  }
  return out.slice(0, 3);
}

function generateCounterpartMotives(ctx: MeetingContext): string[] {
  const counterpart = counterpartLabel(ctx);
  const named = ctx.participants.find((p) => p.name.trim());
  const role = named?.role || "decisor";
  const motives: string[] = [
    `${counterpart} chega com uma agenda própria — provavelmente medindo essa conversa pelo que pode reportar a alguém acima dele(a) em ${role === "decisor" ? "uma estrutura de decisão" : role}.`,
    "Há custo de oportunidade do tempo dele(a) — quanto mais tempo na reunião sem compromisso, maior a chance de virar 'não' por inércia.",
  ];
  if (named?.profileNotes.trim()) {
    motives.push(
      `Perfil observado sugere: ${firstSentence(named.profileNotes)} — leve a sério na escolha de tom.`,
    );
  }
  if (ctx.constraints.trim()) {
    motives.push(
      `Restrições da contraparte espelham as suas (${firstSentence(ctx.constraints).toLowerCase()}) — assumir o oposto custa caro.`,
    );
  }
  return motives.slice(0, 4);
}

function generateRisks(
  ctx: MeetingContext,
  weighted: SpecialistActivation[],
): RiskItem[] {
  const risks: RiskItem[] = [];
  const counterpart = counterpartLabel(ctx);
  // Pull "avoid" lines from weighted specialists as risks.
  for (const a of weighted) {
    for (const av of a.output.avoid) {
      risks.push({
        text: av.replace(/\.$/, ""),
        mitigation: `Defina antes: o gatilho que indica esse risco e o que você diz na hora${a.pinned ? " (lente pinada acima)" : ""}.`,
      });
      if (risks.length >= 3) break;
    }
    if (risks.length >= 3) break;
  }
  if (!ctx.batna.trim()) {
    risks.push({
      text: "Você não tem BATNA explícita declarada",
      mitigation:
        "Antes de entrar, escreva em uma frase qual sua melhor alternativa se essa conversa não fechar — leia em voz alta para si mesmo(a).",
    });
  }
  if (ctx.toneTags.length === 0) {
    risks.push({
      text: "Sem tom calibrado, a leitura emocional fica ao acaso",
      mitigation: `Escolha 1 tom dominante para os primeiros 5 minutos com ${counterpart} e ancore.`,
    });
  }
  return risks.slice(0, 5);
}

function generateOpportunities(
  ctx: MeetingContext,
  weighted: SpecialistActivation[],
): string[] {
  const opps: string[] = [];
  for (const a of weighted) {
    if (a.output.anchorPhrase) {
      opps.push(
        `Se ${counterpartLabel(ctx)} abrir espaço, use a leitura de ${a.displayName} como ponte — ela soa menos defensiva do que jogar com seus próprios argumentos.`,
      );
      if (opps.length >= 2) break;
    }
  }
  if (ctx.historyNotes.trim()) {
    opps.push(
      `Trazer à tona um momento concreto do histórico (${firstSentence(ctx.historyNotes).toLowerCase()}) cria continuidade — ${counterpartLabel(ctx)} se sente reconhecido(a).`,
    );
  }
  opps.push(
    `Se a conversa derivar para risco/preocupação, vire pra critério: "qual seria um sinal pra ${counterpartLabel(ctx)} de que esse caminho funciona" — recoloca o eixo em decisão.`,
  );
  return opps.slice(0, 4);
}

function generateAnticipatedQuestions(
  ctx: MeetingContext,
  weighted: SpecialistActivation[],
): AnticipatedQuestion[] {
  const counterpart = counterpartLabel(ctx);
  const items: AnticipatedQuestion[] = [
    {
      question: `Por que isto, e por que agora?`,
      suggestedAnswer: `Porque ${firstSentence(ctx.objective).toLowerCase() || "o tempo de espera tem custo concreto"} — adiar muda o resultado, não anula a decisão.`,
    },
    {
      question: `Quais alternativas você considerou?`,
      suggestedAnswer: ctx.batna.trim()
        ? `${firstSentence(ctx.batna)} — declaração honesta da BATNA aumenta a credibilidade do caso.`
        : `Seja explícito: 2-3 alternativas, e por que cada uma é inferior nesta janela. Vagar aqui é fatal.`,
    },
    {
      question: `Qual o pior caso se isso não funcionar?`,
      suggestedAnswer: `Antecipe o downside numericamente. ${counterpart} valoriza quem já fez essa conta antes da reunião.`,
    },
    {
      question: `Quem mais precisa concordar para isso avançar?`,
      suggestedAnswer:
        "Mapeie a stakeholder map antes — se você não souber, é a primeira coisa que precisa pedir nesta reunião.",
    },
  ];
  // Pull provocative questions from specialists as additional flavors.
  for (const a of weighted) {
    if (a.output.provocativeQuestion && items.length < 6) {
      items.push({
        question: a.output.provocativeQuestion,
        suggestedAnswer: `${a.displayName} levanta isso como teste — prepare uma resposta de 2 frases, sem rodeios.`,
      });
    }
  }
  return items.slice(0, 6);
}

function generateMyQuestions(ctx: MeetingContext): string[] {
  const counterpart = counterpartLabel(ctx);
  return [
    `O que precisa ser verdade ao final desta conversa para ${counterpart} considerar tempo bem investido?`,
    `Qual decisão dessa pauta é a única que ${counterpart} consegue tomar hoje sozinho(a)?`,
    `Se decidíssemos avançar agora, qual o próximo evento concreto na agenda dele(a)?`,
    `Qual a maior preocupação que ${counterpart} ainda não falou em voz alta sobre isso?`,
    `Se isso desse errado, o que ${counterpart} mais lamentaria não ter perguntado a mim hoje?`,
  ];
}

function generateObjections(
  ctx: MeetingContext,
  weighted: SpecialistActivation[],
): ObjectionItem[] {
  const items: ObjectionItem[] = [
    {
      objection: "Não temos orçamento/banda agora.",
      reveals:
        "Sinal de prioridade — não falta de dinheiro, falta hierarquia clara dessa decisão na lista deles.",
      response:
        "Reformule a pergunta: 'qual o trade-off com o que está antes na lista?' — força explicitar a prioridade.",
    },
    {
      objection: "Precisamos pensar / vamos discutir internamente.",
      reveals:
        "Quase sempre = falta de champion claro ou critério de decisão não articulado.",
      response: `Pergunte: 'quem precisa estar nessa próxima conversa, e o que ele(a) precisa ver para dizer sim?' — ajuda ${counterpartLabel(ctx)} a estruturar a defesa interna.`,
    },
  ];
  if (weighted.find((a) => /negocia/i.test(a.displayName))) {
    items.push({
      objection: "Esse valor está fora do que esperávamos.",
      reveals:
        "Pode ser ancoragem (querem testar você) ou genuíno teto. Reação ao número decide qual.",
      response:
        "Não desconte de imediato — pergunte o que muda no escopo se chegar onde eles querem. Mantém valor percebido.",
    });
  }
  return items.slice(0, 4);
}

function generateAnchorPhrases(
  ctx: MeetingContext,
  weighted: SpecialistActivation[],
): AnchorPhrases {
  const counterpart = counterpartLabel(ctx);
  const tone = ctx.toneTags[0] ?? "direto";
  const pinned = weighted.find((a) => a.pinned);
  const closingSeed = pinned?.output.anchorPhrase || "Então, alinhado o que cada um leva daqui — qual o próximo encontro no calendário?";
  return {
    opening: `${counterpart}, antes de mergulhar no mérito — meu objetivo de hoje é sair com clareza sobre ${firstSentence(ctx.objective).toLowerCase() || "os próximos passos concretos"}, no tom mais ${tone} possível. Você concorda com esse foco?`,
    pivot: `Se a gente continuar nesse ângulo, a gente vai gastar a reunião e não vai resolver o que importa. Posso propor a gente voltar pro ponto que decide isso?`,
    closing: closingSeed,
  };
}

function generatePlanB(ctx: MeetingContext): string {
  const counterpart = counterpartLabel(ctx);
  const batna =
    ctx.batna.trim() ||
    "manter a posição atual e marcar uma segunda rodada com mais informação";
  return `Se a conversa derrapar (e os sinais clássicos: ${counterpart} olha o relógio, devolve perguntas técnicas demais, evita compromisso por escrito), pause e diga em voz alta: 'parece que ainda não temos o que precisamos pra fechar hoje — proponho a gente registrar onde estamos e marcar a próxima'. ${batna ? `Sua BATNA: ${firstSentence(batna)}.` : ""} Sair com algo é melhor do que sair com nada — mas só se "algo" for um próximo passo agendado.`;
}

function generateMaterialsChecklist(
  ctx: MeetingContext,
  weighted: SpecialistActivation[],
): string[] {
  const list: string[] = [];
  if (/comercial|negocia|investidor|partner/i.test(ctx.meetingType ?? "")) {
    list.push("Slide com proposta de valor em 1 página");
    list.push("Tabela de preço/condições com 2-3 cenários");
  }
  if (/board|investor/i.test(ctx.meetingType ?? "")) {
    list.push("Cap table atual e a versão pós-decisão");
    list.push("Métricas chave últimos 6 meses (1 página, gráficos)");
  }
  if (ctx.batna.trim()) {
    list.push("Sua BATNA por escrito (papel — não no laptop)");
  }
  list.push("Lista das 5 perguntas que VOCÊ vai fazer (impressas)");
  list.push("Caneta + agenda aberta no próximo passo concreto");
  if (weighted.find((a) => a.pinned)) {
    list.push(
      "Frases-âncora dos especialistas pinados (cartão de bolso, não tela)",
    );
  }
  return list.slice(0, 8);
}

export function generatePrepPlanSections(
  ctx: MeetingContext,
  activations: SpecialistActivation[],
): PrepPlanSections {
  const weighted = pickPinned(activations);
  return {
    executiveSummary: generateExecutiveSummary(ctx, weighted),
    objectives: generateObjectives(ctx, weighted),
    counterpartMotives: generateCounterpartMotives(ctx),
    risks: generateRisks(ctx, weighted),
    opportunities: generateOpportunities(ctx, weighted),
    anticipatedQuestions: generateAnticipatedQuestions(ctx, weighted),
    myQuestions: generateMyQuestions(ctx),
    objections: generateObjections(ctx, weighted),
    anchorPhrases: generateAnchorPhrases(ctx, weighted),
    planB: generatePlanB(ctx),
    materialsChecklist: generateMaterialsChecklist(ctx, weighted),
  };
}

/**
 * Stream the plan section by section so the UI can render incrementally.
 * Acceptance target: first content < 5s, full plan < 45s. With this
 * mock pacing the full plan completes in ~5s — well within budget for a
 * front-end prototype.
 */
export async function streamPrepPlan(
  ctx: MeetingContext,
  activations: SpecialistActivation[],
  onSection: <K extends keyof PrepPlanSections>(
    key: K,
    value: PrepPlanSections[K],
    isLast: boolean,
  ) => void,
): Promise<void> {
  const sections = generatePrepPlanSections(ctx, activations);
  const order: (keyof PrepPlanSections)[] = [
    "executiveSummary",
    "objectives",
    "counterpartMotives",
    "risks",
    "opportunities",
    "anticipatedQuestions",
    "myQuestions",
    "objections",
    "anchorPhrases",
    "planB",
    "materialsChecklist",
  ];

  await delay(350 + Math.random() * 400); // initial "thinking…"
  for (let i = 0; i < order.length; i++) {
    const key = order[i];
    const isLast = i === order.length - 1;
    onSection(key, sections[key] as never, isLast);
    if (!isLast) await delay(280 + Math.random() * 220);
  }
}

/**
 * Regenerate a single section without disturbing the others. Returns the
 * fresh value for the section; the caller patches it into the plan and
 * decides what counts as "edited" vs "regenerated".
 */
export async function regeneratePrepPlanSection(
  ctx: MeetingContext,
  activations: SpecialistActivation[],
  section: PrepPlanSection,
): Promise<unknown> {
  await delay(700 + Math.random() * 500);
  const fresh = generatePrepPlanSections(ctx, activations);
  return fresh[section];
}

// Keep linter happy — the empty sections helper is re-exported for the
// store; importing from types directly works too but this avoids drift.
export { emptyPrepPlanSections };
