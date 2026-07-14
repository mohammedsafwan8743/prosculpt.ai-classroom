import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

/** Single-line text skeleton */
export function SkeletonText({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("skeleton h-4 w-full rounded", className)} />
  );
}

/** Heading-sized skeleton */
export function SkeletonHeading({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("skeleton h-7 w-48 rounded", className)} />
  );
}

/** Avatar/circle skeleton */
export function SkeletonAvatar({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("skeleton h-10 w-10 rounded-full", className)} />
  );
}

/** Card skeleton for dashboard stat cards */
export function SkeletonStatCard({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("ps-card flex items-start gap-4 p-5", className)}>
      <div className="skeleton h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-20 rounded" />
        <div className="skeleton h-7 w-16 rounded" />
      </div>
    </div>
  );
}

/** Table row skeleton */
export function SkeletonTableRow({ columns = 4, className }: LoadingSkeletonProps & { columns?: number }) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 flex-1 rounded"
          style={{ maxWidth: i === 0 ? "200px" : undefined }}
        />
      ))}
    </div>
  );
}

/** Card skeleton for classroom cards */
export function SkeletonClassroomCard({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("ps-card space-y-4 p-5", className)}>
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}
