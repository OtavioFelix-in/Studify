// Tela principal: a folha de caderno com as tarefas, busca e filtro por módulo/matéria.
// Toque na linha edita; toque no quadrado conclui (com confete); longo apaga.

import { Lucide } from '@react-native-vector-icons/lucide';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { clearAttachments, saveAttachments } from '../attachments/attachments';
import SubjectsManager from '../components/SubjectsManager';
import TaskForm from '../components/TaskForm';
import FolhaItem, { PAUTA } from '../components/FolhaItem';
import * as db from '../db/database';
import { cancelReminder, scheduleTaskReminder } from '../notifications/notifications';
import { queueSync } from '../sync/sync';
import { CONFETTI_COLORS, fonts, taskTypes } from '../theme';
import { useTheme } from '../theme-context';
import { isOverdue, nextLabel, nextRepeatDate } from '../utils/date';

const LOGO = {
  light: require('../../assets/logo-horizontal-claro.png'),
  dark: require('../../assets/logo-horizontal-escuro.png'),
};

export default function HomeScreen() {
  const { colors, isDark, mode, cycleMode } = useTheme();
  const { fontScale } = useWindowDimensions();
  const pauta = PAUTA * fontScale;
  const margem = Math.round(70 * Math.min(fontScale, 1.4));
  const styles = useMemo(() => createStyles(colors, pauta, margem), [colors, pauta, margem]);

  const [tasks, setTasks] = useState([]);
  const [stepCounts, setStepCounts] = useState({});
  const [photoCounts, setPhotoCounts] = useState({});
  const [formVisible, setFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [managerVisible, setManagerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [celebrate, setCelebrate] = useState(0);
  const [showDone, setShowDone] = useState(false);
  const [folhaHeight, setFolhaHeight] = useState(0);
  const [conteudoHeight, setConteudoHeight] = useState(0);
  const modules = useRef([]);
  const subjects = useRef([]);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    modules.current = db.getModules();
    subjects.current = db.getSubjects();
    setTasks(db.getTasks());
    const counts = {};
    for (const row of db.getStepCounts()) {
      counts[row.task_uuid] = { total: row.total, done: row.done ?? 0 };
    }
    setStepCounts(counts);
    const photos = {};
    for (const row of db.getAttachmentCounts()) photos[row.task_uuid] = row.total;
    setPhotoCounts(photos);
  }

  function openNew() {
    setEditingTask(null);
    setFormVisible(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setFormVisible(true);
  }

  async function handleSave({ title, type, subjectId, dueDate, remindMinutes, repeatDays, grade, steps, photos }) {
    if (editingTask) {
      await cancelReminder(editingTask.notification_id);
    }
    const notificationId = await scheduleTaskReminder(
      title,
      taskTypes[type].label,
      dueDate,
      remindMinutes
    );
    const fields = {
      title,
      type,
      subjectId,
      dueDate: dueDate.toISOString(),
      remindMinutes,
      repeatDays,
      grade,
      notificationId,
    };
    let taskUuid;
    if (editingTask) {
      db.updateTask({ id: editingTask.id, ...fields });
      taskUuid = editingTask.uuid;
    } else {
      taskUuid = db.addTask(fields);
    }
    db.replaceSteps(taskUuid, steps);
    saveAttachments(taskUuid, photos);
    setFormVisible(false);
    setEditingTask(null);
    queueSync();
    refresh();
  }

  async function handleToggle(task) {
    const nowDone = task.done !== 1;
    if (nowDone) {
      await cancelReminder(task.notification_id);
      db.setTaskDone(task.id, true);
      await spawnNextOccurrence(task);
      setCelebrate((c) => c + 1);
    } else {
      db.setTaskDone(task.id, false);
    }
    queueSync();
    refresh();
  }

  // Tarefa com repetição: ao concluir, nasce a próxima ocorrência.
  async function spawnNextOccurrence(task) {
    if (!task.repeat_days) return;
    const next = nextRepeatDate(new Date(task.due_date), task.repeat_days);
    if (!next) return;
    db.clearTaskRepeat(task.id); // esta ocorrência já gerou a próxima
    const notificationId = await scheduleTaskReminder(
      task.title,
      (taskTypes[task.type] ?? taskTypes.tarefa).label,
      next,
      task.remind_minutes
    );
    const newUuid = db.addTask({
      title: task.title,
      type: task.type,
      subjectId: task.subject_id,
      dueDate: next.toISOString(),
      remindMinutes: task.remind_minutes,
      repeatDays: task.repeat_days,
      grade: null,
      notificationId,
    });
    // Etapas renascem desmarcadas na nova ocorrência.
    const steps = db.getSteps(task.uuid).map((s) => ({ title: s.title, done: false }));
    if (steps.length > 0) db.replaceSteps(newUuid, steps);
  }

  function handleDelete(task) {
    Alert.alert('Apagar tarefa', `Quer mesmo apagar "${task.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await cancelReminder(task.notification_id);
          db.deleteTask(task.id);
          clearAttachments(task.uuid);
          queueSync();
          refresh();
        },
      },
    ]);
  }

  const moduleSubjects = moduleFilter
    ? subjects.current.filter((s) => s.module_id === moduleFilter)
    : [];

  const visibleTasks = tasks.filter((t) => {
    if (subjectFilter && t.subject_id !== subjectFilter) return false;
    if (!subjectFilter && moduleFilter && t.subject_module_id !== moduleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const inTitle = t.title.toLowerCase().includes(q);
      const inSubject = (t.subject_name ?? '').toLowerCase().includes(q);
      if (!inTitle && !inSubject) return false;
    }
    return true;
  });

  const pendentes = tasks.filter((t) => t.done === 0);
  const atrasadas = pendentes.filter((t) => isOverdue(t.due_date));
  const proxima = pendentes.find((t) => !isOverdue(t.due_date));
  const listaPendentes = visibleTasks.filter((t) => t.done === 0);
  const listaFeitas = visibleTasks.filter((t) => t.done === 1);
  const totalLinhas = Math.ceil(Math.max(folhaHeight, conteudoHeight) / pauta) + 1;

  function renderItem(item) {
    return (
      <FolhaItem
        key={item.id}
        task={item}
        stepCount={stepCounts[item.uuid]}
        photoCount={photoCounts[item.uuid]}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onEdit={openEdit}
        pauta={pauta}
        margem={margem}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Image
            source={isDark ? LOGO.dark : LOGO.light}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Studify"
          />
        </View>
        <Pressable style={styles.headerButton} onPress={() => setManagerVisible(true)}>
          <Lucide name="library" size={20} color={colors.text} />
        </Pressable>
        <Pressable style={styles.headerButton} onPress={cycleMode}>
          <Lucide
            name={mode === 'auto' ? 'sun-moon' : mode === 'dark' ? 'moon' : 'sun'}
            size={20}
            color={colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.achado}>
        {pendentes.length === 0 ? <Text style={styles.achadoText}>Tudo em dia.</Text> : null}
        {atrasadas.length > 0 ? (
          <Text style={[styles.achadoText, styles.achadoAlerta]}>
            {atrasadas.length} {atrasadas.length === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}
          </Text>
        ) : null}
        {proxima ? (
          <Text style={styles.achadoText}>
            Próxima: <Text style={styles.achadoTarefa}>{proxima.title}</Text>, {nextLabel(proxima.due_date)}
          </Text>
        ) : null}
      </View>

      <View style={styles.search}>
        <Lucide name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tarefa ou matéria"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {modules.current.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            style={[styles.filterChip, moduleFilter === null && styles.filterChipActive]}
            onPress={() => {
              setModuleFilter(null);
              setSubjectFilter(null);
            }}
          >
            <Text style={[styles.filterText, moduleFilter === null && styles.filterTextActive]}>
              Todas
            </Text>
          </Pressable>
          {modules.current.map((mod) => (
            <Pressable
              key={mod.id}
              style={[styles.filterChip, moduleFilter === mod.id && styles.filterChipActive]}
              onPress={() => {
                setModuleFilter(moduleFilter === mod.id ? null : mod.id);
                setSubjectFilter(null);
              }}
            >
              <Text style={[styles.filterText, moduleFilter === mod.id && styles.filterTextActive]}>
                {mod.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {moduleFilter && moduleSubjects.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {moduleSubjects.map((s) => (
            <Pressable
              key={s.id}
              style={[
                styles.filterChip,
                subjectFilter === s.id && { backgroundColor: s.color, borderColor: s.color },
              ]}
              onPress={() => setSubjectFilter(subjectFilter === s.id ? null : s.id)}
            >
              <Text style={[styles.filterText, subjectFilter === s.id && styles.filterTextOnColor]}>
                ● {s.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.folha} onLayout={(e) => setFolhaHeight(e.nativeEvent.layout.height)}>
        <ScrollView contentContainerStyle={{ minHeight: folhaHeight }}>
          <View
            style={{ minHeight: folhaHeight }}
            onLayout={(e) => setConteudoHeight(e.nativeEvent.layout.height)}
          >
            {Array.from({ length: totalLinhas }, (_, i) => (
              <View key={i} style={[styles.linhaPauta, { top: i * pauta + pauta * 0.82 - 1 }]} />
            ))}
            <View style={styles.linhaMargem} />

            <View style={{ paddingTop: pauta, paddingBottom: pauta * 2 }}>
              {visibleTasks.length === 0 ? (
                <View style={[styles.linhaSolta, { marginBottom: pauta }]}>
                  <Text style={styles.linhaSoltaText}>
                    {tasks.length === 0 ? 'Nenhuma tarefa ainda.' : 'Nada por aqui com esse filtro.'}
                  </Text>
                </View>
              ) : null}

              {listaPendentes.map(renderItem)}

              <Pressable
                style={styles.linhaSolta}
                onPress={openNew}
                accessibilityRole="button"
                accessibilityLabel="Nova tarefa"
              >
                <Text style={styles.linhaSoltaText}>
                  <Text style={styles.mais}>+ </Text>escreva a próxima tarefa
                </Text>
              </Pressable>

              {listaFeitas.length > 0 ? (
                <Pressable
                  style={[styles.linhaSolta, { marginTop: pauta, marginBottom: showDone ? pauta : 0 }]}
                  onPress={() => setShowDone((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showDone }}
                >
                  <Text style={[styles.linhaSoltaText, styles.feitasText]}>
                    Feitas ({listaFeitas.length}) {showDone ? '⌄' : '›'}
                  </Text>
                </Pressable>
              ) : null}

              {showDone ? listaFeitas.map(renderItem) : null}
            </View>
          </View>
        </ScrollView>
      </View>

      <TaskForm
        visible={formVisible}
        task={editingTask}
        onSave={handleSave}
        onClose={() => {
          setFormVisible(false);
          setEditingTask(null);
        }}
      />

      <SubjectsManager
        visible={managerVisible}
        onClose={() => setManagerVisible(false)}
        onChanged={refresh}
      />

      {celebrate > 0 && (
        <ConfettiCannon
          key={celebrate}
          count={70}
          origin={{ x: Dimensions.get('window').width / 2, y: -10 }}
          colors={CONFETTI_COLORS}
          fadeOut
          autoStart
        />
      )}
    </View>
  );
}

function createStyles(colors, pauta, margem) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 8,
    },
    logo: {
      width: 145,
      height: 35,
    },
    achado: {
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    achadoText: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
    },
    achadoAlerta: {
      fontFamily: fonts.bold,
      color: colors.danger,
    },
    achadoTarefa: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    search: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
    },
    filterScroll: {
      flexGrow: 0,
      marginBottom: 8,
    },
    filterRow: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterChip: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      paddingVertical: 7,
      paddingHorizontal: 14,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.text,
    },
    filterTextActive: {
      color: colors.onPrimary,
      fontFamily: fonts.semibold,
    },
    filterTextOnColor: {
      color: '#FFFFFF',
      fontFamily: fonts.semibold,
    },
    folha: {
      flex: 1,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    linhaPauta: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.primaryLight,
    },
    linhaMargem: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: margem,
      width: 2,
      backgroundColor: colors.danger,
      opacity: 0.5,
    },
    linhaSolta: {
      paddingLeft: margem + 12,
      paddingRight: 16,
    },
    linhaSoltaText: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: PAUTA,
      color: colors.textMuted,
    },
    mais: {
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    feitasText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
  });
}
