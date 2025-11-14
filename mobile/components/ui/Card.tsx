import React from 'react';
import { View, ViewProps } from 'react-native';
import { useAppTheme } from '../../constants/dynamicTheme';

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export default function Card({ elevated = false, style, ...props }: CardProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radii.xl,
          padding: theme.spacing.xxl,
        },
        // Shadows removed by design request
        style,
      ]}
      {...props}
    />
  );
}
