'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Box, Loader2, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateGlbMesh } from '@/lib/validations/3d-upload';

const ALLOWED_MIME = {
  glb: 'model/gltf-binary',
  usdz: 'model/vnd.usdz+zip',
} as const;

const ALLOWED_EXTENSIONS = {
  glb: '.glb',
  usdz: '.usdz',
} as const;

const MAX_BYTES = {
  glb: 15 * 1024 * 1024,
  usdz: 25 * 1024 * 1024,
} as const;

type ModelKind = 'glb' | 'usdz';

interface UploadResult {
  url: string;
  publicId: string;
  kind: ModelKind;
}

interface PresignPayload {
  presignedUrl: string;
  key: string;
  publicUrl: string;
  contentType: string;
  expiresIn: number;
}

/**
 * Read a JSON envelope from one of our own API routes — but tolerate the
 * case where Vercel (or a reverse proxy) responds with plain text before the
 * route handler even runs (e.g. 413 "Request Entity Too Large"). Returns the
 * parsed JSON on success and throws an Error with a readable message on
 * failure, never the cryptic "Unexpected token 'R'..." JSON.parse error.
 */
async function readJsonEnvelope<T>(res: Response, fallbackMessage: string): Promise<T> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = (await res.json()) as { success?: boolean; data?: T; error?: { message?: string } };
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message ?? fallbackMessage);
    }
    return json.data as T;
  }
  // Non-JSON response (most often a Vercel/edge plaintext error page).
  const text = await res.text().catch(() => '');
  throw new Error(text.trim() || fallbackMessage);
}

interface ArModelFieldProps {
  /** Stored URL for an already-uploaded model. */
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  kind: ModelKind;
  label: string;
  badge: string;
  hint: string;
  uploadCta: string;
  replaceCta: string;
  removeCta: string;
  disabled?: boolean;
  testIdPrefix: string;
}

export function ArModelField({
  value,
  onChange,
  kind,
  label,
  badge,
  hint,
  uploadCta,
  replaceCta,
  removeCta,
  disabled = false,
  testIdPrefix,
}: ArModelFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation<UploadResult, Error, File>({
    mutationFn: async (file: File) => {
      const contentType = ALLOWED_MIME[kind];

      // 1. Ask our backend (auth + PRO gate) for a presigned PUT URL into
      //    Cloudflare R2. The signature locks ContentType + ContentLength.
      const presignRes = await fetch('/api/upload/3d/r2-presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, size: file.size, contentType }),
      });
      const presign = await readJsonEnvelope<PresignPayload>(
        presignRes,
        'Could not start upload',
      );

      // 2. Stream the file directly to R2 — never crosses our serverless
      //    function, so Vercel's ~4.5MB body limit doesn't apply and there
      //    is no per-asset cap on the R2 free tier.
      const putRes = await fetch(presign.presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: file,
      });
      if (!putRes.ok) {
        const text = await putRes.text().catch(() => '');
        throw new Error(text.trim() || `R2 upload failed (${putRes.status})`);
      }

      // 3. Finalize: backend HEADs the object, validates ownership +
      //    authoritative size, returns the canonical { url, publicId, kind }.
      const finalizeRes = await fetch('/api/upload/3d/r2-finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: presign.key, kind }),
      });
      return readJsonEnvelope<UploadResult>(finalizeRes, 'Upload could not be finalized');
    },
    onSuccess: (data) => {
      setError(null);
      onChange(data.url);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const expectedMime = ALLOWED_MIME[kind];
      const expectedExt = ALLOWED_EXTENSIONS[kind];

      // Some browsers don't supply a MIME for .glb/.usdz — fall back to extension.
      const lower = file.name.toLowerCase();
      const matchesMime = file.type === expectedMime;
      const matchesExt = lower.endsWith(expectedExt);
      if (!matchesMime && !matchesExt) {
        setError(`Expected ${expectedExt} file`);
        return;
      }

      if (file.size > MAX_BYTES[kind]) {
        setError(`File too large (max ${MAX_BYTES[kind] / (1024 * 1024)}MB)`);
        return;
      }

      // Mesh-budget check for GLBs runs in the browser now that the file
      // never traverses our backend (T18.6's 50K-triangle cap).
      if (kind === 'glb') {
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const meshCheck = validateGlbMesh(bytes);
          if (!meshCheck.ok) {
            setError(meshCheck.reason);
            return;
          }
        } catch {
          setError('Could not read the file');
          return;
        }
      }

      // Force the right MIME so the API's strict whitelist accepts it.
      const blobWithMime =
        matchesMime
          ? file
          : new File([file], file.name, { type: expectedMime });
      upload.mutate(blobWithMime);
    },
    [kind, upload],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  const onPick = () => {
    if (!disabled && !upload.isPending) fileInputRef.current?.click();
  };

  const onRemove = () => {
    setError(null);
    onChange(null);
  };

  const fileName = value ? value.split('/').pop()?.split('?')[0] ?? null : null;

  return (
    <div
      className="rounded-[10px] border border-border bg-card p-3.5"
      data-testid={`${testIdPrefix}-field`}
      data-kind={kind}
      data-state={value ? 'filled' : 'empty'}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
          {label}
          <span
            className={cn(
              'rounded-full px-1.5 py-px text-[9.5px] font-bold uppercase tracking-[0.4px]',
              kind === 'glb'
                ? 'bg-accent-soft text-accent'
                : 'bg-chip text-text-muted',
            )}
          >
            {badge}
          </span>
        </span>
      </div>

      {value ? (
        <div
          className="flex items-center gap-2.5"
          data-testid={`${testIdPrefix}-summary`}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] bg-chip text-text-muted"
            aria-hidden="true"
          >
            <Box className="h-[15px] w-[15px]" strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[12.5px] font-medium text-text-default"
              data-testid={`${testIdPrefix}-filename`}
            >
              {fileName ?? `${kind}.${kind}`}
            </div>
            <div className="truncate text-[11px] text-text-subtle">{hint}</div>
          </div>
          <button
            type="button"
            onClick={onPick}
            disabled={disabled || upload.isPending}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-[5px] text-[12px] font-medium text-text-muted',
              'hover:border-text-subtle hover:text-text-default',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
              'disabled:pointer-events-none disabled:opacity-50',
              'transition-colors',
            )}
            data-testid={`${testIdPrefix}-replace`}
          >
            <Upload className="h-[13px] w-[13px]" strokeWidth={1.5} />
            {replaceCta}
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-[5px] text-[12px] font-medium text-text-muted',
              'hover:border-danger-soft hover:text-danger',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-1',
              'disabled:pointer-events-none disabled:opacity-50',
              'transition-colors',
            )}
            data-testid={`${testIdPrefix}-remove`}
          >
            <Trash2 className="h-[13px] w-[13px]" strokeWidth={1.5} />
            {removeCta}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          disabled={disabled || upload.isPending}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border bg-bg/40 px-4 py-6 text-[12.5px] font-medium text-text-muted',
            'hover:border-accent hover:bg-accent-soft hover:text-accent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
            'transition-colors',
          )}
          data-testid={`${testIdPrefix}-dropzone`}
        >
          {upload.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-[14px] w-[14px]" strokeWidth={1.6} />
          )}
          <span className="flex flex-col items-start text-left">
            <span>{upload.isPending ? 'Uploading…' : uploadCta}</span>
            <span className="text-[11px] font-normal text-text-subtle">
              {hint}
            </span>
          </span>
        </button>
      )}

      {error && (
        <p
          className="mt-2 text-[11.5px] text-danger"
          data-testid={`${testIdPrefix}-error`}
        >
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={`${ALLOWED_EXTENSIONS[kind]},${ALLOWED_MIME[kind]}`}
        onChange={onInputChange}
        disabled={disabled || upload.isPending}
        className="hidden"
        aria-hidden="true"
        data-testid={`${testIdPrefix}-input`}
      />
    </div>
  );
}
