# tazz-sign — verificação de assinatura digital (temporário)

Serviço efêmero hospedado em **sign.tazz.app** na conta Cloudflare TAZZ. Página React
simples que valida um UUID de documento e exibe animação de verificação com logo TAZZ.

## Comandos

- Dev: `npm run dev` → http://localhost:5174
- Build: `npm run build`
- PDF: `npm run generate:pdf` → `docs/comprovante-renda-everton-resende.pdf`
- Deploy: `npm run deploy` (manual — **não** há CI)

## URL de verificação

```
https://sign.tazz.app/7c4e9a2b-1f8d-4e6a-b3c5-9d2e8f1a6b4c
```

## Deploy

Conta CF TAZZ (`6b9d106f19c6fc536146e7e5487198fe`). Custom domain `sign.tazz.app` definido
no `wrangler.jsonc`. Primeiro deploy:

```bash
npm install
npm run generate:pdf
npm run deploy
```

Desativar depois: remover route/custom domain no dashboard CF ou deletar o worker.

## Repo

GitHub: `evertonresende/tazz-sign` (pessoal — serviço temporário, fora do org tazz-app).
