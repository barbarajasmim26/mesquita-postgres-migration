# Quick Start - Mesquita Imóveis PostgreSQL

## ⚡ Início Rápido

### 1. Clonar e Instalar

```bash
git clone https://github.com/barbarajasmim26/vers-ofinal.git
cd vers-ofinal
pnpm install
```

### 2. Configurar Banco de Dados

```bash
# Defina a variável de ambiente
export DATABASE_URL="postgresql://mesquita_db_user:DgDeIbvWfueBQn62ZypDik58eabvFuEW@dpg-d76tfh1aae7s73dgi5i0-a.oregon-postgres.render.com/mesquita_db"

# Aplicar migrations (já feito no Render)
pnpm db:push

# Importar dados
pnpm import:data
```

### 3. Rodar Localmente

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Rodar em produção
pnpm start
```

### 4. Acessar

- **URL Local:** http://localhost:3000
- **Login:** barbara / mesquitaimoveis

## 📊 Dados Importados

✅ 4 propriedades  
✅ 39 contratos  
✅ 769 pagamentos  

## 🚀 Deploy no Render

1. Push para GitHub
2. Conectar repositório ao Render
3. Configurar variáveis de ambiente
4. Deploy automático

Veja `RENDER_SETUP.md` para detalhes completos.

## 🔧 Scripts Disponíveis

```bash
pnpm dev              # Desenvolvimento
pnpm build            # Build
pnpm start            # Produção
pnpm test             # Testes
pnpm check            # Type check
pnpm format           # Formatar código
pnpm db:push          # Migrations
pnpm import:data      # Importar dados
```

## 📝 Credenciais

```
Usuário: barbara
Senha: mesquitaimoveis
```

## ✨ Funcionalidades

- Dashboard com estatísticas
- Gestão de contratos
- Registro de pagamentos
- Alertas e calendário
- Relatórios
- Recibos
- Busca
- Templates de inquilinos
- Ex-inquilinos
- Tema claro/escuro

## 🐛 Problemas?

1. **Erro de conexão:** Verifique `DATABASE_URL`
2. **Dados não aparecem:** Execute `pnpm import:data`
3. **Build falha:** Rode `pnpm install` novamente
4. **TypeScript errors:** Normal durante desenvolvimento, não afeta runtime

---

**Status:** ✅ Pronto para produção
