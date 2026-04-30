const TELEGRAM_API_BASE_URL = "https://api.telegram.org";
const TELEGRAM_MESSAGE_LIMIT = 4096;
const DEFAULT_TIMEOUT_MS = 5000;

function isEnabled() {
  const value = String(process.env.TELEGRAM_ALERTS_ENABLED || "true").toLowerCase();

  return !["0", "false", "no", "off"].includes(value);
}

function getConfig() {
  if (!isEnabled()) {
    return null;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return null;
  }

  return { botToken, chatId };
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function paymentLabel(value) {
  if (value === "cash") return "Cash";
  if (value === "aba") return "ABA";
  if (value === "other") return "Other";
  return value || "-";
}

function priceTypeLabel(value) {
  if (value === "wholesale") return "Wholesale";
  if (value === "retail") return "Retail";
  return value || "-";
}

function truncateMessage(text) {
  if (text.length <= TELEGRAM_MESSAGE_LIMIT) {
    return text;
  }

  return `${text.slice(0, TELEGRAM_MESSAGE_LIMIT - 32)}\n...message truncated`;
}

function formatSaleAlert(sale) {
  const items = Array.isArray(sale.items) ? sale.items : [];
  const itemLines = items.map((item, index) => {
    const quantity = Number(item.quantity || 0);
    const lineTotal = Number(item.total_price || 0);

    return [
      `${index + 1}. ${item.product_name}`,
      `   ${quantity} ${item.unit_name} (${priceTypeLabel(item.price_type)})`,
      `   ${money(item.unit_price)} x ${quantity} = ${money(lineTotal)}`,
      `   Remaining stock: ${item.remaining_stock} ${item.base_unit}`,
    ].join("\n");
  });

  const discount = Number(sale.discount || 0);
  const discountLine = discount > 0 ? [`Discount: ${money(discount)}`] : [];

  return truncateMessage(
    [
      "Sale confirmed",
      `Invoice: ${sale.invoice_no}`,
      `Time: ${sale.sale_date}`,
      `Payment: ${paymentLabel(sale.payment_method)}`,
      `Items: ${items.length}`,
      `Subtotal: ${money(sale.subtotal)}`,
      ...discountLine,
      `Total: ${money(sale.total)}`,
      "",
      ...itemLines,
    ].join("\n"),
  );
}

async function sendTelegramMessage(text) {
  const config = getConfig();

  if (!config) {
    return { skipped: true };
  }

  const timeoutMs = Number(process.env.TELEGRAM_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(
      `${TELEGRAM_API_BASE_URL}/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: config.chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Telegram sendMessage failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function sendSaleAlert(sale) {
  return sendTelegramMessage(formatSaleAlert(sale));
}

module.exports = {
  formatSaleAlert,
  sendSaleAlert,
};
