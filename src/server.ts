import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  CompletionItemKind,
  Hover,
  MarkupKind,
  TextDocumentPositionParams,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

// Verbindung zum Editor herstellen
const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      hoverProvider: {
        workDoneProgress: true,
      },
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
});

connection.onRequest("textDocument/diagnostic", async (params) => {
  return {
    items: [
      {
        message: "Keine Diagnosen verfügbar.",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        severity: 0,
      },
    ], // Noch keine echten Diagnosen, aber VSCode erwartet eine Antwort.
  };
});

// 🔍 Auto-Completion Handler
connection.onCompletion((_textDocumentPosition) => {
    return [
        {
            label: "Focus",
            kind: CompletionItemKind.Keyword,
            detail: "Startet ein HypnoScript-Programm"
        },
        {
            label: "Relax",
            kind: CompletionItemKind.Keyword,
            detail: "Beendet ein HypnoScript-Programm"
        },
        {
            label: "induce",
            kind: CompletionItemKind.Keyword,
            detail: "Deklariert eine Variable"
        },
        {
            label: "suggestion",
            kind: CompletionItemKind.Keyword,
            detail: "Definiert eine Funktion"
        }
    ];
});

// Einfacher Linter: Überprüft auf fehlendes `Focus` und `Relax`
documents.onDidChangeContent((change) => {
  const diagnostics: Diagnostic[] = [];
  const text = change.document.getText();

  if (!text.includes("Focus")) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 5 },
      },
      message: "Programm muss mit 'Focus' beginnen.",
      source: "hypnoscript-linter",
    });
  }

  if (!text.includes("Relax")) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: text.split("\n").length - 1, character: 0 },
        end: { line: text.split("\n").length - 1, character: 5 },
      },
      message: "Programm muss mit 'Relax' enden.",
      source: "hypnoscript-linter",
    });
  }

  connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
});

documents.listen(connection);
connection.listen();
