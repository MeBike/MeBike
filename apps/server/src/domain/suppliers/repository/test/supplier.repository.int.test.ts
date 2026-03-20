import { Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { runEffect } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeSupplierRepository } from "../supplier.repository";

describe("supplierRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeSupplierRepository>;

  beforeAll(() => {
    repo = makeSupplierRepository(fixture.prisma);
  });

  it("listWithOffset returns suppliers", async () => {
    await fixture.factories.supplier({ name: "Alpha" });
    await fixture.factories.supplier({ name: "Beta" });

    const result = await runEffect(repo.listWithOffset({}, { page: 1, pageSize: 10 }));

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("getById returns Option.none for missing supplier", async () => {
    const result = await runEffect(repo.getById(uuidv7()));
    expect(Option.isNone(result)).toBe(true);
  });

  it("update updates supplier fields", async () => {
    const supplier = await fixture.factories.supplier({ name: "Gamma" });

    const result = await runEffect(repo.update(supplier.id, { name: "Gamma Updated" }));

    if (Option.isNone(result)) {
      throw new Error("Expected supplier to be updated");
    }
    expect(result.value.name).toBe("Gamma Updated");
  });

  it("update returns Option.none for missing supplier", async () => {
    const result = await runEffect(repo.update(uuidv7(), { name: "Missing" }));
    expect(Option.isNone(result)).toBe(true);
  });

  it("groupBikeCountsBySupplier groups counts", async () => {
    const supplierA = await fixture.factories.supplier({ name: "Supplier A" });
    const supplierB = await fixture.factories.supplier({ name: "Supplier B" });

    await fixture.factories.bike({ supplierId: supplierA.id, status: "AVAILABLE" });
    await fixture.factories.bike({ supplierId: supplierA.id, status: "BOOKED" });
    await fixture.factories.bike({ supplierId: supplierB.id, status: "AVAILABLE" });

    const grouped = await runEffect(repo.groupBikeCountsBySupplier());

    const byA = grouped.filter(row => row.supplierId === supplierA.id);
    expect(byA).toHaveLength(2);

    const byB = grouped.filter(row => row.supplierId === supplierB.id);
    expect(byB).toHaveLength(1);
  });

  it("groupBikeCountsForSupplier returns counts for one supplier", async () => {
    const supplier = await fixture.factories.supplier({ name: "Supplier C" });
    await fixture.factories.bike({ supplierId: supplier.id, status: "AVAILABLE" });
    await fixture.factories.bike({ supplierId: supplier.id, status: "AVAILABLE" });

    const grouped = await runEffect(repo.groupBikeCountsForSupplier(supplier.id));

    expect(grouped).toHaveLength(1);
    expect(grouped[0].count).toBe(2);
  });

  it("listIdName returns id/name pairs", async () => {
    const supplier = await fixture.factories.supplier({ name: "Supplier D" });

    const list = await runEffect(repo.listIdName());
    const match = list.find(item => item.id === supplier.id);

    expect(match?.name).toBe("Supplier D");
  });

  it("fails when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeSupplierRepository(broken.client);

    await expect(
      runEffect(brokenRepo.listWithOffset({}, { page: 1, pageSize: 10 })),
    ).rejects.toBeDefined();

    await broken.stop();
  });
});
