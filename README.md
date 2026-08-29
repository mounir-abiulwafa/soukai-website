# Soukai LLC website

The official static corporate website for **Soukai LLC**. It presents the company and its current product, Is This a Scam?.

## Local preview

This is a dependency-free static site. From the repository root, serve the files with any static HTTP server, for example:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deployment

Deploy this repository as a separate static Vercel project.

Intended company-site domains:

- `getsoukai.com`
- `www.getsoukai.com`

## Important domain safety rule

**Never modify, reassign, or configure `scam.getsoukai.com` from this project.**

That subdomain belongs to the separate Is This a Scam? production backend and must remain independently deployed.
