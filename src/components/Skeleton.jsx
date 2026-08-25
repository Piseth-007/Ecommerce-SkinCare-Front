export function CardSkeleton() {
  return (
    <div className="bg-surface border border-hairline rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-hairline/40" />
      <div className="p-4 space-y-2">
        <div className="h-2.5 w-16 bg-hairline/50 rounded" />
        <div className="h-3.5 w-3/4 bg-hairline/60 rounded" />
        <div className="h-3.5 w-1/2 bg-hairline/40 rounded" />
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-hairline last:border-0 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-hairline/40 shrink-0" />
      <div className="h-3.5 w-1/3 bg-hairline/50 rounded" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-surface border border-hairline rounded-xl p-5 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-hairline/40 mb-4" />
      <div className="h-6 w-16 bg-hairline/50 rounded mb-1.5" />
      <div className="h-3 w-20 bg-hairline/30 rounded" />
    </div>
  );
}
