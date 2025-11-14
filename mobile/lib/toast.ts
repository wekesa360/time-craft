import Toast, { BaseToastProps } from 'react-native-toast-message';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../constants/dynamicTheme';

function ThemedToast({ type, text1, text2 }: { type: 'success' | 'error' | 'info' | 'warning'; text1?: string; text2?: string }) {
  const theme = useAppTheme();
  const variant = {
    success: { accent: theme.colors.success, icon: '✓' },
    error:   { accent: theme.colors.danger,  icon: '!' },
    info:    { accent: theme.colors.info,    icon: 'i' },
    warning: { accent: theme.colors.warning, icon: '!' },
  }[type];

  const containerStyle = {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  };

  const leftBar = React.createElement(View, { style: { width: 4, alignSelf: 'stretch', backgroundColor: variant.accent, borderRadius: 4, marginRight: 12 } });

  const iconCircle = React.createElement(
    View,
    { style: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: (variant.accent as string) + '22', borderWidth: 1, borderColor: (variant.accent as string) + '55', marginRight: 10 } },
    React.createElement(Text, { style: { color: variant.accent, fontWeight: '900' as const } }, variant.icon)
  );

  const titleEl = text1 ? React.createElement(Text, { style: { color: theme.colors.foreground, fontWeight: '700' as const } }, text1) : null;
  const msgEl = text2 ? React.createElement(Text, { style: { color: theme.colors.muted, marginTop: text1 ? 2 : 0 } }, text2) : null;
  const content = React.createElement(View, { style: { flex: 1, paddingRight: 8 } }, titleEl, msgEl);

  const closeBtn = React.createElement(
    TouchableOpacity,
    { onPress: () => Toast.hide(), style: { paddingVertical: 6, paddingHorizontal: 10 } },
    React.createElement(Text, { style: { color: theme.colors.muted, fontWeight: '900' as const } }, '×')
  );

  return React.createElement(View, { accessibilityRole: 'alert', style: containerStyle }, leftBar, iconCircle, content, closeBtn);
}

export const toastConfig = {
  success: (props: BaseToastProps) => React.createElement(ThemedToast, { type: 'success', text1: props.text1 as any, text2: props.text2 as any }),
  error:   (props: BaseToastProps) => React.createElement(ThemedToast, { type: 'error', text1: props.text1 as any, text2: props.text2 as any }),
  info:    (props: BaseToastProps) => React.createElement(ThemedToast, { type: 'info', text1: props.text1 as any, text2: props.text2 as any }),
  warning: (props: BaseToastProps) => React.createElement(ThemedToast, { type: 'warning', text1: props.text1 as any, text2: props.text2 as any }),
} as const;

export const showToast = {
  success: (message: string, title?: string) => {
    Toast.show({
      type: 'success',
      text1: title || 'Success',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  error: (message: string, title?: string) => {
    Toast.show({
      type: 'error',
      text1: title || 'Error',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  info: (message: string, title?: string) => {
    Toast.show({
      type: 'info',
      text1: title || 'Info',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },

  warning: (message: string, title?: string) => {
    Toast.show({
      type: 'warning',
      text1: title || 'Warning',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },
};

// Connection test toast
export const showConnectionTest = async () => {
  const { apiClient, getApiBaseUrl } = await import('./api');
  const baseUrl = getApiBaseUrl();
  
  Toast.show({
    type: 'info',
    text1: 'Testing Connection',
    text2: `Connecting to ${baseUrl}...`,
    position: 'top',
    visibilityTime: 5000,
  });

  try {
    // Test basic health endpoint
    const healthResult = await apiClient.testConnection();
    
    if (healthResult.success) {
      showToast.success('Backend connected successfully!', 'Connection Test');
      
      // Test additional endpoints to verify full functionality
      setTimeout(async () => {
        try {
          // Test auth endpoints (these should work without authentication)
          const authTest = await fetch(`${baseUrl}/auth/google`);
          if (authTest.ok) {
            showToast.info('Auth endpoints working', 'Full Backend Test');
          }
        } catch (error) {
          console.log('Auth endpoint test failed (expected if not authenticated)');
        }
      }, 1000);
      
    } else {
      showToast.error(healthResult.error || 'Connection failed', 'Connection Test');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showToast.error(`Unable to connect: ${errorMessage}`, 'Connection Test Failed');
    console.error('Connection test error:', error);
  }
};