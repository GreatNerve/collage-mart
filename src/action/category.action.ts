"use server";

import { ApiResponse } from "@/lib/api.response";
import { handleError } from "@/lib/error/handleError";
import { hasPermission } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { getUserServerActions } from "@/lib/user.dal";
import {
  type CategoryCreate,
  categoryCreateSchema,
  type CategoryUpdate,
  categoryUpdateSchema,
} from "@/schema/category.schema";
import { type Cuid, cuidSchema } from "@/schema/common.schema";
import {
  type CategoryType,
  CategoryWhereType,
} from "@/types/common";
import { HTTP_CODES } from "@/lib/error/custom.error";

export const createCategory = async (
  input: CategoryCreate
): Promise<ApiResponse<CategoryType>> => {
  const user = await getUserServerActions();

  const permission = hasPermission(user, "CATEGORY", "CREATE");

  if (!permission) {
    return ApiResponse.error({
      message:
        "Forbidden: You do not have permission to create item categories",
      statusCode: 403,
      code: HTTP_CODES.FORBIDDEN,
    });
  }

  try {
    const validatedInput = categoryCreateSchema.safeParse(input);
    if (!validatedInput.success) {
      return ApiResponse.error({
        message: "Validation failed",
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedInput.error.errors,
      });
    }

    const { data } = validatedInput;

    const existingCategory = await prisma.category.findUnique({
      where: {
        name: data.name,
      },
    });

    const isCategoryExists = !!existingCategory;
    if (isCategoryExists) {
      return ApiResponse.error({
        message: "Item category with same name already exists",
        statusCode: 409,
        code: HTTP_CODES.CONFLICT,
      });
    }

    if (data?.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: {
          id: data.parentId,
        },
      });

      const isParentCategoryExists = !!parentCategory;
      if (!isParentCategoryExists) {
        return ApiResponse.error({
          message: "Parent category not found",
          statusCode: 404,
          code: HTTP_CODES.NOT_FOUND,
        });
      }
    }
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        images: data.images || [],
        ...(data.parentId && {
          parent: {
            connect: { id: data.parentId },
          },
        }),
        user: {
          connect: { id: user.id },
        },
      },
    });

    return ApiResponse.success({
      data: category,
      message: "Item category created successfully",
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

export const getCategories = async (query: {
  limit?: number;
  offset?: number;
  userId?: Cuid;
}): Promise<
  ApiResponse<{
    total: number;
    data: CategoryType[];
  }>
> => {
  try {
    const { limit = 10, offset = 0, userId } = query;
    const safeLimit = Math.min(limit, 100);
    const safeOffset = Number(offset) || 0;

    const whereClause: CategoryWhereType = {
      parentId: null,
    };

    if (userId) {
      const validatedUserId = cuidSchema.safeParse(query.userId);
      if (!validatedUserId.success) {
        return ApiResponse.error({
          message: "Invalid user ID",
          statusCode: 400,
          code: HTTP_CODES.ZOD_VALIDATION_ERROR,
          error: validatedUserId.error.errors,
        });
      }
      whereClause.userId = validatedUserId.data;
    }

    const [categories, total] = await prisma.$transaction([
      prisma.category.findMany({
        where: whereClause,
        take: safeLimit,
        skip: safeOffset,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.category.count({
        where: whereClause,
      }),
    ]);
    return ApiResponse.success({
      data: {
        total,
        data: categories,
      },
      message: "Item categories fetched successfully",
      statusCode: 200,
      code: HTTP_CODES.OK,
    });
  } catch (error) {
    console.error("Error fetching item categories:", error);
    const { payload, status } = handleError(error);
    return ApiResponse.error({
      message: "Failed to fetch item categories",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};

export const getItemAllCategories = async (query: {
  limit?: number;
  offset?: number;
  userId?: Cuid;
}): Promise<
  ApiResponse<{
    total: number;
    data: CategoryType[];
  }>
> => {
  try {
    const { limit = 10, offset = 0, userId } = query;
    const safeLimit = Math.min(limit, 100);
    const safeOffset = Number(offset) || 0;

    const whereClause: CategoryWhereType = {};
    if (userId) {
      const validatedUserId = cuidSchema.safeParse(query.userId);
      if (!validatedUserId.success) {
        return ApiResponse.error({
          message: "Invalid user ID",
          statusCode: 400,
          code: HTTP_CODES.ZOD_VALIDATION_ERROR,
          error: validatedUserId.error.errors,
        });
      }
      whereClause.userId = validatedUserId.data;
    }

    const [categories, total] = await prisma.$transaction([
      prisma.category.findMany({
        where: whereClause,
        take: safeLimit,
        skip: safeOffset,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.category.count({
        where: whereClause,
      }),
    ]);
    return ApiResponse.success({
      data: {
        total,
        data: categories,
      },
      message: "Item categories fetched successfully",
      statusCode: 200,
      code: HTTP_CODES.OK,
    });
  } catch (error) {
    console.error("Error fetching item categories:", error);
    const { payload, status } = handleError(error);
    return ApiResponse.error({
      message: "Failed to fetch item categories",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};

export const getCategoryById = async (
  id: Cuid
): Promise<ApiResponse<CategoryType | null>> => {
  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return ApiResponse.error({
        message: "Invalid category ID",
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedId.error.errors,
      });
    }
    const { data: validatedIdData } = validatedId;
    const category = await prisma.category.findUnique({
      where: { id: validatedIdData },
      include: {
        parent: true,
        children: true,
        items: true,
      },
    });

    if (!category) {
      return ApiResponse.error({
        message: "Item category not found",
        statusCode: 404,
        code: HTTP_CODES.NOT_FOUND,
      });
    }

    return ApiResponse.success({
      data: category,
      message: "Item category fetched successfully",
      statusCode: 200,
      code: HTTP_CODES.OK,
    });
  } catch (error) {
    console.error("Error fetching item category:", error);
    const { payload, status } = handleError(error);
    return ApiResponse.error({
      message: "Failed to fetch item category",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};

export const deleteCategory = async (
  id: Cuid
): Promise<ApiResponse<CategoryType | null>> => {
  const user = await getUserServerActions();

  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return ApiResponse.error({
        message: "Invalid category ID",
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedId.error.errors,
      });
    }
    const { data: validatedIdData } = validatedId;

    const category = await prisma.category.findUnique({
      where: { id: validatedIdData },
    });

    if (!category) {
      return ApiResponse.error({
        message: "Item category not found",
        statusCode: 404,
        code: HTTP_CODES.NOT_FOUND,
      });
    }

    const hasPermissionOwnEdit = hasPermission(
      user,
      "CATEGORY",
      "DELETE:OWN",
      category
    );
    if (!hasPermissionOwnEdit && !hasPermission(user, "CATEGORY", "DELETE")) {
      return ApiResponse.error({
        message:
          "Forbidden: You do not have permission to delete item categories",
        statusCode: 403,
        code: HTTP_CODES.FORBIDDEN,
      });
    }

    await prisma.category.delete({
      where: { id: validatedIdData },
    });

    return ApiResponse.success({
      data: null,
      message: "Item category deleted successfully",
      statusCode: 200,
      code: HTTP_CODES.DELETED,
    });
  } catch (error) {
    console.error("Error deleting item category:", error);
    const { payload, status } = handleError(error);
    return ApiResponse.error({
      message: "Failed to delete item category",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};

export const updateCategory = async (
  id: Cuid,
  input: CategoryUpdate
): Promise<ApiResponse<CategoryType | null>> => {
  const user = await getUserServerActions();

  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return ApiResponse.error({
        message: "Invalid category ID",
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedId.error.errors,
      });
    }
    const { data: validatedIdData } = validatedId;

    const existingCategory = await prisma.category.findUnique({
      where: { id: validatedIdData },
    });

    if (!existingCategory) {
      return ApiResponse.error({
        message: "Item category not found",
        statusCode: 404,
        code: HTTP_CODES.NOT_FOUND,
      });
    }
    const hasPermissionOwnEdit = hasPermission(
      user,
      "CATEGORY",
      "UPDATE:OWN",
      existingCategory
    );
    if (!hasPermissionOwnEdit && !hasPermission(user, "CATEGORY", "UPDATE")) {
      return ApiResponse.error({
        message:
          "Forbidden: You do not have permission to update item categories",
        statusCode: 403,
        code: HTTP_CODES.FORBIDDEN,
      });
    }

    const validatedInput = categoryUpdateSchema.safeParse(input);
    if (!validatedInput.success) {
      return ApiResponse.error({
        message: "Validation failed",
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedInput.error.errors,
      });
    }

    const { data: validatedInputValues } = validatedInput;

    if (validatedInputValues?.name) {
      const categoryWithSameName = await prisma.category.findUnique({
        where: {
          name: validatedInputValues.name,
        },
      });

      const isCategoryWithSameExists = !!categoryWithSameName;
      if (isCategoryWithSameExists) {
        return ApiResponse.error({
          message: "Item category with same name already exists",
          statusCode: 409,
          code: HTTP_CODES.CONFLICT,
        });
      }
    }

    if (
      validatedInputValues?.parentId &&
      validatedInputValues.parentId === existingCategory.id
    ) {
      return ApiResponse.error({
        message: "Cannot set parent category to itself",
        statusCode: 400,
        code: HTTP_CODES.BAD_REQUEST,
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: validatedIdData },
      data: validatedInputValues,
    });

    return ApiResponse.success({
      data: updatedCategory,
      message: "Item category updated successfully",
      statusCode: 200,
      code: HTTP_CODES.UPDATED,
    });
  } catch (error) {
    console.error("Error updating item category:", error);
    const { payload, status } = handleError(error);
    return ApiResponse.error({
      message: "Failed to update item category",
      statusCode: status,
      error: payload.error,
      code: payload.code,
    });
  }
};
