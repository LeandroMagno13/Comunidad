# REPORTE-CU-CAPACIDAD
> Modelo experimental de seÃ±alizaciÃ³n y asignaciÃ³n de capacidad humana.
> RONDA C â€” Sistema de seÃ±alizaciÃ³n y asignaciÃ³n de capacidad, frente a la RONDA A (PID).

Estado: **primer corte de investigaciÃ³n, experimental. Sin conclusiÃ³n predeterminada.**
Fecha: 2026-09-11 Â· Motor: `scripts/capacity/engine.ts` Â· Escenarios: `scripts/capacity/scenarios.ts`

---

## 1. Resumen ejecutivo

Este informe documenta un cambio de hipÃ³tesis respecto del modelo de "economÃ­a de control" (PID sobre el costo de canasta). La hipÃ³tesis nueva es:

> **Las CU podrÃ­an ser mÃ¡s Ãºtiles como seÃ±al de demanda y participaciÃ³n dentro de una capacidad real limitada que como unidad artificial cuyo suministro intentamos estabilizar mediante un PID.**

Se construyÃ³ un motor de simulaciÃ³n (RONDA C) con 32 escenarios en los grupos Aâ€“F y K (crÃ­ticos) indicados por `Lee.txt`. Separamos explÃ­citamente **patrimonio real** (usd, no distribuible automÃ¡ticamente), **capacidad distribuible** (reglas de sostenibilidad), **demanda/operta humana** y **CU como seÃ±al de participaciÃ³n/prioridad**. El PID **no gobierna** la oferta: la creaciÃ³n de CU queda como polÃ­tica separada (grants con tope `cuCap=30`).

Resultados en una lÃ­nea:

1. **CU â‰  dinero**: acumular CU (escenario `K-cu-como-dinero`) produjo concentraciÃ³n de saldo (top-10 = 39 %, Gini = 0.60) pero **no** dominio del acceso (presiÃ³n â‰ˆ 0, %satisfecha 79 %, bÃ¡sica sin relecturas).
2. **El patrimonio limita el acceso de verdad, la cantidad de CU no**: con usd 1 o usd 100 por persona el % de demanda satisfecha fue idÃ©ntico (47 %) por incapacidad material de absorciÃ³n; con usd 20.000 el 100 % y presiÃ³n 0. La escala econÃ³mica viene de la capacidad real, no del nominal CU.
3. **La seÃ±al de presiÃ³n distingue escasez real**: capacidad humana sin proveedores y sin automatizar â†’ seÃ±al 94/100 (salud); oferta abundante â†’ seÃ±al 3; monopolio de una capacidad â†’ seÃ±al 58, exclusiÃ³n acotada al cuello de botella.
4. **AutomatizaciÃ³n reduce la demanda humana y la seÃ±al**: alta automatizaciÃ³n sube %satisfecha de 34 % (baja) a 59 %, y un shock de automatizaciÃ³n de traducciÃ³n la sube de 34,5 % a 53,4 %.
5. **Niveles de acceso funcionan como piso, no como jerarquÃ­a**: con entrantes que no aportan nada (cuInicial=1, 40 % sin capacidades), el sistema sostiene 40 % de acceso bÃ¡sico; los excluidos del bÃ¡sico fueron 11,5 % â€” y la exclusiÃ³n se explica por oferta insuficiente de la capacidad (salud), no por falta de CU.
6. **ConcentraciÃ³n de CU no se traduce en concentraciÃ³n de poder** en los escenarios probados (test crÃ­tico negativo): 7 de 8 tests crÃ­ticos afirmativos; el octavo ("CU â†’ poder") **no pudo demostrarse**, lo que se registra como resultado observado, no como promesa.

Pendiente: todo lo verificado acÃ¡ es simulaciÃ³n determinista con reglas que nosotros escribimos. El refactor productivo (schema, API, UI, dashboard de seÃ±ales) queda para la fase siguiente, con checkpoint previo.

---

## 2. Arquitectura del nuevo modelo

Cadena conceptual (sin controlador automÃ¡tico):

```
PATRIMONIO REAL (usd)
   â”‚
   â–¼
CAPACIDAD DISTRIBUIBLE (reglas de sostenibilidad, distributableRate)
   â”‚
   â–¼
RECURSOS DISPONIBLES por agente (presupuesto por ciclo)
        â”‚
        â–¼
DEMANDA (solicitudes con intensidad, capacidad, estado)  â”€â”
        +                                                   â”œâ”€â–º SEÃ‘AL = presiÃ³n
OFERTA HUMANA (oferta declarada Ã— disponibilidad Ã— nivel) â”€â”˜    (por capacidad)
        +
AUTOMATIZACIÃ“N (grado de cobertura tecnolÃ³gica por capacidad)
        â”‚
        â–¼
CU (participaciÃ³n, prioridad dentro de nivel; sin conversiÃ³n monetaria)
        â”‚
        â–¼
ASIGNACIÃ“N / NIVELES DE ACCESO (bÃ¡sico protegido â†’ medio â†’ avanzado)
        â”‚
        â–¼
OBSERVACIÃ“N / MÃ‰TRICAS (Â§21) â†’ ranking de capacidades por presiÃ³n (no de personas)
```

Reglas de negocio (`engine.ts`, reglas R1â€“R9):

- **R1 Demanda**: por ciclo, cada agente genera solicitudes con (capacidad, intensidad, CU apostadas). Las CU apostadas quedan en *hold* mientras la solicitud espera y vuelven al saldo si expira sin satisfacerse (max 8 ciclos).
- **R2 Enojo/expiraciÃ³n**: solicitudes no satisfechas antes de `maxHoldCycles` expiran y devuelven la apuesta.
- **R3 AutomatizaciÃ³n** cubre una fracciÃ³n `automatizacion` de la demanda de cada capacidad **antes** del reparto humano.
- **R4 SeÃ±al de presiÃ³n**: `presiÃ³n = demandaInsatisfecha / capacidadEfectivaDisponible`, registrada por capacidad. Si no hay capacidad efectiva y hay insatisfacciÃ³n â†’ seÃ±al saturada (hasta 100). (DocumentaciÃ³n completa en Â§12.)
- **R5 Racionamiento** cuando la demanda supera la capacidad efectiva: piso **bÃ¡sico primero** (garantiza base mÃ­nima), luego asignaciÃ³n dentro de cada nivel por mayor apuesta de CU.
- **R6 Nivel de acceso** (bÃ¡sico/medio/avanzado): por participaciÃ³n y contribuciones verificadas. **El nivel nunca se concede por monto de CU** (no es un puntaje de dignidad).
- **R7 Contribuciones**: la satisfacciÃ³n con proveedor humano transfiere la apuesta de CU al proveedor como crÃ©dito de contribuciÃ³n; el proveedor gana acceso avanzado sostenido al contribuir.
- **R8 Patrimonio**: la absorciÃ³n real (satisfacer con recursos reales) consume presupuesto distribuible por agente (`distributableRate` de la riqueza). El patrimonio **no** se expresa en CU.
- **R9 Grants/emisiÃ³n**: polÃ­tica separada con tope `cuCap` por agente (default 30). No hay "emisiÃ³n PID". (ComparaciÃ³n de polÃ­ticas en Â§23/24 de `Lee.txt`, verificable luego en refactor productivo.)

---

## 3. DefiniciÃ³n operacional de CU

- Unidad interna **de participaciÃ³n, demanda y prioridad**, sin valor monetario.
- Reglas operacionales usadas en esta simulaciÃ³n:
  - Se apuestan para solicitar una capacidad (prioridad dentro de nivel en racionamiento).
  - Se transfieren al proveedor al satisfacerse (crÃ©dito de actividad/contribuciÃ³n).
  - Se reciben como grant bÃ¡sico con tope (`cuCap`).
  - **No** se convierten a usd/acciones/patrimonio; **no** generan dividendo ni salario.
- **No** establece barrera de entrada al nivel bÃ¡sico (el piso se asigna por participaciÃ³n, no por saldo).

## 4. DefiniciÃ³n de patrimonio (real)

- Activos reales de la comunidad simulada: efectivo/activos productivos; valor expresado en **usd simulados** (escenarios 1/100/1.000/20.000 por persona, Â§16 de `Lee.txt`).
- **No debe distribuirse automÃ¡ticamente en su totalidad.** Se modela con `distributableRate` (default 0.2 â†’ solo una fracciÃ³n estÃ¡ disponible para absorciÃ³n real por ciclo).
- `distributablePerUser` (mÃ©trica Â§21) = patrimonio Ã— `distributableRate` Ã— fracciÃ³n del horizonte.

## 5. DefiniciÃ³n de capacidad distribuible

- `distributableRate` (0â€“1) = fracciÃ³n del patrimonio que, segÃºn reglas de sostenibilidad, puede ponerse a disposiciÃ³n para satisfacer demanda real en un ciclo.
- Escenario `K-mucho-patrimonio-poca-distribubil`: patrimonio usd 20.000 pero `distributableRate=0.02` â†’ la capacidad distribuible efectiva â‰ˆ 212 usd/horizonte â†’ acceso no llega al 100 % (64 % de satisfacciÃ³n). Demuestra que **patrimonio total â‰  capacidad distribuible**.

## 6. DefiniciÃ³n de demanda

- `demanda total` = solicitudes registradas en el horizonte (suma de intensidad de las solicitudes formadas).
- `demanda satisfecha` = solicitudes cuyo servicio se concreto (humano o automatizado).
- `demanda insatisfecha` = `demanda total âˆ’ demanda satisfecha` (incluye expiradas y no formadas por falta de oferta).
- Por capacidad y por ciclo se registra tambiÃ©n `demandaRegistrada` vs `demandaSatisfecha`.

## 7. DefiniciÃ³n de oferta

- `oferta declarada` = participantes con la capacidad en su perfil.
- `oferta efectiva` = Î£ (disponibilidad Ã— calidad Ã— factor nivel) por proveedor, por capacidad (limitada ademÃ¡s por `supplyScale` del escenario).
- Se distinguen `ofertaDisponible` y `ofertaUtilizada` por capacidad. La automatizaciÃ³n es una oferta no humana que desconta demanda antes del reparto humano.

## 8. Niveles de acceso

| Nivel | Regla en la simulaciÃ³n | FunciÃ³n |
| --- | --- | --- |
| **BÃ¡sico** | piso por defecto (participaciÃ³n mÃ­nima / entrantes sin aporte) | acceso mÃ­nimo garantizado, sin barrera de CU |
| **Medio** | participaciÃ³n sostenida en solicitudes/instancia | acceso a mÃ¡s capacidad comunitaria |
| **Avanzado** | contribuciones verificadas (satisfacer demanda sirviendo como proveedor) | acceso a capacidades escasas; **no** es "mÃ¡s CU = mejor persona" |

En racionamiento, la asignaciÃ³n se hace **bÃ¡sico primero**; dentro del mismo nivel por apuesta de CU. La exclusiÃ³n del bÃ¡sico (mÃ©trica `excluidosBasicoPct`) es la mÃ©trica de fallo de esta polÃ­tica.

## 9. MetodologÃ­a

- SimulaciÃ³n por eventos/ciclos (40 ciclos/escenario), determinista (PRNG `mulberry32` con semilla por escenario), 40 agentes.
- `scripts/capacity/main.ts` corre los 32 escenarios, calcula mÃ©tricas y escribe:
  - `evidence/capacidad/data/summary_capacidad.csv` â€” tabla principal;
  - `evidence/capacidad/data/traces_capacidad.json` â€” trazas completas;
  - `evidence/capacidad/data/trace-<id>.csv` â€” serie por escenario;
  - `evidence/capacidad/data/params_capacidad.json` â€” parÃ¡metros;
  - `evidence/capacidad/data/criticos_capacidad.csv/.json` â€” tests crÃ­ticos (Â§22);
  - `evidence/capacidad/charts/*.svg` â€” grÃ¡ficos por escenario + overlays por grupo;
  - `public/capacidad/*` â€” copia pÃºblica del bloque anterior.
- ValidaciÃ³n: typecheck `tsc --noEmit` limpio; cada escenario se ejecuta sin excepciones.
- Para cada test crÃ­tico se reporta un booleano + evidencia textual. Los umbrales son **explicitamente ad-hoc** y se marcan como tales (ver limitaciones Â§24/Â§15).

## 10. Escenarios

32 escenarios. Grupos (nomenclatura de `Lee.txt` Â§20):

| Grupo | Escenarios | En la simulaciÃ³n |
| --- | --- | --- |
| **A-patrimonio** | patrimonio 1 / 100 / 1000 / 20000 usd por persona | `wealthPerAgent` |
| **B-distribucion** | uniforme / desigual / concentraciÃ³n extrema | distribuciÃ³n de patrimonio |
| **C-demanda** | baja / estable / creciente / shock / concentrada en una capacidad / repartida | presiÃ³n de `intensidadRequest` y sesgo por capacidad |
| **D-oferta** | abundancia Ã—2.2 / escasez Ã—0.55 / monopolio de reparaciÃ³n / oferta sin demanda Ã—0.2 / demanda sin proveedor | `supplyScale` y recorte de catÃ¡logo |
| **E-automatizacion** | alta / media / baja / shock de automatizaciÃ³n en traducciÃ³n / nueva capacidad tecnolÃ³gica | `automatizacion` por capacidad + `automationShock`/`newTechCycle` |
| **F-participacion** | sin capacidades / con capacidades / expertos muy demandados / inactivos | recorte de `capacidades` y `participacion` |
| **K-criticos** | 5 escenarios especÃ­ficos (ver Â§13/Â§15) | configuraciones puntuales |

Detalle de D-sobre-muestra:
- `D-of-abundante`: `supplyScale: 2.2` â€” mismo catÃ¡logo, mÃ¡s oferta efectiva.
- `D-of-escasez`: `supplyScale: 0.55` â€” oferta humana recortada ~mitad.
- `D-of-monopolio`: solo 1 proveedor de `reparacion` + `supplyScale: 0.9`.
- `D-of-sin-demanda`: `supplyScale: 0.2` â€” poca gente demanda ese conjunto.
- `D-dem-sin-proveedor`: `salud-y-cuidado` sin proveedores humanos y `automatizacion: 0`.

## 11. Resultados

Tabla principal (final del horizonte; todas las filas de `evidence/capacidad/data/summary_capacidad.csv`):

| id | % sat | presiÃ³n mÃ¡x | CU top-10 % | Gini CU | bÃ¡s % | med % | adv % | excl bÃ¡s % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A-patrimonio-1 | 47,4 | 6,5 | 16,4 | 0,37 | 0 | 46 | 54 | 3,0 |
| A-patrimonio-100 | 47,4 | 6,5 | 16,4 | 0,37 | 0 | 46 | 54 | 3,0 |
| A-patrimonio-1000 | 52,8 | 5,8 | 14,2 | 0,28 | 0 | 31 | 69 | 0,5 |
| A-patrimonio-20000 | **100,0** | **0,0** | 10,5 | 0,05 | 0 | 2,5 | 97,5 | 0,0 |
| B-dist-uniforme | 52,8 | 5,8 | 14,2 | 0,28 | 0 | 31 | 69 | 0,5 |
| B-dist-desigual | 49,9 | 6,6 | 15,5 | 0,34 | 0 | 41 | 59 | 1,5 |
| B-dist-concentrada | 47,4 | 6,6 | 16,3 | 0,36 | 0 | 45,5 | 54,5 | 3,5 |
| C-dem-baja | 76,3 | 0,8 | 17,2 | 0,39 | 0 | 47 | 53 | 6,5 |
| C-dem-estable | 52,8 | 5,8 | 14,2 | 0,28 | 0 | 31 | 69 | 0,5 |
| C-dem-creciente | 46,6 | 10,0 | 14,1 | 0,28 | 0 | 28,5 | 71,5 | 1,5 |
| C-dem-shock | 47,6 | 9,2 | 14,4 | 0,29 | 0 | 25 | 75 | 1,0 |
| C-dem-concentrada | 71,5 | 10,2 | 18,0 | 0,43 | 0 | 45 | 55 | 5,0 |
| C-dem-repartida | 52,3 | 4,6 | 14,2 | 0,28 | 0 | 30 | 70 | 1,5 |
| D-of-abundante | 50,9 | 3,1 | 14,5 | 0,29 | 0 | 34 | 66 | 2,5 |
| D-of-escasez | 73,2 | 16,5 | 16,2 | 0,37 | 0 | 37 | 63 | 4,5 |
| D-of-monopolio | 59,5 | **58,6** | 15,3 | 0,34 | 0 | 34 | 66 | 2,0 |
| D-of-sin-demanda | 72,7 | 7,0 | 30,0 | 0,66 | 0 | 67,5 | 32,5 | 11,5 |
| D-dem-sin-proveedor | 48,6 | **94,4** | 31,6 | 0,67 | 0 | 68 | 32 | 37,0 |
| E-auto-alta | 58,9 | 5,5 | 14,2 | 0,29 | 0 | 30,5 | 69,5 | 0,5 |
| E-auto-media | 52,8 | 5,8 | 14,2 | 0,28 | 0 | 31 | 69 | 0,5 |
| E-auto-baja | **34,5** | 7,0 | 13,0 | 0,22 | 0 | 26,5 | 73,5 | 0,0 |
| E-auto-shock | 53,4 | 6,0 | 14,3 | 0,29 | 0 | 31 | 69 | 1,0 |
| E-nueva-tecnologia | 56,9 | 5,9 | 14,3 | 0,29 | 0 | 30,5 | 69,5 | 0,5 |
| F-partic-sin-capacidades | 53,1 | 6,6 | 17,8 | 0,42 | 25 | 24,5 | 50,5 | 8,0 |
| F-partic-capacidades | 52,3 | 4,9 | 13,6 | 0,25 | 0 | 29 | 71 | 0,5 |
| F-partic-expertos | 50,6 | 6,5 | 15,6 | 0,34 | 10 | 29,5 | 60,5 | 4,0 |
| F-partic-inactivos | 52,6 | 7,9 | 18,7 | 0,40 | 50 | 25 | 25 | 8,0 |
| K-pocas-cu-acceso-basico | 54,8 | 6,3 | 20,3 | 0,49 | 40 | 12,5 | 47,5 | 11,5 |
| K-muchas-cu-sin-capacidad | 86,2 | **51,1** | 33,8 | 0,59 | 0 | 67 | 33 | 32,0 |
| K-mucho-patrimonio-poca-distribubil | 64,1 | 3,7 | 12,1 | 0,17 | 0 | 16,5 | 83,5 | 1,0 |
| K-cu-como-dinero | 78,7 | 0,6 | **39,0** | **0,60** | 0 | 48,5 | 51,5 | 5,5 |
| K-farming | 81,4 | 5,1 | 25,0 | 0,24 | 90 | 4,5 | 5,5 | 19,0 |

Lectura por grupo:

- **A (patrimonio)**: la satisfacciÃ³n sube 47 â†’ 100 % al pasar de usd 100 a usd 20.000 de capacidad distribuible efectiva, mientras que la **cantidad de CU nominales es idÃ©ntica en todos** (100 CU base). La escala econÃ³mica la marca el patrimonio real, no el saldo CU. usd 1 vs usd 100 son indistinguibles: 0.11 y 10.6 usd distribuibles por horizonte no alcanzan ni una solicitud real â†’ la barrera es material.
- **B (distribuciÃ³n)**: concentrar patrimonio sube Gini CU 0,28 â†’ 0,36 y reduce satisfacciÃ³n 52,8 â†’ 47,4 %, pero el piso bÃ¡sico mantiene exclusiÃ³n â‰¤ 3,5 %.
- **C (demanda)**: `C-dem-concentrada` (una sola capacidad demandada) marca seÃ±al 10,2 y Gini CU alto (0,43); `C-dem-repartida` reparte seÃ±al (4,6) y sube satisfacciÃ³n relativa. `C-dem-shock` casi duplica la seÃ±al de `C-dem-estable` (9,2 vs 5,8).
- **D (oferta)**: la seÃ±al crece 3,1 â†’ 16,5 â†’ 58,6 â†’ 94,4 conforme baja la oferta humana relativa. Los dos extremos (abundancia y monopolio) son los caminos claros de la frontera de automatizaciÃ³n.
- **E (automatizaciÃ³n)**: monotonicidad correcta: baja 34,5 %, media 52,8 %, alta 58,9 %. Shock de automatizaciÃ³n (traducciÃ³n) mejora la satisfacciÃ³n respecto de baja automatizaciÃ³n en 18,9 pp â€” la tecnologÃ­a "resuelve" demanda sin CU.
- **F (participaciÃ³n)**: inactivos no generan demanda (65 % con demanda) y quedan 50 % en bÃ¡sico; expertos concentran avance (60,5 %) sin romper la exclusiÃ³n.
- **K (crÃ­ticos, see Â§15)**: ver detalle abajo.

## 12. MÃ©tricas

Cumplen Â§21 de `Lee.txt`: acceso bÃ¡sico/medio/avanzado; demanda total/satisfecha/insatisfecha y %; capacidad disponible/utilizada; escasez por capacidad (`escasezCapacidades`: lista `capacidadÃ—presiÃ³n`); concentraciÃ³n de CU (top-10 %, Gini CU), de demanda (`demandaTotal` por capacidad) y de oferta (implÃ­cita en `escasezCapacidades`); correlaciones CUâ†’demanda, CUâ†’acceso, CUâ†’patrimonio (coeficiente de Pearson; vacÃ­o cuando hay varianza nula); `distributablePerUser`; `excluidosBasicoPct`; `conDemandaPct`; `capacityUtilizadaPct`; `corrCuPatrimonio`.

**DefiniciÃ³n de seÃ±al de presiÃ³n (fÃ³rmula elegida y por quÃ©)**:

```
presiÃ³n(c) = (demandaRegistrada(c) âˆ’ demandaSatisfecha(c)) / capacidadEfectiva(c)
            = demandaInsatisfecha(c) / capacidadEfectiva(c)
capacidadEfectiva(c) = Î£_proveedores (disponibilidad Ã— calidad Ã— max(0.2, nivelAcceso)) Ã— supplyScale
```

- Por quÃ©: refleja el cociente que pide `Lee.txt` Â§9 y **no** la "carga humana" (demanda total/capacidad), que confundÃ­a demanda satisfecha con escasez (mostrÃ³ presiÃ³n > 0 con %satisfecha = 100). La carga humana se registra aparte como `cargaHumana` (indicador operativo de tensiÃ³n logÃ­stica).
- Variables: demanda por capacidad, estado de las solicitudes, oferta efectiva por capacidad.
- Problemas conocidos: (1) la "demanda registrada" depende de las reglas de formaciÃ³n de solicitudes â†’ una capacidad poco ofrecida genera menos solicitudes y **subestima** su escasez real (`D-of-sin-demanda` es el ejemplo: demanda 0,2x oferta pero seÃ±al 7 por capacidad por la distorsiÃ³n de formaciÃ³n); (2) la capacidad efectiva depende de parÃ¡metros de calidad/disponibilidad que en el modelo real pueden no observarse; (3) la saturaciÃ³n a 100 es un recorte arbitrario.
- CÃ³mo podrÃ­a manipularse: inflando el nÃºmero de solicitudes (farming de demanda, ver Â§15), declarando disponibilidad falsa (no verificado aquÃ­), o coludiendo proveedores para inflar demanda/insatisfacciÃ³n.

**MÃ©tricas relevantes no computadas todavÃ­a** (later fase productiva): concentraciÃ³n de demanda y de oferta con Ã­ndices propios, recursos reales disponibles por nivel, velocidad de circulaciÃ³n como mÃ©trica de actividad (Â§19: **no** como valor).

## 13. GrÃ¡ficos

Generados por `scripts/capacity/charts.ts` (SVG en `evidence/capacidad/charts/` y `public/capacidad/charts/`):

- `<id>_demanda.svg` â€” demanda registrada/satisfecha/insatisfecha por ciclo.
- `<id>_presion.svg` â€” seÃ±al de presiÃ³n por capacidad (top 6).
- `<id>_acceso.svg` â€” niveles de acceso por ciclo.
- `<id>_cu.svg` â€” concentraciÃ³n de CU (top-10 y Gini).
- `overlay-<grupo>.svg` â€” presiÃ³n media por grupo (comparable entre escenarios).

GrÃ¡ficos destacados: `A-patrimonio-20000_demanda.svg` (todas las curvas a 100 %, presiÃ³n 0) vs `D-dem-sin-proveedor_presion.svg` (salud saturada a 94â€“100); `overlay-D-oferta.svg` para ver la secuencia abundanciaâ†’monopolioâ†’sin-proveedor.

## 14. Fallos

Fallos del modelo o del harness detectados en esta ronda:

1. **DistorsiÃ³n de formaciÃ³n de solicitudes** (ver Â§12): las capacidades con poca oferta generan pocas solicitudes y la seÃ±al queda subestimada o polarizada. En `D-of-sin-demanda` la seÃ±al 7 sobre demanda casi nula es un artefacto. **Fallo de mediciÃ³n, no de regla**.
2. **`D-of-escasez` muestra %satisfecha 73 % frente a 51 % de abundancia**: a menor oferta se forman menos solicitudes y la satisfacciÃ³n relativa sube, lo cual **no** significa "mejor". El cociente presiÃ³n lo corrige en parte pero la mÃ©trica %satisfecha en cruces con `supplyScale` es engaÃ±osa.
3. La exclusiÃ³n `excluidosBasicoPct` se mide solo entre los que *pidieron*; no mide a los que ni siquiera intentan (inactivos). `conDemandaPct` lo documenta separadamente.
4. `corrCuPatrimonio` queda vacÃ­a en escenarios con patrimonio uniforme (varianza cero) â€” se interpreta como "sin evidencia", no "correlaciÃ³n nula".
5. El atributo `capacidadEfectiva` en el racionamiento usa disponibilidad/calidad **declaradas**; no hay validaciÃ³n de cumplimiento real del proveedor (no modelado).
6. La relaciÃ³n `%satisfecha = 100` en patrimonio-20000 coexiste con presiÃ³n 0 correctamente tras el fix de Â§12; en rodajes anteriores de la ronda la presiÃ³n usaba la definiciÃ³n de "carga humana" y era incoherente â€” corregido, quedÃ³ documentado como cambio.

## 15. Casos extremos

- **Personas sin capacidad de aporte** (`K-pocas-cu-acceso-basico`): cuInicial=1, 40 % sin capacidades â†’ bÃ¡sico 40 %, exclusiÃ³n 11,5 %. La exclusiÃ³n se concentra en `salud-y-cuidado` (seÃ±al 6,3) por falta de oferta, no por CU: **el piso funciona mientras exista oferta real**.
- **Muchas CU + sin capacidad real** (`K-muchas-cu-sin-capacidad`): cuInit=20, oferta Ã—0.15 â†’ presiÃ³n 51,1 y exclusiÃ³n 32 %: las CU no crearon capacidad; la seÃ±al detecta el cuello de botella.
- **Mucho patrimonio + poca capacidad distribuible** (`K-mucho-patrimonio-poca-distribubil`): usd 20.000 con `distributableRate=0.02` â†’ 64 % de satisfacciÃ³n, no 100 %. El patrimonio total no es distribuible automÃ¡ticamente.
- **Demanda sin proveedor** (`D-dem-sin-proveedor`): salud sin oferta humana ni automatizaciÃ³n â†’ seÃ±al 94, exclusiÃ³n 37 %. Es exactamente el caso que el sistema debe marcar como frontera de automatizaciÃ³n.
- **Monopolio** (`D-of-monopolio`): un solo reparable â†’ seÃ±al 58,6 en esa capacidad y seÃ±al baja en el resto. El cuello de botella queda identificado por capacidad.

## 16. ManipulaciÃ³n

Intentos de romper la hipÃ³tesis (`Â§22/Â§18 de Lee.txt`):

- **Farming de grants** (`K-farming`): 90 % de agentes sin capacidades ni actividad recibiendo grants con `cuCap=30` â†’ CU top-10 = 25 %, Gini = 0,24, 90 % bÃ¡sico. **El tope de balance impide el acopio desbordado**; la manipulaciÃ³n escala poco. Pero si `cuCap` se sube, la misma config acumularÃ­a â€” el lÃ­mite es una regla, no magia.
- **Aviso**: una economÃ­a real puede manipular la seÃ±al inflando solicitudes o coludiendo proveedores; en simulaciÃ³n no modelamos intenciÃ³n adversarial (a diferencia de transfers/mercado informal, ver Â§18 pendientes).

## 17. ConcentraciÃ³n

- La **concentraciÃ³n de CU** es reproducible donde hay escasez inicial de demanda/consumo (`K-cu-como-dinero`: top-10 39 %, Gini 0,60; `K-muchas-cu`: Gini 0,59).
- La **correlaciÃ³n CUâ†’acceso** es alta y consistente (0,6â€“0,8) pero el sentido es el esperado: mÃ¡s participaciÃ³n (que concede CU) coincide con mÃ¡s acceso. La correlaciÃ³n CUâ†’patrimonio es **negativa** (âˆ’0,11) en escenarios de desigualdad: las CU no alinean con la riqueza, alinean con la participaciÃ³n. **No se demostrÃ³ que la concentraciÃ³n de CU produzca dominio del acceso** (test crÃ­tico, ver Â§19).

## 18. Comportamiento monetario (CU como moneda disfrazada)

Evidencia **a favor de que NO es moneda** en las reglas actuales:

- `K-cu-como-dinero`: acumulaciÃ³n masiva sin gasto â†’ top-10 39 %, Gini 0,60, **pero** %satisfecha 79 % y presiÃ³n 0,6: acumular no comprÃ³ acceso (el nivel se gana con participaciÃ³n/contribuciÃ³n, no con saldo).
- Las correlaciones de CU con acceso en escenarios de acumulaciÃ³n se mantienen â‰¤ 0,76, y la de CU-patrimonio es negativa.

Evidencia **en contra (seÃ±ales de riesgo de moneda disfrazada)**:

- Las CU pueden **transferirse** al proveedor (R7): esto habilita un mercado informal fuera de la plataforma ("vendo x CU por pesos"). No modelado como escenario adversarial â†’ **pendiente** modelar transferencias externas y ver si genera pase a dinero (tema abierto, Â§22).
- La mÃ¡quina de apuestas en *hold* es un mecanismo de confianza entre pares; si se abusa, puede convertirse en crÃ©dito privado (otra forma de dinero encubierto).

## 19. RelaciÃ³n CUâ€“capital

Cadena verificada en simulaciÃ³n:

```
PATRIMONIO REAL â”€â–º CAPACIDAD DISTRIBUIBLE (rate) â”€â–º RECURSOS DISPONIBLES â”€â–º acceso
DEMANDA                â”€â”€â–º CU (seÃ±al) â”€â”€â–º priorizaciÃ³n dentro de nivel      â”€â–º acceso
```

Resultado observado (`A-patrimonio-*`): mismo nominal (100 CU) produce 47 % (usd 1â€“100), 53 % (usd 1000), 100 % (usd 20000). **Las CU no determinan la capacidad econÃ³mica; el patrimonio real sÃ­, pero solo a travÃ©s de la capacidad distribuible, no directamente.** La relaciÃ³n CUâ†’capital es indirecta, como pedÃ­a Â§17.

---

## 20. Tests crÃ­ticos (Â§22)

| # | Pregunta | Escenario | Resultado (observado) | Pasa |
| --- | --- | --- | --- | ---: |
| 1 | Â¿Pocas CU + acceso bÃ¡sico? | K-pocas-cu-acceso-basico | bÃ¡sico 40 %, exclusiÃ³n 11,5 % (por oferta de salud, no por CU) | âœ… |
| 2 | Â¿Muchas CU + sin capacidad real? | K-muchas-cu-sin-capacidad | presiÃ³n 51,1 y exclusiÃ³n 32 % con cuInit=20 | âœ… |
| 3 | Â¿Mucho patrimonio + poca distributiva? | K-mucho-patrimonio-poca-distribubil | usd 20.000 a rate 0,02 â†’ 64 % (no 100 %) | âœ… |
| 4 | Â¿Mucha demanda + poca oferta humana â†’ seÃ±al fuerte? | D-dem-sin-proveedor | seÃ±al 94 vs 3 de abundancia | âœ… |
| 5 | Â¿Mucha oferta + poca demanda â†’ seÃ±al dÃ©bil? | D-of-abundante | seÃ±al mÃ¡x 3,1 (dÃ©bil) | âœ… |
| 6 | Â¿TecnologÃ­a elimina demanda? | E-auto-shock / E-auto-baja | %sat 53,4 vs 34,5 | âœ… |
| 7 | Â¿Capacidad humana = cuello de botella? | D-of-monopolio | seÃ±al 58,6 en reparaciÃ³n; resto bajo | âœ… |
| 8 | Â¿CU terminan siendo dinero? | K-cu-como-dinero | concentraciÃ³n acumulable, sin dominio del acceso | âœ…* |
| 9 | Â¿CU â†’ concentraciÃ³n de poder? | K-cu-como-dinero | no demostrado: cuTop10 39 % con presiÃ³n 0,6 | âŒ |
| 10 | Â¿Farming manipulable? | K-farming | acopio limitado por cuCap=30 | âœ… |

\* #8 se tomÃ³ como: "CU serÃ­an dinero si la acumulaciÃ³n diera poder de compra de acceso"; no se demostrÃ³, pero **sÃ­ se demostrÃ³ que se puede acumular**, lo que es condiciÃ³n necesaria (riesgo latente).

Ver `evidence/capacidad/data/criticos_capacidad.json|csv` para el detalle textual.

---

## 21. Conclusiones

1. **La seÃ±al de presiÃ³n funciona** para distinguir cuellos de botella de capacidad humana (test crÃ­ticos 4/5/6/7).
2. **El patrimonio entra como lÃ­mite material** y la cantidad de CU nominales no determina la capacidad de acceso (grupo A), pero la relaciÃ³n es vÃ­a `distributableRate`, no directa.
3. **Los niveles cumplen su funciÃ³n de piso** para los que no aportan (test 1), con una excepciÃ³n material: si no hay oferta real, nadie puede ser servido (exclusiÃ³n 11,5 %).
4. **No se demostrÃ³ que CU = moneda**, aunque **sÃ­ se demostrÃ³ que la acumulaciÃ³n es posible**, y hay vÃ­as abiertas (transferencias informales, crÃ©dito privado) que convierten esto en riesgo â€” no en hecho.
5. **No se demostrÃ³ concentraciÃ³n de poder por CU**: la concentraciÃ³n de saldo no se tradujo en dominio del acceso.
6. La distorsiÃ³n de formaciÃ³n de solicitudes (â‰¤ oferta) es el defecto metodolÃ³gico mÃ¡s significativo y debe resolverse en el refactor (ver recomendaciÃ³n 1).

## 22. Recomendaciones y preguntas abiertas

Recomendaciones (siguiente fase, productiva):

1. **Arreglar la mediciÃ³n de demanda**: producir solicitudes independientes de la oferta conocida (registrar intenciÃ³n aun sin proveedor previsto) para desacoplar la seÃ±al de la retroalimentaciÃ³n formaciÃ³n/oferta.
2. **Dashboard**: concentrar el ranking por `presiÃ³n de demanda` por capacidad (nunca por persona), indicadores de Â§28 de `Lee.txt`, y las cadenas conceptuales de patrimonioâ†’capacidad distribuibleâ†’recursos y demandaâ†’CUâ†’acceso.
3. **Interface**: retitular a "EconomÃ­a de CU â€” Sistema experimental de seÃ±alizaciÃ³n y asignaciÃ³n de capacidad"; quitar el PID del relato principal; conservar el PID solo como experimento histÃ³rico (RONDA A en `evidence/stress-test`).
4. **EmisiÃ³n/grants**: documentar polÃ­tica con `cuCap`; probar grant dependiente de nivel/participaciÃ³n (Â§24) mostrando consecuencias, no eligiendo por mÃ©tricas mÃ¡s bonitas.
5. **Validar el modelo contra su definiciÃ³n**: sin haberlo probado, un agente con "oferta declaradaâ‰ real" podrÃ­a romper la seÃ±al â†’ modelar verificaciÃ³n de oferta efectiva.

Preguntas abiertas (no resueltas en este corte):

- Â¿CÃ³mo se comporta la seÃ±al si permitimos transferencias de CU entre pares y un mercado informal externo? (riesgo moneda-disfrazada).
- Â¿Existe un umbral de `cuCap`/grant desde el cual el farming del Â§16 desborda?
- Â¿La concentraciÃ³n de oferta (proveedores Ãºnicos) se puede mitigar con formaciÃ³n+inversiÃ³n en tecnologÃ­a dirigida por la seÃ±al? (la seÃ±al mide esto; la polÃ­tica no existe todavÃ­a).
- Â¿La mÃ©trica %satisfecha es comparable entre escenarios con `supplyScale` variable? (ver fallo Â§14.2).
- Â¿QuÃ© sucede con poblaciÃ³n en crecimiento masivo (Â§20 F)? â€” grupo F solo cubriÃ³ correlatos de participaciÃ³n; el escenario de crecimiento masivo **quedÃ³ implementado como `F-partic-capacidades` parcial**; falta un escenario explÃ­cito de entrada masiva de nuevos usuarios.
- Â¿CU apostadas en hold â†’ crÃ©dito privado? Definir regla.

---

## Anexo â€” ComparaciÃ³n con RONDA A (PID) â€” Â§26-27 de `Lee.txt`

| CaracterÃ­stica | PID actual (RONDA A) | Nuevo modelo (RONDA C) |
| --- | --- | --- |
| Variable principal | costo de canasta | demanda/capacidad |
| Setpoint fijo | sÃ­ (100 CU canasta) | no |
| PID | sÃ­ | no |
| Patrimonio real | separado/simulado | separado, limitante real |
| CU = dinero | no | no |
| Acceso bÃ¡sico | limitado por CU | sÃ­ (piso por participaciÃ³n) |
| Demanda insatisfecha | dÃ©bil (sensor ciego) | central (seÃ±al) |
| Oferta humana | secundaria | central |
| Escasez | costo artificial | capacidad real |
| AutomatizaciÃ³n | secundaria | central (R3) |
| InformaciÃ³n producida | saldos | demanda/capacidad |

> Nota de honestidad metodolÃ³gica: **no** estamos afirmando que el nuevo modelo "funciona mejor". Ambos son simulaciones con reglas propias. La diferencia es *conceptual*: el nuevo modelo produce la informaciÃ³n que el PID no producÃ­a (demanda insatisfecha por capacidad), y eso es lo que necesitÃ¡bamos investigar.

## Anexo â€” Archivos de evidencia

- `evidence/capacidad/data/summary_capacidad.csv` Â· `params_capacidad.json` Â· `traces_capacidad.json`
- `evidence/capacidad/data/trace-<id>.csv` Â· `criticos_capacidad.csv|json`
- `evidence/capacidad/charts/*.svg` (+ overlays por grupo)
- `public/capacidad/*` â€” copia pÃºblica (visible en plataforma en fase siguiente)
- CÃ³digo: `scripts/capacity/engine.ts` Â· `scenarios.ts` Â· `charts.ts` Â· `main.ts`
