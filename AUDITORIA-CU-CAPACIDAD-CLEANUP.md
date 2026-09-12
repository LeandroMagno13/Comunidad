# AUDITORÍA CU-CAPACIDAD — CLEANUP ESTRUCTURAL

> Limpieza estructural RONDA C (Lee.txt). No se diseñaron ni modificaron reglas
> económicas: se eliminaron dependencias ocultas y contradicciones entre el
> código y las definiciones conceptuales de la auditoría.
>
> Formato por intervención: **OBS / CAMBIO / TEST / RESULTADO**.
> Las propuestas económicas futuras figuran solo como **PENDIENTE** (fuera de alcance).

---

## 1. Desacoplar RONDA C del PID (§1)

**OBS**
- `src/pages/api/auth/register.ts:83` llamaba `getNewUserGrant()` → `getCuMetrics()`
  → `computeNewUserGrant(config, metrics.error, metrics.setPoint)`, acotado por
  `grantCap`. El grant de bienvenida dependía del **error del PID** (y del set point).
- `src/lib/capacity.ts` (RONDA C) importaba solo `ensureCuConfig`/`transferCu`,
  pero la dependencia del grant atravesaba el registro de usuarios.
- `PidController`, `evaluateSupplyPolicy`, `senseCanasta`, `effectiveCuSetPoint`,
  `computeNewUserGrant`/`getNewUserGrant` seguían presentes como mecanismo v2
  (solo diagnóstico), sin etiquetado explicito.

**CAMBIO**
- Nuevo módulo puro `src/lib/cap-formulas.ts`: única fuente de fórmulas RONDA C.
- `register.ts` usa `welcomeGrant({ newUserGrantCu, grantCap })` (cap-formulas):
  política **propia y explícita** (`min(newUserGrantCu, grantCap)` si
  `newUserGrantEnabled`). El PID no interviene y **no se reemplaza por otro
  controlador automático**.
- `cu.ts` etiqueta el bloque de control como `LEGACY / HISTORICAL`: PID, SupplyPolicy,
  sensor de canasta y grants dependientes de `metrics.error` quedan aislados; nada en
  la ruta de registro los llama.
- RONDA C (`capacity.ts`, `engine.ts`, `cap-formulas.ts`) no referencia ninguna
  función de control del PID (Test A).

**TEST**
- `scripts/cleanup/tests.ts` → Test A:
  - Estructural: `{capacity.ts, engine.ts, cap-formulas.ts}` sin `PidController`,
    `evaluateSupplyPolicy`, `getNewUserGrant`, `senseCanasta`, `effectiveCuSetPoint`,
    `clamp01`.
  - `capacity.ts` importa de `cu.ts` SOLO `{ensureCuConfig, transferCu}` (permitido).
  - Determinismo: mismo seed → resultado idéntico en dos corridas.

**RESULTADO**
- ✅ RONDA C puede ejecutarse sin PID. El grant de bienvenida es fijo/parametrizado
  (config), independiente de `metrics.error`.
- ✅ 39/39 tests PASS (incluye los de este archivo).

---

## 2. Eliminar CU como medio de pago del producto (§2)

**OBS**
- `src/pages/api/posts/[id]/offer.ts:89` transfería CU con memo
  `Pago por solicitud` en `complete`, tras validar `account.balance >= post.cuOffer`.
- `src/pages/api/posts.ts` **exigía** `cuOffer` (entero > 0) para crear una solicitud.
- La UI ofrecía/ro mostrada `cuOffer`: input "CU a ofrecer" y badges "{n} CU"
  en `app/community/page.tsx`, `app/community/[id]/page.tsx`, `app/guilds/[id]/page.tsx`.

**CAMBIO**
- `posts.ts`: `cuOffer` se ignora y se persiste siempre `null`; ya no se valida.
- `posts/[id]/offer.ts`: **sin** `transferCu` ni `ensureCuAccount`; el flujo
  `accept/complete/cancel` queda como gestión de solicitud comunitaria y registra
  **ParticipationEvent** (nuevo modelo `ParticipationEvent`, contribución no monetaria)
  al confirmar la tarea. Cabecera del archivo: `LEGACY / NO USAR COMO DINERO`.
- UI: se quitaron input y badges de CU; textos actualizados a "participación".
- `POST /api/posts` y `POST /api/posts/[id]/offer` no aceptan ni usan monto CU.

**TEST**
- Test B:
  - `posts.ts` no parsea ni exige `cuOffer` (persiste `null`).
  - `offer.ts` no importa `transferCu`/`ensureCuAccount`; usa `participationEvent.create`.
  - Sin texto "Pago por solicitud"/"transferir" en el producto activo.
  - Modelo `ParticipationEvent` presente en `prisma/schema.prisma`.

**RESULTADO**
- ✅ CU no puede usarse como dinero dentro del producto activo (no paga, cobra,
  compra, vende ni transfiere como precio). Las contribuciones se registran como
  eventos de participación.

---

## 3. Desacoplar CU de los niveles de acceso (§3)

**OBS**
- `src/lib/capacity.ts` (antes línea 146): `if (asProvider>=1) avanzado; else if
  (asAsker>=1 || (account?.balance ?? 0) > 0) medio`. El saldo CU > 0 desbloqueaba
  nivel **medio**.

**CAMBIO**
- `cap-formulas.ts`: `accessLevelFrom({ asProvider, asAsker })` — función pura,
  niveles por **participación/contribución verificada**, sin saldo de CU.
- `capacity.ts`: nuevo `getAccessLevel(userId)` que consulta solo conteos de
  solicitudes satisfechas (provider/asker); `refreshAccessLevel` delega en él.
  NINGUNA consulta a `cuAccount` en la ruta de acceso.

**TEST**
- Test C: `getAccessLevel` sin `cuAccount`/`balance`; contexto idéntico → mismo nivel
  (un hipotético cambio de saldo no altera nada, la función no recibe balance);
  contribución verificada → `avanzado`.

**RESULTADO**
- ✅ CU no determina por sí solo el nivel de acceso. Los niveles representan
  capacidades/permisos concretos (sin jerarquía moral): básico (piso), medio
  (participa solicitando), avanzado (contribuye satisfaciendo).

---

## 4-5. Capas separadas y patrimonio ↔ capacidad distribuible (§4, §5)

**OBS**
- Se verificó que no existe conversión `CU → dinero`, `CU → patrimonio` ni
  `CU × precio = riqueza`. El engine separa `recursosDistribuidos` (real) de CU.
- La interfaz `patrimonio → capacidad distribuible` estaba implícita en
  `getPatrimonySummary`/`distributablePerPeriod` (solo display).

**CAMBIO**
- Ninguno sobre las capas (ya separadas). El Test F garantiza que modificar
  patrimonio no altera la dinámica de CU (independencia estructural).

**TEST**
- Test F: `wealthPerAgent` 1 vs 20000, mismo seed → idénticas
  insatisfechas/%sat/cuSupply/cuCirculante (`cuSupply=1000` en ambos).

**RESULTADO**
- ✅ Patrimonio, capacidad distribuible, recursos disponibles y CU siguen siendo
  conceptos distintos y no convertibles.

**PENDIENTE**
- Implementar la relación concreta `patrimonio → capacidad distribuible` (siguiente
  experimento, fuera de alcance de esta limpieza).

---

## 6. Expiración de solicitudes (§6)

**OBS**
- `expireStaleRequests()` **no tenía caller** en producción: las solicitudes viejas
  seguían contándose indefinidamente como demanda insatisfecha.
- `computeSignals` filtraba solo `status != 'cancelled'` (no excluía `expired`).
- No existía fecha de expiración ni motivo de cierre para auditar.

**CAMBIO**
- `prisma/schema.prisma` → `CapacityRequest` gana `expiresAt DateTime?`,
  `closedAt DateTime?`, `closedReason String?`.
- `createCapacityRequest`: registra `expiresAt = now + WINDOW_DAYS(30)`.
- `expireStaleRequests(maxDays=WINDOW_DAYS)`: solicitudes `registered` con más de
  30 días → `status='expired'`, `closedAt=now`, `closedReason='auto-expiración'`.
- `computeSignals` llama `expireStaleRequests(WINDOW_DAYS)` al inicio y filtra
  **demanda vigente** = `status IN ('registered','satisfied')` dentro de la ventana
  de 30 días.

**TEST**
- Test D: `shouldExpire`/`expiresAtFrom` (ventana de 30 días); modelo puro: una
  solicitud vieja expirada (intensidad 50) deja de contar, la vigente (5) sí;
  estructural: filtro `['registered','satisfied']`, llamada a `expireStaleRequests`,
  `expiresAt: expiresAtFrom(...)`, `closedReason: 'auto-expiración'`.

**RESULTADO**
- ✅ Las solicitudes expiradas dejan de contar como demanda vigente. Se registran
  fecha de creación, fecha de expiración, estado y motivo de cierre.

**NOTA (validación en producción)**
- El cambio de schema se aplica en el próximo deploy (vercel-build → `prisma db push`).

---

## 7. Separar presión y carga humana (§7)

**OBS**
- Producto (`computeSignals`): `cargaHumana = round2(d.total / eff)` — demanda sobre
  oferta, **mismo numerador** que la presión (insatisfecha). Métricas no eran
  independientes.
- Engine (`statsOf`): `cargaHumana = humanDemand / eff` (criterio distinto al producto).

**CAMBIO**
- `cap-formulas.ts` define la única fórmula canónica:
  - `presionFrom(insatisfecha, efectiva)` = `insatisfecha / efectiva` (escasez).
  - `cargaHumanaFrom(utilizada, disponible)` = **capacidad humana utilizada /
    capacidad humana disponible** = `satisfecha / oferta efectiva`.
- Producto y engine usan ambas funciones compartidas.

**TEST**
- Test E (pares presión, carga):
  - Escasez real: `P=2.0, C=0.4` → presión alta, carga baja.
  - Abundancia alta utilización: `P=0, C=0.98` → presión baja, carga alta.
  - Abundancia baja utilización: `P=0, C=0.1` → ambas bajas.
  - Motor: escasez `P=23.65` vs abundancia `P=0` (carga 0.41 disponible).

**RESULTADO**
- ✅ Presión y carga humana son señales independientes y ambas están disponibles.

---

## 8. Corregir divergencia engine/producto (§8)

**OBS**
- Engine (`scripts/capacity/engine.ts` `statsOf`): oferta ponderada por
  `Math.max(0.2, nivelAcceso)` → niveles 0/1/2 = **0.2 / 1.0 / 2.0**.
- Producto (`capacity.ts`): `LEVEL_FACTOR = { basico 0.2, medio 0.5, avanzado 1.0 }`
  → avanzado pesaba **×1** en el producto y **×2** en el engine.

**CAMBIO**
- Definición canónica ÚNICA en `cap-formulas.ts`:
  `LEVEL_FACTOR = { basico 0.2, medio 0.5, avanzado 1.0 }`.
- `levelWeight(level)` para el producto; `levelWeightFromIndex(n)` para el engine
  (0→basico, 1→medio, 2→avanzado). La fórmula no se duplica.

**RAZÓN DE LA ELECCIÓN**
- El factor multiplica `disponibilidad × calidad` (ambos en 0..1). La oferta efectiva
  es una **fracción de capacidad (0..1)**, no un apalancamiento: avanzado = 1.0
  (plena), medio = 0.5, básico = 0.2. La definición desplegada del producto (y
  documentada en `REPORTE-CU-CAPACIDAD.md §5`) usa avanzado = 1.0; el factor 2.0 del
  engine sobreestimaba la oferta avanzada.

**IMPACTO SOBRE RESULTADOS**
- Evidencia RONDA C regenerada: `scripts/capacity/main.ts` → 32 escenarios,
  **8/8 tests críticos afirmativos**. Con la oferta avanzada ponderada a 1.0, la
  presión de escenarios con demanda alta sube en comparación con el engine previo
  (la capacidad ponderada es menor); la carga humana ahora mide utilización
  (satisfecha/ef) en vez de demanda/ef.

**TEST**
- Test G: imports compartidos (engine `levelWeightFromIndex`; producto `levelWeight`),
  definición única en `cap-formulas.ts`, mapeo engine↔producto idéntico
  (`0≡básico 0.2`, `1≡medio 0.5`, `2≡avanzado 1.0`).

**RESULTADO**
- ✅ Engine y producto comparten las mismas reglas de capacidad y niveles.

---

## 9. Separar explícitamente LEGACY (§9)

**OBS**
- El PID legacy y el harness de stress permanecían sin etiquetado arquitectónico, y
  `/ensayo-de-stress` era accesible sin autenticación desde el producto.

**CAMBIO**
- `cu.ts`: bloque `⚠️ LEGACY / NO USAR PARA REGULACIÓN` (PID, SupplyPolicy, sensor,
  control loop previo, grants por error) + nota en `getNewUserGrant`.
- `scripts/stress/engine.ts`: cabecera `LEGACY / NO USAR PARA REGULACIÓN` (solo
  investigación en memoria, no escribe saldos).
- `posts/[id]/offer.ts`: cabecera `LEGACY / NO USAR COMO DINERO`.
- `app/ensayo-de-stress/page.tsx`: redirige a `/admin` salvo `SUPER_ADMIN` (el legacy
  no queda accesible desde el producto normal).
- RONDA C se ejecuta sin importar ni invocar esos mecanismos (Test A).

**TEST** — Test A (ausencia de importaciones de control en RONDA C) + revisión de
cabeceras de archivo.

**RESULTADO**
- ✅ El legacy queda aislado y etiquetado; el producto normal no lo invoca.

---

## 10. Sin nuevas reglas económicas (§10)

Esta etapa fue exclusivamente de limpieza/desacoplamiento. No se agregó PID nuevo,
controlador alternativo, inflación/deflación, quema, nueva fórmula de grants,
CU↔patrimonio, CU↔dinero, fórmula definitiva de niveles ni distribución real.

---

## Criterios de finalización

| Criterio | Evidencia |
| --- | --- |
| RONDA C puede ejecutarse sin PID | Test A — sin referencias de control; determinismo |
| CU no puede usarse como dinero en producto activo | Test B — offer.ts sin transferCu; cuOffer null; ParticipationEvent |
| CU no determina por sí solo el nivel de acceso | Test C — getAccessLevel sin balance |
| Solicitudes expiradas dejan de contar como demanda vigente | Test D — filtro + expireStaleRequests con fechas/motivo |
| Presión y carga humana son señales independientes | Test E — pares (P,C) distintos |
| Engine y producto comparten reglas de capacidad | Test G — LEVEL_FACTOR canónico único |
| Patrimonio, capacidad distribuible y CU siguen siendo conceptos distintos | Test F — patrimonio no altera CU |

**Cierre: 39/39 PASS — `scripts/cleanup/tests.ts` → `evidence/capacidad/cleanup/cleanup-tests.json`**

## PENDIENTES (fuera de alcance)
- Relación concreta `patrimonio → capacidad distribuible` (experimento siguiente).
- Validación DB-integrada de Test C/D contra la base de producción tras el deploy
  (LIMITACIÓN: Postgres local apagado; cubierto con modelo puro + estructural).
- Retirar de la pizarra `/admin` el panel PID legacy (opcional de higiene visual).