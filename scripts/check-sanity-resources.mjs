// Quick diagnostic: fetch resources from Sanity HTTP API and print results.
// Usage:
//   NEXT_PUBLIC_SANITY_PROJECT_ID=yourId NEXT_PUBLIC_SANITY_DATASET=production node scripts/check-sanity-resources.mjs

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-08';

if (!projectId || !dataset) {
  console.error('Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET');
  process.exit(1);
}

const query = encodeURIComponent('*[_type == "resource"]{title, slug, type, featured, addedOn, _id, _createdAt}');
const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${query}`;

(async () => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    console.log('total:', json?.result?.length ?? 0);
    for (const d of json.result || []) {
      console.log('-', d.title, '| type:', d.type, '| featured:', d.featured, '| slug:', d.slug?.current ?? d.slug, '| addedOn:', d.addedOn ?? d._createdAt);
    }
  } catch (err) {
    console.error('Error querying Sanity:', err);
    process.exit(2);
  }
})();
