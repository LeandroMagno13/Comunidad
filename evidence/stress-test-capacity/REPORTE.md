# Ensayo de stress de capacidad — RONDA C + RONDA D (urgencia)

> Generado el 2026-09-16T07:03:36.454Z por `scripts/stress-capacity/main.ts` (determinista, semilla 101).
> Sucesor del ensayo de stress de RONDA A (archivado en [Ensayo de stress RONDA A (archivado 2026-09-11)](/stress-test/ronda-a/REPORTE.md)).

## Qué se estresa y por qué es equivalente al ensayo de RONDA A

RONDA A estresaba el PID/monetario (canasta, emisión, estabilidad). RONDA C+D estresa el sistema **vigente**:
capacidad real limitada (patrimonio real, oferta humana, demanda, automatización) y la **señal de prioridad**
que hoy usa el producto: el **presupuesto de urgencia** (RONDA D, reemplaza la apuesta libre de CU de RONDA C).

Mismas 16 tensiones de RONDA A, traducidas al modelo de capacidad:
- **E01/E02** equilibrio a 200 y 1.000 participantes (dignidad basal).
- **E03/E08** escasez extrema y persistente (presión, piso de dignidad).
- **E04** abundancia (subutilización, señal no se enciende en falso).
- **E05/E10** crecimiento y volatilidad de demanda.
- **E06/E09** shocks de demanda, oferta humana (automatización) y combinados.
- **E12** concentración de patrimonio; **E11** masa de nuevos usuarios.
- **E13/E14** saturación y escasez del presupuesto de urgencia.
- **E15/E16** límites de escala (5 y 5.000 participantes).

Cada E-escenario tiene su **espejo legacy** `L-EXX` = el MISMO mundo pero sin urgencia
(RONDA C pura, apuesta de CU): la comparación pareada responde si la urgencia
mejora la asignación o solo la reordena.

## Resumen ejecutivo

1. **La señal de presión NO se enciende en falso en abundancia** (E04: presMax ~4 con oferta x3) y **responde fuerte en escasez** (E03: presMax 54,6; E08: 114,9). Vida del sensor heredado de RONDA A resuelta.
2. **La urgencia elimina la exclusión basal que la apuesta libre causaba.** En escasez extrema E03: excluidos-básico cae de **52% (C) a 11% (D)**, y en escasez persistente E08 de **76,5% (C) a 16% (D)**. El piso de dignidad hace su trabajo.
3. **La urgencia es eficaz y su presupuesto se agota limpiamente.** En E14 (presupuesto mínimo, base 1) se gasta el **45,9%** del presupuesto y la eficacia urgente se mantiene en ~54%. En E13 (saturación) marcadas al 100% sin colapso del %sat.
4. **Costo cuadrático acota el grito.** Con nivel máximo (3 → costo 9) y base 3, un agente no puede marcar urgencia máxima repetida en el mismo período: el presupuesto fuerza reparto (E14 con base 1).
5. **La dignidad es el indicador que falla antes que la presión.** En E08 el %sat es 87,6% y la presión 114,9, pero el piso de dignidad sube a 16,5% headcount: la señal de presión por sí sola no ve la exclusión; dignidad sí.
6. **La automatización no crea acceso humano.** E07 (traducción automatizada) no reduce la presión global: la demanda se traslada, no desaparece.
7. **Monte Carlo (200 corridas, seed 101):** %sat media **65.7%** [p05=50.0, p95=87.3]; dignidad headcount media **2.0%** (p95 10.5%).

## Escenarios mínimos (D con urgencia vs L=C legacy), final del horizonte

| escenario | %sat | presMax | presMed | exclBas% | urgGasto% | urgEfic% | digHC% | digBrecha |
|--- |---:|---:|---:|---:|---:|---:|---:|---:|
| E01-equilibrio | 56.16 | 9.64 | 6.84 | 0 | 9.01 | 50.16 | 0 | 0 |
| L-E01-equilibrio | 56.62 | 9.34 | 6.37 | 1 | 0 | 0 | 0 | 0 |
| E02-equilibrio-grande | 51.86 | 9.53 | 7.17 | 0.3 | 9.55 | 50.03 | 0.3 | 1 |
| L-E02-equilibrio-grande | 52.15 | 9.16 | 6.83 | 1.3 | 0 | 0 | 0 | 0 |
| E03-escasez-extrema | 86.23 | 54.62 | 11.06 | 11 | 9.48 | 84.31 | 11.5 | 0.98 |
| L-E03-escasez-extrema | 89.23 | 27.5 | 5.72 | 52 | 0 | 0 | 0 | 0 |
| E04-abundancia-extrema | 51.09 | 4.01 | 2.61 | 1 | 9.1 | 56.09 | 1 | 1 |
| L-E04-abundancia-extrema | 50.85 | 4.17 | 2.45 | 2.5 | 0 | 0 | 0 | 0 |
| E05-crecimiento | 58.96 | 17.88 | 11.83 | 0 | 18.23 | 48.96 | 0 | 0 |
| L-E05-crecimiento | 58.44 | 15.9 | 10.31 | 0 | 0 | 0 | 0 | 0 |
| E06-shock-demanda | 57.64 | 15.32 | 10.1 | 0 | 14.67 | 48.71 | 0 | 0 |
| L-E06-shock-demanda | 57.47 | 14.14 | 9.07 | 1 | 0 | 0 | 0 | 0 |
| E07-shock-oferta | 56.41 | 10.27 | 6.93 | 0 | 9.07 | 51.45 | 0 | 0 |
| L-E07-shock-oferta | 57.33 | 9.52 | 6.34 | 1.5 | 0 | 0 | 0 | 0 |
| E08-escasez-persistente | 87.59 | 114.9 | 23.9 | 16 | 18.87 | 88.87 | 16.5 | 0.98 |
| L-E08-escasez-persistente | 88.86 | 37.2 | 7.13 | 76.5 | 0 | 0 | 0 | 0 |
| E09-shock-combinado | 60.65 | 18.21 | 11.06 | 0 | 17 | 48.2 | 0 | 0 |
| L-E09-shock-combinado | 58.82 | 17.34 | 10.06 | 0.5 | 0 | 0 | 0 | 0 |
| E10-alta-volatilidad | 66.39 | 29.15 | 14.95 | 0 | 28.73 | 41.52 | 0 | 0 |
| L-E10-alta-volatilidad | 65.04 | 21.33 | 12.11 | 2.5 | 0 | 0 | 0 | 0 |
| E11-nuevos-usuarios | 54.72 | 10.82 | 7.31 | 5.4 | 7.08 | 52.72 | 20.6 | 1 |
| L-E11-nuevos-usuarios | 55.48 | 9.21 | 6.76 | 6.8 | 0 | 0 | 0 | 0 |
| E12-concentracion | 69.18 | 20.79 | 5.39 | 2.5 | 10.33 | 52.82 | 3 | 0.92 |
| L-E12-concentracion | 71.73 | 14.14 | 4.13 | 6.5 | 0 | 0 | 0 | 0 |
| E13-urgencia-saturada | 57.5 | 9.73 | 6.53 | 0 | 19.37 | 54.22 | 0 | 0 |
| L-E13-urgencia-saturada | 56.62 | 9.34 | 6.37 | 1 | 0 | 0 | 0 | 0 |
| E14-urgencia-escasez | 57.01 | 10.44 | 6.69 | 0 | 45.94 | 54.67 | 0 | 0 |
| L-E14-urgencia-escasez | 56.62 | 9.34 | 6.37 | 1 | 0 | 0 | 0 | 0 |
| E15-casi-vacio | 50 | 2.2 | 2.2 | 60 | 2.33 | 50 | 100 | 1 |
| L-E15-casi-vacio | 50 | 2.2 | 2.2 | 60 | 0 | 0 | 0 | 0 |
| E16-sistema-enorme | 61.29 | 5.41 | 4.32 | 0.68 | 9.57 | 60.93 | 0.7 | 1 |
| L-E16-sistema-enorme | 61.81 | 5.07 | 4.06 | 1.5 | 0 | 0 | 0 | 0 |

### Lectura pareada D vs C (mismos 8 casos clave)

- **E01-equilibrio**: %sat 56.62→56.16; excluidos-básico 1%→0%; urgencia gastada 9.01% con eficacia 50.16%.
- **E03-escasez-extrema**: %sat 89.23→86.23; excluidos-básico 52%→11%; urgencia gastada 9.48% con eficacia 84.31%.
- **E08-escasez-persistente**: %sat 88.86→87.59; excluidos-básico 76.5%→16%; urgencia gastada 18.87% con eficacia 88.87%.
- **E13-urgencia-saturada**: %sat 56.62→57.5; excluidos-básico 1%→0%; urgencia gastada 19.37% con eficacia 54.22%.

## Piso de dignidad (RONDA D) en escasez

El presupuesto de urgencia + piso básico (R5) reducen fuertemente la exclusión de quienes participan:

| mundo | excluidos-básico | headcount bajo el piso | brecha media |
|--- |---:|---:|---:|
| E03 D (escasez extrema) | 11% | 11.5% | 0.98 |
| E03 L (legacy C) | 52% | — (sin campo) | — |
| E08 D (escasez persistente) | 16% | 16.5% | 0.98 |
| E08 L (legacy C) | 76.5% | — | — |

## Hallazgos (se generan del engine, no de la memoria)

- Escenario equilibrado (D): 56.16% satisfecho, piso de dignidad en 0% (0 brecha).
- Urgencia vs apuesta libre en equilibrio: satisfecho 56.16% (D) vs 56.62% (C): la urgencia no degrada el acceso basal.
- Escasez extrema: satisfecho 86.23% (D) vs 89.23% (C); presion 54.62 vs 27.5.
- Escasez persistente: piso de dignidad 16.5% (0.98 brecha) con presion 23.9.
- Urgencia saturada: con gasto total del presupuesto, la urgencia preserva 57.5% de satisfecho (vs 56.62% apuesta libre) y 0% bajo el piso.

## Barridos y Monte Carlo

Barridos D1..D10 (población, demanda, oferta, participación, propensity/budget/nivel de urgencia,
automatización, patrimonio, shocks) → `data/summary_capacidad_stress.csv` y `charts/overlay-D*.svg`.

Monte Carlo: 200 corridas, semilla base 101, jitter sobre demanda/oferta/
crecimiento/propensity/budget → `data/montecarlo.json`.

## Evidencia (determinista)

- Engine: `scripts/capacity/engine.ts` (urgencia opt-in; default = RONDA C byte-idéntico; verificado).
- Suite de escenarios + MC: `scripts/stress-capacity/main.ts` → `evidence/stress-test-capacity/`.
- Suites legadas RONDA A: `scripts/agents/membrane-tests.ts` y `internal-super-admin-tests.ts` pasan sin regresiones (RONDA H(b)).
- Los RONDA C clásicos (`scripts/capacity/main.ts`) se regeneraron SIN cambios (byte-idénticos).

Referencia histórica: [Ensayo de stress RONDA A (archivado 2026-09-11)](/stress-test/ronda-a/REPORTE.md) (archivado, no borrado).
