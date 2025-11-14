import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useAppTheme } from '../../constants/dynamicTheme';

interface ListItemProps {
  title: string;
  description?: string;
  onPress?: () => void;
  iconLeft?: React.ReactNode;
  right?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export default function ListItem({ title, description, onPress, iconLeft, right, style }: ListItemProps) {
  const theme = useAppTheme();
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress as any}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing.xl,
          paddingHorizontal: theme.spacing.xl,
          borderBottomWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        },
        style as any,
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.lg,
        }}
      >
        {iconLeft}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{title}</Text>
        {description ? (
          <Text style={{ color: theme.colors.muted, marginTop: 2, fontSize: 13 }}>{description}</Text>
        ) : null}
      </View>
      {right ? <View style={{ marginLeft: theme.spacing.lg }}>{right}</View> : null}
    </Container>
  );
}
