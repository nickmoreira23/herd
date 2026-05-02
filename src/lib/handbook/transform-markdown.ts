const TODO_MARKER_REGEX = /<!--\s*TODO:[\s\S]*?-->/g;
const TODO_PLACEHOLDER_HTML = '<div data-handbook-todo="true"></div>';

export function transformMarkdown(body: string): string {
  return body.replace(TODO_MARKER_REGEX, TODO_PLACEHOLDER_HTML);
}

export const TODO_PLACEHOLDER_TEXT = {
  "pt-BR": "Esta seção está pendente de preenchimento.",
  "en-US": "This section is pending.",
} as const;
