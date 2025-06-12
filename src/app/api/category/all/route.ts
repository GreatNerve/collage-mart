import { getItemAllCategories } from "@/action/category.action";
import { tryCatchWrapper } from "@/helper/tryCatchWarper";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = searchParams.get("limit");
  const skip = searchParams.get("skip");
  const userId = searchParams.get("userId");
  return tryCatchWrapper(getItemAllCategories, {
    limit: typeof limit === "string" ? parseInt(limit) : undefined,
    offset: typeof skip === "string" ? parseInt(skip) : undefined,
    userId: typeof userId === "string" ? userId : undefined,
  });
}
