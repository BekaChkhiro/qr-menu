import { Skeleton } from '@/components/ui/skeleton';

export function MenuCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-border bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="flex flex-col px-4 pb-4 pt-[14px]">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[hsl(var(--border-soft))] pt-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function MenuGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <MenuCardSkeleton key={i} />
      ))}
    </div>
  );
}
