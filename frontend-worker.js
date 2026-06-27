import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

// ── Entry ────────────────────────────────────────────────
// v1 is a purely static SPA: no API routes, no database, no bindings.
// Serve built assets from KV; fall back to index.html so client-side
// state/routing works on any path.
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest },
      );
    } catch (e) {
      if (e.status === 404) {
        try {
          return await getAssetFromKV(
            { request: new Request(`${url.origin}/index.html`, request), waitUntil: ctx.waitUntil.bind(ctx) },
            { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest },
          );
        } catch {
          return new Response('Not Found', { status: 404 });
        }
      }
      return new Response(`Internal Error: ${e.message}`, { status: 500 });
    }
  },
};
