/**
 * Archivo: servicios cliente para CRUD de productos.
 */
import { supabaseBrowser } from "../lib/supabaseBrowser";
import type { Product } from "../types/product";

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
export type ProductUpdate = Partial<ProductInsert>;

// Resultado comun para operaciones de servicio.
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

const TABLE_NAME = "products";

/**
 * Lista productos ordenados por fecha de creacion.
 * No recibe parametros.
 * Devuelve ServiceResult con productos o error.
 */
export async function getProducts(): Promise<ServiceResult<Product[]>> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Obtiene un producto por id.
 * Recibe el id del producto.
 * Devuelve ServiceResult con producto o error.
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
 * Crea un producto nuevo.
 * Recibe payload con datos del producto.
 * Devuelve ServiceResult con producto creado o error.
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
 * Actualiza un producto existente.
 * Recibe id del producto y payload parcial con cambios.
 * Devuelve ServiceResult con producto actualizado o error.
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
 * Elimina un producto por id.
 * Recibe el id del producto.
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
