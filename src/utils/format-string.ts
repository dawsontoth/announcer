export function formatString(template: string, name: string): string {
  return template.replace(/{name}/g, name);
}
