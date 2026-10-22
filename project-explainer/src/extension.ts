import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { analyzeProject } from "./analyzer";
import { insertComments } from "./commenter";

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

export function activate(ctx: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand(
    "projectExplainer.explain",
    async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders) {
        vscode.window.showErrorMessage("Abre un proyecto primero.");
        return;
      }

      const root = folders[0].uri.fsPath;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "🔍 Project Explainer",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Leyendo archivos del proyecto..." });
          const files = collectFiles(root);

          if (files.length === 0) {
            vscode.window.showWarningMessage(
              "No se encontraron archivos para analizar.",
            );
            return;
          }

          progress.report({
            message: `Analizando ${files.length} archivos con IA...`,
          });
          const apiKey =
            vscode.workspace
              .getConfiguration("projectExplainer")
              .get<string>("apiKey") || "";

          if (!apiKey) {
            vscode.window.showErrorMessage(
              "Falta la API Key de Claude. Ve a Settings → Project Explainer → Api Key.",
            );
            return;
          }

          try {
            const analyses = await analyzeProject(
              files,
              root,
              apiKey,
              (msg) => {
                progress.report({ message: msg });
              },
            );

            progress.report({
              message: "Insertando comentarios en los archivos...",
            });
            await insertComments(analyses, root);

            vscode.window.showInformationMessage(
              `✅ ¡Listo! Se analizaron ${files.length} archivos.`,
            );
          } catch (err: any) {
            vscode.window.showErrorMessage(`Error: ${err.message}`);
          }
        },
      );
    },
  );

  ctx.subscriptions.push(cmd);
}

export function collectFiles(
  dir: string,
  relative = "",
): { rel: string; abs: string; ext: string }[] {
  const results: { rel: string; abs: string; ext: string }[] = [];
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.isDirectory()) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;

    const abs = path.join(dir, entry.name);
    const rel = relative ? `${relative}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      results.push(...collectFiles(abs, rel));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXTENSIONS.has(ext)) {
        results.push({ rel, abs, ext });
      }
    }
  }

  return results;
}

export function deactivate() {}
