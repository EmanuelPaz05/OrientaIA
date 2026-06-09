import express from "express";
import cors from "cors";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const areas = {
  tecnologia: "Tecnologia",
  salud: "Salud",
  educacion: "Educacion",
  administracion: "Administracion",
  arte: "Arte y diseno",
  comunicacion: "Comunicacion",
  sociales: "Ciencias sociales"
};

const questionnaire = [
  {
    id: "q1",
    text: "Que actividad te resulta mas interesante?",
    options: [
      { value: "programar o resolver problemas con tecnologia", area: "tecnologia" },
      { value: "ayudar a personas en temas de salud", area: "salud" },
      { value: "explicar temas y acompanar aprendizajes", area: "educacion" },
      { value: "organizar proyectos, dinero o equipos", area: "administracion" }
    ]
  },
  {
    id: "q2",
    text: "Que materia o tipo de contenido preferis?",
    options: [
      { value: "matematica, informatica o fisica", area: "tecnologia" },
      { value: "biologia, quimica o salud", area: "salud" },
      { value: "lengua, historia o psicologia", area: "sociales" },
      { value: "arte, diseno o comunicacion visual", area: "arte" }
    ]
  },
  {
    id: "q3",
    text: "Como te gustaria trabajar en el futuro?",
    options: [
      { value: "creando soluciones digitales", area: "tecnologia" },
      { value: "en contacto directo con personas", area: "sociales" },
      { value: "liderando o administrando una organizacion", area: "administracion" },
      { value: "comunicando ideas, productos o proyectos", area: "comunicacion" }
    ]
  },
  {
    id: "q4",
    text: "Que habilidad sentis mas fuerte en vos?",
    options: [
      { value: "pensamiento logico", area: "tecnologia" },
      { value: "empatia y escucha", area: "salud" },
      { value: "creatividad visual", area: "arte" },
      { value: "orden y planificacion", area: "administracion" }
    ]
  },
  {
    id: "q5",
    text: "Que resultado te motivaria mas?",
    options: [
      { value: "desarrollar una aplicacion util", area: "tecnologia" },
      { value: "mejorar la calidad de vida de otros", area: "salud" },
      { value: "ensenar y orientar a estudiantes", area: "educacion" },
      { value: "crear mensajes o piezas visuales", area: "comunicacion" }
    ]
  }
];

async function readJson(fileName) {
  const filePath = path.join(dataDir, fileName);
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content || "[]");
}

async function writeJson(fileName, data) {
  const filePath = path.join(dataDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function buildScores(answers) {
  const scores = Object.fromEntries(Object.keys(areas).map((area) => [area, 0]));

  for (const question of questionnaire) {
    const selectedArea = answers?.[question.id];
    if (selectedArea && scores[selectedArea] !== undefined) {
      scores[selectedArea] += 1;
    }
  }

  return scores;
}

function buildReport(student, answers, careers) {
  const scores = buildScores(answers);
  const rankedAreas = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0);

  const primaryAreas = rankedAreas.slice(0, 3).map(([area]) => area);
  const recommendedCareers = careers
    .filter((career) => primaryAreas.includes(career.area))
    .sort((a, b) => primaryAreas.indexOf(a.area) - primaryAreas.indexOf(b.area))
    .slice(0, 5)
    .map((career) => ({
      ...career,
      reason: `Coincide con tu afinidad por ${areas[career.area].toLowerCase()}.`
    }));

  return {
    id: `rep-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    course: student.course,
    school: student.school,
    answers,
    scores,
    topAreas: rankedAreas.slice(0, 3).map(([area, score]) => ({
      area,
      label: areas[area],
      score
    })),
    recommendations: recommendedCareers,
    createdAt: new Date().toISOString()
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, project: "OrientaIA" });
});

app.get("/api/careers", async (_req, res) => {
  const careers = await readJson("careers.json");
  res.json(careers);
});

app.get("/api/questionnaire", (_req, res) => {
  res.json({ areas, questionnaire });
});

app.post("/api/students", async (req, res) => {
  const { name, age, course, school, interests } = req.body;

  if (!name || !course || !school) {
    return res.status(400).json({ error: "Nombre, curso y colegio son obligatorios." });
  }

  const students = await readJson("students.json");
  const student = {
    id: `stu-${Date.now()}`,
    name: name.trim(),
    age: age || "",
    course: course.trim(),
    school: school.trim(),
    interests: interests || "",
    createdAt: new Date().toISOString()
  };

  students.push(student);
  await writeJson("students.json", students);
  res.status(201).json(student);
});

app.post("/api/questionnaire", async (req, res) => {
  const { studentId, answers } = req.body;

  if (!studentId || !answers) {
    return res.status(400).json({ error: "studentId y answers son obligatorios." });
  }

  const students = await readJson("students.json");
  const student = students.find((item) => item.id === studentId);

  if (!student) {
    return res.status(404).json({ error: "Alumno no encontrado." });
  }

  const careers = await readJson("careers.json");
  const reports = await readJson("reports.json");
  const report = buildReport(student, answers, careers);

  reports.push(report);
  await writeJson("reports.json", reports);
  res.status(201).json(report);
});

app.get("/api/reports/:studentId", async (req, res) => {
  const reports = await readJson("reports.json");
  const studentReports = reports.filter((report) => report.studentId === req.params.studentId);

  if (studentReports.length === 0) {
    return res.status(404).json({ error: "Reporte no encontrado." });
  }

  res.json(studentReports.at(-1));
});

app.get("/api/orientador/stats", async (_req, res) => {
  const students = await readJson("students.json");
  const reports = await readJson("reports.json");

  const courses = {};
  const careerCounts = {};
  const areaCounts = {};

  for (const report of reports) {
    courses[report.course] = (courses[report.course] || 0) + 1;

    for (const area of report.topAreas) {
      areaCounts[area.label] = (areaCounts[area.label] || 0) + 1;
    }

    for (const career of report.recommendations.slice(0, 3)) {
      careerCounts[career.name] = (careerCounts[career.name] || 0) + 1;
    }
  }

  res.json({
    totalStudents: students.length,
    totalReports: reports.length,
    courses,
    topAreas: Object.entries(areaCounts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total),
    topCareers: Object.entries(careerCounts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    recentReports: reports.slice(-5).reverse()
  });
});

app.listen(PORT, () => {
  console.log(`OrientaIA backend disponible en http://localhost:${PORT}`);
});

