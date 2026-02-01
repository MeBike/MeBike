import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getTestDatabase } from "@/test/db/test-database";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeSupplierRepository } from "../supplier.repository";

describe("supplierRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeSupplierRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeSupplierRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.bike.deleteMany({});
    await client.supplier.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  const createSupplier = async (name?: string) => {
    const id = uuidv7();
    const supplier = await client.supplier.create({
      data: {
        id,
        name: name ?? `Supplier ${id}`,
        address: "123 Supplier St",
        phoneNumber: "0900000000",
        contractFee: "10.00",
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    });
    return supplier;
  };

  const createBike = async (supplierId: string, status: "AVAILABLE" | "BOOKED") => {
    const id = uuidv7();
    await client.bike.create({
      data: {
        id,
        chipId: `chip-${id}`,
        stationId: null,
        supplierId,
        status,
        updatedAt: new Date(),
      },
    });
  };

  it("listWithOffset returns suppliers", async () => {
    await createSupplier("Alpha");
    await createSupplier("Beta");

    const result = await Effect.runPromise(
      repo.listWithOffset({}, { page: 1, pageSize: 10 }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("getById returns Option.none for missing supplier", async () => {
    const result = await Effect.runPromise(repo.getById(uuidv7()));
    expect(Option.isNone(result)).toBe(true);
  });

  it("update updates supplier fields", async () => {
    const supplier = await createSupplier("Gamma");

    const result = await Effect.runPromise(
      repo.update(supplier.id, { name: "Gamma Updated" }),
    );

    if (Option.isNone(result)) {
      throw new Error("Expected supplier to be updated");
    }
    expect(result.value.name).toBe("Gamma Updated");
  });

  it("update returns Option.none for missing supplier", async () => {
    const result = await Effect.runPromise(
      repo.update(uuidv7(), { name: "Missing" }),
    );

    expect(Option.isNone(result)).toBe(true);
  });

  it("groupBikeCountsBySupplier groups counts", async () => {
    const supplierA = await createSupplier("Supplier A");
    const supplierB = await createSupplier("Supplier B");

    await createBike(supplierA.id, "AVAILABLE");
    await createBike(supplierA.id, "BOOKED");
    await createBike(supplierB.id, "AVAILABLE");

    const grouped = await Effect.runPromise(repo.groupBikeCountsBySupplier());

    const byA = grouped.filter(row => row.supplierId === supplierA.id);
    expect(byA).toHaveLength(2);

    const byB = grouped.filter(row => row.supplierId === supplierB.id);
    expect(byB).toHaveLength(1);
  });

  it("groupBikeCountsForSupplier returns counts for one supplier", async () => {
    const supplier = await createSupplier("Supplier C");
    await createBike(supplier.id, "AVAILABLE");
    await createBike(supplier.id, "AVAILABLE");

    const grouped = await Effect.runPromise(
      repo.groupBikeCountsForSupplier(supplier.id),
    );

    expect(grouped).toHaveLength(1);
    expect(grouped[0].count).toBe(2);
  });

  it("listIdName returns id/name pairs", async () => {
    const supplier = await createSupplier("Supplier D");

    const list = await Effect.runPromise(repo.listIdName());
    const match = list.find(item => item.id === supplier.id);

    expect(match?.name).toBe("Supplier D");
  });

  it("fails when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeSupplierRepository(broken.client);

    await expect(
      Effect.runPromise(brokenRepo.listWithOffset({}, { page: 1, pageSize: 10 })),
    ).rejects.toBeDefined();

    await broken.stop();
  });
});
