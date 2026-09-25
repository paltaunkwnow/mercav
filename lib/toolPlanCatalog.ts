export const TOOL_REQUIREMENTS: Record<string, Array<string>> = {
  "roi-calculator": ["FREE", "PROFESSIONAL", "EMPRESA", "ELITE"],
  "contract-generator": ["EMPRESA", "ELITE"],
  "seo-analyzer": ["PROFESSIONAL", "EMPRESA", "ELITE"],
  "price-simulator": ["PROFESSIONAL", "EMPRESA", "ELITE"],
  "palette-generator": ["FREE", "PROFESSIONAL", "EMPRESA", "ELITE"],
  "prompt-generator": ["ELITE"],
  "pos-system": ["FREE", "PROFESSIONAL", "EMPRESA", "ELITE"],
};

export function toolPlanLabel(toolName: string) {
  return TOOL_REQUIREMENTS[toolName]?.join(" / ") || "FREE+";
}
// creado por Patodev y Invertilo
