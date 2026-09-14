//src/lib/audit.js

// Records every item action into the "audit_log" collection.
export async function writeAuditLog(db, user, action, detail = {}) {
  try {
    await db.collection("audit_log").insertOne({
      action: action,
      userId: user.id,
      username: user.username,
      email: user.email,
      detail: detail,
      timestamp: new Date(),
    });
  } catch (error) {
    console.log("==>Audit Log Exception", error);
  }
}
