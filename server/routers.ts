import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createContrato,
  createPropriedade,
  deleteArquivo,
  deleteContrato,
  getAllContratos,
  getAllPropriedades,
  getArquivosByContrato,
  getContratoById,
  getContratosVencendoEm30,
  getDashboardStats,
  createReciboHistorico,
  getDadosInquilinoRecibo,
  getPagamentosByContrato,
  getPagamentosByMes,
  getPropriedadesComResumo,
  getReceitaPorMes,
  gerarMeses2026,
  listRecibosHistorico,
  renovarContrato,
  saveArquivo,
  saveDadosInquilinoRecibo,
  updateContrato,
  upsertPagamento,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut, storageGet } from "./storage";
import { nanoid } from "nanoid";
import { validateCredentials } from "./auth";
import { sdk } from "./_core/sdk";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    login: publicProcedure
      .input(z.object({ login: z.string(), senha: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!validateCredentials(input.login, input.senha)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais invalidas" });
        }
        
        // Garantir que o usuário exista no banco para o middleware do SDK funcionar
        const openId = `user_${input.login}`;
        await db.upsertUser({
          openId,
          name: input.login,
          role: "admin",
        });

        const token = await sdk.signSession({
          openId,
          appId: process.env.VITE_APP_ID || "default",
          name: input.login,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
        return { success: true, token };
      }),
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ---- PROPRIEDADES ----
  propriedades: router({
    list: publicProcedure.query(async () => {
      return getAllPropriedades();
    }),
    listComResumo: publicProcedure.query(async () => {
      return getPropriedadesComResumo();
    }),
  }),

  // ---- CONTRATOS ----
  contratos: router({
    list: publicProcedure
      .input(z.object({
        propriedadeId: z.number().optional(),
        status: z.string().optional(),
        busca: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getAllContratos(input ?? {});
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const result = await getContratoById(input.id);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato não encontrado" });
        return result;
      }),

    create: publicProcedure
      .input(z.object({
        propriedadeId: z.number(),
        casa: z.string(),
        nomeInquilino: z.string(),
        dataEntrada: z.string().nullable().optional(),
        dataSaida: z.string().nullable().optional(),
        caucao: z.string().nullable().optional(),
        aluguel: z.string(),
        diaPagamento: z.number().nullable().optional(),
        status: z.enum(["ativo", "encerrado", "pendente"]).default("ativo"),
        telefone: z.string().nullable().optional(),
        observacoes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createContrato({
          ...input,
          dataEntrada: input.dataEntrada ? new Date(input.dataEntrada) : null,
          dataSaida: input.dataSaida ? new Date(input.dataSaida) : null,
        });
        return { id };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        propriedadeId: z.number().optional(),
        casa: z.string().optional(),
        nomeInquilino: z.string().optional(),
        dataEntrada: z.string().nullable().optional(),
        dataSaida: z.string().nullable().optional(),
        caucao: z.string().nullable().optional(),
        aluguel: z.string().optional(),
        diaPagamento: z.number().nullable().optional(),
        status: z.enum(["ativo", "encerrado", "pendente", "ex-inquilino"]).optional(),
        telefone: z.string().nullable().optional(),
        observacoes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateContrato(id, {
          ...data,
          dataEntrada: data.dataEntrada ? new Date(data.dataEntrada) : data.dataEntrada === null ? null : undefined,
          dataSaida: data.dataSaida ? new Date(data.dataSaida) : data.dataSaida === null ? null : undefined,
        });
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContrato(input.id);
        return { success: true };
      }),

    vencendoEm30: publicProcedure.query(async () => {
      return getContratosVencendoEm30();
    }),

    renovar: publicProcedure
      .input(z.object({
        id: z.number(),
        novaDataSaida: z.string(), // ISO date string
      }))
      .mutation(async ({ input }) => {
        await renovarContrato(input.id, new Date(input.novaDataSaida));
        return { success: true };
      }),
  }),

  // ---- PAGAMENTOS ----
  pagamentos: router({
    byContrato: publicProcedure
      .input(z.object({ contratoId: z.number() }))
      .query(async ({ input }) => {
        return getPagamentosByContrato(input.contratoId);
      }),

    byMes: publicProcedure
      .input(z.object({ ano: z.number(), mes: z.number() }))
      .query(async ({ input }) => {
        return getPagamentosByMes(input.ano, input.mes);
      }),

    upsert: publicProcedure
      .input(z.object({
        contratoId: z.number(),
        ano: z.number(),
        mes: z.number(),
        status: z.enum(["pago", "caucao", "pendente", "atrasado"]),
        valorPago: z.string().nullable().optional(),
        dataPagamento: z.string().nullable().optional(),
        observacao: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await upsertPagamento({
          ...input,
          dataPagamento: input.dataPagamento ? new Date(input.dataPagamento) : null,
        });
        return { id };
      }),
  }),

  // ---- ARQUIVOS ----
  arquivos: router({
    byContrato: publicProcedure
      .input(z.object({ contratoId: z.number() }))
      .query(async ({ input }) => {
        return getArquivosByContrato(input.contratoId);
      }),

    getUploadUrl: publicProcedure
      .input(z.object({
        contratoId: z.number(),
        nomeArquivo: z.string(),
        mimeType: z.string(),
        tamanho: z.number(),
        base64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const ext = input.nomeArquivo.split(".").pop() ?? "pdf";
        const fileKey = `contratos/${input.contratoId}/${nanoid()}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        const id = await saveArquivo({
          contratoId: input.contratoId,
          nomeArquivo: input.nomeArquivo,
          urlArquivo: url,
          fileKey,
          tamanho: input.tamanho,
          mimeType: input.mimeType,
        });
        return { id, url, fileKey };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteArquivo(input.id);
        return { success: true };
      }),
  }),

  // ---- PROPRIEDADES (criar) ----
  propriedadesAdmin: router({
    create: publicProcedure
      .input(z.object({
        nome: z.string().min(1),
        endereco: z.string().min(1),
        cidade: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createPropriedade(input);
        return { id };
      }),
  }),

  // ---- RECIBOS / DADOS DO INQUILINO ----
  recibos: router({
    list: publicProcedure
      .input(z.object({ contratoId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return listRecibosHistorico(input ?? {});
      }),

    create: publicProcedure
      .input(z.object({
        contratoId: z.number().nullable().optional(),
        nomeInquilino: z.string().min(1),
        nacionalidade: z.string().nullable().optional(),
        estadoCivil: z.string().nullable().optional(),
        profissao: z.string().nullable().optional(),
        rg: z.string().nullable().optional(),
        orgaoExpedidor: z.string().nullable().optional(),
        cpf: z.string().nullable().optional(),
        tipoRecibo: z.enum(["aluguel", "caucao"]),
        valor: z.string(),
        formaPagamento: z.string().nullable().optional(),
        incluirPagoPor: z.enum(["sim", "nao"]),
        nomePagador: z.string().nullable().optional(),
        mesReferencia: z.number(),
        anoReferencia: z.number(),
        enderecoImovel: z.string().nullable().optional(),
        cidade: z.string().nullable().optional(),
        dataRecibo: z.string(),
        nomeLocadora: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createReciboHistorico({
          ...input,
          contratoId: input.contratoId ?? null,
          dataRecibo: new Date(input.dataRecibo),
        });
        if (input.contratoId) {
          await saveDadosInquilinoRecibo({
            contratoId: input.contratoId,
            nomeInquilino: input.nomeInquilino,
            nacionalidade: input.nacionalidade ?? null,
            estadoCivil: input.estadoCivil ?? null,
            profissao: input.profissao ?? null,
            rg: input.rg ?? null,
            orgaoExpedidor: input.orgaoExpedidor ?? null,
            cpf: input.cpf ?? null,
          });
        }
        return { id };
      }),
  }),

  inquilinoRecibo: router({
    byContrato: publicProcedure
      .input(z.object({ contratoId: z.number() }))
      .query(async ({ input }) => {
        return getDadosInquilinoRecibo(input.contratoId);
      }),

    save: publicProcedure
      .input(z.object({
        contratoId: z.number(),
        nomeInquilino: z.string().min(1),
        nacionalidade: z.string().nullable().optional(),
        estadoCivil: z.string().nullable().optional(),
        profissao: z.string().nullable().optional(),
        rg: z.string().nullable().optional(),
        orgaoExpedidor: z.string().nullable().optional(),
        cpf: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await saveDadosInquilinoRecibo(input);
        return { id };
      }),
  }),

  // ---- UTILITÁRIOS ----
  utils: router({
    gerarMeses2026: publicProcedure.mutation(async () => {
      return gerarMeses2026();
    }),
  }),

  // ---- DASHBOARD ----
  dashboard: router({
    stats: publicProcedure.query(async () => {
      return getDashboardStats();
    }),
    receitaPorMes: publicProcedure
      .input(z.object({ ano: z.number() }))
      .query(async ({ input }) => {
        return getReceitaPorMes(input.ano);
      }),
  }),
});

export type AppRouter = typeof appRouter;
