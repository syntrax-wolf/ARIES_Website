export const prerender = true;

const site = import.meta.env.SITE || "https://aries-website.devansh-654.workers.dev";
const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /api/

Sitemap: ${new URL("sitemap-index.xml", site).href}
`;

export function GET() {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
