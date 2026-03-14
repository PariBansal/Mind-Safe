"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function InternDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const decoded = JSON.parse(atob(token.split(".")[1]));
    if (decoded.role !== "intern") {
      router.push("/dashboard");
      return;
    }

    fetchUsers(token);
  }, []);

  const fetchUsers = async (token) => {
    const res = await fetch("http://localhost:5000/api/intern/users", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (res.ok) {
      setUsers(data.users.filter(u => u.role === "user"));
    }
  };

  const fetchUserData = async (id) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/intern/user/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (res.ok) {
      setSelectedUser(id);
      setUserData(data);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Intern Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6">

        {/* User List */}
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <h2 className="mb-4 font-semibold">Users</h2>
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => fetchUserData(user.id)}
              className="p-3 mb-2 bg-purple-900/30 rounded-lg cursor-pointer hover:bg-purple-800"
            >
              {user.email}
            </div>
          ))}
        </div>

        {/* User Details */}
        <div className="md:col-span-2 bg-white/5 p-6 rounded-2xl border border-white/10">
          {!userData && (
            <p>Select a user to view their data.</p>
          )}

          {userData && (
            <div className="space-y-6">

              <div>
                <h3 className="text-xl font-semibold mb-2">Mood History</h3>
                {userData.moods.length === 0 ? (
                  <p>No moods logged.</p>
                ) : (
                  userData.moods.map((mood, index) => (
                    <div
                      key={index}
                      className="mb-2 p-3 bg-purple-900/30 rounded-lg"
                    >
                      <p><strong>{mood.mood}</strong> - {mood.intensity}/10</p>
                      <p className="text-sm text-gray-300">{mood.note}</p>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">AI Chat History</h3>
                {userData.chats.length === 0 ? (
                  <p>No chat history.</p>
                ) : (
                  userData.chats.map((chat, index) => (
                    <div
                      key={index}
                      className="mb-2 p-3 bg-purple-900/30 rounded-lg"
                    >
                      <p>
                        <strong>{chat.role}:</strong> {chat.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Avatar Data</h3>
                {userData.avatar ? (
                  <pre className="text-sm bg-black/50 p-3 rounded-lg">
                    {JSON.stringify(userData.avatar, null, 2)}
                  </pre>
                ) : (
                  <p>No avatar saved.</p>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
