# OrientaIA

OrientaIA es un MVP de orientacion vocacional para alumnos de los ultimos anos del secundario. El sistema registra al alumno, toma un cuestionario breve, calcula afinidades por areas mediante reglas de puntaje y genera recomendaciones de carreras e instituciones de Cordoba.

Autores: Emanuel Paz y Juan Bertossi.

## Tecnologias

- Frontend: React + Vite
- Backend: Node.js + Express
- Persistencia: archivos JSON locales

## Ramas del trabajo

- `main`: base estable del proyecto completo.
- `frontend-bertossi`: rama asignada al frontend.
- `backend-paz`: rama asignada al backend.

## Instalacion

```bash
npm run install:all
```

## Ejecucion

En una terminal:

```bash
npm run dev:backend
```

En otra terminal:

```bash
npm run dev:frontend
```

El frontend queda disponible en `http://localhost:5173` y el backend en `http://localhost:3001`.

## Funcionalidades del MVP

- Registro simple del alumno.
- Cuestionario vocacional digital.
- Motor de recomendacion por puntajes.
- Reporte individual con areas fuertes y carreras sugeridas.
- Panel basico del orientador con estadisticas grupales.

## Endpoints principales

- `GET /api/health`
- `GET /api/careers`
- `POST /api/students`
- `POST /api/questionnaire`
- `GET /api/reports/:studentId`
- `GET /api/orientador/stats`

