"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export default function Insights() {
  const router = useRouter();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchMoods(token);
    }
  }, []);

  const fetchMoods = async (token) => {
    const res = await fetch("http://localhost:5000/api/mood", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (res.ok) {
      setHistory(data.moods);
    }
  };

  const totalEntries = history.length;

  const averageIntensity =
    history.length > 0
      ? (
          history.reduce((sum, entry) => sum + Number(entry.intensity), 0) /
          history.length
        ).toFixed(1)
      : 0;

  const moodCount = history.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const mostFrequentMood =
    Object.keys(moodCount).length > 0
      ? Object.keys(moodCount).reduce((a, b) =>
          moodCount[a] > moodCount[b] ? a : b
        )
      : "-";

  const intensityData = history.map((entry, index) => ({
    name: index + 1,
    intensity: entry.intensity
  }));

  const moodDistributionData = Object.keys(moodCount).map((key) => ({
    mood: key,
    count: moodCount[key]
  }));

  const getInsightMessage = () => {
    if (history.length === 0)
      return "Track your moods to see meaningful insights.";

    if (averageIntensity > 7)
      return "You've been experiencing high-intensity emotions lately. Consider relaxation exercises.";

    if (mostFrequentMood === "Sad")
      return "You've reported sadness frequently. Talking to someone may help.";

    if (mostFrequentMood === "Happy")
      return "You've been feeling happy often. Keep nurturing what makes you feel good.";

    return "You're building emotional awareness. Keep tracking daily.";
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Insights & Analytics</h1>

      <div className="grid md:grid-cols-3 gap-6 text-center mb-10">
        <Stat label="Total Mood Entries" value={totalEntries} />
        <Stat label="Average Intensity" value={`${averageIntensity}/10`} />
        <Stat label="Most Frequent Mood" value={mostFrequentMood} />
      </div>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-10">
        <h2 className="text-xl mb-4">Mood Intensity Trend</h2>

        {history.length === 0 ? (
          <p>No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={intensityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="intensity" stroke="#a855f7" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-10">
        <h2 className="text-xl mb-4">Mood Distribution</h2>

        {moodDistributionData.length === 0 ? (
          <p>No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moodDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mood" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#9333ea" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-purple-900/20 p-6 rounded-2xl border border-purple-500/30">
        <h2 className="text-xl mb-4">AI-Powered Insight</h2>
        <p>{getInsightMessage()}</p>
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
