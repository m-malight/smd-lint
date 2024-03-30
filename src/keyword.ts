export const keywords =
  "const let var function return if else for while switch case break continue try catch throw typeof class extends implements interface new import export default require module exports __dirname __filename global fs os NaN undefined null Promise async await npm yarn";

export function generateRegexFromList(
  strings: string[],
  global: boolean = true
) {
  const pattern = strings
    .map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return global ? new RegExp(pattern, "gm") : new RegExp(pattern);
}
