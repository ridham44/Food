import type { AxiosInstance } from 'axios';

export interface AskAssistantResult {
  message: string;
  followUp?: boolean;
}

interface AskAssistantResponse {
  message: string;
  followUp?: boolean;
}

export async function askAssistant(client: AxiosInstance, endpoint: string, question: string): Promise<AskAssistantResult> {
  const { data } = await client.post<AskAssistantResponse>(endpoint, { question });
  return { message: data.message, followUp: data.followUp };
}
