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

  async function sendQuestionnaire() {
    setStatus("Generando reporte...");

    const response = await fetch(`${API_URL}/questionnaire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
            El sistema compara respuestas del alumno con areas vocacionales y propone carreras
            relacionadas. El resultado es orientativo y sirve como apoyo para una entrevista.
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

createRoot(document.getElementById("root")).render(<App />);

