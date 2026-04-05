import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users, propriedades, contratos, pagamentos,
  tenantTemplates, tenantDocuments, formerTenants, rentalPeriods,
  dadosInquilinoRecibo, recibosHistorico
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
  if (!db) return { totalContratos: 0, contratosAtivos: 0, receitaMes: 0, vencendoEm30: 0 };
  
  const allContratos = await db.select().from(contratos);
  const totalContratos = allContratos.length;
  const contratosAtivos = allContratos.filter(c => c.status === 'ativo').length;
  
  // Receita do mês atual (baseado em pagamentos pagos)
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  
  const pagamentosMes = await db.select().from(pagamentos).where(
    and(
      eq(pagamentos.ano, anoAtual),
      eq(pagamentos.mes, mesAtual),
      eq(pagamentos.status, 'pago')
    )
  );
  
  const receitaMes = pagamentosMes.reduce((sum, p) => {
    const valor = typeof p.valorPago === 'string' ? parseFloat(p.valorPago) : Number(p.valorPago || 0);
    return sum + valor;
  }, 0);

  const vencendo = await getContratosVencendoEm30();

  return { 
    totalContratos, 
    contratosAtivos, 
    receitaMes, 
    vencendoEm30: vencendo.length 
  };
}

export async function getReceitaPorMes(ano: number) {
  const db = await getDb();
  if (!db) return [];
  
  const pgs = await db.select().from(pagamentos).where(
    eq(pagamentos.ano, ano)
  );
  
  // O frontend espera um array de objetos: { mes: number, total: number, qtdPago: number, qtdPendente: number }
  const result = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    total: 0,
    qtdPago: 0,
    qtdPendente: 0
  }));

  pgs.forEach(p => {
    const mesIdx = p.mes - 1;
    if (mesIdx >= 0 && mesIdx < 12) {
      const valor = typeof p.valorPago === 'string' ? parseFloat(p.valorPago) : Number(p.valorPago || 0);
      if (p.status === 'pago') {
        result[mesIdx].total += valor;
        result[mesIdx].qtdPago += 1;
      } else {
        result[mesIdx].qtdPendente += 1;
      }
    }
  });
  
  return result;
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

export async function getDadosInquilinoRecibo(contratoId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dadosInquilinoRecibo).where(eq(dadosInquilinoRecibo.contratoId, contratoId));
  return result[0] || null;
}

export async function saveDadosInquilinoRecibo(data: any) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(dadosInquilinoRecibo).values(data).onConflictDoUpdate({
    target: [dadosInquilinoRecibo.contratoId],
    set: {
      ...data,
      updatedAt: new Date(),
    },
  }).returning();
  
  return result[0]?.id;
}

export async function createReciboHistorico(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(recibosHistorico).values(data).returning();
  return result[0]?.id;
}

export async function listRecibosHistorico(filters: any = {}) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(recibosHistorico);
  if (filters.contratoId) {
    query = query.where(eq(recibosHistorico.contratoId, filters.contratoId));
  }
  return query.orderBy(desc(recibosHistorico.createdAt));
}

// Arquivos
export async function saveArquivo(data: any) {
  const db = await getDb();
  if (!db) return null;
  
  // Usando tenantDocuments como tabela de arquivos de contrato
  const result = await db.insert(tenantDocuments).values({
    templateId: data.contratoId, // Usando templateId para armazenar o contratoId
    tipo: data.mimeType || 'application/pdf',
    url: data.urlArquivo,
    nomeArquivo: data.nomeArquivo,
  }).returning();
  
  return result[0]?.id;
}

export async function getArquivosByContrato(contratoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(tenantDocuments).where(eq(tenantDocuments.templateId, contratoId));
  
  return result.map(arq => ({
    id: arq.id,
    contratoId: arq.templateId,
    nomeArquivo: arq.nomeArquivo,
    urlArquivo: arq.url,
    createdAt: arq.createdAt,
  }));
}

export async function deleteArquivo(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(tenantDocuments).where(eq(tenantDocuments.id, id));
  return true;
}
