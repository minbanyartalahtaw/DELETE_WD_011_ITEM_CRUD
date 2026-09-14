//src/app/api/user/[user_id]/password/route.js

import { getClientPromise } from "@/lib/mongodb";

import { isAdmin, verifyJWT } from "@/lib/auth";

import corsHeaders from "@/lib/cors";

import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";

import bcrypt from "bcrypt";

import { ObjectId } from "mongodb";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Change a user's password (admin only).
export async function PUT(request, { params }) {
  const user = verifyJWT(request);

  if (!user) return errorResponse("Unauthorized Request", 401);

  if (!isAdmin(user)) return errorResponse("Admin only", 403);

  const { user_id } = await params;

  try {
    const data = await request.json();

    const newPassword = data.password;

    if (!newPassword || newPassword.length < 4) {
      return errorResponse("Password must be at least 4 characters", 400);
    }

    const client = await getClientPromise();

    const db = client.db(process.env.DB_NAME);

    const hashed = await bcrypt.hash(newPassword, 10);

    const updateResult = await db
      .collection("user")
      .updateOne({ _id: new ObjectId(user_id) }, { $set: { password: hashed } });

    if (updateResult.matchedCount === 0) {
      return errorResponse("User not found", 404);
    }

    return successResponse({ message: "Password changed" }, 200);
  } catch (error) {
    printExceptionLog("PUT User Password", error);

    return errorResponse("Change Password Internal Error", 500);
  }
}
