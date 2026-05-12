/**
 * Archivo: tipos compartidos del dominio games.
 */

/**
 * Representa un juego persistido en la base de datos.
 * Campos: id, name, description, price, image_url, release_date, developer_id, created_at, updated_at.
 */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  release_date: string | null;
  developer_id: string | null;
  created_at: string;
  updated_at: string;
}
