import { faker } from "@faker-js/faker";
import { expect, test, APIRequestContext } from "@playwright/test";
import { getAuthContext } from "../helpers/auth";
import { Role } from "../types/roles";

let adminContext: APIRequestContext;
let userContext: APIRequestContext;
let blockedContext: APIRequestContext;

const createdCategoryIds: string[] = [];
let parentCategoryId: string;
let testCategoryId: string;
let testCategoryName: string;

test.describe.serial("Category API Role-Based Access Control", () => {
  test.beforeAll(async () => {
    adminContext = await getAuthContext(Role.ADMIN);
    userContext = await getAuthContext(Role.USER);
    blockedContext = await getAuthContext(Role.BLOCKED);
  });

  test.afterAll(async () => {
    await adminContext.dispose();
    await userContext.dispose();
    await blockedContext.dispose();
  });

  test.afterAll(async () => {
    for (const id of createdCategoryIds.reverse()) {
      try {
        const res = await adminContext.delete(`/api/category/${id}`);
        if (res.ok()) console.log(`Cleaned up: ${id}`);
      } catch (err) {
        console.error(`Failed to delete category ${id}:`, err);
      }
    }
    createdCategoryIds.length = 0;
  });

  test("fetch /api/category and /api/category/all (all roles)", async () => {
    await test.step("admin", async () => {
      const res = await adminContext.get("/api/category");
      expect(res.ok()).toBeTruthy();
    });

    await test.step("user", async () => {
      const res = await userContext.get("/api/category");
      expect(res.ok()).toBeTruthy();
    });

    await test.step("blocked", async () => {
      const res = await blockedContext.get("/api/category");
      expect(res.ok()).toBeTruthy();
    });

    await test.step("admin /all", async () => {
      const res = await adminContext.get("/api/category/all");
      expect(res.ok()).toBeTruthy();
    });

    await test.step("user /all", async () => {
      const res = await userContext.get("/api/category/all");
      expect(res.ok()).toBeTruthy();
    });

    await test.step("blocked /all", async () => {
      const res = await blockedContext.get("/api/category/all");
      expect(res.ok()).toBeTruthy();
    });
  });

  test("admin: create parent category", async () => {
    const name = `parent-${faker.string.alphanumeric(6)}`;
    const images = Array.from({ length: 2 }, () => faker.image.url());

    const res = await adminContext.post("/api/category", {
      data: { name, images },
    });

    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    parentCategoryId = json.data.id;
    createdCategoryIds.push(parentCategoryId);
  });

  test("user: should NOT create category", async () => {
    const res = await userContext.post("/api/category", {
      data: {
        name: `unauth-${faker.string.alphanumeric(5)}`,
        parentId: parentCategoryId,
      },
    });
    expect(res.status()).toBe(403);
  });

  test("blocked: should NOT create category", async () => {
    const res = await blockedContext.post("/api/category", {
      data: {
        name: `block-${faker.string.alphanumeric(5)}`,
        parentId: parentCategoryId,
      },
    });
    expect(res.status()).toBe(403);
  });

  test("admin: create child category", async () => {
    testCategoryName = `child-${faker.string.alphanumeric(6)}`;
    const res = await adminContext.post("/api/category", {
      data: {
        name: testCategoryName,
        parentId: parentCategoryId,
      },
    });

    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    testCategoryId = json.data.id;
    createdCategoryIds.push(testCategoryId);
  });

  test("admin: update category", async () => {
    const newName = `updated-${faker.string.alphanumeric(6)}`;
    const res = await adminContext.patch(`/api/category/${testCategoryId}`, {
      data: { name: newName },
    });

    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.name).toBe(newName);
  });

  test("user: should NOT update category", async () => {
    const res = await userContext.patch(`/api/category/${testCategoryId}`, {
      data: { name: `user-update-${faker.string.alphanumeric(6)}` },
    });
    expect(res.status()).toBe(403);
  });

  test("blocked: should NOT update category", async () => {
    const res = await blockedContext.patch(`/api/category/${testCategoryId}`, {
      data: { name: `block-update-${faker.string.alphanumeric(6)}` },
    });
    expect(res.status()).toBe(403);
  });

  test("user: should NOT delete category", async () => {
    const res = await userContext.delete(`/api/category/${testCategoryId}`);
    expect(res.status()).toBe(403);
  });

  test("blocked: should NOT delete category", async () => {
    const res = await blockedContext.delete(`/api/category/${testCategoryId}`);
    expect(res.status()).toBe(403);
  });

  test("admin: delete all created categories", async () => {
    for (const id of createdCategoryIds.reverse()) {
      const res = await adminContext.delete(`/api/category/${id}`);
      expect(res.ok()).toBeTruthy();
    }
    createdCategoryIds.length = 0;
  });
});
