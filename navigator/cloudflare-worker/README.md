Cloudflare Worker proxy (example)

This folder contains a minimal Cloudflare Worker that proxies requests to the GitHub API using a secret PAT.

Deploy steps (summary):
1. Install Wrangler: npm install -g wrangler
2. Create a new Worker project or add this file to your worker project.
3. Add secret: wrangler secret put GITHUB_TOKEN
4. Deploy: wrangler publish

Usage example:
GET https://<your-worker>.workers.dev/?org=kidwords

The worker will return a JSON array of repositories mapped to a minimal set of fields. It uses an Authorization header if GITHUB_TOKEN is present.

Security:
- Keep the token in Worker secrets only. Do NOT commit PAT to this repo.
- Consider adding basic auth or other access control if exposing private data.
