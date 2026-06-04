/**
 * Post-build script: assembles the Vercel Build Output API v3 structure
 * from the TanStack Start + Nitro build artifacts.
 *
 * Input:
 *   dist/client/   → static assets
 *   dist/server/   → Nitro server bundle (exports default { fetch })
 *
 * Output:
 *   .vercel/output/
 *     config.json                          → routing rules
 *     static/                              → static assets served by CDN
 *     functions/index.func/                → SSR catch-all function
 *       .vc-config.json                    → Vercel function metadata
 *       index.mjs + all server chunks
 */

import { cp, mkdir, writeFile, rm } from "fs/promises";

const OUT = ".vercel/output";

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/static`, { recursive: true });
await mkdir(`${OUT}/functions/index.func`, { recursive: true });

// Static assets
await cp("dist/client", `${OUT}/static`, { recursive: true });

// Server function bundle
await cp("dist/server", `${OUT}/functions/index.func`, { recursive: true });

// Vercel function config — web entry format matches Nitro vercel.web.mjs handler
await writeFile(
  `${OUT}/functions/index.func/.vc-config.json`,
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launchWorker: true,
    },
    null,
    2,
  ),
);

// Routing: serve static files from CDN, fall through to SSR function
await writeFile(
  `${OUT}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: "/assets/(.*)",
          headers: { "cache-control": "public, max-age=31536000, immutable" },
          dest: "/assets/$1",
        },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index" },
      ],
    },
    null,
    2,
  ),
);

console.log("✓ .vercel/output created");
