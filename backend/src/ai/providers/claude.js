// Proveedor: Claude de Anthropic (pago, BYOK)
// Modelos sugeridos: claude-haiku-4-5-20251001 (economico), claude-sonnet-4-6 (premium)

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export async function generate({ prompt, apiKey, model }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`Claude respondio con estado ${res.status}`);
  const data = await res.json();
  return data.content[0].text?.trim();
}
