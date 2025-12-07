import type { TestRun, StatsSnapshot, RequestLog, Failure, RequestStats, EndpointStats, TestLog } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${API_PREFIX}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Network error", 0, error);
  }
}

export const api = {
  testRuns: {
    list: (params?: { skip?: number; limit?: number; project?: string; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip !== undefined) searchParams.set("skip", params.skip.toString());
      if (params?.limit !== undefined) searchParams.set("limit", params.limit.toString());
      if (params?.project) searchParams.set("project", params.project);
      if (params?.status) searchParams.set("status", params.status);

      const query = searchParams.toString();
      return fetchApi<TestRun[]>(`/test-runs${query ? `?${query}` : ""}`);
    },

    get: (id: string) => fetchApi<TestRun>(`/test-runs/${id}`),

    create: (data: Partial<TestRun>) =>
      fetchApi<TestRun>("/test-runs", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<TestRun>) =>
      fetchApi<TestRun>(`/test-runs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  stats: {
    list: (params: { test_run_id: string; skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams({ test_run_id: params.test_run_id });
      if (params?.skip !== undefined) searchParams.set("skip", params.skip.toString());
      if (params?.limit !== undefined) searchParams.set("limit", params.limit.toString());

      return fetchApi<StatsSnapshot[]>(`/stats?${searchParams.toString()}`);
    },

    create: (data: Partial<StatsSnapshot>) =>
      fetchApi<StatsSnapshot>("/stats", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  requests: {
    list: (params: { test_run_id: string; skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams({ test_run_id: params.test_run_id });
      if (params?.skip !== undefined) searchParams.set("skip", params.skip.toString());
      if (params?.limit !== undefined) searchParams.set("limit", params.limit.toString());

      return fetchApi<RequestLog[]>(`/requests?${searchParams.toString()}`);
    },

    stats: (testRunId: string) => {
      return fetchApi<RequestStats>(`/requests/stats/${testRunId}`);
    },

    endpointStats: (testRunId: string) => {
      return fetchApi<EndpointStats[]>(`/requests/stats/${testRunId}/endpoints`);
    },

    batch: (data: Partial<RequestLog>[]) =>
      fetchApi<void>("/requests/batch", {
        method: "POST",
        body: JSON.stringify({ requests: data }),
      }),
  },

  failures: {
    list: (params: { test_run_id: string; skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams({ test_run_id: params.test_run_id });
      if (params?.skip !== undefined) searchParams.set("skip", params.skip.toString());
      if (params?.limit !== undefined) searchParams.set("limit", params.limit.toString());

      return fetchApi<Failure[]>(`/failures?${searchParams.toString()}`);
    },

    create: (data: Partial<Failure>) =>
      fetchApi<Failure>("/failures", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  logs: {
    list: (params: { test_run_id: string; level?: string; skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams({ test_run_id: params.test_run_id });
      if (params?.level) searchParams.set("level", params.level);
      if (params?.skip !== undefined) searchParams.set("skip", params.skip.toString());
      if (params?.limit !== undefined) searchParams.set("limit", params.limit.toString());

      return fetchApi<TestLog[]>(`/logs?${searchParams.toString()}`);
    },

    batch: (data: Partial<TestLog>[]) =>
      fetchApi<void>("/logs/batch", {
        method: "POST",
        body: JSON.stringify({ logs: data }),
      }),
  },
};

export { ApiError };
