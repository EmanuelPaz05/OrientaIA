import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = "http://localhost:3001/api";

function App() {
  const [view, setView] = useState("student");
  const [student, setStudent] = useState(null);
  const [questionnaire, setQuestionnaire] = useState([]);
  const [areas, setAreas] = useState({});
  const [answers, setAnswers] = useState({});
  const [report, setReport] = useState(null);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    course: "",
    school: "",
    interests: ""
  });
  const [status, setStatus] = useState("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiConfig, setAiConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem("orientaia_ai") || "{}"); }
    catch { return {}; }
  });

  useEffect(() => {
    fetch(`${API_URL}/questionnaire`)
      .then((response) => response.json())
      .then((data) => {
        setQuestionnaire(data.questionnaire);
        setAreas(data.areas);
      })
      .catch(() => setStatus("No se pudo conectar con el backend."));
  }, []);

  useEffect(() => {
    if (view === "orientador") {
      loadStats();
    }
  }, [view]);

  const progress = useMemo(() => {
    if (questionnaire.length === 0) return 0;
    return Math.round((Object.keys(answers).length / questionnaire.length) * 100);
  }, [answers, questionnaire]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function registerStudent(event) {
    event.preventDefault();
    setStatus("Registrando alumno...");

    const response = await fetch(`${API_URL}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      setStatus("Revisa nombre, curso y colegio.");
      return;
    }

    const createdStudent = await response.json();
    setStudent(createdStudent);
    setStatus("");
  }

  function saveAIConfig(newConfig) {
    setAiConfig(newConfig);
    localStorage.setItem("orientaia_ai", JSON.stringify(newConfig));
    setShowAIPanel(false);
  }

  async function sendQuestionnaire() {
    const usingAI = aiConfig.provider && aiConfig.provider !== "none";
    setStatus(usingAI ? `Generando reporte con IA (${aiConfig.provider})...` : "Generando reporte...");

    const aiHeaders = {};
    if (usingAI) {
      aiHeaders["x-ai-provider"] = aiConfig.provider;
      if (aiConfig.apiKey) aiHeaders["x-ai-key"] = aiConfig.apiKey;
      if (aiConfig.model) aiHeaders["x-ai-model"] = aiConfig.model;
    }

    const response = await fetch(`${API_URL}/questionnaire`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...aiHeaders },
      body: JSON.stringify({ studentId: student.id, answers })
    });

    if (!response.ok) {
      setStatus("No se pudo generar el reporte.");
      return;
    }

    const createdReport = await response.json();
    setReport(createdReport);
    setStatus("");
  }

  async function loadStats() {
    const response = await fetch(`${API_URL}/orientador/stats`);
    const data = await response.json();
    setStats(data);
  }

  function restartFlow() {
    setStudent(null);
    setAnswers({});
    setReport(null);
    setStatus("");
    setForm({ name: "", age: "", course: "", school: "", interests: "" });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Proyecto Grupo Nº 5</p>
          <h1>OrientaIA</h1>
          <p className="subtitle">Asistente de orientacion vocacional para alumnos secundarios</p>
        </div>
        <nav>
          <button className={view === "student" ? "active" : ""} onClick={() => setView("student")}>
            Alumno
          </button>
          <button className={view === "orientador" ? "active" : ""} onClick={() => setView("orientador")}>
            Orientador
          </button>
          <button className="ai-toggle" onClick={() => setShowAIPanel(true)} title="Configurar motor de IA">
            {aiConfig.provider && aiConfig.provider !== "none" ? `⚡ ${aiConfig.provider}` : "⚙ IA"}
          </button>
        </nav>
      </header>

      {view === "student" ? (
        <section className="workspace">
          <aside className="panel compact">
            <h2>Flujo del alumno</h2>
            <ol className="steps">
              <li className={!student ? "current" : "done"}>Registro</li>
              <li className={student && !report ? "current" : report ? "done" : ""}>Cuestionario</li>
              <li className={report ? "current" : ""}>Reporte</li>
            </ol>
            <p className="note">Autores: Emanuel Paz y Juan Bertossi.</p>
          </aside>

          {!student && (
            <section className="panel">
              <h2>Registro del alumno</h2>
              <form className="student-form" onSubmit={registerStudent}>
                <label>
                  Nombre completo
                  <input name="name" value={form.name} onChange={updateForm} placeholder="Ej: Sofia Lopez" />
                </label>
                <label>
                  Edad
                  <input name="age" value={form.age} onChange={updateForm} placeholder="Ej: 17" />
                </label>
                <label>
                  Curso
                  <input name="course" value={form.course} onChange={updateForm} placeholder="Ej: 6to A" />
                </label>
                <label>
                  Colegio
                  <input name="school" value={form.school} onChange={updateForm} placeholder="Ej: Instituto Modelo" />
                </label>
                <label className="full">
                  Intereses generales
                  <textarea
                    name="interests"
                    value={form.interests}
                    onChange={updateForm}
                    placeholder="Ej: tecnologia, salud, deportes, diseno"
                  />
                </label>
                <button className="primary" type="submit">Continuar</button>
              </form>
            </section>
          )}

          {student && !report && (
            <section className="panel">
              <div className="section-title">
                <div>
                  <h2>Cuestionario vocacional</h2>
                  <p>{student.name} · {student.course} · {student.school}</p>
                </div>
                <span className="progress">{progress}%</span>
              </div>

              <div className="questions">
                {questionnaire.map((question) => (
                  <article className="question" key={question.id}>
                    <h3>{question.text}</h3>
                    <div className="options">
                      {question.options.map((option) => (
                        <button
                          key={option.value}
                          className={answers[question.id] === option.area ? "selected" : ""}
                          onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.area }))}
                          type="button"
                        >
                          {option.value}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="actions">
                <button type="button" onClick={restartFlow}>Cancelar</button>
                <button
                  className="primary"
                  type="button"
                  onClick={sendQuestionnaire}
                  disabled={Object.keys(answers).length !== questionnaire.length}
                >
                  Generar reporte
                </button>
              </div>
            </section>
          )}

          {report && <Report report={report} areas={areas} onRestart={restartFlow} />}
        </section>
      ) : (
        <OrientadorPanel stats={stats} onRefresh={loadStats} />
      )}

      {status && <p className="status">{status}</p>}

      {showAIPanel && (
        <AISettings config={aiConfig} onSave={saveAIConfig} onClose={() => setShowAIPanel(false)} />
      )}
    </main>
  );
}

function Report({ report, onRestart }) {
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <h2>Reporte vocacional</h2>
          <p>{report.studentName} · generado el {new Date(report.createdAt).toLocaleDateString("es-AR")}</p>
        </div>
        <button type="button" onClick={onRestart}>Nuevo alumno</button>
      </div>

      {report.aiSummary && (
        <div className="ai-summary">
          <span className="ai-badge">⚡ Analisis generado por IA · {report.engine}</span>
          <p>{report.aiSummary}</p>
        </div>
      )}

      <div className="result-grid">
        <div>
          <h3>Areas de mayor afinidad</h3>
          <div className="tags">
            {report.topAreas.map((item) => (
              <span key={item.area}>{item.label}: {item.score}</span>
            ))}
          </div>
        </div>
        <div>
          <h3>Resumen</h3>
          <p>
            {report.aiSummary
              ? "El analisis de arriba fue generado por IA en base al perfil del alumno. Las carreras a continuacion surgen del cuestionario vocacional."
              : "El sistema compara respuestas del alumno con areas vocacionales y propone carreras relacionadas. El resultado es orientativo y sirve como apoyo para una entrevista."}
          </p>
        </div>
      </div>

      <h3>Carreras recomendadas</h3>
      <div className="career-list">
        {report.recommendations.map((career) => (
          <article className="career-card" key={career.id}>
            <h4>{career.name}</h4>
            <p>{career.description}</p>
            <dl>
              <div><dt>Institucion</dt><dd>{career.institution}</dd></div>
              <div><dt>Modalidad</dt><dd>{career.modality}</dd></div>
              <div><dt>Duracion</dt><dd>{career.duration}</dd></div>
              <div><dt>Ubicacion</dt><dd>{career.location}</dd></div>
            </dl>
            <strong>{career.reason}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function OrientadorPanel({ stats, onRefresh }) {
  return (
    <section className="panel orientador">
      <div className="section-title">
        <div>
          <h2>Panel del orientador</h2>
          <p>Resumen grupal de reportes cargados en el sistema.</p>
        </div>
        <button type="button" onClick={onRefresh}>Actualizar</button>
      </div>

      {!stats ? (
        <p>Cargando estadisticas...</p>
      ) : (
        <>
          <div className="metrics">
            <article><strong>{stats.totalStudents}</strong><span>Alumnos registrados</span></article>
            <article><strong>{stats.totalReports}</strong><span>Reportes generados</span></article>
            <article><strong>{Object.keys(stats.courses).length}</strong><span>Cursos con datos</span></article>
          </div>

          <div className="dashboard-grid">
            <ListBlock title="Areas mas frecuentes" items={stats.topAreas} empty="Sin areas registradas" />
            <ListBlock title="Carreras mas sugeridas" items={stats.topCareers} empty="Sin recomendaciones aun" />
          </div>

          <h3>Ultimos reportes</h3>
          <div className="table">
            <div className="table-row head">
              <span>Alumno</span>
              <span>Curso</span>
              <span>Area principal</span>
              <span>Fecha</span>
            </div>
            {stats.recentReports.map((report) => (
              <div className="table-row" key={report.id}>
                <span>{report.studentName}</span>
                <span>{report.course}</span>
                <span>{report.topAreas[0]?.label || "Sin datos"}</span>
                <span>{new Date(report.createdAt).toLocaleDateString("es-AR")}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ListBlock({ title, items, empty }) {
  return (
    <article className="list-block">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>{empty}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              <strong>{item.total}</strong>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

const PROVIDER_LABELS = {
  none: "Sin IA (modo reglas)",
  ollama: "Ollama · local y gratuito",
  openai: "OpenAI (GPT)",
  claude: "Claude (Anthropic)",
  gemini: "Gemini (Google)"
};

const MODEL_OPTIONS = {
  ollama: ["phi3", "llama3.2", "llama3.1", "mistral", "gemma2", "qwen2.5"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  claude: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"],
  gemini: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"]
};

function AISettings({ config, onSave, onClose }) {
  const [form, setForm] = React.useState(() => {
    const base = { provider: "none", apiKey: "", model: "", ...config };
    if (!base.model && MODEL_OPTIONS[base.provider]) {
      base.model = MODEL_OPTIONS[base.provider][0];
    }
    return base;
  });
  const needsKey = ["openai", "claude", "gemini"].includes(form.provider);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function changeProvider(provider) {
    const defaultModel = MODEL_OPTIONS[provider]?.[0] || "";
    setForm((prev) => ({ ...prev, provider, model: defaultModel, apiKey: "" }));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="section-title">
          <h2>Configuracion de IA</h2>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <p className="note">Selecciona un motor de IA para generar analisis vocacionales personalizados. Si no configuras nada, el sistema sigue funcionando con el modo de reglas.</p>

        <label>
          Motor de IA
          <select value={form.provider} onChange={(e) => changeProvider(e.target.value)}>
            {Object.entries(PROVIDER_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>

        {needsKey && (
          <label>
            API Key
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => update("apiKey", e.target.value)}
              placeholder="Pega tu API key aqui"
            />
            <small className="field-hint">Tu key solo se guarda en este navegador, nunca en el servidor.</small>
          </label>
        )}

        {form.provider !== "none" && form.provider !== "ollama" && MODEL_OPTIONS[form.provider] && (
          <label>
            Modelo
            <select value={form.model} onChange={(e) => update("model", e.target.value)}>
              {MODEL_OPTIONS[form.provider].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        )}

        {form.provider === "ollama" && (
          <p className="note">Modelo: <strong>phi3</strong> (local, gratuito). Asegurate de tener Ollama corriendo.</p>
        )}

        <div className="actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button className="primary" type="button" onClick={() => onSave(form)}>
            Guardar configuracion
          </button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

