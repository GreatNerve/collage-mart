import { faker } from "@faker-js/faker";
import { expect, test, APIRequestContext } from "@playwright/test";
import { getAuthContext } from "../helpers/auth";
import { Role } from "../types/roles";

let adminContext: APIRequestContext;
let userContext: APIRequestContext;
let blockedContext: APIRequestContext;

let adminItemId: string;
let userItemId: string;

test.describe.serial("Item API Role-Based Access Control", () => {
  test.beforeAll(async () => {
    adminContext = await getAuthContext(Role.ADMIN);
    userContext = await getAuthContext(Role.USER);
    blockedContext = await getAuthContext(Role.BLOCKED);
  });

  test.afterAll(async () => {
    for (const id of [adminItemId, userItemId].filter(Boolean)) {
      try {
        await adminContext.delete(`/api/item/${id}`);
      } catch (err) {
        console.warn(`Failed to delete item ${id}:`, err);
      }
    }

    await adminContext.dispose();
    await userContext.dispose();
    await blockedContext.dispose();
  });

  test("GET /api/item is accessible by all roles", async () => {
    const responses = await Promise.all([
      adminContext.get("/api/item"),
      userContext.get("/api/item"),
      blockedContext.get("/api/item"),
    ]);

    for (const res of responses) {
      expect(res.ok()).toBeTruthy();
    }
  });

  test("ADMIN: create item", async () => {
    const slug = `admin-${faker.string.alphanumeric(6)}`;
    const res = await adminContext.post("/api/item", {
      data: {
        name: faker.commerce.productName(),
        price: 1000,
        slug,
        condition: "NEW",
        description: faker.commerce.productDescription(),
        location: "Delhi",
        pinCode: "110001",
        images: [faker.image.url()],
      },
    });

    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    adminItemId = json.data.id;
  });

  test("USER: create item", async () => {
    const slug = `user-${faker.string.alphanumeric(6)}`;
    const res = await userContext.post("/api/item", {
      data: {
        name: faker.commerce.productName(),
        price: 500,
        slug,
        condition: "USED",
        description: faker.commerce.productDescription(),
        location: "Mumbai",
        pinCode: "400001",
        images: [faker.image.url()],
      },
    });

    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    userItemId = json.data.id;
  });

  test("BLOCKED: should NOT create item", async () => {
    const res = await blockedContext.post("/api/item", {
      data: {
        name: "Blocked",
        price: 999,
        slug: `blocked-${faker.string.alphanumeric(6)}`,
        condition: "USED",
        description: "blocked try",
        location: "Nowhere",
        pinCode: "000000",
        images: [],
      },
    });
    expect(res.status()).toBe(403);
  });

  test("USER: can view own item", async () => {
    const res = await userContext.get(`/api/item/${userItemId}`);
    expect(res.ok()).toBeTruthy();
  });

  test("USER: can view other user's item", async () => {
    const res = await userContext.get(`/api/item/${adminItemId}`);
    expect(res.ok()).toBeTruthy();
  });

  test("USER: can update own item", async () => {
    const res = await userContext.patch(`/api/item/${userItemId}`, {
      data: { name: "Updated by USER" },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("USER: cannot update other user's item", async () => {
    const res = await userContext.patch(`/api/item/${adminItemId}`, {
      data: { name: "Hacked name" },
    });
    expect(res.status()).toBe(403);
  });

  test("BLOCKED: cannot update item", async () => {
    const res = await blockedContext.patch(`/api/item/${adminItemId}`, {
      data: { name: "Blocked update" },
    });
    expect(res.status()).toBe(403);
  });

  test("USER: can delete own item", async () => {
    const res = await userContext.delete(`/api/item/${userItemId}`);
    expect(res.ok()).toBeTruthy();
    userItemId = ""; 
  });

  test("USER: cannot delete other user's item", async () => {
    const res = await userContext.delete(`/api/item/${adminItemId}`);
    expect(res.status()).toBe(403);
  });

  test("BLOCKED: cannot delete item", async () => {
    const res = await blockedContext.delete(`/api/item/${adminItemId}`);
    expect(res.status()).toBe(403);
  });
});
