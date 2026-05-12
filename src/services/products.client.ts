/**
 * Archivo: servicios cliente para CRUD de juegos.
 */
import { supabaseBrowser } from "../lib/supabaseBrowser";
import type { Product } from "../types/product";

export type ProductInsert = Omit<Product, "created_at" | "updated_at">;
export type ProductUpdate = Partial<ProductInsert>;

export type GameWithDeveloper = Product & {
  developers?: {
    id: string;
    name: string;
  } | null;
};

// Resultado comun para operaciones de servicio.
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

const TABLE_NAME = "games";

/**
 * Lista juegos ordenados por fecha de creacion.
 * No recibe parametros.
 * Devuelve ServiceResult con juegos o error.
 */
export async function getProducts(): Promise<ServiceResult<GameWithDeveloper[]>> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*, developers!games_developer_id_fkey ( id, name )")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene un juego por id.
 * Recibe el id del juego.
 * Devuelve ServiceResult con juego o error.
 */
export async function getProduct(id: string): Promise<ServiceResult<Product>> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Crea un juego nuevo.
 * Recibe payload con datos del juego.
 * Devuelve ServiceResult con juego creado o error.
 */
export async function createProduct(
  payload: ProductInsert
): Promise<ServiceResult<Product>> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Actualiza un juego existente.
 * Recibe id del juego y payload parcial con cambios.
 * Devuelve ServiceResult con juego actualizado o error.
 */
export async function updateProduct(
  id: string,
  payload: ProductUpdate
): Promise<ServiceResult<Product>> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Elimina un juego por id.
 * Recibe el id del juego.
 * Devuelve ServiceResult con true o error.
 */
export async function deleteProduct(id: string): Promise<ServiceResult<true>> {
  const supabase = supabaseBrowser();
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
}
