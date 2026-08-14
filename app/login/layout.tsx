// app/login/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { redirect } from "next/navigation";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/protected/employee");
  }

  return (
    <html lang="en" className="dark">
      <body className="overflow-hidden">{children}</body>
    </html>
  );
}
