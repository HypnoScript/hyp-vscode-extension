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
    // Bestehende Keyword-Vorschläge
    const suggestions = [
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
      {
        label: "youAreFeelingVerySleepy",
        kind: CompletionItemKind.Keyword,
        detail: "Gleichheit (==) Operator",
      },
      {
        label: "lookAtTheWatch",
        kind: CompletionItemKind.Keyword,
        detail: "Größer als (>) Operator",
      },
      {
        label: "fallUnderMySpell",
        kind: CompletionItemKind.Keyword,
        detail: "Kleiner als (<) Operator",
      },
      {
        label: "!=",
        kind: CompletionItemKind.Keyword,
        detail: "Ungleich (!=) Operator",
      },
    ];
    return suggestions;
});

// Neue Funktion zur Syntax-Analyse
function checkSyntaxErrors(document: TextDocument): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const text = document.getText();

    // 1. Überprüfe ob 'Focus {' vorhanden ist.
    if (!/Focus\s*\{/.test(text)) {
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

    // 2. Überprüfe ob '} Relax' vorhanden ist.
    if (!/\}\s*Relax/.test(text)) {
        const lastLine = text.split("\n").length - 1;
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
                start: { line: lastLine, character: 0 },
                end: { line: lastLine, character: 5 },
            },
            message: t("error_no_relax"),
            source: "hypnoscript-linter",
        });
    }

    // 3. Überprüfe auf unbalancierte geschweifte Klammern.
    const openBraces = (text.match(/\{/g) || []).length;
    const closeBraces = (text.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 1 },
            },
            message: t("error_unbalanced_braces"),
            source: "hypnoscript-linter",
        });
    }

    // 4. Überprüfe auf fehlende Strichpunkte am Zeilenende (nur einfache Prüfung).
    const lines = text.split("\n");
    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        // Überspringe leere Zeilen oder Zeilen, die Blöcke öffnen/schließen
        if (trimmed && !trimmed.endsWith(";") && !trimmed.endsWith("{") && !trimmed.endsWith("}") &&
            // Erlaube Zeilen, die mit "Focus", "Relax", "entrance" etc. beginnen
            !/^(Focus|Relax|entrance)/.test(trimmed)) {
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: {
                    start: { line: idx, character: 0 },
                    end: { line: idx, character: trimmed.length },
                },
                message: t("error_missing_semicolon"),
                source: "hypnoscript-linter",
            });
        }
    });
    return diagnostics;
}

// Erweiterung des onDidChangeContent-Handlings:
documents.onDidChangeContent((change) => {
    try {
        const diagnostics: Diagnostic[] = [];
        const text = change.document.getText();
        // Bestehende Prüfungen (Fehlendes Focus/Relax)
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
        // Neue umfassende Syntax-Analyse
        diagnostics.push(...checkSyntaxErrors(change.document));
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
