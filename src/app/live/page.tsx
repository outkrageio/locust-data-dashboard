"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TestRun } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Activity, Users, TrendingUp, AlertCircle, Clock, Server } from "lucide-react";
import Link from "next/link";
import ReactECharts from "echarts-for-react";

export default function LiveMonitoringPage() {
  const { data: testRuns, isLoading } = useQuery({
    queryKey: ["liveTestRuns"],
    queryFn: () => api.testRuns.list({ status: "running" }),
    refetchInterval: 2000, // Refetch every 2 seconds for live updates
  });

  const runningTests = testRuns?.filter((run) => run.status === "running") || [];

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Live Monitoring
            </h1>
            <p className="text-gray-600 text-lg">Real-time view of running load tests</p>
          </div>
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg">
            <div className="h-3 w-3 rounded-full bg-white animate-pulse"></div>
            <span className="font-semibold">Live</span>
          </div>
        </div>
      </div>

      {/* Active Tests Count */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-amber-500 to-orange-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-white">
              <div>
                <div className="text-6xl font-bold">{runningTests.length}</div>
                <div className="text-xl mt-2 opacity-90">Active Test{runningTests.length !== 1 ? "s" : ""}</div>
              </div>
              <Activity className="h-24 w-24 opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Running Tests */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading active tests...</div>
        </div>
      ) : runningTests.length === 0 ? (
        <Card className="shadow-xl border-gray-100">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Activity className="h-16 w-16 mb-4 text-gray-400" />
              <p className="text-xl font-medium">No Active Tests</p>
              <p className="text-sm mt-2">Start a Locust test to see live monitoring data here</p>
              <Link
                href="/test-runs"
                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                View All Test Runs
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {runningTests.map((testRun) => (
            <LiveTestCard key={testRun.id} testRun={testRun} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveTestCard({ testRun }: { testRun: TestRun }) {
  const { data: stats } = useQuery({
    queryKey: ["liveStats", testRun.id],
    queryFn: () => api.stats.list({ test_run_id: testRun.id }),
    refetchInterval: 2000,
    enabled: !!testRun.id,
  });

  const { data: failures } = useQuery({
    queryKey: ["liveFailures", testRun.id],
    queryFn: () => api.failures.list({ test_run_id: testRun.id }),
    refetchInterval: 5000,
    enabled: !!testRun.id,
  });

  const latestStats = stats && stats.length > 0 ? stats[stats.length - 1] : null;
  const duration = Date.now() - new Date(testRun.start_time).getTime();
  const durationMinutes = Math.floor(duration / 1000 / 60);
  const durationSeconds = Math.floor((duration / 1000) % 60);

  // Prepare real-time charts
  const recentStats = stats && stats.length > 0 ? stats.slice(-20) : [];

  const rpsChartOption = recentStats.length > 0 ? {
    title: {
      text: "Requests Per Second (Live)",
      left: "center",
      textStyle: { fontSize: 14, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
    },
    grid: { left: "10%", right: "5%", bottom: "15%", top: "20%", containLabel: true },
    xAxis: {
      type: "category",
      data: recentStats.map((s) => new Date(s.timestamp).toLocaleTimeString()),
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "RPS",
    },
    series: [
      {
        name: "RPS",
        type: "line",
        data: recentStats.map((s) => s.requests_per_second.toFixed(2)),
        smooth: true,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(99, 102, 241, 0.5)" },
              { offset: 1, color: "rgba(99, 102, 241, 0.1)" },
            ],
          },
        },
        itemStyle: { color: "#6366f1" },
      },
    ],
  } : null;

  const responseTimeChartOption = recentStats.length > 0 ? {
    title: {
      text: "Response Time (Live)",
      left: "center",
      textStyle: { fontSize: 14, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["Average", "95th %ile"],
      bottom: 0,
      textStyle: { fontSize: 10 },
    },
    grid: { left: "10%", right: "5%", bottom: "20%", top: "20%", containLabel: true },
    xAxis: {
      type: "category",
      data: recentStats.map((s) => new Date(s.timestamp).toLocaleTimeString()),
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "Time (ms)",
    },
    series: [
      {
        name: "Average",
        type: "line",
        data: recentStats.map((s) => s.avg_response_time.toFixed(2)),
        smooth: true,
        itemStyle: { color: "#3b82f6" },
      },
      {
        name: "95th %ile",
        type: "line",
        data: recentStats.map((s) => s.percentile_95.toFixed(2)),
        smooth: true,
        itemStyle: { color: "#f59e0b" },
      },
    ],
  } : null;

  const failureRateChartOption = recentStats.length > 0 ? {
    title: {
      text: "Failure Rate (Live)",
      left: "center",
      textStyle: { fontSize: 14, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>${data.seriesName}: ${data.value}%`;
      },
    },
    grid: { left: "10%", right: "5%", bottom: "15%", top: "20%", containLabel: true },
    xAxis: {
      type: "category",
      data: recentStats.map((s) => new Date(s.timestamp).toLocaleTimeString()),
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "Rate (%)",
      max: 100,
    },
    series: [
      {
        name: "Failure Rate",
        type: "line",
        data: recentStats.map((s) => s.failure_rate.toFixed(2)),
        smooth: true,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(239, 68, 68, 0.5)" },
              { offset: 1, color: "rgba(239, 68, 68, 0.1)" },
            ],
          },
        },
        itemStyle: { color: "#ef4444" },
      },
    ],
  } : null;

  return (
    <Card className="shadow-xl border-gray-100 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-2">{testRun.test_name}</CardTitle>
            <CardDescription className="text-white/80 text-base">{testRun.project}</CardDescription>
          </div>
          <Badge className="bg-white/20 text-white text-sm px-4 py-2 hover:bg-white/30">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
              RUNNING
            </div>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Current Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="text-xs text-blue-600 font-medium">Current Users</div>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {latestStats?.current_user_count || 0}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <div className="text-xs text-emerald-600 font-medium">RPS</div>
            </div>
            <div className="text-2xl font-bold text-emerald-900">
              {latestStats?.requests_per_second.toFixed(1) || "0.0"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-amber-600" />
              <div className="text-xs text-amber-600 font-medium">Avg Response</div>
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {latestStats?.avg_response_time.toFixed(0) || "0"}ms
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-xs text-red-600 font-medium">Failure Rate</div>
            </div>
            <div className="text-2xl font-bold text-red-900">
              {latestStats?.failure_rate.toFixed(2) || "0.00"}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div className="text-xs text-purple-600 font-medium">Duration</div>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {durationMinutes}:{durationSeconds.toString().padStart(2, "0")}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-gray-600" />
              <div className="text-xs text-gray-600 font-medium">Total Requests</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {latestStats?.total_requests.toLocaleString() || "0"}
            </div>
          </div>
        </div>

        {/* Live Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {rpsChartOption && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <ReactECharts option={rpsChartOption} style={{ height: "250px" }} />
              </CardContent>
            </Card>
          )}

          {responseTimeChartOption && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <ReactECharts option={responseTimeChartOption} style={{ height: "250px" }} />
              </CardContent>
            </Card>
          )}

          {failureRateChartOption && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <ReactECharts option={failureRateChartOption} style={{ height: "250px" }} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Test Info & Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">Target:</span>
              <span className="font-mono text-purple-600">{testRun.host}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Max Users:</span>
              <span className="font-semibold text-blue-600">{testRun.user_count}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Spawn Rate:</span>
              <span className="font-semibold text-emerald-600">{testRun.spawn_rate}/s</span>
            </div>
            {failures && failures.length > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="font-semibold text-red-600">{failures.length} unique errors</span>
              </div>
            )}
          </div>
          <Link
            href={`/test-runs/${testRun.id}`}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
