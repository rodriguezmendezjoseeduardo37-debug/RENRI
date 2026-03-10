interface ServiceCardProps {
    name: string;
    price: string | null;
    selected: boolean;
    onClick: () => void;
}

export function ServiceCard({
    name,
    price,
    selected,
    onClick,
}: ServiceCardProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-5 border transition-all ${selected
                    ? "border-white bg-white text-black"
                    : "border-[#222222] bg-[#111111] text-white hover:border-[#444444]"
                }`}
        >
            <h3
                className={`text-sm font-bold tracking-[0.1em] uppercase ${selected ? "text-black" : "text-white"
                    }`}
            >
                {name}
            </h3>
            {price && (
                <p
                    className={`mt-2 text-lg font-bold font-mono ${selected ? "text-black" : "text-[#888888]"
                        }`}
                >
                    ${Number(price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
            )}
        </button>
    );
}
