// Proveedor: Ollama (IA local, gratuita)
// Requiere Ollama instalado: https://ollama.com
// Modelo default: llama3.2 (correr: ollama pull llama3.2)

const DEFAULT_URL = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "phi3";

export async function generate({ prompt, model, baseUrl }) {
  const url = `${baseUrl || process.env.OLLAMA_URL || DEFAULT_URL}/api/generate`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || process.env.OLLAMA_MODEL || DEFAULT_MODEL,
      prompt,
      stream: false
    })
  });

  if (!res.ok) throw new Error(`Ollama respondio con estado ${res.status}`);
  const data = await res.json();
  return data.response?.trim();
}
