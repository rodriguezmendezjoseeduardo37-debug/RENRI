import localFont from "next/font/local";

const headingFont = localFont({
    src: "../../fonts/GeistMonoVF.woff",
    variable: "--font-heading",
    weight: "100 900",
});

const bodyFont = localFont({
    src: "../../fonts/GeistVF.woff",
    variable: "--font-body",
    weight: "100 900",
});

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className={`${headingFont.variable} ${bodyFont.variable} font-[family-name:var(--font-body)] min-h-screen bg-background text-foreground`}
        >
            {children}
        </div>
    );
}
