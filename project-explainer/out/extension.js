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
exports.activate = activate;
exports.collectFiles = collectFiles;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const analyzer_1 = require("./analyzer");
const commenter_1 = require("./commenter");
const IGNORED_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "out",
    "coverage",
    ".cache",
    ".vscode",
    "__pycache__",
    ".turbo",
]);
const ALLOWED_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".env.example",
    ".html",
    ".css",
    ".scss",
]);
function activate(ctx) {
    const cmd = vscode.commands.registerCommand("projectExplainer.explain", async () => {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            vscode.window.showErrorMessage("Abre un proyecto primero.");
            return;
        }
        const root = folders[0].uri.fsPath;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "🔍 Project Explainer",
            cancellable: false,
        }, async (progress) => {
            progress.report({ message: "Leyendo archivos del proyecto..." });
            const files = collectFiles(root);
            if (files.length === 0) {
                vscode.window.showWarningMessage("No se encontraron archivos para analizar.");
                return;
            }
            progress.report({
                message: `Analizando ${files.length} archivos con IA...`,
            });
            const apiKey = vscode.workspace
                .getConfiguration("projectExplainer")
                .get("apiKey") || "";
            if (!apiKey) {
                vscode.window.showErrorMessage("Falta la API Key de Claude. Ve a Settings → Project Explainer → Api Key.");
                return;
            }
            try {
                const analyses = await (0, analyzer_1.analyzeProject)(files, root, apiKey, (msg) => {
                    progress.report({ message: msg });
                });
                progress.report({
                    message: "Insertando comentarios en los archivos...",
                });
                await (0, commenter_1.insertComments)(analyses, root);
                vscode.window.showInformationMessage(`✅ ¡Listo! Se analizaron ${files.length} archivos.`);
            }
            catch (err) {
                vscode.window.showErrorMessage(`Error: ${err.message}`);
            }
        });
    });
    ctx.subscriptions.push(cmd);
}
function collectFiles(dir, relative = "") {
    const results = [];
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return results;
    }
    for (const entry of entries) {
        if (entry.name.startsWith(".") && entry.isDirectory())
            continue;
        if (IGNORED_DIRS.has(entry.name))
            continue;
        const abs = path.join(dir, entry.name);
        const rel = relative ? `${relative}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            results.push(...collectFiles(abs, rel));
        }
        else {
            const ext = path.extname(entry.name).toLowerCase();
            if (ALLOWED_EXTENSIONS.has(ext)) {
                results.push({ rel, abs, ext });
            }
        }
    }
    return results;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map