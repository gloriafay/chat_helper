// ============================================================
// LLM Service 统一入口
// ============================================================
// 所有 LLM 任务统一通过 LLM Gateway 导出
// 统一使用 import { generateReplySuggestions, callLLM } from './llm'

export { setApiKey, getApiKey, getModel, getBaseUrl } from './llmGateway';
export { generateReplies as generateReplySuggestions, generateMockReplies } from './replyGenerator';
export { updateContactMemory as updateContactMemoryWithLLM } from './memoryUpdater';

// 兼容旧版 callLLM
import { generateReplies } from './replyGenerator';
import { LLMResponse } from '../types';
import { buildReplyMessages } from './prompt';

/** @deprecated 使用 generateReplySuggestions */
export async function callLLM(options: {
  prompt: string;
  model?: string;
  temperature?: number;
}): Promise<LLMResponse> {
  return generateReplies({
    userSettings: {} as any,
    contactProfile: {} as any,
    recentMessages: [],
    incomingMessage: '',
    userIntent: options.prompt,
  });
}
