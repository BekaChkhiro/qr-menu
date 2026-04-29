import { z } from 'zod';

export const ALLOWED_3D_MIME_TYPES = [
  'model/gltf-binary',
  'model/vnd.usdz+zip',
] as const;

export type Allowed3DMimeType = (typeof ALLOWED_3D_MIME_TYPES)[number];

export const MAX_GLB_SIZE = 15 * 1024 * 1024;
export const MAX_USDZ_SIZE = 25 * 1024 * 1024;

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
