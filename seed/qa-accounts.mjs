/**
 * Creates (or resets) the two QA accounts used for manual testing.
 * Prints the passwords once. Run: node --env-file .env seed/qa-accounts.mjs
 * Remove before launch: node --env-file .env seed/qa-accounts.mjs --delete
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const ACCOUNTS = [
  { email: "qa-usuario@weedhub.info", username: "qa_usuario", displayName: "QA Usuario", role: "user", anonymousHandle: "Tranquilo-Ajolote-0001" },
  { email: "qa-admin@weedhub.info", username: "qa_admin", displayName: "QA Admin", role: "admin", anonymousHandle: "Sobria-Ceiba-0002" },
];

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const users = mongoose.connection.db.collection("users");

if (process.argv.includes("--delete")) {
  const r = await users.deleteMany({ email: { $in: ACCOUNTS.map((a) => a.email) } });
  console.log(`Deleted ${r.deletedCount} QA accounts`);
} else {
  for (const a of ACCOUNTS) {
    const password = crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    await users.updateOne(
      { email: a.email },
      {
        $set: { passwordHash, role: a.role, username: a.username, displayName: a.displayName, updatedAt: now },
        $setOnInsert: {
          email: a.email,
          anonymousHandle: a.anonymousHandle,
          publishAsAnonymous: true,
          country: "MX",
          locale: "es",
          isQaAccount: true,
          createdAt: now,
        },
      },
      { upsert: true }
    );
    console.log(`${a.role.padEnd(5)}  ${a.email}  ${password}`);
  }
}
await mongoose.disconnect();
