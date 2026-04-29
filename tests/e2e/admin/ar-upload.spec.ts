// Test for T18.2 — POST /api/upload/3d (3D Model Upload Pipeline).
// Run:    pnpm test:e2e tests/e2e/admin/ar-upload.spec.ts
//
// API-level tests (no UI) for:
//   - PRO user + valid GLB → 201 with { url, publicId, kind }
//   - STARTER user → 403 (FEATURE_NOT_AVAILABLE)
//   - Oversized GLB → 400 (FILE_TOO_LARGE)
//   - Spoofed extension (declared GLB but bytes are not "glTF") → 400 (INVALID_FILE_TYPE)

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedUser } from '../fixtures/seed';

const GLB_MAGIC = [0x67, 0x6c, 0x54, 0x46]; // "glTF"
const MAX_GLB_SIZE = 15 * 1024 * 1024;

function makeMinimalGlbBuffer(extraBytes = 16): Buffer {
  // Magic + minimal header padding. Cloudinary accepts arbitrary raw bytes;
  // the route's magic-byte check only inspects the first 4.
  const buf = Buffer.alloc(4 + extraBytes);
  buf.writeUInt8(GLB_MAGIC[0], 0);
  buf.writeUInt8(GLB_MAGIC[1], 1);
  buf.writeUInt8(GLB_MAGIC[2], 2);
  buf.writeUInt8(GLB_MAGIC[3], 3);
  return buf;
}

function makeOversizedGlbBuffer(): Buffer {
  // 1 byte over the 15MB cap, with valid magic so the size check is what trips.
  const buf = Buffer.alloc(MAX_GLB_SIZE + 1);
  buf.writeUInt8(GLB_MAGIC[0], 0);
  buf.writeUInt8(GLB_MAGIC[1], 1);
  buf.writeUInt8(GLB_MAGIC[2], 2);
  buf.writeUInt8(GLB_MAGIC[3], 3);
  return buf;
}

function makeSpoofedGlbBuffer(): Buffer {
  // PNG magic instead of glTF — declared MIME says GLB but contents lie.
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
}

test.describe('POST /api/upload/3d (T18.2)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'API-only test — single project run is enough',
    );
    await resetDb();
    await context.clearCookies();
  });

  test('STARTER user is rejected with 403 FEATURE_NOT_AVAILABLE', async ({ page }) => {
    const email = 'starter@test.local';
    await seedUser({ plan: 'STARTER', email });
    await loginAs(page, email);

    const res = await page.request.post('/api/upload/3d', {
      multipart: {
        file: {
          name: 'model.glb',
          mimeType: 'model/gltf-binary',
          buffer: makeMinimalGlbBuffer(),
        },
      },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FEATURE_NOT_AVAILABLE');
  });

  test('PRO user uploading oversized GLB is rejected with 400 FILE_TOO_LARGE', async ({
    page,
  }) => {
    const email = 'pro-oversized@test.local';
    await seedUser({ plan: 'PRO', email });
    await loginAs(page, email);

    const res = await page.request.post('/api/upload/3d', {
      multipart: {
        file: {
          name: 'huge.glb',
          mimeType: 'model/gltf-binary',
          buffer: makeOversizedGlbBuffer(),
        },
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FILE_TOO_LARGE');
  });

  test('PRO user uploading file with spoofed magic bytes is rejected with 400 INVALID_FILE_TYPE', async ({
    page,
  }) => {
    const email = 'pro-spoofed@test.local';
    await seedUser({ plan: 'PRO', email });
    await loginAs(page, email);

    const res = await page.request.post('/api/upload/3d', {
      multipart: {
        file: {
          name: 'fake.glb',
          mimeType: 'model/gltf-binary',
          buffer: makeSpoofedGlbBuffer(),
        },
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_FILE_TYPE');
  });

  test('PRO user uploading valid GLB succeeds with 201 and returns { url, publicId, kind }', async ({
    page,
  }) => {
    test.skip(
      !process.env.CLOUDINARY_API_KEY,
      'Cloudinary credentials not configured — skipping happy-path upload',
    );

    const email = 'pro-happy@test.local';
    await seedUser({ plan: 'PRO', email });
    await loginAs(page, email);

    const res = await page.request.post('/api/upload/3d', {
      multipart: {
        file: {
          name: 'valid.glb',
          mimeType: 'model/gltf-binary',
          buffer: makeMinimalGlbBuffer(64),
        },
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toMatch(/^https?:\/\//);
    expect(typeof body.data.publicId).toBe('string');
    expect(body.data.kind).toBe('glb');
  });
});

// Direct-to-Cloudinary path used by the admin AR field. The legacy
// /api/upload/3d above stays for smaller files; these endpoints exist so
// >4.5MB GLBs don't get killed by Vercel's serverless body limit.
test.describe('POST /api/upload/3d/signature + finalize', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'API-only test — single project run is enough',
    );
    await resetDb();
    await context.clearCookies();
  });

  test('signature: STARTER user is rejected with 403 FEATURE_NOT_AVAILABLE', async ({
    page,
  }) => {
    const email = 'starter-sig@test.local';
    await seedUser({ plan: 'STARTER', email });
    await loginAs(page, email);

    const res = await page.request.post('/api/upload/3d/signature', {
      data: { kind: 'glb' },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FEATURE_NOT_AVAILABLE');
  });

  test('signature: PRO user gets a signed payload scoped to their folder', async ({ page }) => {
    test.skip(
      !process.env.CLOUDINARY_API_KEY,
      'Cloudinary credentials not configured — signature minting requires api_secret',
    );

    const email = 'pro-sig@test.local';
    await seedUser({ plan: 'PRO', email });
    await loginAs(page, email);

    const res = await page.request.post('/api/upload/3d/signature', {
      data: { kind: 'glb' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.signature).toBe('string');
    expect(body.data.signature.length).toBeGreaterThan(0);
    expect(typeof body.data.timestamp).toBe('number');
    expect(typeof body.data.apiKey).toBe('string');
    expect(typeof body.data.cloudName).toBe('string');
    expect(body.data.folder).toMatch(/^digital-menu\/.+\/ar-models$/);
    expect(body.data.publicIdPrefix.startsWith(`${body.data.folder}/`)).toBe(true);
    expect(body.data.resourceType).toBe('raw');
  });

  test('signature: rejects invalid `kind` with 400', async ({ page }) => {
    test.skip(
      !process.env.CLOUDINARY_API_KEY,
      'Skips when Cloudinary creds are missing — route would otherwise 500',
    );

    const email = 'pro-sig-bad@test.local';
    await seedUser({ plan: 'PRO', email });
    await loginAs(page, email);

    const res = await page.request.post('/api/upload/3d/signature', {
      data: { kind: 'png' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('finalize: rejects publicId outside the user folder with 403 FORBIDDEN', async ({
    page,
  }) => {
    const email = 'pro-finalize-foreign@test.local';
    await seedUser({ plan: 'PRO', email });
    await loginAs(page, email);

    const res = await page.request.post('/api/upload/3d/finalize', {
      data: {
        publicId: 'digital-menu/some-other-user/ar-models/abc123',
        secureUrl: 'https://res.cloudinary.com/example/raw/upload/v1/foreign.glb',
        kind: 'glb',
      },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  test('finalize: STARTER user is rejected with 403 FEATURE_NOT_AVAILABLE', async ({ page }) => {
    const email = 'starter-finalize@test.local';
    await seedUser({ plan: 'STARTER', email });
    await loginAs(page, email);

    const res = await page.request.post('/api/upload/3d/finalize', {
      data: {
        publicId: 'digital-menu/anyone/ar-models/abc',
        secureUrl: 'https://res.cloudinary.com/example/raw/upload/v1/x.glb',
        kind: 'glb',
      },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FEATURE_NOT_AVAILABLE');
  });
});
