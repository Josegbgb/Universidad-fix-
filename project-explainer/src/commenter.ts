import * as fs from "fs";
import * as path from "path";
import { FileAnalysis } from "./analyzer";

const COMMENT_START = "// 🤖 [Project Explainer]";
const BLOCK_START = "/* 📦 [Project Explainer - Módulo]";
const BLOCK_END = "*/";

export async function insertComments(
  analyses: FileAnalysis[],
  root: string,
): Promise<void> {
  for (const analysis of analyses) {
    if (!analysis.moduleComment && analysis.comments.length === 0) continue;

    try {
      const original = fs.readFileSync(analysis.abs, "utf-8");
      const updated = applyComments(original, analysis);
      fs.writeFileSync(analysis.abs, updated, "utf-8");
    } catch (err: any) {
      console.error(`No se pudo escribir ${analysis.rel}:`, err.message);
    }
  }
}

function applyComments(source: string, analysis: FileAnalysis): string {
  // First strip any existing Project Explainer comments to avoid duplicates
  const stripped = stripExistingComments(source);
  const lines = stripped.split("\n");

  // Sort comments by line descending so insertions don't shift indices
  const sorted = [...analysis.comments].sort((a, b) => b.line - a.line);

  for (const { line, comment } of sorted) {
    const idx = Math.max(0, Math.min(line, lines.length));
    const indent = getIndent(lines[idx] || "");
    const formatted = formatComment(comment, indent);
    lines.splice(idx, 0, formatted);
  }

  // Prepend module-level block comment at the very top
  const moduleBlock = analysis.moduleComment
    ? `${BLOCK_START}\n * ${analysis.moduleComment.replace(/\n/g, "\n * ")}\n${BLOCK_END}\n`
    : "";

  return moduleBlock + lines.join("\n");
}

function stripExistingComments(source: string): string {
  // Remove block module comments
  const blockRegex = /\/\* 📦 \[Project Explainer - Módulo\][\s\S]*?\*\/\n?/g;
  // Remove inline comments
  const lineRegex = /[ \t]*\/\/ 🤖 \[Project Explainer\][^\n]*\n?/g;
  return source.replace(blockRegex, "").replace(lineRegex, "");
}

function getIndent(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : "";
}

function formatComment(comment: string, indent: string): string {
  // For multiline comments, wrap nicely
  const maxLen = 90;
  const words = comment.split(" ");
  const lines: string[] = [];
  let current = `${indent}${COMMENT_START} `;

  for (const word of words) {
    if ((current + word).length > maxLen) {
      lines.push(current.trimEnd());
      current = `${indent}${COMMENT_START} ${word} `;
    } else {
      current += word + " ";
    }
  }
  lines.push(current.trimEnd());
  return lines.join("\n");
}
