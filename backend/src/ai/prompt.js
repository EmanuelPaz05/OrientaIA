// Construye el prompt vocacional personalizado para el alumno

export function buildPrompt(student, topAreas, careers) {
  const areasText = topAreas
    .map((a) => `${a.label} (puntaje: ${a.score})`)
    .join(", ");

  const careersText = careers.map((c) => c.name).join(", ");

  return `Sos un orientador vocacional argentino especializado en alumnos secundarios.

Perfil del alumno:
- Nombre: ${student.name}
- Edad: ${student.age || "no especificada"}
- Curso: ${student.course} en ${student.school}
- Intereses declarados: ${student.interests || "no especificados"}

Resultados del cuestionario:
- Areas con mayor afinidad: ${areasText}
- Carreras recomendadas por el sistema: ${careersText}

Redacta un analisis vocacional personalizado de 3 oraciones en español argentino (tuteo).
Debe ser calido, motivador y conectar los intereses del alumno con las carreras sugeridas.
Responde SOLO con el texto del analisis, sin titulos, sin bullets ni formato extra.`;
}
