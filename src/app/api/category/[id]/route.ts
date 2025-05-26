import {
  deleteItemCategory,
  getItemCategoryById,
  updateItemCategory,
} from "@/action/itemCategory.action";
import { tryCatchWrapper } from "@/helper/tryCatchWarper";
import { type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return tryCatchWrapper(getItemCategoryById, id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return tryCatchWrapper(deleteItemCategory, id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const input = await req.json();

  return tryCatchWrapper(updateItemCategory, id, input);
}
