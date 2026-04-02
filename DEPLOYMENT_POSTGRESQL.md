# Deployment PostgreSQL - Mesquita Imóveis

## ✅ Status: Pronto para Deployment

O sistema foi completamente migrado de MySQL para PostgreSQL e está pronto para deployment no Render.

## 📋 O que foi feito

1. **✅ Migrations PostgreSQL aplicadas** no Render
   - 8 tabelas criadas com sucesso
   - Schema PostgreSQL compatível

2. **✅ Dados importados com sucesso**
   - 4 propriedades
   - 39 contratos
   - 769 pagamentos

3. **✅ Backend convertido para PostgreSQL**
   - Substituído `mysql2` por `postgres`
   - Drizzle ORM configurado para PostgreSQL
   - Todas as queries convertidas

4. **✅ Script de importação criado**
   - `importar-dados-postgres-batch.mjs` - Importação otimizada com batch processing
   - Suporta re-importação sem perda de dados

## 🚀 Instruções de Deployment

### 1. Clonar repositório no Render

```bash
git clone https://github.com/barbarajasmim26/vers-ofinal.git
cd vers-ofinal
```

### 2. Configurar variáveis de ambiente no Render

No painel do Render, adicione as seguintes variáveis de ambiente:

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
VITE_FRONTEND_FORGE_API_KEY=sua_chave_api
VITE_APP_TITLE=Mesquita Imóveis
VITE_APP_LOGO=https://seu-logo-url
```

### 3. Build e Deploy

O Render executará automaticamente:

```bash
pnpm install
pnpm build
pnpm start
```

### 4. Importar dados (se necessário)

Se precisar re-importar os dados após o deployment:

```bash
# Localmente
DATABASE_URL="postgresql://..." pnpm import:data

# Ou no Render (via console)
DATABASE_URL="postgresql://..." node importar-dados-postgres-batch.mjs
```

## 📊 Estrutura do Banco de Dados

### Tabelas principais:
- **propriedades** - Imóveis cadastrados
- **contratos** - Contratos de aluguel
- **pagamentos** - Histórico de pagamentos
- **users** - Usuários do sistema
- **tenant_templates** - Templates de inquilinos
- **tenant_documents** - Documentos de inquilinos
- **former_tenants** - Ex-inquilinos
- **rental_periods** - Períodos de aluguel

## 🔧 Configuração de Conexão

O sistema usa a variável `DATABASE_URL` para conectar ao PostgreSQL:

```
postgresql://user:password@host:port/database?sslmode=require
```

**Importante:** O `sslmode=require` é adicionado automaticamente pelo código.

## 📝 Credenciais de Login

```
Usuário: barbara
Senha: mesquitaimoveis
```

## 🎯 Funcionalidades Disponíveis

- ✅ Dashboard com estatísticas
- ✅ Gestão de contratos
- ✅ Registro de pagamentos
- ✅ Alertas de vencimento
- ✅ Calendário de prazos
- ✅ Relatórios
- ✅ Geração de recibos
- ✅ Busca de inquilinos
- ✅ Templates de inquilinos
- ✅ Gestão de ex-inquilinos
- ✅ Tema claro/escuro
- ✅ Integração WhatsApp

## 🐛 Troubleshooting

### Erro de conexão SSL
Se receber erro `SSL/TLS required`, verifique se:
- A URL do banco está correta
- O `sslmode=require` está sendo adicionado automaticamente
- A conexão está usando a porta correta (5432)

### Dados não aparecem
Se os dados não aparecerem após deployment:
1. Verifique se as migrations foram aplicadas
2. Execute o script de importação: `pnpm import:data`
3. Verifique os logs do Render

### Erro de autenticação
Se receber erro de autenticação:
1. Verifique as credenciais no DATABASE_URL
2. Confirme que o usuário tem permissões no banco
3. Teste a conexão localmente primeiro

## 📞 Suporte

Para problemas com deployment:
1. Verifique os logs do Render
2. Teste localmente com `pnpm dev`
3. Confirme que todas as variáveis de ambiente estão configuradas

## ✨ Próximos passos

1. Push do código para GitHub
2. Conectar repositório ao Render
3. Configurar variáveis de ambiente
4. Deploy automático
5. Importar dados (se necessário)
6. Testar todas as funcionalidades

---

**Data de migração:** 02 de Abril de 2026  
**Status:** ✅ Pronto para produção
