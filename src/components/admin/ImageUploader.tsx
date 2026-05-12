/**
 * Archivo: uploader con drag and drop y preview.
 */
import { useEffect, useRef, useState } from "react";

type ImageUploaderProps = {
  value: File | null;
  imageUrl?: string | null;
  onChange: (file: File | null) => void;
};

/**
 * Selecciona y previsualiza imagenes de juego.
 * Recibe value actual, imageUrl opcional y onChange callback.
 * Devuelve JSX con area de carga y preview.
 */
export default function ImageUploader({
  value,
  imageUrl,
  onChange,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Genera un preview temporal cuando se selecciona un archivo.
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(value);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [value]);

  /**
   * Notifica el archivo seleccionado.
   * Recibe file seleccionado o null.
   * No devuelve valor.
   */
  const handleFile = (file: File | null) => {
    if (!file) {
      setError(null);
      onChange(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten im\u00e1genes.");
      onChange(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("M\u00e1ximo 5MB por imagen.");
      onChange(null);
      return;
    }

    setError(null);
    onChange(file);
  };

  /**
   * Maneja drop de archivos desde el navegador.
   * Recibe event de drag and drop.
   * No devuelve valor.
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    if (file) {
      handleFile(file);
    }
  };

  const activeImage = previewUrl || imageUrl || "";

  return (
    <div className="space-y-3">
      <div
        className={`flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center transition ${
          isDragging
            ? "border-[var(--ps-blue)] bg-[var(--ps-surface-2)]"
            : "border-[var(--ps-border)] bg-[var(--ps-surface)]"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
      >
        {activeImage ? (
          <img
            src={activeImage}
            alt="Preview"
            className="h-32 w-32 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-[var(--ps-surface-2)] text-xs text-[var(--ps-muted)]">
            Sin imagen
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-[var(--ps-text)]">
            Arrastra una imagen o haz click para seleccionar
          </p>
          <p className="text-xs text-[var(--ps-muted)]">
            PNG, JPG o WEBP. Max 5MB.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-[var(--ps-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ps-text)] transition hover:border-[var(--ps-blue)]"
        >
          Seleccionar archivo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
      </div>
      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-2 text-xs text-[var(--ps-muted)]">
          <span className="truncate">{value.name}</span>
          <button
            type="button"
            onClick={() => handleFile(null)}
            className="text-red-200 transition hover:text-red-100"
          >
            Quitar
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
