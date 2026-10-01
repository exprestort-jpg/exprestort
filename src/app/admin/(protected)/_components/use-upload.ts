"use client";

import { useState } from "react";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type Presigned = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  cacheControl: string;
};

export function useUpload(scope = "uploads") {
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
      // One round trip for the whole batch: a gallery drop of eight photos
      // should not mean eight separate authorisation checks.
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          files: files.map((file) => ({
            filename: file.name,
            contentType: file.type,
            size: file.size,
          })),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Не вдалося підготувати завантаження.");
      }

      const { uploads } = (await response.json()) as { uploads: Presigned[] };

      await Promise.all(
        uploads.map(async (target, index) => {
          // The content type was signed along with the URL, so it has to be
          // sent back exactly: anything else and the store answers 403.
          //
          // Cache-Control is not signed, but the store keeps whatever the PUT
          // carries — so the header the server chose has to be echoed here or
          // the object is stored uncacheable.
          const put = await fetch(target.uploadUrl, {
            method: "PUT",
            body: files[index],
            headers: {
              "Content-Type": files[index].type,
              "Cache-Control": target.cacheControl,
            },
          });
          if (!put.ok) {
            throw new Error(`Сховище відхилило файл (${put.status}).`);
          }
        }),
      );

      return uploads.map((target) => target.publicUrl);
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
