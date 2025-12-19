import { Skeleton } from "@/components/ui/skeleton"

export default function BrandDetailLoading() {
    return (
        <div className="space-y-8">
            {/* Back button */}
            <Skeleton className="h-6 w-24 bg-zinc-900" />

            {/* Brand Header */}
            <div className="flex items-start gap-6">
                <Skeleton className="w-24 h-24 rounded-[22%]" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-64 bg-zinc-900" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-24 bg-zinc-900 rounded-full" />
                        <Skeleton className="h-6 w-24 bg-zinc-900 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl bg-zinc-900" />
                ))}
            </div>

            {/* Top Voters */}
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-64 rounded-xl bg-zinc-900" />
            </div>
        </div>
    )
}
