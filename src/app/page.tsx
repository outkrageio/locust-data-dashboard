"use client";

import { useRouter } from "next/navigation";
import { BarChart3, Activity, GitCompare, TrendingUp } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to test runs page after a brief moment
    const timer = setTimeout(() => {
      router.push("/test-runs");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8 inline-block">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8">
              <Activity className="h-24 w-24 text-white mx-auto" />
            </div>
          </div>
        </div>

        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Locust Data Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Monitor and analyze your load testing results with beautiful visualizations and real-time insights
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 p-4 w-fit mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Test Analytics</h3>
            <p className="text-sm text-gray-600">Comprehensive metrics and performance insights</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 p-4 w-fit mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Real-time Monitoring</h3>
            <p className="text-sm text-gray-600">Live updates of your running tests</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-4 w-fit mx-auto mb-4">
              <GitCompare className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Compare Results</h3>
            <p className="text-sm text-gray-600">Side-by-side test comparison</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-500">
          <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce"></div>
          <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="h-2 w-2 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          <span className="ml-2">Redirecting to dashboard...</span>
        </div>
      </div>
    </div>
  );
}
