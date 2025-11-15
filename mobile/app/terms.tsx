import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { ArrowLeftIcon } from 'react-native-heroicons/outline';
import { useAppTheme } from '../constants/dynamicTheme';

export default function TermsOfServiceScreen() {
  const theme = useAppTheme();
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-2xl font-bold mb-2" style={{ color: theme.colors.foreground }}>
              Terms of Service
            </Text>
            <Text className="text-center max-w-sm" style={{ color: theme.colors.muted }}>
              Please read these terms carefully before using our service
            </Text>
            <Text className="text-sm mt-2" style={{ color: theme.colors.muted }}>
              Last Updated: {new Date().toLocaleDateString()}
            </Text>
          </View>

          {/* Content */}
          <View className="space-y-6">
            
            {/* Acceptance of Terms */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Acceptance of Terms
              </Text>
              <View className="p-4" style={{ borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card }}>
                <Text className="mb-3" style={{ color: theme.colors.foreground }}>
                  By accessing and using our wellness and productivity platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </Text>
                <Text style={{ color: theme.colors.foreground }}>
                  These Terms of Service are governed by Ploracs, a company registered in Germany, and are subject to German law and the jurisdiction of German courts.
                </Text>
              </View>
            </View>

            {/* Service Description */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Service Description
              </Text>
              
              <Text className="mb-4" style={{ color: theme.colors.foreground }}>
                Ploracs provides a comprehensive wellness and productivity platform that combines time management, health tracking, and personal development tools to help users achieve their goals and maintain a balanced lifestyle.
              </Text>
              
              <View className="space-y-4">
                <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Productivity Features
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Task and project management</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Time tracking and analytics</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Focus sessions and Pomodoro timer</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Calendar integration</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Goal setting and progress tracking</Text>
                  </View>
                </View>

                <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Wellness Features
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Mood and energy tracking</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Exercise and fitness logging</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Nutrition and hydration monitoring</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Sleep quality assessment</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Mindfulness and meditation tools</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* User Accounts */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                User Accounts
              </Text>
              
              <View className="space-y-4">
                <View className="pl-4" style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Account Creation
                  </Text>
                  <View className="space-y-1">
                    <Text style={{ color: theme.colors.muted }}>• You must provide accurate and complete information</Text>
                    <Text style={{ color: theme.colors.muted }}>• You are responsible for maintaining account security</Text>
                    <Text style={{ color: theme.colors.muted }}>• One account per person is allowed</Text>
                    <Text style={{ color: theme.colors.muted }}>• You must be at least 13 years old to create an account</Text>
                  </View>
                </View>

                <View className="pl-4" style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Account Responsibilities
                  </Text>
                  <View className="space-y-1">
                    <Text style={{ color: theme.colors.muted }}>• Keep your login credentials secure</Text>
                    <Text style={{ color: theme.colors.muted }}>• Notify us immediately of any unauthorized access</Text>
                    <Text style={{ color: theme.colors.muted }}>• Use the service in compliance with all applicable laws</Text>
                    <Text style={{ color: theme.colors.muted }}>• Respect other users and their privacy</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Payment Terms */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Payment Terms
              </Text>
              
              <View className="space-y-4">
                <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.foreground }}>
                    Subscription Plans
                  </Text>
                  <View className="flex-row space-x-4">
                    <View className="flex-1 text-center p-3 rounded-lg" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                      <Text className="font-semibold" style={{ color: theme.colors.foreground }}>Free</Text>
                      <Text className="text-sm" style={{ color: theme.colors.muted }}>Basic features</Text>
                      <Text className="text-sm" style={{ color: theme.colors.muted }}>Limited storage</Text>
                    </View>
                    <View className="flex-1 text-center p-3 rounded-lg" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                      <Text className="font-semibold" style={{ color: theme.colors.foreground }}>Pro</Text>
                      <Text className="text-sm" style={{ color: theme.colors.muted }}>All features</Text>
                      <Text className="text-sm" style={{ color: theme.colors.muted }}>Unlimited storage</Text>
                    </View>
                    <View className="flex-1 text-center p-3 rounded-lg" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                      <Text className="font-semibold" style={{ color: theme.colors.foreground }}>Student</Text>
                      <Text className="text-sm" style={{ color: theme.colors.muted }}>Pro features</Text>
                      <Text className="text-sm" style={{ color: theme.colors.muted }}>Student discount</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Contact Information */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Contact Information
              </Text>
              
              <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                <Text className="mb-3" style={{ color: theme.colors.foreground }}>
                  If you have any questions about these Terms of Service, please contact Ploracs using the information below:
                </Text>
                <View className="space-y-2">
                  <Text style={{ color: theme.colors.foreground }}>
                    <Text className="font-semibold">Email:</Text> legal@ploracs.de
                  </Text>
                  <Text style={{ color: theme.colors.foreground }}>
                    <Text className="font-semibold">Support:</Text> support@ploracs.de
                  </Text>
                  <Text style={{ color: theme.colors.foreground }}>
                    <Text className="font-semibold">Address:</Text>{'\n'}
                    Ploracs{'\n'}
                    Musterstraße 123{'\n'}
                    10115 Berlin, Germany
                  </Text>
                </View>
              </View>
            </View>

            {/* Governing Law */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Governing Law
              </Text>
              
              <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                <Text style={{ color: theme.colors.foreground }}>
                  These Terms of Service are governed by and construed in accordance with the laws of Germany. Any disputes arising from these terms will be subject to the exclusive jurisdiction of the courts in Berlin, Germany.
                </Text>
              </View>
            </View>

          </View>

          {/* Back to Sign Up Button */}
          <View className="items-center mt-8 pb-8">
            <Link href="/auth/register" asChild>
              <TouchableOpacity className="flex-row items-center gap-2 px-6 py-4 shadow-sm" style={{ backgroundColor: theme.colors.primary, borderRadius: 20 }}>
                <ArrowLeftIcon size={16} color="white" />
                <Text className="text-white font-medium">Back to Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}