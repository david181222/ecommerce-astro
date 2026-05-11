/**
 * Archivo: tipos compartidos del dominio producto.
 */

/**
 * Proposito: representa un producto persistido en la base de datos.
 * Campos: id, name, description, price, category, image_url, stock, created_at, updated_at.
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
  created_at: string;
  updated_at: string;
}
