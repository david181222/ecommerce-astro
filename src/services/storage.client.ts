/**
 * Archivo: servicios cliente para storage de imagenes.
 */
import { supabaseBrowser } from "../lib/supabaseBrowser";

export type UploadResult = {
  data: {
    path: string;
    publicUrl: string;
  } | null;
  error: string | null;
};

export type DeleteResult = {
  data: true | null;
  error: string | null;
};

const BUCKET_NAME = "product-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const STORAGE_PUBLIC_PREFIX = "/storage/v1/object/public/product-images/";

/**
 * Normaliza nombres de archivo para paths consistentes.
 * Recibe filename original.
 * Devuelve filename en minusculas y sin espacios.
 */
function normalizeFilename(filename: string): string {
  return filename.trim().replace(/\s+/g, "-").toLowerCase();
}

/**
 * Obtiene el path del bucket a partir de una URL publica.
 * Recibe imageUrl publica.
 * Devuelve path relativo o null si no coincide.
 */
export function getStoragePathFromUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const index = url.pathname.indexOf(STORAGE_PUBLIC_PREFIX);
    if (index === -1) return null;
    return url.pathname.slice(index + STORAGE_PUBLIC_PREFIX.length);
  } catch {
    return null;
  }
}

/**
 * Sube imagen de juego y devuelve URL publica.
 * Recibe file de imagen y productId para el path.
 * Devuelve UploadResult con path y publicUrl o error.
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<UploadResult> {
  // Validaciones basicas del archivo en cliente.
  if (!file.type.startsWith("image/")) {
    return { data: null, error: "Only image files are allowed." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { data: null, error: "Image must be smaller than 5MB." };
  }

  const supabase = supabaseBrowser();
  const filename = normalizeFilename(file.name);
  const path = `${productId}/${Date.now()}-${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { data: null, error: uploadError.message };
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    data: {
      path,
      publicUrl: publicData.publicUrl,
    },
    error: null,
  };
}

/**
 * Elimina una imagen del bucket por path.
 * Recibe path completo en el bucket.
 * Devuelve DeleteResult con true o error.
 */
export async function deleteProductImage(path: string): Promise<DeleteResult> {
  const supabase = supabaseBrowser();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
}
