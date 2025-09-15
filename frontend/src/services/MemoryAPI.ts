import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod';

class MemoryAPI {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get authentication session
    const session = await fetchAuthSession();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get detailed memories for a specific user
  static async getUserMemories(userId: string) {
    return this.request<{
      user_id: string;
      traits: Record<string, {
        value: string;
        confidence: number;
        updated_at: string;
      }>;
      dream_patterns: {
        symbols: Record<string, {
          frequency: number;
          first_seen: string;
          last_seen: string;
        }>;
        themes: Record<string, {
          frequency: number;
          first_seen: string;
          last_seen: string;
        }>;
        emotions: Record<string, {
          frequency: number;
          first_seen: string;
          last_seen: string;
        }>;
      };
      personal_context: {
        life_events: Array<{
          id: string;
          value: string;
          importance: string;
          source: string;
          created_at: string;
        }>;
        goals: Array<{
          id: string;
          value: string;
          importance: string;
          source: string;
          created_at: string;
        }>;
      };
      memories: Array<{
        id: string;
        content: string;
        type: string;
        importance: string;
        tags: string[];
        created_at: string;
      }>;
      created_at: string;
      last_updated: string;
    }>(`/api/memories/user/${userId}`);
  }

  // Get user memory summary
  static async getUserMemorySummary(userId: string) {
    return this.request<{ summary: string }>(`/api/memories/user/${userId}/summary`);
  }

  // Add or update a user trait
  static async addTrait(userId: string, traitData: {
    trait_type: string;
    trait_value: string;
    confidence: number;
  }) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/trait`,
      {
        method: 'POST',
        body: JSON.stringify(traitData),
      }
    );
  }

  // Add a new memory entry
  static async addMemory(userId: string, memoryData: {
    content: string;
    memory_type: string;
    importance: string;
    tags: string[];
  }) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/memory`,
      {
        method: 'POST',
        body: JSON.stringify(memoryData),
      }
    );
  }

  // Add personal context information
  static async addContext(userId: string, contextData: {
    context_type: string;
    context_value: string;
    importance: string;
    source: string;
  }) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/context`,
      {
        method: 'POST',
        body: JSON.stringify(contextData),
      }
    );
  }

  // Clean up old, low-importance memories
  static async cleanupMemories(userId: string, daysToKeep: number) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/cleanup`,
      {
        method: 'POST',
        body: JSON.stringify({ days_to_keep: daysToKeep }),
      }
    );
  }

  // Update a memory item
  static async updateMemory(userId: string, memoryId: string, memoryData: any) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/memory/${memoryId}`,
      {
        method: 'PUT',
        body: JSON.stringify(memoryData),
      }
    );
  }

  // Delete a memory item
  static async deleteMemory(userId: string, memoryId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/memory/${memoryId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Update a trait
  static async updateTrait(userId: string, traitType: string, traitData: {
    trait_value: string;
    confidence: number;
  }) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/trait/${traitType}`,
      {
        method: 'PUT',
        body: JSON.stringify(traitData),
      }
    );
  }

  // Delete a trait
  static async deleteTrait(userId: string, traitType: string) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/trait/${traitType}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Update personal context
  static async updateContext(userId: string, contextId: string, contextData: {
    context_value: string;
    importance: string;
  }) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/context/${contextId}`,
      {
        method: 'PUT',
        body: JSON.stringify(contextData),
      }
    );
  }

  // Delete personal context
  static async deleteContext(userId: string, contextId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/api/memories/user/${userId}/context/${contextId}`,
      {
        method: 'DELETE',
      }
    );
  }
}

export { MemoryAPI };
