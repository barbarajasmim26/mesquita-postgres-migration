import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "test", email: "t@t.com", name: "Test",
        loginMethod: "manus", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string) => cleared.push(name) } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(cleared.length).toBe(1);
  });
});

describe("contratos router", () => {
  it("list returns array (may be empty without DB)", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.contratos.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("vencendoEm30 returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.contratos.vencendoEm30();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("propriedades router", () => {
  it("list returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.propriedades.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("listComResumo returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.propriedades.listComResumo();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("pagamentos router", () => {
  it("byMes returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.pagamentos.byMes({ ano: 2025, mes: 12 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("dashboard router", () => {
  it("stats returns object or null", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.dashboard.stats();
    if (result !== null) {
      expect(typeof result.totalContratos).toBe("number");
      expect(typeof result.contratosAtivos).toBe("number");
    }
  });

  it("receitaPorMes returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.dashboard.receitaPorMes({ ano: 2025 });
    expect(Array.isArray(result)).toBe(true);
  });
});
