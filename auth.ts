import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import db from "./db/drizzle";

import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { users } from "./db/userSchema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        // const results, const user = reustls[0]
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string));

        if (!user) {
          throw new Error("No user found");
        } else {
          const passwordCorrect = await compare(
            credentials.password as string,
            user.password as string
          );

          if (!passwordCorrect) {
            throw new Error("Password incorrect");
          }

          return {
            id: user.id.toString(),
            email: user.email,
          };
        }
      },
    }),
  ],
});
