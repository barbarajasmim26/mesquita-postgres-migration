# Configuração no Render - Mesquita Imóveis

## 📋 Pré-requisitos

1. Conta no Render (https://render.com)
2. PostgreSQL Database criado no Render
3. Código do projeto no GitHub

## 🔧 Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel do Render:

```
DATABASE_URL=postgresql://mesquita_db_user:DgDeIbvWfueBQn62ZypDik58eabvFuEW@dpg-d76tfh1aae7s73dgi5i0-a.oregon-postgres.render.com/mesquita_db

NODE_ENV=production

VITE_APP_ID=seu_app_id
VITE_OAUTH_PORTAL_URL=https://seu-oauth-url
OAUTH_SERVER_URL=https://seu-oauth-url

JWT_SECRET=seu_jwt_secret_aqui

OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=Barbara

BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api

VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua_chave_api_frontend

VITE_APP_TITLE=Mesquita Imóveis
VITE_APP_LOGO=https://seu-logo-url

VITE_ANALYTICS_ENDPOINT=https://analytics-endpoint
VITE_ANALYTICS_WEBSITE_ID=seu_website_id
```

## 📝 Passos para Deploy

### 1. Criar Web Service no Render

1. Acesse https://dashboard.render.com
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** mesquita-imoveis
   - **Runtime:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Instance Type:** Free (ou pago conforme necessário)

### 2. Adicionar Variáveis de Ambiente

1. No painel do Web Service, vá para "Environment"
2. Adicione todas as variáveis listadas acima
3. Clique em "Save"

### 3. Deploy

1. Clique em "Create Web Service"
2. O Render iniciará o build automaticamente
3. Aguarde a conclusão (pode levar 5-10 minutos)

### 4. Importar Dados (Primeira Vez)

Após o deploy bem-sucedido, importe os dados:

```bash
# Via console do Render ou localmente
DATABASE_URL="postgresql://..." pnpm import:data
```

## 🔐 Segurança

- ✅ SSL/TLS ativado automaticamente
- ✅ DATABASE_URL com credenciais seguras
- ✅ JWT_SECRET deve ser uma string aleatória forte
- ✅ Não commit `.env` no GitHub

## 📊 Monitoramento

Após o deploy, monitore:

1. **Logs:** Dashboard do Render → "Logs"
2. **Métricas:** Dashboard do Render → "Metrics"
3. **Saúde:** Acesse https://seu-app.onrender.com

## 🆘 Troubleshooting

### Build falha
- Verifique se `pnpm` está instalado
- Confirme que `package.json` está correto
- Veja os logs de build no Render

### Erro de conexão com banco
- Verifique DATABASE_URL
- Confirme que PostgreSQL está ativo no Render
- Teste a conexão localmente primeiro

### Dados não aparecem
- Confirme que as migrations foram aplicadas
- Execute o script de importação
- Verifique os logs do servidor

### Erro 502 Bad Gateway
- Aguarde alguns minutos (pode estar iniciando)
- Verifique os logs do servidor
- Confirme que todas as variáveis de ambiente estão definidas

## 📞 Suporte Render

- Documentação: https://render.com/docs
- Status: https://status.render.com
- Email: support@render.com

## ✅ Checklist Final

- [ ] Repositório no GitHub
- [ ] Web Service criado no Render
- [ ] Variáveis de ambiente configuradas
- [ ] Build bem-sucedido
- [ ] Dados importados
- [ ] Login funciona (barbara/mesquitaimoveis)
- [ ] Dashboard carrega com dados
- [ ] Contratos aparecem
- [ ] Pagamentos aparecem

---

**Nota:** O sistema está 100% pronto para produção. Qualquer dúvida, verifique os logs do Render.
