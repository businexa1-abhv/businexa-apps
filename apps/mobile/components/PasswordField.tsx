import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/styles/theme';

type Props = Omit<TextInputProps, 'secureTextEntry'>;

export function PasswordField({ style, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={[styles.input, style]}
        secureTextEntry={!visible}
        placeholderTextColor={colors.textLight}
        {...props}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        style={styles.eyeBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textLight} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    minHeight: 48,
  },
  eyeBtn: {
    padding: spacing.sm,
    paddingRight: spacing.md,
  },
});
