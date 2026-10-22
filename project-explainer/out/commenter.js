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
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertComments = insertComments;
const fs = __importStar(require("fs"));
const COMMENT_START = "// 🤖 [Project Explainer]";
const BLOCK_START = "/* 📦 [Project Explainer - Módulo]";
const BLOCK_END = "*/";
async function insertComments(analyses, root) {
    for (const analysis of analyses) {
        if (!analysis.moduleComment && analysis.comments.length === 0)
            continue;
        try {
            const original = fs.readFileSync(analysis.abs, "utf-8");
            const updated = applyComments(original, analysis);
            fs.writeFileSync(analysis.abs, updated, "utf-8");
        }
        catch (err) {
            console.error(`No se pudo escribir ${analysis.rel}:`, err.message);
        }
    }
}
function applyComments(source, analysis) {
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
function stripExistingComments(source) {
    // Remove block module comments
    const blockRegex = /\/\* 📦 \[Project Explainer - Módulo\][\s\S]*?\*\/\n?/g;
    // Remove inline comments
    const lineRegex = /[ \t]*\/\/ 🤖 \[Project Explainer\][^\n]*\n?/g;
    return source.replace(blockRegex, "").replace(lineRegex, "");
}
function getIndent(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : "";
}
function formatComment(comment, indent) {
    // For multiline comments, wrap nicely
    const maxLen = 90;
    const words = comment.split(" ");
    const lines = [];
    let current = `${indent}${COMMENT_START} `;
    for (const word of words) {
        if ((current + word).length > maxLen) {
            lines.push(current.trimEnd());
            current = `${indent}${COMMENT_START} ${word} `;
        }
        else {
            current += word + " ";
        }
    }
    lines.push(current.trimEnd());
    return lines.join("\n");
}
//# sourceMappingURL=commenter.js.map