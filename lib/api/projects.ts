import { apiClient } from '@/lib/api-client';

// --- Types ---

export type ProjectStatus = 'active' | 'paused' | 'stopped';
export type ProjectType = 'web-app' | 'api' | 'ai-model' | 'static-site';

export interface ResourceUsage {
  cpu: number;    // percentage 0-100
  memory: number; // percentage 0-100
  storage: number; // bytes used
  storageLimit: number; // bytes limit
  bandwidth: number; // bytes used this period
}

export interface ManagedProject {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  region: string;
  resources: ResourceUsage;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  type: ProjectType;
  region: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  region?: string;
}

// --- Constants ---

export const PROJECT_TYPES: { value: ProjectType; label: string; description: string }[] = [
  { value: 'web-app', label: 'Web App', description: 'Full-stack web application' },
  { value: 'api', label: 'API', description: 'Backend API service' },
  { value: 'ai-model', label: 'AI Model', description: 'Machine learning model endpoint' },
  { value: 'static-site', label: 'Static Site', description: 'Static HTML/CSS/JS site' },
];

export const REGIONS: { value: string; label: string }[] = [
  { value: 'us-east-1', label: 'US East (Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU West (Ireland)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
];

// --- API Functions ---

const API_BASE = 'https://api.hanzo.ai/v1/projects';

function getAuthHeaders(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const match = document.cookie.match(/(?:^|;\s*)hanzo_token=([^;]*)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function fetchProjects(): Promise<ManagedProject[]> {
  return apiClient.get<ManagedProject[]>(API_BASE, {
    headers: getAuthHeaders(),
  });
}

export async function fetchProject(id: string): Promise<ManagedProject> {
  return apiClient.get<ManagedProject>(`${API_BASE}/${id}`, {
    headers: getAuthHeaders(),
  });
}

export async function createProject(payload: CreateProjectPayload): Promise<ManagedProject> {
  return apiClient.post<ManagedProject>(API_BASE, payload, {
    headers: getAuthHeaders(),
  });
}

export async function updateProject(
  id: string,
  payload: UpdateProjectPayload
): Promise<ManagedProject> {
  return apiClient.patch<ManagedProject>(`${API_BASE}/${id}`, payload, {
    headers: getAuthHeaders(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE}/${id}`, {
    headers: getAuthHeaders(),
  });
}
