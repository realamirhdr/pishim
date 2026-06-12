const TOKEN   = import.meta.env.VITE_TELEGRAM_TOKEN  as string;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID as string;

export async function sendTelegram(message: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
  });
}
