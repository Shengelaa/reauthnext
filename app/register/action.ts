"use server";

import db from "@/db/drizzle";
import { z } from "zod";
import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
import { hash } from "bcryptjs";
import { users } from "@/db/userSchema";

// create type

type RegisterUserInput = {
  email: string;
  password: string;
  passwordConfirm: string;
};

export const registerUser = async ({
  email,
  password,
  passwordConfirm,
}: RegisterUserInput) => {
  try {
    const newUserSchema = z
      .object({
        email: z.string().email(),
      })
      .and(passwordMatchSchema);

    const newUserValidation = newUserSchema.safeParse({
      email,
      password,
      passwordConfirm,
    });

    if (!newUserValidation.success) {
      return {
        error: true,
        message:
          newUserValidation.error.issues[0]?.message ?? "An error occurred",
      };
    }
  
    const hashedPassword = await hash(password, 10);

    await db.insert(users).values({
      email,
      password: hashedPassword,
    });
  } catch (e: any) {
    if (e.code === "23505") {
      return {
        error: true,
        message: "An account is already registered with that email address.",
      };
    }

    return {
      error: true,
      message: "An error occurred.",
    };
  }
};
