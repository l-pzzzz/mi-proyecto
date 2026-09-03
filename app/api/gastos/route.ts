import { requireUser, manejar } from "@/lib/auth/require-user";
import { clienteServidor } from "@/lib/db/cliente";
import { NextResponse } from "next/server";

/**
 * GET /api/gastos — lista los gastos del usuario autenticado.
 *
 * Dos capas de defensa, a proposito:
 * 1. requireUser() exige sesion antes de cualquier otra cosa.
 * 2. El filtro .eq("usuario_id", usuario.id) va DENTRO de la consulta, no se
 *    trae todo y se compara despues. Aunque RLS en Supabase ya bloquearia el
 *    acceso ajeno, esta linea es la que hace explicito el contrato en el codigo
 *    y la que el test de autorizacion verifica.
 */
export const GET = manejar(async () => {
  const usuario = await requireUser();
  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .eq("usuario_id", usuario.id)
    .order("fecha", { ascending: false });

  if (error) {
    // El detalle va al log del servidor via el catch de manejar(); relanzamos
    // como error generico para no filtrar estructura de la base al cliente.
    throw new Error("No se pudo leer los gastos");
  }

  return NextResponse.json({ items: data });
});
