/**
 * Generates an SVG string for a rank badge.
 * This is used to ensure perfect data visualization in html2canvas exports
 * where CSS Flexbox/Grid centering can sometimes fail or drift.
 */
export function getRankSvgString(rank: number, size: number = 36): string {
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2

    let defs = ""
    let circleFill = ""
    let textColor = ""
    let stroke = ""

    // Unique ID for gradients to avoid conflicts if multiple SVGs are on page
    const gradId = `rank-grad-${rank}-${Math.random().toString(36).substr(2, 9)}`

    switch (rank) {
        case 1:
            defs = `
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#facc15;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#ca8a04;stop-opacity:1" />
                </linearGradient>
            `
            circleFill = `url(#${gradId})`
            textColor = "black"
            break
        case 2:
            defs = `
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#d4d4d8;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#71717a;stop-opacity:1" />
                </linearGradient>
            `
            circleFill = `url(#${gradId})`
            textColor = "black"
            break
        case 3:
            defs = `
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#d97706;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#92400e;stop-opacity:1" />
                </linearGradient>
            `
            circleFill = `url(#${gradId})`
            textColor = "white"
            break
        default:
            circleFill = "#27272a"
            textColor = "#a1a1aa"
            stroke = 'stroke="#3f3f46" stroke-width="1"'
            break
    }

    // SVG with explicit viewport and centered text using SVG coordinates
    // dominant-baseline="central" and text-anchor="middle" are key for centering
    return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <defs>${defs}</defs>
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${circleFill}" ${stroke} />
            <text 
                x="50%" 
                y="50%" 
                dominant-baseline="central" 
                text-anchor="middle" 
                fill="${textColor}" 
                font-family="system-ui, -apple-system, sans-serif" 
                font-weight="900" 
                font-size="${size * 0.42}px"
            >${rank}</text>
        </svg>
    `.replace(/\s+/g, " ").trim() // Minify slightly for easier string embedding
}
