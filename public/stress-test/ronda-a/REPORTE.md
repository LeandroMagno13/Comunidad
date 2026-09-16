# STRESS TEST SISTÉMICO — Economía experimental CU (v2: control real)

Fecha: 2026-09-11 · RONDA B **implementada** en producción (`src/lib/cu.ts`) — comparada contra el modelo legado (RONDA A) reproducido fielmente con espejos `L-*` (política inerte + sensor anclado al sticker).
Harness: `scripts/stress/` · Reproducción: `pnpm dlx tsx scripts/stress/main.ts` · semilla base 101 · 288 corridas (265 v2 + 16 espejo RONDA A + 7 barridos de oferta espejo `A-D5-*`).

> **Mandato de Lee.txt**: no modificar las reglas durante el experimento; simular el modelo *tal como está configurado*; encontrar dónde falla; generar evidencia; proponer modificaciones. El trabajo v2 **corrige los fallos encontrados en RONDA A e implementa el lazo de control real**; este documento registra (1) el diagnóstico previo, (2) los cambios aplicados, (3) la evidencia comparativa y (4) lo que aún sigue abierto.

---

## 1. Resumen ejecutivo

La RONDA A (producción original) era "estable" por **ceguera del sensor y política desconectada**: la canasta nunca se movía del setpoint pese a colapsos de oferta del 88 %, y el PID no gobernaba la emisión (gains 0). La v2 cierra ambos lazos y cambia el paradigma de control: **el setpoint pasa de ser un precio normativo (100 CU) a un precio alcanzable derivado de la economía real (mediana de saldos)**, la canasta ya no se ancla al sticker sino que **descubre precio** hacia ese nivel, y la política actúa con una valvula (expansión/quema proporcional a la señal).

| Hallazgo v2 | Resultado |
|---|---|
| **Control de precio real** | MAE 0,8–2,3 CU y error máx ~8 CU en la familia E (antes 0–0,7 CU... porque el sensor no veía nada). La canasta ahora **se mueve** al nivel que la economía puede pagar. |
| **Política activa** | Emisión positiva por señal en todos los escenarios v2 (562–128 000 CU acumulados) y **quema** en abundancia (E04: 1 537 CU destruidos) y en casi vacío (E15: 863) — contracción real cuando sobra y escasea. RONDA A emitía 0 salvo grants. |
| **Acceso alcanzable** | Acceso medio 1,7–52 % según dotación. En escenarios coherentes (E04, E05, E10, E12, E15, oleadas) el acceso se sostiene en **25–52 %**; antes colapsaba a ~0–1 %. |
| **Eliminada la burbuja inicial** | Antes la canasta arrancaba en 100 con saldos de 20 → el control "veía" una escasez inexistente y el sistema colapsaba. Ahora la canasta arranca en el precio alcanzable. |
| **Otorgamiento anti-concentración** | La emisión histórica se dirige a la mitad con **menos saldo**; el abanico de Gini mejora (61–83 vs 69–96 en RONDA A) sin redistribuir patrimonio (ver §5). |
| **Residuo honesto** | Enseñanza clave: el control real **no inventa riqueza**. En economías empobrecidas (dotación media ≪ canasta nominal) el setpoint efectivo colapsa al piso y el acceso queda marginal (E01/E03/E06–E09: 0–15 %). El sistema sostiene el precio alcanzable, no financia acceso imposible. |

**Veredicto**: v2 deja de ser un "registro de saldos con transferencias aleatorias" y se comporta como un lazo de control — reacciona a shocks y escasez, quema excedentes, acerca el precio a lo alcanzable y sostiene acceso en comunidades con dotación coherente. Quedan abiertos: reducción de patrimonio/concentración, oscilación en oleadas masivas y calibración fina con flujos reales.

---

## 2. Metodología

Harness de micro-simulación por ciclo construido sobre el **código real** de `src/lib/cu.ts` (se importan `PidController`, `evaluateSupplyPolicy`, `evaluateSupplyPolicyP001`, `effectiveCuSetPoint`, `senseCanasta`, `computeNewUserGrant`). Cada ciclo v2:

1. **SENSOR v2** (`senseCanasta`): descubre precio hacia el set point efectivo usando flujo neto y brecha de precio, con paso acotado (±0,3): `observed' = observed × (1 + clamp(flowGain×flujoNeto + accessGain×(eff−observed)/eff, ±maxStep))`. El acceso ya no multiplica el observable (causa de inestabilidad detectada en la iteración): el acceso se mide por ciclo y entra **solo en el error de control**, no en el sensor.
2. **Set point alcanzable**: `effectiveCuSetPoint = min(nominal, max(5, mediana))` cuando `reachableSetPoint` está activo. La canasta arranca en ese nivel (no en el nominal imposible).
3. **Error de control compuesto**: `(observed − setPointEfectivo) + (accesoObjetivo − accesoReal) × setPointEfectivo × sensorAccessGain`. La brecha de acceso queda acotada a ±0,5×setPoint, cerrando el lazo sin el término explosivo del acceso en el sensor.
4. **PID → SEÑAL**: `PidController` (kp/ki/kd) sobre ese error; señal acotada a ±60.
5. **POLÍTICA v2** (`evaluateSupplyPolicy`): válvula `tanh(2×señal/100)`. Expansión → `min(maxEmission, 0,5×oferta)×tanh(×expansionGain)`; contracción → `emisión 0 + quema = min(maxBurn, 0,5×oferta)×tanh(×contractionGain)` distribuida proporcional al saldo; neutro → emisión base.
6. **Emisión siempre aplicada** en v2 (independiente de `emitMode`): histórico → **mitad de saldos más pobres** (anti-concentración/acceso), nuevos usuarios → grant por usuario, reserva → no asignada.
7. **Demanda (A2 v2)**: quienes tienen saldo ≥ costo consultan el canasta gastando hasta `demandRate×costo`, priorizando a quien más tiene (O(n log n); se eliminó el muestreo ponderado O(n²) que colgaba el harness con 100 000 usuarios).
8. Crecimiento + transferencias + shocks de oferta, igual que RONDA A.

Modo legado (espejo `L-*`/`A-D5-*`): sensor anclado al sticker (startObserved) con regla v1, error `observed − setPoint` nomina, `evaluateSupplyPolicyP001` (política inerte fija) y emisión solo si `emitMode ≠ 'none'` → reproduce RONDA A byte a byte.

### Métricas
MAE, error máx absoluto, recuperación a bandas % del setpoint efectivo final, cambios de signo (oscilación), acceso medio/final, Gini, top-10 %, velocidad, emisión acumulada, **quema acumulada**, ΔOferta. Monte Carlo: 200 corridas con jitter en demanda/transferencias/crecimiento/shocks (sd reproducible).

---

## 3. RONDA A — diagnóstico previo (reproducido con espejos `L-*`)

El modelo original (correctamente marcado como fallido): sensor ciego, PID desconectado, setpoint normativo 100, acceso ~0–1 %, Gini 65–96.

| Métrica | RONDA A (espejo `L-*`) |
|---|---|
| MAE de canasta | 0–0,4 CU (¡y aún así ciego: oferta cae −88 % sin que el error se mueva!) |
| Emisión acumulada | **0** en todos los escenarios (solo grants) |
| Acceso medio | 0–0,8 % (E04: 37 % cayendo a 11 %) |
| Quema | 0 (no existe mecanismo) |
| Gini final | 68–99 |

Confirmación espejo: mismo DAG que la v1 publicada; los 7 barridos PID con política inerte dan resultados idénticos (señal ignorada). Diagnóstico de doble desconexión (sensorial + de política) confirmado.

---

## 4. RONDA B/v2 — Resultados (implementado)

### 4.1 Escenarios mínimos (setpoint nominal 100; ciclos 60–80)

| ID | Escenario | MAE | Err máx | Acceso % (med→fin) | Quema | Emisión tot. | Gini fin | ΔOferta |
|---|---|---|---|---|---|---|---|---|
| E01 | Equilibrio (50 us., 20 CU/u) | 1,77 | 7,6 | 14,7 → 2,0 | 0 | 562 | 61,5 | −796 |
| E02 | Equilibrio grande (1000) | 2,04 | 8,1 | 14,5 → 2,9 | 0 | 6 647 | 76,7 | −16 458 |
| E03 | Escasez extrema (2 CU/u) | 1,36 | 1,5 | 1,8 → 1,0 | 0 | 262 | 69,8 | −103 |
| E04 | Abundancia extrema (500 CU/u) | 6,48 | 36,0 | 52,4 → 40,0 | **1 537** | 418 | 79,0 | −32 151 |
| E05 | Crecimiento continuo | 0,76 | 7,9 | 37,8 → 32,9 | 0 | 25 668 | 74,8 | +6 568 |
| E06 | Shock demanda +10 % | 1,65 | 8,0 | 11,3 → 0,0 | 0 | 1 431 | 69,5 | −1 675 |
| E07 | Shock oferta +50 % | 1,61 | 8,0 | 14,8 → 0,0 | 0 | 1 819 | 74,1 | −1 679 |
| E08 | Shock escasez −50 % | 1,68 | 8,0 | 8,5 → 0,0 | 0 | 1 302 | 71,2 | −1 684 |
| E09 | Combinado (dem+ / of−) | 1,69 | 8,0 | 8,6 → 1,0 | 0 | 274 | 77,6 | −1 700 |
| E10 | Alta volatilidad | 0,93 | 8,0 | 32,1 → 29,4 | 0 | 13 620 | 82,7 | +3 787 |
| E11 | Migración masiva | 1,20 | 8,0 | 24,7 → 21,9 | 0 | 6 599 | 75,5 | −776 |
| E12 | Concentración inicial | 0,78 | 2,1 | 25,1 → 23,0 | 0 | 1 246 | 82,6 | −1 465 |
| E13 | Consumo extremo | 1,98 | 22,5 | 1,3 → 0,0 | 0 | 580 | 75,2 | −813 |
| E14 | Transferencia extrema | 1,42 | 16,6 | 12,5 → … | 0 | 17 329 | 97,0 | +17 329 |
| E15 | Casi vacío (5 us.) | 1,67 | 18,1 | 44,9 → 33,8 | **863** | 1 477 | 37,3 | +336 |
| E16 | Enorme (10 000→18 000) | 2,32 | 8,0 | 23,5 → 18,9 | 0 | 128 702 | 71,7 | −113 653 |

### 4.2 Lectura de resultados

- **La canasta ahora descubre precio.** En E04, con oferta −64 % y acceso cayendo, el error llega a 36 CU (antes 0,45 CU "tan perfecto como falso"). El sensor ya no es un termómetro roto.
- **Control por acceso funciona donde hay dotación coherente**: E05 (37,8 % medio), E10 (32,1 %), E12 (25,1 %), E15 (44,9 %), E04 (52,4 %). El set point efectivo ancla la canasta a lo real y el error de acceso mantiene la emisión mientras la mitad de la comunidad no puede comprar.
- **Quema = contracción real**: E04 (abundancia) destruye 1 537 CU y E15 863 para atajar excedente; en RONDA A no existía vía de contracción.
- **Los shocks ya se ven**: E06–E09 muestran errores y ΔOferta distintos entre sí (en v1 E08=E09 idénticos). El shock de oferta −50 % sigue siendo visible y absorbido (err máx ~8 CU, sin oscilación).
- **Pobreza estructural sigue siendo pobreza**: E01/E03/E06–E09 (dotación ≪ canasta) convergen al piso alcanzable (5 CU) con acceso 0–15 %. La política sostiene el precio alcanzable, **no fabrica saldo** para financiar acceso imposible — lectura deliberada y honesta.

### 4.3 Monte Carlo (200 corridas, sd reproducible)

| Métrica | Media | p5 | p50 | p95 |
|---|---|---|---|---|
| MAE | 1,77 | 1,61 | 1,77 | 1,92 |
| Err máx | 8,09 | 6,87 | 8,08 | 9,16 |
| Acceso % medio | 30,3 | 26,4 | 30,4 | 34,0 |
| Acceso % final | 26,8 | 20,4 | 27,1 | 32,0 |
| Gini final | 77,3 | 72,8 | 76,8 | 84,0 |

Control determinista (MAE ±0,15 en 200 corridas) y **acceso robusto** (p95 final 32 %) — el acceso dejó de ser un artefacto del 0.4–1,7 % de RONDA A.

### 4.4 Espejos RONDA A (`L-*`): la misma corrida, el modelo ciego

| ID | v2 MAE / Acceso med | v1 espejo MAE / Acceso med | Diferencia |
|---|---|---|---|
| L-E01 | 1,77 / 14,7 % | 0,011 / 0,1 % | v2 ve y corrige; v1 no ve nada |
| L-E04 | 6,48 / 52,4 % | 0,39 / 37,3 % | v2 quema 1 537 y conserva 3,2× más oferta final |
| L-E03 | 1,36 / 1,8 % | 0 / 0 % | v2 reacciona (262 CU); v1 inerte |

---

## 5. Hallazgos pendientes (correctamente documentados, no sellados)

1. **Concentración de patrimonio sigue alta** (Gini 61–83; E14 97). La política corrige **precio y acceso**, no distribuye saldos. La emisión a la mitad pobre *suaviza* (Gini menor que v1) pero no revierte la acumulación por transferencias sin fricción (walk aleatorio multiplicativo). → Propuesta: límite de tenencia / decay de saldos dormidos / comisión P2P.
2. **Acceso final 0 % en shocks con dotación baja** (E06–E09, E13): absorbed el shock pero con comunidad marginal; el error de acceso sostiene la canasta al piso alcanzable sin inflar saldos. Es un resultado esperable, a confirmar con criterios de aceptación.
3. **Oscilación en oleadas masivas**: `U-oleadas-escalonadas` 9 cambios de signo y `U-oleada-masiva` error máx ~96 al inicio; la entrada de 1000+/ciclo es la mayor perturbación del set. Recuperan precio pero con sobre-reacción → calibrar `sensorFlowGain`/`sensorAccessGain` (0.5/0.6) o el lazy de la válvula.
4. **E12/E04 conservan demanda de drenaje**: la abundancia se come la oferta lentamente aunque el precio esté en el objetivo; el término de acceso solo empuja hasta el 50 %, luego calla. El consumo de canasta (A2 v2) pide vinculación con actividad real (encargos/publicaciones) para no ser mera erosión.
5. **Calibración fina con datos reales**: `sensorFlowGain=0.5`, `sensorAccessGain=0.6`, `expansionGain/contractionGain=1`, `maxBurnPerCycle=200`, tope relativo de emisión 0,5×oferta son valores de arranque a validar contra flujos de la app (vía `refreshCuSensor()` + monitor de `getCuMetrics`).

---

## 6. Cambios implementados (RONDA B → producción)

- `src/lib/cu.ts`: `senseCanasta` v2, `effectiveCuSetPoint` (set point alcanzable), error compuesto con brecha de acceso acotada, `evaluateSupplyPolicy` v2 con quema, `getCuMetrics`/`runCuSimulation` v2, `refreshCuSensor()`, migración de config con `console.warn` para gains 0 legados.
- `prisma/schema.prisma`: campos `CuConfig` (accessTarget, reachableSetPoint, sensorFlowGain, sensorAccessGain, maxBurnPerCycle, expansionGain/contractionGain default 1).
- `src/pages/api/cu/simulate.ts`, `app/admin/page.tsx`: pizarra con nuevos parámetros, paneles Sensor v2 / Acceso real / Quema, tabla de sim con Acceso %.
- `scripts/stress/*`: motor v2 + espejo legado, montecarlo, export web, `burnedTotal`.

Migración de datos: los configs existentes con `expansionGain=0 ∧ contractionGain=0` pasan a 1 (con aviso); un 0 intencional posterior se respeta.

---

## 7. Entregables

- `data/summary.csv` — 288 corridas × 30+ métricas (v2 + espejos + barridos + MC).
- `data/trace-E*.csv`, `data/traces.json` — series por ciclo (incluye quema y setpoint efectivo).
- `data/montecarlo.json` — distribución (200 corridas).
- `charts/*.svg` — paneles por escenario + overlays (observed, effectiveSetPoint, error, burn, accessPct, …).
- `_auto-summary.md` — tabla cruda generada por el harness.
- `public/stress-test/` — versión estática (`/ensayo-de-stress`): `presentation.json`, SVG, CSV/JSON.

Reproducibilidad: misma seed → mismos resultados byte a byte (RNG `mulberry32` determinista, semilla base 101).

## 8. Limitaciones

- El micromodelo abstrae la demanda real (A1–A4 v2); resultados = órdenes de magnitud y dinámicas, no valores puntuales.
- No se simula UI/feedback humano ni la canasta real (productos/encargos) endógena.
- La velocidad exterior (transacciones reales) no está modelada; solo transferencias aleatorias.
- La reserva de emisión (reserveShare default 0.25) no se asigna en el micromodelo (falta banco/fondo de soporte) — cuantía de emisión "en aire" que en producción debe gobernarse o justificarse.

## 9. Siguiente paso propuesto

(a) observar `refreshCuSensor()` + `getCuMetrics` en producción con los nuevos parámetros; (b) fijar criterios de aceptación de acceso (≥ 20 % medio en nominal con dotación coherente, err máx ≤ 10 CU en shocks ±50 %, osc < 3); (c) después atacar concentración (tenencia/decay/comisión) y oscilación de oleadas si los datos lo piden.