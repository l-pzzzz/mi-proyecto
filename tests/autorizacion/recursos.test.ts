/**
 * Tests de autorizacion para /api/gastos.
 *
 * Crea dos usuarios reales contra Supabase (Ana y Beto), le siembra un gasto a
 * Ana, y verifica que Beto nunca lo vea. Usa la Secret key (via createClient con
 * service_role) solo para el setup -- nunca para la peticion que se esta probando,
 * esa va con el token normal del usuario, como en produccion.
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env.local, y
 * el servidor de desarrollo corriendo en TEST_BASE_URL (por defecto localhost:3000).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Usuario = { id: string; token: string; email: string };

async function crearUsuarioDePrueba(prefijo: string): Promise<Usuario> {
  const email = `${prefijo}-${Date.now()}@prueba.local`;
  const password = "PruebaSegura123!";

  const { data: creado, error: errorCreacion } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (errorCreacion || !creado.user) {
    throw new Error(`No se pudo crear usuario de prueba: ${errorCreacion?.message}`);
  }

  const cliente = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: sesion, error: errorLogin } =
    await cliente.auth.signInWithPassword({ email, password });
  if (errorLogin || !sesion.session) {
    throw new Error(`No se pudo iniciar sesion de prueba: ${errorLogin?.message}`);
  }

  return { id: creado.user.id, token: sesion.session.access_token, email };
}

async function borrarUsuarioDePrueba(id: string) {
  await admin.auth.admin.deleteUser(id);
}

async function sembrarGasto(usuario: Usuario) {
  const { data, error } = await admin
    .from("gastos")
    .insert({
      usuario_id: usuario.id,
      descripcion: "Almuerzo de prueba",
      monto: 42,
      categoria: "comida",
      fecha: "2026-08-15",
    })
    .select()
    .single();
  if (error || !data) {
    throw new Error(`No se pudo sembrar el gasto: ${error?.message}`);
  }
  return data;
}

async function pedirGastos(token: string | null) {
  return fetch(`${BASE}/api/gastos`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

let ana: Usuario;
let beto: Usuario;

beforeAll(async () => {
  ana = await crearUsuarioDePrueba("ana");
  beto = await crearUsuarioDePrueba("beto");
  await sembrarGasto(ana);
});

afterAll(async () => {
  await borrarUsuarioDePrueba(ana.id);
  await borrarUsuarioDePrueba(beto.id);
});

describe("GET /api/gastos — autorizacion", () => {
  it("sin sesion responde 401", async () => {
    const r = await pedirGastos(null);
    expect(r.status).toBe(401);
  });

  it("el dueño ve su propio gasto", async () => {
    const r = await pedirGastos(ana.token);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((g: { usuario_id: string }) => g.usuario_id === ana.id)).toBe(true);
  });

  it("un usuario ajeno no ve el gasto de otro", async () => {
    const r = await pedirGastos(beto.token);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.items).toEqual([]);
  });
});