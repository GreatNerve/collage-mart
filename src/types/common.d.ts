import { ConversationParticipant, Item, ItemCategory } from "@prisma/client";

export type ItemType = Item;
export type ItemCategoryType = ItemCategory;

export type ConversationParticipantType = ConversationParticipant;

type ApiResponse<T = null> = {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
  code?: string;
  error?: unknown;
};
