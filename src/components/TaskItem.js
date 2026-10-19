// Card de uma tarefa na lista.
// Toque no card: edita (ou marca, se a tela não tiver edição).
// Toque no círculo: marca/desmarca como concluída. Toque longo: apagar.

import { useMemo } from 'react';
import { Lucide } from '@react-native-vector-icons/lucide';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme-context';
import { fonts, subjectTextColor, taskTypes } from '../theme';
import { formatDateTime, isOverdue, relativeLabel, repeatLabel } from '../utils/date';

export default function TaskItem({ task, onToggle, onDelete, onEdit, stepCount, photoCount }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const type = taskTypes[task.type] ?? taskTypes.tarefa;
  const done = task.done === 1;
  const late = !done && isOverdue(task.due_date);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, done && styles.cardDone, pressed && styles.cardPressed]}
      onPress={() => (onEdit ? onEdit(task) : onToggle(task))}
      onLongPress={() => onDelete(task)}
    >
      <View style={[styles.typeBadge, { backgroundColor: `${type.color}22` }]}>
        <Lucide name={type.icon} size={20} color={type.color} />
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>

        <View style={styles.tagsRow}>
          {task.subject_name ? (
            <Text style={[styles.subject, { color: subjectTextColor(task.subject_color, isDark) ?? colors.textMuted }]}>
              ● {task.subject_name}
            </Text>
          ) : null}
          {task.repeat_days ? (
            <View style={styles.tagBox}>
              <Lucide name="repeat" size={12} color={colors.textMuted} />
              <Text style={styles.tag}>{repeatLabel(task.repeat_days)}</Text>
            </View>
          ) : null}
          {stepCount && stepCount.total > 0 ? (
            <View style={styles.tagBox}>
              <Lucide name="list-checks" size={12} color={colors.textMuted} />
              <Text style={styles.tag}>
                {stepCount.done}/{stepCount.total}
              </Text>
            </View>
          ) : null}
          {photoCount > 0 ? (
            <View style={styles.tagBox}>
              <Lucide name="image" size={12} color={colors.textMuted} />
              <Text style={styles.tag}>{photoCount}</Text>
            </View>
          ) : null}
          {task.grade != null ? <Text style={styles.tag}>nota {task.grade}</Text> : null}
        </View>

        <Text style={[styles.date, late && styles.dateLate]}>
          {formatDateTime(task.due_date)} · {done ? 'concluída' : relativeLabel(task.due_date)}
        </Text>
      </View>

      <Pressable
        style={[styles.check, done && styles.checkDone]}
        hitSlop={12}
        onPress={() => onToggle(task)}
      >
        {done ? <Lucide name="check" size={16} color={colors.card} /> : null}
      </Pressable>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginHorizontal: 16,
      marginBottom: 10,
      gap: 12,
    },
    cardDone: {
      opacity: 0.55,
    },
    cardPressed: {
      transform: [{ scale: 0.98 }],
    },
    typeBadge: {
      width: 44,
      height: 44,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    titleDone: {
      textDecorationLine: 'line-through',
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 2,
    },
    subject: {
      fontSize: 13,
      fontFamily: fonts.semibold,
    },
    tagBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    tag: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    date: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    dateLate: {
      color: colors.danger,
      fontFamily: fonts.semibold,
    },
    check: {
      width: 26,
      height: 26,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkDone: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
  });
}
