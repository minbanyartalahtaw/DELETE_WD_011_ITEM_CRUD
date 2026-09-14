//src/app/api/user/route.js

import { getClientPromise } from "@/lib/mongodb";

import { isAdmin, verifyJWT } from "@/lib/auth";

import corsHeaders from "@/lib/cors";

import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// List all users (admin only). Password hash is never returned.
export async function GET(request) {
  const user = verifyJWT(request);

  if (!user) return errorResponse("Unauthorized Request", 401);

  if (!isAdmin(user)) return errorResponse("Admin only", 403);

  try {
    const client = await getClientPromise();

    const db = client.db(process.env.DB_NAME);

    const userList = await db
      .collection("user")
      .find({}, { projection: { password: 0 } })
      .toArray();

    return successResponse({ userList }, 200);
  } catch (error) {
    printExceptionLog("GET Users", error);

    return errorResponse("GET User Internal Error", 500);
  }
}
