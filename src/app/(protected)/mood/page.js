"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MoodTracker() {
  const router = useRouter();
  const [mood, setMood] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);

  const moodOptions = ["Happy", "Sad", "Anxious", "Frustrated", "Calm", "Tired"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchMoods(token);
    }
  }, []);

  const fetchMoods = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/mood", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setHistory(data.moods);
      }
    } catch (error) {
      console.log("Error fetching moods");
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token || !mood) return;

    await fetch("http://localhost:5000/api/mood", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ mood, intensity, note })
    });

    setMood("");
    setNote("");
    fetchMoods(token);
  };

  const totalEntries = history.length;
  const averageIntensity =
    history.length > 0
      ? (
          history.reduce((sum, entry) => sum + Number(entry.intensity), 0) /
          history.length
        ).toFixed(1)
      : 0;

  const latestMood = history.length > 0 ? history[history.length - 1].mood : "-";

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Mood Tracker</h1>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8">
        <h2 className="text-xl mb-4">How are you feeling?</h2>

        <div className="flex flex-wrap gap-3 mb-4">
          {moodOptions.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-4 py-2 rounded-lg transition ${
                mood === m
                  ? "bg-purple-600"
                  : "bg-purple-900/40 hover:bg-purple-800"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label>Intensity: {intensity}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full"
          />
        </div>

        <textarea
          placeholder="Write about your feelings..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-3 bg-black/50 rounded-lg border border-white/20 mb-4"
        />

        <button
          onClick={handleSave}
          className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition"
        >
          Save Mood Entry
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 text-center mb-8">
        <Stat label="Total Mood Entries" value={totalEntries} />
        <Stat label="Average Intensity" value={`${averageIntensity}/10`} />
        <Stat label="Latest Mood" value={latestMood} />
      </div>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <h2 className="text-xl mb-4">Recent Entries</h2>
        {history.length === 0 ? (
          <p>No mood entries yet.</p>
        ) : (
          history.slice(-5).reverse().map((entry, index) => (
            <div
              key={index}
              className="mb-4 p-4 bg-purple-900/30 rounded-lg"
            >
              <p className="font-semibold">{entry.mood}</p>
              <p>Intensity: {entry.intensity}/10</p>
              <p className="text-sm text-gray-300">{entry.note}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-6 bg-purple-900/20 rounded-2xl border border-purple-500/30">
      <h2 className="text-3xl font-bold">{value}</h2>
      <p className="text-gray-400 mt-2">{label}</p>
    </div>
  );
}
