"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TestRun } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GitCompare, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from "lucide-react";
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

  const { data: endpointStats1 } = useQuery({
    queryKey: ["endpointStats", selectedTest1],
    queryFn: () => api.requests.endpointStats(selectedTest1),
    enabled: !!selectedTest1,
  });

  const { data: endpointStats2 } = useQuery({
    queryKey: ["endpointStats", selectedTest2],
    queryFn: () => api.requests.endpointStats(selectedTest2),
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

  // Regression detection thresholds
  const REGRESSION_THRESHOLDS = {
    response_time: { warning: 10, critical: 25 }, // % increase
    failure_rate: { warning: 5, critical: 15 }, // % increase
    requests: { warning: 10, critical: 25 }, // % decrease
  };

  // Statistical significance parameters
  const MIN_SAMPLE_SIZE = 30; // Minimum requests for statistical significance
  const SIGNIFICANCE_LEVEL = 0.05; // p-value threshold (95% confidence)

  type RegressionSeverity = "none" | "improvement" | "warning" | "critical" | "insignificant";

  // Welch's t-test for unequal variances
  const welchTTest = (
    mean1: number,
    stdDev1: number,
    n1: number,
    mean2: number,
    stdDev2: number,
    n2: number
  ): number => {
    // Handle edge cases
    if (n1 < 2 || n2 < 2) return 1; // Not enough data
    if (stdDev1 === 0 && stdDev2 === 0) return mean1 === mean2 ? 1 : 0; // No variance

    // Calculate t-statistic
    const variance1 = stdDev1 * stdDev1;
    const variance2 = stdDev2 * stdDev2;
    const pooledSE = Math.sqrt(variance1 / n1 + variance2 / n2);

    if (pooledSE === 0) return mean1 === mean2 ? 1 : 0; // No pooled error

    const tStat = Math.abs((mean1 - mean2) / pooledSE);

    // Calculate degrees of freedom (Welch-Satterthwaite equation)
    const numerator = Math.pow(variance1 / n1 + variance2 / n2, 2);
    const denominator =
      Math.pow(variance1 / n1, 2) / (n1 - 1) + Math.pow(variance2 / n2, 2) / (n2 - 1);
    const df = numerator / denominator;

    // Approximate p-value using t-distribution
    // For simplicity, use a rough approximation
    // For df > 30, t-distribution approximates normal distribution
    // p-value ≈ 2 * (1 - Φ(|t|)) where Φ is the standard normal CDF
    // Using rough approximation: p ≈ e^(-t²/2) for large t
    if (df > 30) {
      // Normal approximation
      const p = 2 * (1 - normalCDF(tStat));
      return p;
    } else {
      // For small df, use a conservative estimate
      // This is a simplified approximation
      const p = 2 * Math.exp(-0.717 * tStat - 0.416 * tStat * tStat);
      return Math.min(1, p);
    }
  };

  // Standard normal cumulative distribution function
  const normalCDF = (x: number): number => {
    // Approximation using error function
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  };

  const detectRegression = (
    metric: "response_time" | "failure_rate" | "requests",
    val1: number,
    val2: number,
    stdDev1: number = 0,
    stdDev2: number = 0,
    n1: number = 0,
    n2: number = 0
  ): RegressionSeverity => {
    if (val1 === 0) return "none";

    // Check minimum sample size
    if (n1 < MIN_SAMPLE_SIZE || n2 < MIN_SAMPLE_SIZE) {
      return "insignificant";
    }

    const percentChange = ((val2 - val1) / val1) * 100;
    const threshold = REGRESSION_THRESHOLDS[metric];

    // Perform t-test for statistical significance
    const pValue = welchTTest(val1, stdDev1, n1, val2, stdDev2, n2);
    const isSignificant = pValue < SIGNIFICANCE_LEVEL;

    // If not statistically significant, mark as insignificant regardless of threshold
    if (!isSignificant) {
      return "insignificant";
    }

    // If significant, check thresholds
    if (metric === "requests") {
      // For requests, lower is bad
      if (percentChange < -threshold.critical) return "critical";
      if (percentChange < -threshold.warning) return "warning";
      if (percentChange > threshold.warning) return "improvement";
    } else {
      // For response_time and failure_rate, higher is bad
      if (percentChange > threshold.critical) return "critical";
      if (percentChange > threshold.warning) return "warning";
      if (percentChange < -threshold.warning) return "improvement";
    }

    return "none";
  };

  const getSeverityBadge = (severity: RegressionSeverity) => {
    switch (severity) {
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Info className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        );
      case "improvement":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Improved
          </Badge>
        );
      case "insignificant":
        return (
          <Badge className="bg-gray-100 text-gray-600 border-gray-300">
            <Minus className="h-3 w-3 mr-1" />
            Not Significant
          </Badge>
        );
      default:
        return null;
    }
  };

  // Merge endpoint stats from both tests for comparison
  const mergeEndpointStats = () => {
    if (!endpointStats1 || !endpointStats2) return [];

    const allEndpoints = new Set([
      ...endpointStats1.map((s) => `${s.method} ${s.endpoint}`),
      ...endpointStats2.map((s) => `${s.method} ${s.endpoint}`),
    ]);

    return Array.from(allEndpoints).map((key) => {
      const [method, ...endpointParts] = key.split(" ");
      const endpoint = endpointParts.join(" ");
      const stats1 = endpointStats1.find((s) => s.method === method && s.endpoint === endpoint);
      const stats2 = endpointStats2.find((s) => s.method === method && s.endpoint === endpoint);

      const avgResponseTime1 = stats1?.avg_response_time || 0;
      const avgResponseTime2 = stats2?.avg_response_time || 0;
      const stdDev1 = stats1?.std_dev_response_time || 0;
      const stdDev2 = stats2?.std_dev_response_time || 0;
      const failureRate1 = stats1?.failure_rate || 0;
      const failureRate2 = stats2?.failure_rate || 0;
      const requests1 = stats1?.total_requests || 0;
      const requests2 = stats2?.total_requests || 0;

      // For failure rate, we need to calculate std dev from binomial distribution
      // std_dev = sqrt(p * (1-p) / n) where p is the failure rate
      const failureStdDev1 = requests1 > 0 ? Math.sqrt((failureRate1 / 100) * (1 - failureRate1 / 100) / requests1) * 100 : 0;
      const failureStdDev2 = requests2 > 0 ? Math.sqrt((failureRate2 / 100) * (1 - failureRate2 / 100) / requests2) * 100 : 0;

      const responseSeverity = detectRegression(
        "response_time",
        avgResponseTime1,
        avgResponseTime2,
        stdDev1,
        stdDev2,
        requests1,
        requests2
      );
      const failureSeverity = detectRegression(
        "failure_rate",
        failureRate1,
        failureRate2,
        failureStdDev1,
        failureStdDev2,
        requests1,
        requests2
      );
      const requestsSeverity = detectRegression(
        "requests",
        requests1,
        requests2,
        0, // No std dev for count comparison
        0,
        requests1,
        requests2
      );

      const worstSeverity = ["critical", "warning", "insignificant", "improvement", "none"].find((sev) =>
        [responseSeverity, failureSeverity, requestsSeverity].includes(sev as RegressionSeverity)
      ) as RegressionSeverity;

      return {
        endpoint,
        method,
        stats1,
        stats2,
        responseSeverity,
        failureSeverity,
        requestsSeverity,
        worstSeverity,
      };
    }).sort((a, b) => {
      // Sort by severity: critical > warning > none > insignificant > improvement
      const severityOrder = { critical: 0, warning: 1, none: 2, insignificant: 3, improvement: 4 };
      return severityOrder[a.worstSeverity] - severityOrder[b.worstSeverity];
    });
  };

  const endpointComparisons = mergeEndpointStats();

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

          {/* Per-Endpoint Comparison */}
          {endpointComparisons.length > 0 && (
            <Card className="shadow-xl border-gray-100">
              <CardHeader>
                <CardTitle className="text-2xl">Per-Endpoint Performance Comparison</CardTitle>
                <CardDescription>
                  Detailed comparison of each endpoint with automatic regression detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold">Endpoint</TableHead>
                        <TableHead className="font-bold">Method</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold text-right">Avg Response Time</TableHead>
                        <TableHead className="font-bold text-right">Failure Rate</TableHead>
                        <TableHead className="font-bold text-right">Total Requests</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {endpointComparisons.map((comparison, idx) => {
                        const { stats1, stats2, responseSeverity, failureSeverity, requestsSeverity, worstSeverity } =
                          comparison;

                        const responseTime1 = stats1?.avg_response_time || 0;
                        const responseTime2 = stats2?.avg_response_time || 0;
                        const failureRate1 = stats1?.failure_rate || 0;
                        const failureRate2 = stats2?.failure_rate || 0;
                        const requests1 = stats1?.total_requests || 0;
                        const requests2 = stats2?.total_requests || 0;

                        const responseChange = responseTime1 > 0 ? ((responseTime2 - responseTime1) / responseTime1) * 100 : 0;
                        const failureChange = failureRate1 > 0 ? ((failureRate2 - failureRate1) / failureRate1) * 100 : 0;
                        const requestsChange = requests1 > 0 ? ((requests2 - requests1) / requests1) * 100 : 0;

                        return (
                          <TableRow
                            key={idx}
                            className={
                              worstSeverity === "critical"
                                ? "bg-red-50"
                                : worstSeverity === "warning"
                                ? "bg-yellow-50"
                                : worstSeverity === "improvement"
                                ? "bg-green-50"
                                : worstSeverity === "insignificant"
                                ? "bg-gray-50"
                                : ""
                            }
                          >
                            <TableCell className="font-medium max-w-xs truncate" title={comparison.endpoint}>
                              {comparison.endpoint}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {comparison.method}
                              </Badge>
                            </TableCell>
                            <TableCell>{getSeverityBadge(worstSeverity)}</TableCell>
                            <TableCell className="text-right">
                              <div className="space-y-1">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-purple-600 font-semibold">{responseTime1.toFixed(0)}ms</span>
                                  <GitCompare className="h-3 w-3 text-gray-400" />
                                  <span className="text-emerald-600 font-semibold">{responseTime2.toFixed(0)}ms</span>
                                </div>
                                {responseTime1 > 0 && (
                                  <div
                                    className={`text-xs flex items-center justify-end gap-1 ${
                                      responseSeverity === "critical"
                                        ? "text-red-600"
                                        : responseSeverity === "warning"
                                        ? "text-yellow-600"
                                        : responseSeverity === "improvement"
                                        ? "text-green-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {responseChange > 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : responseChange < 0 ? (
                                      <TrendingDown className="h-3 w-3" />
                                    ) : (
                                      <Minus className="h-3 w-3" />
                                    )}
                                    {Math.abs(responseChange).toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="space-y-1">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-purple-600 font-semibold">{failureRate1.toFixed(2)}%</span>
                                  <GitCompare className="h-3 w-3 text-gray-400" />
                                  <span className="text-emerald-600 font-semibold">{failureRate2.toFixed(2)}%</span>
                                </div>
                                {failureRate1 > 0 && (
                                  <div
                                    className={`text-xs flex items-center justify-end gap-1 ${
                                      failureSeverity === "critical"
                                        ? "text-red-600"
                                        : failureSeverity === "warning"
                                        ? "text-yellow-600"
                                        : failureSeverity === "improvement"
                                        ? "text-green-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {failureChange > 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : failureChange < 0 ? (
                                      <TrendingDown className="h-3 w-3" />
                                    ) : (
                                      <Minus className="h-3 w-3" />
                                    )}
                                    {Math.abs(failureChange).toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="space-y-1">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-purple-600 font-semibold">{requests1}</span>
                                  <GitCompare className="h-3 w-3 text-gray-400" />
                                  <span className="text-emerald-600 font-semibold">{requests2}</span>
                                </div>
                                {requests1 > 0 && (
                                  <div
                                    className={`text-xs flex items-center justify-end gap-1 ${
                                      requestsSeverity === "critical"
                                        ? "text-red-600"
                                        : requestsSeverity === "warning"
                                        ? "text-yellow-600"
                                        : requestsSeverity === "improvement"
                                        ? "text-green-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {requestsChange > 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : requestsChange < 0 ? (
                                      <TrendingDown className="h-3 w-3" />
                                    ) : (
                                      <Minus className="h-3 w-3" />
                                    )}
                                    {Math.abs(requestsChange).toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
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
