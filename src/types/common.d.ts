import {
  Category,
  ConversationParticipant,
  Item,
  Prisma,
  Role,
} from "@prisma/client";

export type ItemType = Item;
export type CategoryType = Category;

export type RoleType = Role;

export type CategoryWhereType = Prisma.CategoryWhereInput;
export type ItemWhereType = Prisma.ItemWhereInput;

export type ConversationParticipantType = ConversationParticipant;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Omit<Pick<T, Keys>, K>>;
  }[Keys];

type GetIdOrSlugInputType = RequireAtLeastOne<
  {
    id?: Cuid;
    slug?: string;
  },
  "id" | "slug"
>;
