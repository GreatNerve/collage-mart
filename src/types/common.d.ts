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

