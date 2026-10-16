# Reencontro — Web app (React + Vite)

Frontend independente. Responsivo: celular (menu inferior), tablet e computador (barra superior, grades de cards, rodapé).

```bash
cp .env.example .env     # VITE_API_URL=  (vazio em dev usa o proxy do Vite para localhost:3000)
npm install
npm run dev              # http://localhost:5173
npm run build            # gera dist/ para Vercel, Netlify, Cloudflare Pages, S3...
```
Em produção defina `VITE_API_URL=https://sua-api.exemplo.com` (sem barra no final) e coloque a URL do site em `CORS_ORIGIN` no backend. `public/_redirects` já cobre o fallback SPA do Netlify; na Vercel use rewrite para `/index.html`.
