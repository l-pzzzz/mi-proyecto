/**
 * Cliente de Supabase para el servidor (Server Components, Route Handlers).
 *
 * Un solo lugar donde se construye el cliente. require-user.ts y cualquier
 * endpoint que necesite hablarle a la base importan de aca, en vez de cada uno
 * armar su propia instancia.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

/**
 * Si el pedido trae "Authorization: Bearer <token>", lo devuelve. Sirve para
 * clientes que no son el navegador: scripts, apps moviles, tests automatizados.
 * El navegador usa cookies de sesion en su lugar y esto devuelve null.
 */
export async function tokenBearer(): Promise<string | null> {
  const cabeceras = await headers();
  const auth = cabeceras.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function clienteServidor() {
  const almacen = await cookies();
  const token = await tokenBearer();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) =>
              almacen.set(name, value, options),
            );
          } catch {
            // Los Server Components no pueden escribir cookies. El middleware
            // se encarga de refrescar la sesion.
          }
        },
      },
      // PostgREST decide auth.uid() (y por lo tanto RLS) segun este header en
      // cada consulta. El navegador no lo manda -- usa la cookie de sesion.
      ...(token
        ? { global: { headers: { Authorization: `Bearer ${token}` } } }
        : {}),
    },
  );
}