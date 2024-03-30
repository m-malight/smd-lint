import * as vscode from "vscode";
import { keywords, generateRegexFromList } from "./keyword";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "smd-lint" is now active!');

  let disposable = vscode.commands.registerCommand("smd-lint.h", () => {
    vscode.window.showInformationMessage("SMD lint!");
  });

  let highlightDecorationType: vscode.TextEditorDecorationType;

  let disposable2 = vscode.workspace.onDidSaveTextDocument(
    (doc: vscode.TextDocument) => {
      let text = doc.getText();

      const patterns = {
        codeBlocks: /```[\s\S]*?```/gm,
        startWithCapitalLetter: /(?<=(\n|\.\s+))[a-z].*?[.!?]\s/gm,
        noCapitalLetterInMiddle: /(?<=\w+\s)\b[A-Z][a-z]*\b/gm,
        separatePByEmptyLine: /\n\w+/gm,
        useHeadingStyle: /^\r\n[\sA-Za-z0-9!?]+\r\n$/gm,
        noCapitalization:
          /([#]+\s+)\b[A-Z][A-Za-z ]*\b(?: +[A-Z][A-Za-z]*\b)+/gm,
        // oneHeading1: /^#\s+[^\r]+/gm,
        // separateP: /[A-Z][^.!?\r]*(?!(?:```[\s\S]*?```))[^!?\r]*(?=[.!?]\s*)/gm,
        techWord: function () {
          let techWord: string[] | null = text.match(this.codeBlocks);

          // Get each word in code block and create an Array
          techWord = (techWord || ["script"])
            .reduce((a, b) => a + b, "")
            .replace(/```/gm, "")
            .replace(/[^\w\s]+/gm, " ")
            .split(/[\s\r\n]+/);

          // Filter out words already in the keywod string and append keyword to the list
          techWord = (
            techWord
              .filter((block) => !keywords.match(new RegExp(block, "gm")))
              .join(" ") + ` ${keywords}`
          ).split(" ");

          // Return a regular expression
          return generateRegexFromList(techWord);
        },
      };

      // console.log(text);
      let match;
      let regex = patterns.noCapitalLetterInMiddle;
      highlightDecorationType?.dispose();
      highlightDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: "yellow", // Set the background color
        color: "black", // Set the text color
        fontWeight: "bold", // Make the text bold
      });

      const decorations: vscode.DecorationOptions[] = [];
      while ((match = regex.exec(text)) !== null) {
        const startPosition = doc.positionAt(match.index);
        const endPosition = doc.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPosition, endPosition);

        // Define decoration options (e.g., change background color)
        const decoration = {
          range: range,
          hoverMessage: "This is a matched word", // Optional hover message
        };

        decorations.push(decoration);
        // Apply the decoration to the editor
        regex.lastIndex = match.index + match[0].length;
      }

      vscode.window.activeTextEditor?.setDecorations(
        highlightDecorationType,
        decorations
      );
      // console.log(text);
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);
}

export function deactivate() {}
