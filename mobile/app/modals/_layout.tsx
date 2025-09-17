import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="create-task" />
      <Stack.Screen name="log-nutrition" />
      <Stack.Screen name="log-exercise" />
      <Stack.Screen name="log-mood" />
      <Stack.Screen name="log-hydration" />
    </Stack>
  );
}