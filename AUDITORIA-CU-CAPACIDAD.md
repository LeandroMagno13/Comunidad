# AUDITORÍA CU–CAPACIDAD (RONDA C)

**Objetivo**: verificar si la implementación actual corresponde al modelo conceptual de Ronda C ("CU como señal de participación, demanda y acceso; patrimonio real separado") o todavía existen dependencias del modelo PID / CU = dinero.

**Alcance**: código fuente (`src/lib/cu.ts`, `src/lib/capacity.ts`, `src/pages/api/cu/*`, `app/admin/page.tsx`, `scripts/capacity/engine.ts`, prisma schema), producción (`https://www.postsingular.org`), y pruebas conceptuales reproducibles (`scripts/capacity/audit-tests.ts`, seed=12345, 100 agentes, 20 ciclos).

**Regla §20**: no proteger el modelo. Si algo contradice la hipótesis, se dice.

---

## 1. Arquitectura actual real

| Capa | Archivos | Función | Escribe DB | Afecta saldos |
|------|----------|---------|:----------:|:-------------:|
| **Modelo legacy PID / Sensor v2** | `src/lib/cu.ts` | PidController, senseCanasta, effectiveCuSetPoint, evaluateSupplyPolicy, computeNewUserGrant, getCuMetrics, refreshCuSensor, runCuSimulation | Sí (basket, config) | No (salvo issueCu en registro) |
| **Sistema RONDA C** | `src/lib/capacity.ts`, `src/pages/api/cu/capacities.ts`, `requests.ts`, `metrics.ts` | computeSignals, createCapacityRequest, satisfyCapacityRequest, refreshAccessLevel, getPatrimonySummary | Sí (CapacityRequest, UserCapacity, User.cuAccessLevel) | Sí (transferCu al satisfacer) |
| **Motor de simulación** | `scripts/capacity/engine.ts` | runCapacitySim (mini‑mundo CU) | No | Sí (in‑memory) |
| **Pizarra / Ensayo** | `app/admin/page.tsx`, `src/pages/api/cu/simulate.ts` | Display + corrige "ensayo de stress" | No (solo lectura) | No |
| **Registro** | `src/pages/api/auth/register.ts` | Grant de bienvenida (issueCu) | Sí | Sí |
| **Legacy marketplace** | `src/pages/api/posts/[id]/offer.ts` | Pago CU por solicitud de post | Sí | Sí (transferCu) |

**Hallazgo: doble tubería**
- **OBSERVADO**: el dashboard pizarra renderiza dos paneles: (1) legacy PID (set point, sensor, error, PID output, política de oferta, emisión) y (2) RONDA C (patrimonio, distribuible, demanda, niveles, ranking capacidades).
- **INTERPRETACIÓN**: ambos paneles leen la misma tabla `CuMetrics` + `señalizacion`. La capa PID (cu.ts) calcula números que se muestran pero no ejecutan ninguna escritura; la capa RONDA C sí escribe (solicitudes, transferencias).
- **HIPÓTESIS**: el panel PID es funcionalidad experimental para el laboratorio de ensayo (comparar modelos); no debería confundir al usuario sobre qué gobierna la economía.
- **RECOMENDACIÓN**: mover el panel PID a una sección colapsable "Laboratorio / Experimento histórico" (ya parcialmente hecho con la etiqueta "no gobierna") para reducir ruido.

---

## 2. Auditoría del PID (§3 A–F)

### Dependencias encontradas

| Función PID / control | Ubicación | ¿Modifica saldos? | ¿Genera CU? |
|------------------------|-----------|:-------------------:|:------------:|
| `PidController.update()` | cu.ts:163‑175 | No | No |
| `evaluateSupplyPolicy()` | cu.ts:211‑255 | No | Devuelve número (emission), nunca se pasa a issueCu |
| `senseCanasta()` | cu.ts:283‑295 | No (solo DB basket.observedCu) | No |
| `effectiveCuSetPoint()` | cu.ts:299‑303 | No | No |
| `computeNewUserGrant()` | cu.ts:464‑468 | No (fórmula pura) | Sí (se usa en register para issueCu) |
| `getCuMetrics()` | cu.ts:521‑638 | No (solo lectura) | No (devuelve policy.emission, no lo ejecuta) |
| `runCuSimulation()` | cu.ts:727‑805 | No (in‑memory) | No (resultado desechado) |
| `refreshCuSensor()` | cu.ts:646‑672 | Sí (actualiza basket.observedCu) | No |
| `getNewUserGrant()` | cu.ts:470‑478 | No (usa getCuMetrics, devuelve amount) | Sí (register lo consume) |

### Respuestas §3

**A. ¿La RONDA C realmente depende del PID?**
`computeSignals()` y `createCapacityRequest()` y `satisfyCapacityRequest()` no importan ni usan ninguna función PID. La capa RONDA C (capacity.ts) solo importa `ensureCuConfig` y `transferCu` de cu.ts. **No depende del PID** en su lógica de señalización y asignación.

**B. ¿Una señal PID puede modificar saldos?**
No. El `pidOutput` se calcula dentro de `getCuMetrics()` y se devuelve en la respuesta JSON. Ninguna ruta de producción toma ese valor para ejecutar `issueCu`, `consumeCu` o `transferCu`. El único camino de emisión con efecto es `issueCu` desde `register.ts`.

**C. ¿Una señal PID puede generar CU?**
No directamente. Sin embargo, la única emisión real de CU (grant de bienvenida) **sí depende del error y setPoint del PID**: `register.ts:83` llama a `getNewUserGrant()` → `getCuMetrics()` → `computeNewUserGrant(config, metrics.error, metrics.setPoint)`. La emisión real (issueCu) está thus **indirectamente anclada al PID** aunque está acotada por `grantCap` (hoy 30 CU).

**D. ¿SupplyPolicy puede generar CU sin intervención humana?**
`evaluateSupplyPolicy()` retorna un número `emission`. No hay scheduler, cron, ni lambda que tome ese número y lo pase a `issueCu`. En producción, SupplyPolicy solo produce un número que se muestra. **No genera CU reales automáticamente**.

**E. ¿El dashboard muestra valores PID aunque Ronda C no los utilize?**
Sí. Las stats del panel "Economía de CU" incluyen: Set point, Canasta observada, Sensor v2, Acceso real, Error compuesto, Señal PID, Polítulo (expansión/neutralidad/contracción), Señal → Emisión/Quema. Todo etiquetado "experimento histórico (no gobierna)".

**F. ¿El simulador sigue ejecutando MEDICIÓN → PID → POLÍTICA → EMISIÓN?**
Sí. `runCuSimulation()` (cu.ts:727) ejecuta exactamente esa tubería 240 ciclos. Se invoca desde `/api/cu/simulate.ts` (pizarra / ensayo). No escribe a DB, solo devuelve arrays de ciclos para graficar. En producción no se ejecuta automáticamente; solo se llama cuando un usuario abre la página de ensayo.

**Hallazgo §3:**
- **OBSERVADO**: la capa PID (sensor, error, política) calcula pero no muta la economía real. La única emisión real (grant al registrar) depende de `metrics.error` y `metrics.setPoint` (ambos del PID). El panel PID se muestra como "no gobierna".
- **INTERPRETACIÓN**: el PID es legado de Ronda A; se conserva como herramienta de laboratorio. El flag `pidGoverning=false` en `CuConfig` refleja que la política de oferta no se aplica; sin embargo, el grant sí depende del error del PID (oculto bajo `computeNewUserGrant`).
- **HIPÓTESIS**: cuando se eliminó el PID como mecanismo central, no se aisló la dependencia residual en el grant. `grantCap` amortigua el efecto hoy, pero si `grantCap` se elimina o aumenta mucho, el PID vuelve a influir la emisión.
- **RECOMENDACIÓN**: reemplazar `getNewUserGrant()` por un monto fijo `config.grantCap` directo, o documentar explícitamente que el grant puede variar según el estado del sistema (y por qué). Esto elimina la dependencia oculta del PID sin perder funcionalidad.

---

## 3. Dependencias SupplyPolicy (§3 continuación)

- **OBSERVADO**: la configuración PID (`kp`, `ki`, `kd`, `expansionGain`, `contractionGain`, `maxEmissionPerCycle`, etc.) se almacena en `CuConfig` y es editable desde el formulario de la pizarra admin. `getCuMetrics()` usa esos valores para calcular `pidOutput` y `policy` (phase/emission/burn). El texto del encabezado de la pizarra dice: *"emisión = política de grants, no reacción al error de canasta"* (page.tsx:1033).
- **OBSERVADO (contradicción)**: la barra de stats muestra "Señal → Emisión/Quema: 7/0 CU" con tooltip: *"Decisión de la política según la señal: emisión en expansión"* — eso es `policy.emission` del SupplyPolicy (reacción al error de canasta), no grants.
- **INTERPRETACIÓN**: el texto del encabezado contradice lo que muestra la barra de stats. La "emisión" que se ve (7 CU) es el cálculo del PID+SupplyPolicy, no un grant. Nada la ejecuta, pero la UI confunde al lector.
- **HIPÓTESIS**: la contradicción persiste porque el panel fue migrado del modelo A sin renombrar ni reconciliar las etiquetas con los datos.
- **RECOMENDACIÓN**: renombrar la stat "Señal → Emisión/Quema" a "Señal PID → Decisión teórica (no ejecutada)" o eliminarla del panel principal. Mantener solo en modo laboratorio colapsado.

---

## 4. Significado real de CU (§5)

### Modelo 1: CU gastada para realizar una solicitud
- **OBSERVADO**: `createCapacityRequest()` registra `cuCommitted` (apuesta) pero **no descuenta** saldo (no llama a `consumeCu`). La apuesta queda en hold (campo `cuCommitted` del registro). Si la solicitud expira, el `expireStaleRequests()` (definido, **nunca llamado en prod**) devolvería la apuesta manualmente. Al satisfacer (`satisfyCapacityRequest`), la apuesta se transfiere al proveedor (transferCu) — no se quema.
- **INTERPRETACIÓN**: en producción, **hoy no se consume CU al solicitar**. La apuesta es un registro, no una transacción. El modelo 1 no está implementado.

### Modelo 2: CU asignada al usuario por realizar una contribución
- **OBSERVADO**: el proveedor recibe `cuCommitted` del asker al satisfacer (capacity.ts:178). También se llama `refreshAccessLevel()` que marca al proveedor como "avanzado" si tiene ≥1 satisfacción. Además, `issueCu` en registro asigna el grant inicial.
- **INTERPRETACIÓN**: las CU se comportan como crédito de contribución: se ganan al satisfacer a otros (transfer del asker). Es un modelo de incentivo parcial.

### Modelo 3: CU para determinar prioridad
- **OBSERVADO**: `cuCommitted` se almacena en cada solicitud. En el motor de simulación (engine.ts:478), `orderly()` ordena por `b.cuCommitted - a.cuCommitted` dentro de cada nivel de acceso. **En producción**, no hay algoritmo automático de matching; el proveedor elige manualmente qué solicitud atender; el `cuCommitted` es información visible, no un mecanismo de asignación automática.
- **INTERPRETACIÓN**: la prioridad por CU está *registrada* pero no *operacionalizada* en producción. En el engine sí se usa.

### Modelo 4: Combinación (actual)
- **OBSERVADO**: CU funciona como: (1) registro de participación (creación de solicitud, sin descuento); (2) recompensa al proveedor al satisfacer; (3) señal de prioridad (registrada pero no ejecutada automáticamente); (4) grant inicial al registrarse.
- **INTERPRETACIÓN**: el sistema real es una combinación limitada de los modelos 2 y 3: CU incentiva la contribución y registra preferencia, pero no gasta, no compra acceso, no asigna automáticamente. LasCU son señales, no moneda.

| Modelo | ¿Implementado? | Ventajas | Riesgos |
|--------|:-:|----------|---------|
| M1 (gastar al solicitar) | No | Desincentiva solicitudes frívolas | Excluye a pobres de CU; CU → poder |
| M2 (asignar por contribución) | Sí (parcial) | Incentiva ofrecer capacidad | Acumulación de CU → ahorro/poder |
| M3 (prioridad) | Parcialmente (sin matching automático) | Asigna eficientemente si hay escasez | CU → ventaja desigual; "quien paga más, primero" |
| M4 (combinación) | Sí | Equilibrio participación/contribución | Complejidad; riesgo de que M1 o M3 dominen |

---

## 5. Significado real de demanda (§6)

### Definiciones operacionales

| Término | Definición | Dónde se calcula |
|---------|-----------|------------------|
| **Solicitud** | Registro en `CapacityRequest` con `askerId`, `capacityId`, `intensity`, `cuCommitted` | `createCapacityRequest()` (capacity.ts:152) |
| **Demanda (total)** | Σ `intensity` de solicitudes `status ≠ 'cancelled'` dentro de `WINDOW_DAYS` (30 días) | `computeSignals()` (capacity.ts:68-97) |
| **Demanda satisfecha** | Σ `intensity` de solicitudes `status = 'satisfied'` | capacity.ts:95 |
| **Demanda insatisfecha** | Demanda total − demanda satisfecha (incluye `registered` + `expired`) | capacity.ts:101 |
| **Demanda repetida** | No distinguida. Un usuario puede crear 100 solicitudes de la misma capacidad → infla la demanda total. Sin deduplicación. | Sin implementación |
| **Demanda cancelada** | Estado posible en schema (`status: cancelled`), `computeSignals()` lo excluye (line 72). **Ninguna ruta de API lo genera**. Estado fantasma. | Sin implementación |

**Hallazgo: demanda cancelada y repetida**
- **OBSERVADO**: `createCapacityRequest` no tiene cooldown, ni límite de solicitudes concurrentes, ni deduplicación. `expireStaleRequests()` está definido (capacity.ts:189) pero **nunca se ejecuta** (no hay caller en src/app ni cron). Las solicitudes expiran solo en el motor de simulación (engine.ts:401), no en producción.
- **OBSERVADO**: el schema permite `status: cancelled` y `computeSignals()` excluye cancelled del cómputo, pero no hay ruta para cancelar una solicitud (POST solo permite `create` o `satisfy`).
- **INTERPRETACIÓN**: la demanda insatisfecha en producción es acumulativa y pegajosa: una solicitud registrada que nunca se satisface queda como `registered` indefinidamente, contando como insatisfecha. No hay mecanismo de limpieza automática.
- **HIPÓTESIS**: sin un limpiador de solicitudes antiguas, la demanda insatisfecha crece con el tiempo y distorsiona la señal de presión (presión = insatisfecha/efectiva).
- **RECOMENDACIÓN**: (1) implementar `expireStaleRequests` como cron o al inicio de `computeSignals`; (2) permitir que el asker cancele su solicitud vía API; (3) agregar cooldown mínimo entre solicitudes de la misma capacidad por usuario.

---

## 6. Significado real de oferta (§7)

### Oferta declarada vs efectiva (producción)

```
Oferta declarada = COUNT(UserCapacity) por capacidad
Oferta efectiva  = Σ (UserCapacity.disponibilidad × UserCapacity.calidad × LEVEL_FACTOR[User.cuAccessLevel])
```

Donde `LEVEL_FACTOR = { basico: 0.2, medio: 0.5, avanzado: 1.0 }` (capacity.ts:29).

- `disponibilidad` y `calidad` son auto‑declaradas (0..1); el campo `verified` existe en el schema pero **nunca se actualiza** (no hay flujo de verificación).
- `ofertaEfectiva` se usa en `computeSignals()` (line 85) para calcular `presion` y en el dashboard para el ranking de capacidades.

### Oferta efectiva (motor de simulación)

```
Oferta efectiva = Σ (o.disponibilidad × o.calidad × max(0.2, nivelAcceso)) × supplyScale
```

Donde `nivelAcceso` es 0, 1 o 2 (número). `max(0.2, nivelAcceso)` → básicos = 0.2, medios = 1.0, avanzados = 2.0 (engine.ts:376).

**Divergencia**: engine vs producción multiplican diferente al nivel avanzado (2× vs 1×). Si el engine se usa para calibrar o predecir, los resultados no reflejan el comportamiento del producto.

**Hallazgo: oferta sin verificación**
- **OBSERVADO**: `UserCapacity.verified` es un booleano, default false. No se escribe en ningún sitio de producción. `computeSignals()` lo ignora; `satisfyCapacityRequest()` no lo verifica. La única restricción para satisfacer es haber declarado la capacidad (`requests.ts:36`).
- **INTERPRETACIÓN**: la oferta es puramente auto‑declarada. Un usuario puede declarar cualquier capacidad con disponibilidad/calidad máximas sin verificación.
- **HIPÓTESIS**: el sistema asume buena fe. En comunidades pequeñas puede funcionar; a escala se vuelve un vector de manipulación de la señal.
- **RECOMENDACIÓN**: (1) documentar explícitamente que la oferta es auto‑declarada y su efecto en la señal; (2) opcionalmente agregar verificación peer-to-peer o por moderador para subir el LEVEL_FACTOR del proveedor verificado.

---

## 7. Pruebas conceptuales §8–§15

Los tests se ejecutaron con `scripts/capacity/audit-tests.ts` (seed=12345, 100 agentes, 20 ciclos). Resultados en `evidence/capacidad/auditoria/audit-tests.json`.

### §8 Prueba fundamental: escasez

| Métrica | Resultado |
|---------|-----------|
| Demanda total | 198 |
| Demanda satisfecha | 162 |
| Demanda insatisfecha | 36 |
| Presión | **4.02** (= 36/8.97) |
| Carga humana | 8.59 |
| % Satisfecha | 81.82% |
| CU creadas | 1.870 |
| CU transferidas | 143 |
| CU destruidas | 0 |
| Acceso básico | 0 |
| Acceso medio | 92 |
| Acceso avanzado | 8 |

La automatización (15%) satisface 121/198 solicitudes (61% a través del tiempo vía acumulación). La capacidad humana efectiva ≈ 9 U/ciclo solo alcanza para 41 solicitudes humanas en 20 ciclos. La señal de presión (4.02) refleja claramente escasez.

### §9 Segunda prueba: abundancia

| Métrica | Resultado |
|---------|-----------|
| Presión | **0** |
| Carga humana | 0.41 |
| % Satisfecha | 100% |
| Oferta efectiva | 385.29 |

La señal de escasez se anula. La presión baja de 4.02 → 0. **El sistema detecta correctamente DEMANDA ↔ OFERTA**.

### §10 Tercera prueba: demanda cero

| Métrica | Resultado |
|---------|-----------|
| Presión | **0** |
| Carga humana | 0 |
| % Satisfecha | 0% (no hay demanda) |

Señal ≈ nula. **Mide escasez real, no actividad.**

### §11 Prueba de automatización

Comparación ANTES (auto 15%) / DESPUÉS (auto 80%), capacidad humana constante (~20 U):

| Métrica | ANTES (15%) | DESPUÉS (80%) | Cambio |
|---------|:-----------:|:--------------:|:------:|
| Demanda satisfecha | 189 | 197 | +4% |
| Humana satisfecha | **157** | **39** | **−75%** |
| Automatizada | 32 | 158 | +393% |
| Carga humana | 2.62 | 0.65 | **−75%** |
| Presión | 0 | 0 | (ambas satisfechas) |
| CU transferidas | 312 | 78 | **−75%** |
| Gini CU | 0.81 | 0.62 | −24% |

La automatización reduce la carga humana en un 75% y las transferencias de CU en un 75%. **La hipótesis central de Post Singularidad se verifica**: la tecnología alivia presión sobre capacidad humana. La presión no cambia porque toda la demanda se satisface en ambos casos; el indicador relevante es `cargaHumana`, no `presion`.

### §12 Prueba de capital real

Misma demanda/oferta, patrimonio 1 / 100 / 1.000 / 20.000 USD:

| Patrimonio | %Sat | Presión | Humana sat. | CU circulante | Acceso (B/M/A) |
|:----------:|:----:|:-------:|:-----------:|:-------------:|:--------------:|
| $1 | 79.17% | 4.46 | 32 | 1.740 | 0/90/10 |
| $100 | 79.17% | 4.46 | 32 | 1.740 | 0/90/10 |
| $1.000 | 80.81% | 4.24 | 39 | 1.938 | 0/92/8 |
| $20.000 | 81.82% | 4.02 | 41 | 1.977 | 0/92/8 |

**Hallazgo**: patrimonio tiene efecto marginal (79% → 82%, 32 → 41 humanas satisfechas). Las CU nominales son idénticas en todos los escenarios (cuInit=5 uniforme). **Tener más CU no crea patrimonio real**: las CU y el patrimonio son variables independientes por construcción. El efecto del patrimonio es real pero pequeño porque el gate R8 (presupuesto distribuible por agente) se reinicia cada ciclo, permitiendo al menos 1 solicitud satisfecha por agente incluso con patrimonio $1.

**INTERPRETACIÓN del gate R8**: `distributablePerAgent = wealth × distributableRate / cycles`. Con wealth=1, distributable/ciclo = 0.01; sin embargo el gate se evalúa *antes* de sumar `resourcesUsed`, así que la primera solicitud de cada ciclo siempre pasa. Resultado: el patrimonio $1 no bloquea por completo la absorción; solo limita la segunda solicitud en el mismo ciclo.

### §13 Prueba de usuario sin capacidad

50% sin capacidades, 20% inactivos:

| Métrica | Resultado |
|---------|-----------|
| Acceso básico | 50 (forzado nivel 0) |
| Acceso medio | 46 |
| Acceso avanzado | 4 |
| % Satisfecha | 89.58% |

- **¿Puede obtener acceso básico?** Sí, está garantizado por `sinCapacidades` → nivel 0 (engine.ts:528-529), y por el piso R5 (basicFloor=0.34).
- **¿Puede ascender?** No. En el engine, `sinCap` fuerza `nivelAcceso=0` cada ciclo (line 528-529), anulando cualquier upgrade. En producción, `refreshAccessLevel` no tiene restricción `sinCap` explícita, pero un usuario sin capacidades difícilmente satisface a otros (nivel avanzado requiere ≥1 satisfacción como proveedor). Podría llegar a "medio" solicitando (requestsCreated≥1 → `asAsker>=1` → medio, capacity.ts:139).
- **¿Queda excluido?** No. Piso garantizado + puede recibir servicios. En producción puede llegar a "medio" solicitando; en el engine no puede ascender por la restricción `sinCap`.
- **¿CU necesarias?** La apuesta mínima es 0 (puede crear solicitud sin apostar CU). Con cuInit=5, puede apostar hasta 5 CU por solicitud.

### §14 Prueba de CU como dinero

sinCap=0, cuCap=0 (sin tope), alta demanda, concentración:

| Métrica | Resultado |
|---------|-----------|
| Gini CU | 0.72 |
| Top 10% CU | 73.0% |
| CU transferidas | 143 |
| CU destruidas | 0 |

**Hallazgo**: las CU se concentran en los proveedores (reciben apuestas de askers). Con cuCap=0, el Gini sube a 0.72–0.81. Las CU se comportan como **ahorro/reputación**, no como dinero. No hay mercado interno en el engine; en producción, el legacy marketplace (`posts/[id]/offer.ts`) sí permite intercambio CU por servicio, lo que acerca las CU al comportamiento de moneda.

**Prueba específica §14 (simulada en engine):**
- El acumulador más grande es el agente que más satisface solicitudes (proveedor frecuente).
- Sin cuCap, el acumulador puede llegar a >100 CU (cuInit=5, recibe apuestas de 1-3 CU cada satisfacción).
- Las CU no se pueden canjear por bienes (no hay tienda en el engine); en producción, solo vía legacy posts.
- Las CU **no** se comportan como dividendo, patrimonio financiero, ni derecho de propiedad.

### §15 Prueba de CU como señal

Comparación de 3 capacidades:

| Escenario | Demanda | Oferta efectiva | Presión | Carga humana |
|-----------|:-------:|:---------------:|:-------:|:------------:|
| A (escasez) | 198 | 8.97 | **4.02** | 8.59 |
| B (abundancia) | 189 | 385.29 | **0** | 0.20 |
| C (demanda baja) | 23 | 8.97 | **0** | 2.57 |

**Hallazgo**: el escenario C revela una limitación conocida: con demanda baja (23) que toda se satisface, la presión es 0 independientemente de la carga humana (2.57). **La presión solo mide insatisfacción, no utilización**. Cuando todo se satisface, la señal se apaga aunque la carga sobre los proveedores sea real. Por eso el informe RONDA C propuso `cargaHumana` como indicador complementario.

---

## 8. Comportamientos inesperados

1. **CU como medio de pago en el legacy marketplace**: `posts/[id]/offer.ts:89` ejecuta `transferCu(post.authorId, post.fulfillUserId, post.cuOffer, "Pago por solicitud ...")`. Esto es CU como moneda de intercambio (pago por servicio). **Contradice directamente "CU no es dinero"** (Lee.txt). Es funcionalidad heredada que sigue activa.

2. **Grant anclado al PID**: `register.ts:83` llama `getNewUserGrant()` que depende de `metrics.error` (cu.ts:476). El grant fluctúa con el error de control: en escasez (error alto positivo), el grant baja; en abundancia (error negativo), sube. Hoy `grantCap=30` enmascara esto (el grant casi siempre es 30), pero es una dependencia oculta del PID en la emisión real.

3. **Nivel basado en saldo**: `refreshAccessLevel()` (capacity.ts:139) da nivel "medio" a quien tenga `balance > 0`. Un usuario recién registrado con grant de 20 CU ya tiene `balance=20 > 0` → nivel medio. **CU desbloquea acceso nivel medio automáticamente**, contradiciendo "nunca CU = acceso" (Lee.txt §11).

4. **Nivel sin decaimiento**: `refreshAccessLevel()` solo se llama al crear/satisfacer. Un proveedor avanzado que deje de participar nunca desciende. El nivel es permanente una vez alcanzado.

5. **Solicitudes que nunca expiran en producción**: `expireStaleRequests()` existe pero nadie la llama. Una solicitud creada y nunca satisfecha queda `registered` indefinidamente, inflando la demanda insatisfecha para siempre.

6. **Texto del milestone contradice el modelo**: cu.ts:326: *"Llegaste al saldo que el modelo marcó como meta"*. Esto implica que CU tiene un "objetivo" (como dinero), contradiciendo la conceptualización.

7. **Divergencia engine vs producto en factores de nivel**: engine usa `max(0.2, nivelAcceso)` (avanzado = 2×); producto usa `LEVEL_FACTOR = { avanzado: 1.0 }`. Los resultados del engine sobreproestiman la oferta de avanzados vs el producto real.

---

## 9. Riesgos

| # | Hallazgo | OBS | HIP | REC |
|---|---------|-----|-----|-----|
| 1 | Grant depende de error PID | register.ts:83 → getNewUserGrant → getCuMetrics → error/setPoint | grantCap enmascara; si se retira, la emisión vuelve a fluctuar con PID | Reemplazar por monto fijo o documentar la dependencia |
| 2 | Legacy marketplace: CU = pago | posts/[id]/offer.ts:89 transferCu "Pago por solicitud" | CU se comporta como moneda en transacciones reales | Deshabilitar o renombrar como "experimento de trueque" |
| 3 | Sin cooldown de solicitudes | createCapacityRequest sin límite | Farming de solicitudes para inflar demanda / participar sin contribuir | Agregar cooldown + máximo de solicitudes concurrentes por usuario |
| 4 | Nivel medio por saldo > 0 | refreshAccessLevel capacity.ts:139 | Cualquier poseedor de CU (incluso solo el grant) accede a nivel medio | Eliminar `balance > 0` de la condición de nivel medio |
| 5 | Nivel no decae | refreshAccessLevel solo al crear/satisfacer | Proveedor avanzado inactivo retiene nivel indefinidamente | Agregar decaimiento temporal (ej. desciende tras 30 días sin actividad) |
| 6 | Solicitudes nunca expiran (prod) | expireStaleRequests sin caller | demanda insatisfecha crece infinitamente | Ejecutar expireStaleRequests como parte de computeSignals o cron |
| 7 | Oferta no verificada | UserCapacity.verified never set | Cualquiera puede inflar oferta efectiva declarando nivel alto | Documentar como asunción; opcionalmente implementar verificación |
| 8 | Factor de nivel: engine ≠ producto | engine: avanzado 2×; producto: 1× | Engine sobreestima oferta de avanzados | Reconciliar o documentar como aproximación del engine |
| 9 | Demanda cancelada es fantasma | status existe, computeSignals lo excluye, nadie lo escribe | No hay forma de reducir demanda insatisfecha | Permitir que el asker cancele su solicitud |

---

## 10. Contradicciones

1. **"Emisión = grants" vs statbar "7 CU de expansión"**: el encabezado de la pizarra dice que la emisión es grants; la barra muestra 7 CU que vienen del cálculo PID+SupplyPolicy (no grants). El lector confunde una decisión teórica con una emisión real.

2. **pidGoverning = false pero grant depende del PID**: el flag dice que el PID no gobierna, pero la emisión real (grant) depende de `metrics.error` del PID.

3. **Distribuible no restringe**: el dashboard muestra `patrimonioUsd`, `distributableRate`, `distributablePerPeriod`, pero en producción `createCapacityRequest()` **no verifica** si el asker tiene presupuesto distribuible. El patrimonio es puramente informativo; no bloquea solicitudes. Solo en el engine (R8) hay gate real de presupuesto, y es débil (permite 1 solicitud/ciclo con wealth=$1).

4. **"CU no es dinero" + legacy marketplace**: el sistema permite CU como pago por servicio (posts offer) contradiciendo la conceptualización.

5. **%Sat engañoso**: en RONDA C (presión = insatisfecha/efectiva) y en el engine, cuando toda la demanda se satisface (incluyendo automatización), la presión = 0 aunque la carga humana sea alta. El %Satisfecha no captura saturación de capacidad humana.

---

## 11. Variables sin definición operacional

| Variable | Ubicación | Estado |
|----------|-----------|--------|
| `UserCapacity.verified` | schema Prisma | Existe, default false, nunca se escribe |
| `CapacityRequest.status = 'cancelled'` | schema Prisma | Permitido, computeSignals lo excluye, nadie lo genera |
| `expireStaleRequests()` | capacity.ts:189 | Definido, nunca se ejecuta |
| `consumeCu()` | cu.ts:385 | Definido, nunca se ejecuta |
| `distributablePerPeriod` | capacity.ts:204 | Se calcula, se muestra, no se usa para restringir |
| `resourcesUsed` (engine) | engine.ts:56 | Se reinicia por ciclo; en prod no tiene equivalente |
| Cuota básica R5 | engine.ts:475-483 | Existe en engine; en prod no hay algoritmo de asignación |
| Matching / asignación automática | — | No existe en producción; el proveedor elige manualmente |
| Decaimiento de nivel | — | No implementado |

---

## 12. Recomendaciones

1. **Aislar el grant del PID**: en `register.ts`, reemplazar `getNewUserGrant()` por `config.grantCap` directo (ya es el tope real). Eliminar `getNewUserGrant` o restringirlo al laboratorio.
2. **Deshabilitar legacy marketplace CU**: retirar `cuOffer` de posts o documentar explícitamente como "experimento de trueque interno".
3. **Cooldown de solicitudes**: agregar intervalo mínimo (ej. 24h) entre solicitudes de la misma capacidad por usuario y límite de concurrentes.
4. **Eliminar balance>0 del nivel medio**: `refreshAccessLevel` solo debe depender de actividad (`asProvider >= 1` → avanzado; `asAsker >= 1` → medio; resto → básico).
5. **Decaimiento de nivel**: agregar decaimiento tras 30 días sin actividad (satisfacer o solicitar).
6. **Expirar solicitudes antiguas**: ejecutar `expireStaleRequests(14)` como parte de `computeSignals()` o como cron semanal.
7. **Permitir cancelación**: agregar `action: 'cancel'` al POST de `/api/cu/requests` para que el asker cancele solicitudes registradas.
8. **Documentar oferta auto‑declarada**: en la UI, indicar que `disponibilidad` y `calidad` no están verificadas.
9. **Reconciliar factor de nivel**: unificar `LEVEL_FACTOR` (producto) con el factor del engine, o documentar explícitamente la diferencia.
10. **Renombrar stat PID**: "Señal → Emisión/Quema" → "Señal PID → Decisión teórica (no ejecutada)".

---

## 13. Qué NO debería modificarse todavía

| Componente | Razón |
|-----------|-------|
| Fórmula de presión (`insatisfecha/efectiva`) | Funciona correctamente para escasez; complementar con cargaHumana, no reemplazar |
| `computeSignals()` (capacity.ts) | Fuente de verdad de RONDA C; no tocar hasta tener allocator automático |
| `grantCap` (CuConfig) | Anti-farming; good |
| Schema Capacity / CapacityRequest / UserCapacity | Ya desplegado con `db push`; estable |
| `patrimonyUsd`, `distributableRate`, `grantCap` en CuConfig | Informativo y utilizable en el futuro |
| Motor de simulación (engine.ts) | Laboratorio separado; no afecta producción |

---

## 14. Preguntas abiertas

1. **¿Quién decide qué solicitud satisface quién?** Hoy es manual. Si se agrega matching automático, ¿cómo se usa `cuCommitted` para priorizar dentro del nivel?
2. **¿Cómo se materializan "recursos distribuibles" en la vida real?** `patrimonyUsd` es un número en DB; ningún código lo usa para restringir. ¿Se conectará a presupuesto comunitario real?
3. **¿Qué hace un usuario avanzado que no satisface más?** Hoy permanece avanzado para siempre. ¿Debería decaer?
4. **¿Permitiremos CU como medio de intercambio en el futuro?** Si sí, hay que definir reglas (tope, trazabilidad, anti-acaparamiento). Si no, deshabilitar `cuOffer` en posts.
5. **¿Qué implica "verified" de ofertas?** Peer-to-peer, por moderador, o automático (por historial de satisfacciones). ¿Cuál es la balance complejidad/escalabilidad?
6. **¿Cuándo se retira el panel PID de la pizarra?** ¿Se conserva solo en `/ensayo-de-stress` y se elimina de la vista principal del admin?

---

## 15. Archivos auditados

| Archivo | Relevancia |
|---------|-----------|
| `src/lib/cu.ts` | PID, sensor, política, grant, getCuMetrics, issueCu/transferCu/consumeCu |
| `src/lib/capacity.ts` | RONDA C: computeSignals, create/satisfy requests, refreshAccessLevel |
| `src/pages/api/auth/register.ts` | Grant de bienvenida (dependencia PID residual) |
| `src/pages/api/cu/capacities.ts` | API señales + declarar oferta |
| `src/pages/api/cu/requests.ts` | API crear/satisfacer solicitudes (sin cancelar) |
| `src/pages/api/cu/metrics.ts` | Extensión con bloque señalizacion |
| `src/pages/api/posts/[id]/offer.ts` | Legacy marketplace CU pago |
| `app/admin/page.tsx` | Dashboard PID legacy + panel RONDA C |
| `scripts/capacity/engine.ts` | Motor de simulación RONDA C |
| `scripts/capacity/audit-tests.ts` | Tests conceptuales §8–§15 (este auditoría) |
| `prisma/schema.prisma` | Models: Capacity, UserCapacity, CapacityRequest, CuConfig |

---

## 16. Método de auditoría

1. Revisión de código fuente (grep + lectura de archivos relevantes).
2. Trazado de dependencias: todas las rutas de `issueCu`, `transferCu`, `consumeCu`, `evaluateSupplyPolicy`, `PidController`, `computeNewUserGrant`.
3. Análisis estático de las rutas HTTP (`/api/cu/*`, `/api/auth/register`, `/api/posts/[id]/offer`).
4. Ejecución de pruebas conceptuales reproducibles (`audit-tests.ts`, seed=12345).
5. Comparación engine vs producción (factor de nivel, R8 gate, matching).
6. Verificación en producción: health check, endpoints auth/anónimo.

**Nota**: el mojibake visible en consola (`Señal`, `Presión`) es solo un problema de encoding de PowerShell; los archivos y la base de datos almacenan UTF-8 correcto. La verificación se hizo vía `grep` en los archivos fuente.

---

*Documento generado el 2026‑09‑12 como parte de la auditoría RONDA C. Los resultados de las pruebas conceptuales están en `evidence/capacidad/auditoria/audit-tests.json`.*
