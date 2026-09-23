"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function useUpload() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: File[]): Promise<string[]> {
    setError(null);

    // Checked here as well as on the server so the admin gets an instant answer
    // instead of waiting for a large file to travel before being rejected.
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        setError("Підтримуються лише JPG, PNG, WEBP та AVIF.");
        return [];
      }
      if (file.size > MAX_BYTES) {
        setError("Файл завеликий — максимум 8 МБ.");
        return [];
      }
    }

    setPending(true);
    try {
      const uploaded = await Promise.all(
        files.map((file) =>
          upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/admin/upload",
          }),
        ),
      );
      return uploaded.map((blob) => blob.url);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не вдалося завантажити файл.",
      );
      return [];
    } finally {
      setPending(false);
    }
  }

  return { uploadFiles, pending, error };
}
