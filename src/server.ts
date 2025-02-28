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
import { LocalTranslations, t } from "./i18n";
import { logger } from "./config";

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
  try {
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
      ],
    };
  } catch (error) {
    logger.error("Fehler in Diagnostic Request: " + error);
    throw error;
  }
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

connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const position = params.position;
  const wordRange = getWordRangeAtPosition(document, position);
  if (!wordRange) return null;

  const word = document.getText(wordRange);
  // Nutzung von i18n: Übersetzung anhand des Wortes
  const translation = t(word as keyof LocalTranslations);
  if (translation !== word) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `**${word}**\n\n${translation}`,
      },
    };
  }
  return null;
});

// Einfacher Linter: Überprüft auf fehlendes `Focus` und `Relax`
documents.onDidChangeContent((change) => {
  try {
    const diagnostics: Diagnostic[] = [];
    const text = change.document.getText();

    if (!text.includes("Focus")) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 5 },
        },
        message: t("error_no_focus"),
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
        message: t("error_no_relax"),
        source: "hypnoscript-linter",
      });
    }

    connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
  } catch (error) {
    logger.error("Fehler beim Verarbeiten von Inhaltänderungen: " + error);
  }
});

function getWordRangeAtPosition(document: TextDocument, position: { line: number; character: number }) {
  const text = document.getText();
  const lines = text.split("\n");
  const line = lines[position.line];
  const start = line.lastIndexOf(" ", position.character) + 1;
  const end = line.indexOf(" ", position.character);
  return {
    start: { line: position.line, character: start },
    end: { line: position.line, character: end === -1 ? line.length : end },
  };
}

documents.listen(connection);
connection.listen();
