import { describe, expect, it } from "vitest";

import type { PageRequest, PageResult, SortDirection } from "../pagination";

import { makePageResult, normalizedPage } from "../pagination";

describe("pagination Utilities", () => {
  describe("normalizedPage", () => {
    it("should normalize valid page values", () => {
      const request: PageRequest = { page: 2, pageSize: 10 };
      const result = normalizedPage(request);

      expect(result).toEqual({
        page: 2,
        pageSize: 10,
        skip: 10,
        take: 10,
        sortBy: undefined,
        sortDir: "asc",
      });
    });

    it("should normalize page 1 correctly", () => {
      const request: PageRequest = { page: 1, pageSize: 5 };
      const result = normalizedPage(request);

      expect(result).toEqual({
        page: 1,
        pageSize: 5,
        skip: 0,
        take: 5,
        sortBy: undefined,
        sortDir: "asc",
      });
    });

    it("should default page to 1 when page is 0 or negative", () => {
      const testCases = [
        { page: 0, pageSize: 10 },
        { page: -1, pageSize: 10 },
        { page: -5, pageSize: 15 },
      ];

      testCases.forEach((request) => {
        const result = normalizedPage(request);
        expect(result.page).toBe(1);
        expect(result.skip).toBe(0);
        expect(result.sortDir).toBe("asc"); // default value
        expect(result.sortBy).toBeUndefined();
      });
    });

    it("should default pageSize to 1 when pageSize is 0 or negative", () => {
      const testCases = [
        { page: 1, pageSize: 0 },
        { page: 2, pageSize: -1 },
        { page: 3, pageSize: -10 },
      ];

      testCases.forEach((request) => {
        const result = normalizedPage(request);
        expect(result.pageSize).toBe(1);
        expect(result.take).toBe(1);
        expect(result.sortDir).toBe("asc"); // default value
        expect(result.sortBy).toBeUndefined();
      });
    });

    it("should handle both page and pageSize being invalid", () => {
      const request: PageRequest = { page: -5, pageSize: 0 };
      const result = normalizedPage(request);

      expect(result).toEqual({
        page: 1,
        pageSize: 1,
        skip: 0,
        take: 1,
        sortBy: undefined,
        sortDir: "asc",
      });
    });

    it("should calculate skip correctly for various pages", () => {
      const testCases = [
        { page: 1, pageSize: 10, expectedSkip: 0 },
        { page: 2, pageSize: 10, expectedSkip: 10 },
        { page: 5, pageSize: 20, expectedSkip: 80 },
        { page: 10, pageSize: 5, expectedSkip: 45 },
      ];

      testCases.forEach(({ page, pageSize, expectedSkip }) => {
        const result = normalizedPage({ page, pageSize });
        expect(result.skip).toBe(expectedSkip);
        expect(result.sortDir).toBe("asc"); // default value
        expect(result.sortBy).toBeUndefined();
      });
    });
  });

  describe("normalizedPage with Sorting", () => {
    it("should handle sorting with ascending direction", () => {
      const request: PageRequest<"name"> = {
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDir: "asc",
      };
      const result = normalizedPage(request);

      expect(result).toEqual({
        page: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        sortBy: "name",
        sortDir: "asc",
      });
    });

    it("should handle sorting with descending direction", () => {
      const request: PageRequest<"createdAt"> = {
        page: 2,
        pageSize: 5,
        sortBy: "createdAt",
        sortDir: "desc",
      };
      const result = normalizedPage(request);

      expect(result).toEqual({
        page: 2,
        pageSize: 5,
        skip: 5,
        take: 5,
        sortBy: "createdAt",
        sortDir: "desc",
      });
    });

    it("should default sortDir to 'asc' when not provided", () => {
      const request: PageRequest<"email"> = {
        page: 1,
        pageSize: 20,
        sortBy: "email",
      };
      const result = normalizedPage(request);

      expect(result).toEqual({
        page: 1,
        pageSize: 20,
        skip: 0,
        take: 20,
        sortBy: "email",
        sortDir: "asc",
      });
    });

    it("should handle only sortBy without sortDir", () => {
      const request: PageRequest<"price"> = {
        page: 3,
        pageSize: 15,
        sortBy: "price",
      };
      const result = normalizedPage(request);

      expect(result.sortBy).toBe("price");
      expect(result.sortDir).toBe("asc");
      expect(result.skip).toBe(30);
      expect(result.take).toBe(15);
    });

    it("should handle only sortDir without sortBy", () => {
      const request: PageRequest = {
        page: 1,
        pageSize: 25,
        sortDir: "desc",
      };
      const result = normalizedPage(request);

      expect(result).toEqual({
        page: 1,
        pageSize: 25,
        skip: 0,
        take: 25,
        sortBy: undefined,
        sortDir: "desc",
      });
    });

    it("should handle missing sortBy and sortDir", () => {
      const request: PageRequest = {
        page: 1,
        pageSize: 10,
      };
      const result = normalizedPage(request);

      expect(result.sortBy).toBeUndefined();
      expect(result.sortDir).toBe("asc");
    });

    it("should preserve sortBy and sortDir with invalid pagination values", () => {
      const request: PageRequest<"status"> = {
        page: -1,
        pageSize: 0,
        sortBy: "status",
        sortDir: "desc",
      };
      const result = normalizedPage(request);

      expect(result).toEqual({
        page: 1,
        pageSize: 1,
        skip: 0,
        take: 1,
        sortBy: "status",
        sortDir: "desc",
      });
    });

    it("should work with different sort field types", () => {
      const userRequest: PageRequest<"name" | "email"> = {
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDir: "asc",
      };

      const productRequest: PageRequest<"price" | "category"> = {
        page: 1,
        pageSize: 10,
        sortBy: "price",
        sortDir: "desc",
      };

      const userResult = normalizedPage(userRequest);
      const productResult = normalizedPage(productRequest);

      expect(userResult.sortBy).toBe("name");
      expect(userResult.sortDir).toBe("asc");
      expect(productResult.sortBy).toBe("price");
      expect(productResult.sortDir).toBe("desc");
    });

    it("should handle union type sort fields", () => {
      type SortField = "name" | "createdAt" | "status";
      const requests: PageRequest<SortField>[] = [
        { page: 1, pageSize: 10, sortBy: "name", sortDir: "asc" },
        { page: 1, pageSize: 10, sortBy: "createdAt", sortDir: "desc" },
        { page: 1, pageSize: 10, sortBy: "status" },
      ];

      requests.forEach((request) => {
        const result = normalizedPage(request);
        expect(result.sortBy).toBe(request.sortBy);
        expect(result.sortDir).toBe(request.sortDir || "asc");
      });
    });
  });

  describe("makePageResult", () => {
    it("should create a valid page result with basic data", () => {
      const items = ["item1", "item2", "item3"];
      const total = 25;
      const page = 1;
      const pageSize = 10;

      const result = makePageResult(items, total, page, pageSize);

      expect(result).toEqual({
        items,
        page,
        pageSize,
        total,
        totalPages: 3,
      });
    });

    it("should calculate totalPages correctly with exact division", () => {
      const items = ["a", "b"];
      const total = 30;
      const page = 2;
      const pageSize = 10;

      const result = makePageResult(items, total, page, pageSize);

      expect(result.totalPages).toBe(3);
    });

    it("should calculate totalPages correctly with remainder", () => {
      const items = ["a", "b", "c"];
      const total = 25;
      const page = 3;
      const pageSize = 10;

      const result = makePageResult(items, total, page, pageSize);

      expect(result.totalPages).toBe(3);
    });

    it("should handle zero total items", () => {
      const items: string[] = [];
      const total = 0;
      const page = 1;
      const pageSize = 10;

      const result = makePageResult(items, total, page, pageSize);

      expect(result).toEqual({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      });
    });

    it("should ensure totalPages is at least 1 when there are items", () => {
      const items = ["single"];
      const total = 1;
      const page = 1;
      const pageSize = 10;

      const result = makePageResult(items, total, page, pageSize);

      expect(result.totalPages).toBe(1);
    });

    it("should handle pageSize of 1 correctly", () => {
      const items = ["current"];
      const total = 5;
      const page = 3;
      const pageSize = 1;

      const result = makePageResult(items, total, page, pageSize);

      expect(result.totalPages).toBe(5);
    });

    it("should work with different data types", () => {
      type User = {
        id: number;
        name: string;
      };

      const items: User[] = [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ];

      const total = 100;
      const page = 5;
      const pageSize = 20;

      const result: PageResult<User> = makePageResult(items, total, page, pageSize);

      expect(result.items).toEqual(items);
      expect(result.page).toBe(5);
      expect(result.pageSize).toBe(20);
      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(5);
    });

    it("should handle large numbers correctly", () => {
      const items = Array.from({ length: 50 }, (_, i) => `item-${i}`);
      const total = 1000000;
      const page = 100;
      const pageSize = 50;

      const result = makePageResult(items, total, page, pageSize);

      expect(result.totalPages).toBe(20000);
      expect(result.items).toHaveLength(50);
    });

    it("should maintain the original page and pageSize values", () => {
      const items = ["test"];
      const total = 10;
      const page = 999;
      const pageSize = 1;

      const result = makePageResult(items, total, page, pageSize);

      expect(result.page).toBe(999);
      expect(result.pageSize).toBe(1);
    });
  });

  describe("sorting Types", () => {
    it("should only accept valid sort directions", () => {
      const validDirections: SortDirection[] = ["asc", "desc"];
      validDirections.forEach((direction) => {
        expect(typeof direction).toBe("string");
        expect(["asc", "desc"]).toContain(direction);
      });
    });

    it("should maintain type safety with specific sort fields", () => {
      type UserSortField = "name" | "email" | "createdAt";
      type ProductSortField = "title" | "price" | "category";

      const userRequest: PageRequest<UserSortField> = {
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDir: "asc",
      };

      const productRequest: PageRequest<ProductSortField> = {
        page: 1,
        pageSize: 10,
        sortBy: "price",
        sortDir: "desc",
      };

      // These should type-check correctly
      expect(userRequest.sortBy).toBe("name");
      expect(productRequest.sortBy).toBe("price");
    });

    it("should work with string literal types for sortBy", () => {
      const request1: PageRequest<"id"> = {
        page: 1,
        pageSize: 10,
        sortBy: "id",
      };

      const request2: PageRequest<"firstName" | "lastName"> = {
        page: 1,
        pageSize: 10,
        sortBy: "firstName",
        sortDir: "desc",
      };

      expect(request1.sortBy).toBe("id");
      expect(request2.sortBy).toBe("firstName");
    });
  });

  describe("type Safety", () => {
    it("should maintain type generics in PageResult", () => {
      type TestItem = {
        id: string;
        value: number;
      };

      const items: TestItem[] = [{ id: "test", value: 42 }];
      const result: PageResult<TestItem> = makePageResult(items, 1, 1, 10);

      if (result.items.length > 0) {
        const item = result.items[0];
        expect(item.id).toBe("test");
        expect(item.value).toBe(42);
      }
    });

    it("should accept any type of items", () => {
      const numberItems = [1, 2, 3];
      const stringItems = ["a", "b", "c"];
      const objectItems = [{ x: 1 }, { y: 2 }];

      expect(() => makePageResult(numberItems, 3, 1, 10)).not.toThrow();
      expect(() => makePageResult(stringItems, 3, 1, 10)).not.toThrow();
      expect(() => makePageResult(objectItems, 2, 1, 10)).not.toThrow();
    });

    it("should maintain type safety in normalizedPage with sorting", () => {
      type SortField = "name" | "createdAt" | "status";
      const request: PageRequest<SortField> = {
        page: 1,
        pageSize: 10,
        sortBy: "name",
        sortDir: "asc",
      };

      const result = normalizedPage(request);

      // TypeScript should ensure these are correctly typed
      expect(result.sortBy).toBe("name");
      expect(result.sortDir).toBe("asc");
    });
  });

  describe("edge Cases", () => {
    it("should handle empty items array with non-zero total", () => {
      const items: unknown[] = [];
      const total = 100;
      const page = 10;
      const pageSize = 10;

      const result = makePageResult(items, total, page, pageSize);

      expect(result.items).toEqual([]);
      expect(result.totalPages).toBe(10);
    });

    it("should handle very small pageSizes", () => {
      const items = ["x"];
      const total = 3;
      const page = 1;
      const pageSize = 1;

      const result = makePageResult(items, total, page, pageSize);

      expect(result.totalPages).toBe(3);
      expect(result.pageSize).toBe(1);
    });

    it("should handle very large pageSizes", () => {
      const items = Array.from({ length: 5 }, (_, i) => i);
      const total = 5;
      const page = 1;
      const pageSize = 1000;

      const result = makePageResult(items, total, page, pageSize);

      expect(result.totalPages).toBe(1);
      expect(result.pageSize).toBe(1000);
    });
  });

  describe("sorting Edge Cases", () => {
    it("should handle sorting with extreme pagination values", () => {
      const testCases = [
        { page: 0, pageSize: 0, sortBy: "name" as const },
        { page: -1, pageSize: -5, sortBy: "id" as const, sortDir: "desc" as const },
        { page: Number.MAX_SAFE_INTEGER, pageSize: Number.MAX_SAFE_INTEGER, sortBy: "createdAt" as const },
      ];

      testCases.forEach((testCase) => {
        expect(() => {
          normalizedPage(testCase);
        }).not.toThrow();
      });
    });

    it("should handle undefined sortBy with explicit sortDir", () => {
      const request: PageRequest = {
        page: 1,
        pageSize: 10,
        sortBy: undefined,
        sortDir: "desc",
      };

      const result = normalizedPage(request);

      expect(result.sortBy).toBeUndefined();
      expect(result.sortDir).toBe("desc");
    });

    it("should handle empty string sortBy", () => {
      const request: PageRequest<""> = {
        page: 1,
        pageSize: 10,
        sortBy: "",
      };

      const result = normalizedPage(request);

      expect(result.sortBy).toBe("");
      expect(result.sortDir).toBe("asc");
    });

    it("should preserve sortDir when explicitly set", () => {
      const requests: PageRequest<string>[] = [
        { page: 1, pageSize: 10, sortBy: "name", sortDir: "desc" },
        { page: 1, pageSize: 10, sortBy: "email", sortDir: "asc" },
      ];

      requests.forEach((request) => {
        const result = normalizedPage(request);
        expect(result.sortDir).toBe(request.sortDir);
      });
    });
  });
});
