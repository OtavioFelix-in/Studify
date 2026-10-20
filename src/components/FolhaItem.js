import { useMemo } from 'react';
import { Lucide } from '@react-native-vector-icons/lucide';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme-context';
import { fonts, subjectTextColor } from '../theme';
import { dueWord, isOverdue, repeatLabel, shortDay, shortHour } from '../utils/date';

export const PAUTA = 34;

const TIPO = {
  prova: { label: 'prova', color: 'danger' },
  trabalho: { label: 'trab.', color: 'primary' },
};

export default function FolhaItem({ task, stepCount, photoCount, onToggle, onDelete, onEdit, pauta, margem }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, pauta, margem), [colors, pauta, margem]);

  const done = task.done === 1;
  const late = !done && isOverdue(task.due_date);
  const tipo = TIPO[task.type];

  const meta = [];
  if (task.subject_name) {
    meta.push(
      <Text
        key="mat"
        style={[styles.metaText, styles.subject, { color: subjectTextColor(task.subject_color, isDark) ?? colors.textMuted }]}
      >
        ● {task.subject_name}
      </Text>
    );
  }
  meta.push(
    <Text key="quando" style={[styles.metaText, late && styles.late]}>
      {shortHour(task.due_date)}, {done ? 'feita' : dueWord(task.due_date)}
    </Text>
  );
  if (task.repeat_days) {
    meta.push(
      <View key="rep" style={styles.metaIcon} accessibilityLabel={`Repete ${repeatLabel(task.repeat_days)}`}>
        <Lucide name="repeat" size={14} color={colors.textMuted} />
      </View>
    );
  }
  if (stepCount && stepCount.total > 0) {
    meta.push(
      <View key="etapas" style={styles.metaIcon} accessibilityLabel={`${stepCount.done} de ${stepCount.total} etapas feitas`}>
        <Lucide name="list-checks" size={14} color={colors.textMuted} />
        <Text style={styles.metaText}>
          {stepCount.done}/{stepCount.total}
        </Text>
      </View>
    );
  }
  if (photoCount > 0) {
    meta.push(
      <View key="fotos" style={styles.metaIcon} accessibilityLabel={`${photoCount} fotos`}>
        <Lucide name="image" size={14} color={colors.textMuted} />
        <Text style={styles.metaText}>{photoCount}</Text>
      </View>
    );
  }
  if (task.grade != null) {
    meta.push(
      <Text key="nota" style={styles.metaText}>
        nota {task.grade}
      </Text>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, done && styles.rowDone, pressed && styles.rowPressed]}
      onPress={() => (onEdit ? onEdit(task) : onToggle(task))}
      onLongPress={() => onDelete(task)}
    >
      <View style={styles.margem}>
        <Text style={[styles.margemText, styles.dia, late && styles.late]}>{shortDay(task.due_date)}</Text>
        {tipo ? (
          <Text style={[styles.margemText, styles.tipo, { color: colors[tipo.color] }]}>{tipo.label}</Text>
        ) : null}
      </View>

      <View style={styles.corpo}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={3}>
          {task.title}
        </Text>
        <View style={styles.meta}>{meta}</View>
      </View>

      <Pressable
        style={styles.checkArea}
        hitSlop={8}
        onPress={() => onToggle(task)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? `Desmarcar ${task.title}` : `Marcar ${task.title} como feita`}
      >
        <View style={[styles.check, done && styles.checkDone]}>
          {done ? <Lucide name="check" size={16} color={colors.card} /> : null}
        </View>
      </Pressable>
    </Pressable>
  );
}

function createStyles(colors, pauta, margem) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      marginBottom: pauta,
    },
    rowDone: {
      opacity: 0.55,
    },
    rowPressed: {
      backgroundColor: colors.primaryLight,
    },
    margem: {
      width: margem,
      paddingLeft: 6,
      paddingRight: 10,
      alignItems: 'flex-end',
    },
    margemText: {
      fontSize: 14,
      lineHeight: PAUTA,
      textAlign: 'right',
    },
    dia: {
      fontFamily: fonts.semibold,
      color: colors.textMuted,
    },
    tipo: {
      fontFamily: fonts.extrabold,
    },
    corpo: {
      flex: 1,
      paddingLeft: 12,
    },
    title: {
      fontFamily: fonts.semibold,
      fontSize: 18,
      lineHeight: PAUTA,
      color: colors.primary,
    },
    titleDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    meta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 10,
    },
    metaText: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: PAUTA,
      color: colors.textMuted,
    },
    subject: {
      fontFamily: fonts.semibold,
    },
    metaIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      height: pauta,
    },
    late: {
      color: colors.danger,
      fontFamily: fonts.semibold,
    },
    checkArea: {
      width: 52,
      height: pauta,
      alignItems: 'center',
      justifyContent: 'center',
    },
    check: {
      width: 24,
      height: 24,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkDone: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
  });
}
