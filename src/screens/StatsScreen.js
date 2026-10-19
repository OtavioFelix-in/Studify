// Resumo dos estudos: streak, tarefas, pomodoros, média das provas por matéria,
// backup local e conta de sincronização (Supabase).

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide';
import * as db from '../db/database';
import { getSessionUser, signIn, signOut, syncNow } from '../sync/sync';
import { isSyncConfigured } from '../sync/supabase';
import { fonts, subjectTextColor, taskTypes } from '../theme';
import { useTheme } from '../theme-context';
import { exportBackup, importBackup } from '../utils/backup';

function funMessage(stats, streak) {
  if (streak >= 7) return `${streak} dias seguidos de estudo. Imparável.`;
  if (stats.doneMonth >= 10) return `${stats.doneMonth} tarefas concluídas este mês.`;
  if (stats.doneMonth >= 5) return `${stats.doneMonth} tarefas concluídas no mês. Tá voando.`;
  if (stats.doneMonth >= 1)
    return `${stats.doneMonth} ${stats.doneMonth === 1 ? 'tarefa concluída' : 'tarefas concluídas'} este mês. Boa.`;
  if (stats.pending > 0) return 'Mês começando. Bora riscar a primeira?';
  return 'Tudo tranquilo por aqui.';
}

// Dias seguidos (terminando hoje ou ontem) com tarefa concluída ou pomodoro.
function computeStreak(dates) {
  const set = new Set(dates);
  const key = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cursor = new Date();
  if (!set.has(key(cursor))) cursor.setDate(cursor.getDate() - 1); // hoje ainda não estudou? conta até ontem
  let streak = 0;
  while (set.has(key(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(0);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refresh();
    getSessionUser().then(setUser).catch(() => {});
  }, []);

  function refresh() {
    setStats(db.getStats());
    setStreak(computeStreak(db.getActivityDates()));
  }

  async function handleSignIn() {
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      const u = await signIn(email.trim(), password);
      setUser(u);
      setPassword('');
      await syncNow();
      refresh();
      Alert.alert('Conta conectada', 'Seus dados agora sincronizam entre os aparelhos.');
    } catch (e) {
      Alert.alert('Não deu certo', 'Confira o email e a senha e tente de novo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    setBusy(true);
    try {
      const result = await syncNow();
      refresh();
      Alert.alert(result.ok ? 'Sincronizado' : 'Sem conexão', result.ok ? 'Tudo atualizado.' : 'Tente de novo mais tarde.');
    } catch (e) {
      Alert.alert('Erro ao sincronizar', 'Verifique sua internet e tente de novo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert('Erro ao exportar', String(e?.message ?? e));
    }
  }

  function handleImport() {
    Alert.alert(
      'Importar backup',
      'Isso substitui TODOS os dados atuais pelos do arquivo. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          style: 'destructive',
          onPress: async () => {
            try {
              const done = await importBackup();
              if (done) {
                refresh();
                Alert.alert('Pronto', 'Backup importado.');
              }
            } catch (e) {
              Alert.alert('Erro ao importar', 'O arquivo não parece ser um backup do app.');
            }
          },
        },
      ]
    );
  }

  if (!stats) return null;

  const focusHours = Math.floor(stats.pomodoro.total_minutes / 60);
  const focusRest = stats.pomodoro.total_minutes % 60;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resumo</Text>
      <Text style={styles.subtitle}>{funMessage(stats, streak)}</Text>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>{streak}</Text>
          <Text style={styles.cardLabel}>dias seguidos{'\n'}de estudo</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>{stats.doneMonth}</Text>
          <Text style={styles.cardLabel}>concluídas{'\n'}este mês</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>{stats.pending}</Text>
          <Text style={styles.cardLabel}>pendentes</Text>
        </View>
        <View style={styles.card}>
          <Text style={[styles.cardNumber, stats.overdue > 0 && { color: colors.danger }]}>
            {stats.overdue}
          </Text>
          <Text style={styles.cardLabel}>atrasadas</Text>
        </View>
      </View>

      <View style={styles.wideCard}>
        <View style={styles.wideCardHeader}>
          <Lucide name="timer" size={18} color={colors.primary} />
          <Text style={styles.wideCardTitle}>Pomodoros este mês</Text>
        </View>
        <Text style={styles.wideCardText}>
          {stats.pomodoro.n === 0
            ? 'Nenhum ainda. Experimente a aba Pomodoro.'
            : `${stats.pomodoro.n} ${stats.pomodoro.n === 1 ? 'sessão' : 'sessões'} · ${
                focusHours > 0
                  ? `${focusHours}h${focusRest > 0 ? ` ${focusRest}min` : ''}`
                  : `${focusRest}min`
              } de foco total`}
        </Text>
      </View>

      <View style={styles.wideCard}>
        <View style={styles.wideCardHeader}>
          <Lucide name="graduation-cap" size={18} color={colors.primary} />
          <Text style={styles.wideCardTitle}>Média das provas por matéria</Text>
        </View>
        {stats.gradesBySubject.length === 0 ? (
          <Text style={styles.wideCardText}>
            Lance a nota nas provas (editando a tarefa) pra ver as médias aqui.
          </Text>
        ) : (
          stats.gradesBySubject.map((row) => (
            <View key={row.name} style={styles.typeRow}>
              <Text style={[styles.typeLabel, { color: subjectTextColor(row.color, isDark) }]}>● {row.name}</Text>
              <Text style={styles.typeCount}>
                {row.media} ({row.provas} {row.provas === 1 ? 'prova' : 'provas'})
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.wideCard}>
        <View style={styles.wideCardHeader}>
          <Lucide name="list-checks" size={18} color={colors.primary} />
          <Text style={styles.wideCardTitle}>Concluídas por tipo</Text>
        </View>
        {stats.byType.length === 0 ? (
          <Text style={styles.wideCardText}>Conclua a primeira tarefa pra ver aqui.</Text>
        ) : (
          stats.byType.map((row) => {
            const info = taskTypes[row.type] ?? taskTypes.tarefa;
            return (
              <View key={row.type} style={styles.typeRow}>
                <View style={styles.typeLabelRow}>
                  <Lucide name={info.icon} size={16} color={info.color} />
                  <Text style={styles.typeLabel}>{info.label}</Text>
                </View>
                <Text style={[styles.typeCount, { color: info.color }]}>{row.n}</Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.wideCard}>
        <View style={styles.wideCardHeader}>
          <Lucide name="cloud" size={18} color={colors.primary} />
          <Text style={styles.wideCardTitle}>Sincronização</Text>
        </View>
        {!isSyncConfigured() ? (
          <Text style={styles.wideCardText}>
            Ainda não configurada — veja o arquivo SUPABASE.md do projeto.
          </Text>
        ) : user ? (
          <>
            <Text style={styles.wideCardText}>Conectado como {user.email}</Text>
            <View style={styles.buttonRow}>
              <Pressable style={[styles.smallButton, styles.smallPrimary]} onPress={handleSync} disabled={busy}>
                <Text style={styles.smallPrimaryText}>{busy ? '...' : 'Sincronizar agora'}</Text>
              </Pressable>
              <Pressable
                style={styles.smallButton}
                onPress={async () => {
                  await signOut();
                  setUser(null);
                }}
              >
                <Text style={styles.smallText}>Sair</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable style={[styles.smallButton, styles.smallPrimary]} onPress={handleSignIn} disabled={busy}>
              <Text style={styles.smallPrimaryText}>{busy ? 'Entrando...' : 'Entrar'}</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.wideCard}>
        <View style={styles.wideCardHeader}>
          <Lucide name="hard-drive-download" size={18} color={colors.primary} />
          <Text style={styles.wideCardTitle}>Backup local</Text>
        </View>
        <View style={styles.buttonRow}>
          <Pressable style={[styles.smallButton, styles.smallPrimary]} onPress={handleExport}>
            <Text style={styles.smallPrimaryText}>Exportar</Text>
          </Pressable>
          <Pressable style={styles.smallButton} onPress={handleImport}>
            <Text style={styles.smallText}>Importar</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 32,
    },
    title: {
      fontSize: 28,
      fontFamily: fonts.extrabold,
      color: colors.primary,
    },
    subtitle: {
      fontSize: 15,
      color: colors.text,
      fontFamily: fonts.semibold,
      marginTop: 4,
      marginBottom: 20,
    },
    cardRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      alignItems: 'center',
    },
    cardNumber: {
      fontSize: 36,
      fontFamily: fonts.extrabold,
      color: colors.primary,
    },
    cardLabel: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    wideCard: {
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    wideCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    wideCardTitle: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    wideCardText: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
    },
    typeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    typeLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    typeLabel: {
      fontSize: 14,
      color: colors.text,
      fontFamily: fonts.semibold,
    },
    typeCount: {
      fontSize: 15,
      fontFamily: fonts.extrabold,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
      marginBottom: 8,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    smallButton: {
      flex: 1,
      borderRadius: 6,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    smallPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    smallPrimaryText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontFamily: fonts.bold,
    },
    smallText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: fonts.semibold,
    },
  });
}
