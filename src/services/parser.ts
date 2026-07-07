import {
  ParsedProfile,
  ParseInput,
  Scene,
  AgeRange,
  ZodiacSign,
  Gender,
  CommunicationStyle,
  MBTIDimensions,
  DEFAULT_MBTI_DIMENSIONS,
  combineMBTI,
} from '../types';
import { buildProfileParsePrompt, PROFILE_PARSE_PROMPT_VERSION } from './prompt';
import { chatCompletion } from './llmGateway';

// ============================================================
// Profile parsing service
// ============================================================

export async function parseProfile(input: ParseInput): Promise<ParsedProfile> {
  if (input.type === 'image') return mockOCRParse(input.content);
  return parseWithLLM(input.content);
}

async function parseWithLLM(rawText: string): Promise<ParsedProfile> {
  try {
    return await parseContactProfileWithLLM(rawText);
  } catch {
    return parseTextToProfile(rawText);
  }
}

export async function parseContactProfileWithLLM(
  rawText: string
): Promise<ParsedProfile> {
  const messages = buildProfileParsePrompt(rawText);

  try {
    const result = await chatCompletion({
      messages,
      temperature: 0.3,
      maxTokens: 800,
      taskType: 'profile-parse',
      promptVersion: PROFILE_PARSE_PROMPT_VERSION,
    });

    return mapLLMToParsedProfile(result.parsedJson, rawText);
  } catch {
    return parseTextToProfile(rawText);
  }
}

// ============================================================
// LLM JSON -> ParsedProfile
// ============================================================

export function mapLLMToParsedProfile(raw: any, rawText: string): ParsedProfile {
  return {
    nickname: String(raw.nickname ?? '').slice(0, 20),
    scene: mapScene(raw.scene),
    gender: mapGender(raw.gender),
    ageRange: mapAgeRange(raw.ageRange),
    zodiac: mapZodiac(raw.zodiac),
    mbtiDimensions: parseMBTIDimensions(raw.mbti),
    mbti: String(raw.mbti ?? '').toUpperCase().slice(0, 4),
    occupation: String(raw.occupation ?? '').slice(0, 30),
    interests: ensureArray(raw.interests),
    personalityTraits: ensureArray(raw.personalityTraits),
    dangerZones: ensureArray(raw.dangerZones),
    conversationGoal: String(raw.conversationGoal ?? '').slice(0, 50),
    chatBoundary: String(raw.chatBoundary ?? '').slice(0, 50),
    notes: String(raw.notes ?? '').slice(0, 500),
    confidence: 0.7,
    rawText,
  };
}

// ============================================================
// Simple mappers (no Chinese regex)
// ============================================================

function mapScene(v: string): Scene {
  const s = String(v ?? '');
  if (s === 'work') return 'work';
  if (s === 'romance') return 'romance';
  return '';
}

function mapGender(v: string): Gender {
  const s = String(v ?? '');
  if (s === 'male') return 'male';
  if (s === 'female') return 'female';
  return '';
}

function mapAgeRange(v: string): AgeRange {
  const valid = ['18-24', '25-30', '31-40', '41-50', '50+'];
  return valid.includes(v) ? (v as AgeRange) : '';
}

function mapZodiac(v: string): ZodiacSign {
  const valid = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  return valid.includes(v?.toLowerCase()) ? (v.toLowerCase() as ZodiacSign) : '';
}

function parseMBTIDimensions(mbti: string): MBTIDimensions {
  if (!mbti || mbti.length < 4) return { ...DEFAULT_MBTI_DIMENSIONS };
  const chars = mbti.toUpperCase().slice(0, 4).split('');
  return {
    ei: (chars[0] === 'E' || chars[0] === 'I') ? chars[0] as 'E' | 'I' : '',
    sn: (chars[1] === 'S' || chars[1] === 'N') ? chars[1] as 'S' | 'N' : '',
    tf: (chars[2] === 'T' || chars[2] === 'F') ? chars[2] as 'T' | 'F' : '',
    jp: (chars[3] === 'J' || chars[3] === 'P') ? chars[3] as 'J' | 'P' : '',
  };
}

// ============================================================
// Local keyword parser (LLM fallback) - all regex ASCII-only
// ============================================================

export function parseTextToProfile(text: string): ParsedProfile {
  const lower = text.toLowerCase();
  const isWork = lower.includes('work') || lower.includes('job') || lower.includes('client');

  return {
    nickname: extractNickname(text),
    scene: isWork ? 'work' : 'romance',
    gender: lower.includes('male') ? 'male' : lower.includes('female') ? 'female' : '',
    ageRange: extractAgeRange(text),
    zodiac: extractZodiac(text),
    mbtiDimensions: extractMBTI(text),
    mbti: extractMBTIString(text),
    occupation: extractOccupation(text),
    interests: extractKeywords(text, interestKeywords),
    personalityTraits: extractKeywords(text, personalityKeywords),
    dangerZones: extractKeywords(text, dangerKeywords),
    conversationGoal: extractConversationGoal(text, isWork ? 'work' : 'romance'),
    chatBoundary: extractChatBoundary(text, isWork ? 'work' : 'romance'),
    notes: text.slice(0, 500),
    confidence: 0.4,
    rawText: text,
  };
}

function defaultParsed(rawText: string): ParsedProfile {
  return {
    nickname: '', scene: '', gender: '', ageRange: '', zodiac: '',
    mbtiDimensions: { ...DEFAULT_MBTI_DIMENSIONS }, mbti: '',
    occupation: '', interests: [], personalityTraits: [], dangerZones: [],
    conversationGoal: '', chatBoundary: '', notes: '',
    confidence: 0, rawText,
  };
}

function ensureArray(v: any): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

// ============================================================
// Regex-based extractors (all ASCII patterns)
// ============================================================

function extractMBTIString(text: string): string {
  const m = text.match(/\b[EISN][TF][JP]\b/i);
  return m ? m[0].toUpperCase().slice(0, 4) : '';
}

function extractMBTI(text: string): MBTIDimensions {
  return parseMBTIDimensions(extractMBTIString(text));
}

function extractZodiac(text: string): ZodiacSign {
  const map: Record<string, ZodiacSign> = {
    'aries': 'aries', 'taurus': 'taurus', 'gemini': 'gemini', 'cancer': 'cancer',
    'leo': 'leo', 'virgo': 'virgo', 'libra': 'libra', 'scorpio': 'scorpio',
    'sagittarius': 'sagittarius', 'capricorn': 'capricorn', 'aquarius': 'aquarius', 'pisces': 'pisces',
  };
  const lower = text.toLowerCase();
  for (const [kw, z] of Object.entries(map)) {
    if (lower.includes(kw)) return z;
  }
  return '';
}

function extractNickname(text: string): string {
  const m1 = text.match(/nickname\s*:\s*(.{1,15})/i);
  if (m1) return m1[1].trim();
  const m2 = text.match(/name\s*:\s*(.{1,15})/i);
  if (m2) return m2[1].trim();
  const firstLine = text.split(/[\n\r]+/)[0]?.trim();
  return firstLine?.slice(0, 10) || 'unnamed';
}

function extractAgeRange(text: string): AgeRange {
  const m = text.match(/(\d{2})\s*(?:years|yrs|yo|old)/i);
  if (m) {
    const a = parseInt(m[1], 10);
    if (a < 25) return '18-24';
    if (a < 31) return '25-30';
    if (a < 41) return '31-40';
    if (a < 51) return '41-50';
    return '50+';
  }
  return '';
}

function extractOccupation(text: string): string {
  const m1 = text.match(/occupation\s*:\s*(.{1,15})/i);
  if (m1) return m1[1].trim();
  const m2 = text.match(/job\s*:\s*(.{1,15})/i);
  if (m2) return m2[1].trim();
  const m3 = text.match(/role\s*:\s*(.{1,15})/i);
  if (m3) return m3[1].trim();
  return '';
}

function extractKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

function extractConversationGoal(text: string, scene: Scene): string {
  const m = text.match(/goal\s*:\s*(.{1,30})/i);
  if (m) return m[1].trim();
  return scene === 'work' ? 'maintain professional relationship' : 'get to know better';
}

function extractChatBoundary(text: string, scene: Scene): string {
  const m = text.match(/boundary\s*:\s*(.{1,30})/i);
  if (m) return m[1].trim();
  return scene === 'work' ? 'work topics only' : 'respect personal space';
}

async function mockOCRParse(_base64Image: string): Promise<ParsedProfile> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    ...defaultParsed('[image OCR not yet available]'),
    notes: '[Image OCR not yet available, please fill manually or paste text]',
    rawText: '',
  };
}

const interestKeywords = ['reading', 'movies', 'music', 'sports', 'travel', 'food', 'gaming', 'photography', 'tech', 'fashion', 'pets', 'coffee', 'yoga', 'coding', 'anime', 'fitness'];
const personalityKeywords = ['rational', 'emotional', 'introvert', 'extrovert', 'practical', 'romantic', 'meticulous', 'casual', 'optimistic', 'cautious', 'confident', 'humble', 'impatient', 'patient', 'outgoing', 'calm', 'humorous', 'gentle', 'assertive', 'sensitive'];
const dangerKeywords = ['politics', 'income', 'ex', 'family background', 'appearance', 'age', 'marriage', 'children', 'work pressure', 'privacy', 'religion'];
