// Proveedor: OpenAI (pago, BYOK)
// Modelos sugeridos: gpt-4o-mini (economico), gpt-4o (premium)

const DEFAULT_MODEL = "gpt-4o-mini";

export async function generate({ prompt, apiKey, model }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400
    })
  });

  if (!res.ok) throw new Error(`OpenAI respondio con estado ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content?.trim();
}
