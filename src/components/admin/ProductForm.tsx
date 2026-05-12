/**
 * Archivo: formulario controlado para crear y editar juegos.
 */
import { useEffect, useRef, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
  type ProductInsert,
  type ProductUpdate,
} from "../../services/products.client";
import {
  deleteProductImage,
  getStoragePathFromUrl,
  uploadProductImage,
} from "../../services/storage.client";
import { supabaseBrowser } from "../../lib/supabaseBrowser";
import ImageUploader from "./ImageUploader";

type Developer = {
  id: string;
  name: string;
};

type Genre = {
  id: string;
  name: string;
};

type Platform = {
  id: string;
  name: string;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  releaseDate: string;
  developerId: string;
  imageUrl: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  releaseDate: "",
  developerId: "",
  imageUrl: "",
};

const emptyRelations = {
  genreIds: [] as string[],
  platformIds: [] as string[],
};

/**
 * Crea o edita juegos con estados de feedback.
 * No recibe parametros.
 * Devuelve JSX con formulario y alerts.
 */
export default function ProductForm() {
  const [productId, setProductId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const originalRelationsRef = useRef(emptyRelations);

  const isEditing = Boolean(productId);

  // Lee el id desde la URL para activar el modo edicion.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setProductId(id);
    }
  }, []);

  const loadReferenceData = async () => {
    setLoadingRefs(true);
    const supabase = supabaseBrowser();

    const [developersRes, genresRes, platformsRes] = await Promise.all([
      supabase.from("developers").select("id, name").order("name"),
      supabase.from("genres").select("id, name").order("name"),
      supabase.from("platforms").select("id, name").order("name"),
    ]);

    if (developersRes.error) {
      setError(developersRes.error.message);
      setLoadingRefs(false);
      return;
    }

    if (genresRes.error) {
      setError(genresRes.error.message);
      setLoadingRefs(false);
      return;
    }

    if (platformsRes.error) {
      setError(platformsRes.error.message);
      setLoadingRefs(false);
      return;
    }

    setDevelopers(developersRes.data ?? []);
    setGenres(genresRes.data ?? []);
    setPlatforms(platformsRes.data ?? []);
    setLoadingRefs(false);
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  // Carga el juego cuando hay id.
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
        setError(loadError ?? "Juego no encontrado.");
        setLoadingProduct(false);
        return;
      }

      setForm({
        name: data.name,
        description: data.description ?? "",
        price: String(data.price ?? ""),
        releaseDate: data.release_date ?? "",
        developerId: data.developer_id ?? "",
        imageUrl: data.image_url ?? "",
      });

      const supabase = supabaseBrowser();
      const [genresRes, platformsRes] = await Promise.all([
        supabase
          .from("game_genres")
          .select("genre_id")
          .eq("game_id", productId),
        supabase
          .from("game_platforms")
          .select("platform_id")
          .eq("game_id", productId),
      ]);

      if (!isMounted) return;

      if (genresRes.error || platformsRes.error) {
        setError(
          genresRes.error?.message ?? platformsRes.error?.message ?? "Error."
        );
        setLoadingProduct(false);
        return;
      }

      const genreIds = (genresRes.data ?? []).map((row) => row.genre_id);
      const platformIds = (platformsRes.data ?? []).map(
        (row) => row.platform_id
      );

      setSelectedGenres(genreIds);
      setSelectedPlatforms(platformIds);
      originalRelationsRef.current = { genreIds, platformIds };

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
  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setSuccess(null);
    };

  const toggleSelection = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value]
    );
    setSuccess(null);
  };

  /**
   * Valida datos del formulario antes de guardar.
   * No recibe parametros.
   * Devuelve string con error o null.
   */
  const validate = () => {
    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) {
      return "El nombre es obligatorio.";
    }
    if (!form.developerId) {
      return "Selecciona un desarrollador.";
    }
    if (Number.isNaN(price) || price < 0) {
      return "Precio inv\u00e1lido.";
    }

    return null;
  };

  const normalizeNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  const uploadImageIfNeeded = async (id: string) => {
    if (!imageFile) {
      return { imageUrl: form.imageUrl, imagePath: null, error: null } as const;
    }

    const upload = await uploadProductImage(imageFile, id);
    if (upload.error || !upload.data) {
      return {
        imageUrl: form.imageUrl,
        imagePath: null,
        error: upload.error ?? "No se pudo subir la imagen.",
      } as const;
    }

    return {
      imageUrl: upload.data.publicUrl,
      imagePath: upload.data.path,
      error: null,
    } as const;
  };

  const restoreRelations = async (gameId: string) => {
    const supabase = supabaseBrowser();
    await supabase.from("game_genres").delete().eq("game_id", gameId);
    await supabase.from("game_platforms").delete().eq("game_id", gameId);

    if (originalRelationsRef.current.genreIds.length > 0) {
      await supabase.from("game_genres").insert(
        originalRelationsRef.current.genreIds.map((genreId) => ({
          game_id: gameId,
          genre_id: genreId,
        }))
      );
    }

    if (originalRelationsRef.current.platformIds.length > 0) {
      await supabase.from("game_platforms").insert(
        originalRelationsRef.current.platformIds.map((platformId) => ({
          game_id: gameId,
          platform_id: platformId,
        }))
      );
    }
  };

  const syncRelations = async (gameId: string, allowRestore: boolean) => {
    const supabase = supabaseBrowser();

    const { error: deleteGenresError } = await supabase
      .from("game_genres")
      .delete()
      .eq("game_id", gameId);

    if (deleteGenresError) {
      return deleteGenresError.message;
    }

    const { error: deletePlatformsError } = await supabase
      .from("game_platforms")
      .delete()
      .eq("game_id", gameId);

    if (deletePlatformsError) {
      return deletePlatformsError.message;
    }

    if (selectedGenres.length > 0) {
      const { error } = await supabase.from("game_genres").insert(
        selectedGenres.map((genreId) => ({
          game_id: gameId,
          genre_id: genreId,
        }))
      );

      if (error) {
        if (allowRestore) {
          await restoreRelations(gameId);
        }
        return error.message;
      }
    }

    if (selectedPlatforms.length > 0) {
      const { error } = await supabase.from("game_platforms").insert(
        selectedPlatforms.map((platformId) => ({
          game_id: gameId,
          platform_id: platformId,
        }))
      );

      if (error) {
        if (allowRestore) {
          await restoreRelations(gameId);
        }
        return error.message;
      }
    }

    return null;
  };

  /**
   * Crea o actualiza juego segun el modo.
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
      description: normalizeNullable(form.description),
      price: Number(form.price),
      release_date: form.releaseDate || null,
      developer_id: form.developerId || null,
    };

    setLoading(true);

    if (productId) {
      const previousImageUrl = form.imageUrl;
      const imageResult = await uploadImageIfNeeded(productId);
      if (imageResult.error) {
        setError(imageResult.error);
        setLoading(false);
        return;
      }

      const updatePayload: ProductUpdate = {
        ...payloadBase,
        image_url: imageResult.imageUrl || null,
      };

      const { error: updateError } = await updateProduct(
        productId,
        updatePayload
      );

      if (updateError) {
        if (imageResult.imagePath) {
          await deleteProductImage(imageResult.imagePath);
        }
        setError(updateError);
        setLoading(false);
        return;
      }

      const relationsError = await syncRelations(productId, true);
      if (relationsError) {
        setError(`Relaciones no guardadas: ${relationsError}`);
        setLoading(false);
        return;
      }

      if (imageResult.imagePath && previousImageUrl) {
        const previousPath = getStoragePathFromUrl(previousImageUrl);
        if (previousPath) {
          await deleteProductImage(previousPath);
        }
      }

      setForm((prev) => ({ ...prev, imageUrl: imageResult.imageUrl }));
      originalRelationsRef.current = {
        genreIds: selectedGenres,
        platformIds: selectedPlatforms,
      };
      setImageFile(null);
      setSuccess("Juego actualizado.");
      setLoading(false);
      return;
    }

    const newId = crypto.randomUUID();
    const imageResult = await uploadImageIfNeeded(newId);
    if (imageResult.error) {
      setError(imageResult.error);
      setLoading(false);
      return;
    }

    const createPayload: ProductInsert = {
      id: newId,
      ...payloadBase,
      image_url: imageResult.imageUrl || null,
    };

    const { error: createError } = await createProduct(createPayload);

    if (createError) {
      if (imageResult.imagePath) {
        await deleteProductImage(imageResult.imagePath);
      }
      setError(createError ?? "No se pudo crear el juego.");
      setLoading(false);
      return;
    }

    const relationsError = await syncRelations(newId, false);
    if (relationsError) {
      const supabase = supabaseBrowser();
      await supabase.from("game_genres").delete().eq("game_id", newId);
      await supabase.from("game_platforms").delete().eq("game_id", newId);
      await deleteProduct(newId);
      if (imageResult.imagePath) {
        await deleteProductImage(imageResult.imagePath);
      }
      setError(`Relaciones no guardadas: ${relationsError}`);
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  };

  if (loadingProduct || loadingRefs) {
    return (
      <div className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 text-sm text-[var(--ps-muted)]">
        Cargando datos...
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
            {isEditing ? "Editar juego" : "Nuevo juego"}
          </h1>
          <p className="text-sm text-[var(--ps-muted)]">
            Completa la informaci&oacute;n b&aacute;sica y sube una imagen.
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
              placeholder="Nombre del juego"
              required
            />
          </label>

          <label className="block text-xs font-semibold uppercase text-[var(--ps-muted)]">
            Desarrollador
            <select
              value={form.developerId}
              onChange={handleChange("developerId")}
              className="mt-2 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface-2)] px-4 py-3 text-sm text-[var(--ps-text)] outline-none transition focus:border-[var(--ps-blue-light)]"
              required
            >
              <option value="">Selecciona un desarrollador</option>
              {developers.map((developer) => (
                <option key={developer.id} value={developer.id}>
                  {developer.name}
                </option>
              ))}
            </select>
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
              Fecha de lanzamiento
              <input
                type="date"
                value={form.releaseDate}
                onChange={handleChange("releaseDate")}
                className="mt-2 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface-2)] px-4 py-3 text-sm text-[var(--ps-text)] outline-none transition focus:border-[var(--ps-blue-light)]"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold uppercase text-[var(--ps-muted)]">
            Descripci&oacute;n
            <textarea
              value={form.description}
              onChange={handleChange("description")}
              className="mt-2 min-h-[140px] w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface-2)] px-4 py-3 text-sm text-[var(--ps-text)] outline-none transition focus:border-[var(--ps-blue-light)]"
              placeholder="Describe el juego"
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

          <div className="rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface-2)] p-4">
            <p className="text-xs font-semibold uppercase text-[var(--ps-muted)]">
              G&eacute;neros
            </p>
            <div className="mt-3 grid gap-2 text-sm text-[var(--ps-text)] sm:grid-cols-2">
              {genres.length === 0 ? (
                <span className="text-xs text-[var(--ps-muted)]">
                  Sin g&eacute;neros disponibles.
                </span>
              ) : (
                genres.map((genre) => (
                  <label key={genre.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre.id)}
                      onChange={() => toggleSelection(genre.id, setSelectedGenres)}
                    />
                    <span>{genre.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface-2)] p-4">
            <p className="text-xs font-semibold uppercase text-[var(--ps-muted)]">
              Plataformas
            </p>
            <div className="mt-3 grid gap-2 text-sm text-[var(--ps-text)] sm:grid-cols-2">
              {platforms.length === 0 ? (
                <span className="text-xs text-[var(--ps-muted)]">
                  Sin plataformas disponibles.
                </span>
              ) : (
                platforms.map((platform) => (
                  <label key={platform.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={() =>
                        toggleSelection(platform.id, setSelectedPlatforms)
                      }
                    />
                    <span>{platform.name}</span>
                  </label>
                ))
              )}
            </div>
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
