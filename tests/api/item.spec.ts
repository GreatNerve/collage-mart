import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

const createdItemIds: string[] = [];

test.describe.serial("Item API - CRUD Operations", () => {
  let testItemId: string;
  let testItemSlug: string;

  test("Should fetch a paginated list of items", async ({ request }) => {
    const response = await request.get("/api/item");
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.data)).toBe(true);
  });

  test("Should create a new item", async ({ request }) => {
    testItemSlug = `item-${faker.string.alphanumeric(6).toLowerCase()}`;
    const response = await request.post("/api/item", {
      data: {
        name: `Item ${faker.commerce.productName()}`,
        price: faker.number.int({ min: 100, max: 10000 }),
        images: [faker.image.url()],
        condition: "USED",
        description: faker.lorem.sentence(),
        location: faker.location.city(),
        pinCode: faker.location.zipCode(),
        slug: testItemSlug,
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.slug).toBe(testItemSlug);
    testItemId = json.data.id;
    createdItemIds.push(testItemId);
  });

  test("Should fail to create item with duplicate slug", async ({
    request,
  }) => {
    const response = await request.post("/api/item", {
      data: {
        name: `Duplicate ${faker.commerce.productName()}`,
        price: faker.number.int({ min: 100, max: 10000 }),
        slug: testItemSlug,
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    const json = await response.json();
    expect(json.success).toBe(false);
  });

  test("Should fetch a single item by ID", async ({ request }) => {
    const response = await request.get(`/api/item/${testItemId}`);
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe(testItemId);
  });

  test("Should update the item's name and description", async ({ request }) => {
    const newName = `Updated ${faker.commerce.productName()}`;
    const newDescription = faker.lorem.paragraph();
    const response = await request.patch(`/api/item/${testItemId}`, {
      data: {
        name: newName,
        description: newDescription,
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.name).toBe(newName);
    expect(json.data.description).toBe(newDescription);
  });

  test("Should delete the created item(s)", async ({ request }) => {
    for (const id of createdItemIds.reverse()) {
      const response = await request.delete(`/api/item/${id}`);
      expect(response.ok()).toBeTruthy();
    }
  });
});
