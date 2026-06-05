import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Eski /therapist/ → yeni tip bazlı URL (psikolog default)
      { source: "/:locale/therapist/:slug", destination: "/:locale/psikolog/:slug", permanent: true },
      // /tr/therapists/ → /tr/terapistler/ (SEO)
      { source: "/tr/therapists", destination: "/tr/terapistler", permanent: true },
      { source: "/tr/therapists/:path*", destination: "/tr/terapistler/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // /terapistler/ isteğini içeride /therapists/ route'una yönlendir
      { source: "/:locale/terapistler", destination: "/:locale/therapists" },
      { source: "/:locale/terapistler/:path*", destination: "/:locale/therapists/:path*" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "ozsqrekaugyvodmajxqr.supabase.co" },
    ],
  },
};

export default withNextIntl(nextConfig);
