"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function AnonymousChat() {
  const [socket, setSocket] = useState(null);
  const [matched, setMatched] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.emit("joinQueue");

    newSocket.on("matched", () => {
      setMatched(true);
    });

    newSocket.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, { text: msg, sender: "partner" }]);
      setTyping(false);
    });

    newSocket.on("partnerTyping", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    });

    newSocket.on("partnerDisconnected", () => {
      setMatched(false);
      setMessages([]);
    });

    return () => newSocket.disconnect();
  }, []);

  const sendMessage = () => {
    if (!input || !socket) return;

    socket.emit("sendMessage", input);
    setMessages(prev => [...prev, { text: input, sender: "me" }]);
    setInput("");
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit("typing");
    }
  };

  const findNewPartner = () => {
    if (socket) {
      socket.emit("leaveChat");
      setMatched(false);
      setMessages([]);
      socket.emit("joinQueue");
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Anonymous Chat</h1>

      {!matched && (
        <div className="p-6 bg-white/5 rounded-xl">
          Waiting to match with someone...
        </div>
      )}

      {matched && (
        <div className="space-y-4">
          <div className="h-96 overflow-y-auto bg-white/5 p-4 rounded-xl">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-2 ${
                  msg.sender === "me"
                    ? "text-right text-purple-400"
                    : "text-left text-white"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {typing && (
              <div className="text-sm text-gray-400">
                Anonymous user is typing...
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleTyping}
              className="flex-1 px-4 py-2 bg-black border border-white/10 rounded-lg"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-500"
            >
              Send
            </button>
          </div>

          <button
            onClick={findNewPartner}
            className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500"
          >
            Find New Partner
          </button>
        </div>
      )}
    </div>
  );
}
