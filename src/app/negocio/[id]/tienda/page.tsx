import { notFound } from "next/navigation";
import { getPublicBusinessInfo } from "@/actions/public-business";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingBag, Package } from "lucide-react";
import { BuyButton } from "@/components/public/buy-button";
import { getCurrentUser } from "@/lib/auth-helpers";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PublicBusinessShopPage({ params }: Props) {
    const { id } = await params;
    const data = await getPublicBusinessInfo(id);

    if (!data || !data.products.available) return notFound();

    const { business, products } = data;

    // Detect logged-in user to pre-fill buy modal
    const currentUser = await getCurrentUser();

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border bg-card sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/negocio/${business.id}`}
                            className="w-11 h-11 border border-border flex items-center justify-center hover:bg-[#bec092] hover:text-black hover:border-[#bec092] transition-colors rounded-xl mr-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        {business.logoUrl ? (
                            <Image
                                src={business.logoUrl}
                                alt={business.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-xl object-cover border border-border"
                                unoptimized
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#bec092]/10 border border-[#bec092]/20 flex items-center justify-center">
                                <span className="text-base font-bold text-foreground uppercase">
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
                    <div className="border-b border-border pb-4 mb-6">
                        <h2 className="text-2xl font-bold tracking-[0.05em] uppercase flex items-center gap-3 font-[family-name:var(--font-heading)]">
                            <ShoppingBag className="w-5 h-5" />
                            Catálogo
                        </h2>
                        <p className="text-[11px] text-muted-foreground tracking-[0.15em] uppercase mt-1">
                            PRODUCTOS DISPONIBLES AL PÚBLICO
                        </p>
                    </div>

                    {products.items.length === 0 ? (
                        <div className="border border-border bg-card p-10 text-center rounded-2xl">
                            <Package className="w-10 h-10 text-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-sm tracking-wide">
                                Aún no hay productos públicos.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.items.map((product) => (
                                <div
                                    key={product.id}
                                    className="border border-border bg-card flex flex-col overflow-hidden hover:border-[#bec092]/30 transition-colors group rounded-2xl"
                                >
                                    {product.imageUrl ? (
                                            <div className="aspect-square bg-background overflow-hidden rounded-t-2xl">
                                            <Image
                                                src={product.imageUrl}
                                                alt={product.name}
                                                width={400}
                                                height={400}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square bg-background flex items-center justify-center rounded-t-2xl">
                                            <Package className="w-10 h-10 text-foreground" />
                                        </div>
                                    )}
                                    <div className="p-5 flex flex-col flex-1">
                                        {product.category && (
                                            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                                                {product.category}
                                            </span>
                                        )}
                                        <h3 className="text-base font-bold text-foreground mt-1 uppercase tracking-wider">
                                            {product.name}
                                        </h3>
                                        {product.description && (
                                            <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed flex-1">
                                                {product.description}
                                            </p>
                                        )}
                                        <div className="flex items-end justify-between mt-4 border-t border-border pt-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mb-1">
                                                    PRECIO
                                                </span>
                                                <span className="text-xl font-bold font-mono text-foreground">
                                                    ${product.price}
                                                </span>
                                            </div>
                                            {product.stock > 0 ? (
                                                <span className="px-2 py-1 bg-[#bec092]/10 border border-[#bec092]/20 text-[9px] text-[#bec092] font-bold tracking-[0.15em] uppercase rounded-lg">
                                                    EN STOCK
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 font-bold tracking-[0.15em] uppercase rounded-lg">
                                                    AGOTADO
                                                </span>
                                            )}
                                        </div>
                                        <BuyButton
                                            businessId={business.id}
                                            productId={product.id}
                                            productName={product.name}
                                            price={product.price}
                                            inStock={product.stock > 0}
                                            initialName={currentUser?.name ?? ""}
                                            initialEmail={currentUser?.email ?? ""}
                                            clientId={currentUser?.id ?? null}
                                        />
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
