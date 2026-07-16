Node proxy example

This folder contains a minimal Express-based proxy that forwards requests to the GitHub API using a server-side token.

Usage:
1. Deploy to any host (Heroku, Vercel, Render) or run locally.
2. Set the environment variable GITHUB_TOKEN to a PAT that can access the target repositories (if private access is needed).
3. Start: node node-server.js
4. Call: GET /repos?org=kidwords

Notes:
- This proxy is intentionally minimal. Add authentication (API key, JWT, etc.) before exposing it publicly if it uses a PAT.
- The server sets a caching header to reduce repeated requests.
