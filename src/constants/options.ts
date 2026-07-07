import {
  Gender,
  ZodiacSign,
  AgeRange,
  CommunicationStyle,
  ReplyPreference,
  Scene,
} from '../types';

export const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
];

export const AGE_RANGE_OPTIONS: { label: string; value: AgeRange }[] = [
  { label: '18-24', value: '18-24' },
  { label: '25-30', value: '25-30' },
  { label: '31-40', value: '31-40' },
  { label: '41-50', value: '41-50' },
  { label: '50+', value: '50+' },
];

export const SCENE_OPTIONS: { label: string; value: Scene }[] = [
  { label: '💼 工作', value: 'work' },
  { label: '💕 恋爱', value: 'romance' },
];

// ============================================================
// 星座
// ============================================================

export const ZODIAC_OPTIONS: { label: string; value: ZodiacSign }[] = [
  { label: '♈ 白羊座', value: 'aries' },
  { label: '♉ 金牛座', value: 'taurus' },
  { label: '♊ 双子座', value: 'gemini' },
  { label: '♋ 巨蟹座', value: 'cancer' },
  { label: '♌ 狮子座', value: 'leo' },
  { label: '♍ 处女座', value: 'virgo' },
  { label: '♎ 天秤座', value: 'libra' },
  { label: '♏ 天蝎座', value: 'scorpio' },
  { label: '♐ 射手座', value: 'sagittarius' },
  { label: '♑ 摩羯座', value: 'capricorn' },
  { label: '♒ 水瓶座', value: 'aquarius' },
  { label: '♓ 双鱼座', value: 'pisces' },
];

export function zodiacLabel(z: ZodiacSign): string {
  return ZODIAC_OPTIONS.find((o) => o.value === z)?.label ?? '';
}

// ============================================================
// MBTI 四维
// ============================================================

export const MBTI_EI_OPTIONS = [
  { label: 'E (外向)', value: 'E' as const },
  { label: 'I (内向)', value: 'I' as const },
];

export const MBTI_SN_OPTIONS = [
  { label: 'S (实感)', value: 'S' as const },
  { label: 'N (直觉)', value: 'N' as const },
];

export const MBTI_TF_OPTIONS = [
  { label: 'T (思考)', value: 'T' as const },
  { label: 'F (情感)', value: 'F' as const },
];

export const MBTI_JP_OPTIONS = [
  { label: 'J (判断)', value: 'J' as const },
  { label: 'P (感知)', value: 'P' as const },
];

// ============================================================
// 性格 / 风格 / 禁忌等
// ============================================================

export const PERSONALITY_OPTIONS = [
  '外向开朗', '内向沉稳', '理性冷静', '感性细腻',
  '幽默风趣', '温柔体贴', '果断强势', '随和佛系',
  '敏感细心', '大大咧咧',
];

export const COMMUNICATION_STYLE_OPTIONS: { label: string; value: CommunicationStyle }[] = [
  { label: '直接', value: 'direct' },
  { label: '温柔', value: 'gentle' },
  { label: '专业', value: 'professional' },
  { label: '幽默', value: 'humorous' },
  { label: '克制', value: 'restrained' },
  { label: '主动', value: 'proactive' },
  { label: '边界感强', value: 'boundary-aware' },
];

export const REPLY_PREFERENCE_OPTIONS: { label: string; value: ReplyPreference }[] = [
  { label: '简短', value: 'short' },
  { label: '温柔', value: 'gentle' },
  { label: '专业', value: 'professional' },
  { label: '幽默', value: 'humorous' },
  { label: '克制', value: 'restrained' },
  { label: '主动', value: 'proactive' },
  { label: '边界感强', value: 'boundary-aware' },
];

export const TABOO_TOPIC_OPTIONS = [
  '政治', '宗教', '收入', '前任',
  '家庭矛盾', '外貌评价', '年龄', '体重',
];

export const INTEREST_OPTIONS = [
  '阅读', '电影', '音乐', '运动', '旅行',
  '美食', '游戏', '摄影', '科技', '时尚',
  '宠物', '咖啡', '瑜伽', '编程', '动漫',
];

export const VALUE_OPTIONS = [
  '家庭优先', '事业为重', '自由至上', '稳定安全',
  '创新进取', '传统保守', '享乐主义', '极简生活',
  '社会责任', '个人成长',
];

export const PERSONALITY_TRAIT_OPTIONS = [
  '理性', '感性', '内向', '外向', '务实',
  '浪漫', '严谨', '随性', '乐观', '谨慎',
  '自信', '谦虚', '急性子', '慢性子',
];

export const DANGER_ZONE_OPTIONS = [
  '政治观点', '收入水平', '前任关系', '家庭背景',
  '外貌评价', '年龄相关', '婚姻观念', '生育话题',
  '工作压力', '私人空间',
];

export const CONVERSATION_GOAL_OPTIONS: Record<Scene, string[]> = {
  work: [
    '推进项目进度', '汇报工作', '请求资源', '协调分歧',
    '建立信任', '保持专业关系', '争取机会',
  ],
  romance: [
    '增进了解', '表达关心', '化解矛盾', '日常分享',
    '确认关系', '规划未来', '保持舒适距离',
  ],
  '': [],
};

export const CHAT_BOUNDARY_OPTIONS: Record<Scene, string[]> = {
  work: [
    '仅聊工作', '可聊生活但不深入', '保持正式语气',
    '避免非工作时间联系', '不讨论薪资',
  ],
  romance: [
    '不过度依赖', '尊重个人空间', '不逼问', '不急推进关系',
    '保持自我', '不牺牲边界感',
  ],
  '': [],
};