/**
 * Archivo: tabla interactiva para listar y gestionar juegos.
 */
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseBrowser";
import {
  deleteProduct,
  getProducts,
  type GameWithDeveloper,
} from "../../services/products.client";
import {
  deleteProductImage,
  getStoragePathFromUrl,
} from "../../services/storage.client";

type ProductTableProps = {
  initialProducts?: GameWithDeveloper[];
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
const formatDate = (value?: string | null) => {
  if (!value) return "-";
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

/**
 * Renderiza la tabla con acciones de editar y borrar.
 * Recibe initialProducts opcional para evitar el fetch inicial.
 * Devuelve JSX con tabla y estados de carga.
 */
export default function ProductTable({
  initialProducts,
}: ProductTableProps) {
  const [products, setProducts] = useState<GameWithDeveloper[]>(
    initialProducts ?? []
  );
  const [loading, setLoading] = useState(initialProducts === undefined);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Carga inicial si no vienen juegos por props.
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
  * Borra un juego despues de confirmar.
  * Recibe product seleccionado.
  * No devuelve valor.
   */
  const deleteRelations = async (gameId: string) => {
    const supabase = supabaseBrowser();
    const { error: genresError } = await supabase
      .from("game_genres")
      .delete()
      .eq("game_id", gameId);

    if (genresError) {
      return genresError.message;
    }

    const { error: platformsError } = await supabase
      .from("game_platforms")
      .delete()
      .eq("game_id", gameId);

    return platformsError?.message ?? null;
  };

  const handleDelete = async (product: GameWithDeveloper) => {
    if (!window.confirm(`Borrar el juego \"${product.name}\"?`)) {
      return;
    }

    setDeletingId(product.id);
    setError(null);

    const relationsError = await deleteRelations(product.id);
    if (relationsError) {
      setError(`No se pudieron borrar las relaciones: ${relationsError}`);
      setDeletingId(null);
      return;
    }

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
          `Juego eliminado, pero la imagen no se pudo borrar: ${imageDeleteError}`
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
            Juegos
          </h1>
          <p className="text-sm text-[var(--ps-muted)]">
            Gestiona el cat&aacute;logo y la informaci&oacute;n de juegos.
          </p>
        </div>
        <a
          href="/admin/new"
          className="rounded-md bg-[var(--ps-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--ps-blue-light)]"
        >
          Crear juego
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
                <th className="px-4 py-3">Juego</th>
                <th className="px-4 py-3">Desarrollador</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Lanzamiento</th>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ps-border)]">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-[var(--ps-muted)]" colSpan={6}>
                    Cargando juegos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[var(--ps-muted)]" colSpan={6}>
                    No hay juegos cargados.
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
                      {product.developers?.name ?? "Sin desarrollador"}
                    </td>
                    <td className="px-4 py-4 font-semibold text-[var(--ps-text)]">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-4 text-[var(--ps-muted)]">
                      {formatDate(product.release_date)}
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
