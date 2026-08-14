// app/api/auth/authOptions.ts
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connect from "@/utils/db";
import { AuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";

// Type returned to the session/token
interface UserType {
  id: string;
  email: string;
  name: string;
  role: string;
  fcmToken:string;

}

// Type fetched from the database
interface DBUser {
  _id: string;
  email: string;
  name: string;
  password: string;
  role: string;
   fcmToken:string;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<UserType | null> {
        if (!credentials?.email || !credentials?.password) return null;
        await connect();

        const user = await User.findOne({ email: credentials.email }).lean<DBUser | null>();
        if (!user) return null;

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          fcmToken: user.fcmToken , // أضف هذا
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 20736000,
  },
  callbacks: {
  async jwt({ token, user }: any) {
    if (user) {
      token.id = user.id;
      token.name = user.name;
      token.role = user.role;
      token.email = user.email;
      token.fcmToken = user.fcmToken || null;
    }
    return token;
  },
  async session({ session, token }: any) {
    if (token && session.user) {
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.role = token.role as string;
      session.user.email = token.email as string;
      session.user.fcmToken = token.fcmToken || null;  // <-- هنا
    }
    return session;
  },
},

};
