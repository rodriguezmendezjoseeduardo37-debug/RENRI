import Script from "next/script";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function AdSense() {
    const user = await getCurrentUser();
    
    // If the user is logged in and has a paid plan (not starter), don't show ads
    if (user && user.plan !== "starter") {
        return null;
    }

    return (
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1980082261486602"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
    );
}
