import "server-only";
import katex from "katex";

/**
 * Renders KaTeX source to an HTML string on the server (no client-side JS or layout shift). Callers render the
 * result with `dangerouslySetInnerHTML` — safe here because every formulaTex string is our own hand-written
 * content (src/content/stats/*), never user input.
 */
export function renderFormula(tex: string, displayMode = true): string {
  return katex.renderToString(tex, {
    displayMode,
    throwOnError: false,
    output: "html",
  });
}
