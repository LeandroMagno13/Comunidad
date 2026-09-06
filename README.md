# Comunidad Post Singularidad

Plataforma web experimental para explorar una transición económica frente al avance de la automatización y la inteligencia artificial.

## Descripción del Proyecto

Este proyecto implementa la visión detallada en `Inst.txt`: una comunidad que construye colectivamente capital productivo y utiliza parte de sus rendimientos para generar acceso a recursos para sus miembros.

### Conceptos Clave

- **CU (Community Units)**: Unidades internas de intercambio, colaboración y participación comunitaria
- **Gremios**: Comunidades especializadas (programación, electrónica, derecho, finanzas, sociología, etc.)
- **Proyectos**: Colaboración entre gremios para resolver preguntas económicas, jurídicas, sociológicas y tecnológicas
- **Patrimonio Productivo Colectivo**: Inversiones diversificadas que generan recursos para la comunidad
- **Democracia Experimental**: Gobernanza distribuida que evoluciona con la comunidad

## Estructura del Proyecto

```
comunidad-capital-humano/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page principal
│   ├── login/                    # Página de login
│   ├── register/                 # Página de registro
│   ├── guilds/                   # Gestión de gremios
│   ├── projects/                 # Gestión de proyectos
│   └── admin/                    # Panel administrativo
├── src/
│   ├── lib/
│   │   ├── auth.ts              # Utilidades de autenticación (JWT)
│   │   └── db.ts                # Cliente Prisma
│   ├── pages/api/               # API Routes
│   │   ├── auth/
│   │   │   ├── login.ts         # Login de usuarios
│   │   │   └── register.ts      # Registro de usuarios
│   │   ├── users.ts             # CRUD usuarios
│   │   ├── skills.ts            # CRUD habilidades
│   │   ├── categories.ts        # CRUD categorías
│   │   ├── guilds.ts            # CRUD gremios
│   │   ├── projects.ts          # CRUD proyectos
│   │   └── admin/
│   │       └── dashboard.ts     # Dashboard administrativo
│   └── types/
│       └── models.ts            # Tipos TypeScript
├── prisma/
│   └── schema.prisma            # Esquema de base de datos
└── package.json
```

## Funcionalidades Implementadas

### 1. Landing Page (app/page.tsx)
Basada en las secciones 16-24 y 36 de Inst.txt:
- Hero con mensaje principal: "¿Qué pasa cuando el trabajo deja de ser necesario?"
- Sección: "No queremos detener el futuro. Queremos participar de él."
- Visualización: IDEAL * COMUNIDAD * CAPITAL * TECNOLOGÍA = AUTONOMÍA
- Dos circuitos: Humano y Productivo
- Mercado humano basado en oferta/demanda
- Democracia experimental
- Múltiples comunidades interoperables
- "Esto todavía no existe" - transparencia total
- Buscamos constructores (12 categorías)
- CTA final con 5 opciones

### 2. Autenticación
- **Registro** (`/register`): Formulario completo con todos los campos de Inst.txt sección 25
- **Login** (`/login`): Autenticación con JWT
- Hash de contraseñas con bcrypt
- Tokens JWT con expiración 7 días

### 3. Gestión de Usuarios y Perfiles
- Perfil con: nombre, email, profesión, país, bio, expertise, intereses, disponibilidad, LinkedIn, GitHub, website
- Estados: `registered` → `reviewing` → `approved` → `active`
- Habilidades y categorías de interés

### 4. Gremios (Guilds)
- CRUD completo de gremios
- Miembros con roles: member, admin, moderator
- Proyectos asociados
- Discusiones

### 5. Proyectos
- CRUD de proyectos
- Estados: investigation, active, completed, on-hold
- Responsables por gremio
- Contribuidores

### 6. Panel Administrativo
- Vista de todos los colaboradores con filtros
- Estadísticas en tiempo real:
  - Total colaboradores
  - Nuevos últimos 30 días
  - Distribución por especialidad
  - Inversores potenciales, abogados, economistas, programadores
- Cambio de estado de usuarios
- Notas internas
- Exportación de datos

### 7. Base de Datos (Prisma + PostgreSQL)
Modelos principales:
- User, Profile, Skill, Category
- Guild, GuildMembership
- Project, Task
- Discussion, Reply
- Contribution, Interest, AdminNote

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL con Prisma ORM
- **Auth**: JWT (jose), bcryptjs
- **API**: Next.js API Routes

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Configurar base de datos (PostgreSQL)
# Editar .env con DATABASE_URL

# Ejecutar migraciones
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## Variables de Entorno (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/comunidad"
JWT_SECRET="your-secret-key-change-in-production"
BCRYPT_ROUNDS=12
PORT=3000
```

## Roadmap (Según Inst.txt)

### FASE 1 — REUNIR PERSONAS ✅
- Landing + registro + perfiles + administración

### FASE 2 — CONSTRUIR CONOCIMIENTO 🔄
- Gremios + proyectos + documentos + discusiones

### FASE 3 — EXPERIMENTAR ⏳
- CU, reputación, solicitudes, intercambio, mecanismos democráticos

### FASE 4 — CONSTRUIR PATRIMONIO ⏳
- Estructura patrimonial, captación de capital, inversión, gestión, transparencia, auditoría

### FASE 5 — DISTRIBUIR ACCESO ⏳
- CU → acceso → recursos

### FASE 6 — INTEROPERABILIDAD ⏳
- Comunidad A ↔ Comunidad B ↔ Comunidad C

## Principios de Diseño (Sección 31)

- **Intelectual, ambicioso, sobrio, experimental, transparente, tecnológico, humano, económicamente serio**
- NO: lenguaje de startup vacío, "revolucionario", "disruptivo", promesas de riqueza, lenguaje de criptomoneda, espiritualidad New Age, lenguaje político partidario, propaganda

## Frases Clave (Sección 32)

- "No estamos buscando empleados. Estamos buscando constructores."
- "No queremos detener el futuro. Queremos participar de él."
- "El ideal sin poder no sirve. El poder sin ideal tampoco."
- "Si las máquinas producen cada vez más, necesitamos preguntarnos quién posee esa productividad."
- "No queremos distribuir solamente riqueza existente. Queremos construir patrimonio."
- "Esto todavía no existe. Por eso necesitamos construirlo."
- "No tenemos todas las respuestas. Tenemos preguntas que vale la pena intentar responder."

## Licencia

Proyecto experimental sin fines de lucro.
