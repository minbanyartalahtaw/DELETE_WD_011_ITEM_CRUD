import { getClientPromise } from "@/lib/mongodb";

import { verifyJWT } from "@/lib/auth";

import { writeAuditLog } from "@/lib/audit";

import corsHeaders from "@/lib/cors";

import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request) {
  const user = verifyJWT(request);

  if (!user) return errorResponse("Unauthorized Request", 401);

  try {
    const client = await getClientPromise();

    const db = client.db(process.env.DB_NAME);

    // Filter out soft-deleted items (show items where status is not DELETED)
    // This handles both new items with status field and old items without it
    const itemList = await db
      .collection("item")
      .find({ status: { $ne: "DELETED" } })
      .toArray();

    await writeAuditLog(db, user, "LIST_ITEM", { count: itemList.length });

    return successResponse({ itemList }, 201);
  } catch (error) {
    printExceptionLog("GET Items", error);

    return errorResponse("GET Item Internal Error", 500);
  }
}

export async function POST(request) {
  const user = verifyJWT(request);

  if (!user) return errorResponse("Unauthorized Request", 401);

  try {
    const data = await request.json();

    const name = data.name;

    const category = data.category;

    const price = data.price;

    const amount = data.amount;

    const client = await getClientPromise();

    const db = client.db(process.env.DB_NAME);

    const newItem = {
      name: name,

      category: category,

      price: price,

      amount: amount,

      status: "ACTIVE",
    };

    const insertResult = await db.collection("item").insertOne(newItem);

    await writeAuditLog(db, user, "CREATE_ITEM", {
      itemId: insertResult.insertedId,
      item: newItem,
    });

    return successResponse(
      {
        id: insertResult.insertedId,
      },

      201,
    );
  } catch (error) {
    printExceptionLog("POST Items", error);

    return errorResponse("POST Item Internal Error", 500);
  }
}
