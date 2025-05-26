import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

const createdCategoryIds: string[] = [];

test.describe.serial("Category API CRUD", () => {
  let parentCategoryId: string;
  let testCategoryId: string;
  let testCategoryName: string;

  test("fetch categories", async ({ request }) => {
    const response = await request.get("/api/category");
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.data)).toBe(true);
  });

  test("create a parent category for tests", async ({ request }) => {
    const name = `parent-${faker.string.alphanumeric(6)}`;
    const images = Array.from({ length: 2 }, () => faker.image.url());

    const response = await request.post("/api/category", {
      data: { name, images },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(true);
    parentCategoryId = json.data.id;
    createdCategoryIds.push(parentCategoryId);
  });

  test("create a child category", async ({ request }) => {
    testCategoryName = `child-${faker.string.alphanumeric(6)}`;
    const response = await request.post("/api/category", {
      data: {
        name: testCategoryName,
        parentId: parentCategoryId,
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.name).toBe(testCategoryName);
    testCategoryId = json.data.id;
    createdCategoryIds.push(testCategoryId);
  });

  test("fail to create category with same name", async ({ request }) => {
    const response = await request.post("/api/category", {
      data: {
        name: testCategoryName,
        parentId: parentCategoryId,
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    const json = await response.json();
    expect(json.success).toBe(false);
  });

  test("get category by ID", async ({ request }) => {
    const response = await request.get(`/api/category/${testCategoryId}`);
    const json = await response.json();
    expect(response.ok()).toBeTruthy();
    expect(json.data.id).toBe(testCategoryId);
  });

  test("update category name", async ({ request }) => {
    const newName = `updated-${faker.string.alphanumeric(6)}`;
    const response = await request.patch(`/api/category/${testCategoryId}`, {
      data: {
        name: newName,
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.data.name).toBe(newName);
  });

  test("cleanup: delete created categories", async ({ request }) => {
    for (const id of createdCategoryIds.reverse()) {
      const response = await request.delete(`/api/category/${id}`);
      expect(response.ok()).toBeTruthy();
    }
  });
});
