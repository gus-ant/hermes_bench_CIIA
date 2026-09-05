import { AgentDefinition } from "@/lib/types";

export const agentsData: AgentDefinition[] = [
  {
    id: "capacitacao",
    slug: "capacitacao",
    name: "Capacitação e Engajamento",
    description:
      "Agente responsável por criar e gerenciar atividades de capacitação, desafios, competições e engajamento dos membros do CIIA.",
    icon: "🎓",
    color: "#8B5CF6",
    taskCodes: ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C10"],
    highlights: ["qualidade", "criatividade", "adequação pedagógica", "completude"],
  },
  {
    id: "drive",
    slug: "drive",
    name: "Organização do Google Drive",
    description:
      "Agente responsável por classificar, organizar, renomear e estruturar arquivos no Google Drive do CIIA de forma inteligente e auditável.",
    icon: "📁",
    color: "#F59E0B",
    taskCodes: ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10"],
    highlights: ["tool calling", "classificação", "precisão", "segurança"],
  },
  {
    id: "comunicacao",
    slug: "comunicacao",
    name: "Comunicação e Redes Sociais",
    description:
      "Agente responsável por criar, revisar e planejar conteúdo para as redes sociais e comunicação institucional do CIIA.",
    icon: "📢",
    color: "#EC4899",
    taskCodes: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10"],
    highlights: ["qualidade", "adequação institucional", "criatividade", "adaptação"],
  },
];
