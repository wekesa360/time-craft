import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '../../constants/dynamicTheme';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export default function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}: ButtonProps) {
  const theme = useAppTheme();
  const sizes = {
    sm: { paddingV: theme.spacing.sm, paddingH: theme.spacing.lg, font: 14, radius: theme.radii.xl },
    md: { paddingV: theme.spacing.md, paddingH: theme.spacing.xl, font: 16, radius: theme.radii['2xl'] },
    lg: { paddingV: theme.spacing.lg, paddingH: theme.spacing.xxl, font: 18, radius: theme.radii['3xl'] },
  } as const;

  const s = sizes[size];

  const base: ViewStyle = {
    paddingVertical: s.paddingV,
    paddingHorizontal: s.paddingH,
    borderRadius: s.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  };

  let variantStyle: ViewStyle = {} as ViewStyle;
  let textColor: string = theme.colors.primaryForeground;

  if (variant === 'primary') {
    variantStyle = { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary };
    textColor = theme.colors.primaryForeground;
  } else if (variant === 'outline') {
    variantStyle = { backgroundColor: theme.colors.card, borderColor: theme.colors.border };
    textColor = theme.colors.foreground;
  } else {
    // ghost
    variantStyle = { backgroundColor: 'transparent', borderColor: 'transparent' };
    textColor = theme.colors.foreground;
  }

  const disabledStyle: ViewStyle = disabled
    ? { opacity: 0.6 }
    : {};

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[base, variantStyle, disabledStyle, style]}
    >
      <Text style={[{ color: textColor, fontWeight: '700', fontSize: s.font }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
