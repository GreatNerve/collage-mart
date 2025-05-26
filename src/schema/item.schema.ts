import { normalizeSlug } from "@/helper/normalize";
import { z } from "zod";

export const itemCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(64, "Name must be at most 64 characters long"),
  description: z
    .string()
    .max(200, "Description must be at most 200 characters long")
    .optional(),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .max(5, "You can upload a maximum of 5 images")
    .optional(),
  price: z
    .number()
    .min(0, "Price must be a positive number")
    .max(1000000, "Price must be at most 1,000,000"),
  categoryId: z.string().cuid().optional(),
  condition: z.enum(["NEW", "USED", "REFURBISHED", "DAMAGED"]).default("USED"),
  conditionDescription: z
    .string()
    .max(200, "Condition description must be at most 100 characters long")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  location: z
    .string()
    .max(100, "Location must be at most 200 characters long")
    .optional(),
  pinCode: z
    .string()
    .min(1, "Pin code is required")
    .max(10, "Pin code must be at most 10 characters long")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be at most 100 characters long")
    .transform((val) => normalizeSlug(val))
    .optional(),
});

export type ItemCreate = z.infer<typeof itemCreateSchema>;

export const itemUpdateSchema = itemCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export type ItemUpdate = z.infer<typeof itemUpdateSchema>;
