/**
 * Skeleton primitive component following shadcn/ui convention.
 * Usage: <Skeleton className="h-[20px] w-[100px] rounded-full" />
 */
export function Skeleton({ className = "", ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
