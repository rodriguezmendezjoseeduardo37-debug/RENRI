import { notFound } from "next/navigation";
import { getPublicBusinessInfo } from "@/actions/public-business";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Package } from "lucide-react";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PublicBusinessShopPage({ params }: Props) {
    const { id } = await params;
    const data = await getPublicBusinessInfo(id);

    if (!data || !data.products.available) return notFound();

    const { business, products } = data;

    return (
        <div className="min-h-screen bg-[hsl(0,0%,3.9%)] text-white">
            {/* Header */}
            <header className="border-b border-[#222222] bg-[#050505] sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/negocio/${business.id}`}
                            className="w-10 h-10 border border-[#222222] flex items-center justify-center hover:bg-white hover:text-black transition-colors rounded-full mr-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        {business.logoUrl ? (
                            <img
                                src={business.logoUrl}
                                alt={business.name}
                                className="w-10 h-10 rounded-full object-cover border border-[#222222]"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center">
                                <span className="text-base font-bold text-white uppercase">
                                    {business.name.charAt(0)}
                                </span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-sm font-bold tracking-tight uppercase">
                                Tienda • {business.name}
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
                <section>
                    <div className="border-b border-[#222222] pb-4 mb-6">
                        <h2 className="text-2xl font-bold tracking-[0.05em] uppercase flex items-center gap-3 font-[family-name:var(--font-heading)]">
                            <ShoppingBag className="w-5 h-5" />
                            Catálogo
                        </h2>
                        <p className="text-[11px] text-[#888888] tracking-[0.15em] uppercase mt-1">
                            PRODUCTOS DISPONIBLES AL PÚBLICO
                        </p>
                    </div>

                    {products.items.length === 0 ? (
                        <div className="border border-[#222222] bg-[#111111] p-10 text-center">
                            <Package className="w-10 h-10 text-[#444444] mx-auto mb-4" />
                            <p className="text-[#888888] text-sm tracking-wide">
                                Aún no hay productos públicos.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.items.map((product) => (
                                <div
                                    key={product.id}
                                    className="border border-[#222222] bg-[#111111] flex flex-col overflow-hidden hover:border-[#444444] transition-colors group"
                                >
                                    {product.imageUrl ? (
                                        <div className="aspect-square bg-[#0a0a0a] overflow-hidden">
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center">
                                            <Package className="w-10 h-10 text-[#222222]" />
                                        </div>
                                    )}
                                    <div className="p-5 flex flex-col flex-1">
                                        {product.category && (
                                            <span className="text-[10px] font-bold tracking-[0.2em] text-[#666666] uppercase">
                                                {product.category}
                                            </span>
                                        )}
                                        <h3 className="text-base font-bold text-white mt-1 uppercase tracking-wider">
                                            {product.name}
                                        </h3>
                                        {product.description && (
                                            <p className="text-xs text-[#888888] mt-2 line-clamp-3 leading-relaxed flex-1">
                                                {product.description}
                                            </p>
                                        )}
                                        <div className="flex items-end justify-between mt-4 border-t border-[#222222] pt-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-[#666666] tracking-[0.2em] uppercase mb-1">
                                                    PRECIO
                                                </span>
                                                <span className="text-xl font-bold font-mono text-white">
                                                    ${product.price}
                                                </span>
                                            </div>
                                            {product.stock > 0 ? (
                                                <span className="px-2 py-1 bg-[#112211] border border-[#224422] text-[9px] text-green-400 font-bold tracking-[0.15em] uppercase">
                                                    EN STOCK
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-[#221111] border border-[#442222] text-[9px] text-red-400 font-bold tracking-[0.15em] uppercase">
                                                    AGOTADO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
