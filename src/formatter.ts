import * as vscode from "vscode";
import * as prettier from "prettier";

export class HypnoScriptFormatter
  implements vscode.DocumentFormattingEditProvider
{
  async provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): Promise<vscode.TextEdit[]> {
    const fullText = document.getText();
    const formattedText = await prettier.format(fullText, {
      parser: "babel",
      useTabs: false,
      tabWidth: 4,
      semi: true,
      singleQuote: false,
    });

    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(fullText.length)
    );

    return [vscode.TextEdit.replace(fullRange, formattedText)];
  }
}
