import { z } from "zod";

export const itemCategoryCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(20, "Name must be at most 20 characters long"),
  description: z
    .string()
    .max(100, "Description must be at most 100 characters long")
    .optional(),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .max(5, "You can upload a maximum of 5 images")
    .optional(),
  parentId: z.string().cuid().optional(),
});

export type ItemCategoryCreate = z.infer<typeof itemCategoryCreateSchema>;

export const itemCategoryUpdateSchema = itemCategoryCreateSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  });

export type ItemCategoryUpdate = z.infer<typeof itemCategoryUpdateSchema>;
