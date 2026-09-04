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

## Contracheque / payment statement (POC)

Gerador de demonstrativo de pagamento no formato americano. Os dados de folha vêm de um
JSON — o PDF só renderiza o que está lá, nada é calculado ou presumido.

```bash
npm run generate:paystub                       # usa scripts/paystub.data.json (ou o .example)
node scripts/generate-paystub.mjs caminho.json # arquivo avulso
npm test                                       # self-check das somas e das guardas
```

Saída: `docs/paystub-<statementNo>.pdf`. Exemplo renderizado: `docs/paystub-exemplo.pdf`.

### Dois modos, por `payee.classification`

| Modo | Quando | O que sai no PDF |
|---|---|---|
| `contractor` | prestador no exterior (1099-NEC / W-8BEN) | "CONTRACTOR PAYMENT STATEMENT", sem retenção; nota dizendo que não evidencia vínculo empregatício nos EUA |
| `employee` | folha americana real, com EIN e retenção | "EARNINGS STATEMENT" com tabela de Federal / FICA / Medicare / estadual |

Guardas que o script aplica (falham na geração, não no papel):

- `contractor` com linha de dedução → erro. Retenção de imposto americano só existe em folha real.
- `deposit.last4` que não seja exatamente 4 dígitos → erro. **Número de conta completo nunca entra no documento nem no JSON.**
- Líquido negativo, ou centavos não inteiros → erro. Todo valor é inteiro em centavos.

`ytdCents: null` sai como `—`, não como `$0.00`: acumulado do ano ou é número real ou não
aparece. `deposit: null` omite o bloco de depósito inteiro.

`scripts/paystub.data.json` e os PDFs gerados são gitignorados — dados reais de pagamento,
banco e endereço ficam fora do repo. Commitados só o `.example` e o `paystub-exemplo.pdf`.
