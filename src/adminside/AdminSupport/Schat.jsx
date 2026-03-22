/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import { MdClose } from "react-icons/md";
import { TiArrowMinimise } from "react-icons/ti";
import { base_url,chat_url } from "../../config/config";
const Schat = ({
  supportId,
  bId,
  bName,
  onClose,
  isVisible,
  onToggle,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch chat history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${base_url}/schat/${supportId}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching support chat:", err);
      }
    };

    if (supportId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 1000);
      return () => clearInterval(interval);
    }
  }, [supportId]);

  useEffect(() => {
    const ws = new WebSocket(`${chat_url}`);
    setSocket(ws);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.supportId === supportId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => ws.close();
  }, [supportId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const message = {
      supportId,
      bId,
      bName,
      sender: "manager",
      text: inputValue,
      time: new Date().toISOString(),
    };

    setIsSending(true);
    try {
      await fetch(`${base_url}/addschat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      socket?.send(JSON.stringify(message));
      setMessages((prev) => [...prev, message]);
      setInputValue("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col mx-2 border border-blue-300 bg-white rounded-t-lg shadow-lg">
      <div className="flex items-center justify-between bg-blue-100 p-2 rounded-t-lg">
        <p className="font-semibold text-sm">{bName || "Client Chat"}</p>
        <div className="flex gap-2">
          <TiArrowMinimise
            className="h-5 w-5 text-gray-600 hover:text-blue-500 cursor-pointer"
            onClick={onToggle}
          />
          <MdClose
            className="h-5 w-5 text-gray-600 hover:text-red-500 cursor-pointer"
            onClick={onClose}
          />
        </div>
      </div>

      {isVisible && (
        <>
          <div className="h-[400px] overflow-y-auto p-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex mb-2 ${
                  msg.sender === "manager" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-2 rounded-xl max-w-xs ${
                    msg.sender === "manager"
                      ? "bg-blue-200 text-right"
                      : "bg-gray-200 text-left"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-[10px] text-gray-600">
                    {new Date(msg.time).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          <div className="flex border-t">
            <input
              type="text"
              className="flex-grow p-2 outline-none text-sm"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 text-sm rounded-r"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Schat;
