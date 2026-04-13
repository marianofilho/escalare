// src/utils/culto.ts
export function formatarTipoCulto(tipo: string): string {
  const mapa: Record<string, string> = {
    CULTO_DOMINGO_MANHA: "Culto Domingo Manhã",
    CULTO_DOMINGO_NOITE: "Culto Domingo Noite",
    CULTO_SEMANA: "Culto de Semana",
    ENSAIO: "Ensaio",
    SEMANA_ORACAO: "Semana de Oração",
    ESPECIAL: "Culto Especial",
    OUTRO: "Outro",
  }
  return mapa[tipo] ?? tipo
}

export function formatarDataHora(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}