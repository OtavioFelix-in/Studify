// Barra de navegação inferior, feita à mão (sem biblioteca de navegação).

import { useMemo } from 'react';
import { Lucide } from '@react-native-vector-icons/lucide';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme';
import { useTheme } from '../theme-context';

const TABS = [
  { key: 'tasks', icon: 'list-checks', label: 'Tarefas' },
  { key: 'calendar', icon: 'calendar-days', label: 'Calendário' },
  { key: 'pomodoro', icon: 'timer', label: 'Pomodoro' },
  { key: 'stats', icon: 'chart-column', label: 'Resumo' },
];

export default function TabBar({ active, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Lucide name={tab.icon} size={20} color={isActive ? colors.primary : colors.textMuted} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
      paddingBottom: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    iconWrap: {
      paddingHorizontal: 16,
      paddingVertical: 3,
      borderRadius: 4,
    },
    iconWrapActive: {
      backgroundColor: colors.primaryLight,
    },
    label: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    labelActive: {
      color: colors.primary,
      fontFamily: fonts.bold,
    },
  });
}
