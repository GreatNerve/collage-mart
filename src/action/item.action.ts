"use server";

import { auth } from "@/auth/auth";
import { normalizeSlug } from "@/helper/normalize";
import { hasPermission } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { type Cuid, cuidSchema } from "@/schema/common.schema";
import {
  type ItemCreate,
  itemCreateSchema,
  type ItemUpdate,
  itemUpdateSchema,
} from "@/schema/item.schema";
import { type ApiResponse, type ItemType } from "@/types/common";

export const createItem = async (
  input: ItemCreate
): Promise<ApiResponse<ItemType>> => {
  const session = await auth();
  if (!session || !session.user) {
    return {
      success: false,
      message: "Unauthorized",
      data: null,
      statusCode: 401,
      code: "UNAUTHORIZED",
    };
  }

  const user = session.user;

  const permission = hasPermission(user, "ITEM", "CREATE");

  if (!permission) {
    return {
      success: false,
      message: "Forbidden: You do not have permission to create item",
      data: null,
      statusCode: 403,
      code: "FORBIDDEN",
    };
  }

  try {
    const validatedInput = itemCreateSchema.safeParse(input);
    if (!validatedInput.success) {
      return {
        success: false,
        message: "Validation failed",
        data: null,
        error: validatedInput.error.errors,
        code: "VALIDATION_ERROR",
        statusCode: 400,
      };
    }

    const { data } = validatedInput;

    let slug = data.name;

    if (data.slug) {
      slug = normalizeSlug(data.slug);
    } else {
      slug = normalizeSlug(
        `${data.name}-${Math.random().toString(36).substring(2, 10)}`
      );
    }

    const existingItemsWithSameSlug = await prisma.item.findUnique({
      where: {
        slug: slug,
      },
    });

    const isSlugExists = !!existingItemsWithSameSlug;
    if (isSlugExists) {
      return {
        success: false,
        message: "Item with this slug already exists",
        data: null,
        statusCode: 409,
        code: "CONFLICT",
      };
    }

    const item = await prisma.item.create({
      data: {
        name: data.name,
        description: data.description,
        images: data.images,
        price: data.price,
        condition: data.condition,
        conditionDescription: data.conditionDescription,
        longitude: data.longitude,
        latitude: data.latitude,
        location: data.location,
        pinCode: data.pinCode,
        slug: slug,
        category: {
          connect: data.categoryId ? { id: data.categoryId } : undefined,
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return {
      success: true,
      message: "Item created successfully",
      data: item,
      statusCode: 201,
    };
  } catch (error) {
    console.error("Validation Error:", error);
    return {
      success: false,
      message: "Invalid input data",
      data: null,
      statusCode: 400,
    };
  }
};

export const getAllItem = async (query: {
  limit?: number;
  offset?: number;
}): Promise<
  ApiResponse<{
    total: number;
    data: ItemType[];
  }>
> => {
  try {
    const { limit = 10, offset = 0 } = query;

    const [itemCategories, total] = await prisma.$transaction([
      prisma.item.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          name: "asc",
        },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.itemCategory.count(),
    ]);
    return {
      success: true,
      message: "Item fetched successfully",
      data: {
        total,
        data: itemCategories,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error fetching item:", error);
    return {
      success: false,
      message: "Failed to fetch item",
      data: null,
      statusCode: 500,
      error: error,
    };
  }
};

export const getItemById = async (
  id: Cuid
): Promise<ApiResponse<ItemType | null>> => {
  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return {
        success: false,
        message: "Invalid Item ID",
        data: null,
        statusCode: 400,
        code: "VALIDATION_ERROR",
      };
    }
    const { data: validatedIdData } = validatedId;
    const item = await prisma.item.findUnique({
      where: { id: validatedIdData },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!item) {
      return {
        success: false,
        message: "Item not found",
        data: null,
        statusCode: 404,
        code: "NOT_FOUND",
      };
    }

    return {
      success: true,
      message: "Item fetched successfully",
      data: item,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error fetching item:", error);
    return {
      success: false,
      message: "Failed to fetch item",
      data: null,
      statusCode: 500,
      error: error,
    };
  }
};

export const updateItem = async (
  id: Cuid,
  input: ItemUpdate
): Promise<ApiResponse<ItemType | null>> => {
  const session = await auth();
  if (!session?.user) {
    return {
      success: false,
      message: "Unauthorized",
      data: null,
      statusCode: 401,
      code: "UNAUTHORIZED",
    };
  }

  const user = session.user;

  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return {
        success: false,
        message: "Invalid Item ID",
        data: null,
        statusCode: 400,
        code: "VALIDATION_ERROR",
      };
    }
    const { data: validatedIdData } = validatedId;

    const existingItems = await prisma.item.findUnique({
      where: { id: validatedIdData },
    });

    if (!existingItems) {
      return {
        success: false,
        message: "Item not found",
        data: null,
        statusCode: 404,
        code: "NOT_FOUND",
      };
    }

    const hasPermissionOwnEdit = hasPermission(
      user,
      "ITEM",
      "UPDATE:OWN",
      existingItems
    );
    if (!hasPermissionOwnEdit && !hasPermission(user, "ITEM", "UPDATE")) {
      return {
        success: false,
        message: "Forbidden: You do not have permission to update item",
        data: null,
        statusCode: 403,
        code: "FORBIDDEN",
      };
    }

    const validatedInput = itemUpdateSchema.safeParse(input);
    if (!validatedInput.success) {
      return {
        success: false,
        message: "Validation failed",
        data: null,
        error: validatedInput.error.errors,
        code: "VALIDATION_ERROR",
        statusCode: 400,
      };
    }

    const { data: validatedInputValues } = validatedInput;
    const { slug: slugInput, ...rest } = validatedInputValues;

    const slug = slugInput ? normalizeSlug(slugInput) : null;
    if (slug) {
      const itemWithSameSlug = await prisma.item.findUnique({
        where: {
          slug: slug,
        },
      });

      const isSamSlugExists = !!itemWithSameSlug;
      if (isSamSlugExists) {
        return {
          success: false,
          message: "Item with same slug already exists",
          data: null,
          statusCode: 409,
          code: "CONFLICT",
        };
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id: validatedIdData },
      data: {
        ...rest,
        ...(slug != null && { slug }),
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Item category updated successfully",
      data: updatedItem,
      statusCode: 200,
      code: "UPDATED",
    };
  } catch (error) {
    console.error("Error updating item category:", error);
    return {
      success: false,
      message: "Failed to update item category",
      data: null,
      statusCode: 500,
      error,
    };
  }
};

export const deleteItem = async (
  id: Cuid
): Promise<ApiResponse<ItemType | null>> => {
  const session = await auth();
  if (!session || !session.user) {
    return {
      success: false,
      message: "Unauthorized",
      data: null,
      statusCode: 401,
      code: "UNAUTHORIZED",
    };
  }

  const user = session.user;

  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return {
        success: false,
        message: "Invalid Item ID",
        data: null,
        statusCode: 400,
        code: "VALIDATION_ERROR",
      };
    }
    const { data: validatedIdData } = validatedId;

    const item = await prisma.item.findUnique({
      where: { id: validatedIdData },
    });

    if (!item) {
      return {
        success: false,
        message: "Item not found",
        data: null,
        statusCode: 404,
        code: "NOT_FOUND",
      };
    }

    const hasPermissionOwnEdit = hasPermission(
      user,
      "ITEM",
      "DELETE:OWN",
      item
    );
    if (!hasPermissionOwnEdit && !hasPermission(user, "ITEM", "DELETE")) {
      return {
        success: false,
        message: "Forbidden: You do not have permission to delete item",
        data: null,
        statusCode: 403,
        code: "FORBIDDEN",
      };
    }

    await prisma.item.delete({
      where: { id: validatedIdData },
    });

    return {
      success: true,
      message: "Item deleted successfully",
      data: item,
      statusCode: 200,
      code: "DELETED",
    };
  } catch (error) {
    console.error("Error deleting item:", error);
    return {
      success: false,
      message: "Failed to delete item",
      data: null,
      statusCode: 500,
      error: error,
    };
  }
};
