/**
 * Script alternativo usando mysql2 directamente (más resiliente)
 * Ejecutar: npx tsx scripts/generate-s1-snapshot-mysql2.ts
 */

import * as mysql from "mysql2/promise"
import * as fs from "fs"
import * as path from "path"

const CUTOFF_DAY = "2025-12-11"
const FIRST_S2_DAY = "2025-12-12"
const TOP_N = 20
const OUTPUT_DIR = path.join(process.cwd(), "public/data/s1")

async function getConnection(retries = 5): Promise<mysql.Connection> {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mysql.createConnection(process.env.MYSQL_DATABASE_URL!)
      return conn
    } catch (err: any) {
      if (err.code === "ER_CON_COUNT_ERROR" && i < retries - 1) {
        console.log(`   ⏳ Waiting for connection (attempt ${i + 1}/${retries})...`)
        await new Promise((r) => setTimeout(r, 3000 * (i + 1)))
      } else {
        throw err
      }
    }
  }
  throw new Error("Could not connect after retries")
}

async function main() {
  console.log("🚀 Generating S1 Snapshot (mysql2)...")
  console.log(`   cutoffDay: ${CUTOFF_DAY}`)
  console.log(`   outputDir: ${OUTPUT_DIR}`)

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const conn = await getConnection()

  try {
    // Meta
    console.log("\n📊 Generating meta...")
    const meta = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      cutoffDay: CUTOFF_DAY,
      firstS2Day: FIRST_S2_DAY,
      topN: { brands: TOP_N, users: TOP_N },
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, "meta.json"), JSON.stringify(meta, null, 2))
    console.log("   ✓ meta.json")

    // Summary
    console.log("\n📊 Generating summary...")
    const [[{ totalUsers }]] = await conn.query<any>("SELECT COUNT(*) as totalUsers FROM users")
    const [[{ totalBrands }]] = await conn.query<any>("SELECT COUNT(*) as totalBrands FROM brands WHERE banned = 0")
    const [[{ totalPodiums }]] = await conn.query<any>(
      "SELECT COUNT(*) as totalPodiums FROM user_brand_votes WHERE date <= ?",
      [CUTOFF_DAY]
    )
    const [[firstVote]] = await conn.query<any>("SELECT MIN(date) as minDate FROM user_brand_votes")
    const [[lastVote]] = await conn.query<any>(
      "SELECT MAX(date) as maxDate FROM user_brand_votes WHERE date <= ?",
      [CUTOFF_DAY]
    )

    const summary = {
      totalUsers: Number(totalUsers),
      totalBrands: Number(totalBrands),
      totalPodiums: Number(totalPodiums),
      totalVotes: Number(totalPodiums) * 3,
      dateRange: {
        from: firstVote?.minDate?.toISOString().split("T")[0] ?? "unknown",
        to: lastVote?.maxDate?.toISOString().split("T")[0] ?? CUTOFF_DAY,
      },
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, 2))
    console.log("   ✓ summary.json")
    console.log(`   - ${summary.totalUsers.toLocaleString()} users`)
    console.log(`   - ${summary.totalBrands.toLocaleString()} brands`)
    console.log(`   - ${summary.totalPodiums.toLocaleString()} podiums`)

    // Timeseries
    console.log("\n📊 Generating timeseries...")
    const [votesPerDayRaw] = await conn.query<any>(
      `SELECT DATE(date) as day, COUNT(*) as count
       FROM user_brand_votes
       WHERE date <= ?
       GROUP BY DATE(date)
       ORDER BY day ASC`,
      [CUTOFF_DAY]
    )
    const votesPerDay = votesPerDayRaw.map((r: any) => ({
      day: r.day.toISOString().split("T")[0],
      count: Number(r.count),
    }))

    const [activeUsersRaw] = await conn.query<any>(
      `SELECT DATE(DATE_SUB(date, INTERVAL WEEKDAY(date) DAY)) as weekStart, COUNT(DISTINCT userId) as count
       FROM user_brand_votes
       WHERE date <= ?
       GROUP BY weekStart
       ORDER BY weekStart ASC`,
      [CUTOFF_DAY]
    )
    const activeUsersPerWeek = activeUsersRaw.map((r: any) => ({
      weekStart: r.weekStart.toISOString().split("T")[0],
      count: Number(r.count),
    }))

    const timeseries = { votesPerDay, activeUsersPerWeek }
    fs.writeFileSync(path.join(OUTPUT_DIR, "timeseries.json"), JSON.stringify(timeseries, null, 2))
    console.log("   ✓ timeseries.json")
    console.log(`   - ${votesPerDay.length} days of votes`)
    console.log(`   - ${activeUsersPerWeek.length} weeks of active users`)

    // Toplists
    console.log("\n📊 Generating toplists...")
    
    // Top brands
    const [topBrandsRaw] = await conn.query<any>(
      `SELECT id, name, imageUrl, channel, score FROM brands WHERE banned = 0 ORDER BY score DESC LIMIT ?`,
      [TOP_N]
    )
    
    const topBrandsAllTime = []
    for (const brand of topBrandsRaw) {
      const [[{ gold }]] = await conn.query<any>(
        "SELECT COUNT(*) as gold FROM user_brand_votes WHERE brand1Id = ? AND date <= ?",
        [brand.id, CUTOFF_DAY]
      )
      const [[{ silver }]] = await conn.query<any>(
        "SELECT COUNT(*) as silver FROM user_brand_votes WHERE brand2Id = ? AND date <= ?",
        [brand.id, CUTOFF_DAY]
      )
      const [[{ bronze }]] = await conn.query<any>(
        "SELECT COUNT(*) as bronze FROM user_brand_votes WHERE brand3Id = ? AND date <= ?",
        [brand.id, CUTOFF_DAY]
      )
      topBrandsAllTime.push({
        brandId: brand.id,
        name: brand.name,
        imageUrl: brand.imageUrl,
        channel: brand.channel,
        gold: Number(gold),
        silver: Number(silver),
        bronze: Number(bronze),
        totalVotes: Number(gold) + Number(silver) + Number(bronze),
        score: brand.score ?? 0,
      })
    }

    // Top users
    const [topUsersRaw] = await conn.query<any>(
      `SELECT id, fid, username, photoUrl, points FROM users ORDER BY points DESC LIMIT ?`,
      [TOP_N]
    )
    
    const topUsersAllTime = []
    for (const user of topUsersRaw) {
      const [[{ totalVotes }]] = await conn.query<any>(
        "SELECT COUNT(*) as totalVotes FROM user_brand_votes WHERE userId = ? AND date <= ?",
        [user.id, CUTOFF_DAY]
      )
      topUsersAllTime.push({
        odiumId: user.id,
        fid: user.fid,
        username: user.username,
        photoUrl: user.photoUrl,
        totalVotes: Number(totalVotes),
        points: user.points ?? 0,
      })
    }

    // Categories
    const [categoriesRaw] = await conn.query<any>(
      `SELECT c.id, c.name, COUNT(DISTINCT b.id) as brandCount
       FROM categories c
       LEFT JOIN brands b ON b.categoryId = c.id AND b.banned = 0
       GROUP BY c.id, c.name
       HAVING brandCount > 0`
    )
    
    const categoryDistribution = []
    for (const cat of categoriesRaw) {
      const [[{ voteCount }]] = await conn.query<any>(
        `SELECT COUNT(*) as voteCount FROM user_brand_votes v
         WHERE v.date <= ?
         AND (v.brand1Id IN (SELECT id FROM brands WHERE categoryId = ?)
           OR v.brand2Id IN (SELECT id FROM brands WHERE categoryId = ?)
           OR v.brand3Id IN (SELECT id FROM brands WHERE categoryId = ?))`,
        [CUTOFF_DAY, cat.id, cat.id, cat.id]
      )
      categoryDistribution.push({
        name: cat.name,
        brandCount: Number(cat.brandCount),
        voteCount: Number(voteCount),
      })
    }
    categoryDistribution.sort((a, b) => b.voteCount - a.voteCount)

    const toplists = { topBrandsAllTime, topUsersAllTime, categoryDistribution }
    fs.writeFileSync(path.join(OUTPUT_DIR, "toplists.json"), JSON.stringify(toplists, null, 2))
    console.log("   ✓ toplists.json")
    console.log(`   - Top ${topBrandsAllTime.length} brands`)
    console.log(`   - Top ${topUsersAllTime.length} users`)
    console.log(`   - ${categoryDistribution.length} categories`)

    console.log("\n✅ S1 Snapshot generated successfully!")
  } finally {
    await conn.end()
  }
}

main().catch((e) => {
  console.error("❌ Error:", e.message)
  process.exit(1)
})
