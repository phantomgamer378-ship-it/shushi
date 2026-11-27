import { supabase } from "./supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

export interface ApiProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  instance: string;
  errors?: any[];
}

export class ApiError extends Error {
  problem: ApiProblemDetail;
  constructor(problem: ApiProblemDetail) {
    super(problem.detail || problem.title);
    this.problem = problem;
    this.name = "ApiError";
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Get Supabase session JWT or fallback to demo session
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("shushi_demo_token") || undefined;
  }

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let problem: ApiProblemDetail;
    try {
      problem = await response.json();
    } catch {
      problem = {
        type: "https://errors.shushi.io/UNKNOWN_ERROR",
        title: response.statusText || "Request Failed",
        status: response.status,
        detail: "An error occurred while communicating with the server.",
        code: "SERVER_ERROR",
        instance: endpoint,
      };
    }
    throw new ApiError(problem);
  }

  return response.json();
}
