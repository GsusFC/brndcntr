import { Skeleton } from "@/components/ui/skeleton"

export default function BrandsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-48 bg-zinc-900 mt-2" />
                </div>
                <Skeleton className="h-10 w-32 bg-zinc-900 rounded-lg" />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Skeleton className="h-10 w-64 bg-zinc-900 rounded-lg" />
                <Skeleton className="h-10 w-40 bg-zinc-900 rounded-lg" />
            </div>

            {/* Table */}
            <div className="rounded-xl bg-zinc-900 overflow-hidden">
                <Skeleton className="h-12 rounded-none bg-zinc-800" />
                {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-none bg-zinc-900 border-t border-zinc-800" />
                ))}
            </div>
        </div>
    )
}
