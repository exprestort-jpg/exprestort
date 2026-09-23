import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import type { NextRequest } from "next/server";
import { assertAdmin } from "@/lib/require-admin";

/**
 * Issues short-lived upload tokens so the browser sends the file straight to
 * Blob storage. Routing photos through a serverless function instead would hit
 * the 4.5 MB request body limit, and phone photos routinely exceed it.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  // Checked here rather than only inside onBeforeGenerateToken, because the SDK
  // validates its own env token first and would fail with a misleading error
  // before our callback ever runs.
  //
  // Only token requests are gated: `blob.upload-completed` is a server-to-server
  // callback from Vercel with no admin cookie, and handleUpload verifies its
  // signature itself.
  if (body.type === "blob.generate-client-token") {
    try {
      await assertAdmin();
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        await assertAdmin();

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/avif",
          ],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do: the URL is written to the database when the admin
        // saves the surrounding form, not when the file lands.
      },
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
