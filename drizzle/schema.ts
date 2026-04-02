import { pgTable, serial, text, timestamp, varchar, integer, decimal } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Propriedades/Imóveis
 */
export const propriedades = pgTable("propriedades", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  endereco: text("endereco").notNull(),
  cidade: text("cidade"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Propriedade = typeof propriedades.$inferSelect;
export type InsertPropriedade = typeof propriedades.$inferInsert;

/**
 * Contratos de Aluguel
 */
export const contratos = pgTable("contratos", {
  id: serial("id").primaryKey(),
  propriedadeId: integer("propriedadeId").notNull(),
  casa: varchar("casa", { length: 50 }).notNull(),
  nomeInquilino: text("nomeInquilino").notNull(),
  dataEntrada: timestamp("dataEntrada"),
  dataSaida: timestamp("dataSaida"),
  caucao: decimal("caucao", { precision: 10, scale: 2 }),
  aluguel: decimal("aluguel", { precision: 10, scale: 2 }).notNull(),
  diaPagamento: integer("diaPagamento"),
  status: varchar("status", { length: 20 }).default("ativo"),
  telefone: varchar("telefone", { length: 20 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Contrato = typeof contratos.$inferSelect;
export type InsertContrato = typeof contratos.$inferInsert;

/**
 * Pagamentos de Aluguel
 */
export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  contratoId: integer("contratoId").notNull(),
  ano: integer("ano").notNull(),
  mes: integer("mes").notNull(),
  status: varchar("status", { length: 20 }).default("pendente"),
  valorPago: decimal("valorPago", { precision: 10, scale: 2 }),
  dataPagamento: timestamp("dataPagamento"),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Pagamento = typeof pagamentos.$inferSelect;
export type InsertPagamento = typeof pagamentos.$inferInsert;

/**
 * Templates de Inquilinos (novo)
 */
export const tenantTemplates = pgTable("tenant_templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  nome: text("nome").notNull(),
  cpf: varchar("cpf", { length: 20 }),
  rg: varchar("rg", { length: 20 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  endereco: text("endereco"),
  profissao: text("profissao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TenantTemplate = typeof tenantTemplates.$inferSelect;
export type InsertTenantTemplate = typeof tenantTemplates.$inferInsert;

/**
 * Documentos de Inquilinos (novo)
 */
export const tenantDocuments = pgTable("tenant_documents", {
  id: serial("id").primaryKey(),
  templateId: integer("templateId").notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  url: text("url").notNull(),
  nomeArquivo: text("nomeArquivo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TenantDocument = typeof tenantDocuments.$inferSelect;
export type InsertTenantDocument = typeof tenantDocuments.$inferInsert;

/**
 * Ex-Inquilinos (novo)
 */
export const formerTenants = pgTable("former_tenants", {
  id: serial("id").primaryKey(),
  contratoId: integer("contratoId").notNull(),
  nomeInquilino: text("nomeInquilino").notNull(),
  dataSaida: timestamp("dataSaida"),
  motivo: text("motivo"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormerTenant = typeof formerTenants.$inferSelect;
export type InsertFormerTenant = typeof formerTenants.$inferInsert;

/**
 * Períodos de Aluguel (novo)
 */
export const rentalPeriods = pgTable("rental_periods", {
  id: serial("id").primaryKey(),
  contratoId: integer("contratoId").notNull(),
  ano: integer("ano").notNull(),
  mes: integer("mes").notNull(),
  status: varchar("status", { length: 20 }).default("vencido"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RentalPeriod = typeof rentalPeriods.$inferSelect;
export type InsertRentalPeriod = typeof rentalPeriods.$inferInsert;
