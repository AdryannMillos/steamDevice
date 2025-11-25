import React, { useState, useRef, useEffect } from "react";
import { api } from "../services/api";
import "./ChatWindow.css";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const historyToSend = [...messages, userMsg];

    try {
      const res = await api.post("/chat", {
        message: userMsg.content,
        history: historyToSend,
      });

      const botMsg = {
        role: "assistant",
        content: res.data.response,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      let errMsg;

      if (error.response?.status === 429) {
        errMsg = {
          role: "assistant",
          content:
            "⚠️ Hey man, take a break! No one really wants to know more than 5 questions about the topic per minute!",
        };
      } else {
        errMsg = {
          role: "assistant",
          content: "⚠️ Error contacting server.",
        };
      }

      setMessages((prev) => [...prev, errMsg]);
      console.log(error);
    }

    setLoading(false);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.role === "user" ? "user" : "bot"}`}
          >
            {msg.content}
          </div>
        ))}

        {loading && <div className="loading">typing...</div>}

        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <textarea
          rows="2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask something about the new Steam gaming device..."
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
