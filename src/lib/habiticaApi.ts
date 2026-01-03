import { HabiticaResponse, HabiticaUser, HabiticaTask, TaskType } from '@/types/habitica';

const HABITICA_API_BASE = 'https://habitica.com/api/v3';
const CLIENT_ID = 'b8f4e3d2-family-quest-dashboard';

const getHeaders = (userId: string, apiToken: string) => ({
  'Content-Type': 'application/json',
  'x-api-user': userId,
  'x-api-key': apiToken,
  'x-client': CLIENT_ID,
});

export class HabiticaApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HabiticaApiError';
  }
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new HabiticaApiError(
          response.status,
          errorData.message || `API error: ${response.status}`
        );
      }
      
      const data = await response.json() as HabiticaResponse<T>;
      return data.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function getUser(
  userId: string,
  apiToken: string
): Promise<HabiticaUser> {
  return fetchWithRetry<HabiticaUser>(
    `${HABITICA_API_BASE}/user?userFields=profile,stats,items.gear.equipped,items.currentPet,items.currentMount`,
    {
      method: 'GET',
      headers: getHeaders(userId, apiToken),
    }
  );
}

export async function getTasks(
  userId: string,
  apiToken: string,
  type?: TaskType
): Promise<HabiticaTask[]> {
  const url = type
    ? `${HABITICA_API_BASE}/tasks/user?type=${type}`
    : `${HABITICA_API_BASE}/tasks/user`;
    
  return fetchWithRetry<HabiticaTask[]>(url, {
    method: 'GET',
    headers: getHeaders(userId, apiToken),
  });
}

export async function scoreTask(
  userId: string,
  apiToken: string,
  taskId: string,
  direction: 'up' | 'down'
): Promise<any> {
  return fetchWithRetry(
    `${HABITICA_API_BASE}/tasks/${taskId}/score/${direction}`,
    {
      method: 'POST',
      headers: getHeaders(userId, apiToken),
    }
  );
}

export async function createTask(
  userId: string,
  apiToken: string,
  task: Partial<HabiticaTask>
): Promise<HabiticaTask> {
  return fetchWithRetry<HabiticaTask>(`${HABITICA_API_BASE}/tasks/user`, {
    method: 'POST',
    headers: getHeaders(userId, apiToken),
    body: JSON.stringify(task),
  });
}

export async function testConnection(
  userId: string,
  apiToken: string
): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    const user = await getUser(userId, apiToken);
    return { success: true, name: user.profile.name };
  } catch (error) {
    if (error instanceof HabiticaApiError) {
      if (error.status === 401) {
        return { success: false, error: 'Invalid credentials' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Connection failed' };
  }
}
