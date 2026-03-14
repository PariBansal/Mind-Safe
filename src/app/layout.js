import AuthGuard from "@/components/AuthGuard";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "MindSafe",
  description: "A safe world where your mind can breathe",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="flex min-h-screen">

          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 p-10 bg-gradient-to-b from-black via-purple-950/40 to-black overflow-y-auto">
            <AuthGuard>
              {children}
            </AuthGuard>
          </main>

        </div>
      </body>
    </html>
  );
}
