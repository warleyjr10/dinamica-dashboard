# Dinâmica: monte o seu dashboard do SMB

App do congresso COONTROL 2026. Cada pessoa abre o link no celular, escreve o nome e monta um dashboard com cards prontos. O telão mostra os dashboards da plateia quase em tempo real (atualiza a cada 1,5 segundo).

## Endereços do app

- `/` : tela da plateia (celular).
- `/telao` : telão. Mostra quantas pessoas estão online (páginas abertas nos últimos 30 segundos). Os botões de apagar (um dashboard ou todos) aparecem sem precisar de chave enquanto a variável `HOST_KEY` não existir. Se você criar `HOST_KEY`, passe a abrir `/telao?key=SUA_CHAVE`.
- No canto do telão há o QR code e o link. Clique no link para colar outro endereço (por exemplo um domínio próprio). O QR code se atualiza sozinho.
- `/api/v1/health` : mostra se o app está de pé e se o Redis está conectado (`armazenamento: redis`).

## Publicar na Vercel

1. Crie um projeto novo na Vercel apontando para esta pasta (importando de um repositório Git, ou rodando `npx vercel` dentro da pasta).
2. No projeto, abra **Storage** (ou **Marketplace**), escolha **Upstash Redis**, crie e conecte ao projeto. A Vercel preenche sozinha `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
3. (Opcional) Em **Settings > Environment Variables**, crie `HOST_KEY` com uma senha curta. Com ela, só quem abrir `/telao?key=SUA_CHAVE` consegue apagar dashboards. Sem ela, qualquer pessoa que souber o endereço `/telao` consegue.
4. Faça um novo deploy (para o app enxergar as variáveis).
5. Abra `/api/v1/health` e confira `"armazenamento":"redis"`. Se aparecer `memoria`, o Redis não está conectado e os dashboards podem sumir.
6. Abra `/telao` no computador do telão e teste com seu celular.

## Rodar no computador (teste)

```
npm install
npm run dev
```

Sem Redis configurado, o app usa a memória do próprio computador (serve só para testar). Para usar Redis localmente, copie `.env.local.example` para `.env.local` e preencha.

## Observações

- Os valores dos cards são ilustrativos (brincadeira). Não há dado de cliente.
- Os dados ficam no Redis por 48 horas e a sala aceita até 400 dashboards.
- App temporário de evento: sem login e sem tabelas de negócio. Fora do padrão COONTROL (Next.js + Supabase) por decisão do projeto, usando Redis da Vercel. Se virar app permanente, consultar a TI (software@coontrol.com.br).
