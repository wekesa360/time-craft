import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../constants/dynamicTheme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View
          style={{
            width: '100%',
            backgroundColor: theme.colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: 16,
          }}
        >
          <Text style={{ color: theme.colors.foreground, fontSize: 18, fontWeight: '700' }}>{title}</Text>
          {description ? (
            <Text style={{ color: theme.colors.muted, marginTop: 8 }}>{description}</Text>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginRight: 8,
              }}
            >
              <Text style={{ color: theme.colors.muted, fontWeight: '600' }}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: theme.colors.primary,
                borderWidth: 1,
                borderColor: theme.colors.primary + '66',
              }}
            >
              <Text style={{ color: theme.colors.primaryForeground, fontWeight: '700' }}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
