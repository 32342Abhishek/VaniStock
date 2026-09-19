# VaaniStock Frontend

The frontend is a React and Vite application for the VaaniStock inventory workflow.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

Set `VITE_API_URL` when the API is not running at `http://localhost:8000`.

Routes are loaded lazily, and Reports charting dependencies are isolated into a separate chunk so the initial application bundle stays smaller.
