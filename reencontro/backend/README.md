# Reencontro — API (NestJS)

API independente do frontend. Pode ser publicada em qualquer lugar (Render, Railway, Fly.io, VPS, Docker).

## Rodar
```bash
cp .env.example .env
npm install
npm run start:dev        # http://localhost:3000/api
```
Contas demo (SEED_DEMO=true): admin@reencontro.app / Admin@12345 · familiar@demo.app, cidadao@demo.app, ong@demo.app, orgao@demo.app / Demo@12345.

## Banco de dados (escolha em `.env`)
| Opção | Config |
|---|---|
| SQLite local (padrão) | `DB_TYPE=sqlite`, `DB_PATH=reencontro.sqlite` |
| PostgreSQL local | `docker compose up -d db` + `DB_TYPE=postgres`, `DATABASE_URL=postgresql://reencontro:reencontro@localhost:5432/reencontro` |
| PostgreSQL na internet (Neon, Supabase, Railway, RDS…) | `DB_TYPE=postgres`, `DATABASE_URL=<url do provedor>`, `DB_SSL=true` |

Em produção use `DB_SYNC=false` e migrations do TypeORM.

## Armazenamento de arquivos
| Opção | Config |
|---|---|
| Disco local (padrão) | `STORAGE_DRIVER=local` (pasta `uploads/`) |
| Nuvem compatível com S3 (AWS S3, Cloudflare R2, Supabase Storage, Backblaze B2, MinIO) | `STORAGE_DRIVER=s3`, `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` |

Só aceita JPG/PNG de até 5 MB, conferindo os bytes do arquivo. Em hospedagens com disco efêmero (Render free, Heroku) use S3.

## IA com Gemini
Defina `GEMINI_API_KEY` (https://aistudio.google.com/apikey) e, se quiser, `GEMINI_MODEL`.
- A heurística local escolhe até 10 casos candidatos; o Gemini os reclassifica e explica o motivo (saída em JSON validada).
- Dados enviados ao Gemini: pista e, de cada caso, apenas primeiro nome e características. Nunca contato, responsável ou foto.
- Texto da pista é tratado como dado não confiável (proteção contra prompt injection) e a sugestão nunca confirma nada sozinha.
- Sem chave, ou se o Gemini falhar/demorar mais de 15 s, usa automaticamente a análise local.
- Atenção LGPD: confira os termos do plano da API do Gemini (o nível gratuito pode usar dados para melhoria dos produtos); para dados reais prefira o plano pago.

## Docker
`docker compose --profile full up --build` sobe a API com PostgreSQL.
