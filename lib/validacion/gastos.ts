/**
 * Esquemas de validacion para gastos.
 *
 * Reflejan exactamente los constraints de la tabla `gastos` en Supabase (ver el SQL
 * de la Fase 8). Validar aca antes de tocar la base es la primera defensa; RLS es
 * la segunda. Las dos existen a proposito, ninguna reemplaza a la otra.
 */

import { z } from "zod";

export const categorias = [
  "comida",
  "transporte",
  "servicios",
  "ocio",
  "otro",
] as const;

export const gastoSchema = z.object({
  descripcion: z.string().min(1).max(200),
  monto: z.number().positive(),
  categoria: z.enum(categorias),
  fecha: z.string().date(), // formato YYYY-MM-DD, como lo espera Postgres
});

export type GastoEntrada = z.infer<typeof gastoSchema>;

/** Forma en que un gasto vuelve desde la base, con los campos que agrega Postgres. */
export const gastoSchemaCompleto = gastoSchema.extend({
  id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  creado_en: z.string(),
});

export type Gasto = z.infer<typeof gastoSchemaCompleto>;
