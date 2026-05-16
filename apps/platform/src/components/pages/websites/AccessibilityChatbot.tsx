import { useState, useRef, useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Send, Sparkles, Loader2, X } from "lucide-react";
import { useAccessibilityChatbotMutation } from "../../../mutations/useAiMutations";
import AiResponseRenderer from "../../shared/AiResponseRenderer";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AccessibilityChatbotProps {
  websiteId: string;
  snapshotId: string | null;
}

const FAB_STYLE: CSSProperties = {
  position: "fixed",
  bottom: "max(1.25rem, env(safe-area-inset-bottom))",
  right: "max(1rem, env(safe-area-inset-right))",
  left: "auto",
  top: "auto",
  zIndex: 100,
};

const CHAT_WINDOW_STYLE: CSSProperties = {
  position: "fixed",
  bottom: "max(1rem, env(safe-area-inset-bottom))",
  right: "max(1rem, env(safe-area-inset-right))",
  left: "auto",
  top: "auto",
  zIndex: 100,
};

export default function AccessibilityChatbot({
  websiteId,
  snapshotId,
}: AccessibilityChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useAccessibilityChatbotMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !snapshotId) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await chatMutation.mutateAsync({
        query: input,
        snapshotId,
        websiteId,
        conversationHistory: messages,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Please try again";
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const suggestedQuestions = [
    "What should I fix first?",
    "Explain the High priority issues",
    "How do I fix heading order violations?",
    "Which issues affect screen readers?",
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  if (!snapshotId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">AI Co-Pilot Unavailable</p>
            <p className="text-sm text-amber-700 mt-1">
              Please capture a snapshot first to use the AI assistant.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fab = !isOpen ? (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      aria-label="Open A11y Co-Pilot"
      className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl md:hover:scale-110 transition-all duration-200 flex items-center justify-center"
      style={FAB_STYLE}
    >
      <MessageSquare className="w-6 h-6" />
    </button>
  ) : null;

  const chatWindow = isOpen ? (
    <div
      className="w-[calc(100vw-2rem)] max-w-sm sm:max-w-md h-[min(520px,calc(100dvh-6rem))] md:w-96 md:max-w-none md:h-[600px] bg-white rounded-2xl shadow-2xl border border-purple-100 flex flex-col"
      style={CHAT_WINDOW_STYLE}
    >
      <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <div>
            <h3 className="font-semibold text-white">A11y Co-Pilot</h3>
            <p className="text-xs text-purple-100">
              AI-Powered Accessibility Assistant
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat"
          className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-2">
              Hello! I&apos;m your AI Assistant
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              I can analyze this webpage and provide expert insights!
            </p>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-3">Try asking:</p>
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm hover:bg-purple-100 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl ${
                message.role === "user"
                  ? "max-w-[85%] px-4 py-2 bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                  : "max-w-full w-full px-3 py-3 sm:px-4 bg-slate-100 text-slate-800"
              }`}
            >
              {message.role === "user" ? (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="min-w-0 [&_h2]:text-base [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-sm [&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h4]:text-sm [&_p]:mb-2 [&_p]:text-xs [&_ul]:mb-2 [&_ul]:text-xs [&_ol]:mb-2 [&_ol]:text-xs [&_pre]:mb-2 [&_pre]:text-[11px] [&_pre]:p-2.5 [&_hr]:my-2">
                  <AiResponseRenderer text={message.content} />
                </div>
              )}
              <p
                className={`text-xs mt-2 ${
                  message.role === "user"
                    ? "text-purple-100"
                    : "text-slate-500"
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-sm text-slate-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me anything about accessibility..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            disabled={chatMutation.isPending}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!input.trim() || chatMutation.isPending}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (typeof document === "undefined") {
    return null;
  }

  return (
    <>
      {fab ? createPortal(fab, document.body) : null}
      {chatWindow ? createPortal(chatWindow, document.body) : null}
    </>
  );
}
