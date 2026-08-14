import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/authOptions";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Providers from "@/Providers";
import Footer from "@/components/Footer";


export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <div className="bg-background min-h-screen text-foreground shadow-lg transition-colors duration-300">
        {/*    <OneSignalProvider />
 */}      <Navbar />
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Providers>
              {children}
            </Providers>
          </SidebarInset>

        </SidebarProvider>
        <Footer />

      </div>
    </>
  );
}
