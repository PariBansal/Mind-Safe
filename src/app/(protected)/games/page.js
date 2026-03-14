"use client";

import { useState, useEffect } from "react";

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState(null);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Relax & Play</h1>

      {!activeGame && (
        <div className="grid md:grid-cols-2 gap-6">

          {/* Relax Game */}
          <div
            onClick={() => setActiveGame("breathing")}
            className="p-6 bg-purple-900/30 rounded-2xl cursor-pointer hover:bg-purple-800 transition"
          >
            <h2 className="text-xl font-semibold mb-2">Breathing Calm</h2>
            <p>Slow breathing exercise for relaxation.</p>
            <span className="text-green-400 text-sm">Free</span>
          </div>

          {/* Play Game */}
          <div
            onClick={() => setActiveGame("tap")}
            className="p-6 bg-purple-900/30 rounded-2xl cursor-pointer hover:bg-purple-800 transition"
          >
            <h2 className="text-xl font-semibold mb-2">Focus Tap</h2>
            <p>Test your focus and speed.</p>
            <span className="text-yellow-400 text-sm">Fun Game</span>
          </div>

        </div>
      )}

      {activeGame === "breathing" && <BreathingGame onBack={() => setActiveGame(null)} />}
      {activeGame === "tap" && <TapGame onBack={() => setActiveGame(null)} />}
    </div>
  );
}

/* ================= BREATHING GAME ================= */

function BreathingGame({ onBack }) {
  const [phase, setPhase] = useState("Inhale");

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev =>
        prev === "Inhale"
          ? "Hold"
          : prev === "Hold"
          ? "Exhale"
          : "Inhale"
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-700 rounded-lg"
      >
        Back
      </button>

      <h2 className="text-2xl mb-6">Breathing Exercise</h2>

      <div className="flex justify-center items-center">
        <div
          className={`rounded-full transition-all duration-4000 ease-in-out ${
            phase === "Inhale"
              ? "w-64 h-64 bg-purple-600"
              : phase === "Hold"
              ? "w-64 h-64 bg-purple-800"
              : "w-40 h-40 bg-purple-500"
          }`}
        />
      </div>

      <h3 className="mt-6 text-xl">{phase}</h3>
      <p className="text-gray-400">Follow the circle and breathe slowly.</p>
    </div>
  );
}

/* ================= TAP GAME ================= */

function TapGame({ onBack }) {
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({ top: 100, left: 100 });

  const moveTarget = () => {
    const top = Math.random() * 300;
    const left = Math.random() * 500;
    setPosition({ top, left });
  };

  const handleClick = () => {
    setScore(score + 1);
    moveTarget();
  };

  return (
    <div className="relative h-[500px]">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-700 rounded-lg"
      >
        Back
      </button>

      <h2 className="text-2xl mb-4">Focus Tap</h2>
      <p className="mb-6">Score: {score}</p>

      <div
        onClick={handleClick}
        style={{ top: position.top, left: position.left }}
        className="absolute w-12 h-12 bg-pink-500 rounded-full cursor-pointer transition"
      />
    </div>
  );
}
