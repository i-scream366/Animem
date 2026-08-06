/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Erlaubt Thumbnails von beliebigen HTTPS-Quellen (Admins pflegen die URLs im CMS).
    // Für Produktion empfiehlt sich, `remotePatterns` auf konkrete Hoster einzuschränken.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
