"use server";

import { auth } from "@/auth";
import db from "@/db/drizzle";
import { users } from "@/db/userSchema";
import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
import { passwordSchema } from "@/validation/passwordSchema";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const changePassword = async ({
  currentPassword,
  password,
  passwordConfirm,
}: {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
}) => {
  // Next auth
  const session = await auth();

  // 1. Check if user is logged in
  if (!session?.user?.id) {
    return {
      error: true,
      message: "You must be logged in to change your password.",
    };
  }

  // 2. check Validation
  const formSchema = z
    .object({
      currentPassword: passwordSchema,
    })
    .and(passwordMatchSchema);

  const passwordValidation = formSchema.safeParse({
    currentPassword,
    password,
    passwordConfirm,
  });

  // 3. Check if password validation failed
  if (passwordValidation?.error) {
    return {
      error: true,
      message:
        passwordValidation?.error.issues?.[0]?.message ?? "An error occurred",
    };
  }

  // 4. Check if user exists if no : return error

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)));

  if (!user) {
    return {
      error: true,
      message: "User not found",
    };
  }

  // 5. Check if current password is correct

  const passwordMatch = await compare(currentPassword, user.password!);

  if (!passwordMatch) {
    return {
      error: true,
      message: "Current password is incorrect",
    };
  }

  // 6. hashed password

  const hashedPassword = await hash(password, 10);

  // 7. Update password

  await db
    .update(users)
    .set({
      password: hashedPassword,
    })
    .where(eq(users.id, parseInt(session.user.id)));
};
