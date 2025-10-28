import { useEffect, useRef, useState } from "react";

export default function ChatBot() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! How can I help you today?" },
  ]);
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setListening(false);
      };

      recognition.onerror = () => setListening(false);
    }
  }, []);

  useEffect(() => {
    if (loading && recognitionRef.current) {
      recognitionRef.current.abort();
      setListening(false);
    }
  }, [loading]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleVoiceInput = () => {
    if (loading || listening || !recognitionRef.current) return;
    setListening(true);
    recognitionRef.current.start();
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;

    const userMsg = prompt;
    setLoading(true);
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setPrompt("");

    try {
      const res = await fetch("http://localhost:8090/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.ok ? data.reply : data.error || "Something went wrong",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text.trim());
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      setLoading(true);
      setMessages((prev) => [...prev, { sender: "user", text: file.name }]);

      try {
        const res = await fetch("http://localhost:8090/api/image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        const caption = res.ok ? data.result : null;

        if (!caption) {
          throw new Error(data.error || "No caption returned");
        }

        const chatRes = await fetch("http://localhost:8090/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: caption }),
        });

        const chatData = await chatRes.json();
        const finalReply =
          chatRes.ok ? chatData.reply : chatData.error || "Chat error";

        setMessages((prev) => [...prev, { sender: "ai", text: finalReply }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Upload failed: " + err.message },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderMessage = (msg, idx) => {
    const isAI = msg.sender === "ai";
    const codeRegex = /```([\s\S]*?)```/g;
    const parts = msg.text.split(codeRegex);
    const elements = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        elements.push(
          <div key={`text-${idx}-${i}`} style={{ whiteSpace: "pre-wrap" }}>
            {parts[i]}
          </div>
        );
      } else {
        const lines = parts[i].split("\n");
        const langLine = lines[0].match(/^\w+$/) ? lines[0] : null;
        const codeBody = langLine ? lines.slice(1).join("\n") : parts[i];
        const blockId = `copy-${idx}-${i}`;
        const isCopied = copied === blockId;

        elements.push(
          <div
            key={blockId}
            style={{
              backgroundColor: "#272822",
              color: "#f8f8f2",
              padding: "10px",
              borderRadius: "8px",
              position: "relative",
              marginTop: "10px",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              overflowX: "auto",
            }}
          >
            {langLine && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "10px",
                  color: "#ccc",
                  fontSize: "12px",
                  fontStyle: "italic",
                }}
              >
                {langLine}
              </div>
            )}
            <button
              onClick={() => handleCopy(codeBody, blockId)}
              style={{
                position: "absolute",
                top: "8px",
                right: "10px",
                backgroundColor: isCopied ? "#2ecc71" : "#444",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                padding: "5px 10px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {isCopied ? "✅ Copied!" : "Copy"}
            </button>
            <pre
              style={{
                marginTop: langLine ? "20px" : 0,
                maxHeight: "300px",
                overflow: "auto",
                whiteSpace: "pre",
                scrollbarWidth: "thin", // Firefox
                scrollbarColor: "#888 transparent", // Firefox
              }}
            >
              {codeBody}
            </pre>
          </div>
        );
      }
    }

    return (
      <div
        key={idx}
        style={{
          textAlign: isAI ? "left" : "right",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: isAI ? "#f1f1f1" : "#d1e7dd",
            color: "#000",
            padding: "10px",
            borderRadius: "10px",
            width: "auto",
            maxWidth: "100%",
            animation: isAI ? "fadeIn 0.4s ease" : "none",
          }}
        >
          {elements}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center" }}>🤖 AI Chat</h2>

      <div
        ref={chatRef}
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "10px",
          height: "400px",
          overflowY: "auto",
          backgroundColor: "#fff",
          marginBottom: "10px",
        }}
      >
        {messages.map(renderMessage)}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "8px",
        }}
      >
        <textarea
          ref={textareaRef}
          rows="1"
          placeholder="Type a message..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            autoResizeTextarea();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: "14px",
            padding: "6px",
            overflow: "hidden",
          }}
        />

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageUpload}
        />

        <button
          onClick={() => fileInputRef.current.click()}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#ccc" : "#6f42c1",
            color: "#fff",
            padding: "8px",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          📎
        </button>

        <button
          onClick={handleVoiceInput}
          disabled={loading || listening}
          style={{
            backgroundColor: loading || listening ? "#ccc" : "#28a745",
            color: "#fff",
            padding: "8px",
            border: "none",
            borderRadius: "6px",
            cursor: loading || listening ? "not-allowed" : "pointer",
          }}
        >
          🎤
        </button>

        {(prompt.trim() || loading) && (
          <button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            style={{
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "#fff",
              padding: "8px",
              border: "none",
              borderRadius: "6px",
              cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
              width: "40px",
              height: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "3px solid white",
                  borderTop: "3px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              "➤"
            )}
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Chrome, Edge, Safari */
        pre::-webkit-scrollbar {
          width: 2px;
          height: 2px;
        }
        pre::-webkit-scrollbar-track {
          background: transparent;
        }
        pre::-webkit-scrollbar-thumb {
          background-color: #888;
          border-radius: 4px;
        }
        pre::-webkit-scrollbar-thumb:hover {
          background-color: #555;
        }
      `}</style>
    </div>
  );
}
