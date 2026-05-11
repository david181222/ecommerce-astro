/**
 * Archivo: tabla interactiva para listar y gestionar productos.
 */
import { useEffect, useState } from "react";
import type { Product } from "../../types/product";
import { deleteProduct, getProducts } from "../../services/products.client";
import { deleteProductImage } from "../../services/storage.client";

type ProductTableProps = {
  initialProducts?: Product[];
};

/**
 * Formatea el precio para la UI.
 * Recibe value numero.
 * Devuelve string con formato moneda.
 */
const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

/**
 * Formatea fechas de ISO a texto corto.
 * Recibe value string fecha.
 * Devuelve string con fecha legible o "-".
 */
const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const STORAGE_PUBLIC_PREFIX = "/storage/v1/object/public/product-images/";

const getStoragePathFromUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const index = url.pathname.indexOf(STORAGE_PUBLIC_PREFIX);
    if (index === -1) return null;
    return url.pathname.slice(index + STORAGE_PUBLIC_PREFIX.length);
  } catch {
    return null;
  }
};

/**
 * Renderiza la tabla con acciones de editar y borrar.
 * Recibe initialProducts opcional para evitar el fetch inicial.
 * Devuelve JSX con tabla y estados de carga.
 */
export default function ProductTable({
  initialProducts,
}: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(initialProducts === undefined);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Carga inicial si no vienen productos por props.
  useEffect(() => {
    if (initialProducts !== undefined) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      const { data, error: loadError } = await getProducts();
      if (!isMounted) return;

      if (loadError) {
        setError(loadError);
        setLoading(false);
        return;
      }

      setProducts(data ?? []);
      setLoading(false);
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [initialProducts]);

  /**
   * Borra un producto despues de confirmar.
   * Recibe product seleccionado.
   * No devuelve valor.
   */
  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Borrar \"${product.name}\"?`)) {
      return;
    }

    setDeletingId(product.id);
    setError(null);

    const { error: deleteError } = await deleteProduct(product.id);

    if (deleteError) {
      setError(deleteError);
      setDeletingId(null);
      return;
    }

    const imagePath = getStoragePathFromUrl(product.image_url);
    if (imagePath) {
      const { error: imageDeleteError } = await deleteProductImage(imagePath);
      if (imageDeleteError) {
        setError(
          `Producto eliminado, pero la imagen no se pudo borrar: ${imageDeleteError}`
        );
      }
    }

    setProducts((prev) => prev.filter((item) => item.id !== product.id));
    setDeletingId(null);
  };

  /**
   * Navega a la vista de edicion con query param.
   * Recibe product seleccionado.
   * No devuelve valor.
   */
  const handleEdit = (product: Product) => {
    const query = new URLSearchParams({ id: product.id });
    window.location.href = `/admin/edit?${query.toString()}`;
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ps-text)]">
            Productos
          </h1>
          <p className="text-sm text-[var(--ps-muted)]">
            Gestiona el catalogo y el stock desde aqui.
          </p>
        </div>
        <a
          href="/admin/new"
          className="rounded-md bg-[var(--ps-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--ps-blue-light)]"
        >
          Crear producto
        </a>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--ps-surface-2)] text-xs uppercase tracking-wide text-[var(--ps-muted)]">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ps-border)]">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-[var(--ps-muted)]" colSpan={6}>
                    Cargando productos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[var(--ps-muted)]" colSpan={6}>
                    No hay productos cargados.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-11 w-11 rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--ps-surface-2)] text-[10px] text-[var(--ps-muted)]">
                            Sin imagen
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[var(--ps-text)]">
                            {product.name}
                          </p>
                          <p className="text-xs text-[var(--ps-muted)]">
                            {product.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[var(--ps-muted)]">
                      {product.category}
                    </td>
                    <td className="px-4 py-4 font-semibold text-[var(--ps-text)]">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-4 text-[var(--ps-muted)]">
                      {product.stock}
                    </td>
                    <td className="px-4 py-4 text-[var(--ps-muted)]">
                      {formatDate(product.updated_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-md border border-[var(--ps-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ps-text)] transition hover:border-[var(--ps-blue)]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product.id}
                          className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === product.id ? "Borrando..." : "Borrar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
