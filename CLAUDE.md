# Contexto del repositorio

Este archivo lo lee el agente en cada sesión. Es la fuente de verdad sobre cómo se
trabaja aquí. Si algo de lo que sigue queda desactualizado, corregirlo tiene
prioridad sobre cualquier otra tarea.

---

## Qué es este proyecto

<!-- Reemplazar con 3-4 líneas reales. Ejemplo: -->
Sistema de gestión de turnos y expedientes para clínicas. Next.js (App Router) con
Postgres en Supabase. Un solo repositorio: la API vive en `app/api/`, la interfaz
en `app/(app)/`.

**Datos sensibles:** este sistema maneja datos de pacientes. Todo endpoint que lea o
escriba un expediente es crítico. Ver la sección de autorización más abajo.

---

## Stack y versiones

- Node 22, TypeScript en modo `strict`
- Next.js (App Router), React
- Postgres vía Supabase; ORM: Prisma
- Zod para validación de entrada
- Vitest (unitarios e integración), Playwright (navegador)
- ESLint + Prettier

## Comandos

| Para | Comando |
|---|---|
| Instalar | `npm ci` |
| Desarrollo | `npm run dev` |
| Tipos | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests unitarios | `npm test` |
| Un solo test | `npm test -- ruta/al/archivo.test.ts` |
| Tests de navegador | `npm run test:e2e` |
| Build | `npm run build` |
| Migración | `npm run db:migrate` |

**Antes de decir que una tarea está terminada, deben pasar en verde:**
`npm run typecheck && npm run lint && npm test && npm run build`

---

## Estructura

```
app/
  api/          Endpoints. Uno por recurso.
  (app)/        Páginas autenticadas
  (public)/     Páginas públicas
lib/
  auth/         Sesión, requireUser, permisos
  db/           Cliente y consultas
  validacion/   Esquemas Zod, uno por recurso
tests/
  unit/         Lógica pura
  integracion/  Endpoints contra base de datos de prueba
  autorizacion/ OBLIGATORIO. Ver más abajo.
e2e/            Playwright
```

---

## Convenciones

- **Todo endpoint valida su entrada con Zod antes de tocar la base.** Sin excepción.
- **Nunca se consulta la base directamente desde un componente.** Pasa por `lib/db/`.
- Nombres de archivos y carpetas en minúsculas con guiones. Código y comentarios en español.
- Errores: se devuelve un mensaje genérico al cliente y el detalle va al log del servidor.
  **Nunca se devuelve el stack trace ni el mensaje crudo de la base de datos.**
- Nada de `console.log` en código que se mergea. Usar el logger de `lib/log.ts`.
- Los tipos se derivan del esquema Zod (`z.infer`), no se escriben dos veces.

---

## Autorización — la regla más importante

El fallo más frecuente del código generado no es que no funcione: es que funciona
para el usuario equivocado. Un endpoint que devuelve el expediente pedido, sin
comprobar que ese expediente pertenece a quien lo pide, es sintácticamente perfecto
y es una filtración de datos.

**Reglas:**

1. Todo handler bajo `app/api/` empieza llamando a `requireUser()`.
2. Toda consulta que lea o escriba un recurso de un usuario filtra por el dueño en
   la misma consulta. No se trae el registro y después se compara: se filtra en el `where`.
3. **Por cada endpoint sensible nuevo hay un test en `tests/autorizacion/`** que
   intenta acceder con un usuario ajeno y espera 403 o 404. Un endpoint sensible sin
   ese test no está terminado, aunque todo lo demás esté en verde.

---

## Qué hacer y qué no hacer

**Hacer:**

- Antes de una tarea mediana o grande, escribir el plan y esperar aprobación.
- Ejecutar los tests después de cada cambio, no al final.
- Si un test falla, leer el error completo antes de cambiar código.
- Si el criterio de aceptación no es verificable, decirlo y pedir que se reformule
  en vez de adivinar.

**No hacer:**

- No agregar dependencias nuevas sin preguntar. Si una importación no existe en
  `package.json`, no inventarla: preguntar.
- No modificar archivos fuera del alcance de la tarea pedida.
- No tocar migraciones ni ejecutarlas contra ninguna base que no sea la local de prueba.
- No relajar reglas de ESLint, TypeScript o tests para hacer pasar el CI. Si algo no
  pasa, el problema es el código.
- No escribir a `main`. Siempre rama y pull request.
- No leer ni escribir archivos `.env*`.

---

## Definición de terminado

Una tarea está terminada cuando:

- [ ] Typecheck, lint, tests unitarios y build pasan
- [ ] Hay test para el caso feliz y para al menos un caso de error
- [ ] Si el endpoint es sensible: hay test de autorización con usuario ajeno
- [ ] La entrada se valida con Zod
- [ ] No hay dependencias nuevas sin aprobar
- [ ] El diff no toca nada fuera del alcance pedido
