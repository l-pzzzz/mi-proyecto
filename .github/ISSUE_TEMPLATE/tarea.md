# Plantilla de especificación

Copiá esto en cada issue. Es el único paso del proceso que hace un humano al inicio,
y si sale mal, todo lo que viene después es ruido caro.

**Regla de admisión:** si no podés nombrar el chequeo concreto que declara aprobado
cada criterio, el issue no está listo para asignarse. No lo asignes igual.

---

## Qué se quiere

Una o dos frases sobre el problema real. Del lado del usuario, no de la implementación.

> Ejemplo: la recepcionista pierde tiempo buscando el turno del paciente porque solo
> puede filtrar por fecha exacta.

## Alcance

**Incluye:**
-

**No incluye:** (esto importa tanto como lo anterior — es lo que evita que el diff crezca)
-

## Criterios de aceptación

Cada uno con su chequeo. Formato: *criterio observable → con qué se comprueba*.

| # | Criterio | Con qué se comprueba |
|---|---|---|
| 1 | Buscar por nombre parcial devuelve los turnos de los últimos 90 días | Test de integración con dataset fijo en `tests/integracion/busqueda.test.ts` |
| 2 | El listado responde en menos de 400 ms p95 con 2.000 turnos | Medición en CI con dataset sembrado |
| 3 | La búsqueda solo devuelve turnos de la clínica del usuario | Test en `tests/autorizacion/` con usuario de otra clínica |
| 4 | Si la base tarda más de 3 s, se devuelve 503 y se registra en el log | Test de integración con la base mockeada lenta |

## Autorización

- [ ] ¿Este cambio toca un recurso que pertenece a un usuario? Si sí, hay una fila
      nueva en `tests/autorizacion/`.
- [ ] ¿Toca autenticación, pagos, permisos o datos personales? Si sí, exige revisión
      humana de seguridad aunque el CI esté verde.

## Riesgo y reversibilidad

- ¿Hay migración de base? Si sí, ¿es reversible?
- ¿Va detrás de feature flag?
- Si sale mal en producción, ¿cómo se revierte?

---

## Los tres vicios que invalidan un criterio

1. **Adjetivo sin medida** — "rápido", "intuitivo", "robusto", "escalable".
2. **Describir la implementación en vez del resultado** — "usar Redis" es una
   decisión de diseño, no un criterio de aceptación.
3. **El "y que funcione bien" implícito** al final de la lista.

## Cuando el resultado no es determinista

Si lo produce un modelo (redactar, clasificar, resumir), no aplica test de igualdad.
El criterio es un eval con umbral sobre un conjunto canónico, fijado **antes** de
implementar:

> Sobre los 40 casos de `evals/clasificacion.json`, acierta ≥92% y nunca devuelve
> datos personales en el resumen.
