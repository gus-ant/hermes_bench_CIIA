/**
 * Tool abstraction for the HERMES-BENCH system.
 * All tools are simulated in MOCK_MODE.
 */

export interface ToolSchema {
  type: "object";
  properties: Record<string, { type: string; description: string; enum?: string[] }>;
  required: string[];
}

export abstract class Tool {
  abstract name: string;
  abstract description: string;
  abstract schema: ToolSchema;

  abstract execute(args: Record<string, unknown>): Promise<ToolResult>;
  abstract validate(args: Record<string, unknown>): ValidationResult;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  durationMs: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Simulated File System State ──────────────────────────────────────────

export const mockFileSystem: Record<string, string[]> = {
  "/CIIA": ["Administrativo", "Projetos", "Capacitacao", "Comunicacao", "Financeiro", "Pesquisa", "Inbox"],
  "/CIIA/Administrativo": ["Atas", "Contratos", "Parcerias", "Relatorios"],
  "/CIIA/Administrativo/Atas": ["2024", "2025"],
  "/CIIA/Administrativo/Atas/2025": [
    "ata_admin_reuniao-board_2025-01.pdf",
    "ata_admin_reuniao-board_2025-02.pdf",
  ],
  "/CIIA/Projetos": ["Atlas", "Hermes", "Lyra", "Daedalus"],
  "/CIIA/Projetos/Hermes": ["Sprints", "Documentacao", "Pesquisa"],
  "/CIIA/Projetos/Hermes/Sprints": [
    "relatorio_hermes_sprint1_2024-10.pdf",
    "relatorio_hermes_sprint2_2024-11.pdf",
    "relatorio_hermes_sprint3_2024-12.pdf",
    "relatorio_hermes_sprint4_2025-01.pdf",
    "relatorio_hermes_sprint5_2025-02.pdf",
    "relatorio_hermes_sprint6_2025-03.pdf",
  ],
  "/CIIA/Projetos/Lyra": ["Sprints", "Datasets", "Publicacoes"],
  "/CIIA/Projetos/Atlas": ["Sprints", "Modelos", "Datasets"],
  "/CIIA/Capacitacao": ["Materiais", "Trilhas", "Eventos", "Presencas"],
  "/CIIA/Comunicacao": ["Posts", "Campanhas", "Templates", "Midias"],
  "/CIIA/Financeiro": ["NotasFiscais", "Contratos", "Relatorios"],
  "/CIIA/Inbox": [
    "Ata Reunião.pdf",
    "ata_reuniao_v2.pdf",
    "SPRINT6_ATLAS_FINAL.pdf",
    "material_capacitacao_nlp.pdf",
    "NF_AWS_Marco_2025.pdf",
    "NF_AWS_Marco_2025 (1).pdf",
    "foto_evento_hackathon.jpg",
    "post_instagram_draft.docx",
    "contrato_novo_membro.pdf",
    "dataset_v1.csv",
    "dataset_v2.csv",
    "ideias_novo_projeto.txt",
    "apresentacao_tcc.pdf",
    "logo_ciia.png",
    "backup_dados.zip",
  ],
};

// ─── Tool Implementations ─────────────────────────────────────────────────

export class SearchFileTool extends Tool {
  name = "search_file";
  description = "Search for files in the CIIA Google Drive by name or keyword.";
  schema: ToolSchema = {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (filename or keyword)" },
      folder: { type: "string", description: "Optional: restrict search to this folder path" },
    },
    required: ["query"],
  };

  validate(args: Record<string, unknown>): ValidationResult {
    if (!args.query || typeof args.query !== "string") {
      return { valid: false, errors: ["query must be a non-empty string"] };
    }
    return { valid: true, errors: [] };
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const start = Date.now();
    const query = (args.query as string).toLowerCase();
    const results: string[] = [];

    for (const [folder, files] of Object.entries(mockFileSystem)) {
      for (const file of files) {
        if (file.toLowerCase().includes(query)) {
          results.push(`${folder}/${file}`);
        }
      }
    }

    await simulateDelay(100, 400);
    return {
      success: true,
      data: { results, count: results.length },
      durationMs: Date.now() - start,
    };
  }
}

export class ReadFileTool extends Tool {
  name = "read_file";
  description = "Read the metadata and summary of a file in the CIIA Google Drive.";
  schema: ToolSchema = {
    type: "object",
    properties: {
      path: { type: "string", description: "Full path to the file" },
    },
    required: ["path"],
  };

  validate(args: Record<string, unknown>): ValidationResult {
    if (!args.path || typeof args.path !== "string") {
      return { valid: false, errors: ["path must be a non-empty string"] };
    }
    return { valid: true, errors: [] };
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const start = Date.now();
    const path = args.path as string;

    const metadata = {
      path,
      name: path.split("/").pop(),
      size: `${(Math.random() * 5 + 0.5).toFixed(1)}MB`,
      created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      modified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      summary: `Documento relacionado ao arquivo ${path.split("/").pop()}. Contém informações relevantes para a organização do CIIA.`,
    };

    await simulateDelay(200, 600);
    return {
      success: true,
      data: metadata,
      durationMs: Date.now() - start,
    };
  }
}

export class MoveFileTool extends Tool {
  name = "move_file";
  description = "Move a file to a different folder in the CIIA Google Drive.";
  schema: ToolSchema = {
    type: "object",
    properties: {
      source: { type: "string", description: "Current path of the file" },
      destination: { type: "string", description: "Destination folder path" },
      newName: { type: "string", description: "Optional new filename after move" },
    },
    required: ["source", "destination"],
  };

  validate(args: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    if (!args.source || typeof args.source !== "string") errors.push("source must be a string");
    if (!args.destination || typeof args.destination !== "string") errors.push("destination must be a string");
    return { valid: errors.length === 0, errors };
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const start = Date.now();
    const source = args.source as string;
    const destination = args.destination as string;
    const newName = (args.newName as string) || source.split("/").pop() || "";

    // Simulate move in mock file system
    const destFiles = mockFileSystem[destination];
    if (!destFiles) {
      return {
        success: false,
        error: `Destination folder not found: ${destination}`,
        durationMs: Date.now() - start,
      };
    }

    await simulateDelay(300, 800);
    return {
      success: true,
      data: {
        moved: true,
        from: source,
        to: `${destination}/${newName}`,
        timestamp: new Date().toISOString(),
      },
      durationMs: Date.now() - start,
    };
  }
}

export class CreateFolderTool extends Tool {
  name = "create_folder";
  description = "Create a new folder in the CIIA Google Drive.";
  schema: ToolSchema = {
    type: "object",
    properties: {
      path: { type: "string", description: "Full path for the new folder" },
      parent: { type: "string", description: "Parent folder path" },
      name: { type: "string", description: "Folder name" },
    },
    required: ["path"],
  };

  validate(args: Record<string, unknown>): ValidationResult {
    if (!args.path || typeof args.path !== "string") {
      return { valid: false, errors: ["path must be a non-empty string"] };
    }
    return { valid: true, errors: [] };
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const start = Date.now();
    const path = args.path as string;

    // Add to mock file system
    if (!mockFileSystem[path]) {
      mockFileSystem[path] = [];
    }

    await simulateDelay(200, 500);
    return {
      success: true,
      data: {
        created: true,
        path,
        timestamp: new Date().toISOString(),
      },
      durationMs: Date.now() - start,
    };
  }
}

export class ListFolderTool extends Tool {
  name = "list_folder";
  description = "List the contents of a folder in the CIIA Google Drive.";
  schema: ToolSchema = {
    type: "object",
    properties: {
      path: { type: "string", description: "Folder path to list" },
    },
    required: ["path"],
  };

  validate(args: Record<string, unknown>): ValidationResult {
    if (!args.path || typeof args.path !== "string") {
      return { valid: false, errors: ["path must be a non-empty string"] };
    }
    return { valid: true, errors: [] };
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const start = Date.now();
    const path = args.path as string;
    const contents = mockFileSystem[path];

    if (!contents) {
      return {
        success: false,
        error: `Folder not found: ${path}`,
        durationMs: Date.now() - start,
      };
    }

    await simulateDelay(100, 300);
    return {
      success: true,
      data: {
        path,
        items: contents,
        count: contents.length,
      },
      durationMs: Date.now() - start,
    };
  }
}

// ─── Tool Registry ────────────────────────────────────────────────────────

export const toolRegistry: Record<string, Tool> = {
  search_file: new SearchFileTool(),
  read_file: new ReadFileTool(),
  move_file: new MoveFileTool(),
  create_folder: new CreateFolderTool(),
  list_folder: new ListFolderTool(),
};

export function getTool(name: string): Tool | undefined {
  return toolRegistry[name];
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function simulateDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}
