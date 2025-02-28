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
import { logger } from "./config";
import { LocalTranslations } from "./interfaces/localTranslations";
import { t } from "./i18n";

// Verbindung zum Editor herstellen
const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // hoverProvider entfernt, damit keine doppelten Hovers (Deutsch und Englisch) angezeigt werden:
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
          message: t("no_diagnostics" as keyof LocalTranslations),
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          severity: 0,
        },
      ],
    };
  } catch (error) {
    logger.error(t("error_in_diagnostic_request" as keyof LocalTranslations) + error);
    throw error;
  }
});

// 🔍 Auto-Completion Handler
connection.onCompletion((_textDocumentPosition) => {
    // Verwende t() für die Details der Completion Items
    return [
      {
        label: "Focus",
        kind: CompletionItemKind.Keyword,
        detail: t("comp_focus" as keyof LocalTranslations),
      },
      {
        label: "Relax",
        kind: CompletionItemKind.Keyword,
        detail: t("comp_relax" as keyof LocalTranslations),
      },
      {
        label: "induce",
        kind: CompletionItemKind.Keyword,
        detail: t("comp_induce" as keyof LocalTranslations),
      },
      {
        label: "suggestion",
        kind: CompletionItemKind.Keyword,
        detail: t("comp_suggestion" as keyof LocalTranslations),
      },
    ];
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
