# Guía de seguridad

Dos cosas distintas que se confunden todo el tiempo:

- **Seguridad del proceso** — que el agente no haga daño. Cubierta por el kit base.
- **Seguridad del producto** — que la app entregada no tenga vulnerabilidades.
  **No viene cubierta por defecto.** Es de lo que trata este documento.

---

## 1. Lo que las herramientas sí encuentran

Ponelas, son baratas y no requieren pensar. Ya están en `ci.yml`.

| Qué revisa | Herramienta | Cuándo |
|---|---|---|
| Código propio (SAST) | Semgrep + `reglas-propias.yml` | Cada PR |
| Dependencias (SCA) | Dependabot, `npm audit` | PR + semanal |
| Secretos filtrados | gitleaks | Pre-commit + PR |
| App corriendo (DAST) | OWASP ZAP contra preview | Nocturno |
| Imágenes de contenedor | Trivy | Al construir |
| Móvil (cuando llegue) | MobSF, checklist OWASP MASVS | Antes de subir a tiendas |

## 2. Lo que ninguna herramienta encuentra

Estas tres categorías son las que rompen un sistema con datos sensibles, y las tres
requieren que alguien las piense a propósito.

**Autorización.** El usuario A accede al recurso de B cambiando un ID. El código pasa
tipos, lint, tests funcionales y SAST. Defensa: `tests/autorizacion/`, exigido en el
criterio de aceptación de cada endpoint sensible.

**Lógica de negocio.** Cancelar el turno de otro, marcar asistencia con fecha pasada,
aplicar un descuento negativo. Ninguna herramienta sabe qué es correcto en tu dominio.
Defensa: tests de los casos que no deberían poder pasar.

**Diseño.** Datos sin cifrar, sin registro de auditoría, sin política de retención.
No es un bug: es una decisión que nunca se tomó. Defensa: la checklist de §5.

---

## 3. Los diez fallos del código generado

Ordenados por lo que más veo. Cada vez que uno de estos se te escape a un PR,
convertilo en regla de Semgrep en `reglas-propias.yml`.

1. **Autorización ausente.** El endpoint devuelve lo pedido sin verificar el dueño.
2. **Filtro de inquilino omitido.** En un sistema multi-clínica, una consulta sin
   `where clinicaId` devuelve los datos de todas.
3. **Validación solo en el camino feliz.** Se valida en el formulario y no en el
   servidor. El formulario no es un control de seguridad.
4. **Secreto en el cliente.** En Next.js, cualquier variable `NEXT_PUBLIC_*` termina
   en el bundle del navegador. Una clave de servicio ahí es filtración total.
5. **RLS desactivada en Supabase.** La clave anónima viaja en el navegador; sin Row
   Level Security la base está abierta. Los agentes la desactivan para "que funcione".
6. **Dependencias inventadas.** El agente importa paquetes que no existen y hay
   atacantes que registran esos nombres. Defensa: lockfile, cero dependencias nuevas
   sin aprobación explícita.
7. **Defaults inseguros que se ven bien.** CORS abierto, cookies sin `httpOnly` /
   `secure` / `sameSite`, errores devolviendo el stack al cliente.
8. **Logs con datos personales.** Nombres de pacientes, documentos, tokens. Los logs
   se guardan, se rotan y a veces se comparten con terceros.
9. **Sin límite de intentos en el login.** Fuerza bruta gratis. Tampoco en
   recuperación de contraseña ni en envío de códigos.
10. **Subida de archivos sin validar.** Tipo, tamaño y destino. Crítico en sistemas
    clínicos, donde adjuntar estudios es requisito.

---

## 4. Gate de seguridad por PR

Si el cambio toca **autenticación, permisos, pagos o datos personales**, esta
revisión es obligatoria aunque el CI esté verde. Si no toca nada de eso, saltala.

- [ ] Todo endpoint nuevo llama a `requireUser()` como primera línea
- [ ] Toda consulta filtra por dueño **dentro** del `where`, no comparando después
- [ ] Hay test en `tests/autorizacion/` con usuario ajeno esperando 403 o 404
- [ ] La entrada se valida con Zod en el servidor, no solo en el formulario
- [ ] Ninguna variable nueva `NEXT_PUBLIC_*` contiene un secreto
- [ ] Si hay tabla nueva: RLS activada y política escrita
- [ ] Ninguna dependencia nueva sin aprobar; el lockfile no cambió sin querer
- [ ] Los errores devuelven mensaje genérico; el detalle va al log del servidor
- [ ] Ningún log incluye datos personales, tokens ni contraseñas
- [ ] El diff no toca archivos fuera del alcance del issue

---

## 5. Checklist antes de entregar a un cliente

Esto se hace una vez por proyecto, antes de que el sistema toque datos reales.

**Datos**

- [ ] Cifrado en tránsito (TLS) y en reposo
- [ ] Registro de auditoría: quién consultó o modificó cada expediente, y cuándo
- [ ] Respaldos automáticos, **y una restauración probada de verdad** — un respaldo
      que nunca se restauró no es un respaldo
- [ ] Política de retención: cuánto se guarda y cómo se borra
- [ ] Datos de prueba anonimizados; nunca una copia de producción en desarrollo

**Accesos**

- [ ] Roles definidos con el mínimo privilegio necesario
- [ ] Segundo factor al menos para cuentas administrativas
- [ ] Sesiones con expiración y cierre de sesión funcional
- [ ] **Vos no quedás con credenciales permanentes al terminar.** Si necesitás acceso
      para soporte, que sea una cuenta nominal, revocable y registrada.

**Operación**

- [ ] Entornos separados: desarrollo, pruebas y producción
- [ ] Secretos de producción no están en el repo ni en tu máquina
- [ ] Monitoreo de errores configurado (y sin datos personales en las trazas)
- [ ] Plan de incidente escrito: a quién se avisa, en cuánto tiempo, quién decide

**Contrato**

- [ ] Quién es responsable de los datos y de la infraestructura, por escrito
- [ ] Qué pasa con los datos al terminar la relación
- [ ] Si el pentest **no** está incluido, decirlo explícitamente por escrito
- [ ] Consulta legal sobre protección de datos hecha antes de firmar

---

## 6. Reglas no negociables

- El agente nunca toca producción directamente.
- Nunca corre migraciones fuera de un sandbox con clon anonimizado.
- Tiene identidad propia y revocable, nunca tus credenciales personales.
- Tope de gasto por tarea, con corte automático.
- Cambios en autenticación, pagos, permisos o datos personales exigen la revisión
  de §4 aunque el CI esté verde.
- Para datos clínicos o biométricos: **pentest antes de producción.** Las
  herramientas automáticas encuentran patrones conocidos, no fallas de diseño.

---

## 7. El límite honesto

Todo lo que sale del agente es un borrador hasta que pasó escáneres, tests, revisión
y —para lo crítico— ojo humano especializado. El agente acelera la escritura, no la
responsabilidad.

Y vos vas a ser autor y revisor a la vez, que es exactamente lo que este diseño
supone que no pasa. Mitigalo: revisá en otra sesión y otro día, empezando por los
archivos que no esperabas que cambiaran.
