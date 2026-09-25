export const PRICE_REFERENCE: Record<string, Record<string, { min: number; avg: number; premium: number; hourly: number }>> = {
  "desarrollo web": {
    global: { min: 20, avg: 35, premium: 60, hourly: 25 },
    bolivia: { min: 15, avg: 30, premium: 55, hourly: 20 },
    mexico: { min: 25, avg: 40, premium: 70, hourly: 30 },
    argentina: { min: 20, avg: 35, premium: 60, hourly: 25 },
    chile: { min: 30, avg: 45, premium: 75, hourly: 35 },
  },
  "diseño": {
    global: { min: 15, avg: 25, premium: 45, hourly: 18 },
    bolivia: { min: 12, avg: 22, premium: 40, hourly: 15 },
    mexico: { min: 18, avg: 28, premium: 50, hourly: 20 },
    argentina: { min: 15, avg: 25, premium: 45, hourly: 18 },
    chile: { min: 20, avg: 30, premium: 55, hourly: 22 },
  },
  marketing: {
    global: { min: 18, avg: 30, premium: 55, hourly: 22 },
    bolivia: { min: 15, avg: 28, premium: 50, hourly: 20 },
    mexico: { min: 20, avg: 32, premium: 60, hourly: 24 },
    argentina: { min: 18, avg: 30, premium: 55, hourly: 22 },
    chile: { min: 22, avg: 35, premium: 65, hourly: 26 },
  },
  seo: {
    global: { min: 18, avg: 28, premium: 50, hourly: 22 },
    bolivia: { min: 15, avg: 25, premium: 45, hourly: 18 },
    mexico: { min: 18, avg: 30, premium: 55, hourly: 22 },
    argentina: { min: 18, avg: 28, premium: 50, hourly: 22 },
    chile: { min: 20, avg: 32, premium: 58, hourly: 24 },
  },
};
// creado por pato dev y askforvini
