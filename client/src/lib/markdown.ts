/**
 * Tiny, dependency-free "lite markdown" renderer for task descriptions and
 * comments. Supports just enough syntax to be useful without pulling in a
 * full markdown library:
 *   ## Heading        -> <h3>
 *   ### Smaller heading -> <h4>
 *   **bold**          -> <strong>
 *   *italic*          -> <em>
 *   - item            -> bullet list
 *   plain lines       -> paragraphs (blank line = new paragraph)
 *
 * Input is escaped first, so this is safe to use with unsanitized user text.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "<em>$1</em>");
}

export function renderLiteMarkdown(raw: string): string {
  if (!raw) return "";
  const escaped = escapeHtml(raw);
  const lines = escaped.split("\n");
  const html: string[] = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }
    if (trimmed.startsWith("### ")) {
      closeList();
      html.push(`<h4 class="text-sm font-semibold mt-3 mb-1">${inline(trimmed.slice(4))}</h4>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h3 class="text-base font-semibold mt-3 mb-1">${inline(trimmed.slice(3))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!listOpen) {
        html.push('<ul class="list-disc pl-5 space-y-0.5">');
        listOpen = true;
      }
      html.push(`<li>${inline(trimmed.slice(2))}</li>`);
      continue;
    }
    closeList();
    html.push(`<p class="mb-1.5">${inline(trimmed)}</p>`);
  }
  closeList();

  return html.join("");
}