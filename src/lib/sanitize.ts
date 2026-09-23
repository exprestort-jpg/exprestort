import sanitizeHtml from "sanitize-html";

/**
 * The page editor stores HTML, so it is sanitized on the way *in* — a stored
 * XSS payload would otherwise run for every visitor of the public page. The
 * allow-list matches exactly what the TipTap toolbar can produce.
 */
export function sanitizePageHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "s",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "hr",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      // Any outbound link the client pastes gets safe rel attributes.
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
