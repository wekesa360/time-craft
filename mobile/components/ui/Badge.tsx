import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '../../constants/dynamicTheme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'outline';
  size?: 'sm' | 'md';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}: BadgeProps) {
  const theme = useAppTheme();
  const sizes = {
    sm: { paddingV: theme.spacing.xs, paddingH: theme.spacing.md, font: 12, radius: theme.radii.xl },
    md: { paddingV: theme.spacing.sm, paddingH: theme.spacing.lg, font: 13, radius: theme.radii['2xl'] },
  } as const;

  const s = sizes[size];

  let bg: string = theme.colors.primaryLight;
  let border: string = theme.colors.primary + '33';
  let color: string = theme.colors.primary;

  switch (variant) {
    case 'success':
      bg = theme.colors.successBg;
      border = theme.colors.successBg;
      color = theme.colors.success;
      break;
    case 'warning':
      bg = theme.colors.warningBg;
      border = theme.colors.warningBg;
      color = theme.colors.warning;
      break;
    case 'info':
      bg = theme.colors.infoBg;
      border = theme.colors.infoBg;
      color = theme.colors.info;
      break;
    case 'outline':
      bg = theme.colors.card;
      border = theme.colors.border;
      color = theme.colors.muted;
      break;
  }

  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        paddingVertical: s.paddingV,
        paddingHorizontal: s.paddingH,
        borderRadius: s.radius,
        alignSelf: 'flex-start',
        ...((style as object) || {}),
      }}
    >
      <Text style={[{ color, fontWeight: '600', fontSize: s.font }, textStyle]}>{children}</Text>
    </View>
  );
}
