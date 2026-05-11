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

/**
 * Normaliza nombres de archivo para paths consistentes.
 * Recibe filename original.
 * Devuelve filename en minusculas y sin espacios.
 */
function normalizeFilename(filename: string): string {
  return filename.trim().replace(/\s+/g, "-").toLowerCase();
}

/**
 * Sube imagen de producto y devuelve URL publica.
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
