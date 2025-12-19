import { Skeleton } from "@/components/ui/skeleton"

export default function IntelligenceLoading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
            {/* Icon */}
            <Skeleton className="w-20 h-20 bg-zinc-900 rounded-3xl mb-8" />
            
            {/* Title */}
            <Skeleton className="h-10 w-64 rounded-lg mb-4" />
            <Skeleton className="h-4 w-96 bg-zinc-900 mb-8" />
            
            {/* Query cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl bg-zinc-900" />
                ))}
            </div>
        </div>
    )
}
