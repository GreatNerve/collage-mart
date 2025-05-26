import { z } from "zod";

export const cuidSchema = z.string().cuid();
export type Cuid = z.infer<typeof cuidSchema>;

export const idSchema = z.union([cuidSchema, z.string().uuid()]);
export type Id = z.infer<typeof idSchema>;
