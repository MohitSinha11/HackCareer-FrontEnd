# HackCareer Frontend

## Local development

```bash
npm install
npm run dev
```

For local backend integration, keep Vite proxy and call `/api/...` routes.

## Production environment variables

Create env vars in your hosting platform:

- `VITE_API_BASE_URL` (required for live backend)
- `VITE_DEMO_MODE=false` (recommended)

Example:

```bash
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_DEMO_MODE=false
```

## Build

```bash
npm run build
```
# HackCareer
