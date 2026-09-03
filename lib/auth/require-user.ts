/**
 * requireUser() — la primera línea de todo handler bajo app/api/.
 *
 * Por qué existe como archivo propio y no copiado en cada endpoint:
 *
 * 1. Un solo lugar donde se decide qué es una sesión válida. Si mañana cambiás de
 *    proveedor de auth, tocás un archivo.
 * 2. La regla de Semgrep `api-sin-verificacion-de-sesion` busca literalmente esta
 *    llamada. Si cada endpoint improvisa su propia comprobación, la compuerta
 *    automática deja de servir.
 * 3. Lanza en vez de devolver null: si alguien olvida comprobar el resultado, el
 *    pedido falla cerrado (403) en vez de continuar con un usuario indefinido.
 *
 * Adaptalo a tu proveedor de auth. Lo que NO se cambia es la firma ni el nombre.
 */

import { NextResponse } from "next/server";
import { clienteServidor, tokenBearer } from "@/lib/db/cliente";

export type UsuarioAutenticado = {
  id: string;
  email: string;
  rol: string;
  /** En sistemas multi-inquilino, el filtro obligatorio de toda consulta. */
  organizacionId: string | null;
};

/** Error que el manejador de la ruta convierte en respuesta HTTP. */
export class ErrorAutenticacion extends Error {
  constructor(readonly estado: 401 | 403, mensaje: string) {
    super(mensaje);
    this.name = "ErrorAutenticacion";
  }
}

/**
 * Devuelve el usuario de la sesión actual o lanza.
 * Nunca devuelve null: el camino de fallo es una excepción, no un valor.
 */
export async function requireUser(): Promise<UsuarioAutenticado> {
  const supabase = await clienteServidor();
  const token = await tokenBearer();

  // getUser() valida el token contra el servidor de auth.
  // NO usar getSession() acá: lee la cookie sin verificarla.
  // Con Bearer token explícito (scripts, tests, apps) se valida ese; si no,
  // se usa la sesión de la cookie del navegador.
  const { data, error } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ErrorAutenticacion(401, "Sesión ausente o inválida");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, organizacion_id")
    .eq("id", data.user.id)
    .single();

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    rol: perfil?.rol ?? "usuario",
    organizacionId: perfil?.organizacion_id ?? null,
  };
}

/** Igual que requireUser pero además exige un rol. */
export async function requireRol(
  ...rolesPermitidos: string[]
): Promise<UsuarioAutenticado> {
  const usuario = await requireUser();
  if (!rolesPermitidos.includes(usuario.rol)) {
    throw new ErrorAutenticacion(403, "Rol insuficiente");
  }
  return usuario;
}

/**
 * Envoltorio para handlers de ruta. Convierte las excepciones en respuestas y
 * garantiza que el detalle del error nunca llega al cliente.
 *
 *   export const GET = manejar(async (req) => {
 *     const usuario = await requireUser();
 *     ...
 *   });
 */
export function manejar(
  fn: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req) => {
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof ErrorAutenticacion) {
        // Seguro: e.message aca es siempre uno de los strings fijos que definimos
        // arriba (nunca un error crudo del sistema o de la base de datos).
        return NextResponse.json({ error: e.message }, { status: e.estado }); // nosemgrep: seguridad.error-crudo-al-cliente
      }
      // El detalle va al log del servidor, nunca al cliente.
      console.error("Error no manejado", {
        ruta: new URL(req.url).pathname,
        error: e,
      });
      return NextResponse.json(
        { error: "Error interno" },
        { status: 500 },
      );
    }
  };
}
