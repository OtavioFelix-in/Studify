// Faixa que aparece em qualquer aba enquanto o Pomodoro está rodando,
// mostrando o tempo que falta. Toque para abrir o cronômetro.

import { useMemo } from 'react';
import { Lucide } from '@react-native-vector-icons/lucide';
import { Pressable, StyleSheet, Text } from 'react-native';
import { formatClock, usePomodoro } from '../pomodoro/pomodoro-store';
import { fonts } from '../theme';
import { useTheme } from '../theme-context';

export default function PomodoroBanner({ onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { running, mode, remaining } = usePomodoro();

  if (!running) return null;
  return (
    <Pressable style={styles.banner} onPress={onPress}>
      <Lucide name={mode === 'foco' ? 'timer' : 'coffee'} size={16} color={colors.onPrimary} />
      <Text style={styles.text}>
        {mode === 'foco' ? 'Focando' : 'Pausa'} · {formatClock(remaining)}
      </Text>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    banner: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    text: {
      color: colors.onPrimary,
      fontSize: 14,
      fontFamily: fonts.bold,
      fontVariant: ['tabular-nums'],
    },
  });
}
