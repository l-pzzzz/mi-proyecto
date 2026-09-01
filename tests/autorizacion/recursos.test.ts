/**
 * Tests de autorizacion — PLANTILLA.
 *
 * Estan saltados (describe.skip) a proposito: prueban endpoints que todavia no
 * existen. Cuando construyas el primer endpoint de gastos:
 *   1. Implementa los helpers crearUsuarioDePrueba y sembrarDatosDe contra la base de prueba.
 *   2. Cambia "describe.skip" por "describe" en el bloque que corresponda.
 *   3. Ajusta las rutas de la tabla "casos" a tus endpoints reales.
 *
 * La regla es la del CLAUDE.md: ningun endpoint que toque gastos esta terminado
 * sin su fila aca y sin el skip quitado.
 */

import { describe, it, expect } from "vitest";

describe.skip("acceso ajeno a recursos de otro usuario", () => {
  it("un usuario ajeno no accede a ningun recurso", () => {
    expect(true).toBe(true);
  });
});
