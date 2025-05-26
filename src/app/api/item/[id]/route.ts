import { deleteItem, getItemById, updateItem } from "@/action/item.action";
import { tryCatchWrapper } from "@/helper/tryCatchWarper";
import { type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return tryCatchWrapper(getItemById, id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return tryCatchWrapper(deleteItem, id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const input = await req.json();

  return tryCatchWrapper(updateItem, id, input);
}
