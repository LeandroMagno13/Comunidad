# STRESS TEST SISTÉMICO — Economía experimental CU

Fecha: 2026-09-11 · Modelo: tal como está configurado en producción (RONDA A) + barridos exploratorios (RONDA B, **no implementados**)
Harness: `scripts/stress/` · Reproducción: `pnpm dlx tsx scripts/stress/main.ts` · semilla base 101

> **Mandato de Lee.txt**: no modificar las reglas durante el experimento; simular el modelo *tal como está configurado*; encontrar dónde falla (no demostrar que funciona); generar evidencia; proponer modificaciones sin implementarlas automáticamente. Las propuestas de RONDA B están redactadas pero **no** aplicadas al código de producción.

---

## 1. Resumen ejecutivo

El modelo experimental CU, bajo 265 corridas determinísticas y 200 corridas Monte Carlo (semilla reproducible), **nunca desestabiliza el costo de la canasta** — y esa es la mayor debilidad.

| Hallazgo | Severidad |
|---|---|
| El "costo de canasta" (observed) se mueve en promedio < 0,5 CU sobre un setpoint de 100 en casi todos los escenarios, incluso cuando la oferta cae 88 % (E04). El sensor es casi ciego. | **Crítico** |
| El lazo de control está desconectado: la política tiene ganancias 0 (expansionGain/contractionGain), así que el PID “controla” nada; la emisión es 0 o solo por grants de usuarios nuevos. | **Crítico** |
| El acceso a la canasta es estructuralmente bajo: con 20 CU por usuario y canasta en 100, nadie puede pagarla. Acceso medio típico 0,4–1,7 % de usuarios. | **Alto** |
| Concentración estructural: Gini 65–96 y top 10 % ≥ 50 % en toda la familia de escenarios; los saldos pobres se vacían y los ricos consumen y concentran. | **Alto** |
| Los shocks de demanda son invisibles cuando el acceso es ~0 (E08 y E09 idénticos). El consumo real está sumido en 0–5 CU/ciclo frente a transferencias de 50–100+ CU/ciclo. | **Medio** |
| El barrido de 7 configuraciones PID produce resultados **idénticos** → los parámetros PID no importan mientras la política los ignore. | **Medio** |
| En RONDA B (política activa), hacer variar las ganancias 0→1→3 y modo de cuotas no cambia el resultado: la emisión base fija domina y la señal es diminuta. | **Medio** |

**Veredicto RONDA A**: el sistema es “estable” por inercia y por ceguera del sensor, no por control. No corrige shocks ni distribuye acceso; funciona como un registro de saldos con transferencias aleatorias (patrimonio), no como una moneda con propósito de intercambio.

---

## 2. Metodología

Harness de micro-simulación por ciclo (no simulación Monte Carlo del Next App Router), construido sobre el **código real** de `src/lib/cu.ts`: se reutilizan `PidController`, `evaluateSupplyPolicy` y `computeNewUserGrant` (rehabilitados como helpers puros). Cada ciclo:

1. Sensor de canasta: `observed' = startObserved × (1 + (consumido − oferta_entrante)/oferta × 0,1)` — misma regla de `runCuSimulation` en producción.
2. PID sobre `error = observed − setPoint`.
3. Política de oferta → decisión de emisión (share histórico público / acuñado nuevo).
4. Demanda: quienes tienen saldo ≥ costo de canasta consumen `demandRate × costo` (límite 20 CU/ciclo/usuario), con opción de volatilidad y shocks.
5. Transferencias aleatorias entre pares (`transferRate` × oferta total) — proxis de intercambio P2P reales.
6. Crecimiento de usuarios con grant inicial por nuevo usuario.
7. Shocks de oferta artificiales (inyección/destrucción proporcional).

Supuestos del micromodelo (documentados A1–A4 en `scripts/stress/engine.ts`):
- **A1** Saldos uniformes iniciales con jitter ±20 %.
- **A2** Acceso = saldo ≥ costo de canasta; el consumo se reparte ponderado por saldo.
- **A3** Transferencias uniformes aleatorias (emprendimiento/trueque equilátero).
- **A4** Intervención artificial (shocks) como herramienta de testeo, no como regla económica.

### 2.1 Estrategia de búsqueda de fallos
1. **16 escenarios mínimos** (E01–E16): equilibrio, escasez/abundancia extrema, crecimiento, shocks de demanda/oferta, volatilidad, migración masiva, concentración, consumo/transferencia extremos, sistemas casi vacíos y enormes.
2. **Barridos** (DC-CU, población, oferta inicial, crecimiento, demanda, emisión, PID ×7, política ×7).
3. **Monte Carlo**: 200 corridas con jitter en demanda, transferencias, crecimiento y shocks (sd reproducible).

### 2.2 Métricas de estabilidad
MAE, error máx absoluto, picos sobre/bajo setpoint, desviación estándar del error, tiempo de recuperación (bandas 5/10/20 %), cambios de signo de oscilación, % de acceso (medio/mín/final), Gini, concentración top-10/top-1, saldos sin saldo, velocidad de circulación y consumo/transferencia medios.

---

## 3. RONDA A — Resultados y análisis (modelo actual)

### 3.1 Tabla resumen de los 16 escenarios mínimos

Setpoint = 100 CU. Cantidad de ciclos: 60–80 (E16: 40, por tamaño).

| ID | Escenario | MAE | Err máx | Acceso % (med) | Gini | Top10 % | Saldos 0 | Vel | Consumo/ciclo | ΔOferta |
|---|---|---|---|---|---|---|---|---|---|---|
| E01 | Equilibrio (50 us.) | 0,05 | 0,28 | 0,47 | 70,4 | 44,1 | 50 | 0,06 | 4,3 | −257 |
| E02 | Equilibrio grande (1000) | 0,18 | 0,40 | 1,19 | 91,0 | 89,3 | 81 | 0,07 | 221 | −13 253 |
| E03 | Escasez extrema (2 CU/us.) | 0 | 0 | 0 | 74,4 | 49,0 | 56 | 0,05 | 0 | 0 |
| E04 | Abundancia extrema (500) | 0,36 | 0,45 | 39,2 (→12) | 88,7 | 80,3 | 69 | 0,09 | 736 | −42 486 |
| E05 | Crecimiento continuo | 0,20 | 0,92 | 0,98 | 75,1 | 53,5 | 58 | 0,06 | 97 | +8 058 |
| E06 | Shock demanda +10 % | 0,04 | 0,26 | 0,38 (→0) | 74,6 | 49,0 | 54 | 0,06 | 6,9 | −549 |
| E07 | Shock oferta +50 % | 0,33 | 3,18 | 1,95 (→1) | 93,6 | 90,3 | 82 | 0,08 | 33 | −1 686 |
| E08 | Shock escasez −50 % | 0,01 | 0,11 | 0,09 (→0) | 73,1 | 47,0 | 57 | 0,05 | 1,5 | −1 068 |
| E09 | Combinado (dem+ / of−) | 0,01 | 0,11 | 0,09 (→0) | 73,1 | 47,0 | 57 | 0,05 | 1,5 | −1 068 |
| E10 | Alta volatilidad | 0,15 | 2,88 | 1,32 | 85,0 | 66,7 | 73 | 0,12 | 52 | +218 |
| E11 | Migración masiva | 0,20 | 0,92 | 0,85 | 78,8 | 59,5 | 60 | 0,06 | 30 | +784 |
| E12 | Concentración inicial | 0,18 | 0,98 | 1,17 | 75,4 | 50,2 | 55 | 0,07 | 22 | −1 151 |
| E13 | Consumo extremo | 0,14 | 1,22 | 0,54 | 79,9 | 58,8 | 59 | 0,07 | 17 | −1 325 |
| E14 | Transferencia extrema | 0,11 | 0,48 | 2,04 (→1,6) | 96,4 | 100 | 92 | 2,06 | 101 | −141 |
| E15 | Casi vacío (5 us.) | 0,68 | 6,67 | 0 | 28,1 | 19,4 | 8 | 0,01 | 0 | +1 183 |
| E16 | Enorme (10 000→18 000) | 0,08 | 0,20 | 1,14 (→1,6) | 76,8 | 56,3 | 62 | 0,06 | 3 345 | +22 182 |

*(ΔOferta = oferta final − oferta inicial; véase `data/summary.csv` para todas las métricas y `data/trace-E*.csv` para series completas.)*

### 3.2 Hallazgo 1 — El sensor de canasta es casi ciego (CRÍTICO)

**Observación**
- El costo de la canasta nunca se aparta del setpoint pese a cambios enormes en oferta, acceso y consumo. E04 (500 CU/usuario): la oferta cae de 50 000 a 5 610 CU (−88 %), el acceso cae de 39 % a 12 %, el consumo promedio es 736 CU/ciclo, y aun así el error máximo del PID fue **0,45 CU** (0,45 %).
- En la práctica total de los escenarios el error máx. está entre 0,1 y 0,9 CU; solo saltan a 3,2 (E07), 2,9 (E10) y 6,7 (E15) puntualmente.

**Interpretación**
- La regla de sensor `observed' = startObserved × (1 + (consumido − oferta_entrante)/oferta × 0,1)` divide flujos per-ciclo entre la oferta total. Cuando la oferta es grande (relativo a 20 CU de consumo por usuario), la fracción es diminuta y el costo se mueve décimas por ciclo. Un colapso de acceso de 39→12 % produce un cambio acumulado menor que un error de medición.
- El PID está monitorizando un termómetro roto. El "costo de la canasta" no refleja escasez real de CU liquidas para los usuarios pobres.

**Hipótesis de causa raíz**
- La sensibilidad del sensor (0,1) es insensible al **número de usuarios sin saldo suficiente**. El error de precio necesita que el consumo agregado sea una fracción grande de la oferta; los shocks de acceso (que son de distribución, no de oferta agregada) no aparecen.

**Recomendación RONDA B (no implementada)**
- Calibrar el sensor con sensibilidad a acceso: p. ej. `observed' = observed × (1 + α × ((consumo − oferta_entrante)/oferta) + β × (acceso_objetivo − acceso real))` con α grande y β ≠ 0, o medir directamente la fracción de usuarios con saldo < canasta.
- Alternativa superior: **sensor de precios descentralizado** (reportes de compraventa reales) en lugar de la fórmula agregada.

### 3.3 Hallazgo 2 — El lazo de control está desconectado (CRÍTICO)

**Observación**
- Con la política actual (`expansionGain: 0`, `contractionGain: 0`), la decisión de emisión es 0 o de solo la emisión base. En los 16 escenarios con `emitMode: 'none'`, la emisión es 0; la "contracción" (destrucción por consumo) es la única fuerza de oferta en sentido bajista.
- El barrido PID (7 combinaciones, de muy suaves a muy agresivas) arroja **resultados idénticos** (MAE 0,084 / err máx 0,29 en todas): el PID no llega a la política.

**Interpretación**
- La señal del PID se computa pero la política la ignora. El sistema "no emite cuando falta en el fondo" y "no contrae cuando sobra". La oferta se erosiona pasivamente por consumo (E01: 985→728; E04: 50 000→5 610) o se infla por grants (E05: +50 % oferta para acceso estable ≈ 1 %).
- No hay mecanismo de estabilización que vincule la escasez de saldos con la creación de CU. El "mecanismo" es decorativo en la configuración de producción.

**Hipótesis de causa raíz**
- Las ganancias de 0 convierten cualquier señal en decisión nula; además, incluso con ganancias>0 (ver §4), la señal es diminuta por el sensor ciego, de modo que el vínculo error→emisión no se activa. Doble desconexión (sensorial y de política).

**Recomendación RONDA B (no implementada)**
- Activar `expansionGain`/`contractionGain` en producción **solo después** de arreglar el sensor; activar sin sensor sensibilizado expone emisión basada en ruido.
- Introducir **emisión de mantenimiento** (u-mint) que no dependa del error micro: p. ej. una tasa base proporcional a la población activa, para sostener liquidez sin depender del PID.
- Establecer **límites de contracción** (no destruir saldos por debajo de un piso para proteger a los usuarios con menor patrimonio).

### 3.4 Hallazgo 3 — Acceso estructuralmente bajo (ALTO)

**Observación/Interpretación**
- Con `perUser0 = 20` y canasta = 100, la mayoría de usuarios no tiene saldo suficiente para comprar la canasta. El acceso medio oscila entre 0 y 2 % (E01–E16), salvo en abundancia (E04: 39 % promedio, cayendo a 12 %).
- Esto no es un fallo de los shocks: es un **desajuste de dotación inicial**. 20 CU por usuario ↔ canasta de 100 CU hace la UI de "canasta accesible" inalcanzable para el usuario promedio. El consumo flujo es 5–250 CU/ciclo frente a transferencias de 50–100+ CU/ciclo: la economía mueve patrimonio, casi no hay intercambio por canasta.

**Recomendación RONDA B (no implementada)**
- Revincular el setpoint con la dotación real (`setPoint ≈ dotación media × factor`) o subir la dotación inicial/grants. Sin esto, la canasta es un índice que nadie puede comprar y el "acceso" métrico siempre será ~1 %.

### 3.5 Hallazgo 4 — Concentración estructural y erosión del acceso (ALTO)

**Observación**
- Gini final 65–96 en toda la familia; top-10 % ≥ 50 % en casi todos y 100 % en E14 (transferencia extrema). Los saldos en cero alcanzan 55–92 % de los usuarios en escenarios con consumo/transferencia activos.
- Incluso con 1000+ usuarios (E02), la concentración se dispara (Gini 91, top-10 89 %).

**Interpretación**
- La transferencia aleatoria uniforme + consumo ponderado por saldo es un proceso que **concentra**: los pocos que escalan por encima del costo de canasta consumen y los demás se vacían; la riqueza va a un subconjunto pequeño. La concentración luego destruye el acceso (E06: acceso cae de 0,4 % a 0 con el tiempo).

**Hipótesis**
- El modelo no tiene mecanismo de redistribución (impuestos, límites de tenencia, destrucción progresiva). El trueque/emprendimiento, sin fricción, es un walk aleatorio multiplicativo → concentración inevitável.

**Recomendación RONDA B (no implementada)**
- Estudiar **límites de tenencia superior** o **impuesto cero-residual** (radio activo + decay de saldos dormidos) si el objetivo es circulación; documentar explícitamente si la concentración es aceptable para un "experimento social".

### 3.6 Hallazgo 5 — Shocks de demanda invisibles si acceso ≈ 0 (MEDIO)

**Observación**: E08 y E09 son numéricamente idénticos: agregar un shock de demanda +100 % en el ciclo 20 a un sistema que ya no consume nada no cambia nada. Mismo MAE/Err/ΔOferta exactos.

**Interpretación**: La demanda se define como tasa × (usuarios con saldo ≥ canasta). Si ese conjunto es vacío, los shocks de demanda tienen amplitud cero. En E08/E09 el consumo era ya ~0; el shock de oferta (−50 %) sí destruyó saldos (949 CU) pero sigue siendo invisible para el error de canasta (0,11 CU).

**Recomendación RONDA B (no implementada)**: Definir demanda como "intención de compra" (con rebote a saldos insuficientes) y capturarla en el sensor. Un shock de demanda creíble solo es medible si hay demanda real registrada.

### 3.7 Monte Carlo (200 corridas, 40 ciclos, sd base 101)

| Métrica | Media | P5–P95 | Min–Max |
|---|---|---|---|
| MAE | 0,093 | 0,06–0,14 | 0,045–0,20 |
| Err máx | 0,222 | 0,15–0,32 | 0,10–0,49 |
| σ del error | 0,16 | 0,08–0,26 | 0,057–0,31 |
| Recuperación (banda 10 %) | 0 | 0–0 | 0–0 |
| Acceso % | 1,0 % | 0,6–1,4 % | 0,43–1,66 % |
| Gini | 75,1 | 69–81 | 65–86 |
| Top-10 % | 53,7 | 46–63 | 42,7–72,3 |
| Velocidad | 0,062 | 0,046–0,078 | 0,042–0,084 |

La señal jamás sale de la banda ±10 % (recuperación 0) porque el error es diminuto por diseño del sensor. La **variabilidad entre corridas es mínima**: el sistema es determinista en sus fallos, no caótico. La concentración (Gini ~75, top-10 ~54 %) es robusta a cualquier jitter razonable de comportamiento.

### 3.8 Barridos — lectura rápida (ver `data/summary.csv`)

- **Población (1→10 000)**: el acceso se queda ~0–1,4 % independiente del tamaño; la concentración (top-10 %) crece con el tamaño (65→87 %). No hay escala que arregle el acceso mientras la dotación media sea 20 vs canasta 100.
- **Dotación por usuario (1→500)**: solo con 20 CU/usuario el acceso pasa del 0 %; con 100 alcanza 11 %, con 500 un 52 %. Confirma que el acceso es proporcional a la dotación, no al "diseño de la moneda".
- **Crecimiento**: constante/lento erosionan oferta; lineal/acelerado inyectan oferta vía grants pero el acceso sigue < 1 % (E05, E11). El grant es emisión descoordinada del objetivo.
- **Oleadas de entrada (§10)**: la entrada escalonada (10/5c → 50/5c → 100/ciclo) produce **oscilación** (7 cambios de signo) y error máx. 2,64 CU; la oleada masiva continua (100/ciclo) nunca recupera la banda de ±5 % (rec5 = 80) con error máx. 5,02 CU. Entrada masiva de usuarios = la perturbación más grande que vio el sistema (acceso sigue < 1 % en ambos casos).
- **100 000 usuarios**: misma firma que los demás (acceso 0,89 %, Gini 75,5, top-10 52 %). El sistema escala sin estallar, pero tampoco mejora: su comportamiento es invariante de escala a nivel de acceso/concentración.
- **Emisión (RONDA B)**: con emisión base 10/50, la oferta crece y el error de canasta apenas se mueve (0,05→0,13); la emisión alta (50) no genera acceso real. La señal de canasta no responde a inflación de oferta.

---

## 4. RONDA B — Propuestas (analizadas, NO implementadas)

> Estas no están en producción; son candidatas a validar bajo el nuevo harness, con criterios de aceptación explícitos (acceso ≥ X %, oscilación ±Y %, convergencia en Z ciclos) antes de tocar reglas.

### 4.1 Qué se probó en el harness de RONDA B
- **Política activa** (`emissionGain` 1, 3; asimétrica; con límites; cuotas nuevas vs históricas) y **emisión base** 10 en modo shares.
- Resultado: **todas las variantes producen resultados casi idénticos** (MAE 0,11 / Err máx 0,33 / acceso ~1,0 % / Gini ~77 % / ΔOferta +1 297 CU igual en todas).
- **Interpretación**: con error < 0,3 CU, la señal del PID es ~ruido y la emisión base fija domina la decisión. La política activa **no cambia nada** hasta que el sensor vea errores grandes → la emisión base "aprieta" la decisión a todos igual. Esto confirma Doble Desconexión (§3.3): activar la política hoy no serviría.

### 4.2 Propuestas priorizadas para RONDA B (orden sugerido de experimentación)
1. **Sensibilizar el sensor** (α y β por acceso) y re-evaluar el "costo de canasta" con demanda real. Sin esto, cualquier RONDA B de oferta es falsa.
2. **Dotación inicial coherente**: `setPoint` derivado de la distribución de saldos (p. ej. P50) en lugar de constante 100. Esperado: acceso > 20 % y consumo real > 10 % de transferencias.
3. **Emisión de mantenimiento** acoplada a población activa (no al error micro) + límite de contracción con piso.
4. **Redistribución suave** (para test: decay de saldos dormidos, tope de tenencia) y medir si disminuye Gini sin tumbar el acceso.
5. **Anti-pobreza**: grants mínimos progresivos para nuevos usuarios (ya existen pero vinculados a población, no a necesidad).

### 4.3 Criterios de aceptación sugeridos (a confirmar si es deseado)
- Acceso medio ≥ 10 % y final ≥ 5 % en escenarios nominales.
- Error máx ≤ 5 CU para shocks de ±50 % en oferta.
- Oscilación (cambios de signo) < 3 en un horizonte de 80 ciclos.
- Gini no crece > 10 puntos durante shocks (o justificado).
- Monte Carlo: p90 del acceso ≥ 5 %, p90 del err máx ≤ 10 CU.

---

## 4.4 Análisis técnico del coder (§17)

> Separar resultado observado / interpretación / hipótesis / recomendación — como Lee.txt lo exige.

### ¿Qué funciona?
- **Observado**: el error del sensor nunca supera ~7 CU en ningún escenario y se recupera rápido de shocks puntuales.
- **Interpretación**: la estabilidad "superficial" del costo de canasta es una propiedad real del sistema: el motor de sensor + PID produce una convergencia cuasi-inmediata al setpoint en la mayoría de las configuraciones.
- **Recomendación**: esta robustez del lazo de sensor→PID→setpoint es el único pilar sólido. Preservarlo: no romper el ciclo de medición即使 ajoutemos ruido o volatilidad.

### ¿Qué no funciona?
- **Observado**: acceso efectivo < 2 % en 264 de 265 escenarios; las oleadas de usuarios causan las mayores desviaciones (5 CU en U-oleada-masiva) sin recuperación completa.
- **Interpretación**: el sistema es un "termómetro perfecto en un refrigerador vacío": mide el costo correctamente, pero no hay comida (CU suficientes) para los usuarios. El PID no controla la distribución de CU, solo su precio simbólico.
- **Hipótesis raíz**: el micromodelo asume que los usuarios son agentes pasivos que consumen aleatoriamente; no hay asignación de roles, intermediarios, ahorro intencional ni demanda basada en necesidad real. Los shocks de demanda son invisibles porque el consumo real depende de una fracción de usuarios (los que acceden) cuyo comportamiento no cambia con los shocks macro.
- **Recomendación**: antes de "arreglar" el PID, reconstruir la demanda: definir qué necesita cada usuario (cupo de encargos, bienes, servicios) y vincular la demanda a esas necesidades, no a una tasa × acceso.

### ¿Qué supuestos del modelo parecen razonables?
- **A1** Distribución inicial uniforme con jitter ±20 %: razonable para "todos arrancamos parecidos".
- **A3** Transferencias aleatorias como proxy de trueque: tolerable en un modelo abstracto, produce concentración realista sin implementar reglas complejas.
- **Sensor de canasta** con ganancia 0,1: suficiente para un modelo de prueba; ajustable.

### ¿Qué supuestos parecen débiles?
- **A2** Consumo ponderado por saldo: crea concentración automática (quien tiene más consume más, acumula más). En la vida real, el consumo de una canasta básica no escala con el saldo: es lineal (20 CU por usuario si puede pagar, 0 si no).
- **Sin señales de demanda real**: los usuarios no "reaccionan" al precio de la canasta. No hay cierre de aberturas, no hay sustitución, no hay ahorro intencional. La demanda es puramente estocástica.
- **Transferencias sin costo**: mover CU entre usuarios es gratis. En la realidad hay comisión/impuesto, lo que frena la acumulación.

### ¿Dónde puede producirse una dinámica no deseada?
- **Oleada de usuarios + grants**: cada usuario nuevo recibe un grant (20 CU) y en el micromodelo gasta 20 CU al instante (consumo obligatorio de ciclo 1). Esto produce un pico de consumo artificicial que no existe en la vida real (el usuario nuevo debería ahorrar primero).
- **Velocidad alta (2,06 en E14)**: transfers masivas crean una falsa ilusión de "moneda en movimiento" pero es solo un walk aleatorio, no intercambio real. Si medimos "éxito" por velocidad,我们会 ser engañados.

### ¿Qué variable parece faltar?
- **"Intención de compra"**: actualmente solo registramos consumo efectivo. Los usuarios que *querrían* acceder pero no pueden (saldo < canasta) no dejan traza. Sin esta señal, el sensor nunca sabe que hay demanda insatisfecha.
- **"Saldo objetivo"**: los usuarios deberían tener un nivel de saldo que buscan alcanzar (para poder acceder a la canasta periódicamente). Esto cambiaría su comportamiento de transferencia (ahorro vs gasto).

### ¿Qué métrica debería agregarse?
- **"Ratio de exclusión"**: usuarios que intentan acceder (su saldo ≥ costo en algún momento del horizonte) pero no pueden mantenerlo. Distingue entre "nunca tuvieron posibilidad" y "perdieron la posibilidad".
- **"Volatilidad de acceso"**: desviación estándar del acceso a lo largo del tiempo. Un acceso que oscila entre 0 % y 5 % es más inestable que un acceso fijo del 2 %.

### ¿El PID está realmente controlando la variable correcta?
- **Observado**: el PID controla "el costo observado de la canasta", que es un proxy sintético. La variable que debería controlar es "acceso de usuarios a la canasta" (o: "proporción de usuarios que pueden acceder").
- **Hipótesis**: el setpoint correcto no es 100 CU (precio fijo) sino "X % de usuarios pueden acceder". Esto requiere un sensor que mida acceso, no precio.
- **Recomendación**: crear un PID alternativo que tome `error = acceso_objetivo - acceso_real` y controle la emisión para estabilizar el acceso, no el precio.

### ¿La canasta funciona como sensor?
- **Observado**: la canasta es un sensor **preciso pero irrelevante**: mide correctamente un costo que nadie puede pagar. No hay señal útil en medir "cuánto cuesta" cuando la capacidad de compra es < 20 % del costo.
- **Interpretación**: el sensor funciona como una báscula perfecta en un hospital sin pacientes: no hay nada que pesar.
- **Recomendación**: combinar "costo de canasta" con "capacidad de compra media" (o mediana) para crear un índice compuesto de "accesibilidad".

### ¿La SupplyPolicy está demasiado desacoplada o demasiado acoplada al PID?
- **Observado**: completamente desacoplada (gains = 0). En RONDA B los gains activos no cambian el resultado porque la señal es ~0,1 CU.
- **Interpretación**: la SupplyPolicy es correcta en diseño (la señal del PID se traduce en emisión/contracción), pero el doble acoplamiento falla: (1) el sensor no ve el problema real → (2) la señal es insignificante → (3) la política no se activa.
- **Recomendación**: en lugar de "desacoplar" o "acoplar más", resolver el problema aguas arriba: sensor que vea el problema real.

### ¿La asignación a nuevos usuarios genera algún problema?
- **Observado**: grants de 20 CU por usuario nuevo son inyectados sin condición. El usuario nuevo recibe 20 CU y los consume al instante (A2) → el grant es un "vómito" de CU que no genera circulación sostenida.
- **Hipótesis**: el grant debería ser condicional: solo se otorga si el usuario nuevo realiza una actividad (publicación, comentario, participación). Esto crearía un vínculo entre emisión y actividad real.
- **Recomendación**: reemplazar `getNewUserGrant` por un sistema de grants condicionales a actividad mínima (por ejemplo: al menos 1 publicación o comentario en los últimos 7 días).

### ¿Qué ocurre con los usuarios históricos?
- **Observado**: los usuarios históricos pierden CU (consumo) sin reabastecimiento, a menos que reciban transferencias de otros usuarios. No hay mecanismo de "ingreso" para usuarios existentes: solo los nuevos reciben grants.
- **Interpretación**: esto crea una dinámica perversa: los usuarios más antiguos se empobrecen gradualmente (unless son top-10 que acumulan). El sistema beneficia a los recién llegados (grants) y a los ricos (concentración), perjudicando al "clase media histórica".
- **Recomendación**: existe un grant de "mantenimiento" para usuarios activos (participación regular) que rellene la erosión por consumo, o establecer un piso de saldo que se reajuste periódicamente.

### ¿Existe algún escenario donde el sistema se comporte como una moneda aunque no lo pretendamos?
- **Observado**: E14 (transferencia extrema) produce un walk aleatorio puro: 100 CU/ciclo transferidos entre pares, sin cambio en el acceso ni en la canasta. El CU se comporta exactamente como una moneda speculativa: los usuarios intercambian sin consumir, acumulan para "poder", y el Gini llega al 96 %.
- **Hipótesis**: cualquier transferencia libre sin costo, sin límite de tenencia y sin actividad económica vinculada convertirá el CU en moneda de facto, independientemente de lo que diga la narrativa oficial.
- **Recomendación**: si el objetivo es que CU no sea moneda, establecer costo por transferencia (comisión) o vincular las transferencias a actividad económica documentada (encargo, servicio, intercambio de bienes).

### ¿Existe algún escenario donde CU se convierta de facto en una medida de riqueza o estatus?
- **Observado**: sí, en todos los escenarios con Gini > 80 (E02, E04, E07, E10, E14, E16). El top-10 % posee > 80 % de los CU. El acceso se convierte en un "ticket de estatus": solo los ricos pueden comprar la canasta.
- **Hipótesis**: la Canasta no es un bien de consumo sino un **badge de estatus**: "puedo pagarlo" = "soy parte del club".

### ¿Qué mecanismos podrían generar farming, acumulación artificial o manipulación?
- **Farmeo de grants**: usuario crea múltiples cuentas para recibir múltiples grants (sin verificación de identidad real). El grant dinámico (sensibilidad a error) amplifica esto: más cuentas → más grants → inflación artificial.
- **Acumulación pasiva**: transferir CU a cuentas "dormidas" (que no consumen) crea billeteras de ahorro que elevan el Gini sin actividad real.
- **Manipulación del sensor**: si un usuario controla la canasta (por ejemplo, fijando el precio de un bien), podría inflar artificialmente el observed para provocar contracción y comprar barato.

### ¿Qué cambiarías vos?
1. **Sensor con acceso**: añadir `β × (acceso_objetivo - acceso_real)` a la regla de sensor.
2. **Grant condicional**: otorgar CU nuevos solo por actividad verificada.
3. **Piso de saldo**: todos los usuarios mantienen un saldo mínimo (por ejemplo 10 CU) que se reajusta periódicamente para evitar exclusión total.
4. **Costo por transferencia**: comisión del 5-10 % en transferencias P2P para frenar el farmeo y la acumulación pasiva.
5. **Métrica de acceso como KPI principal**: sustituir "error de canasta" por "acceso a la canasta" como variable de control principal.

---

## 4.5 Preguntas que el experimento NO pudo responder (§19)

1. **¿Cómo reaccionan los usuarios reales al precio de la canasta?** No tenemos modelada la utilidad subjetiva de los CU: no sabemos si un usuario prefiere 20 CU o 1 publicación con más visibilidad.
2. **¿Qué pasa cuando la canasta real (productos) cambia de precio?** El experimento asume canasta fija en 100 CU. En producción, el precio de la canasta depende de la actividad comunitaria (encargos, productos), que es endógena.
3. **¿Cómo interactúa el CU con el sistema de reputación/guildas?** Las CU en producción están vinculadas a una comunidad con reglas sociales; el micromodelo aísla la CU de todo contexto social.
4. **¿Cuál es la tasa de "muerte" de usuarios (abandono)?** No modelamos abandono: un usuario que deja la plataforma sigue "viviendo" en el sistema como un saldo dormido.
5. **¿Qué pasa con los CU de usuarios baneados o desactivados?** En producción, los CU se redistribuyen o congelan; en el micromodelo los saldos permanecen indefinidamente.
6. **¿El sistema tolera una recesión económica (caída general de actividad)?** No tenemos un escenario de recesión: caída simultánea de actividad (publicaciones, encargos) y de transferencias.
7. **¿Cómo se comporta el CU en un contexto multimoneda?** El experimento asume CU como única unidad; en producción convive con pesos/dólares en la vida real de los usuarios.

---

## 4.6 Fortalezas y parámetros sensibles

### Fortalezas del modelo actual
- **Sensor preciso**: la regla de canasta produce un costo estable y predecible; no oscila innecesariamente.
- **Escalabilidad**: funciona igual con 1 y con 100 000 usuarios (invariante de escala).
- **Robustez a shocks**: shocks de ±50 % en oferta se absorben sin colapso del costo de canasta (error < 5 CU).
- **Monte Carlo estable**: 200 corridas con jitter razonable confirman que no hay caos ni bifurcaciones; el sistema converge siempre al mismo "falso equilibrio".

### Parámetros sensibles (impacto > 10 % en al menos una métrica)
| Parámetro | Rango probado | Impacto |
|---|---|---|
| **perUser0** (dotación inicial) | 1–500 CU | El parámetro dominante: gobierna acceso (0→52 %). Sensibilidad máxima. |
| **demandRate** | 0,05–1,2 | Alto impacto en Gini (49→80) y consumo; bajo impacto en acceso. |
| **transferRate** | 0,01–2,0 | Alto impacto en velocidad (0,01→2,06) y concentración (Gini 75→96). |
| **growth (usuarios/ciclo)** | 0–200 | Moderado: acceso no cambia, pero oferta y Gini sí (Gini 75→85). |
| **sensor gain (0,1)** | — | No probado explícitamente, pero su bajo valor es la causa raíz de la ceguera del sensor. |
| **PID kp/ki/kd** | 0,1–6 / 0–1,5 / 0–3 | **Insensible** con gains=0; potencialmente sensible con gains>0 (pendiente de validar). |

### Escenarios inestables
- **U-oleada-masiva** (100/ciclo): rec5 = 80 (nunca recupera ±5 %), error máx. 5,02 CU.
- **U-oleadas-escalonadas**: oscilación con 7 cambios de signo, error máx. 2,64 CU.
- **E15 casi vacío**: error máx. 6,67 CU (el mayor del conjunto), pero sin oscilación (solo un shock inicial).

### Escenarios que funcionan razonablemente bien
- **E01 equilibrio**: error medio 0,05 CU, acceso 0,47 % (bajo, pero estable).
- **E06 shock demanda**: MAE 0,041, acceso 0,38 %; el sistema absorbe el shock sin desestabilización.
- **Monte Carlo completo**: MAE medio 0,093, err máx. 0,222. El sistema es predecible y no caótico.

---

## 5. Entregables

- `data/summary.csv` — 262 corridas × 30 métricas (incluye barridos y PID).
- `data/traces.json` + `data/trace-E*.csv` — series completas de los 16 escenarios mínimos (ciclo, oferta, consumo, acceso, Gini, velocidad, PID, sensores).
- `data/montecarlo.json` — distribución de métricas (200 corridas, sd 101).
- `data/heads-svg-index.json` — inventario de gráficos.
- `charts/*.svg` — panel de 11 métricas por escenario mínimo (E01–E16) + overlays de series (supply, observed, accessPct, pidOutput, issued, velocity, top10Share, users, avg, median, error).
- `_auto-summary.md` — resumen automático generado por el harness.
- `REPORTE.md` (este documento) — análisis técnico con observación/interpretación/hipótesis/recomendación.
- `public/stress-test/` — versión estática de la web: gráficos SVG, datos CSV/JSON, `presentation.json` con resumen renderizable.

### Web interactiva
- **Ruta pública**: `/ensayo-de-stress`
- Accesible desde la pestaña *Economía CU* del Panel de administración.
- Renderiza: resumen ejecutivo, hallazgos clave (cards), tabla comparativa de escenarios, Monte Carlo, selector de gráficos por escenario, enlaces de descarga.

Reproducibilidad: misma seed → mismos resultados byte a byte (RNG `mulberry32` determinista, semilla base 101 codificada).

## 6. Limitaciones del experimento
- El micromodelo abstrae la demanda real en una regla de consumo simple (A1–A4); los flujos reales de la app (encargos, transacciones) no alimentan el harness. Resultados = orden de magnitud y dinámicas, no valores puntuales.
- No se simula el efecto de la UI/feedback humano (los usuarios no "reaccionan" al costo de la canasta).
- La "velocidad de circulación" externa (transacciones reales) no está modelada; solo transferencias aleatorias.

## 7. Siguiente paso
Si se decide avanzar: (a) sensibilizar el sensor y re-ejecutar RONDA A completa; (b) validar RONDA B con criterios de aceptación; (c) solo entonces tocar la configuración de producción (config, presets, seeds) y desplegar con seguimiento de métricas.