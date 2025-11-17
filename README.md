# colors-mongodb-api

Lightweight Vercel Serverless API for storing and retrieving pigment color pairs in MongoDB.

This repository exposes serverless endpoints under `/api` (e.g. `/api/pigmentColors`) and uses the official MongoDB Node driver.

## What this project needs

- Node.js (recommended 18.x)
- MongoDB connection string (Atlas or other MongoDB)
- Vercel account / Vercel CLI for local dev and deployment

## Quick setup (local)

1. Initialize the project (if you haven't already):

```bash
npm init -y
```

2. Install dependencies:

```bash
npm install mongodb dotenv
```

3. Ensure `package.json` contains `