import { z } from "zod";

export const categoryCreateSchema = z.object({
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
}).strip();

export type CategoryCreate = z.infer<typeof categoryCreateSchema>;

export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }).strip();

export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
