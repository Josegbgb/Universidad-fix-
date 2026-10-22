"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeProject = analyzeProject;
const fs = __importStar(require("fs"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const MAX_FILE_CHARS = 12000;
async function analyzeProject(files, root, apiKey, onProgress) {
    const client = new sdk_1.default({ apiKey });
    const results = [];
    // Build project tree for context
    const tree = files.map((f) => f.rel).join("\n");
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress(`Analizando (${i + 1}/${files.length}): ${file.rel}`);
        let content;
        try {
            content = fs.readFileSync(file.abs, "utf-8");
        }
        catch {
            continue;
        }
        if (content.trim().length === 0)
            continue;
        // Truncate very large files
        const truncated = content.length > MAX_FILE_CHARS
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
            const raw = msg.content[0].text;
            const parsed = parseResponse(raw);
            results.push({
                rel: file.rel,
                abs: file.abs,
                moduleComment: parsed.moduleComment,
                comments: parsed.comments,
            });
        }
        catch (err) {
            // Skip file on error but continue
            console.error(`Error analizando ${file.rel}:`, err.message);
        }
    }
    return results;
}
function buildPrompt(filePath, code, projectTree) {
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
function parseResponse(raw) {
    try {
        // Strip possible markdown fences
        const clean = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        return {
            moduleComment: parsed.moduleComment || "",
            comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        };
    }
    catch {
        return { moduleComment: "", comments: [] };
    }
}
//# sourceMappingURL=analyzer.js.map