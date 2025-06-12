import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/action/category.action";
import { tryCatchWrapper } from "@/helper/tryCatchWarper";
import { type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return tryCatchWrapper(getCategoryById, id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return tryCatchWrapper(deleteCategory, id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const input = await req.json();

  return tryCatchWrapper(updateCategory, id, input);
}
