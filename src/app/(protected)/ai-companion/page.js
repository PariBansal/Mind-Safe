"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AICompanion() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const dangerWords = ["suicide", "kill myself", "die", "end my life", "self harm"];

  // Protect route
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      loadChatHistory(token);
    }
  }, []);

  // Load chat history from backend
  const loadChatHistory = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(data.messages.length ? data.messages : [
          { role: "ai", content: "Hi, I'm here for you. How are you feeling today?" }
        ]);
      }
    } catch (error) {
      console.log("Error loading chat");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    const lowerInput = input.toLowerCase();
    const isDanger = dangerWords.some(word => lowerInput.includes(word));

    let aiResponse;

    if (isDanger) {
      aiResponse = {
        role: "ai",
        content:
          "I'm really sorry you're feeling this way. Please contact emergency services or a crisis hotline immediately.\n\n🇺🇸 988 Suicide & Crisis Lifeline\n🌍 Text HOME to 741741"
      };
    } else if (lowerInput.includes("sad")) {
      aiResponse = {
        role: "ai",
        content: "I'm sorry you're feeling sad. Would you like to share what's bothering you?"
      };
    } else if (lowerInput.includes("happy")) {
      aiResponse = {
        role: "ai",
        content: "That's wonderful to hear. What made your day better?"
      };
    } else {
      aiResponse = {
        role: "ai",
        content: "Tell me more about how you're feeling."
      };
    }

    const finalMessages = [...updatedMessages, aiResponse];
    setTimeout(() => {
      setMessages(finalMessages);
    }, 600);

    // Save updated chat to backend
    await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userMessage)
    });

    // Save AI message
    await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(aiResponse)
    });

    setInput("");
  };

  return (
    <div className="flex flex-col h-[85vh]">
      <h1 className="text-4xl font-bold mb-6">AI Companion</h1>

      <div className="flex-1 overflow-y-auto bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-xl p-4 rounded-2xl ${
              msg.role === "user"
                ? "ml-auto bg-purple-700"
                : "bg-purple-900/40"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex mt-4 gap-4">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 p-3 bg-black/50 rounded-lg border border-white/20"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
