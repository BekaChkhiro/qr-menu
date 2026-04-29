import { z } from 'zod';

export const ALLOWED_3D_MIME_TYPES = [
  'model/gltf-binary',
  'model/vnd.usdz+zip',
] as const;

export type Allowed3DMimeType = (typeof ALLOWED_3D_MIME_TYPES)[number];

export const MAX_GLB_SIZE = 15 * 1024 * 1024;
export const MAX_USDZ_SIZE = 25 * 1024 * 1024;

// Mobile devices stutter beyond ~50K triangles in <model-viewer> scenes.
export const MAX_TRIANGLES = 50_000;

export type ModelKind = 'glb' | 'usdz';

export function getMaxSizeForMimeType(mime: Allowed3DMimeType): number {
  return mime === 'model/gltf-binary' ? MAX_GLB_SIZE : MAX_USDZ_SIZE;
}

const GLB_MAGIC = Buffer.from([0x67, 0x6c, 0x54, 0x46]); // "glTF"
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04 (USDZ is a ZIP)

export function detectModelKind(buffer: Buffer): ModelKind | null {
  if (buffer.length < 4) return null;
  const header = buffer.subarray(0, 4);
  if (header.equals(GLB_MAGIC)) return 'glb';
  if (header.equals(ZIP_MAGIC)) return 'usdz';
  return null;
}

export function mimeTypeForKind(kind: ModelKind): Allowed3DMimeType {
  return kind === 'glb' ? 'model/gltf-binary' : 'model/vnd.usdz+zip';
}

export function expectedKindForMime(mime: Allowed3DMimeType): ModelKind {
  return mime === 'model/gltf-binary' ? 'glb' : 'usdz';
}

export const upload3DMetadataSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive(),
  mimeType: z.enum(ALLOWED_3D_MIME_TYPES, {
    message: `File type must be one of: ${ALLOWED_3D_MIME_TYPES.join(', ')}`,
  }),
});

export type Upload3DMetadata = z.infer<typeof upload3DMetadataSchema>;

export const upload3DResponseSchema = z.object({
  url: z.string().url(),
  publicId: z.string(),
  kind: z.enum(['glb', 'usdz']),
});

export type Upload3DResponse = z.infer<typeof upload3DResponseSchema>;

const GLB_VERSION = 2;
const GLB_HEADER_BYTES = 12;
const GLB_CHUNK_HEADER_BYTES = 8;
const GLB_JSON_CHUNK_TYPE = 0x4e4f534a; // "JSON"

interface GlbAccessor {
  count?: number;
}

interface GlbPrimitive {
  indices?: number;
  attributes?: { POSITION?: number };
  mode?: number;
}

interface GlbMesh {
  primitives?: GlbPrimitive[];
}

interface GlbJson {
  meshes?: GlbMesh[];
  accessors?: GlbAccessor[];
}

export type GlbValidationResult =
  | { ok: true; triangles: number }
  | { ok: false; reason: string };

/**
 * Parse a GLB buffer's JSON chunk and return the total triangle count
 * across all mesh primitives. Counts come from each primitive's `indices`
 * accessor (preferred) or the `POSITION` attribute accessor as a fallback.
 *
 * Non-triangle topologies (LINES, POINTS) contribute 0. Returns `null` when
 * the file isn't a valid GLB v2 with a parseable JSON chunk.
 */
export function countGlbTriangles(buffer: Buffer): number | null {
  if (buffer.length < GLB_HEADER_BYTES) return null;
  if (!buffer.subarray(0, 4).equals(GLB_MAGIC)) return null;

  const version = buffer.readUInt32LE(4);
  if (version !== GLB_VERSION) return null;

  const totalLength = buffer.readUInt32LE(8);
  if (totalLength > buffer.length) return null;

  if (buffer.length < GLB_HEADER_BYTES + GLB_CHUNK_HEADER_BYTES) return null;
  const jsonChunkLength = buffer.readUInt32LE(GLB_HEADER_BYTES);
  const jsonChunkType = buffer.readUInt32LE(GLB_HEADER_BYTES + 4);
  if (jsonChunkType !== GLB_JSON_CHUNK_TYPE) return null;

  const jsonStart = GLB_HEADER_BYTES + GLB_CHUNK_HEADER_BYTES;
  const jsonEnd = jsonStart + jsonChunkLength;
  if (jsonEnd > buffer.length) return null;

  let parsed: GlbJson;
  try {
    parsed = JSON.parse(buffer.subarray(jsonStart, jsonEnd).toString('utf8'));
  } catch {
    return null;
  }

  const accessors = parsed.accessors ?? [];
  const meshes = parsed.meshes ?? [];

  let totalTriangles = 0;
  for (const mesh of meshes) {
    for (const primitive of mesh.primitives ?? []) {
      // glTF primitive modes: 4 = TRIANGLES, 5 = TRIANGLE_STRIP, 6 = TRIANGLE_FAN.
      // Default is 4 when omitted. Anything else (POINTS=0, LINES=1..3) skips.
      const mode = primitive.mode ?? 4;
      if (mode < 4) continue;

      const indicesAccessor =
        primitive.indices !== undefined ? accessors[primitive.indices] : undefined;
      const positionAccessor =
        primitive.attributes?.POSITION !== undefined
          ? accessors[primitive.attributes.POSITION]
          : undefined;

      const vertexCount = indicesAccessor?.count ?? positionAccessor?.count;
      if (typeof vertexCount !== 'number') continue;

      if (mode === 4) {
        totalTriangles += Math.floor(vertexCount / 3);
      } else {
        // STRIP/FAN: N vertices yield N-2 triangles (clamped at 0).
        totalTriangles += Math.max(0, vertexCount - 2);
      }
    }
  }

  return totalTriangles;
}

/**
 * Validate a GLB buffer against the mobile-friendly triangle budget.
 * The error reason is suitable for surfacing to the admin in upload errors.
 */
export function validateGlbMesh(
  buffer: Buffer,
  maxTriangles: number = MAX_TRIANGLES
): GlbValidationResult {
  const triangles = countGlbTriangles(buffer);
  if (triangles === null) {
    return {
      ok: false,
      reason: 'Could not parse the .glb file. Please re-export and try again.',
    };
  }
  if (triangles > maxTriangles) {
    const tris = formatTriangleCount(triangles);
    return {
      ok: false,
      reason: `This model is too detailed (${tris} triangles). Please re-export with reduced geometry (max ${formatTriangleCount(maxTriangles)} triangles).`,
    };
  }
  return { ok: true, triangles };
}

function formatTriangleCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return String(n);
}
