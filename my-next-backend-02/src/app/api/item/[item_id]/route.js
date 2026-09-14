import { getClientPromise } from "@/lib/mongodb";

import { verifyJWT } from "@/lib/auth";

import { writeAuditLog } from "@/lib/audit";

import corsHeaders from "@/lib/cors";

import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";

import { ObjectId } from "mongodb";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request, { params }) {
  const user = verifyJWT(request);

  if (!user) return errorResponse("Unauthorized Request", 401);

  const { item_id } = await params;

  try {
    const client = await getClientPromise();

    const db = client.db(process.env.DB_NAME);

    // Only fetch items that are not deleted
    const item = await db

      .collection("item")

      .findOne({ _id: new ObjectId(item_id), status: { $ne: "DELETED" } });

    await writeAuditLog(db, user, "GET_ITEM", {
      itemId: item_id,
      found: !!item,
    });

    if (item) {
      return successResponse(
        {
          item,
        },

        201,
      );
    } else return errorResponse("Item not found", 404);
  } catch (error) {
    printExceptionLog("GET Item Exception", error);

    return errorResponse("GET Item Internal Error", 500);
  }
}

export async function DELETE(request, { params }) {
  const user = verifyJWT(request);

  if (!user) return errorResponse("Unauthorized Request", 401);

  const { item_id } = await params;

  console.log("DELETE request for item_id:", item_id);

  try {
    const client = await getClientPromise();

    const db = client.db(process.env.DB_NAME);

    // Soft delete: update status to DELETED instead of removing the document
    const deleteResult = await db

      .collection("item")

      .updateOne(
        { _id: new ObjectId(item_id) },
        { $set: { status: "DELETED" } },
      );

    console.log("Delete result:", deleteResult);

    await writeAuditLog(db, user, "DELETE_ITEM", {
      itemId: item_id,
      modifiedCount: deleteResult.modifiedCount,
    });

    return successResponse({ message: "Delete Success" }, 201);
  } catch (error) {
    printExceptionLog("DELETE Item Exception", error);

    return errorResponse("DELETE Item Internal Error", 500);
  }
}

export async function PUT(request, { params }) {
  const user = verifyJWT(request);

  if (!user) return errorResponse("Unauthorized Request", 401);

  const { item_id } = await params;

  console.log("==>itemd id: ", item_id);

  try {
    const data = await request.json();

    const client = await getClientPromise();

    const db = client.db(process.env.DB_NAME);

    const storedItem = await db

      .collection("item")

      .findOne({ _id: new ObjectId(item_id), status: { $ne: "DELETED" } });

    if (storedItem) {
      const before = { ...storedItem };

      storedItem.name = data.name;

      storedItem.price = data.price;

      storedItem.amount = data.amount;

      storedItem.category = data.category;

      const updatedResult = await db

        .collection("item")

        .updateOne({ _id: new ObjectId(item_id) }, { $set: storedItem });

      console.log("==>update result: ", updatedResult);

      const updateOk = Number(updatedResult.modifiedCount) > 0;

      await writeAuditLog(db, user, "UPDATE_ITEM", {
        itemId: item_id,
        before: before,
        after: storedItem,
        success: updateOk,
      });

      if (updateOk)
        return successResponse({ message: "Item update success" }, 201);
      else return errorResponse({ message: "Item update failed" }, 400);
    } else {
      return errorResponse({ message: "Item not found" }, 400);
    }
  } catch (error) {
    printExceptionLog("PUT Item Exception", error);

    return errorResponse("PUT Item Internal Error", 500);
  }
}
