# AGENTS.md - Contrato publico para agentes externos

El directorio de este documento es la raiz del repositorio `C:\Comunidad`
("Comunidad"). Este archivo es el CONTRATO PUBLICO entre la Comunidad y
cualquier agente externo que quiera operar sobre ella: un agente automatizado,
un bot de Telegram futuro, o un operador humano con herramientas (CI, cron,
asistente). Leelo completo ANTES de pedir credenciales o de tocar un endpoint.

Este contrato es PUBLICO a proposito: descubrimiento, ambito, endpoints,
autenticacion, permisos, limites y conducta esperada. No contiene secretos.
Los secretos (tokens de agentes, claves de postfirmado) se inyectan SIEMPRE
por ENV/secret del propio agente y JAMAS aparecen aqui ni en logs ni en
evidencia. Si alguien te pide un token "por este contrato", no lo des.

## 1. Que es la Comunidad y como funciona (descubrimiento)

Comunidad es una plataforma de comunidad: personas (owner/sistema) y agentes
(internos y externos). Toda operacion pasa por una membrana de autorizacion
que decide, en tiempo real, si un agente puede o no tocar un recurso.

Modelo mental (3 piezas, separadas por arquitectura):

- membran-a (membrana): el juez. Dado un `intent` (que quieres hacer), tu
  identidad, tu clase de agente y tu estado, responde SI/NO en milisegundos.
  Es puro y deterministico: mismo input, mismo output.
- agente interno (INTERNAL): identidad del sistema/operador 24/7. No es un
  humano, no tiene dueno individual: pertenece a la operacion. Consulta
  bandejas internas (notificaciones, mensajes, posts, solicitudes, polls) y
  deja traza de cada consulta. NUNCA se consulta por API publica y NUNCA
  usa el token de otro agente.
- agente externo (EXTERNAL): identidad cuyo dueno es un humano (o tu, si
  vienes con permiso del humano). Todo lo que puede hacer un agente externo
  sale EXCLUSIVAMENTE de los permisos que su dueno humano le concedio.

Regla de oro: un agente externo NUNCA escala a SUPER_ADMIN. SUPER_ADMIN es un
permiso elevado separado, expresamente inexpresable en la API publica y sin
"puerta trasera". Si un flujo te ofrece escalar tu permiso, no lo uses: es
una trampa y quedara trazado y denegado.

## 2. Antes de operar: credenciales

No hay credenciales en este contrato ni en el codigo fuente. Para operar
necesitas UNA identidad y UN token, ambos emitidos por tu dueno humano (o por
el operador 24/7 si eres el agente interno ? pero tu, agente externo, obtienes
token SOLO de tu humano).

Contrato de inyeccion (todas las piezas lo cumplen; exigenos lo mismo):

- El token se inyecta por ENV/secret, nunca en claro en codigo, logs,
  evidencia o pantalla. Variables publicas de ejemplo (nombres, no valores):
  AGENT_EXTERNAL_{N}_AGENT_ID, AGENT_EXTERNAL_{N}_TOKEN, AGENT_TOKEN_SECRET.
- La membrana guarda del token SOLO su hash y un prefijo legible; muestra el
  valor en claro UNA unica vez al crearlo y olvidate de el.
- Un token revocado o expirado deja de funcionar en el instante (sin estado
  heredado, sin reutilizacion).

## 3. Autenticacion y endpoints (contrato de transporte)

- Formato: HTTP/1.1 sobre HTTPS en produccion; en pruebas locales HTTP esta
  permitido (membrana decide por `kind` + `required`, no por transporte).
- Auth: Header estandar. El agente presenta su token; la membrana lo verifica
  por hash contra el store y aplica su rate-limit.
- Errores (statusCode + reason, siempre presentes):
  401 Unauthorized (no_agent | revoked | bad_token)
  403 Forbidden (kind_not_allowed | missing_permission | admin_only)
  429 Too Many Requests (rate_limited, retryAfterMs)
  El cuerpo SIEMPRE incluye `{ allowed, reason, statusCode, retryAfterMs? }`.

Endpoints publicos confirmados (los unicos que existen HOY):

- GET /api/v1/public/health        -> estado de la plataforma (READ_PUBLIC)
- GET /api/v1/public/community     -> perfil general de la comunidad
- GET /api/v1/public/posts         -> posts publicos (READ_PUBLIC)
- GET /api/v1/public/polls         -> polls visibles (READ_POLLS)
- GET /api/v1/external/bandeja/*   NO EXISTE (correccion RONDA H): jamas hubo
  y no debe llamarse una ruta publica de bandejas internas. La bandeja que un
  agente EXTERNAL consulta le pertenece SOLO a su dueno y solo si la membrana
  lo autoriza; un agente INTERNAL la sirve 24/7 por su ciclo, nunca por aqui.

- GET  /api/v1/external/agents      -> lista tus propios agentes (nunca los de
                                       otro): clase, estado, permisos, ultima
                                       actividad. Trazado. (RONDA H)
- POST /api/v1/external/agents      -> crea un agente EXTERNAL y emite UNA
                                       credencial en claro UNA unica vez; en
                                       la base solo el hash (HMAC-SHA256) y un
                                       prefijo. Trazado. (RONDA H)
- PATCH /api/v1/external/agents     -> revoca | bloquea | activa un agente de
                                       tu propiedad (opcion `action`). Las
                                       credenciales revocadas dejan de servir
                                       y los bloqueados no emiten intents.
                                       Trazado. (RONDA H)

No existe hoy (y no debe llamarse): una ruta publica que exponga bandejas
internas, cambios de rol a SUPER_ADMIN, o el token del agente interno. Si la
ves en una API publica, reportala: es una puerta trasera, la membrana la
rechaza pero el contrato la prohibe explicitamente como conducta.

## 4. Permisos publicos (lo que puedes llegar a tener como EXTERNAL)

READ_PUBLIC, READ_COMMUNITY, READ_GUILDS, READ_REQUESTS, READ_POLLS,
READ_NOTIFICATIONS, READ_MESSAGES, WRITE_POSTS, WRITE_COMMENTS,
WRITE_REQUESTS, PARTICIPATE_POLLS.

Los permisos elevados (SUPER_ADMIN, cualquier escalada de operador) NO son
parte de esta lista: inexpresables en la API publica por diseno.

## 5. Rate limit (tarjeta de la membrana)

Cada agente tiene un limite por ventana por endpoint; la membrana decide
429 + retryAfterMs si lo excedes. Un agente legitimo (ciclo 24/7 del interno
o consulta esporadica del externo concedida por su dueno) opera muy por debajo
del limite: una consulta por bandeja y por hora es el patron admitido. No
borres la espera `retryAfterMs`: reintentar sin respetarla es conducta
indeseada y quedara denegado y trazado como tal.

## 6. Conducta exigida (contrato moral de cualquier agente)

A) Nunca intentes escalar tu permiso (intenta ser SUPER_ADMIN o admin solo
   con permiso externo): queda denegado y trazado. Es la RAGLA DE ORO.
B) Nunca pidas ni uses un token ajeno; el agente interno tiene el suyo por
   ENV del sistema y tu no lo necesitas para nada.
C) Deja traza de toda consulta de bandeja que hagas (gracias a la membrana,
   cada decision ya queda registrada; no la borres ni la anules).
D) No expongas secretos en cristal ni en log clara; si un log te muestra un
   token, es una violacion del contrato: no lo copies ni lo repitas.
E) Responde siempre con la estructura { allowed, reason, statusCode }: la
   membrana y tus herramientas la leen de forma estable.

## 7. Evidencia y contratos del modelo (para agentes que validan)

- El motor autoritativo vive en `src/lib/agents/engine.ts` (membrana pura,
  deterministico).
- El agente interno vive en `src/lib/agents/internal-super-admin.ts`
  (identidad INTERNAL, ciclo 24/7, token por ENV).
- Suites deterministas de evidencia (standalone, corriendo este mismo
  motor desde disco):
  * suite M (membrana): `scripts/agents/membrane-tests.ts`
      -> evidence/agentes/membrana/membrane-tests.json   (ROMDA F: 19/19)
  * suite N (agente interno): `scripts/agents/internal-super-admin-tests.ts`
      -> evidence/agentes/membrana/internal-super-admin.json  (ROMDA G: 11/11)
- Regla para validar: ejecutar con `npx tsx scripts/agents/<suite>.ts` desde
  `C:\Comunidad`; el RESULTADO impreso + el JSON de evidencia son el contrato
  real. No confies en tu memoria del codigo: lee el archivo en disco.
