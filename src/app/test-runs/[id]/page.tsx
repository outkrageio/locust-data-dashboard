"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Users, Activity, Clock, TrendingUp, AlertCircle, Server, Download, FileJson, FileText, Maximize2 } from "lucide-react";
import Link from "next/link";
import ReactECharts from "echarts-for-react";

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-gradient-to-r from-green-500 to-emerald-600 text-white";
    case "running":
      return "bg-gradient-to-r from-amber-500 to-orange-600 text-white animate-pulse";
    case "failed":
      return "bg-gradient-to-r from-red-500 to-pink-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function getLogLevelBadge(level: string) {
  switch (level.toUpperCase()) {
    case "ERROR":
      return "bg-red-100 text-red-700 border-red-300";
    case "WARNING":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "INFO":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "DEBUG":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

async function downloadReport(testRunId: string, format: "json" | "csv") {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${API_URL}/api/v1/test-runs/${testRunId}/report?format=${format}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download report: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;

    const contentDisposition = response.headers.get("Content-Disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : `test_run_report.${format}`;

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error downloading report:", error);
    alert("Failed to download report. Please try again.");
  }
}

type ChartType = "response_time" | "rps" | "user_count" | "failure_rate" | null;

export default function TestRunDetailsPage() {
  const params = useParams();
  const testRunId = params.id as string;
  const [expandedChart, setExpandedChart] = useState<ChartType>(null);
  const [logLevelFilter, setLogLevelFilter] = useState<string | undefined>(undefined);

  const { data: testRun, isLoading: testRunLoading } = useQuery({
    queryKey: ["testRun", testRunId],
    queryFn: () => api.testRuns.get(testRunId),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats", testRunId],
    queryFn: () => api.stats.list({ test_run_id: testRunId }),
    enabled: !!testRunId,
  });

  const { data: failures } = useQuery({
    queryKey: ["failures", testRunId],
    queryFn: () => api.failures.list({ test_run_id: testRunId }),
    enabled: !!testRunId,
  });

  const { data: requestStats } = useQuery({
    queryKey: ["requestStats", testRunId],
    queryFn: () => api.requests.stats(testRunId),
    enabled: !!testRunId,
  });

  const { data: logs } = useQuery({
    queryKey: ["logs", testRunId, logLevelFilter],
    queryFn: () => api.logs.list({ test_run_id: testRunId, level: logLevelFilter }),
    enabled: !!testRunId,
  });

  const { data: bandwidthStats } = useQuery({
    queryKey: ["bandwidthStats", testRunId],
    queryFn: () => api.requests.bandwidthStats(testRunId),
    enabled: !!testRunId,
  });

  if (testRunLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading test run details...</div>
        </div>
      </div>
    );
  }

  if (!testRun) {
    return (
      <div className="container mx-auto p-8">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Test Run Not Found</CardTitle>
            <CardDescription>The requested test run could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const duration = testRun.end_time
    ? new Date(testRun.end_time).getTime() - new Date(testRun.start_time).getTime()
    : Date.now() - new Date(testRun.start_time).getTime();
  const durationMinutes = Math.floor(duration / 1000 / 60);
  const durationSeconds = Math.floor((duration / 1000) % 60);

  // Prepare chart data
  const responseTimeChartOption = stats && stats.length > 0 ? {
    title: {
      text: "Response Time Over Time",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
    },
    legend: {
      data: ["Average", "Median", "95th Percentile", "99th Percentile"],
      bottom: 0,
    },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: stats.map((s) => new Date(s.timestamp).toLocaleTimeString()),
      axisLabel: { rotate: 45 },
    },
    yAxis: {
      type: "value",
      name: "Response Time (ms)",
    },
    series: [
      {
        name: "Average",
        type: "line",
        data: stats.map((s) => s.avg_response_time.toFixed(2)),
        smooth: true,
        itemStyle: { color: "#3b82f6" },
      },
      {
        name: "Median",
        type: "line",
        data: stats.map((s) => s.median_response_time.toFixed(2)),
        smooth: true,
        itemStyle: { color: "#10b981" },
      },
      {
        name: "95th Percentile",
        type: "line",
        data: stats.map((s) => s.percentile_95.toFixed(2)),
        smooth: true,
        itemStyle: { color: "#f59e0b" },
      },
      {
        name: "99th Percentile",
        type: "line",
        data: stats.map((s) => s.percentile_99.toFixed(2)),
        smooth: true,
        itemStyle: { color: "#ef4444" },
      },
    ],
  } : null;

  const rpsChartOption = stats && stats.length > 0 ? {
    title: {
      text: "Requests Per Second",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
    },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: stats.map((s) => new Date(s.timestamp).toLocaleTimeString()),
      axisLabel: { rotate: 45 },
    },
    yAxis: {
      type: "value",
      name: "RPS",
    },
    series: [
      {
        name: "Requests/sec",
        type: "line",
        data: stats.map((s) => s.requests_per_second.toFixed(2)),
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

  const userCountChartOption = stats && stats.length > 0 ? {
    title: {
      text: "Active Users Over Time",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
    },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: stats.map((s) => new Date(s.timestamp).toLocaleTimeString()),
      axisLabel: { rotate: 45 },
    },
    yAxis: {
      type: "value",
      name: "Users",
    },
    series: [
      {
        name: "Active Users",
        type: "line",
        data: stats.map((s) => s.current_user_count),
        smooth: true,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(16, 185, 129, 0.5)" },
              { offset: 1, color: "rgba(16, 185, 129, 0.1)" },
            ],
          },
        },
        itemStyle: { color: "#10b981" },
      },
    ],
  } : null;

  const failureRateChartOption = stats && stats.length > 0 ? {
    title: {
      text: "Failure Rate Over Time",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>${data.seriesName}: ${data.value}%`;
      },
    },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: stats.map((s) => new Date(s.timestamp).toLocaleTimeString()),
      axisLabel: { rotate: 45 },
    },
    yAxis: {
      type: "value",
      name: "Failure Rate (%)",
      max: 100,
    },
    series: [
      {
        name: "Failure Rate",
        type: "line",
        data: stats.map((s) => s.failure_rate.toFixed(2)),
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

  const requestStatsChartOption = requestStats && requestStats.length > 0 ? {
    title: {
      text: "Request Distribution",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} requests ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: requestStats.map((stat) => ({
          value: stat.total_requests,
          name: `${stat.method} ${stat.endpoint}`,
        })),
      },
    ],
  } : null;

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/test-runs"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Test Runs
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {testRun.test_name}
            </h1>
            <p className="text-gray-600 text-lg">{testRun.project}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReport(testRunId, "json")}
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReport(testRunId, "csv")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              CSV
            </Button>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(testRun.status)}`}>
              {testRun.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 shadow-xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-white opacity-80" />
            </div>
            <div className="text-3xl font-bold text-white">{testRun.user_count}</div>
            <div className="text-sm text-white/80 mt-1">Users</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-white opacity-80" />
            </div>
            <div className="text-3xl font-bold text-white">{testRun.spawn_rate}/s</div>
            <div className="text-sm text-white/80 mt-1">Spawn Rate</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 shadow-xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-white opacity-80" />
            </div>
            <div className="text-3xl font-bold text-white">
              {durationMinutes}:{durationSeconds.toString().padStart(2, "0")}
            </div>
            <div className="text-sm text-white/80 mt-1">Duration</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 shadow-xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Server className="h-8 w-8 text-white opacity-80" />
            </div>
            <div className="text-xl font-bold text-white truncate">{new URL(testRun.host).hostname}</div>
            <div className="text-sm text-white/80 mt-1">Target Host</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {responseTimeChartOption && (
          <Card className="shadow-xl border-gray-100">
            <CardContent className="p-6 relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => setExpandedChart("response_time")}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <ReactECharts option={responseTimeChartOption} style={{ height: "400px" }} />
            </CardContent>
          </Card>
        )}

        {rpsChartOption && (
          <Card className="shadow-xl border-gray-100">
            <CardContent className="p-6 relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => setExpandedChart("rps")}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <ReactECharts option={rpsChartOption} style={{ height: "400px" }} />
            </CardContent>
          </Card>
        )}

        {userCountChartOption && (
          <Card className="shadow-xl border-gray-100">
            <CardContent className="p-6 relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => setExpandedChart("user_count")}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <ReactECharts option={userCountChartOption} style={{ height: "400px" }} />
            </CardContent>
          </Card>
        )}

        {failureRateChartOption && (
          <Card className="shadow-xl border-gray-100">
            <CardContent className="p-6 relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => setExpandedChart("failure_rate")}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <ReactECharts option={failureRateChartOption} style={{ height: "400px" }} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Request Stats */}
      {requestStatsChartOption && (
        <Card className="shadow-xl border-gray-100 mb-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <CardTitle>Request Distribution</CardTitle>
            <CardDescription>Breakdown of requests by endpoint</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ReactECharts option={requestStatsChartOption} style={{ height: "400px" }} />
          </CardContent>
        </Card>
      )}

      {/* Failures Table */}
      {failures && failures.length > 0 && (
        <Card className="shadow-xl border-gray-100">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Failures ({failures.length})
            </CardTitle>
            <CardDescription>Error details and occurrences</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-700">Request</TableHead>
                  <TableHead className="font-semibold text-gray-700">Error Message</TableHead>
                  <TableHead className="font-semibold text-gray-700">Occurrences</TableHead>
                  <TableHead className="font-semibold text-gray-700">First Seen</TableHead>
                  <TableHead className="font-semibold text-gray-700">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failures.map((failure) => (
                  <TableRow key={failure.id}>
                    <TableCell className="font-medium">
                      <span className="text-purple-600">{failure.request_type}</span>{" "}
                      <span className="text-gray-600">{failure.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 text-sm">{failure.error_message}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-700">{failure.occurrences}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(failure.first_occurrence), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(failure.last_occurrence), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Test Logs */}
      {logs && logs.length > 0 && (
        <Card className="shadow-xl border-gray-100 mt-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Test Logs</CardTitle>
                <CardDescription>Captured logs from the test run</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={logLevelFilter === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLogLevelFilter(undefined)}
                >
                  All
                </Button>
                <Button
                  variant={logLevelFilter === "ERROR" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLogLevelFilter("ERROR")}
                >
                  Error
                </Button>
                <Button
                  variant={logLevelFilter === "WARNING" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLogLevelFilter("WARNING")}
                >
                  Warning
                </Button>
                <Button
                  variant={logLevelFilter === "INFO" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLogLevelFilter("INFO")}
                >
                  Info
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Logger</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className={log.exception ? "bg-red-50" : ""}>
                    <TableCell>
                      <Badge className={`${getLogLevelBadge(log.level)} border`}>
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 font-mono">
                      {log.logger}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-gray-900">{log.message}</div>
                        {log.exception && (
                          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                            {log.exception}
                          </pre>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Bandwidth/Network Stats */}
      {bandwidthStats && bandwidthStats.total_bytes > 0 && (
        <Card className="shadow-xl border-gray-100 mt-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <CardTitle>Network & Bandwidth</CardTitle>
            <CardDescription>Data transfer statistics for this test run</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="text-sm text-gray-500 uppercase tracking-wide">Total Data</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {bandwidthStats.total_gb > 0.1
                    ? `${bandwidthStats.total_gb} GB`
                    : `${bandwidthStats.total_mb} MB`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {bandwidthStats.total_bytes.toLocaleString()} bytes
                </div>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <div className="text-sm text-gray-500 uppercase tracking-wide">Avg Per Request</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {(bandwidthStats.avg_bytes_per_request / 1024).toFixed(2)} KB
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {bandwidthStats.avg_bytes_per_request.toFixed(0)} bytes
                </div>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4">
                <div className="text-sm text-gray-500 uppercase tracking-wide">Total Requests</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {bandwidthStats.total_requests.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">with response data</div>
              </div>

              <div className="border-l-4 border-amber-500 pl-4">
                <div className="text-sm text-gray-500 uppercase tracking-wide">Data/Request Ratio</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {bandwidthStats.total_requests > 0
                    ? ((bandwidthStats.total_bytes / bandwidthStats.total_requests / 1024) | 0)
                    : 0}{" "}
                  KB
                </div>
                <div className="text-xs text-gray-400 mt-1">average transfer</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Metadata */}
      {testRun.test_metadata && (
        <Card className="shadow-xl border-gray-100 mt-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <CardTitle>Test Metadata</CardTitle>
            <CardDescription>Additional test configuration details</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(testRun.test_metadata).map(([key, value]) => (
                <div key={key} className="border-l-4 border-purple-500 pl-4">
                  <div className="text-sm text-gray-500 capitalize">{key.replace(/_/g, " ")}</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded Chart Modals */}
      <Dialog open={expandedChart === "response_time"} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="w-[95vw] max-w-[1400px]">
          <DialogHeader onClose={() => setExpandedChart(null)}>
            <DialogTitle>Response Time Over Time</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {responseTimeChartOption && (
              <ReactECharts option={responseTimeChartOption} style={{ height: "700px", width: "100%" }} />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={expandedChart === "rps"} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="w-[95vw] max-w-[1400px]">
          <DialogHeader onClose={() => setExpandedChart(null)}>
            <DialogTitle>Requests Per Second</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {rpsChartOption && (
              <ReactECharts option={rpsChartOption} style={{ height: "700px", width: "100%" }} />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={expandedChart === "user_count"} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="w-[95vw] max-w-[1400px]">
          <DialogHeader onClose={() => setExpandedChart(null)}>
            <DialogTitle>Active Users Over Time</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {userCountChartOption && (
              <ReactECharts option={userCountChartOption} style={{ height: "700px", width: "100%" }} />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={expandedChart === "failure_rate"} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="w-[95vw] max-w-[1400px]">
          <DialogHeader onClose={() => setExpandedChart(null)}>
            <DialogTitle>Failure Rate Over Time</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {failureRateChartOption && (
              <ReactECharts option={failureRateChartOption} style={{ height: "700px", width: "100%" }} />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
