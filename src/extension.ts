import * as vscode from "vscode";
import * as path from "path";
import { HypnoScriptFormatter } from "./formatter";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
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
  };

  client = new LanguageClient(
    "hypnoscriptLanguageServer",
    "HypnoScript Language Server",
    serverOptions,
    clientOptions
  );

  context.subscriptions.push(completionProvider);
  context.subscriptions.push(structureCompletionProvider);
  context.subscriptions.push(formatterProvider);

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
