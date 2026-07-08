// ============================================================
// 统一 LLM Gateway：前端只请求自己的 Vercel API
// ============================================================

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "";
console.log("API_BASE =", API_BASE);
const MODEL = "deepseek-chat";


export function setApiKey(_key: string): void {
  console.warn("[LLM] setApiKey 已废弃：API Key 不应保存在前端");
}

export function getApiKey(): string {
  return "";
}

export function getModel(): string {
  return MODEL;
}

export function getBaseUrl(): string {
  return API_BASE;
}

export interface ChatCompletionParams {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
  taskType: "reply" | "profile-parse" | "memory-update" | "ocr-parse";
  promptVersion: string;
}

export interface ChatCompletionResult {
  rawContent: string;
  parsedJson: any;
  promptVersion: string;
  taskType: string;
}

export async function chatCompletion(
  params: ChatCompletionParams
): Promise<ChatCompletionResult> {
  const {
    messages,
    temperature = 0.7,
    maxTokens = 1000,
    taskType,
    promptVersion,
  } = params;

  console.log(
    `[LLM] calling ${taskType} v${promptVersion} model=${MODEL} temp=${temperature}`
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(`${API_BASE}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
        maxTokens,
        taskType,
        promptVersion,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }

      throw new Error(
        `[LLM] API error [HTTP ${response.status}] task=${taskType}\n${errorBody.slice(
          0,
          300
        )}`
      );
    }

    const data = await response.json();
    const rawContent: string = data?.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error(
        `[LLM] 返回内容为空 task=${taskType} raw=${JSON.stringify(data).slice(
          0,
          200
        )}`
      );
    }

    const parsedJson = extractAndSanitizeJson(rawContent, taskType);

    return {
      rawContent,
      parsedJson,
      promptVersion,
      taskType,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`[LLM] 请求超时 (30s) task=${taskType}`);
    }

    if (error.message?.includes("Network") || error.message?.includes("fetch")) {
      throw new Error(
        `[LLM] 网络请求失败 task=${taskType}，请检查 Vercel API 地址或网络`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractAndSanitizeJson(raw: string, taskType: string): any {
  let jsonStr = raw;

  const cb = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cb) jsonStr = cb[1].trim();

  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`[LLM] 未找到 JSON task=${taskType} raw=${raw.slice(0, 200)}`);
  }

  let sanitized = jsonMatch[0];

  sanitized = sanitized.replace(/"((?:[^"\\]|\\.)*)"/g, (match: string) => {
    return match.replace(/[\x00-\x1f]/g, (c: string) => {
      if (c === "\n") return "\\n";
      if (c === "\r") return "\\r";
      if (c === "\t") return "\\t";
      return "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4);
    });
  });

  try {
    return JSON.parse(sanitized);
  } catch {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e: any) {
      throw new Error(
        `[LLM] JSON 解析失败 task=${taskType}: ${e.message}\nraw=${sanitized.slice(
          0,
          300
        )}`
      );
    }
  }
}