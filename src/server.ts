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

connection.onHover((params: TextDocumentPositionParams): Hover | undefined => {
  console.log("🔥 Hover-Request für:", params);
  const document = documents.get(params.textDocument.uri);
  if (!document) return undefined;

  const text = document.getText();
  const offset = document.offsetAt(params.position);

  // Finde das Wort unter der Maus
  const wordMatch = text.slice(0, offset).match(/\b\w+$/);
  if (!wordMatch) return undefined;
  const word = wordMatch[0];

  // 📝 Map mit Erklärungen für Keywords & Syntax
  const descriptions: Record<string, string> = {
    Focus:
      "**Focus** - Startet ein HypnoScript-Programm.\n\n```hyp\nFocus {\n    // Code\n} Relax\n```",
    Relax: "**Relax** - Beendet ein HypnoScript-Programm.",
    induce:
      "**induce** - Deklariert eine Variable.\n\n```hyp\ninduce x: number = 5;\n```",
    suggestion:
      "**suggestion** - Definiert eine Funktion.\n\n```hyp\nsuggestion add(a: number, b: number): number {\n    awaken a + b;\n}\n```",
    observe:
      '**observe** - Gibt Werte aus.\n\n```hyp\nobserve "Hallo, HypnoScript!";\n```',
    trance: "**trance** - Spezieller HypnoScript-Datentyp.",
    drift:
      "**drift(ms)** - Verzögert die Ausführung.\n\n```hyp\ndrift(1000);\n```",
    session:
      "**session** - Erstellt eine OOP-Session.\n\n```hyp\nsession Person {\n    expose name: string;\n}\n```",
    expose: "**expose** - Macht eine Session-Eigenschaft öffentlich.",
    conceal: "**conceal** - Macht eine Session-Eigenschaft privat.",
  };

  if (descriptions[word]) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: descriptions[word],
      },
    };
  }

  return undefined;
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
