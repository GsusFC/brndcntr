import { Skeleton } from "@/components/ui/skeleton"

export default function UserDetailLoading() {
    return (
        <div className="space-y-8">
            {/* Back button */}
            <Skeleton className="h-6 w-24 bg-zinc-900" />

            {/* User Header */}
            <div className="flex items-start gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-32 bg-zinc-900" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 bg-zinc-900 rounded-full" />
                        <Skeleton className="h-6 w-20 bg-zinc-900 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl bg-zinc-900" />
                ))}
            </div>

            {/* Podiums */}
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl bg-zinc-900" />
                    ))}
                </div>
            </div>
        </div>
    )
}
