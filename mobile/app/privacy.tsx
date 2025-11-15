import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { ArrowLeftIcon } from 'react-native-heroicons/outline';
import { useAppTheme } from '../constants/dynamicTheme';

export default function PrivacyPolicyScreen() {
  const theme = useAppTheme();
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-2xl font-bold mb-2" style={{ color: theme.colors.foreground }}>
              Privacy Policy
            </Text>
            <Text className="text-center max-w-sm" style={{ color: theme.colors.muted }}>
              Your privacy is important to us. Learn how we protect your data.
            </Text>
            <Text className="text-sm mt-2" style={{ color: theme.colors.muted }}>
              Last Updated: {new Date().toLocaleDateString()}
            </Text>
          </View>

          {/* Content */}
          <View className="space-y-6">
            
            {/* Overview */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Overview
              </Text>
              <View className="p-4" style={{ borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card }}>
                <Text className="mb-3" style={{ color: theme.colors.foreground }}>
                  Ploracs ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our wellness and productivity platform.
                </Text>
                <Text style={{ color: theme.colors.foreground }}>
                  By using our service, you agree to the collection and use of information in accordance with this Privacy Policy. This policy complies with the General Data Protection Regulation (GDPR) and German data protection laws.
                </Text>
              </View>
            </View>

            {/* Information We Collect */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Information We Collect
              </Text>
              
              <View className="space-y-4">
                <View className="pl-4" style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Personal Information
                  </Text>
                  <View className="space-y-1">
                    <Text style={{ color: theme.colors.muted }}>• Name and email address</Text>
                    <Text style={{ color: theme.colors.muted }}>• Profile information and preferences</Text>
                    <Text style={{ color: theme.colors.muted }}>• Account credentials and settings</Text>
                    <Text style={{ color: theme.colors.muted }}>• Communication preferences</Text>
                  </View>
                </View>

                <View className="pl-4" style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Usage Data
                  </Text>
                  <View className="space-y-1">
                    <Text style={{ color: theme.colors.muted }}>• App usage patterns and features used</Text>
                    <Text style={{ color: theme.colors.muted }}>• Task and productivity data</Text>
                    <Text style={{ color: theme.colors.muted }}>• Health and wellness metrics</Text>
                    <Text style={{ color: theme.colors.muted }}>• Time tracking and focus session data</Text>
                  </View>
                </View>

                <View className="pl-4" style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Automatically Collected Data
                  </Text>
                  <View className="space-y-1">
                    <Text style={{ color: theme.colors.muted }}>• Device information and identifiers</Text>
                    <Text style={{ color: theme.colors.muted }}>• IP address and location data</Text>
                    <Text style={{ color: theme.colors.muted }}>• Browser type and version</Text>
                    <Text style={{ color: theme.colors.muted }}>• Operating system information</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* How We Use Information */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                How We Use Information
              </Text>
              
              <View className="space-y-4">
                <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Service Provision
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Provide and maintain our services</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Process your transactions</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Personalize your experience</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Generate insights and analytics</Text>
                  </View>
                </View>

                <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Communication
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Send service-related notifications</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Respond to your inquiries</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Send marketing communications (with consent)</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Provide customer support</Text>
                  </View>
                </View>

                <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Improvement
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Analyze usage patterns</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Improve our services</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Develop new features</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Conduct research and analytics</Text>
                  </View>
                </View>

                <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                    Legal Compliance
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Comply with legal obligations</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Protect our rights and interests</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Prevent fraud and abuse</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>• Enforce our terms of service</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Data Protection */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Data Protection
              </Text>
              
              <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                <Text className="mb-3" style={{ color: theme.colors.foreground }}>
                  We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
                </Text>
                <View className="space-y-1">
                  <Text style={{ color: theme.colors.muted }}>• End-to-end encryption for sensitive data</Text>
                  <Text style={{ color: theme.colors.muted }}>• Secure data transmission (HTTPS/TLS)</Text>
                  <Text style={{ color: theme.colors.muted }}>• Regular security audits and updates</Text>
                  <Text style={{ color: theme.colors.muted }}>• Access controls and authentication</Text>
                  <Text style={{ color: theme.colors.muted }}>• Data backup and recovery procedures</Text>
                  <Text style={{ color: theme.colors.muted }}>• Employee training on data protection</Text>
                  <Text style={{ color: theme.colors.muted }}>• Incident response procedures</Text>
                  <Text style={{ color: theme.colors.muted }}>• Compliance with GDPR requirements</Text>
                </View>
              </View>
            </View>

            {/* Your Rights */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Your Rights
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row items-start space-x-3 p-3 rounded-lg" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <View className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: theme.colors.primary }}></View>
                  <View className="flex-1">
                    <Text className="font-semibold" style={{ color: theme.colors.foreground }}>Right to Access</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>
                      You can request access to your personal data we hold
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-start space-x-3 p-3 rounded-lg" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <View className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: theme.colors.primary }}></View>
                  <View className="flex-1">
                    <Text className="font-semibold" style={{ color: theme.colors.foreground }}>Right to Correction</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>
                      You can request correction of inaccurate personal data
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-start space-x-3 p-3 rounded-lg" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <View className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: theme.colors.primary }}></View>
                  <View className="flex-1">
                    <Text className="font-semibold" style={{ color: theme.colors.foreground }}>Right to Deletion</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>
                      You can request deletion of your personal data
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-start space-x-3 p-3 rounded-lg" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                  <View className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: theme.colors.primary }}></View>
                  <View className="flex-1">
                    <Text className="font-semibold" style={{ color: theme.colors.foreground }}>Right to Opt-Out</Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>
                      You can opt-out of marketing communications at any time
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Data Retention */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Data Retention
              </Text>
              
              <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                <Text className="mb-3" style={{ color: theme.colors.foreground }}>
                  We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
                </Text>
                <View className="space-y-1">
                  <Text style={{ color: theme.colors.muted }}>• <Text className="font-semibold">Account Data:</Text> Retained while your account is active</Text>
                  <Text style={{ color: theme.colors.muted }}>• <Text className="font-semibold">Usage Data:</Text> Retained for up to 2 years for analytics</Text>
                  <Text style={{ color: theme.colors.muted }}>• <Text className="font-semibold">Communication Records:</Text> Retained for up to 3 years</Text>
                  <Text style={{ color: theme.colors.muted }}>• <Text className="font-semibold">Legal Data:</Text> Retained as required by applicable law</Text>
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
                  If you have any questions about this Privacy Policy or our data practices, please contact Gowriters:
                </Text>
                <View className="space-y-2">
                  <Text style={{ color: theme.colors.foreground }}>
                    <Text className="font-semibold">Email:</Text> privacy@ploracs.de
                  </Text>
                  <Text style={{ color: theme.colors.foreground }}>
                    <Text className="font-semibold">Address:</Text>{'\n'}
                    Ploracs{'\n'}
                    Musterstraße 123{'\n'}
                    10115 Berlin, Germany
                  </Text>
                  <Text style={{ color: theme.colors.foreground }}>
                    <Text className="font-semibold">Response Time:</Text> We will respond to your privacy requests within 30 days
                  </Text>
                  <Text style={{ color: theme.colors.foreground }}>
                    <Text className="font-semibold">Data Protection Officer:</Text> dpo@ploracs.de
                  </Text>
                </View>
              </View>
            </View>

            {/* Changes to Policy */}
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                Changes to This Policy
              </Text>
              
              <View className="rounded-lg p-4" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
                <Text style={{ color: theme.colors.foreground }}>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
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