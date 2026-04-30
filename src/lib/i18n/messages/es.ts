/**
 * EXPERIMENTAL — not in production rotation.
 *
 * This dictionary is preserved as a template for future Spanish localization,
 * but es-ES (or any Spanish variant) is NOT currently in SUPPORTED_LOCALES.
 * It will not be loaded by t() or useT(). When a Spanish-speaking customer
 * justifies the work, this becomes the starting point — but until then,
 * keys here may drift from pt-BR/en-US without breaking anything.
 *
 * Do not import from this file in production code.
 */
import type { MessageKey } from "./pt-BR";

export const messages: Partial<Record<MessageKey, string>> = {
  // Block category labels
  "categories.commerce": "Comercio",
  "categories.communication": "Comunicación",
  "categories.schedule": "Agenda",
  "categories.automation": "Automatización",
  "categories.product": "Producto",
  "categories.marketing": "Marketing",
  "categories.sales": "Ventas",
  "categories.finance": "Finanzas",
  "categories.legal": "Legal",
  "categories.media": "Medios",
  "categories.data": "Datos",

  // Block names
  "blocks.products": "Productos",
  "blocks.agents": "Agentes",
  "blocks.partners": "Beneficios",
  "blocks.perks": "Ventajas",
  "blocks.community": "Comunidad",
  "blocks.pages": "Páginas",
  "blocks.meetings": "Reuniones",
  "blocks.events": "Eventos",
  "blocks.tasks": "Tareas",
  "blocks.knowledge": "Knowledge",
  "blocks.documents": "Documentos",
  "blocks.images": "Imágenes",
  "blocks.videos": "Videos",
  "blocks.audios": "Audios",
  "blocks.tables": "Tablas",
  "blocks.forms": "Formularios",
  "blocks.links": "Enlaces",
  "blocks.feeds": "Feeds",
  "blocks.apps": "Apps",
  "blocks.messages": "Mensajes",
  "blocks.notes": "Notas",
  "blocks.locations": "Ubicaciones",
  "blocks.feedbacks": "Comentarios",
  "blocks.services": "Servicios",
  "blocks.contacts": "Contactos",
  "blocks.companies": "Empresas",
  "blocks.deals": "Oportunidades",
  "blocks.campaigns": "Campañas",
  "blocks.experiences": "Experiencias",
  "blocks.subscriptions": "Suscripciones",
  "blocks.routines": "Rutinas",

  // Experiences block
  "experiences.title": "Experiencias",
  "experiences.subtitle":
    "Experiencias ofrecidas — talleres, retiros y eventos inmersivos.",
  "experiences.create": "Nueva experiencia",
  "experiences.empty.title": "No hay experiencias todavía",
  "experiences.empty.body": 'Crea la primera en "Nueva experiencia".',
  "experiences.fields.name": "Nombre",
  "experiences.fields.headline": "Titular",
  "experiences.fields.description": "Descripción",
  "experiences.fields.format": "Formato",
  "experiences.fields.status": "Estado",
  "experiences.fields.location": "Ubicación",
  "experiences.fields.startDate": "Inicio",
  "experiences.fields.endDate": "Fin",
  "experiences.fields.duration": "Duración (min)",
  "experiences.fields.capacity": "Capacidad",
  "experiences.fields.price": "Precio",
  "experiences.fields.currency": "Moneda",
  "experiences.fields.coverImage": "Imagen de portada",
  "experiences.fields.tags": "Etiquetas",
  "experiences.fields.host": "Anfitrión (UUID)",
  "experiences.format.IN_PERSON": "Presencial",
  "experiences.format.ONLINE": "En línea",
  "experiences.format.HYBRID": "Híbrido",
  "experiences.format.SELF_PACED": "Autodirigido",
  "experiences.status.DRAFT": "Borrador",
  "experiences.status.SCHEDULED": "Agendada",
  "experiences.status.OPEN": "Abierta",
  "experiences.status.SOLD_OUT": "Agotada",
  "experiences.status.IN_PROGRESS": "En curso",
  "experiences.status.COMPLETED": "Completada",
  "experiences.status.CANCELLED": "Cancelada",
  "experiences.filter.allStatus": "Todos los estados",
  "experiences.filter.allFormats": "Todos los formatos",
  "experiences.search.placeholder": "Buscar nombre, ubicación…",

  // Routines block
  "routines.title": "Rutinas",
  "routines.subtitle":
    "Automatizaciones ejecutadas por agentes — programadas, manuales o por eventos.",
  "routines.create": "Nueva rutina",
  "routines.empty.title": "No hay rutinas todavía",
  "routines.empty.body": 'Crea la primera en "Nueva rutina".',
  "routines.search.placeholder": "Buscar nombre, agente, prompt…",
  "routines.filter.allStatus": "Todos los estados",
  "routines.filter.allTriggers": "Todos los disparadores",
  "routines.fields.name": "Nombre",
  "routines.fields.description": "Descripción",
  "routines.fields.prompt": "Prompt",
  "routines.fields.promptHint":
    "Texto enviado al agente. Usa {{variable}} para marcadores.",
  "routines.fields.agent": "Agente",
  "routines.fields.trigger": "Disparador",
  "routines.fields.cron": "Cron",
  "routines.fields.timezone": "Zona horaria",
  "routines.fields.eventBlock": "Bloque del evento",
  "routines.fields.eventType": "Tipo de evento",
  "routines.fields.inputs": "Entradas por defecto (JSON)",
  "routines.fields.outputFormat": "Formato de salida",
  "routines.fields.tags": "Etiquetas",
  "routines.fields.status": "Estado & agente",
  "routines.trigger.MANUAL": "Manual",
  "routines.trigger.SCHEDULE": "Programado",
  "routines.trigger.EVENT": "Evento",
  "routines.status.DRAFT": "Borrador",
  "routines.status.ACTIVE": "Activa",
  "routines.status.PAUSED": "Pausada",
  "routines.status.ARCHIVED": "Archivada",
  "routines.runStatus.QUEUED": "En cola",
  "routines.runStatus.RUNNING": "Ejecutando",
  "routines.runStatus.SUCCESS": "Éxito",
  "routines.runStatus.FAILED": "Falló",
  "routines.runStatus.CANCELLED": "Cancelada",
  "routines.runNow": "Ejecutar ahora",
  "routines.pause": "Pausar",
  "routines.resume": "Reanudar",
  "routines.lastRunAt": "Última ejecución",
  "routines.nextRunAt": "Próxima",
  "routines.runCount": "{count} ejecuciones",
  "routines.run.title": "Detalles de la ejecución",
  "routines.run.history": "Ejecuciones",
  "routines.run.empty": "Sin ejecuciones aún.",
  "routines.run.trigger": "Disparador",
  "routines.run.startedAt": "Inicio",
  "routines.run.completedAt": "Fin",
  "routines.run.duration": "Duración",
  "routines.run.tokens": "Tokens",
  "routines.run.input": "Entrada",
  "routines.run.output": "Salida",
  "routines.run.error": "Error",
  "routines.run.toastSuccess": "Rutina ejecutada con éxito",
  "routines.run.toastFailed": "Rutina falló — revisa los detalles",
  "routines.wizard.title": "Nueva rutina",
  "routines.wizard.next": "Siguiente",
  "routines.wizard.back": "Volver",
  "routines.wizard.activate": "Activar ahora",
  "routines.wizard.saveDraft": "Guardar como borrador",
  "routines.wizard.steps.identity": "Identidad",
  "routines.wizard.steps.agent": "Agente",
  "routines.wizard.steps.trigger": "Disparador",
  "routines.wizard.steps.inputs": "Entradas",
  "routines.wizard.steps.prompt": "Prompt",
  "routines.wizard.steps.review": "Revisión",
  "routines.wizard.identity.namePlaceholder":
    "Ej: Resumen diario de oportunidades",
  "routines.wizard.identity.descriptionPlaceholder":
    "Qué hace esta rutina y por qué existe.",
  "routines.wizard.agent.help":
    "Elige el agente que ejecutará esta rutina. Usa los filtros para encontrar el ideal.",
  "routines.wizard.trigger.manualHelp":
    'Se ejecuta cuando alguien hace clic en "Ejecutar ahora".',
  "routines.wizard.trigger.scheduleHelp":
    "Se ejecuta en horarios definidos por una expresión cron.",
  "routines.wizard.trigger.eventHelp":
    "Se ejecuta cuando algo sucede en otro bloque del sistema.",
  "routines.wizard.trigger.manualNote":
    'Sin disparador automático. Puedes ejecutar esta rutina en cualquier momento usando "Ejecutar ahora".',
  "routines.wizard.inputs.help":
    "Define entradas por defecto disponibles en el prompt como {{variable}}. Puedes sobrescribirlas al ejecutar.",
  "routines.wizard.review.identity": "Identidad",
  "routines.wizard.review.agent": "Agente",
  "routines.wizard.review.trigger": "Disparador",
  "routines.wizard.review.inputs": "Entradas por defecto",
  "routines.wizard.review.prompt": "Prompt",
  "routines.wizard.steps.flow": "Flujo",
  "routines.wizard.identity.subtitle":
    "Cómo se identifica esta rutina en tu organización.",
  "routines.wizard.trigger.subtitle": "Cuándo debe ejecutarse esta rutina.",
  "routines.wizard.flow.subtitle":
    "Diseña el flujo de ejecución. Haz clic en un paso para configurar el agente, prompt y formato de salida. Usa el botón + debajo de cualquier paso para añadir otro inmediatamente después.",
  "routines.wizard.flow.invalidWarning":
    "{count} paso(s) sin agente o prompt — complétalos para continuar.",
  "routines.wizard.review.subtitle":
    "Revisa todo antes de guardar. Puedes volver a cualquier paso desde el encabezado.",
  "routines.wizard.review.flow": "Flujo",
  "routines.wizard.review.stepCount": "Total de pasos",
  "routines.detail.flow": "Flujo",
  "routines.detail.flowEditHint":
    "Haz clic en un paso para editarlo; arrastra para reposicionarlo; usa + para añadir pasos.",
  "routines.detail.flowTraceHint":
    "Visualizando una ejecución: los pasos verdes tuvieron éxito, los rojos fallaron.",
  "routines.clearTrace": "Salir del modo ejecución",
  "routines.tooltip.name":
    "Cómo aparece esta rutina en listas y logs. Sé descriptivo.",
  "routines.tooltip.description":
    "Explica el propósito de la rutina para quien lo lea después (tú o el equipo).",
  "routines.tooltip.tags":
    "Etiquetas para agrupar rutinas relacionadas. Útiles para búsqueda y filtros.",
  "routines.tooltip.triggerManual":
    'Tienes que pulsar "Ejecutar ahora" cada vez. Ideal para automatizaciones puntuales.',
  "routines.tooltip.triggerSchedule":
    "Se ejecuta automáticamente en horarios definidos (ej: lunes a las 9 AM).",
  "routines.tooltip.triggerEvent":
    'Se ejecuta cuando algo pasa en otro bloque (ej: "deal pasa a WON").',
  "routines.tooltip.trigger": "Qué dispara la ejecución de la rutina.",
  "routines.tooltip.flow":
    "Secuencia ordenada de pasos. Cada paso es un agente respondiendo un prompt; la salida de un paso puede ser la entrada del siguiente.",

  // Common UI
  "common.back": "Volver",
  "common.save": "Guardar",
  "common.savedAt": "Guardado {time}",
  "common.cancel": "Cancelar",
  "common.delete": "Eliminar",
  "common.create": "Crear",
  "common.confirmDelete": '¿Eliminar "{name}"?',
  "common.tags.add": "Agregar etiqueta…",
  "common.notes": "Notas",
  "common.view.kanban": "Vista kanban",
  "common.view.list": "Vista de lista",
  "common.view.grid": "Vista de cuadrícula",
};
