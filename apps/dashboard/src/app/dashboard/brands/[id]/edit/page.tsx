import prisma from "@/lib/prisma"
import { BrandForm } from "@/components/brands/BrandForm"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    let brand: Awaited<ReturnType<typeof prisma.brand.findUnique>> = null
    let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = []
    let dbError = false

    try {
        ;[brand, categories] = await Promise.all([
            prisma.brand.findUnique({
                where: { id: Number(id) },
            }),
            prisma.category.findMany(),
        ])
    } catch {
        dbError = true
    }

    if (dbError) {
        return (
            <div className="w-full p-8 text-center rounded-xl border border-yellow-900/50 bg-yellow-950/20">
                <p className="text-yellow-400 font-mono text-sm">
                    ⚠️ Could not load brand editor. Database connection issue.
                </p>
            </div>
        )
    }

    if (!brand) {
        notFound()
    }

    return (
        <div className="w-full">
            <BrandForm categories={categories} brand={brand} />
        </div>
    )
}
