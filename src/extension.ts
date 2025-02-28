import * as vscode from "vscode";
import * as path from "path";
import { HypnoScriptFormatter } from "./formatter";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { LocalTranslations, setLocale, t } from "./i18n";
import { logger, config } from "./config";

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
  try {
    const locale = vscode.env.language || "en";
    await setLocale(locale);

    logger.info(t("extension_activation" as keyof LocalTranslations) + ` (Mode: ${config.environment}, Locale: ${locale})`);

    const serverModule = context.asAbsolutePath(path.join("out", "server.js"));

    const keywords = [
      "Focus",
      "Relax",
      "induce",
      "suggestion",
      "awaken",
      "observe",
      "if",
      "else",
      "while",
      "loop",
      "snap",
      "sink",
      "trance",
      "session",
      "constructor",
      "expose",
      "conceal",
      "dominant",
      "drift",
      "tranceify",
      "mindLink",
      "sharedTrance",
      "imperative",
    ];

    const completionProvider = vscode.languages.registerCompletionItemProvider(
      "hypnoscript",
      {
        provideCompletionItems(document, position, token, context) {
          return keywords.map((keyword) => {
            const item = new vscode.CompletionItem(
              keyword,
              vscode.CompletionItemKind.Keyword
            );
            item.insertText = keyword + " ";
            return item;
          });
        },
      },
      ...keywords.map((kw) => kw[0]) // Aktiviert Auto-Completion bei den ersten Buchstaben der Keywords
    );

    const structureSnippets = [
      {
        label: "session",
        detail: "Erstellt eine neue HypnoScript-Session (OOP)",
        documentation:
          "Definiert eine Klasse in HypnoScript mit öffentlichen und privaten Feldern.",
        insertText: new vscode.SnippetString(
          "session ${1:Name} {\n\texpose ${2:feld}: ${3:type};\n\tconceal ${4:secret}: ${5:type};\n\n\tsuggestion constructor(${6:args}) {\n\t\tthis.${2} = ${2};\n\t\tthis.${4} = ${4};\n\t}\n}"
        ),
      },
      {
        label: "tranceify",
        detail: "Erstellt eine neue benutzerdefinierte Struktur",
        documentation:
          "Definiert eine `tranceify` Struktur zur Speicherung von Daten.",
        insertText: new vscode.SnippetString(
          "tranceify ${1:Name} {\n\t${2:feld1}: ${3:type};\n\t${4:feld2}: ${5:type};\n}"
        ),
      },
    ];

    const structureCompletionProvider =
      vscode.languages.registerCompletionItemProvider(
        "hypnoscript",
        {
          provideCompletionItems(document, position, token, context) {
            return structureSnippets.map((s) => {
              const item = new vscode.CompletionItem(
                s.label,
                vscode.CompletionItemKind.Struct
              );
              item.detail = s.detail;
              item.documentation = new vscode.MarkdownString(s.documentation);
              item.insertText = s.insertText;
              return item;
            });
          },
        },
        "s",
        "t" // Trigger für `session` und `tranceify`
      );

    const hoverProvider = vscode.languages.registerHoverProvider("hypnoscript", {
      provideHover(document, position, token) {
        const range = document.getWordRangeAtPosition(position);
        if (!range) return;
        const word = document.getText(range);
        // Mapping mit i18n-Übersetzungen für jeden Hover Text
        const hoverMessages: { [key: string]: string } = {
          Focus: t("Focus"),
          Relax: t("Relax"),
          induce: t("induce"),
          suggestion: t("suggestion"),
          observe: t("observe"),
          trance: t("trance"),
          drift: t("drift"),
          session: t("session"),
          expose: t("expose"),
          conceal: t("conceal")
        };
        if (hoverMessages[word]) {
          return new vscode.Hover(new vscode.MarkdownString(hoverMessages[word]));
        }
        return;
      },
    });

    const formatterProvider =
      vscode.languages.registerDocumentFormattingEditProvider(
        "hypnoscript",
        new HypnoScriptFormatter()
      );

    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: { module: serverModule, transport: TransportKind.ipc },
    };

    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: "file", language: "hypnoscript" }],
      synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher("**/.hyp"),
      },
    };

    client = new LanguageClient(
      "hypnoscriptLanguageServer",
      "HypnoScript Language Server",
      serverOptions,
      clientOptions
    );

    context.subscriptions.push(hoverProvider);
    context.subscriptions.push(completionProvider);
    context.subscriptions.push(structureCompletionProvider);
    context.subscriptions.push(formatterProvider);

    client.start();
  } catch (error) {
    logger.error("Fehler bei der Extension-Aktivierung: " + error);
  }
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
