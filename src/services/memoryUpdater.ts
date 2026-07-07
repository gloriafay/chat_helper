// ============================================================
// 记忆更新服务：组装 prompt 并调用 LLM
// ============================================================

import { ContactProfile, ChatMessage, MemoryUpdateResult } from "../types";
import { buildMemoryUpdateMessages, MEMORY_UPDATE_PROMPT_VERSION } from "./prompt";
import { chatCompletion } from "./llmGateway";

export { MEMORY_UPDATE_PROMPT_VERSION };

export interface MemoryUpdateParams {
  contactProfile: ContactProfile;
  existingMemory: string;
  recentMessages: ChatMessage[];
}

/** 调用 LLM 判断是否需要更新长期记忆；失败时返回 null，避免影响主流程 */
export async function updateContactMemory(
  params: MemoryUpdateParams
): Promise<MemoryUpdateResult | null> {
  const { contactProfile, existingMemory, recentMessages } = params;

  const messages = buildMemoryUpdateMessages({
    contactProfile,
    existingMemory,
    recentMessages,
  });

  try {
    const result = await chatCompletion({
      messages,
      temperature: 0.4,
      maxTokens: 800,
      taskType: "memory-update",
      promptVersion: MEMORY_UPDATE_PROMPT_VERSION,
    });

    const parsed = result.parsedJson as MemoryUpdateResult;

    // Normalize mergedMemory: LLM may return array or string
    if (Array.isArray(parsed.mergedMemory)) {
      (parsed as any).mergedMemory = parsed.mergedMemory.join("\n");
    }

    console.log(
      "[memory] result: shouldUpdate=",
      parsed.shouldUpdate,
      "reason=",
      parsed.reason?.slice(0, 60)
    );

    return parsed;
  } catch (e: any) {
    console.error("[memory] update failed:", e?.message || e);
    return null;
  }
}
