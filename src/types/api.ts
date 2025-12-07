export interface TestRun {
  id: string;
  project: string;
  test_name: string;
  start_time: string;
  end_time: string | null;
  user_count: number;
  spawn_rate: number;
  host: string;
  status: string;
  test_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface StatsSnapshot {
  id: string;
  test_run_id: string;
  timestamp: string;
  total_requests: number;
  failure_count: number;
  failure_rate: number;
  avg_response_time: number;
  median_response_time: number;
  min_response_time: number;
  max_response_time: number;
  percentile_95: number;
  percentile_99: number;
  requests_per_second: number;
  current_user_count: number;
  created_at: string;
  updated_at: string;
}

export interface RequestLog {
  id: string;
  test_run_id: string;
  request_type: string;
  name: string;
  url: string;
  response_time: number;
  response_length: number;
  success: boolean;
  exception: string | null;
  start_time: string;
  user_id: string | null;
  context: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Failure {
  id: string;
  test_run_id: string;
  request_type: string;
  name: string;
  error_message: string;
  occurrences: number;
  first_occurrence: string;
  last_occurrence: string;
  created_at: string;
  updated_at: string;
}

export interface RequestStats {
  total_requests: number;
  failure_count: number;
  failure_rate: number;
  avg_response_time: number;
  min_response_time: number;
  max_response_time: number;
}

export interface EndpointStats {
  endpoint: string;
  method: string;
  total_requests: number;
  failure_count: number;
  failure_rate: number;
  avg_response_time: number;
  min_response_time: number;
  max_response_time: number;
  std_dev_response_time: number;
}

export interface TestLog {
  id: string;
  test_run_id: string;
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  exception: string | null;
  created_at: string;
  updated_at: string;
}
