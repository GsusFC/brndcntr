import { Search } from "@/components/ui/Search"
import { UsersTableS2 } from "@/components/dashboard/UsersTableS2"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function UsersPage({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string
        page?: string
        sort?: string
        order?: string
    }>
}) {
    const params = await searchParams
    const query = params?.query || ""
    const currentPage = Number(params?.page) || 1
    const sortParam = params?.sort
    const sort = (sortParam === "points" || sortParam === "totalVotes" || sortParam === "powerLevel" || sortParam === "fid") ? sortParam : "points"
    const order = (params?.order === "asc" || params?.order === "desc") ? params.order : "desc"

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white font-display uppercase">Users</h1>
                    <p className="text-zinc-500 font-mono text-sm mt-1">Season 2 • Onchain data</p>
                </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Search placeholder="Search by FID..." />
                </div>
            </div>

            <Suspense key={query + currentPage + sort + order} fallback={<UsersTableSkeleton />}>
                <UsersTableS2 
                    query={query} 
                    currentPage={currentPage} 
                    sort={sort}
                    order={order}
                />
            </Suspense>
        </div>
    )
}

function UsersTableSkeleton() {
    return (
        <div className="mt-6 flow-root">
            {/* Skeleton del contador */}
            <div className="mb-4">
                <Skeleton className="h-5 w-48" />
            </div>
            
            {/* Skeleton de la tabla */}
            <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                    {/* Header skeleton */}
                    <div className="flex gap-4 py-4 px-6 border-b border-zinc-900">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-3 w-14" />
                    </div>
                    
                    {/* Rows skeleton */}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-4 px-6 border-b border-zinc-900">
                            <div className="flex items-center gap-3 flex-1">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-2.5 w-16 bg-zinc-900" />
                                </div>
                            </div>
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-14 rounded-full" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
