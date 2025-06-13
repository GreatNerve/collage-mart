"use server";

import { normalizeSlug } from "@/helper/normalize";
import { ApiResponse } from "@/lib/api.response";
import { HTTP_CODES } from "@/lib/error/custom.error";
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
  type CategoryWhereType,
  type GetIdOrSlugInputType,
} from "@/types/common";

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

  const validatedInput = categoryCreateSchema.safeParse(input);
  if (!validatedInput.success) {
    return ApiResponse.error({
      message: "Validation failed",
      statusCode: 400,
      code: HTTP_CODES.ZOD_VALIDATION_ERROR,
      error: validatedInput.error.errors,
    });
  }

  const { name, description, images = [], parentId } = validatedInput.data;
  const slug = normalizeSlug(name);
  if (!slug) {
    return ApiResponse.error({
      message: "Invalid category name, slug cannot be empty",
      statusCode: 400,
      code: HTTP_CODES.BAD_REQUEST,
      error: "Category name needs to url friendly slug",
    });
  }
  const normalizedSlug = normalizeSlug(slug);

  try {
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: name }, { slug: slug }],
      },
      select: {
        id: true,
      },
    });

    if (existingCategory) {
      return ApiResponse.error({
        message: "Item category with same name already exists",
        statusCode: 409,
        code: HTTP_CODES.CONFLICT,
      });
    }

    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: {
          id: parentId,
        },
        select: {
          id: true,
        },
      });

      if (!parentCategory) {
        return ApiResponse.error({
          message: "Parent category not found",
          statusCode: 404,
          code: HTTP_CODES.NOT_FOUND,
        });
      }
    }
    const category = await prisma.category.create({
      data: {
        name: name,
        description: description,
        images: images || [],
        slug: normalizedSlug,
        ...(parentId && {
          parent: {
            connect: { id: parentId },
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
  try {
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
  try {
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

export const getCategoryByIdORSlug = async ({
  id,
  slug,
}: GetIdOrSlugInputType): Promise<ApiResponse<CategoryType | null>> => {
  if (!id && !slug) {
    return ApiResponse.error({
      message: "Category ID or slug is required",
      statusCode: 400,
      code: HTTP_CODES.BAD_REQUEST,
    });
  }

  const whereClause: CategoryWhereType = {};
  if (id) {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return ApiResponse.error({
        message: "Invalid category ID",
        statusCode: 400,
        code: HTTP_CODES.ZOD_VALIDATION_ERROR,
        error: validatedId.error.errors,
      });
    }
    whereClause.id = validatedId.data;
  }

  if (slug) {
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) {
      return ApiResponse.error({
        message: "Invalid category slug",
        statusCode: 400,
        code: HTTP_CODES.BAD_REQUEST,
        error: "Category slug cannot be empty",
      });
    }
    whereClause.slug = normalizedSlug;
  }

  try {
    const category = await prisma.category.findFirst({
      where: whereClause,
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

  try {
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

  try {
    const existingCategory = await prisma.category.findUnique({
      where: { id: validatedIdData },
      select: {
        id: true,
        userId: true,
        parentId: true,
      },
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

    const { parentId: updateParentId, ...inputValues } = validatedInput.data;

    const updateValues: Partial<Omit<CategoryUpdate, "parentId">> & {
      slug?: string;
    } = inputValues;

    if (updateValues.name) {
      const slug = normalizeSlug(updateValues.name);

      if (!slug) {
        return ApiResponse.error({
          message: "Invalid category name, slug cannot be empty",
          statusCode: 400,
          code: HTTP_CODES.BAD_REQUEST,
          error: "Category name needs to url friendly slug",
        });
      }

      const isSameNewNameSlugExist = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: validatedIdData } },
            {
              OR: [{ name: updateValues.name }, { slug: slug }],
            },
          ],
        },
        select: {
          id: true,
        },
      });
      if (isSameNewNameSlugExist) {
        return ApiResponse.error({
          message: "Item category with same name already exists",
          statusCode: 409,
          code: HTTP_CODES.CONFLICT,
        });
      }
      updateValues.slug = normalizeSlug(slug);
    }
    if (updateParentId && updateParentId === existingCategory.id) {
      return ApiResponse.error({
        message: "Cannot set parent category to itself",
        statusCode: 400,
        code: HTTP_CODES.BAD_REQUEST,
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: validatedIdData },
      data: {
        ...updateValues,
        ...(updateParentId && {
          parent: {
            connect: { id: updateParentId },
          },
        }),
      },
      include: {
        parent: true,
        children: true,
        items: true,
      },
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
