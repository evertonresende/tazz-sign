# tazz-sign

Verificação de assinatura digital TAZZ — serviço temporário em `sign.tazz.app`.

## O que é

- **Página web**: `sign.tazz.app/{uuid}` — animação de verificação + confirmação de assinatura válida
- **PDF**: comprovante de renda em `docs/comprovante-renda-everton-resende.pdf`

## Setup

```bash
npm install
npm run generate:pdf   # gera o PDF
npm run dev            # preview local
npm run deploy         # build + wrangler deploy
```

## Documento atual

| Campo | Valor |
|---|---|
| Titular | Éverton Augusto Resende |
| CPF | 119.769.206-12 |
| Renda | R$ 3.000,00/mês |
| Assinatura | Glauber Soares, CEO TAZZ Inc. |
| ID | `7c4e9a2b-1f8d-4e6a-b3c5-9d2e8f1a6b4c` |
| Verificação | https://sign.tazz.app/7c4e9a2b-1f8d-4e6a-b3c5-9d2e8f1a6b4c |

## Desativar

Quando não precisar mais: delete o worker `tazz-sign` no dashboard Cloudflare ou remova a route `sign.tazz.app`.
