import { Button } from "@axeVision/shared/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@axeVision/shared/components/card";
import { Badge } from "@axeVision/shared/components/badge";
import Footer from "../components/layout/Footer";
import {
  Shield,
  Eye,
  Users,
  FileText,
  Chrome,
  CheckCircle,
  Layers,
  TrendingUp,
  Terminal,
  Cpu,
  Braces,
  Scan,
  BrainCircuit,
  Sparkles,
  Target,
  Workflow,
  Star,
  MessageSquare,
  BarChart3,
  Microscope,
  Camera,
  Bot,
  Key,
  UserCheck,
  TreePine,
  Zap,
  Settings,
  Lock,
  Globe,
  Gauge,
  FileCode,
  Lightbulb,
  Search,
  AlertTriangle,
  Plus,
  Minus,
  GitCompare,
  Calendar,
  Award,
  Briefcase,
} from "lucide-react";
import Header from "../components/layout/Header";
import ExtensionCarousel from "../components/pages/landing/ExtensionCarousel";
import FeatureShowcase from "../components/pages/landing/Features";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:40px_40px] animate-pulse opacity-30"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-400/10 to-emerald-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-400/8 to-green-500/8 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-green-500/5 via-transparent to-transparent rounded-full animate-pulse"></div>
      </div>

      {/* Modern Navigation */}
      <Header />

      {/* Revolutionary Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white to-blue-50/40"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98115_1px,transparent_1px),linear-gradient(to_bottom,#10b98115_1px,transparent_1px)] bg-[size:32px_32px] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]"></div>

        <div className="absolute top-32 left-10 opacity-20 font-mono text-xs text-green-600 animate-float">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-green-200/30">
            <div>const accessibility = true;</div>
            <div>if (accessibility) &#123;</div>
            <div>&nbsp;&nbsp;return "inclusive";</div>
            <div>&#125;</div>
          </div>
        </div>
        <div className="absolute top-48 right-16 opacity-20 font-mono text-xs text-blue-600 animate-float-delayed">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-blue-200/30">
            <div>$ qag --analyze</div>
            <div>✓ DOM captured</div>
            <div>✓ AI processing</div>
            <div>✓ Report ready</div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
            {/* Left Side - Content */}
            <div className="space-y-8 animate-slide-up">
              <div className="inline-flex items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-6 py-3 border border-green-200/50 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <BrainCircuit className="w-5 h-5 text-green-600" />
                    <div className="absolute inset-0 bg-green-400/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 bg-green-400/20 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-sm text-green-800 font-medium">
                    Enterprise QA Platform
                  </span>
                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs shadow-md">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-heading font-bold text-gray-900 leading-tight">
                  <span className="block relative">
                    Ship Perfect
                    <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-60"></div>
                  </span>
                  <span className="block text-green-600 relative">
                    Accessibility
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-60"></div>
                  </span>
                  <span className="block text-3xl lg:text-5xl font-medium text-gray-600 mt-2">
                    Every Time
                  </span>
                </h1>

                <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  Enterprise platform with{" "}
                  <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md">
                    JWT authentication
                  </span>
                  ,{" "}
                  <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md">
                    team collaboration
                  </span>
                  , and{" "}
                  <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md">
                    AI-powered insights
                  </span>{" "}
                  for modern development teams.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r cursor-pointer from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-mono group shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Chrome className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform relative z-10" />
                  <span className="relative z-10">chrome.install()</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-8 text-sm text-gray-500 font-mono">
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-green-100">
                  <Star className="w-4 h-4 text-green-500 fill-green-500" />
                  <span className="font-medium">--trial=14d</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-green-100">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="font-medium">--auth=JWT</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-green-100">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="font-medium">--teams=unlimited</span>
                </div>
              </div>
            </div>

            {/* Right Side - Enhanced Chrome Extension UI */}
            <ExtensionCarousel />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="py-24 bg-gradient-to-br from-gray-50 to-white relative"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f912_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f912_1px,transparent_1px)] bg-[size:60px_60px] opacity-30"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 shadow-lg">
              <Cpu className="w-4 h-4 mr-2" />
              Enterprise Features
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-heading font-bold text-gray-900 mb-8 leading-tight">
              Complete QA platform for{" "}
              <span className="text-green-600 relative">
                modern teams
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-40"></div>
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From JWT authentication to AI-powered insights, everything you
              need for enterprise-grade accessibility testing.
            </p>
          </div>
          <FeatureShowcase />
        </div>
      </section>
      <Footer />
    </div>
  );
}
