// ============================================================
// 回复生成服务：组装 prompt 并调用 LLM
// ============================================================

import { LLMResponse } from "../types";
import { buildReplyMessages, REPLY_PROMPT_VERSION } from "./prompt";
import { chatCompletion } from "./llmGateway";
import { UserSettings, ContactProfile, ChatMessage } from "../types";

export { REPLY_PROMPT_VERSION };

export interface GenerateReplyParams {
  userSettings: UserSettings;
  contactProfile: ContactProfile;
  recentMessages: ChatMessage[];
  incomingMessage: string;
  userIntent: string;
}

export async function generateReplies(
  params: GenerateReplyParams
): Promise<LLMResponse> {
  const messages = buildReplyMessages(params);

  const result = await chatCompletion({
    messages,
    temperature: 0.7,
    maxTokens: 1000,
    taskType: "reply",
    promptVersion: REPLY_PROMPT_VERSION,
  });

  const parsed = result.parsedJson as LLMResponse;
  if (!parsed?.suggestions?.length) {
    throw new Error("DeepSeek returned JSON without valid suggestions");
  }
  return parsed;
}

// ============================================================
// Mock (local testing)
// ============================================================

export function generateMockReplies(isWork: boolean): LLMResponse {
  if (isWork) {
    return {
      suggestions: [
        {
          reply: "Got it. Let me organize my thoughts and get back to you with a clear response.",
          tone: "professional",
          reason: "Maintain professional pace, not rushing to respond",
        },
        {
          reply: "I understand. My suggestion is to first align on the objective before moving forward.",
          tone: "rational",
          reason: "Suitable for work scenarios, clear positioning",
        },
      ],
    };
  }

  return {
    suggestions: [
      {
        reply: "I see what you mean. Let me think about how to respond better~",
        tone: "natural",
        reason: "Friendly general response",
      },
      {
        reply: "That's an interesting angle. I think we could approach it from a different direction~",
        tone: "casual",
        reason: "Naturally guide the conversation",
      },
    ],
  };
}
