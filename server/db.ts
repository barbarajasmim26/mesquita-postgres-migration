import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users, propriedades, contratos, pagamentos,
  tenantTemplates, tenantDocuments, formerTenants, rentalPeriods 
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      dbUrl.searchParams.set('sslmode', 'require');
      
      const client = postgres(dbUrl.toString());
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    // PostgreSQL upsert
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: values.name,
          email: values.email,
          loginMethod: values.loginMethod,
          role: values.role,
          lastSignedIn: values.lastSignedIn,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Propriedades
export async function getAllPropriedades() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propriedades);
}

export async function createPropriedade(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(propriedades).values(data).returning();
  return result[0]?.id;
}

export async function getPropriedadesComResumo() {
  const db = await getDb();
  if (!db) return [];
  
  const props = await db.select().from(propriedades);
  return Promise.all(props.map(async (prop) => {
    const contratosCount = await db.select().from(contratos).where(eq(contratos.propriedadeId, prop.id));
    return {
      ...prop,
      totalContratos: contratosCount.length,
    };
  }));
}

// Contratos
export async function getAllContratos(filters: any = {}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(contratos);
  
  if (filters.propriedadeId) {
    query = query.where(eq(contratos.propriedadeId, filters.propriedadeId));
  }
  if (filters.status) {
    query = query.where(eq(contratos.status, filters.status));
  }
  if (filters.busca) {
    query = query.where(sql`${contratos.nomeInquilino} ILIKE ${'%' + filters.busca + '%'}`);
  }
  
  return query.orderBy(desc(contratos.createdAt));
}

export async function getContratoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contratos).where(eq(contratos.id, id));
  return result[0] || null;
}

export async function createContrato(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(contratos).values(data).returning();
  return result[0]?.id;
}

export async function updateContrato(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.update(contratos).set({...data, updatedAt: new Date()}).where(eq(contratos.id, id)).returning();
  return result[0];
}

export async function deleteContrato(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(contratos).where(eq(contratos.id, id));
  return true;
}

export async function getContratosVencendoEm30() {
  const db = await getDb();
  if (!db) return [];
  
  const hoje = new Date();
  const em30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return db.select().from(contratos).where(
    and(
      eq(contratos.status, 'ativo'),
      gte(contratos.dataSaida, hoje),
      lte(contratos.dataSaida, em30Dias)
    )
  );
}

export async function renovarContrato(id: number, novaDataSaida: Date) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.update(contratos).set({
    dataSaida: novaDataSaida,
    updatedAt: new Date(),
  }).where(eq(contratos.id, id)).returning();
  
  return result[0];
}

// Pagamentos
export async function getPagamentosByContrato(contratoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pagamentos).where(eq(pagamentos.contratoId, contratoId));
}

export async function getPagamentosByMes(mes: number, ano: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pagamentos).where(and(eq(pagamentos.mes, mes), eq(pagamentos.ano, ano)));
}

export async function upsertPagamento(data: any) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(pagamentos).values(data).onConflictDoUpdate({
    target: [pagamentos.contratoId, pagamentos.ano, pagamentos.mes],
    set: {
      ...data,
      updatedAt: new Date(),
    },
  }).returning();
  
  return result[0]?.id;
}

// Dashboard
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { total: 0, ativos: 0, receita: 0 };
  
  const allContratos = await db.select().from(contratos);
  const total = allContratos.length;
  const ativos = allContratos.filter(c => c.status === 'ativo').length;
  const receita = allContratos.reduce((sum, c) => {
    const aluguel = typeof c.aluguel === 'string' ? parseFloat(c.aluguel) : (c.aluguel as any);
    return sum + (aluguel || 0);
  }, 0);

  return { total, ativos, receita };
}

export async function getReceitaPorMes(ano: number) {
  const db = await getDb();
  if (!db) return [];
  
  const pagos = await db.select().from(pagamentos).where(
    and(
      eq(pagamentos.ano, ano),
      eq(pagamentos.status, 'pago')
    )
  );
  
  const meses = Array(12).fill(0);
  pagos.forEach(p => {
    const valor = typeof p.valorPago === 'string' ? parseFloat(p.valorPago) : (p.valorPago as any);
    meses[p.mes - 1] += valor || 0;
  });
  
  return meses;
}

// Tenant Templates
export async function getTenantTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenantTemplates).where(eq(tenantTemplates.userId, userId));
}

export async function createTenantTemplate(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(tenantTemplates).values(data).returning();
  return result[0];
}

export async function updateTenantTemplate(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.update(tenantTemplates).set({...data, updatedAt: new Date()}).where(eq(tenantTemplates.id, id)).returning();
  return result[0];
}

export async function deleteTenantTemplate(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(tenantTemplates).where(eq(tenantTemplates.id, id));
  return true;
}

// Former Tenants
export async function getFormerTenants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(formerTenants);
}

export async function createFormerTenant(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(formerTenants).values(data).returning();
  return result[0];
}

// Placeholder functions for compatibility
export async function gerarMeses2026() { return []; }
export async function getDadosInquilinoRecibo() { return null; }
export async function saveDadosInquilinoRecibo() { return null; }
export async function createReciboHistorico() { return null; }
export async function listRecibosHistorico() { return []; }
export async function saveArquivo() { return null; }
export async function getArquivosByContrato() { return []; }
export async function deleteArquivo() { return false; }
