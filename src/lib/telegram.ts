/**
 * Notifies the manager about a new order. Failures are logged, never thrown:
 * the order is already committed at this point, and losing the notification is
 * far better than showing the customer an error for an order that went through.
 * The order is also visible in /admin/orders as a fallback.
 */
export async function notifyNewOrder(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram not configured — order notification skipped");
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      console.error(
        "Telegram sendMessage failed",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("Telegram sendMessage threw", error);
  }
}

/** Escapes the small HTML subset Telegram accepts. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
