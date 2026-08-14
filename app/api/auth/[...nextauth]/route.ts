// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "../authOptions"; // ملاحظة: المسار نسبي من هذا الملف

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
