"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const BrandEvolutionChart = dynamic(
    () => import("@/components/intelligence/BrandEvolutionChart").then(mod => ({ default: mod.BrandEvolutionChart })),
    { loading: () => <Skeleton className="h-[500px] rounded-xl bg-zinc-900" />, ssr: false }
)

export function BrandEvolutionWrapper() {
    return <BrandEvolutionChart />
}
