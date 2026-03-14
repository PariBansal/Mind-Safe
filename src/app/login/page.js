"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      localStorage.setItem("token", data.token);

      // Decode token
      const payload = JSON.parse(
        atob(data.token.split(".")[1])
      );

      if (payload.role === "intern") {
        router.push("/intern");
      } else {
        router.push("/dashboard");
      }


    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white/5 p-10 rounded-2xl border border-white/10 w-full max-w-md backdrop-blur">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Welcome Back
        </h2>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 bg-black/50 rounded-lg border border-white/20"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 bg-black/50 rounded-lg border border-white/20"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}
