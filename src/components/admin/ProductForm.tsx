/**
 * Archivo: formulario controlado para crear y editar productos.
 */
import { useEffect, useState } from "react";
import type { Product } from "../../types/product";
import {
  createProduct,
  getProduct,
  updateProduct,
  type ProductInsert,
  type ProductUpdate,
} from "../../services/products.client";
import { uploadProductImage } from "../../services/storage.client";
import ImageUploader from "./ImageUploader";

type FormState = {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  imageUrl: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "",
  imageUrl: "",
};

/**
 * Crea o edita productos con estados de feedback.
 * No recibe parametros.
 * Devuelve JSX con formulario y alerts.
 */
export default function ProductForm() {
  const [productId, setProductId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = Boolean(productId);

  // Lee el id desde la URL para activar el modo edicion.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setProductId(id);
    }
  }, []);

  // Carga el producto cuando hay id.
  useEffect(() => {
    if (!productId) return;

    let isMounted = true;

    const loadProduct = async () => {
      setLoadingProduct(true);
      setError(null);
      setSuccess(null);

      const { data, error: loadError } = await getProduct(productId);

      if (!isMounted) return;

      if (loadError || !data) {
        setError(loadError ?? "Producto no encontrado.");
        setLoadingProduct(false);
        return;
      }

      setForm({
        name: data.name,
        description: data.description ?? "",
        price: String(data.price ?? ""),
        category: data.category ?? "",
        stock: String(data.stock ?? ""),
        imageUrl: data.image_url ?? "",
      });

      setLoadingProduct(false);
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  /**
   * Actualiza el estado del formulario por campo.
   * Recibe field a actualizar y event del input.
   * No devuelve valor.
   */
  const handleChange = (
    field: keyof FormState
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setSuccess(null);
  };

  /**
   * Valida datos del formulario antes de guardar.
   * No recibe parametros.
   * Devuelve string con error o null.
   */
  const validate = () => {
    const name = form.name.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      return "El nombre es obligatorio.";
    }
    if (!category) {
      return "La categoria es obligatoria.";
    }
    if (Number.isNaN(price) || price < 0) {
      return "Precio invalido.";
    }
    if (Number.isNaN(stock) || stock < 0) {
      return "Stock invalido.";
    }

    return null;
  };

  /**
   * Sube imagen si existe y devuelve URL final.
   * Recibe id del producto para el path.
   * Devuelve objeto con imageUrl y error.
   */
  const persistImage = async (id: string) => {
    if (!imageFile) {
      return { imageUrl: form.imageUrl, error: null } as const;
    }

    const upload = await uploadProductImage(imageFile, id);
    if (upload.error || !upload.data) {
      return {
        imageUrl: form.imageUrl,
        error: upload.error ?? "No se pudo subir la imagen.",
      } as const;
    }

    return { imageUrl: upload.data.publicUrl, error: null } as const;
  };

  /**
   * Crea o actualiza producto segun el modo.
   * Recibe event del submit.
   * No devuelve valor.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payloadBase = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      stock: Number(form.stock),
    };

    setLoading(true);

    if (productId) {
      const imageResult = await persistImage(productId);
      if (imageResult.error) {
        setError(imageResult.error);
        setLoading(false);
        return;
      }

      const updatePayload: ProductUpdate = {
        ...payloadBase,
        image_url: imageResult.imageUrl,
      };

      const { error: updateError } = await updateProduct(
        productId,
        updatePayload
      );

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      setForm((prev) => ({ ...prev, imageUrl: imageResult.imageUrl }));
      setImageFile(null);
      setSuccess("Producto actualizado.");
      setLoading(false);
      return;
    }

    const createPayload: ProductInsert = {
      ...payloadBase,
      image_url: form.imageUrl,
    };

    const { data: created, error: createError } = await createProduct(
      createPayload
    );

    if (createError || !created) {
      setError(createError ?? "No se pudo crear el producto.");
      setLoading(false);
      return;
    }

    let finalImageUrl = form.imageUrl;
    if (imageFile) {
      const imageResult = await persistImage(created.id);
      if (imageResult.error) {
        setError(imageResult.error);
        setLoading(false);
        return;
      }

      finalImageUrl = imageResult.imageUrl;
      const { error: updateError } = await updateProduct(created.id, {
        image_url: finalImageUrl,
      });

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }
    }

    setProductId(created.id);
    setForm((prev) => ({ ...prev, imageUrl: finalImageUrl }));
    setImageFile(null);
    setSuccess("Producto creado.");
    setLoading(false);
  };

  if (loadingProduct) {
    return (
      <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-sm text-[var(--ps-muted)]">
        Cargando producto...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ps-text)]">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h1>
          <p className="text-sm text-[var(--ps-muted)]">
            Completa la informacion basica y sube una imagen.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--ps-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--ps-blue-light)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase text-[var(--ps-muted)]">
            Nombre
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              className="mt-2 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface-2)] px-4 py-3 text-sm text-[var(--ps-text)] outline-none transition focus:border-[var(--ps-blue-light)]"
              placeholder="Nombre del producto"
              required
            />
          </label>

          <label className="block text-xs font-semibold uppercase text-[var(--ps-muted)]">
            Categoria
            <input
              type="text"
              value={form.category}
              onChange={handleChange("category")}
              className="mt-2 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface-2)] px-4 py-3 text-sm text-[var(--ps-text)] outline-none transition focus:border-[var(--ps-blue-light)]"
              placeholder="Categoria"
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-xs font-semibold uppercase text-[var(--ps-muted)]">
              Precio
              <input
                type="number"
                inputMode="decimal"
                value={form.price}
                onChange={handleChange("price")}
                className="mt-2 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface-2)] px-4 py-3 text-sm text-[var(--ps-text)] outline-none transition focus:border-[var(--ps-blue-light)]"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </label>

            <label className="block text-xs font-semibold uppercase text-[var(--ps-muted)]">
              Stock
              <input
                type="number"
                inputMode="numeric"
                value={form.stock}
                onChange={handleChange("stock")}
                className="mt-2 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface-2)] px-4 py-3 text-sm text-[var(--ps-text)] outline-none transition focus:border-[var(--ps-blue-light)]"
                placeholder="0"
                min="0"
                step="1"
                required
              />
            </label>
          </div>

          <label className="block text-xs font-semibold uppercase text-[var(--ps-muted)]">
            Descripcion
            <textarea
              value={form.description}
              onChange={handleChange("description")}
              className="mt-2 min-h-[140px] w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface-2)] px-4 py-3 text-sm text-[var(--ps-text)] outline-none transition focus:border-[var(--ps-blue-light)]"
              placeholder="Describe el producto"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--ps-muted)]">
              Imagen
            </p>
            <ImageUploader
              value={imageFile}
              imageUrl={form.imageUrl}
              onChange={(file) => {
                setImageFile(file);
                setSuccess(null);
              }}
            />
          </div>
          {isEditing ? (
            <div className="rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface-2)] p-4 text-xs text-[var(--ps-muted)]">
              ID: {productId}
            </div>
          ) : null}
        </div>
      </div>
    </form>
  );
}
