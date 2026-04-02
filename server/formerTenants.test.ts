import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "test-user-2",
    email: "test2@example.com",
    name: "Test User 2",
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

describe("formerTenants", () => {
  it("should create a new former tenant", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.formerTenants.create({
      fullName: "Former Tenant",
      cpf: "123.456.789-00",
      rg: "1234567",
      rgIssuer: "SSP/CE",
      nationality: "brasileiro(a)",
      maritalStatus: "solteiro(a)",
      profession: "Engineer",
      propertyAddress: "Rua Test",
      propertyHouseNumber: "123",
      city: "Fortaleza",
      monthlyRent: "450.00",
      paymentDay: 10,
      deposit: "450.00",
      notes: "Moved to another city",
    });

    expect(result).toBeDefined();
    expect(result.fullName).toBe("Former Tenant");
    expect(result.userId).toBe(2);
  });

  it("should list former tenants", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a former tenant first
    await caller.formerTenants.create({
      fullName: "List Test Tenant",
      cpf: "987.654.321-00",
    });

    const result = await caller.formerTenants.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should get a former tenant by ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a former tenant first
    const created = await caller.formerTenants.create({
      fullName: "Get By ID Test",
      cpf: "111.222.333-44",
    });

    const result = await caller.formerTenants.getById({
      id: created.id,
    });

    expect(result).toBeDefined();
    expect(result?.fullName).toBe("Get By ID Test");
  });

  it("should update a former tenant", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a former tenant first
    const created = await caller.formerTenants.create({
      fullName: "Update Test",
      cpf: "555.666.777-88",
    });

    const updated = await caller.formerTenants.update({
      id: created.id,
      fullName: "Updated Former Tenant",
      notes: "Updated notes",
    });

    expect(updated).toBeDefined();
    expect(updated?.fullName).toBe("Updated Former Tenant");
    expect(updated?.notes).toBe("Updated notes");
  });

  it("should delete a former tenant", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a former tenant first
    const created = await caller.formerTenants.create({
      fullName: "Delete Test",
      cpf: "999.888.777-66",
    });

    const deleted = await caller.formerTenants.delete({
      id: created.id,
    });

    expect(deleted).toBe(true);

    // Verify it's deleted
    const retrieved = await caller.formerTenants.getById({
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
      await caller.formerTenants.create({
        fullName: "Unauthorized",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect((error as Error).message).toContain("Please login");
    }
  });

  it("should not allow access to other users' former tenants", async () => {
    const { ctx: ctx1 } = createAuthContext();
    const caller1 = appRouter.createCaller(ctx1);

    // Create a former tenant with user 1
    const created = await caller1.formerTenants.create({
      fullName: "User 1 Tenant",
      cpf: "444.333.222-11",
    });

    // Try to access with user 2
    const user2: AuthenticatedUser = {
      id: 3,
      openId: "test-user-3",
      email: "test3@example.com",
      name: "Test User 3",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx2: TrpcContext = {
      user: user2,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller2 = appRouter.createCaller(ctx2);

    const result = await caller2.formerTenants.getById({
      id: created.id,
    });

    expect(result).toBeUndefined();
  });
});
