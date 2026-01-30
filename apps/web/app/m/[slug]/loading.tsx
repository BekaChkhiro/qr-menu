import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className={cn(
        'flex gap-4 p-4 rounded-lg border bg-card',
        delay > 0 && `animation-delay-${delay}`
      )}
    >
      <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function PublicMenuLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      </header>

      {/* Category Navigation Skeleton */}
      <div className="sticky top-[73px] z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                className={cn(
                  'h-8 rounded-full flex-shrink-0',
                  i === 1 ? 'w-20' : i === 2 ? 'w-28' : i === 3 ? 'w-24' : i === 4 ? 'w-32' : 'w-20'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <main className="px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {[0, 1].map((section) => (
            <div key={section} className="space-y-4">
              {/* Category Header */}
              <div className="pb-3 border-b border-border/50">
                <div className="flex items-baseline justify-between gap-3">
                  <Skeleton className="h-7 w-36" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64 mt-2" />
              </div>

              {/* Product Cards */}
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <SkeletonCard key={item} delay={(section * 3 + item) * 100} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </footer>
    </div>
  );
}
