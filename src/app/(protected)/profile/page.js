"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [anonymousName, setAnonymousName] = useState("Anonymous");
  const [anonymousMode, setAnonymousMode] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchProfile(token);
    }
  }, []);

  const fetchProfile = async (token) => {
    const res = await fetch("http://localhost:5000/api/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      setEmail(data.email);
      setAnonymousName(data.profile.anonymousName);
      setAnonymousMode(data.profile.anonymousMode);
    }
  };

  const saveProfile = async () => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ anonymousName, anonymousMode })
    });

    alert("Profile updated successfully!");
  };

  const deleteAccount = async () => {
    const token = localStorage.getItem("token");

    const confirmDelete = confirm(
      "Are you sure you want to permanently delete your account?"
    );

    if (!confirmDelete) return;

    await fetch("http://localhost:5000/api/profile", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Profile & Privacy</h1>

      {/* Profile Section */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

        <div className="mb-4">
          <label className="block mb-2">Anonymous Display Name</label>
          <input
            value={anonymousName}
            onChange={(e) => setAnonymousName(e.target.value)}
            className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg"
          />
          <p className="text-sm text-gray-400 mt-1">
            This name is visible in anonymous chats.
          </p>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Email (Private)</label>
          <input
            value={email}
            disabled
            className="w-full px-4 py-2 bg-gray-800 border border-white/20 rounded-lg"
          />
          <p className="text-sm text-gray-400 mt-1">
            Your email is never shared.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            checked={anonymousMode}
            onChange={() => setAnonymousMode(!anonymousMode)}
          />
          <span>Enable Anonymous Mode</span>
        </div>

        <button
          onClick={saveProfile}
          className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-500"
        >
          Save Changes
        </button>
      </div>

      {/* Privacy Commitment */}
      <div className="bg-purple-900/20 p-6 rounded-2xl border border-purple-500/30 mb-8">
        <h2 className="text-xl font-semibold mb-4">Our Privacy Commitment</h2>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>🔒 Your data is never sold to third parties.</li>
          <li>🛡️ Messages are encrypted.</li>
          <li>👤 Anonymous by default.</li>
          <li>🗑️ You can delete your account anytime.</li>
        </ul>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 p-6 rounded-2xl border border-red-500/30">
        <h2 className="text-xl font-semibold mb-4 text-red-400">
          Danger Zone
        </h2>

        <button
          onClick={deleteAccount}
          className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500"
        >
          Delete My Account
        </button>

        <p className="text-sm text-gray-400 mt-3">
          This action cannot be undone.
        </p>
      </div>
    </div>
  );
}
