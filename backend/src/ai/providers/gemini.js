// Proveedor: Google Gemini (pago, BYOK)
// Modelos sugeridos: gemini-1.5-flash (economico), gemini-1.5-pro (premium)

const DEFAULT_MODEL = "gemini-1.5-flash";

export async function generate({ prompt, apiKey, model }) {
  const selectedModel = model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  if (!res.ok) throw new Error(`Gemini respondio con estado ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text?.trim();
}
