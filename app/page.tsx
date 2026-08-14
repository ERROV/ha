import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
export const dynamic = "force-dynamic";
export default async function Home() {
  const session = await getServerSession(authOptions);

  // تحقق من وجود session و user قبل الوصول للخصائص
  if (!session || !session.user) {
    // المستخدم غير مسجل دخول → توجه لصفحة تسجيل الدخول
    redirect("/login");
  }

  
  else {
    redirect("/protected/home");
  }

  return null; // لا حاجة لعرض شيء هنا لأن التوجيه حصل بالفعل
}
