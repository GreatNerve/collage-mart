import { cuidSchema } from "@/schema/common.schema";
import type { GetIdOrSlugInputType } from "@/types/common";

export function buildIdOrSlugInput(idOrSlug: string): GetIdOrSlugInputType {
  return cuidSchema.safeParse(idOrSlug).success
    ? { id: idOrSlug }
    : { slug: idOrSlug };
}
