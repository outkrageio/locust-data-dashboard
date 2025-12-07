"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TestRun } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCompare, TrendingUp, TrendingDown, Minus } from "lucide-react";
import ReactECharts from "echarts-for-react";

export default function ComparePage() {
  const [selectedTest1, setSelectedTest1] = useState<string>("");
  const [selectedTest2, setSelectedTest2] = useState<string>("");

  const { data: testRuns } = useQuery({
    queryKey: ["testRuns"],
    queryFn: () => api.testRuns.list({ limit: 100 }),
  });

  const { data: test1 } = useQuery({
    queryKey: ["testRun", selectedTest1],
    queryFn: () => api.testRuns.get(selectedTest1),
    enabled: !!selectedTest1,
  });

  const { data: test2 } = useQuery({
    queryKey: ["testRun", selectedTest2],
    queryFn: () => api.testRuns.get(selectedTest2),
    enabled: !!selectedTest2,
  });

  const { data: stats1 } = useQuery({
    queryKey: ["stats", selectedTest1],
    queryFn: () => api.stats.list({ test_run_id: selectedTest1 }),
    enabled: !!selectedTest1,
  });

  const { data: stats2 } = useQuery({
    queryKey: ["stats", selectedTest2],
    queryFn: () => api.stats.list({ test_run_id: selectedTest2 }),
    enabled: !!selectedTest2,
  });

  const completedTests = testRuns?.filter((run) => run.status === "completed") || [];

  // Calculate average metrics
  const getAverageMetrics = (stats: any[]) => {
    if (!stats || stats.length === 0) return null;
    const total = stats.reduce(
      (acc, stat) => ({
        avgResponse: acc.avgResponse + stat.avg_response_time,
        rps: acc.rps + stat.requests_per_second,
        failureRate: acc.failureRate + stat.failure_rate,
        p95: acc.p95 + stat.percentile_95,
      }),
      { avgResponse: 0, rps: 0, failureRate: 0, p95: 0 }
    );
    return {
      avgResponse: total.avgResponse / stats.length,
      rps: total.rps / stats.length,
      failureRate: total.failureRate / stats.length,
      p95: total.p95 / stats.length,
    };
  };

  const metrics1 = getAverageMetrics(stats1 || []);
  const metrics2 = getAverageMetrics(stats2 || []);

  // Comparison chart
  const comparisonChartOption =
    metrics1 && metrics2
      ? {
          title: {
            text: "Performance Comparison",
            left: "center",
            textStyle: { fontSize: 18, fontWeight: "bold" },
          },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
          },
          legend: {
            data: [test1?.test_name || "Test 1", test2?.test_name || "Test 2"],
            bottom: 0,
          },
          grid: { left: "3%", right: "4%", bottom: "15%", top: "15%", containLabel: true },
          xAxis: {
            type: "category",
            data: ["Avg Response Time (ms)", "RPS", "Failure Rate (%)", "95th Percentile (ms)"],
            axisLabel: { rotate: 15, fontSize: 11 },
          },
          yAxis: {
            type: "value",
          },
          series: [
            {
              name: test1?.test_name || "Test 1",
              type: "bar",
              data: [
                metrics1.avgResponse.toFixed(2),
                metrics1.rps.toFixed(2),
                metrics1.failureRate.toFixed(2),
                metrics1.p95.toFixed(2),
              ],
              itemStyle: { color: "#6366f1" },
            },
            {
              name: test2?.test_name || "Test 2",
              type: "bar",
              data: [
                metrics2.avgResponse.toFixed(2),
                metrics2.rps.toFixed(2),
                metrics2.failureRate.toFixed(2),
                metrics2.p95.toFixed(2),
              ],
              itemStyle: { color: "#10b981" },
            },
          ],
        }
      : null;

  // Response time over time comparison
  const responseTimeComparisonOption =
    stats1 && stats2 && stats1.length > 0 && stats2.length > 0
      ? {
          title: {
            text: "Response Time Comparison",
            left: "center",
            textStyle: { fontSize: 16, fontWeight: "bold" },
          },
          tooltip: {
            trigger: "axis",
          },
          legend: {
            data: [test1?.test_name || "Test 1", test2?.test_name || "Test 2"],
            bottom: 0,
          },
          grid: { left: "3%", right: "4%", bottom: "15%", top: "15%", containLabel: true },
          xAxis: {
            type: "category",
            data: stats1.map((_, i) => `T+${i * 10}s`),
            axisLabel: { rotate: 45 },
          },
          yAxis: {
            type: "value",
            name: "Response Time (ms)",
          },
          series: [
            {
              name: test1?.test_name || "Test 1",
              type: "line",
              data: stats1.map((s) => s.avg_response_time.toFixed(2)),
              smooth: true,
              itemStyle: { color: "#6366f1" },
            },
            {
              name: test2?.test_name || "Test 2",
              type: "line",
              data: stats2.map((s) => s.avg_response_time.toFixed(2)),
              smooth: true,
              itemStyle: { color: "#10b981" },
            },
          ],
        }
      : null;

  const getDifference = (val1: number, val2: number, lowerIsBetter: boolean = true) => {
    const diff = ((val2 - val1) / val1) * 100;
    const isImprovement = lowerIsBetter ? diff < 0 : diff > 0;
    return { diff: Math.abs(diff), isImprovement };
  };

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Compare Test Runs
        </h1>
        <p className="text-gray-600 text-lg">Side-by-side comparison of test results</p>
      </div>

      {/* Test Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-xl border-gray-100">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardTitle>Test Run 1</CardTitle>
            <CardDescription className="text-white/80">Select first test to compare</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <select
              value={selectedTest1}
              onChange={(e) => setSelectedTest1(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a test...</option>
              {completedTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.test_name} - {test.project} ({new Date(test.start_time).toLocaleDateString()})
                </option>
              ))}
            </select>
            {test1 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Project:</span>
                  <span className="font-semibold">{test1.project}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Users:</span>
                  <span className="font-semibold text-purple-600">{test1.user_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spawn Rate:</span>
                  <span className="font-semibold text-purple-600">{test1.spawn_rate}/s</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl border-gray-100">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardTitle>Test Run 2</CardTitle>
            <CardDescription className="text-white/80">Select second test to compare</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <select
              value={selectedTest2}
              onChange={(e) => setSelectedTest2(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select a test...</option>
              {completedTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.test_name} - {test.project} ({new Date(test.start_time).toLocaleDateString()})
                </option>
              ))}
            </select>
            {test2 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Project:</span>
                  <span className="font-semibold">{test2.project}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Users:</span>
                  <span className="font-semibold text-emerald-600">{test2.user_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spawn Rate:</span>
                  <span className="font-semibold text-emerald-600">{test2.spawn_rate}/s</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Results */}
      {selectedTest1 && selectedTest2 && metrics1 && metrics2 ? (
        <>
          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Average Response Time */}
            <Card className="shadow-xl border-gray-100">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-2">Avg Response Time</div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-2xl font-bold text-purple-600">{metrics1.avgResponse.toFixed(0)}ms</div>
                  <GitCompare className="h-5 w-5 text-gray-400" />
                  <div className="text-2xl font-bold text-emerald-600">{metrics2.avgResponse.toFixed(0)}ms</div>
                </div>
                {(() => {
                  const { diff, isImprovement } = getDifference(metrics1.avgResponse, metrics2.avgResponse, true);
                  return (
                    <div className="flex items-center gap-1">
                      {isImprovement ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : diff === 0 ? (
                        <Minus className="h-4 w-4 text-gray-400" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-semibold ${isImprovement ? "text-green-600" : diff === 0 ? "text-gray-600" : "text-red-600"}`}>
                        {diff.toFixed(1)}% {isImprovement ? "faster" : diff === 0 ? "same" : "slower"}
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* RPS */}
            <Card className="shadow-xl border-gray-100">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-2">Requests Per Second</div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-2xl font-bold text-purple-600">{metrics1.rps.toFixed(1)}</div>
                  <GitCompare className="h-5 w-5 text-gray-400" />
                  <div className="text-2xl font-bold text-emerald-600">{metrics2.rps.toFixed(1)}</div>
                </div>
                {(() => {
                  const { diff, isImprovement } = getDifference(metrics1.rps, metrics2.rps, false);
                  return (
                    <div className="flex items-center gap-1">
                      {isImprovement ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : diff === 0 ? (
                        <Minus className="h-4 w-4 text-gray-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-semibold ${isImprovement ? "text-green-600" : diff === 0 ? "text-gray-600" : "text-red-600"}`}>
                        {diff.toFixed(1)}% {isImprovement ? "more" : diff === 0 ? "same" : "less"}
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Failure Rate */}
            <Card className="shadow-xl border-gray-100">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-2">Failure Rate</div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-2xl font-bold text-purple-600">{metrics1.failureRate.toFixed(2)}%</div>
                  <GitCompare className="h-5 w-5 text-gray-400" />
                  <div className="text-2xl font-bold text-emerald-600">{metrics2.failureRate.toFixed(2)}%</div>
                </div>
                {(() => {
                  const { diff, isImprovement } = getDifference(
                    metrics1.failureRate || 0.01,
                    metrics2.failureRate || 0.01,
                    true
                  );
                  return (
                    <div className="flex items-center gap-1">
                      {isImprovement ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : diff === 0 || (metrics1.failureRate === 0 && metrics2.failureRate === 0) ? (
                        <Minus className="h-4 w-4 text-gray-400" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-semibold ${isImprovement ? "text-green-600" : diff === 0 ? "text-gray-600" : "text-red-600"}`}>
                        {diff.toFixed(1)}% {isImprovement ? "better" : diff === 0 ? "same" : "worse"}
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* 95th Percentile */}
            <Card className="shadow-xl border-gray-100">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-2">95th Percentile</div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-2xl font-bold text-purple-600">{metrics1.p95.toFixed(0)}ms</div>
                  <GitCompare className="h-5 w-5 text-gray-400" />
                  <div className="text-2xl font-bold text-emerald-600">{metrics2.p95.toFixed(0)}ms</div>
                </div>
                {(() => {
                  const { diff, isImprovement } = getDifference(metrics1.p95, metrics2.p95, true);
                  return (
                    <div className="flex items-center gap-1">
                      {isImprovement ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : diff === 0 ? (
                        <Minus className="h-4 w-4 text-gray-400" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-semibold ${isImprovement ? "text-green-600" : diff === 0 ? "text-gray-600" : "text-red-600"}`}>
                        {diff.toFixed(1)}% {isImprovement ? "faster" : diff === 0 ? "same" : "slower"}
                      </span>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {comparisonChartOption && (
              <Card className="shadow-xl border-gray-100">
                <CardContent className="p-6">
                  <ReactECharts option={comparisonChartOption} style={{ height: "400px" }} />
                </CardContent>
              </Card>
            )}

            {responseTimeComparisonOption && (
              <Card className="shadow-xl border-gray-100">
                <CardContent className="p-6">
                  <ReactECharts option={responseTimeComparisonOption} style={{ height: "400px" }} />
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        <Card className="shadow-xl border-gray-100">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <GitCompare className="h-16 w-16 mb-4 text-gray-400" />
              <p className="text-xl font-medium">Select Two Tests to Compare</p>
              <p className="text-sm mt-2">Choose completed test runs from the dropdowns above to see a detailed comparison</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
