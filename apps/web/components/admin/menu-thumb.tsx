import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

// Cover-art gradient palette from qr-menu-design/components/menus-pages.jsx.
// Keeps the grid MenuCard and the table MenuThumb visually consistent so the
// same menu displays with the same tone no matter which view the user picks.
const COVER_TONES: ReadonlyArray<readonly [string, string]> = [
  ['#C9B28A', '#8B6F47'],
  ['#B8633D', '#7A3F27'],
  ['#6B7F6B', '#3F5B3F'],
  ['#8A7CA0', '#5D4F70'],
  ['#D4A373', '#8B5A2B'],
  ['#5D7A91', '#344C63'],
];

export function toneIndexFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % COVER_TONES.length;
}

interface MenuThumbProps {
  menuId: string;
  size?: number;
  className?: string;
}

export function MenuThumb({ menuId, size = 36, className }: MenuThumbProps) {
  const [c1, c2] = COVER_TONES[toneIndexFor(menuId)];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[7px]',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
    >
      <UtensilsCrossed
        size={Math.round(size * 0.45)}
        strokeWidth={1.5}
        className="text-white/75"
      />
    </span>
  );
}
