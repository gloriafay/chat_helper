// ============================================================
// 统一 LLM Gateway：所有大模型调用的基础层
// ============================================================
//
// 适用范围
//   - 回复生成 (replyGenerator.ts)
//   - Profile 智能解析 (profileParser.ts)
//   - 记忆更新 (memoryUpdater.ts)
//   - 图片 OCR 后的解析任务
//
// 职责
//   - 统一 API URL / Key / Model / Headers
//   - 统一超时 / 错误 / 日志
//   - 统一 JSON 提取与 sanitization
//
// 注意：当前为本地调试内置 API Key，发布前建议改为安全配置或后端代理

const DEEPSEEK_BASE = "https://api.deepseek.com";
const DEEPSEEK_MODEL = "deepseek-chat";

let _apiKey = "sk-8b46096263c342ecb26fb39bc1a89acc";

export function setApiKey(key: string): void {
  _apiKey = key;
}

export function getApiKey(): string {
  return _apiKey;
}

export function getModel(): string {
  return DEEPSEEK_MODEL;
}

export function getBaseUrl(): string {
  return DEEPSEEK_BASE;
}

// ============================================================
// 类型定义
// ============================================================

export interface ChatCompletionParams {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
  /** 任务类型 */
  taskType: "reply" | "profile-parse" | "memory-update" | "ocr-parse";
  /** Prompt 版本号 */
  promptVersion: string;
}

export interface ChatCompletionResult {
  rawContent: string;
  parsedJson: any;
  promptVersion: string;
  taskType: string;
}

// ============================================================
// 请求封装
// ============================================================

export async function chatCompletion(
  params: ChatCompletionParams
): Promise<ChatCompletionResult> {
  const { messages, temperature = 0.7, maxTokens = 1000, taskType, promptVersion } = params;
  const key = _apiKey;

  console.log(
    `[LLM] calling ${taskType} v${promptVersion} model=${DEEPSEEK_MODEL} temp=${temperature}`
  );

  if (!key) {
    throw new Error(
      `[LLM] API Key 缺失 (task=${taskType})，请先配置 DeepSeek API Key`
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorBody = "";
      try { errorBody = await response.text(); } catch { /* ignore */ }
      throw new Error(
        `[LLM] API error [HTTP ${response.status}] task=${taskType}\n${errorBody.slice(0, 300)}`
      );
    }

    const data = await response.json();
    const rawContent: string = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error(
        `[LLM] 返回内容为空 task=${taskType} raw=${JSON.stringify(data).slice(0, 200)}`
      );
    }

    console.log(`[LLM] ${taskType} done, content length=${rawContent.length}`);

    const parsedJson = extractAndSanitizeJson(rawContent, taskType);

    return { rawContent, parsedJson, promptVersion, taskType };
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`[LLM] 请求超时 (30s) task=${taskType}`);
    }
    if (error.message?.includes("Network") || error.message?.includes("fetch")) {
      throw new Error(
        `[LLM] 网络请求失败 task=${taskType}，请检查网络、CORS 或 API 地址；Expo Go 中直连外部 API 可能受限`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// JSON 提取与清洗工具
// ============================================================

function extractAndSanitizeJson(raw: string, taskType: string): any {
  let jsonStr = raw;

  // 1. 去掉 markdown 代码块
  const cb = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cb) jsonStr = cb[1].trim();

  // 2. 提取最外层 {...}
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`[LLM] 未找到 JSON task=${taskType} raw=${raw.slice(0, 200)}`);
  }

  let sanitized = jsonMatch[0];

// 3. 清洗 JSON 字符串中的非法控制字符，避免 DeepSeek 返回换行导致解析失败
  sanitized = sanitized.replace(
    /"((?:[^"\\]|\\.)*)"/g,
    (match: string) => {
      return match.replace(/[\x00-\x1f]/g, (c: string) => {
        if (c === "\n") return "\\n";
        if (c === "\r") return "\\r";
        if (c === "\t") return "\\t";
        return "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4);
      });
    }
  );

  try {
    return JSON.parse(sanitized);
  } catch {
    // fallback: try original
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e: any) {
      throw new Error(
        `[LLM] JSON 解析失败 task=${taskType}: ${e.message}\nraw=${sanitized.slice(0, 300)}`
      );
    }
  }
}

// ============================================================
// 兼容旧代码中的常量导出
// ============================================================

/** @deprecated 请使用 chatCompletion() + 任务类型 */
export { DEEPSEEK_BASE, DEEPSEEK_MODEL };
