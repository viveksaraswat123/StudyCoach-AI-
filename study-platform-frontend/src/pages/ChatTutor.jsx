import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import API from "../api/client";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

import {
  Send,
  ArrowLeft,
  Loader2,
  Brain,
  MessageCircle,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Download,
  FileText,
} from "lucide-react";

export default function ChatTutor() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewChat, setShowNewChat] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatHistory = async () => {
    try {
      const res = await API.get("/tutor/history");
      if (res.data && res.data.length > 0) {
        setMessages(
          res.data.reverse().map((conv) => ({
            id: conv.id,
            topic: conv.topic,
            question: conv.question,
            answer: conv.answer,
            timestamp: new Date(conv.created_at),
            type: "history",
          }))
        );
        setShowNewChat(false);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !question.trim() || loading) return;

    setLoading(true);
    setError(null);
    setShowNewChat(false);

    try {
      const res = await API.post("/tutor/ask", {
        topic: topic.trim(),
        question: question.trim(),
      });

      const newMessage = {
        id: res.data.id,
        topic: res.data.topic,
        question: res.data.question,
        answer: res.data.answer,
        timestamp: new Date(res.data.created_at),
        type: "sent",
      };

      setMessages((prev) => [...prev, newMessage]);
      setQuestion("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to get response. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setTopic("");
    setQuestion("");
    setShowNewChat(true);
    setMessages([]);
    setError(null);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChatAsText = () => {
    if (messages.length === 0) return;

    let chatText = "STUDY TUTOR CHAT EXPORT\n";
    chatText += `Exported on: ${new Date().toLocaleString()}\n`;
    chatText += "=".repeat(60) + "\n\n";

    messages.forEach((msg, idx) => {
      chatText += `Question ${idx + 1}:\n`;
      chatText += `Topic: ${msg.topic}\n`;
      chatText += `Q: ${msg.question}\n\n`;
      chatText += `Answer:\n${msg.answer}\n`;
      chatText += "-".repeat(60) + "\n\n";
    });

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(chatText));
    element.setAttribute("download", `study-tutor-chat-${new Date().getTime()}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportChatAsPdf = async () => {
    if (messages.length === 0) return;

    setExportingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - 2 * margin;
      let y = margin;
      let pageNum = 1;

      // Helper to add new page
      const addNewPage = () => {
        doc.addPage();
        y = margin;
        pageNum++;
      };

      // Header on first page
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 102, 204);
      doc.text("Study Tutor Chat Export", margin, y);
      y += 10;

      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100);
      doc.text(`Exported on: ${new Date().toLocaleString()}`, margin, y);
      y += 8;

      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      doc.setTextColor(0);

      // Messages
      messages.forEach((msg, idx) => {
        // Question
        const questionLabel = `Q${idx + 1}. ${msg.topic}`;
        doc.setFont(undefined, "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 102, 204);

        // Check if question fits on current page
        if (y + 8 > pageHeight - 20) {
          addNewPage();
        }

        doc.text(questionLabel, margin, y);
        y += 8;

        // Question content
        doc.setFont(undefined, "normal");
        doc.setFontSize(9);
        doc.setTextColor(40);
        const qLines = doc.splitTextToSize(msg.question, contentWidth - 4);
        
        // Check if question text fits
        if (y + qLines.length * 4 > pageHeight - 30) {
          addNewPage();
        }

        doc.text(qLines, margin + 2, y);
        y += qLines.length * 4 + 5;

        // Answer header
        doc.setFont(undefined, "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 102, 204);

        if (y + 8 > pageHeight - 25) {
          addNewPage();
        }

        doc.text("Answer:", margin, y);
        y += 8;

        // Answer content
        doc.setFont(undefined, "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(50);
        const ansLines = doc.splitTextToSize(msg.answer, contentWidth - 4);

        // Check if answer fits, if not add multiple lines/pages
        let answerY = y;
        for (let i = 0; i < ansLines.length; i++) {
          if (answerY + 4 > pageHeight - 15) {
            addNewPage();
            answerY = y;
          }
          doc.text(ansLines[i], margin + 2, answerY);
          answerY += 4;
        }

        y = answerY + 5;

        // Timestamp
        if (y + 8 > pageHeight - 15) {
          addNewPage();
        }

        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(msg.timestamp.toLocaleString(), margin, y);
        y += 8;

        // Separator
        if (y + 3 > pageHeight - 15) {
          addNewPage();
        }

        doc.setDrawColor(220);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
      });

      doc.save(`study-tutor-chat-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800 rounded-lg flex-shrink-0"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 truncate">
                  <Brain size={24} className="text-blue-400 flex-shrink-0" />
                  <span className="hidden sm:inline">AI Tutor</span>
                </h1>
                <p className="text-neutral-500 text-xs md:text-sm">Learn anything, anytime</p>
              </div>
            </div>

            {/* EXPORT BUTTONS */}
            {messages.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportChatAsText}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all flex items-center gap-1 text-xs md:text-sm font-medium"
                  title="Export as Text"
                >
                  <FileText size={18} />
                  <span className="hidden sm:inline">Export</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportChatAsPdf}
                  disabled={exportingPdf}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all flex items-center gap-1 text-xs md:text-sm font-medium disabled:opacity-50"
                  title="Download as PDF"
                >
                  {exportingPdf ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                  <span className="hidden sm:inline">PDF</span>
                </motion.button>

                <motion.button
                  onClick={startNewChat}
                  className="text-xs md:text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-neutral-800 whitespace-nowrap"
                >
                  New Chat
                </motion.button>
              </div>
            )}

            {messages.length === 0 && (
              <motion.button
                onClick={startNewChat}
                className="text-xs md:text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-neutral-800 whitespace-nowrap flex-shrink-0"
              >
                New Chat
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-3xl mx-auto w-full">
          {historyLoading ? (
            <div className="flex items-center justify-center h-96">
              <motion.div
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center"
                >
                  <Brain size={24} className="text-white" />
                </motion.div>
                <p className="text-neutral-500">Loading chat history...</p>
              </motion.div>
            </div>
          ) : (
            <>
              {/* ERROR MESSAGE */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3"
                >
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* MESSAGES */}
              {messages.length > 0 ? (
                <div className="space-y-4 md:space-y-6 mb-8 w-full">
                  <AnimatePresence>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="space-y-3 md:space-y-4 w-full"
                      >
                        {/* QUESTION */}
                        <div className="flex justify-end w-full">
                          <div className="max-w-xs md:max-w-md lg:max-w-2xl min-w-0">
                            <div className="text-xs text-neutral-500 mb-2 px-4">
                              <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md font-medium break-words">
                                {msg.topic}
                              </span>
                            </div>
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 md:p-5 rounded-2xl rounded-tr-sm shadow-lg break-words">
                              <p className="text-white text-sm md:text-base leading-relaxed break-words">{msg.question}</p>
                              <p className="text-xs text-blue-100 mt-3 opacity-75">
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ANSWER */}
                        <div className="flex justify-start">
                          <div className="max-w-xs md:max-w-md lg:max-w-2xl w-full min-w-0">
                            <div className="flex items-center gap-2 mb-2 px-4">
                              <div className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                                <Sparkles size={14} className="text-neutral-950" />
                              </div>
                              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">
                                AI Tutor
                              </span>
                            </div>
                            <div className="bg-neutral-800/50 border border-neutral-700/50 p-4 md:p-5 rounded-2xl rounded-tl-sm backdrop-blur-sm relative group overflow-hidden">
                              <div className="prose prose-invert prose-sm md:prose-base max-w-none text-neutral-200 overflow-hidden">
                                <ReactMarkdown
                                  components={{
                                    h1: ({ node, ...props }) => (
                                      <h1 className="text-xl md:text-2xl font-bold mt-4 mb-2 text-white break-words" {...props} />
                                    ),
                                    h2: ({ node, ...props }) => (
                                      <h2 className="text-lg md:text-xl font-bold mt-3 mb-2 text-white break-words" {...props} />
                                    ),
                                    h3: ({ node, ...props }) => (
                                      <h3 className="text-base md:text-lg font-bold mt-2 mb-1 text-neutral-100 break-words" {...props} />
                                    ),
                                    p: ({ node, ...props }) => (
                                      <p className="mb-3 leading-relaxed text-neutral-200 break-words" {...props} />
                                    ),
                                    ul: ({ node, ...props }) => (
                                      <ul className="list-disc list-inside mb-3 space-y-1 ml-2 break-words" {...props} />
                                    ),
                                    ol: ({ node, ...props }) => (
                                      <ol className="list-decimal list-inside mb-3 space-y-1 ml-2 break-words" {...props} />
                                    ),
                                    li: ({ node, ...props }) => (
                                      <li className="text-neutral-200 ml-2 break-words" {...props} />
                                    ),
                                    code: ({ node, inline, ...props }) =>
                                      inline ? (
                                        <code className="bg-neutral-900 px-2 py-1 rounded text-cyan-300 font-mono text-xs md:text-sm break-all" {...props} />
                                      ) : (
                                        <code className="block bg-neutral-900/50 border border-neutral-700 p-3 rounded-lg text-cyan-300 font-mono text-xs md:text-sm overflow-x-auto my-3 whitespace-pre-wrap break-words" {...props} />
                                      ),
                                    blockquote: ({ node, ...props }) => (
                                      <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-3 text-neutral-300 italic break-words" {...props} />
                                    ),
                                    strong: ({ node, ...props }) => (
                                      <strong className="font-bold text-blue-300 break-words" {...props} />
                                    ),
                                  }}
                                >
                                  {msg.answer}
                                </ReactMarkdown>
                              </div>

                              {/* COPY BUTTON */}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => copyToClipboard(msg.answer, msg.id)}
                                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                {copiedId === msg.id ? (
                                  <Check size={16} className="text-green-400" />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              ) : showNewChat ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12 md:py-16 w-full px-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-blue-500/30"
                  >
                    <Brain size={40} className="text-blue-400" />
                  </motion.div>
                  <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 break-words">Start Learning</h2>
                  <p className="text-neutral-400 max-w-md mx-auto text-sm md:text-base leading-relaxed break-words">
                    Ask me anything about topics you're studying. I'll explain concepts clearly and help you understand better.
                  </p>

                  {/* QUICK SUGGESTIONS */}
                  <div className="mt-8 md:mt-10">
                    <p className="text-xs md:text-sm text-neutral-500 mb-4 font-medium uppercase tracking-wide">
                      Try asking about:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto px-2 md:px-0">
                      {[
                        { topic: "Python", question: "How do list comprehensions work?" },
                        { topic: "Math", question: "What is the chain rule in calculus?" },
                        { topic: "History", question: "What caused the fall of Rome?" },
                      ].map((suggestion, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.03, y: -2 }}
                          onClick={() => {
                            setTopic(suggestion.topic);
                            setQuestion(suggestion.question);
                          }}
                          className="p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-xl hover:border-blue-500/50 transition-all text-left hover:bg-neutral-800/80 group break-words"
                        >
                          <p className="text-xs text-blue-400 font-medium mb-1 group-hover:text-blue-300 break-words">
                            {suggestion.topic}
                          </p>
                          <p className="text-xs md:text-sm text-neutral-300 group-hover:text-neutral-100 break-words">
                            {suggestion.question}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </>
          )}
        </div>
      </main>

      {/* INPUT FORM */}
      <div className="sticky bottom-0 bg-gradient-to-t from-neutral-950 to-neutral-950/80 backdrop-blur-md border-t border-neutral-800/50 px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="What topic are you studying?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="sm:w-32 bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-4 py-3 text-sm md:text-base text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
              />
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Ask your question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !loading) {
                      handleSendMessage(e);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-4 py-3 text-sm md:text-base text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading || !topic.trim() || !question.trim()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 md:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 text-sm md:text-base"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span className="hidden sm:inline">Ask</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
            <p className="text-xs text-neutral-500 text-center">
              Press <kbd className="px-2 py-1 bg-neutral-800 rounded text-neutral-300">Enter</kbd> to send
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
