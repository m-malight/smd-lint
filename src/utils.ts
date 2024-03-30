import * as vscode from "vscode";

const keywords =
  "const let var function return if else for while switch case break continue try catch throw typeof class extends implements interface new import export default require module exports __dirname __filename global fs os NaN undefined null Promise async await npm yarn";

function generateRegexFromList(strings: string[], global: boolean = true) {
  const pattern = strings
    .map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return global ? new RegExp(pattern, "gm") : new RegExp(pattern);
}

export function runCheck(
  doc: vscode.TextDocument,
  regex: RegExp,
  decorationType: vscode.TextEditorDecorationType,
  diagnosticCollection: vscode.DiagnosticCollection,
  msg: string
): (vscode.TextEditorDecorationType | vscode.DiagnosticCollection)[] {
  let text = doc?.getText() || "";
  let match;

  decorationType?.dispose();
  diagnosticCollection?.clear();

  diagnosticCollection = vscode.languages.createDiagnosticCollection("SMD");
  decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "orange",
    color: "black",
    fontWeight: "bold",
  });

  const decorations: vscode.DecorationOptions[] = [];
  const diagnostics = [];
  const uri = doc.uri;

  while ((match = regex.exec(text)) !== null) {
    const startPosition = doc.positionAt(match.index);
    const endPosition = doc.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPosition, endPosition);
    // Add diagnostic message
    const diagnostic = new vscode.Diagnostic(
      range,
      msg,
      vscode.DiagnosticSeverity.Warning
    );

    const decoration = {
      range: range,
      hoverMessage: msg,
    };

    decorations.push(decoration);
    diagnostics.push(diagnostic);
    regex.lastIndex = match.index + match[0].length;
  }

  vscode.window.activeTextEditor?.setDecorations(decorationType, decorations);
  diagnosticCollection.set(uri, diagnostics);
  return [decorationType, diagnosticCollection];
}

export const patterns = {
  codeBlocks: /```[\s\S]*?```/gm,
  startWithCapitalLetter: /(?<=(\n|\.\s+))[a-z].*?[.!?]\s/gm,
  noCapitalLetterInMiddle: /(?<=\w+\s)\b[A-Z][a-z]*\b/gm,
  separatePByEmptyLine: /\n\w+/gm,
  useHeadingStyle: /^\r\n[\sA-Za-z0-9!?]+\r\n$/gm,
  noCapitalization: /([#]+\s+)\b[A-Z][A-Za-z ]*\b(?: +[A-Z][A-Za-z]*\b)+/gm,
  // oneHeading1: /^#\s+[^\r]+/gm,
  // separateP: /[A-Z][^.!?\r]*(?!(?:```[\s\S]*?```))[^!?\r]*(?=[.!?]\s*)/gm,
  techWord: function (text: string) {
    let techWord: string[] | null = text.match(this.codeBlocks);

    // Get each word in code block and create an Array
    techWord = (techWord || ["script"])
      .reduce((a, b) => a + b, "")
      .replace(/```/gm, "")
      .replace(/[^\w\s]+/gm, " ")
      .split(/[\s\r\n]+/);

    // Filter out words already in the keyword string and append keyword to the list
    techWord = (
      techWord
        .filter((block) => !keywords.match(new RegExp(block, "gm")))
        .join(" ") + ` ${keywords}`
    ).split(" ");

    // Return a regular expression
    return generateRegexFromList(techWord);
  },
};

export const checkList: ({ msg?: string } & vscode.QuickPickItem)[] = [
  {
    label: "Clear Checks",
    description: "Clear all checks",
    msg: "All checks are cleared",
  },
  {
    label: "Sentence must Start with Cap",
    description: "Ensure that sentences start with a capital letter",
    msg: "Sentence did not start with a capital letter",
  },
  {
    label: "No Cap in Middle",
    description:
      "Ensure that there are no capital letters in the middle of sentences",
    msg: "Capital letter is present in the middle of a sentence",
  },
  {
    label: "Separate Paragraph with Empty Line",
    description: "Ensure that paragraphs are separated by an empty line",
    msg: "Paragraph should be separated by an empty line.",
  },
  {
    label: "Use Heading Style",
    description: "Ensure that headings are styled properly",
    msg: "Heading is not styled properly",
  },
  {
    label: "Proper Heading Format",
    description: "Ensure that headings follow proper formatting",
    msg: "Heading did not follow proper formatting",
  },
  {
    label: "Tech Words in Code Style",
    description: "Ensure that technical words are in code format",
    msg: "Technical word is not in code format",
  },
];
