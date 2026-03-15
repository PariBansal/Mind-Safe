"use client";

import { useEffect, useState } from "react";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setEmail(payload.email);
      setRole(payload.role);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      
      <div className="w-full max-w-xl bg-gray-900 rounded-2xl shadow-xl p-8">

        {/* Title */}
        <h1 className="text-3xl font-bold mb-8 text-center">
          Your Profile
        </h1>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold">
            {email ? email[0].toUpperCase() : "U"}
          </div>

          <p className="mt-3 text-gray-400 text-sm">
            Profile Avatar
          </p>
        </div>

        {/* User Info */}
        <div className="space-y-4">

          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Email</p>
            <p className="text-lg">{email || "Not logged in"}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Role</p>
            <p className="text-lg capitalize">{role}</p>
          </div>

        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-3">

          <button className="w-full bg-blue-600 hover:bg-blue-500 transition p-3 rounded-lg font-medium">
            Change Password
          </button>

          <button className="w-full bg-gray-700 hover:bg-gray-600 transition p-3 rounded-lg font-medium">
            Download My Data
          </button>

          <button className="w-full bg-red-600 hover:bg-red-500 transition p-3 rounded-lg font-medium">
            Delete Account
          </button>

        </div>

      </div>
    </div>
  );
}