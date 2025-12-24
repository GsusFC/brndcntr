import { PrismaClient } from '@prisma/client'

declare global {
    // eslint-disable-next-line no-var
    var prismaGlobal: PrismaClient | undefined
}

const getPrismaClient = (): PrismaClient => {
    const existing = globalThis.prismaGlobal
    if (existing) return existing

    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })

    if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = client
    return client
}

const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        if (!process.env.MYSQL_DATABASE_URL) {
            throw new Error('MYSQL_DATABASE_URL is not defined')
        }

        const client = getPrismaClient() as unknown as Record<PropertyKey, unknown>
        return client[prop]
    },
})

export default prisma
