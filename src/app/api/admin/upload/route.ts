import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { bucket, publicUrl, r2 } from "@/lib/r2";
import { assertAdmin } from "@/lib/require-admin";
import {
  ALLOWED_CONTENT_TYPES,
  buildKey,
  MAX_UPLOAD_BYTES,
  SCOPES,
} from "@/lib/storage-keys";

const MAX_FILES = 20;
// The browser starts the PUT as soon as it has the URL, so this only has to
// outlast a slow round trip, not the upload itself.
const EXPIRES_IN_SECONDS = 300;

const bodySchema = z.object({
  scope: z.enum(SCOPES).default("uploads"),
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(255),
        contentType: z.enum(ALLOWED_CONTENT_TYPES as [string, ...string[]]),
        size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
      }),
    )
    .min(1)
    .max(MAX_FILES),
});

/**
 * Hands the browser short-lived presigned PUT URLs so photos go straight to R2.
 * Routing them through this function instead would hit the request body limit,
 * and phone photos routinely exceed it.
 *
 * Both the declared size and the content type are pinned into the signature, so
 * a client cannot overrun the limit or store a type we rejected: R2 refuses the
 * request outright rather than storing the bytes.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    await assertAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Некоректний запит" }, { status: 400 });
  }

  const { scope, files } = parsed.data;

  try {
    const uploads = await Promise.all(
      files.map(async (file) => {
        const key = buildKey(scope, file.filename, file.contentType);
        const uploadUrl = await getSignedUrl(
          r2(),
          new PutObjectCommand({
            Bucket: bucket(),
            Key: key,
            ContentType: file.contentType,
            ContentLength: file.size,
          }),
          {
            expiresIn: EXPIRES_IN_SECONDS,
            // Without this the SDK signs only content-length and host, and a
            // client can then store whatever type it likes under a key we
            // named ".jpg" — verified against R2, not assumed.
            signableHeaders: new Set(["content-type"]),
          },
        );

        return { key, uploadUrl, publicUrl: publicUrl(key) };
      }),
    );

    return Response.json({ uploads });
  } catch (error) {
    console.error("Failed to presign uploads", error);
    return Response.json(
      { error: "Не вдалося підготувати завантаження." },
      { status: 500 },
    );
  }
}
