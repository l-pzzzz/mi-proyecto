# Kit de arranque — línea de producción para backend y web

Implementación del documento de automatización, recortada para una sola persona.
Lo que sacamos y por qué está al final.

---

## Orden de implementación

El documento es explícito: el error más común y más caro es saltarse el paso 2.
Respetá el orden aunque tengas ganas de probar lo divertido primero.

### Semana 1 — Contexto y agente interactivo

1. Creá el repo con Next.js y TypeScript en modo `strict`.
2. Copiá `CLAUDE.md` a la raíz y **reescribí las secciones marcadas**. Un archivo de
   contexto genérico no sirve: el valor está en que describa tu proyecto real.
3. Copiá `PLANTILLA-SPEC.md` a `.github/ISSUE_TEMPLATE/tarea.md`.
4. Trabajá dos semanas así, sin automatizar nada más. El objetivo es que descubras
   dónde el agente se equivoca en tu proyecto, porque eso es lo que después vas a
   codificar en reglas.

### Semana 2 y 3 — Tests y CI verde en minutos

**Este es el paso que hace que todo lo demás funcione.** Sin un juez objetivo y
rápido, el agente produce código plausible y nadie sabe si sirve.

1. Configurá Vitest y Playwright.
2. Escribí tests para lo que ya existe. No apuntes a cobertura alta: apuntá a que los
   caminos críticos estén cubiertos.
3. Copiá `.github/workflows/ci.yml`. **Verificá las versiones de las actions** — las
   que están ahí son las conocidas al momento de escribir esto y cambian seguido.
4. Cronometrá el CI. Si pasa de 5 minutos, arreglalo antes de seguir: paralelizá,
   cacheá, o achicá el conjunto de tests de navegador.
5. Protegé `main`: sin push directo, PR obligatorio, CI en verde para poder mergear.

Scripts que el CI espera en tu `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev"
  }
}
```

### Semana 4 — Seguridad y aislamiento

1. `pre-commit install` con el `.pre-commit-config.yaml` incluido.
2. Copiá `seguridad/reglas-propias.yml`. Corré `semgrep` una vez a mano y ajustá las
   reglas que den falsos positivos en tu código.
3. Activá Dependabot en la configuración del repo.
4. Copiá `tests/autorizacion.ejemplo.test.ts` a `tests/autorizacion/` y adaptalo.
5. Conectá Vercel para tener URL de preview en cada PR.

### Después — solo si el cuello de botella pasó a ser escribir código

Agentes en segundo plano, varios agentes en paralelo, revisor automático, gateway de
costos. Hoy tu cuello de botella son los clientes, no los pull requests.

---

## El ciclo, día a día

1. Escribís el issue con la plantilla. Si no podés nombrar el chequeo de cada
   criterio, no lo asignás todavía.
2. Clasificás:
   - **Chica y aislada** → se la das al agente directo.
   - **Mediana** → sesión interactiva, supervisada.
   - **Grande o toca arquitectura** → pedís el plan escrito primero, lo leés, lo
     corregís, y recién ahí implementación. Corregir un párrafo cuesta mucho menos
     que corregir un PR de 800 líneas.
3. El agente trabaja en rama, nunca en `main`.
4. CI corre solo. Si falla, el agente lee el error y vuelve al paso 3. **Acá ocurre
   la automatización real.**
5. Revisás el PR y mergeás.

---

## Archivos incluidos

| Archivo | Dónde va | Qué hace |
|---|---|---|
| `CLAUDE.md` | raíz del repo | Contexto, convenciones y definición de terminado |
| `.github/workflows/ci.yml` | igual | Tipos, lint, tests, build, e2e, gitleaks, semgrep, audit |
| `seguridad/reglas-propias.yml` | igual | Reglas SAST para los fallos del código generado |
| `tests/autorizacion.ejemplo.test.ts` | `tests/autorizacion/` | El punto ciego que ningún escáner detecta |
| `PLANTILLA-SPEC.md` | `.github/ISSUE_TEMPLATE/` | Formato de issue con criterios verificables |
| `.pre-commit-config.yaml` | raíz del repo | Bloquea secretos antes del commit |

---

## Tu punto débil: sos autor y revisor a la vez

Todo el diseño del documento descansa en que quien revisa no sea quien escribió.
Vos vas a ser las dos cosas. No se elimina, se mitiga:

- Revisá el PR **otro día**, con la sesión limpia y sin el contexto de cuando lo pediste.
- Leé el diff completo antes de tocar nada, empezando por los archivos que no
  esperabas que cambiaran.
- Apoyate más en las compuertas automáticas, que no se cansan ni se autoconvencen.
- Cada bug que atrapes en revisión, convertilo en regla de Semgrep o en test. Es la
  única forma de que la revisión no tenga que repetirse.

---

## Qué recortamos del documento original y por qué

| Del documento | Estado | Razón |
|---|---|---|
| Pipeline multi-agente | Fuera | Costo en tokens sin beneficio siendo uno solo |
| Revisor automático (CodeRabbit) | Fuera | Su valor es filtrar antes del humano; acá el humano es uno |
| Gateway de costos, Langfuse | Fuera | El gasto de una persona se controla mirando la factura |
| Devcontainers, VMs efímeras | Fuera | Rama protegida alcanza por ahora |
| Vault / 1Password para secretos | Fuera | Variables de entorno + gitleaks alcanzan |
| DAST nocturno (OWASP ZAP) | Diferido | Agregalo antes de tu primer cliente con datos sensibles |
| Pentest previo a producción | **No se recorta** | Para datos de pacientes o biométricos, nada lo reemplaza |
| Tests de autorización | **No se recorta** | Es el fallo más caro y ningún escáner lo detecta |

---

## Sobre móvil

Nada de esto se tira cuando llegue un trabajo de app. La lógica de negocio y la API
siguen bajo este mismo pipeline; lo que no cierra el bucle solo es la capa nativa
—builds lentos, simuladores, firmas, tiendas—, y ahí el agente trabaja asistido, no
autónomo. En la práctica: el backend de tu app móvil vive acá; la app se desarrolla
al lado, con menos automatización y más ojo.
