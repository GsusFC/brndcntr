"use client"

interface AttributeCardProps {
    title: string
    description: string
}

const AttributeCard = ({ title, description }: AttributeCardProps) => (
    <div className="relative flex h-full w-full min-h-0 items-center justify-center p-6 md:p-5 lg:p-6">
        <div className="flex min-h-0 max-w-[320px] flex-col items-start gap-3 md:gap-4">
            <h3
                className="font-druk text-[clamp(18px,2.1vw,32px)] font-bold leading-[103%] text-white"
                style={{ whiteSpace: 'pre-line' }}
            >
                {title}
            </h3>
            <p className="self-stretch font-inter text-[clamp(12px,1.15vw,20px)] font-normal leading-[103%] text-white">
                {description}
            </p>
        </div>
    </div>
)

interface MediaSlotProps {
    src?: string
    type?: "video" | "image"
    alt?: string
}

const MediaSlot = ({ src, type = "image", alt = "" }: MediaSlotProps) => (
    <div className="relative h-full w-full bg-white">
        {src ? (
            type === "video" ? (
                <video
                    src={src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                />
            ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                />
            )
        ) : null}
    </div>
)

const attributes = {
    archive: {
        title: "A Living Archive\nof Onchain Brands",
        description: "BRND is more than a snapshot—it's a growing history of brand activity and evolution. By archiving user podiums, votes, and brand movements, BRND builds an ongoing record for the whole ecosystem. Brands are given space to evolve, and community contributions are preserved as a testament to creative progress in Web3 design and strategy."
    },
    research: {
        title: "A Research\nEngine for Brands",
        description: "BRND redefines brand discovery, acting as a real-time research tool where users actively vote for their favorite onchain brands using $BRND tokens. Each podium and vote collected in the miniapp fuels a dynamic archive—curating not just assets, but lived interactions and continually updating insight into brand attention and relevance."
    },
    catalyst: {
        title: "A Catalyst\nfor Inspiration",
        description: "By connecting users, creators, and founders, BRND provides constant inspiration—the pulse of what's trending, shifting, and admired. It's not just about what's new; it's about showing changes over time, giving historical context to every brand that enters the leaderboard and spotlighting the creative energy that drives Web3 innovation."
    }
}

export const BrndAttributes = () => {
    return (
        <section className="w-full bg-black">
            {/* Title */}
            <div className="px-4 py-8 md:py-12 lg:py-16">
                <h2 className="text-center font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold uppercase leading-tight text-white">
                    BRND ATTRIBUTES
                </h2>
            </div>

            {/* Grid Layout - Single column mobile, 3 cols desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Row 1 */}
                {/* Archive - Black */}
                <div className="aspect-square overflow-hidden bg-black">
                    <AttributeCard
                        title={attributes.archive.title}
                        description={attributes.archive.description}
                    />
                </div>

                {/* Media 1 - White */}
                <div className="aspect-square overflow-hidden">
                    <MediaSlot src="/images/BRND%20-%20V2%20-1.jpg" alt="BRND attributes media 1" />
                </div>

                {/* Research - Black */}
                <div className="aspect-square overflow-hidden bg-black">
                    <AttributeCard
                        title={attributes.research.title}
                        description={attributes.research.description}
                    />
                </div>

                {/* Row 2 */}
                {/* Media 2 - White */}
                <div className="aspect-square overflow-hidden">
                    <MediaSlot src="/images/BRND%20-%20V2%20-%202.jpg" alt="BRND attributes media 2" />
                </div>

                {/* Catalyst - Black */}
                <div className="aspect-square overflow-hidden bg-black">
                    <AttributeCard
                        title={attributes.catalyst.title}
                        description={attributes.catalyst.description}
                    />
                </div>

                {/* Media 3 - White */}
                <div className="aspect-square overflow-hidden">
                    <MediaSlot src="/images/BRND%20-%20V2%20-%203.jpg" alt="BRND attributes media 3" />
                </div>
            </div>
        </section>
    )
}
