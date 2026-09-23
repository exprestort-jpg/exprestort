import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

/** Ambiguous glyphs (0/O, 1/l/I) left out so the password can be read aloud. */
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword(length = 20) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

async function main() {
  const [emailArg, nameArg] = process.argv.slice(2);
  const force = process.argv.includes("--force");

  const email = (emailArg ?? "").trim().toLowerCase();
  const name = nameArg ?? "";

  if (!email || !name) {
    console.error('Usage: npm run seed:admin -- <email> "<Name>" [--force]');
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing && !force) {
    console.error(
      `${email} already exists. Re-run with --force to reset the password.`,
    );
    process.exit(1);
  }

  const password = generatePassword();
  const passwordHash = await hashPassword(password);

  if (existing) {
    await db
      .update(adminUsers)
      .set({ passwordHash, name })
      .where(eq(adminUsers.id, existing.id));
  } else {
    await db.insert(adminUsers).values({ email, name, passwordHash });
  }

  console.log("");
  console.log(existing ? "Password reset." : "Admin created.");
  console.log(`  email:    ${email}`);
  console.log(`  name:     ${name}`);
  console.log(`  password: ${password}`);
  console.log("");
  console.log(
    "Shown once. Save it in a password manager now — only the hash is stored.",
  );
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
