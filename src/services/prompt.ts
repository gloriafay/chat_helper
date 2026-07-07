import { UserSettings, ContactProfile, ChatMessage, LLMResponse } from '../types';
import { zodiacLabel } from '../constants/options';

// ============================================================
// Prompt 版本号（用于日志追溯 & 未来 A/B Test）
// ============================================================

export const REPLY_PROMPT_VERSION = "1.0.0";
export const PROFILE_PARSE_PROMPT_VERSION = "1.0.0";
export const MEMORY_UPDATE_PROMPT_VERSION = "1.0.0";

// ============================================================
// 构建发给 DeepSeek 的 messages 数组
// ============================================================

export function buildReplyMessages(params: {
  userSettings: UserSettings;
  contactProfile: ContactProfile;
  recentMessages: ChatMessage[];
  incomingMessage: string;
  userIntent: string;
}): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: buildSystemPrompt(params) },
    { role: 'user', content: '请根据上述系统指令生成回复建议 JSON。' },
  ];
}

// ============================================================
// System Prompt —— 新权重体系：场景40 / 诉求40 / 对象10 / 用户5 / 历史+备注5
// ============================================================

function buildSystemPrompt(params: {
  userSettings: UserSettings;
  contactProfile: ContactProfile;
  recentMessages: ChatMessage[];
  incomingMessage: string;
  userIntent: string;
}): string {
  const { userSettings, contactProfile, recentMessages, incomingMessage, userIntent } = params;

  const sceneText = contactProfile.scene === 'work' ? '工作' : '恋爱';
  const sceneRule =
    contactProfile.scene === 'work'
      ? '保持专业、高效、清晰，维护职业边界。避免过度私人化表达。'
      : '保持自然、真诚、有温度，注意分寸感。不操控、不施压、不油腻。';

  const historyText = recentMessages.length > 0
    ? recentMessages
        .filter((m) => m.content?.trim())
        .map((m) => `[${m.role === 'me' ? '我' : '对方'}] ${m.content}`)
        .join('\n')
    : '（无历史记录）';

  return `你是聊天回复助手。请严格按照以下【优先级体系】生成 2-3 条回复建议。

═══════════════════════════════════
★ 第一优先级（权重 40%）：场景 · 对话目标 · 聊天边界
═══════════════════════════════════
当前场景：${sceneText}
对话目标：${contactProfile.conversationGoal || '未明确'}
聊天边界：${contactProfile.chatBoundary || '保持自然和尊重'}
潜在雷区：${contactProfile.dangerZones.join('、') || '无'}

场景规则：${sceneRule}
冲突时本级优先。

═══════════════════════════════════
★ 第二优先级（权重 40%）：本轮即时上下文
═══════════════════════════════════
对方刚发来的消息：
${incomingMessage || '（用户未输入对方消息）'}

用户本轮想表达的核心意思：
${userIntent}

【重要】生成回复的目标：
- 保留用户原始意思，不要压缩、不要删减关键信息
- 在用户原意基础上润色表达，让话术更自然、更顺
- 根据场景适当补充情绪、态度、解释或缓冲语
- 保持用户想表达的信息完整
- 除非用户明确要"简短回复"，否则默认生成信息完整的回复
- 不要生成空泛、模板化、AI味重的回复
- 不要为了显得高情商而把用户明确诉求改得含糊
- 回复要像真实的人会发出去的话

每条建议可以有不同的侧重：
- 版本1：自然直接的表达
- 版本2：更温和、更有分寸的表达
- 版本3：更完整、更会表达情绪的版本

回复必须首先解决当前这轮对话的需求。

═══════════════════════════════════
★ 第三优先级（权重 10%）：聊天对象 Profile（仅语气微调）
═══════════════════════════════════
昵称：${contactProfile.nickname}
性别：${contactProfile.gender === 'male' ? '男' : contactProfile.gender === 'female' ? '女' : '未知'}
年龄段：${contactProfile.ageRange || '未知'}
职业：${contactProfile.occupation || '未知'}
兴趣：${contactProfile.interests.join('、') || '未知'}
性格倾向：${contactProfile.personalityTraits.join('、') || '未知'}

⚠️ 弱参考信号（仅用于微调语气，禁止作为核心推理依据）：
- 星座：${zodiacLabel(contactProfile.zodiac) || '未知'}
- MBTI：${contactProfile.mbti || '未知'}

本级仅作语气微调，不要主导回复内容。严禁机械推断。

═══════════════════════════════════
★ 第四优先级（权重 5%）：用户个人 Profile
═══════════════════════════════════
你的性别：${userSettings.gender === 'male' ? '男' : userSettings.gender === 'female' ? '女' : '未知'}
你的年龄段：${userSettings.ageRange || '未知'}
你的职业：${userSettings.occupation || '未知'}
你的性格：${userSettings.personality.join('、') || '未知'}
沟通风格：${userSettings.communicationStyle.map(styleLabel).join('、') || '未知'}
禁忌话题：${userSettings.tabooTopics.join('、') || '无'}
希望维持的人设：${userSettings.persona || '未指定'}
回复偏好：${userSettings.replyPreferences.map(styleLabel).join('、') || '未指定'}

⚠️ 弱参考信号：
- 你的星座：${zodiacLabel(userSettings.zodiac) || '未知'}
- 你的 MBTI：${userSettings.mbti || '未知'}

作用：保持用户长期一致的人设。

═══════════════════════════════════
★ 第五优先级（权重 5%）：备注 & 历史记录
═══════════════════════════════════
聊天对象备注（偏好、长期记忆与补充信息）：
${contactProfile.notes || '（无）'}

最近聊天历史（最近10条，低权重）：
${historyText}

历史记录仅作辅助参考。若与本轮用户诉求冲突，优先遵循本轮诉求。

═══════════════════════════════════
优先级冲突解决顺序：
场景与边界 → 当前消息与诉求 → 对方Profile → 用户Profile → 备注/历史
═══════════════════════════════════

【安全与伦理约束】
- 不生成骚扰、威胁、操控、PUA、欺骗性话术
- 不帮助冒充身份
- 不生成明显越界或侵犯隐私的建议
- 不触碰用户禁忌话题和对方潜在雷区
- 若用户意图不合适，生成更健康、尊重边界的替代表达
- 工作场景不编造商业承诺；恋爱场景不制造焦虑或绑架对方

【输出格式】
严格按以下 JSON 输出（不要 markdown 代码块标记，仅纯 JSON）：

{
  "strategy": {
    "mainGoal": "本轮回复的核心目标",
    "approach": "采用的沟通策略",
    "mustKeep": ["必须保留的用户核心意思要点"],
    "riskControl": ["需要避免的表达风险"]
  },
  "suggestions": [
    {
      "reply": "回复话术内容",
      "tone": "语气标签",
      "reason": "简短推荐理由"
    }
  ]
}`;
}

// ============================================================
// 兼容旧接口
// ============================================================

/** @deprecated */
export function buildReplyPrompt(params: {
  userSettings: UserSettings;
  contactProfile: ContactProfile;
  recentMessages: ChatMessage[];
  incomingMessage: string;
  userIntent: string;
}): string {
  return buildReplyMessages(params).map((m) => m.content).join('\n\n');
}

// ============================================================
// Profile 解析 Prompt（复用同一 LLM）
// ============================================================

export function buildProfileParsePrompt(rawText: string): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: `你是信息提取助手。从用户提供的文本中提取聊天对象的 Profile 信息。

请提取以下字段（提取不到则留空字符串或空数组，禁止编造）：
- nickname: 昵称/称呼
- scene: "work"(工作) 或 "romance"(恋爱) 或 ""
- gender: "male"(男) 或 "female"(女) 或 ""
- ageRange: "18-24" | "25-30" | "31-40" | "41-50" | "50+" | ""
- zodiac: "aries"|"taurus"|"gemini"|"cancer"|"leo"|"virgo"|"libra"|"scorpio"|"sagittarius"|"capricorn"|"aquarius"|"pisces" | ""
- mbti: 四字母 MBTI 如"ENFP"，提取不到则 ""
- occupation: 职业/身份
- interests: 兴趣数组
- personalityTraits: 性格倾向数组
- dangerZones: 潜在雷区数组
- conversationGoal: 对话目标
- chatBoundary: 聊天边界
- notes: 备注/补充信息，包括偏好、长期稳定信息、需要注意的沟通点、重要背景

严格按 JSON 输出，不要其他内容。`,
    },
    { role: 'user', content: rawText },
  ];
}

// ============================================================
// JSON 解析
// ============================================================

export function parseLLMResponse(raw: string): LLMResponse {
  let jsonStr = raw;
  const cb = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cb) jsonStr = cb[1].trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('无法解析 LLM 返回内容');
  const parsed = JSON.parse(jsonMatch[0]) as LLMResponse;
  if (!parsed?.suggestions?.length) throw new Error('LLM 返回的建议为空');
  return parsed;
}

// ============================================================
// 长期记忆更新 Prompt（每 10 轮有效对话触发一次）
// ============================================================

export function buildMemoryUpdateMessages(params: {
  contactProfile: import("../types").ContactProfile;
  existingMemory: string;
  recentMessages: import("../types").ChatMessage[];
}): Array<{ role: "system" | "user"; content: string }> {
  const { contactProfile, existingMemory, recentMessages } = params;
  const sceneText = contactProfile.scene === "work" ? "工作" : "恋爱";

  const recentMessagesText = recentMessages
    .filter((m) => m.content?.trim())
    .map((m) => `[${m.role === "me" ? "我" : "对方"}] ${m.content}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `你是极其保守的长期记忆助手。

你的核心原则：宁可漏记，不可多记。单次事件不是长期记忆。

当前场景：${sceneText}
对方昵称：${contactProfile.nickname}
现有备注：${existingMemory || "（暂无）"}
近期对话：${recentMessagesText || "（暂无）"}

═══════════════════════════════════
一、记忆标准（必须严格满足）
═══════════════════════════════════

长期记忆只记录稳定、明确、对未来回复生成有帮助的信息。
单次事件、单次活动、单次情绪——不要写入。

只有满足以下任一条件，才可以写入：

1. 对方明确表达了长期偏好
   例："我一直很喜欢打篮球。"
   → 可以记："喜欢打篮球"

2. 对方明确表达了稳定习惯
   例："我每周都会去打篮球。"
   → 可以记："每周打篮球"

3. 近几轮对话中对方多次重复提到同一偏好或习惯
   → 可以合并记为一条

4. 对方明确表达长期雷区或边界
   例："我最烦别人一直催我回消息。"
   → 可以记："不喜欢被催回复"

5. 对方明确表达重要背景，且未来沟通会用到
   例："我最近在准备考研，可能经常没空。"
   → 可以记："最近准备考研"

═══════════════════════════════════
二、反例（必须避免的错误）
═══════════════════════════════════

输入：
对方："我上周末打篮球。"

错误输出（绝对禁止）：
{
  "shouldUpdate": true,
  "memoryPatch": { "add": ["喜欢打篮球", "上周末打了篮球", "热爱运动"] }
}

正确输出：
{
  "shouldUpdate": false,
  "memoryPatch": { "add": [], "update": [], "remove": [] },
  "mergedMemory": [],
  "reason": "对方只提到一次上周末打篮球，属于单次事件，不能判断为长期偏好或稳定习惯"
}

═══════════════════════════════════
三、主语与表达
═══════════════════════════════════

这是对"聊天对象"的备注，不是对 App 用户。

禁止出现：
* "用户喜欢……"
* "用户上周……"
* "用户是……"

推荐省略主语，直接写短句：
* "喜欢打篮球"
* "不喜欢被催回复"
* "每周打篮球"

═══════════════════════════════════
四、禁止过度推断
═══════════════════════════════════

禁止从单句话推断人格、价值观或长期偏好。

对方说"我上周末打篮球"→ 不能推断"热爱运动""性格外向""生活自律"

除非对方明确说"我很喜欢""我经常""这是我的习惯"等。

不要根据星座/MBTI 进行任何推断。

═══════════════════════════════════
五、去重
═══════════════════════════════════

同一信息只保留一条。

不要同时写：
* "喜欢打篮球"
* "每周打篮球"
* "热爱运动"

只保留最明确的那一条。

═══════════════════════════════════
六、简洁要求
═══════════════════════════════════

* 每条记忆尽量控制在 20 字以内
* 不要长篇总结、不要聊天流水账
* 不要记录一次性时间点（如"上周末"）
* 只保留最有用的 3-8 条记忆
* 如果没有高价值长期信息，shouldUpdate=false
* 如果对话记录为空或对方说的话很少，优先 shouldUpdate=false

═══════════════════════════════════
七、可记忆内容
═══════════════════════════════════

日常工作场景：
* 合作偏好、沟通禁忌、决策风格、响应节奏

日常恋爱场景：
* 相处偏好、雷区、情绪触发点

共通：
* 长期偏好、稳定习惯、固定边界、重要背景、沟通注意点

═══════════════════════════════════
八、不要记
═══════════════════════════════════

* 用户自己（"我"）说的话（只能作为上下文参考）
* 单次事件、单次活动、单次情绪
* 临时安排、随口玩笑、没有确认的推测
* 星座/MBTI 推断
* 一次性时间点（"上周""昨天""刚才"）
* 和未来回复生成无关的信息

═══════════════════════════════════
九、输出格式
═══════════════════════════════════

严格输出纯 JSON（不要 markdown 代码块标记）：

{
  "shouldUpdate": true,
  "memoryPatch": {
    "add": ["新增记忆点，短句"],
    "update": ["需要修正或强化的记忆点"],
    "remove": ["建议删除的过时或错误记忆点"]
  },
  "mergedMemory": ["记忆点1", "记忆点2", "记忆点3"],
  "reason": "为什么更新，或为什么不更新"
}`,
    },
    {
      role: "user",
      content: "请根据上述对话判断是否有值得沉淀到备注中的长期信息。",
    },
  ];
}

// ============================================================
// 辅助函数
// ============================================================

function styleLabel(s: string): string {
  const map: Record<string, string> = {
    direct: '直接', gentle: '温柔', professional: '专业',
    humorous: '幽默', restrained: '克制', proactive: '主动',
    'boundary-aware': '边界感强', short: '简短',
  };
  return map[s] || s;
}
