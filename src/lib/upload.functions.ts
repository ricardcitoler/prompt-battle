import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const UPLOAD_PREFIX = "prompt-battle";

function getInternalApiUrl() {
  const url = process.env.INTERNAL_API_URL;
  if (!url) throw new Error("Missing INTERNAL_API_URL environment variable");
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getCdnUrl() {
  const url = process.env.NUXT_PUBLIC_CDN_URL;
  if (!url) throw new Error("Missing NUXT_PUBLIC_CDN_URL environment variable");
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        bearerToken: z.string(),
        userId: z.string().uuid(),
        fileName: z.string().max(200),
        contentType: z.string().regex(/^image\//),
        data: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const apiUrl = getInternalApiUrl();
    const cdnUrl = getCdnUrl();

    const buffer = Buffer.from(data.data, "base64");
    const blob = new Blob([buffer], { type: data.contentType });

    const formData = new FormData();
    formData.append("file", blob, data.fileName);

    const response = await fetch(`${apiUrl}/files/uploads/${UPLOAD_PREFIX}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.bearerToken}`,
        "x-user-id": data.userId,
      },
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} — ${body}`);
    }

    const result = (await response.json()) as { data?: { key?: string }; key?: string };
    const key = result.data?.key ?? result.key;

    if (!key) throw new Error("Upload succeeded but no key was returned");

    return { publicUrl: `${cdnUrl}/${key}` };
  });
