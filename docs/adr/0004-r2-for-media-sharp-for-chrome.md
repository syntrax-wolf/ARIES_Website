# R2 for Media, Sharp at build for Chrome

Workers have no disk. Chrome is in git and Sharp’d during `astro build`. Media arrives after deploy, so it cannot live in the Worker bundle. R2 replaces Supabase Storage: object store, free egress, no Images product. Uploads are resized in the browser before PUT so the Worker does not transcode. We rebuild public HTML on publish so new Media URLs appear without SSR.
