import { describe, expect, it } from "vitest";

import type { PageRequest, SortDirection } from "@/domain/shared/pagination";

import type { StationSortField } from "../station.types";

import { toStationOrderBy } from "../station.repository";

describe("toStationOrderBy", () => {
  it("should return default sorting when no sort parameters provided", () => {
    const req = { page: 1, pageSize: 10 };
    const result = toStationOrderBy(req);
    expect(result).toEqual({ name: "asc" });
  });

  it("should sort by name with asc direction", () => {
    const req: PageRequest<StationSortField> = { page: 1, pageSize: 10, sortBy: "name", sortDir: "asc" };
    const result = toStationOrderBy(req);
    expect(result).toEqual({ name: "asc" });
  });

  it("should sort by name with desc direction", () => {
    const req: PageRequest<StationSortField> = { page: 1, pageSize: 10, sortBy: "name", sortDir: "desc" };
    const result = toStationOrderBy(req);
    expect(result).toEqual({ name: "desc" });
  });

  it("should sort by capacity with asc direction", () => {
    const req: PageRequest<StationSortField> = { page: 1, pageSize: 10, sortBy: "capacity", sortDir: "asc" };
    const result = toStationOrderBy(req);
    expect(result).toEqual({ capacity: "asc" });
  });

  it("should sort by capacity with desc direction", () => {
    const req: PageRequest<StationSortField> = { page: 1, pageSize: 10, sortBy: "capacity", sortDir: "desc" };
    const result = toStationOrderBy(req);
    expect(result).toEqual({ capacity: "desc" });
  });

  it("should sort by updatedAt with asc direction", () => {
    const req: PageRequest<StationSortField> = { page: 1, pageSize: 10, sortBy: "updatedAt", sortDir: "asc" };
    const result = toStationOrderBy(req);
    expect(result).toEqual({ updatedAt: "asc" });
  });

  it("should sort by updatedAt with desc direction", () => {
    const req: PageRequest<StationSortField> = { page: 1, pageSize: 10, sortBy: "updatedAt", sortDir: "desc" };
    const result = toStationOrderBy(req);
    expect(result).toEqual({ updatedAt: "desc" });
  });

  it("should default to asc when only sortBy is provided", () => {
    const req: PageRequest<StationSortField> = { page: 1, pageSize: 10, sortBy: "capacity" };
    const result = toStationOrderBy(req);
    expect(result).toEqual({ capacity: "asc" });
  });

  it("should default to name when only sortDir is provided", () => {
    const req: PageRequest<StationSortField> = { page: 1, pageSize: 10, sortDir: "desc" };
    const result = toStationOrderBy(req);
    expect(result).toEqual({ name: "desc" });
  });

  it("should handle invalid sortBy values by defaulting to name", () => {
    const req = { page: 1, pageSize: 10, sortBy: "invalid" as any, sortDir: "asc" as SortDirection }; // type assertion to simulate invalid input
    const result = toStationOrderBy(req);
    expect(result).toEqual({ name: "asc" });
  });
});
