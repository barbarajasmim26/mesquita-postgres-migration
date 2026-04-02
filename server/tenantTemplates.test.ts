import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("tenantTemplates", () => {
  it("should create a new tenant template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tenantTemplates.create({
      fullName: "John Doe",
      cpf: "123.456.789-00",
      rg: "1234567",
      rgIssuer: "SSP/CE",
      nationality: "brasileiro(a)",
      maritalStatus: "solteiro(a)",
      profession: "Engineer",
      address: "Rua Test, 123",
      city: "Fortaleza",
      phone: "(85) 98765-4321",
      email: "john@example.com",
    });

    expect(result).toBeDefined();
    expect(result.fullName).toBe("John Doe");
    expect(result.cpf).toBe("123.456.789-00");
    expect(result.userId).toBe(1);
  });

  it("should list tenant templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template first
    await caller.tenantTemplates.create({
      fullName: "Jane Doe",
      cpf: "987.654.321-00",
    });

    const result = await caller.tenantTemplates.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should search tenant templates by name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template first
    await caller.tenantTemplates.create({
      fullName: "Search Test User",
      cpf: "111.222.333-44",
    });

    const result = await caller.tenantTemplates.search({
      query: "Search Test",
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.some(t => t.fullName.includes("Search Test"))).toBe(true);
  });

  it("should search tenant templates by CPF", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template first
    const cpf = "555.666.777-88";
    await caller.tenantTemplates.create({
      fullName: "CPF Search User",
      cpf,
    });

    const result = await caller.tenantTemplates.search({
      query: cpf,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.some(t => t.cpf === cpf)).toBe(true);
  });

  it("should update a tenant template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template first
    const created = await caller.tenantTemplates.create({
      fullName: "Update Test",
      cpf: "999.888.777-66",
    });

    const updated = await caller.tenantTemplates.update({
      id: created.id,
      fullName: "Updated Name",
      profession: "Doctor",
    });

    expect(updated).toBeDefined();
    expect(updated?.fullName).toBe("Updated Name");
    expect(updated?.profession).toBe("Doctor");
  });

  it("should delete a tenant template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template first
    const created = await caller.tenantTemplates.create({
      fullName: "Delete Test",
      cpf: "444.333.222-11",
    });

    const deleted = await caller.tenantTemplates.delete({
      id: created.id,
    });

    expect(deleted).toBe(true);

    // Verify it's deleted
    const retrieved = await caller.tenantTemplates.getById({
      id: created.id,
    });

    expect(retrieved).toBeUndefined();
  });

  it("should reject unauthorized access", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    try {
      await caller.tenantTemplates.create({
        fullName: "Unauthorized",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect((error as Error).message).toContain("Please login");
    }
  });
});
