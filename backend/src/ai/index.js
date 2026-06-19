// Capa de IA multi-proveedor para OrientaIA
// Soporta: Ollama (local/gratis), OpenAI, Claude, Gemini
// Si la IA falla o no esta configurada, el sistema usa el scoring de reglas como fallback

import { generate as ollama } from "./providers/ollama.js";
import { generate as openai } from "./providers/openai.js";
import { generate as claude } from "./providers/claude.js";
import { generate as gemini } from "./providers/gemini.js";
import { buildPrompt } from "./prompt.js";

const providers = { ollama, openai, claude, gemini };

/**
 * Genera un analisis vocacional usando IA.
 * @param {Object} student - Datos del alumno
 * @param {Array}  topAreas - Areas con mayor puntaje
 * @param {Array}  careers  - Carreras recomendadas
 * @param {Object} config   - { provider, apiKey, model }
 * @returns {string|null} Texto generado o null si no hay IA disponible
 */
export async function generateAIAnalysis(student, topAreas, careers, config) {
  const provider = config?.provider;

  if (!provider || provider === "none" || !providers[provider]) return null;

  try {
    const prompt = buildPrompt(student, topAreas, careers);
    return await providers[provider]({ prompt, ...config });
  } catch (err) {
    console.error(`[AI:${provider}] Error al generar analisis:`, err.message);
    return null;
  }
}
