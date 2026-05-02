import { useState } from "react";
import {
  Bot,
  Users,
  GitCompare,
  Eye,
  X,
  Shield,
  Chrome,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";

const FeatureShowcase = () => {
  const [lightboxImage, setLightboxImage] = useState<any>(null);

  const featureCategories = [
    {
      id: "auth-teams",
      title: "Authentication & Team Management",
      icon: Shield,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50/50 to-transparent",
      description:
        "Secure JWT-based authentication with role-based access control. Set up your team profile, assign roles (Admin or Member), and manage permissions from a centralised dashboard.",
      images: [
        {
          id: 1,
          src: "/Img1.png",
          label: "Onboarding & Role Setup",
          description:
            "Complete Your Profile screen with professional role dropdown (Lead QA Engineer, Frontend Developer, Backend Developer, and more) and account type selection - Team Member or Team Admin",
        },
        {
          id: 2,
          src: "/Img2.png",
          label: "Team Management",
          description:
            "Admin panel showing 2 existing members with roles (Frontend Developer, Lead QA Engineer), alongside a Create New Member form for adding a Backend Developer as a Member",
        },
      ],
    },
    {
      id: "extension-capture",
      title: "Chrome Extension & DOM Capture",
      icon: Chrome,
      color: "green",
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50/50 to-transparent",
      description:
        "A lightweight Chrome extension that parses the DOM of any page into a structured content object - capturing headings, paragraphs, links, inputs, buttons, and forms. Provides immediate feedback in the popup before the dashboard even opens.",
      images: [
        {
          id: 3,
          src: "/Img3.png",
          label: "Snapshot Capture",
          description:
            "Extension popup on Wikipedia showing the Snapshot tab - post-capture feedback confirming 7 headings, 12 paragraphs, 75 links, 14 inputs, and 1 form captured instantly",
        },
        {
          id: 4,
          src: "/Img4.png",
          label: "Live Analysis Log",
          description:
            "Accessibility tab with real-time axe-core log showing DOM capture in 8ms, analysis completing in 8638ms, 31 issues detected - summary shows 0 Critical, 1 High, 30 Medium, 0 Low",
        },
        {
          id: 9,
          src: "/Img9.png",
          label: "Interactive Elements Breakdown",
          description:
            "Detailed breakdown of all interactive elements: 7 buttons (Search, Collapse, Close…), 1 form with GET action, 14 inputs (hidden, search, radio…), and 75 links with their full text",
        },
        {
          id: 8,
          src: "/Img8.png",
          label: "Snapshot History & Live Preview",
          description:
            "Snapshot list showing 2 captures from 11/30/2025, with a live preview panel on the right rendering the actual captured Wikipedia HTML directly in the dashboard",
        },
      ],
    },
    {
      id: "accessibility",
      title: "AI Accessibility Analysis",
      icon: AlertTriangle,
      color: "red",
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50/50 to-transparent",
      description:
        "Full WCAG analysis powered by axe-core running in a Puppeteer headless browser on the backend. Issues are categorised by severity. Gemini AI then generates specific code fixes and actionable recommendations for every violation found.",
      images: [
        {
          id: 11,
          src: "/Img11.png",
          label: "Accessibility Analysis",
          description:
            "Main analysis view showing 31 total issues - 0 Critical, 1 High, 30 Medium, 0 Low - with Generate Code Fixes and Generate AI Recommendations buttons, and individual issue cards with WCAG context",
        },
        {
          id: 12,
          src: "/Img12.png",
          label: "AI Code Fixes",
          description:
            "Gemini-generated code fixes for each violation - fix #3 adds an empty alt attribute to a hidden tracking image, fix #4 wraps an unlabelled input with a matching label element",
        },
        {
          id: 17,
          src: "/Img17.png",
          label: "AI Recommendations",
          description:
            "AI Recommendations tab with actionable step-by-step guidance for Images Missing Alt Text and Form Inputs Without Labels, including exact corrected HTML code snippets",
        },
      ],
    },
    {
      id: "ai-chatbot",
      title: "A11y Co-Pilot",
      icon: Bot,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50/50 to-transparent",
      description:
        "A context-aware AI assistant that understands the exact snapshot you are reviewing. It builds its responses from the real issue data - the URL, severity counts, and violation categories - so every answer is specific to your page, not generic advice.",
      images: [
        {
          id: 16,
          src: "/Img16.png",
          label: "Context-Aware Co-Pilot",
          description:
            "Co-Pilot panel explaining the 2 High priority issues on reddit.com - 1 image missing alt text, 2 inputs without labels - with specific context pulled directly from the axe-core scan results",
        },
      ],
    },
    {
      id: "diff-tracking",
      title: "Snapshot Comparison & DOM Diff",
      icon: GitCompare,
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50/50 to-transparent",
      description:
        "Compare any two captured snapshots side by side using a custom-built diff engine. Powered by the diffLines algorithm with red highlighting for removals and green for additions - exactly like a Git diff but for your live DOM.",
      images: [
        {
          id: 10,
          src: "/Img10.png",
          label: "HTML Diff View",
          description:
            "Side-by-side line-by-line diff between Snapshot 1 and Snapshot 2 - left panel shows removed headings (Spain is different, Spinosaurus…) and links in red, right panel shows added Wikipedia language links in green",
        },
      ],
    },
    {
      id: "collaboration",
      title: "Real-Time Team Collaboration",
      icon: Users,
      color: "indigo",
      gradient: "from-indigo-500 to-indigo-600",
      bgGradient: "from-indigo-50/50 to-transparent",
      description:
        "Socket.io-powered real-time messaging with private direct messages, group channels scoped to your organisation, and typing notifications.",
      images: [
        {
          id: 19,
          src: "/Img19.png",
          label: "Direct Messages",
          description:
            "Private DM with Team Member 2 showing a sent message ready to collaborate on backend-frontend integration, with delivery confirmation tick and timestamp",
        },
        {
          id: 18,
          src: "/Img18.png",
          label: "Group Chat",
          description:
            "Organisation-scoped Group Chat with 3 members - Admin's welcome message and Team Member 1's reply as Frontend Developer visible, with full conversation history and persistent storage",
        },
      ],
    },
    {
      id: "reports-viz",
      title: "Dashboard & DOM Visualisation",
      icon: LayoutDashboard,
      color: "teal",
      gradient: "from-teal-500 to-teal-600",
      bgGradient: "from-teal-50/50 to-transparent",
      description:
        "A high-level analytics dashboard across all tracked websites, performance metrics per snapshot, and an interactive Website Mind view that visualises the full DOM structure as a tree and element distribution as charts.",
      images: [
        {
          id: 5,
          src: "/Img5.png",
          label: "Analytics Dashboard",
          description:
            "Main dashboard showing 10 tracked websites, 19 snapshots (last 11/30/2025), 0 critical issues (148 total), and 3 team members (1 admin, 2 members) with 7-day trend sparklines",
        },
        {
          id: 6,
          src: "/Img6.png",
          label: "Website Inventory",
          description:
            "Searchable grid of all 10 tracked properties - WebMD, PayPal, Airbnb, Harvard, HealthCare.gov, Reddit and more - each showing creation date, last snapshot date, and a View Details button",
        },
        {
          id: 7,
          src: "/Img7.png",
          label: "Performance Analytics",
          description:
            "Snapshot throughput metrics showing 116 elements captured in 4ms at 31,351 elements/sec, with a radar chart of element composition and a linear elements-per-second trend graph",
        },
        {
          id: 15,
          src: "/Img15.png",
          label: "DOM Tree View",
          description:
            "Full-screen interactive DOM tree in horizontal orientation showing every captured node - anchor tags with href and text, br elements with childrenCount 0 - rooted from the html element",
        },
        {
          id: 14,
          src: "/Img14.png",
          label: "Element Statistics",
          description:
            "Breakdown of 174 total elements across 11 unique types - a and br both at 75, p at 12, h2 at 5, then html/head/title/style each at 1 - with proportional blue bar indicators",
        },
        {
          id: 13,
          src: "/Img13.png",
          label: "Content Distribution",
          description:
            "Interactive bar chart showing element type distribution - a and br dominating at 75 each (43.1%), p at 12 (6.9%), h2 at 5 (2.9%) - with Bar/Pie toggle and count axis",
        },
      ],
    },
  ];

  const Lightbox = () => {
    if (!lightboxImage) return null;

    return (
      <div
        onClick={() => setLightboxImage(null)}
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <button
          onClick={() => setLightboxImage(null)}
          className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="max-w-6xl w-full">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.label}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-24 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="space-y-32">
          {featureCategories.map((category, index) => {
            const Icon = category.icon;
            const isEven = index % 2 === 0;

            return (
              <div key={category.id} className="group relative">
                <div
                  className={`absolute ${isEven ? "-left-20" : "-right-20"} top-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br ${category.bgGradient} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700`}
                ></div>

                <div
                  className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? "" : "lg:flex-row-reverse"}`}
                >
                  <div
                    className={`space-y-6 ${isEven ? "lg:pr-8" : "lg:pl-8 lg:order-2"}`}
                  >
                    <div className="inline-flex items-center space-x-3 mb-4">
                      <div
                        className={`w-14 h-14 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900">
                          {category.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-lg text-gray-600 leading-relaxed">
                      {category.description}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-4">
                      {category.images.map((img) => (
                        <span
                          key={img.id}
                          className={`px-4 py-2 bg-${category.color}-50 text-${category.color}-700 rounded-full text-sm font-medium border border-${category.color}-100 hover:bg-${category.color}-100 transition-colors cursor-default`}
                        >
                          {img.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`relative ${isEven ? "lg:order-2" : "lg:order-1"}`}
                  >
                    <div
                      className={`grid gap-4 ${category.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                    >
                      {category.images.map((img, imgIndex) => (
                        <div
                          key={img.id}
                          onClick={() => setLightboxImage(img)}
                          className={`relative group/img cursor-pointer overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 ${
                            imgIndex === 0 && category.images.length > 1
                              ? "col-span-2 aspect-video"
                              : "aspect-square"
                          }`}
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10`}
                          ></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                            <img
                              src={img.src}
                              alt={img.label}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>

                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/60 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 text-center px-6">
                              <Eye className="h-10 w-10 text-white mx-auto mb-3" />
                              <p className="text-white font-semibold text-lg mb-1">
                                {img.label}
                              </p>
                              <p className="text-white/80 text-sm">
                                {img.description}
                              </p>
                            </div>
                          </div>

                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                              <p className="text-sm font-semibold text-gray-900">
                                {img.label}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Lightbox />
    </section>
  );
};

export default FeatureShowcase;