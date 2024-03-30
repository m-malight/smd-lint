import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { runCheck, patterns, checkList } from "./utils";

let activePattern: { regex: RegExp; msg: string } | null;

export function activate(context: vscode.ExtensionContext) {
  let diagnosticCollection: vscode.DiagnosticCollection;

  let highlightDecorationType: vscode.TextEditorDecorationType;

  let excessRepeatition = vscode.commands.registerCommand(
    "smd-lint.excess",
    () => {
      const doc: string =
        vscode.window.activeTextEditor?.document.getText() as string;

      let words = Array.from(
        new Set(doc.replace(/[^\w\s]+/gm, " ").split(/[\s\r\n]+/))
      );

      let excessDuplicates: string[] | string = [];
      for (var i = 0; i < words.length; i++) {
        const regex = new RegExp(words[i], "gim");
        const numberOfRepeatition = (doc.match(regex) || []).length;
        if (numberOfRepeatition > 50) {
          excessDuplicates.push(words[i]);
        }
      }
      excessDuplicates = excessDuplicates.join(" | ");
      vscode.window.showInformationMessage(excessDuplicates);
    }
  );

  let checks = vscode.commands.registerCommand("smd-lint.checks", async () => {
    const check = await vscode.window.showQuickPick(checkList, {
      matchOnDetail: true,
    });

    const doc: vscode.TextDocument = vscode.window.activeTextEditor?.document!;
    let checkResult: (
      | vscode.TextEditorDecorationType
      | vscode.DiagnosticCollection
    )[];

    switch (check?.label) {
      case "Clear Checks":
        highlightDecorationType.dispose();
        diagnosticCollection.clear();
        activePattern = null;
        break;
      case "Sentence must Start with Cap":
        checkResult = runCheck(
          doc,
          patterns.startWithCapitalLetter,
          highlightDecorationType,
          diagnosticCollection,
          check.msg!
        );
        activePattern = {
          regex: patterns.startWithCapitalLetter,
          msg: check.msg!,
        };
        highlightDecorationType =
          checkResult[0] as vscode.TextEditorDecorationType;
        diagnosticCollection = checkResult[1] as vscode.DiagnosticCollection;
        break;
      case "No Cap in Middle":
        checkResult = runCheck(
          doc,
          patterns.noCapitalLetterInMiddle,
          highlightDecorationType,
          diagnosticCollection,
          check.msg!
        );
        activePattern = {
          regex: patterns.noCapitalLetterInMiddle,
          msg: check.msg!,
        };
        highlightDecorationType =
          checkResult[0] as vscode.TextEditorDecorationType;
        diagnosticCollection = checkResult[1] as vscode.DiagnosticCollection;
        break;
      case "Separate Paragraph with Empty Line":
        checkResult = runCheck(
          doc,
          patterns.separatePByEmptyLine,
          highlightDecorationType,
          diagnosticCollection,
          check.msg!
        );
        activePattern = {
          regex: patterns.separatePByEmptyLine,
          msg: check.msg!,
        };
        highlightDecorationType =
          checkResult[0] as vscode.TextEditorDecorationType;
        diagnosticCollection = checkResult[1] as vscode.DiagnosticCollection;
        break;
      case "Use Heading Style":
        checkResult = runCheck(
          doc,
          patterns.useHeadingStyle,
          highlightDecorationType,
          diagnosticCollection,
          check.msg!
        );
        activePattern = {
          regex: patterns.useHeadingStyle,
          msg: check.msg!,
        };
        highlightDecorationType =
          checkResult[0] as vscode.TextEditorDecorationType;
        diagnosticCollection = checkResult[1] as vscode.DiagnosticCollection;
        break;
      case "Proper Heading Format":
        checkResult = runCheck(
          doc,
          patterns.noCapitalization,
          highlightDecorationType,
          diagnosticCollection,
          check.msg!
        );
        activePattern = {
          regex: patterns.noCapitalization,
          msg: check.msg!,
        };
        highlightDecorationType =
          checkResult[0] as vscode.TextEditorDecorationType;
        diagnosticCollection = checkResult[1] as vscode.DiagnosticCollection;
        break;
      case "Tech Words in Code Style":
        checkResult = runCheck(
          doc,
          patterns.techWord(doc.getText() || ""),
          highlightDecorationType,
          diagnosticCollection,
          check.msg!
        );
        activePattern = {
          regex: patterns.techWord(doc.getText() || ""),
          msg: check.msg!,
        };
        highlightDecorationType =
          checkResult[0] as vscode.TextEditorDecorationType;
        diagnosticCollection = checkResult[1] as vscode.DiagnosticCollection;
        break;
    }
  });

  let rules = vscode.commands.registerCommand("smd-lint.rules", () => {
    const panel = vscode.window.createWebviewPanel(
      "rulesView",
      "OpenReplay Rules",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    const rulesPath = vscode.Uri.file(
      path.join(context.extensionPath, "src/rules.html")
    );
    const rulesContent = fs.readFileSync(rulesPath.fsPath, "utf8");
    panel.webview.html = rulesContent;
  });

  let onSaveDoc = vscode.workspace.onDidSaveTextDocument(
    (doc: vscode.TextDocument) => {
      if (activePattern) {
        let checkResult = runCheck(
          doc,
          activePattern.regex,
          highlightDecorationType,
          diagnosticCollection,
          activePattern.msg
        );
        highlightDecorationType =
          checkResult[0] as vscode.TextEditorDecorationType;
        diagnosticCollection = checkResult[1] as vscode.DiagnosticCollection;
      }
    }
  );

  context.subscriptions.push(checks);
  context.subscriptions.push(rules);
  context.subscriptions.push(onSaveDoc);
  context.subscriptions.push(excessRepeatition);
}

export function deactivate() {}
