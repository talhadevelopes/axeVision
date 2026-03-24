import { useState } from "react";
import {
  Send,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  X,
} from "lucide-react";

export default function ExtensionCarousel() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const charCount = inputValue.length;

  const extensions = [
    {
      name: "A11y Co-Pilot",
      description: "AI-Powered Accessibility Assistant",
      component: (
        <axeVisionAIExtension
          inputValue={inputValue}
          setInputValue={setInputValue}
          charCount={charCount}
        />
      ),
    },
    {
      name: "WebLenses",
      description: "DOM Snapshot & Accessibility Tool",
      component: <axeVisionExtension />,
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % extensions.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + extensions.length) % extensions.length
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-12">
      {/* Carousel Header */}

      {/* Carousel Container */}
      <div className="relative">
        {/* Extension Display */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {extensions.map((ext, index) => (
              <div key={index} className="w-full flex-shrink-0 px-4">
                <div className="flex flex-col items-center">
                  {/* Extension Title */}
                  <div className="mb-6 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {ext.name}
                    </h3>
                    <p className="text-green-600 font-medium">
                      {ext.description}
                    </p>
                  </div>

                  {/* Extension Component */}
                  <div className="w-full flex justify-center">
                    {ext.component}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gray-50 text-gray-700 rounded-full p-3 shadow-xl border border-gray-200 transition-all hover:scale-110 z-10"
          aria-label="Previous extension"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-50 text-gray-700 rounded-full p-3 shadow-xl border border-gray-200 transition-all hover:scale-110 z-10"
          aria-label="Next extension"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Carousel Indicators */}
      <div className="flex justify-center items-center gap-3 mt-8">
        {extensions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? "w-12 h-3 bg-green-600"
                : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// A11y Co-Pilot Component (Dashboard Chatbot UI)
function axeVisionAIExtension({ inputValue, setInputValue }: any) {
  const [messages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI Assistant 🤖\n\nI can analyze this webpage and provide expert insights!",
      timestamp: "1:43:30 AM",
    },
    {
      role: "user",
      content: "What should I fix first?",
      timestamp: "1:43:40 AM",
    },
    {
      role: "assistant",
      content:
        "Based on your scan, I recommend fixing the heading-order issue first. Logical heading structures are crucial for screen reader navigation.\n\nAfter that, tackle the 17 color-contrast issues. Poor contrast affects users with low vision.",
      timestamp: "1:43:48 AM",
    },
  ]);

  const suggestedQuestions = [
    "What should I fix first?",
    "Explain the High priority issues",
    "How do I fix heading order violations?",
    "Which issues affect screen readers?",
  ];

  return (
    <div className="relative animate-float">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl blur-2xl scale-110"></div>
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden relative z-10 hover:shadow-3xl transition-all duration-500 w-full max-w-md">
        {/* Chat Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-semibold text-white text-sm">
                A11y Co-Pilot
              </h3>
              <p className="text-xs text-purple-100">
                AI-Powered Accessibility Assistant
              </p>
            </div>
          </div>
          <button className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Page Info */}
        <div className="px-4 py-3 bg-purple-50 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <svg
                className="w-3.5 h-3.5 text-purple-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="truncate">https://example.com</span>
            </div>
            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-medium">
              18 issues
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {/* Welcome Message */}
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs text-slate-500 mb-3">Try asking:</p>
          </div>

          {/* Suggested Questions */}
          <div className="space-y-2 mb-4">
            {suggestedQuestions.slice(0, 2).map((question, idx) => (
              <button
                key={idx}
                className="w-full text-left px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-xs hover:bg-purple-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>

          {/* Conversation */}
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-xs whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                <p
                  className={`text-[10px] mt-1 ${
                    message.role === "user"
                      ? "text-purple-100"
                      : "text-slate-500"
                  }`}
                >
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about accessibility..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            />
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transition-all">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-purple-50 border-t border-gray-200/50 text-center">
          <span className="text-xs text-gray-500 font-medium">v1.0.0</span>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// WebLenses Extension Component (Keep as is)
function axeVisionExtension() {
  const [activeTab, setActiveTab] = useState("snapshot");

  return (
    <div className="relative animate-float-delayed w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-2xl scale-110"></div>

      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden relative z-10 hover:shadow-3xl transition-all duration-500 w-full max-w-md">
        {/* Extension Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600 font-mono">WebLenses</span>
            </div>
          </div>
        </div>

        {/* Current Page Info */}
        <div className="px-4 py-3 bg-emerald-50 border-b border-gray-200/50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg
              className="w-3.5 h-3.5 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="truncate">https://example.com</span>
          </div>
          <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-full font-medium">
            Tracked
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("snapshot")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === "snapshot"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M3 8H21" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Snapshot
          </button>
          <button
            onClick={() => setActiveTab("accessibility")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === "accessibility"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 8V16M8 12H16"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            Accessibility
          </button>
        </div>

        {/* Tab Content */}
        <div className="h-96 overflow-y-auto p-5 bg-gray-50/50">
          {activeTab === "snapshot" ? (
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Capture Snapshot
              </button>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Team Snapshots
                  </h4>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M1 4V10H7M23 20V14H17M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7346 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        homepage-v2.3
                      </p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 bg-white rounded hover:bg-gray-50 border border-gray-200">
                        <svg
                          className="w-3.5 h-3.5 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M1 12S5 4 12 4C19 4 23 12 23 12S19 20 12 20C5 20 1 12 1 12Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </button>
                      <button className="p-1.5 bg-white rounded hover:bg-gray-50 border border-gray-200">
                        <svg
                          className="w-3.5 h-3.5 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        dashboard-v1.8
                      </p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 bg-white rounded hover:bg-gray-50 border border-gray-200">
                        <svg
                          className="w-3.5 h-3.5 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M1 12S5 4 12 4C19 4 23 12 23 12S19 20 12 20C5 20 1 12 1 12Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </button>
                      <button className="p-1.5 bg-white rounded hover:bg-gray-50 border border-gray-200">
                        <svg
                          className="w-3.5 h-3.5 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M22 4L12 14.01L9 11.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Run Accessibility Check
              </button>

              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-red-700">
                      Missing ARIA labels
                    </span>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                    2
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-medium text-orange-700">
                      Color contrast issues
                    </span>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                    5
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium text-yellow-700">
                      Focus indicators
                    </span>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                    3
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-700">
                      Alt text suggestions
                    </span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    1
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-emerald-50 border-t border-gray-200/50 flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium">v1.0.0</span>
          <a
            href="#"
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 19C4.7 20.4 4.7 16.5 3 16M15 21V17.5C15 16.5 15.1 16.1 14.5 15.5C17.3 15.2 20 14.1 20 9.49995C19.9988 8.30492 19.5325 7.15726 18.7 6.29995C19.0905 5.26192 19.0545 4.11158 18.6 3.09995C18.6 3.09995 17.5 2.79995 15.1 4.39995C13.0672 3.87054 10.9328 3.87054 8.9 4.39995C6.5 2.79995 5.4 3.09995 5.4 3.09995C4.94548 4.11158 4.90953 5.26192 5.3 6.29995C4.46745 7.15726 4.00122 8.30492 4 9.49995C4 14.1 6.7 15.2 9.5 15.5C8.9 16.1 8.9 16.7 9 17.5V21"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            GitHub
          </a>
        </div>
      </div>

      <style>{`
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-delayed {
          animation: float-animation: float-delayed 6s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
}
