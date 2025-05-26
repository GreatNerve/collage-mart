"use server";

import { auth } from "@/auth/auth";
import { hasPermission } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { type Cuid, cuidSchema } from "@/schema/common.schema";
import {
  type ItemCategoryCreate,
  itemCategoryCreateSchema,
  type ItemCategoryUpdate,
  itemCategoryUpdateSchema,
} from "@/schema/itemCategory.schema";
import { type ApiResponse, type ItemCategoryType } from "@/types/common";

export const createItemCategory = async (
  input: ItemCategoryCreate
): Promise<ApiResponse<ItemCategoryType>> => {
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

  const permission = hasPermission(user, "CATEGORY", "CREATE");

  if (!permission) {
    return {
      success: false,
      message:
        "Forbidden: You do not have permission to create item categories",
      data: null,
      statusCode: 403,
      code: "FORBIDDEN",
    };
  }

  try {
    const validatedInput = itemCategoryCreateSchema.safeParse(input);
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

    // Check if the category already exists
    const existingCategory = await prisma.itemCategory.findUnique({
      where: {
        name: data.name,
      },
    });

    const isCategoryExists = !!existingCategory;
    if (isCategoryExists) {
      return {
        success: false,
        message: "Item category already exists",
        data: null,
        statusCode: 409,
        code: "CONFLICT",
      };
    }

    // Check for parent category existence if provided
    if (data?.parentId) {
      const parentCategory = await prisma.itemCategory.findUnique({
        where: {
          id: data.parentId,
        },
      });

      const isParentCategoryExists = !!parentCategory;
      if (!isParentCategoryExists) {
        return {
          success: false,
          message: "Parent category does not exist",
          data: null,
          statusCode: 404,
          code: "NOT_FOUND",
        };
      }
    }
    // Create the item category
    const itemCategory = await prisma.itemCategory.create({
      data: {
        name: data.name,
        description: data.description,
        images: data.images || [],
        ...(data.parentId && {
          parent: {
            connect: { id: data.parentId },
          },
        }),
      },
    });

    return {
      success: true,
      message: "Item category created successfully",
      data: itemCategory,
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

export const getItemAllCategories = async (query: {
  limit?: number;
  offset?: number;
}): Promise<
  ApiResponse<{
    total: number;
    data: ItemCategoryType[];
  }>
> => {
  try {
    const { limit = 10, offset = 0 } = query;

    const [itemCategories, total] = await prisma.$transaction([
      prisma.itemCategory.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.itemCategory.count(),
    ]);
    return {
      success: true,
      message: "Item categories fetched successfully",
      data: {
        total,
        data: itemCategories,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error fetching item categories:", error);
    return {
      success: false,
      message: "Failed to fetch item categories",
      data: null,
      statusCode: 500,
      error: error,
    };
  }
};

export const getItemCategoryById = async (
  id: Cuid
): Promise<ApiResponse<ItemCategoryType | null>> => {
  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return {
        success: false,
        message: "Invalid category ID",
        data: null,
        statusCode: 400,
        code: "VALIDATION_ERROR",
      };
    }
    const { data: validatedIdData } = validatedId;
    const itemCategory = await prisma.itemCategory.findUnique({
      where: { id: validatedIdData },
      include: {
        parent: true,
        children: true,
        items: true,
      },
    });

    if (!itemCategory) {
      return {
        success: false,
        message: "Item category not found",
        data: null,
        statusCode: 404,
        code: "NOT_FOUND",
      };
    }

    return {
      success: true,
      message: "Item category fetched successfully",
      data: itemCategory,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error fetching item category:", error);
    return {
      success: false,
      message: "Failed to fetch item category",
      data: null,
      statusCode: 500,
      error: error,
    };
  }
};

export const deleteItemCategory = async (
  id: Cuid
): Promise<ApiResponse<ItemCategoryType | null>> => {
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

  const permission = hasPermission(user, "CATEGORY", "DELETE");

  if (!permission) {
    return {
      success: false,
      message:
        "Forbidden: You do not have permission to delete item categories",
      data: null,
      statusCode: 403,
      code: "FORBIDDEN",
    };
  }

  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return {
        success: false,
        message: "Invalid category ID",
        data: null,
        statusCode: 400,
        code: "VALIDATION_ERROR",
      };
    }
    const { data: validatedIdData } = validatedId;

    const itemCategory = await prisma.itemCategory.findUnique({
      where: { id: validatedIdData },
    });

    if (!itemCategory) {
      return {
        success: false,
        message: "Item category not found",
        data: null,
        statusCode: 404,
        code: "NOT_FOUND",
      };
    }

    await prisma.itemCategory.delete({
      where: { id: validatedIdData },
    });

    return {
      success: true,
      message: "Item category deleted successfully",
      data: itemCategory,
      statusCode: 200,
      code: "DELETED",
    };
  } catch (error) {
    console.error("Error deleting item category:", error);
    return {
      success: false,
      message: "Failed to delete item category",
      data: null,
      statusCode: 500,
      error: error,
    };
  }
};

export const updateItemCategory = async (
  id: Cuid,
  input: ItemCategoryUpdate
): Promise<ApiResponse<ItemCategoryType | null>> => {
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

  if (!hasPermission(user, "CATEGORY", "UPDATE")) {
    return {
      success: false,
      message:
        "Forbidden: You do not have permission to update item categories",
      data: null,
      statusCode: 403,
      code: "FORBIDDEN",
    };
  }

  try {
    const validatedId = cuidSchema.safeParse(id);
    if (!validatedId.success) {
      return {
        success: false,
        message: "Invalid category ID",
        data: null,
        statusCode: 400,
        code: "VALIDATION_ERROR",
      };
    }
    const { data: validatedIdData } = validatedId;

    const existingCategory = await prisma.itemCategory.findUnique({
      where: { id: validatedIdData },
    });

    if (!existingCategory) {
      return {
        success: false,
        message: "Item category not found",
        data: null,
        statusCode: 404,
        code: "NOT_FOUND",
      };
    }

    const validatedInput = itemCategoryUpdateSchema.safeParse(input);
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

    if (validatedInputValues?.name) {
      const categoryWithSameName = await prisma.itemCategory.findUnique({
        where: {
          name: validatedInputValues.name,
        },
      });

      const isCategoryWithSameExists = !!categoryWithSameName;
      if (isCategoryWithSameExists) {
        return {
          success: false,
          message: "Item category with same name already exists",
          data: null,
          statusCode: 409,
          code: "CONFLICT",
        };
      }
    }

    if (
      validatedInputValues?.parentId &&
      validatedInputValues.parentId === existingCategory.id
    ) {
      return {
        success: false,
        message: "Cannot set the same category as parent",
        data: null,
        statusCode: 400,
        code: "INVALID_PARENT",
      };
    }

    const updatedCategory = await prisma.itemCategory.update({
      where: { id: validatedIdData },
      data: validatedInputValues,
    });

    return {
      success: true,
      message: "Item category updated successfully",
      data: updatedCategory,
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
