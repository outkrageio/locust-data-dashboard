"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TestRun } from "@/types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Clock, Users, Activity } from "lucide-react";

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

export default function TestRunsPage() {
  const { data: testRuns, isLoading, error } = useQuery({
    queryKey: ["testRuns"],
    queryFn: () => api.testRuns.list({ limit: 100 }),
    refetchInterval: 5000, // Refetch every 5 seconds to catch running tests
  });

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Test Runs</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Failed to fetch test runs"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Test Runs
        </h1>
        <p className="text-gray-600 text-lg">View and analyze your Locust load testing results</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 shadow-xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-white/20 p-3">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="text-sm font-medium text-white/80">Total</div>
            </div>
            <div className="text-4xl font-bold text-white">{testRuns?.length || 0}</div>
            <div className="text-sm text-white/80 mt-1">Test Runs</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 shadow-xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-white/20 p-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-sm font-medium text-white/80">Active</div>
            </div>
            <div className="text-4xl font-bold text-white">
              {testRuns?.filter((run) => run.status === "running").length || 0}
            </div>
            <div className="text-sm text-white/80 mt-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              Running Now
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 shadow-xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-white/20 p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-sm font-medium text-white/80">Success</div>
            </div>
            <div className="text-4xl font-bold text-white">
              {testRuns?.filter((run) => run.status === "completed").length || 0}
            </div>
            <div className="text-sm text-white/80 mt-1">Completed</div>
          </div>
        </div>
      </div>

      {/* Test Runs Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900">All Test Runs</h2>
          <p className="text-gray-600 mt-1">Click on a test run to view detailed metrics and charts</p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading test runs...</div>
            </div>
          ) : testRuns && testRuns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Project</TableHead>
                  <TableHead className="font-semibold text-gray-700">Test Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Host</TableHead>
                  <TableHead className="font-semibold text-gray-700">Users</TableHead>
                  <TableHead className="font-semibold text-gray-700">Spawn Rate</TableHead>
                  <TableHead className="font-semibold text-gray-700">Started</TableHead>
                  <TableHead className="font-semibold text-gray-700">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testRuns.map((testRun: TestRun) => {
                  const duration = testRun.end_time
                    ? new Date(testRun.end_time).getTime() -
                      new Date(testRun.start_time).getTime()
                    : Date.now() - new Date(testRun.start_time).getTime();
                  const durationMinutes = Math.floor(duration / 1000 / 60);
                  const durationSeconds = Math.floor((duration / 1000) % 60);

                  return (
                    <TableRow
                      key={testRun.id}
                      className="cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200"
                      onClick={() => (window.location.href = `/test-runs/${testRun.id}`)}
                    >
                      <TableCell>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(testRun.status)}`}>
                          {testRun.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">{testRun.project}</TableCell>
                      <TableCell className="font-medium text-purple-600">{testRun.test_name}</TableCell>
                      <TableCell className="text-sm text-gray-500 font-mono">
                        {testRun.host}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                          <Users className="h-4 w-4" />
                          {testRun.user_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-emerald-600 font-semibold">{testRun.spawn_rate}/s</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(testRun.start_time), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {durationMinutes}m {durationSeconds}s
                        {!testRun.end_time && (
                          <span className="ml-2 text-yellow-600">●</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No test runs found</p>
              <p className="text-sm">Start a Locust test to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
