"use server";

import { auth } from "@/auth";
import db from "@/db/drizzle";
import { passwordResetTokens } from "@/db/passwordResetTokensSchema";
import { users } from "@/db/userSchema";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { mailer } from "@/lib/email";

export const passwordReset = async (emailAddress: string) => {
  const session = await auth();

  if (!!session?.user?.id) {
    return {
      error: true,
      message: "You are already logged in",
    };
  }

  const [user] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, emailAddress));

  if (!user) {
    return;
  }

  const passwordResetToken = randomBytes(32).toString("hex");
  console.log({ passwordResetToken });

  const tokenExpiry = new Date(Date.now() + 3600000);
  await db
    .insert(passwordResetTokens)
    .values({
      userId: user.id,
      token: passwordResetToken,
      tokenExpiry,
    })
    .onConflictDoUpdate({
      target: passwordResetTokens.userId,
      set: {
        token: passwordResetToken,
        tokenExpiry,
      },
    });

  const resetLink = `${process.env.SITE_BASE_URL}/update-password?token=${passwordResetToken}`;
  await mailer.sendMail({
    from: "test@resend.dev",
    subject: "Your password reset request",
    to: emailAddress,
    html: `Hey, ${emailAddress}! Your Password Reset Link: <a href='${resetLink}>${resetLink}</a> Will Expire In 1 Day.`,
  });
};
