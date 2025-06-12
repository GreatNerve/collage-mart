import {
  Category,
  ConversationParticipant,
  Item,
  Prisma,
} from "@prisma/client";

export type ItemType = Item;
export type CategoryType = Category;

export type CategoryWhereType = Prisma.CategoryWhereInput;
export type ItemWhereType = Prisma.ItemWhereInput;

export type ConversationParticipantType = ConversationParticipant;


