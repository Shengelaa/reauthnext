"use server";

import { auth } from "@/auth";
import db from "@/db/drizzle";
import { users } from "@/db/userSchema";
import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";

export const get2faSecret = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  const [user] = await db
    .select({
      twoFactorSecret: users.twoFactorSecret,
    })
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)));

  if (!user) {
    return {
      error: true,
      message: "User not found",
    };
  }

  let twoFactorSecret = user.twoFactorSecret;

  if (!twoFactorSecret) {
    // Generate new TOTP secret
    const generatedSecret = new OTPAuth.Secret({ size: 10 });
    twoFactorSecret = generatedSecret.base32;

    await db
      .update(users)
      .set({
        twoFactorSecret,
      })
      .where(eq(users.id, parseInt(session.user.id)));
  }

  // Create an otpauth:// URI for the QR code
  const totp = new OTPAuth.TOTP({
    issuer: "WebDevEducation",
    label: session.user.email ?? "User",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(twoFactorSecret),
  });

  const otpauthUrl = totp.toString(); // URI to display as QR code

  return {
    twoFactorSecret: otpauthUrl,
  };
};

export const activate2fa = async (token: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  const [user] = await db
    .select({
      twoFactorSecret: users.twoFactorSecret,
    })
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)));

  if (!user) {
    return {
      error: true,
      message: "User not found",
    };
  }

  if (user.twoFactorSecret) {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const tokenValid = totp.validate({ token });

    if (!tokenValid) {
      return {
        error: true,
        message: "Invalid PASSCODE",
      };
    }

    await db
      .update(users)
      .set({
        twoFactorActivated: true,
      })
      .where(eq(users.id, parseInt(session.user.id)));
  }
};
