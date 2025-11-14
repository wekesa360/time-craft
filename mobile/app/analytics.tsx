import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../constants/dynamicTheme';
import { router } from 'expo-router';
import { 
  HomeIcon,
  CheckCircleIcon,
  HeartIcon,
  CalendarIcon,
  UserIcon,
} from 'react-native-heroicons/outline';

export default function AnalyticsScreen() {
  const theme = useAppTheme();
  // Mock rich analytics data
  const activities = useMemo(() => ([
    { key: 'walking', label: 'Walking', percent: 48, color: '#4B3F35' },
    { key: 'running', label: 'Running', percent: 33, color: '#7A4D1D' },
    { key: 'meditation', label: 'Meditation', percent: 27, color: '#6A8D2E' },
    { key: 'hydration', label: 'Drink', percent: 40, color: '#D46BB8' },
  ]), []);

  const metrics = useMemo(() => ({
    points: 842,
    tasksCompleted: 44,
    focusTimeMinutes: 450, // 7h 30m
    healthLogs: 28,
  }), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.card }}>
      {/* Header with right back button */}
      <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 44 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.foreground }}>Analytics</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
          >
            <Text style={{ color: theme.colors.muted }}>‹</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingBottom: 120 }}>
        {/* Title */}
        <Text style={{ color: theme.colors.muted, marginBottom: theme.spacing.md }}>Your progress and insights</Text>

        {/* Rounded Bar Chart */}
        <View style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii['3xl'], padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 220 }}>
            {activities.map((a) => (
              <View key={a.key} style={{ alignItems: 'center', width: '22%' }}>
                <View style={{ width: '100%', height: 180, backgroundColor: theme.colors.surface, borderRadius: 28, overflow: 'hidden', justifyContent: 'flex-end' }}>
                  <View style={{ width: '100%', height: Math.max(8, Math.round(1.8 * a.percent)), backgroundColor: a.color, borderTopLeftRadius: 28, borderTopRightRadius: 28 }} />
                </View>
                <View style={{ position: 'absolute', top: 8, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.primaryForeground, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>{a.percent}%</Text>
                </View>
                <Text style={{ marginTop: 8, color: theme.colors.muted, fontSize: 12 }}>{a.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Metrics Row */}
        <View style={{ flexDirection: 'row', marginHorizontal: -8, marginBottom: theme.spacing.lg }}>
          <View style={{ flex: 1, paddingHorizontal: 8 }}>
            <View style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl, padding: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.primaryForeground + 'cc' }}>Points Earned</Text>
              <Text style={{ color: theme.colors.primaryForeground, fontSize: 28, fontWeight: '800' }}>{metrics.points}</Text>
            </View>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 8 }}>
            <View style={{ backgroundColor: theme.colors.successBg, borderRadius: theme.radii.xl, padding: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.success }}>Tasks Completed</Text>
              <Text style={{ color: theme.colors.success, fontSize: 28, fontWeight: '800' }}>{metrics.tasksCompleted}</Text>
            </View>
          </View>
        </View>

        {/* More Insights */}
        <View style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii['3xl'], padding: theme.spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
            <View>
              <Text style={{ color: theme.colors.muted }}>Focus Time</Text>
              <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: 18 }}>
                {Math.floor(metrics.focusTimeMinutes / 60)}h {metrics.focusTimeMinutes % 60}m
              </Text>
            </View>
            <View>
              <Text style={{ color: theme.colors.muted }}>Health Logs</Text>
              <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: 18 }}>{metrics.healthLogs}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {}}
            style={{ paddingVertical: 14, borderRadius: theme.radii['3xl'], backgroundColor: theme.colors.primary, alignItems: 'center' }}
          >
            <Text style={{ color: theme.colors.primaryForeground, fontWeight: '700' }}>Share Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed bottom navigation mimic */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: theme.spacing.xl }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks' as any)} style={{ alignItems: 'center' }}>
            <CheckCircleIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/health' as any)} style={{ alignItems: 'center' }}>
            <HeartIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Health</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/dashboard' as any)} style={{ alignItems: 'center' }}>
            <HomeIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/calendar' as any)} style={{ alignItems: 'center' }}>
            <CalendarIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)} style={{ alignItems: 'center' }}>
            <UserIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
