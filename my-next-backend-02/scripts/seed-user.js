// Usage: node scripts/seed-user.js <email> <username> <password>
// Creates a user in the "user" collection with a bcrypt-hashed password.
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const [email, username, password] = process.argv.slice(2);
if (!email || !username || !password) {
  console.log("Usage: node scripts/seed-user.js <email> <username> <password>");
  process.exit(1);
}

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const hashed = await bcrypt.hash(password, 10);
  const result = await db
    .collection("user")
    .updateOne(
      { email },
      { $set: { email, username, password: hashed } },
      { upsert: true },
    );
  console.log("user saved:", email, result.upsertedId ? "(created)" : "(updated)");
  await client.close();
})();
