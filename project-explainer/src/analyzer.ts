import * as fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

export interface FileAnalysis {
  rel: string;
  abs: string;
  comments: LineComment[];
  moduleComment: string;
}

export interface LineComment {
  line: number; // 0-indexed
  comment: string;
}

const MAX_FILE_CHARS = 12000;

export async function analyzeProject(
  files: { rel: string; abs: string; ext: string }[],
  root: string,
  apiKey: string,
  onProgress: (msg: string) => void,
): Promise<FileAnalysis[]> {
  const client = new Anthropic({ apiKey });
  const results: FileAnalysis[] = [];

  // Build project tree for context
  const tree = files.map((f) => f.rel).join("\n");

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress(`Analizando (${i + 1}/${files.length}): ${file.rel}`);

    let content: string;
    try {
      content = fs.readFileSync(file.abs, "utf-8");
    } catch {
      continue;
    }

    if (content.trim().length === 0) continue;

    // Truncate very large files
    const truncated =
      content.length > MAX_FILE_CHARS
        ? content.slice(0, MAX_FILE_CHARS) +
          "\n// ... [archivo truncado por tamaño]"
        : content;

    const prompt = buildPrompt(file.rel, truncated, tree);

    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = (msg.content[0] as any).text as string;
      const parsed = parseResponse(raw);

      results.push({
        rel: file.rel,
        abs: file.abs,
        moduleComment: parsed.moduleComment,
        comments: parsed.comments,
      });
    } catch (err: any) {
      // Skip file on error but continue
      console.error(`Error analizando ${file.rel}:`, err.message);
    }
  }

  return results;
}

function buildPrompt(
  filePath: string,
  code: string,
  projectTree: string,
): string {
  return `Eres un experto analizador de código. Analiza el siguiente archivo y responde ÚNICAMENTE en el formato JSON especificado, sin texto extra.

ÁRBOL DEL PROYECTO (contexto):
${projectTree}

ARCHIVO: ${filePath}
\`\`\`
${code}
\`\`\`

Responde SOLO con este JSON (sin markdown, sin explicaciones extra):
{
  "moduleComment": "Descripción de qué hace este archivo/módulo completo en 2-4 líneas",
  "comments": [
    {
      "line": <número de línea 0-indexed donde insertar el comentario ANTES>,
      "comment": "Explicación clara de qué hace esta función/clase/bloque/línea compleja"
    }
  ]
}

REGLAS:
- El moduleComment describe el propósito general del archivo
- En comments, marca CADA función, clase, método, hook, middleware, ruta, export importante
- Para líneas complejas (ternarios, regex, lógica no obvia) añade comentario inline
- Usa español claro y directo
- line debe ser el número de línea exacto (0-indexed) donde va el comentario (encima de lo que explica)
- No repitas comentarios obvios (no expliques "import X from Y")
- Sé preciso: di QUÉ hace, QUÉ recibe y QUÉ retorna cuando aplique`;
}

function parseResponse(raw: string): {
  moduleComment: string;
  comments: LineComment[];
} {
  try {
    // Strip possible markdown fences
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      moduleComment: parsed.moduleComment || "",
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    };
  } catch {
    return { moduleComment: "", comments: [] };
  }
}
