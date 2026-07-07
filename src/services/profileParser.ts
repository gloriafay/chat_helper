// ============================================================
// Profile 智能解析：组装 prompt 并调用 LLM
// ============================================================

import { ParsedProfile } from "../types";
import { buildProfileParsePrompt, PROFILE_PARSE_PROMPT_VERSION } from "./prompt";
import { chatCompletion } from "./llmGateway";
import { mapLLMToParsedProfile, parseTextToProfile } from "./parser";

export { PROFILE_PARSE_PROMPT_VERSION };

export async function parseProfileWithLLM(
  rawText: string
): Promise<ParsedProfile> {
  const messages = buildProfileParsePrompt(rawText);

  try {
    const result = await chatCompletion({
      messages,
      temperature: 0.3,
      maxTokens: 800,
      taskType: "profile-parse",
      promptVersion: PROFILE_PARSE_PROMPT_VERSION,
    });

    return mapLLMToParsedProfile(result.parsedJson, rawText);
  } catch (e: any) {
    console.log("[profileParse] LLM parse failed, falling back to local:", e?.message || e);
    // LLM 失败时回退到本地规则解析
    return parseTextToProfile(rawText);
  }
}
