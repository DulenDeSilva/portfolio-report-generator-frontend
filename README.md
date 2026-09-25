# Portfolio Report Generator — Frontend

React UI for uploading a master portfolio or loading holdings from ITMS, then downloading PDF/Excel reports.

This repo is the UI only. The API lives in `portfolio-report-generator` (backend).

## Local run

1. Start the backend on port 4000 (`npm run dev` in the backend repo).
2. In this folder:

```bash
npm install
npm run dev
```

Opens http://localhost:5173. Vite proxies `/api` to `http://127.0.0.1:4000`.
