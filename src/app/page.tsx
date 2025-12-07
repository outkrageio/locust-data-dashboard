"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart3, Activity, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: testRuns, isLoading } = useQuery({
    queryKey: ["testRuns", "overview"],
    queryFn: () => api.testRuns.list({ limit: 10 }),
  });

  const totalTests = testRuns?.length || 0;
  const completedTests = testRuns?.filter((tr) => tr.status === "completed").length || 0;
  const runningTests = testRuns?.filter((tr) => tr.status === "running").length || 0;
  const failedTests = testRuns?.filter((tr) => tr.status === "failed").length || 0;

  const recentTests = testRuns?.slice(0, 5) || [];

  function getStatusBadge(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 border">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "running":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 border">
            <Activity className="w-3 h-3 mr-1" />
            Running
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 border">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-300 border">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-gray-600">Monitor your load testing metrics and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tests</CardTitle>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalTests}</div>
            <p className="text-xs text-gray-500 mt-1">All time test runs</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedTests}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully completed</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Running</CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{runningTests}</div>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{failedTests}</div>
            <p className="text-xs text-gray-500 mt-1">Tests with errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Test Runs */}
      <Card className="shadow-xl border-gray-100">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Test Runs</CardTitle>
              <CardDescription>Latest load testing activity</CardDescription>
            </div>
            <Link href="/test-runs">
              <Button variant="outline" size="sm">
                View All
                <TrendingUp className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {recentTests.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No test runs yet</p>
              <p className="text-sm text-gray-400">Start your first load test to see results here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTests.map((testRun) => {
                  const startTime = new Date(testRun.start_time);
                  const endTime = testRun.end_time ? new Date(testRun.end_time) : new Date();
                  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
                  const minutes = Math.floor(duration / 60);
                  const seconds = duration % 60;

                  return (
                    <TableRow key={testRun.id}>
                      <TableCell className="font-medium">{testRun.project}</TableCell>
                      <TableCell>{testRun.test_name}</TableCell>
                      <TableCell>{getStatusBadge(testRun.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{testRun.user_count}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {startTime.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-gray-400" />
                          {minutes}m {seconds}s
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/test-runs/${testRun.id}`}>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-gray-100 hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 p-4 w-fit mb-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <CardTitle>Test Runs</CardTitle>
            <CardDescription>View all test runs and their detailed metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/test-runs">
              <Button className="w-full" variant="outline">
                Go to Test Runs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-gray-100 hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 p-4 w-fit mb-4">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <CardTitle>Live Monitoring</CardTitle>
            <CardDescription>Monitor active tests in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/live">
              <Button className="w-full" variant="outline">
                Go to Live View
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-gray-100 hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-4 w-fit mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <CardTitle>Compare Tests</CardTitle>
            <CardDescription>Compare performance across different test runs</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/compare">
              <Button className="w-full" variant="outline">
                Go to Compare
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
