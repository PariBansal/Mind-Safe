"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AvatarPage() {
  const router = useRouter();

  const [avatar, setAvatar] = useState({
    skin: "#f2c7a5",
    hair: "Short",
    hairColor: "#000000",
    outfit: "Casual",
    accessory: "None"
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      loadAvatar(token);
    }
  }, []);

  const loadAvatar = async (token) => {
    const res = await fetch("http://localhost:5000/api/avatar", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (res.ok && data.avatar) {
      setAvatar(data.avatar);
    }
  };

  const saveAvatar = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch("http://localhost:5000/api/avatar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(avatar)
    });

    alert("Avatar saved successfully!");
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">My Avatar</h1>

      <div className="grid md:grid-cols-2 gap-10">

        {/* Avatar Preview */}
        <div className="bg-white/5 p-10 rounded-2xl border border-white/10 flex justify-center items-center">
          <AvatarPreview avatar={avatar} />
        </div>

        {/* Customization Panel */}
        <div className="space-y-6">

          <Section title="Skin Tone">
            {["#f2c7a5", "#e0a899", "#c68642", "#8d5524"].map(color => (
              <button
                key={color}
                onClick={() => setAvatar({ ...avatar, skin: color })}
                className="w-10 h-10 rounded-full border"
                style={{ backgroundColor: color }}
              />
            ))}
          </Section>

          <Section title="Hairstyle">
            {["Short", "Long", "Curly", "Bald"].map(style => (
              <Option
                key={style}
                selected={avatar.hair === style}
                onClick={() => setAvatar({ ...avatar, hair: style })}
                label={style}
              />
            ))}
          </Section>

          <Section title="Hair Color">
            {["#000000", "#6b4226", "#c68642", "#ffffff"].map(color => (
              <button
                key={color}
                onClick={() => setAvatar({ ...avatar, hairColor: color })}
                className="w-10 h-10 rounded-full border"
                style={{ backgroundColor: color }}
              />
            ))}
          </Section>

          <Section title="Outfit">
            {["Casual", "Formal", "Sporty"].map(outfit => (
              <Option
                key={outfit}
                selected={avatar.outfit === outfit}
                onClick={() => setAvatar({ ...avatar, outfit })}
                label={outfit}
              />
            ))}
          </Section>

          <Section title="Accessory">
            {["None", "Glasses", "Hat"].map(accessory => (
              <Option
                key={accessory}
                selected={avatar.accessory === accessory}
                onClick={() => setAvatar({ ...avatar, accessory })}
                label={accessory}
              />
            ))}
          </Section>

          <button
            onClick={saveAvatar}
            className="mt-6 px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition"
          >
            Save Avatar
          </button>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="mb-2 font-semibold">{title}</h2>
      <div className="flex gap-3 flex-wrap">{children}</div>
    </div>
  );
}

function Option({ selected, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg ${
        selected ? "bg-purple-600" : "bg-purple-900/40"
      }`}
    >
      {label}
    </button>
  );
}

function AvatarPreview({ avatar }) {
  return (
    <div className="relative w-48 h-64 flex flex-col items-center">

      {/* Head */}
      <div
        className="w-24 h-24 rounded-full"
        style={{ backgroundColor: avatar.skin }}
      />

      {/* Hair */}
      {avatar.hair !== "Bald" && (
        <div
          className={`absolute top-0 w-28 h-14 rounded-t-full`}
          style={{ backgroundColor: avatar.hairColor }}
        />
      )}

      {/* Outfit */}
      <div
        className={`w-32 h-28 mt-2 rounded-lg ${
          avatar.outfit === "Casual"
            ? "bg-blue-500"
            : avatar.outfit === "Formal"
            ? "bg-gray-700"
            : "bg-green-600"
        }`}
      />

      {/* Accessory */}
      {avatar.accessory === "Glasses" && (
        <div className="absolute top-10 w-16 h-6 border-2 border-black rounded-full" />
      )}
      {avatar.accessory === "Hat" && (
        <div className="absolute top-0 w-32 h-6 bg-black rounded-full" />
      )}

    </div>
  );
}
