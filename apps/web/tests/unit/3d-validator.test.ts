/**
 * GLB triangle-budget validator tests.
 *
 * Fixtures are synthesized in-process — a real GLB file is just a header +
 * a JSON chunk + an optional BIN chunk. We don't need real geometry data;
 * the validator only reads accessor `count` fields from the JSON chunk.
 */

import { describe, it, expect } from 'vitest';
import {
  countGlbTriangles,
  validateGlbMesh,
  detectModelKind,
  MAX_TRIANGLES,
} from '@/lib/validations/3d-upload';

interface PrimitiveSpec {
  indicesCount?: number;
  positionCount?: number;
  mode?: number;
}

function buildGlb(primitives: PrimitiveSpec[]): Buffer {
  const accessors: Array<{ count: number }> = [];
  const meshPrimitives: Array<{
    indices?: number;
    attributes?: { POSITION?: number };
    mode?: number;
  }> = [];

  for (const p of primitives) {
    const primitive: { indices?: number; attributes?: { POSITION?: number }; mode?: number } = {};
    if (p.indicesCount !== undefined) {
      primitive.indices = accessors.length;
      accessors.push({ count: p.indicesCount });
    }
    if (p.positionCount !== undefined) {
      primitive.attributes = { POSITION: accessors.length };
      accessors.push({ count: p.positionCount });
    }
    if (p.mode !== undefined) primitive.mode = p.mode;
    meshPrimitives.push(primitive);
  }

  const json = {
    asset: { version: '2.0' },
    meshes: [{ primitives: meshPrimitives }],
    accessors,
  };

  let jsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
  // Pad JSON chunk to 4-byte alignment with spaces (per glTF spec).
  while (jsonBytes.length % 4 !== 0) {
    jsonBytes = Buffer.concat([jsonBytes, Buffer.from(' ')]);
  }

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 4, 'ascii');
  header.writeUInt32LE(2, 4); // version
  header.writeUInt32LE(12 + 8 + jsonBytes.length, 8); // total length

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(jsonBytes.length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  return Buffer.concat([header, chunkHeader, jsonBytes]);
}

describe('detectModelKind', () => {
  it('recognizes a GLB by its magic bytes', () => {
    const glb = buildGlb([{ indicesCount: 9 }]);
    expect(detectModelKind(glb)).toBe('glb');
  });

  it('recognizes a USDZ (ZIP) by its magic bytes', () => {
    const usdz = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
    expect(detectModelKind(usdz)).toBe('usdz');
  });

  it('rejects unknown content (e.g. a renamed PNG)', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectModelKind(png)).toBeNull();
  });
});

describe('countGlbTriangles', () => {
  it('returns 0 for a mesh with no primitives', () => {
    const glb = buildGlb([]);
    expect(countGlbTriangles(glb)).toBe(0);
  });

  it('counts indexed TRIANGLES primitives (indices / 3)', () => {
    const glb = buildGlb([{ indicesCount: 15_000 }]); // 5K triangles
    expect(countGlbTriangles(glb)).toBe(5_000);
  });

  it('falls back to POSITION count when indices are absent', () => {
    const glb = buildGlb([{ positionCount: 3_000 }]); // 1K triangles
    expect(countGlbTriangles(glb)).toBe(1_000);
  });

  it('treats TRIANGLE_STRIP/FAN as N - 2 triangles', () => {
    const strip = buildGlb([{ indicesCount: 1_002, mode: 5 }]); // 1000 triangles
    expect(countGlbTriangles(strip)).toBe(1_000);
    const fan = buildGlb([{ indicesCount: 502, mode: 6 }]); // 500 triangles
    expect(countGlbTriangles(fan)).toBe(500);
  });

  it('skips non-triangle topologies (POINTS, LINES)', () => {
    const lines = buildGlb([{ indicesCount: 1_000, mode: 1 }]);
    expect(countGlbTriangles(lines)).toBe(0);
  });

  it('returns null for non-GLB input', () => {
    const garbage = Buffer.from('not a glb at all', 'utf8');
    expect(countGlbTriangles(garbage)).toBeNull();
  });
});

describe('validateGlbMesh', () => {
  it('accepts a 5K-triangle model (under 50K budget)', () => {
    const glb = buildGlb([{ indicesCount: 15_000 }]);
    const result = validateGlbMesh(glb);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.triangles).toBe(5_000);
  });

  it('rejects an 80K-triangle model with a human-readable reason', () => {
    const glb = buildGlb([{ indicesCount: 240_000 }]); // 80K triangles
    const result = validateGlbMesh(glb);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/80K/);
      expect(result.reason).toMatch(/50K/);
      expect(result.reason).toMatch(/re-export/i);
    }
  });

  it('rejects a corrupt GLB with a parse-error message', () => {
    const garbage = Buffer.from('definitely not a glb', 'utf8');
    const result = validateGlbMesh(garbage);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/parse|re-export/i);
  });

  it('respects an explicit budget override', () => {
    const glb = buildGlb([{ indicesCount: 30_000 }]); // 10K triangles
    expect(validateGlbMesh(glb, 5_000).ok).toBe(false);
    expect(validateGlbMesh(glb, 20_000).ok).toBe(true);
  });

  it('aligns its default budget with MAX_TRIANGLES', () => {
    expect(MAX_TRIANGLES).toBe(50_000);
  });
});
