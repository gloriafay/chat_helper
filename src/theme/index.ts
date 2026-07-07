// ============================================================
// Apple Human Interface 风格统一主题
// ============================================================

export const colors = {
  // 主色调
  primary: '#007AFF',        // iOS Blue
  primaryLight: '#E8F2FF',
  primaryDark: '#0056CC',

  // 语义色
  success: '#34C759',        // Green
  successLight: '#E8F8ED',
  danger: '#FF3B30',         // Red
  dangerLight: '#FFF0EF',
  warning: '#FF9500',        // Orange
  warningLight: '#FFF5E8',

  // 中性色
  bg: '#F2F2F7',             // iOS systemGroupedBackground
  card: '#FFFFFF',           // 卡片白
  cardAlt: '#F9F9FB',
  separator: '#E5E5EA',      // iOS separator
  border: '#E0E0E5',

  // 文字
  textPrimary: '#1C1C1E',   // iOS label
  textSecondary: '#3C3C43', // iOS secondaryLabel (60% opacity)
  textTertiary: '#8E8E93',  // iOS tertiaryLabel
  textPlaceholder: '#C7C7CC',
  textInverse: '#FFFFFF',

  // 消息气泡
  bubbleMe: '#007AFF',
  bubbleThem: '#E9E9EB',
  bubbleMeText: '#FFFFFF',
  bubbleThemText: '#1C1C1E',

  // 选择 / 高亮
  selected: '#007AFF',
  selectedBg: '#E8F2FF',

  // Tab Bar
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
  tabActive: '#007AFF',
  tabInactive: '#8E8E93',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 24,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
  chip: 20,
  bubble: 16,
  card: 14,
  button: 12,
  input: 10,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fab: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  panel: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: 0.3 },
  title2: { fontSize: 22, fontWeight: '700' as const, color: colors.textPrimary },
  title3: { fontSize: 20, fontWeight: '600' as const, color: colors.textPrimary },
  headline: { fontSize: 17, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary, lineHeight: 22 },
  callout: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  subhead: { fontSize: 13, fontWeight: '400' as const, color: colors.textTertiary },
  footnote: { fontSize: 12, fontWeight: '400' as const, color: colors.textTertiary },
  caption: { fontSize: 11, fontWeight: '400' as const, color: colors.textTertiary },
  button: { fontSize: 15, fontWeight: '600' as const, color: colors.textInverse },
  sectionHeader: { fontSize: 13, fontWeight: '600' as const, color: colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
};

// 通用组件样式
export const componentStyles = {
  /** iOS 风格分组 section */
  groupedSection: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden' as const,
    ...shadows.card,
  },
  /** 分组 section 内的行 */
  groupedRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
  },
  /** 输入框 */
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.input,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.textPrimary,
  },
  /** 主按钮 */
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center' as const,
    ...shadows.button,
  },
  /** 主按钮文字 */
  primaryButtonText: {
    ...typography.button,
  },
  /** 危险按钮 */
  dangerButton: {
    backgroundColor: colors.card,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.danger,
  },
  /** 次要按钮 */
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.primary,
  },
};