"use server";

import { normalizeSlug } from "@/helper/normalize";
import { ApiResponse } from "@/lib/api.response";
import { handleError } from "@/lib/error/handleError";
import { hasPermission } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { getUserServerActions } from "@/lib/user.dal";
import { type Cuid, cuidSchema } from "@/schema/common.schema";
import {
  type ItemCreate,
  itemCreateSchema,
  type ItemUpdate,
  itemUpdateSchema,
} from "@/schema/item.schema";
import { type ItemType, ItemWhereType } from "@/types/common";
import { HTTP_CODES } from "@/lib/error/custom.error";

export const createItem = async (
  input: ItemCreate
): Promise<ApiResponse<ItemType>> => {
  const user = await getUserServerActions();

  const permission = hasPermission(user, "ITEM", "CREATE");

  if (!permission) {
    return ApiResponse.error({
      message: "Forbidden: You do not have permission to create item",
      statusCode: 403,
      code: "FORBIDDEN",
    });
  }

  try {
    const validatedInput = itemCreateSchema.safeParse(input);
    if (!validatedInput.success) {
      return ApiResponse.error({
        message: "Validation failed",
        error: validatedInput.error.errors,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        statusCode: 400,
      });
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
      return ApiResponse.error({
        message: "Item with same slug already exists",
        statusCode: 409,
        code: HTTP_CODES.CONFLICT,
      });
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

    return ApiResponse.success({
      data: item,
      message: "Item created successfully",
      statusCode: 201,
      code: HTTP_CODES.CREATED,
    });
  } catch (error) {
    const { payload, status } = handleError(error);

    return ApiResponse.error({
      message: "Failed to create item category",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};

export const getAllItem = async (query: {
  limit?: number;
  offset?: number;
  userId?: Cuid;
  categoryId?: Cuid;
}): Promise<
  ApiResponse<{
    total: number;
    data: ItemType[];
  }>
> => {
  try {
    const { limit = 10, offset = 0 } = query;
    const safeLimit = Math.min(limit, 100);
    const safeOffset = Number(offset) || 0;

    const whereClause: ItemWhereType = {};
    if (query.userId) {
      const validatedUserId = cuidSchema.safeParse(query.userId);
      if (!validatedUserId.success) {
        return ApiResponse.error({
          message: "Invalid User ID",
          statusCode: 400,
          code: HTTP_CODES.ZOD_VALIDATION_ERROR,
          error: validatedUserId.error.errors,
        });
      }
      whereClause.userId = validatedUserId.data;
    }

    if (query.categoryId) {
      const validatedCategoryId = cuidSchema.safeParse(query.categoryId);
      if (!validatedCategoryId.success) {
        return ApiResponse.error({
          message: "Invalid Category ID",
          statusCode: 400,
          code: HTTP_CODES.ZOD_VALIDATION_ERROR,
          error: validatedCategoryId.error.errors,
        });
      }
      whereClause.categoryId = validatedCategoryId.data;
    }

    const [item, total] = await prisma.$transaction([
      prisma.item.findMany({
        where: whereClause,
        take: safeLimit,
        skip: safeOffset,
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
      prisma.item.count({
        where: whereClause,
      }),
    ]);
    return ApiResponse.success({
      data: {
        total,
        data: item,
      },
      message: "Items fetched successfully",
      statusCode: 200,
      code: HTTP_CODES.OK,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    const { payload, status } = handleError(error);
    return ApiResponse.error({
      message: "Failed to fetch items",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};

export const getItemById = async (
  id: Cuid
): Promise<ApiResponse<ItemType | null>> => {
  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return ApiResponse.error({
        message: "Invalid Item ID",
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedId.error.errors,
      });
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
      return ApiResponse.error({
        message: "Item not found",
        statusCode: 404,
        code: HTTP_CODES.NOT_FOUND,
      });
    }

    return ApiResponse.success({
      data: item,
      message: "Item fetched successfully",
      statusCode: 200,
      code: HTTP_CODES.OK,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    const { payload, status } = handleError(error);
    return ApiResponse.error({
      message: "Failed to fetch item",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};

export const updateItem = async (
  id: Cuid,
  input: ItemUpdate
): Promise<ApiResponse<ItemType | null>> => {
  const user = await getUserServerActions();

  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return ApiResponse.error({
        message: "Invalid Item ID",
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedId.error.errors,
      });
    }
    const { data: validatedIdData } = validatedId;

    const existingItems = await prisma.item.findUnique({
      where: { id: validatedIdData },
    });

    if (!existingItems) {
      return ApiResponse.error({
        message: "Item not found",
        statusCode: 404,
        code: HTTP_CODES.NOT_FOUND,
      });
    }

    const hasPermissionOwnEdit = hasPermission(
      user,
      "ITEM",
      "UPDATE:OWN",
      existingItems
    );
    if (!hasPermissionOwnEdit && !hasPermission(user, "ITEM", "UPDATE")) {
      return ApiResponse.error({
        message: "Forbidden: You do not have permission to update item",
        statusCode: 403,
        code: HTTP_CODES.FORBIDDEN,
      });
    }

    const validatedInput = itemUpdateSchema.safeParse(input);
    if (!validatedInput.success) {
      return {
        success: false,
        message: "Validation failed",
        data: null,
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedInput.error.errors,
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
        return ApiResponse.error({
          message: "Item with same slug already exists",
          statusCode: 409,
          code: HTTP_CODES.CONFLICT,
        });
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

    return ApiResponse.success({
      data: updatedItem,
      message: "Item updated successfully",
      statusCode: 200,
      code: HTTP_CODES.UPDATED,
    });
  } catch (error) {
    console.error("Error updating item category:", error);
    const { payload, status } = handleError(error);
    return ApiResponse.error({
      message: "Failed to update item",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};

export const deleteItem = async (
  id: Cuid
): Promise<ApiResponse<ItemType | null>> => {
  const user = await getUserServerActions();

  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return ApiResponse.error({
        message: "Invalid Item ID",
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedId.error.errors,
      });
    }
    const { data: validatedIdData } = validatedId;

    const item = await prisma.item.findUnique({
      where: { id: validatedIdData },
    });

    if (!item) {
      return ApiResponse.error({
        message: "Item not found",
        statusCode: 404,
        code: HTTP_CODES.NOT_FOUND,
      });
    }

    const hasPermissionOwnEdit = hasPermission(
      user,
      "ITEM",
      "DELETE:OWN",
      item
    );
    if (!hasPermissionOwnEdit && !hasPermission(user, "ITEM", "DELETE")) {
      return ApiResponse.error({
        message: "Forbidden: You do not have permission to delete item",
        statusCode: 403,
        code: HTTP_CODES.FORBIDDEN,
      });
    }

    await prisma.item.delete({
      where: { id: validatedIdData },
    });

    return ApiResponse.success({
      data: null,
      message: "Item deleted successfully",
      statusCode: 200,
      code: HTTP_CODES.DELETED,
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    const { payload, status } = handleError(error);
    return ApiResponse.error({
      message: "Failed to delete item",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};
