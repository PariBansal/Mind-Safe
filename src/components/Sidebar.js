"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setRole(decoded.role);
      } catch (err) {
        console.error("Invalid token");
      }
    }
  }, []);

  const baseLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/ai-companion", label: "AI Companion" },
    { href: "/anonymous", label: "Anonymous Chat" },
    { href: "/avatar", label: "My Avatar" },
    { href: "/mood", label: "Mood Tracker" },
    { href: "/insights", label: "Insights" },
    { href: "/games", label: "Relax & Play" },
    { href: "/profile", label: "Profile & Privacy" },
  ];

  const internLink =
    role === "intern"
      ? { href: "/intern", label: "Intern Panel" }
      : null;

  const links = internLink ? [...baseLinks, internLink] : baseLinks;

  return (
    <aside className="w-64 bg-gradient-to-b from-purple-950 to-black p-6 hidden md:flex flex-col justify-between">

      {/* Top Section */}
      <div>
        <h1 className="text-2xl font-bold mb-8 text-purple-400">
          MindSafe
        </h1>

        <nav className="flex flex-col space-y-3 text-sm">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-purple-700 text-white"
                    : "hover:bg-purple-800/40"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Logout */}
      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        className="mt-10 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition text-sm"
      >
        Logout
      </button>

    </aside>
  );
}
