// Validaciones para los endpoints de la API.
//
// Implementación propia sin dependencias externas (lento y seguro:
// evita sumar una dependencia de red que no se pudo instalar).
// La API pública es la misma que con Zod:
//   - cada schema expone .parse(body) que lanza Error con mensaje claro
//   - validateBody(schema, body) devuelve { success, data } o { success, error }

export interface Schema<T> {
  parse(body: unknown): T;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function fail(msg: string): never {
  throw new Error(msg);
}

function checkEmail(v: unknown): string {
  const s = str(v)?.trim() ?? '';
  if (!s) fail('email: El email es obligatorio');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) fail('email: Email inválido');
  return s;
}

// ─── Posts ─────────────────────────────────────────────────────────────────
export interface CreatePostInput {
  title?: string;
  content: string;
  guildId?: string;
  type: 'update' | 'request';
}

export const createPostSchema: Schema<CreatePostInput> = {
  parse(body: unknown): CreatePostInput {
    if (!isRecord(body)) fail('body: Datos inválidos');
    const content = str(body.content) ?? '';
    if (!content.trim()) fail('content: El contenido no puede estar vacío');
    if (content.length > 20000) fail('content: El contenido es demasiado largo');
    const title = str(body.title);
    if (title !== undefined && title.length > 200) {
      fail('title: El título no puede superar 200 caracteres');
    }
    const guildId = str(body.guildId);
    const rawType = str(body.type) ?? 'update';
    if (rawType !== 'update' && rawType !== 'request') {
      fail('type: Tipo inválido (update | request)');
    }
    return { title, content, guildId, type: rawType };
  },
};

// ─── Comentarios ───────────────────────────────────────────────────────────
export interface CreateCommentInput {
  content: string;
  parentId?: string;
}

export const createCommentSchema: Schema<CreateCommentInput> = {
  parse(body: unknown): CreateCommentInput {
    if (!isRecord(body)) fail('body: Datos inválidos');
    const content = str(body.content) ?? '';
    if (!content.trim()) fail('content: El comentario no puede estar vacío');
    if (content.length > 5000) fail('content: El comentario es demasiado largo');
    const parentId = str(body.parentId);
    return { content, parentId };
  },
};

// ─── Gremios ───────────────────────────────────────────────────────────────
export interface CreateGuildInput {
  name: string;
  description: string;
  purpose?: string;
}

export const createGuildSchema: Schema<CreateGuildInput> = {
  parse(body: unknown): CreateGuildInput {
    if (!isRecord(body)) fail('body: Datos inválidos');
    const name = (str(body.name) ?? '').trim();
    if (!name) fail('name: El nombre es obligatorio');
    if (name.length > 100) fail('name: El nombre no puede superar 100 caracteres');
    const description = (str(body.description) ?? '').trim();
    if (!description) fail('description: La descripción es obligatoria');
    if (description.length > 1000) fail('description: La descripción es demasiado larga');
    const purpose = str(body.purpose);
    if (purpose !== undefined && purpose.length > 500) {
      fail('purpose: El propósito no puede superar 500 caracteres');
    }
    return { name, description, purpose };
  },
};

// ─── Proyectos ─────────────────────────────────────────────────────────────
export interface CreateProjectInput {
  title: string;
  description: string;
  objectives?: string;
}

export const createProjectSchema: Schema<CreateProjectInput> = {
  parse(body: unknown): CreateProjectInput {
    if (!isRecord(body)) fail('body: Datos inválidos');
    const title = (str(body.title) ?? '').trim();
    if (!title) fail('title: El título es obligatorio');
    if (title.length > 200) fail('title: El título no puede superar 200 caracteres');
    const description = (str(body.description) ?? '').trim();
    if (!description) fail('description: La descripción es obligatoria');
    if (description.length > 5000) fail('description: La descripción es demasiado larga');
    const objectives = str(body.objectives);
    if (objectives !== undefined && objectives.length > 2000) {
      fail('objectives: Los objetivos son demasiado largos');
    }
    return { title, description, objectives };
  },
};

// ─── Auth ──────────────────────────────────────────────────────────────────
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export const registerSchema: Schema<RegisterInput> = {
  parse(body: unknown): RegisterInput {
    if (!isRecord(body)) fail('body: Datos inválidos');
    const email = checkEmail(body.email).toLowerCase();
    const password = str(body.password) ?? '';
    if (!password) fail('password: La contraseña es obligatoria');
    if (password.length < 8) fail('password: La contraseña debe tener al menos 8 caracteres');
    if (password.length > 100) fail('password: La contraseña es demasiado larga');
    const name = (str(body.name) ?? '').trim();
    if (!name) fail('name: El nombre es obligatorio');
    if (name.length > 100) fail('name: El nombre no puede superar 100 caracteres');
    return { email, password, name };
  },
};

export interface LoginInput {
  email: string;
  password: string;
}

export const loginSchema: Schema<LoginInput> = {
  parse(body: unknown): LoginInput {
    if (!isRecord(body)) fail('body: Datos inválidos');
    const email = checkEmail(body.email).toLowerCase();
    const password = str(body.password) ?? '';
    if (!password) fail('password: La contraseña es obligatoria');
    return { email, password };
  },
};

// ─── Encuestas ─────────────────────────────────────────────────────────────
export interface CreatePollInput {
  title: string;
  description?: string;
  scope: 'guild' | 'community';
  guildId?: string;
  options: string[];
  closesAt?: string;
}

export const createPollSchema: Schema<CreatePollInput> = {
  parse(body: unknown): CreatePollInput {
    if (!isRecord(body)) fail('body: Datos inválidos');
    const title = (str(body.title) ?? '').trim();
    if (!title) fail('title: El título es obligatorio');
    if (title.length > 200) fail('title: El título no puede superar 200 caracteres');
    const description = str(body.description);
    if (description !== undefined && description.length > 1000) {
      fail('description: La descripción es demasiado larga');
    }
    const scope = str(body.scope) ?? 'guild';
    if (scope !== 'guild' && scope !== 'community') {
      fail('scope: Ámbito inválido (guild | community)');
    }
    const guildId = str(body.guildId);
    const options = Array.isArray(body.options) ? body.options : null;
    if (!options || options.length < 2) fail('options: Se requieren al menos 2 opciones');
    if (options.length > 10) fail('options: Máximo 10 opciones');
    const cleanOptions = options.map((o) => (typeof o === 'string' ? o.trim() : ''));
    if (cleanOptions.some((o) => !o)) fail('options: Las opciones no pueden estar vacías');
    if (cleanOptions.some((o) => o.length > 200)) {
      fail('options: Cada opción admite hasta 200 caracteres');
    }
    const closesAt = str(body.closesAt);
    if (closesAt !== undefined && Number.isNaN(Date.parse(closesAt))) {
      fail('closesAt: Fecha inválida');
    }
    return { title, description, scope, guildId, options: cleanOptions, closesAt };
  },
};

// ─── Solicitudes de capacidad ──────────────────────────────────────────────
export interface CreateCapacityRequestInput {
  capacityId: string;
  intensity: number;
  urgencyLevel: number;
}

export const createCapacityRequestSchema: Schema<CreateCapacityRequestInput> = {
  parse(body: unknown): CreateCapacityRequestInput {
    if (!isRecord(body)) fail('body: Datos inválidos');
    const capacityId = (str(body.capacityId) ?? '').trim();
    if (!capacityId) fail('capacityId: La capacidad es obligatoria');
    const intensity =
      typeof body.intensity === 'number' ? Math.floor(body.intensity) : 1;
    if (intensity < 1 || intensity > 5) fail('intensity: Debe estar entre 1 y 5');
    const urgencyLevel =
      typeof body.urgencyLevel === 'number' ? Math.floor(body.urgencyLevel) : 0;
    if (urgencyLevel < 0 || urgencyLevel > 3) {
      fail('urgencyLevel: Debe estar entre 0 y 3');
    }
    return { capacityId, intensity, urgencyLevel };
  },
};

// Helper para validar y manejar errores (misma firma que antes)
export function validateBody<T>(
  schema: Schema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Datos inválidos' };
  }
}
