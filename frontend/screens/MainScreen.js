// screens/MainScreen.js
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Text,
  ActivityIndicator,
} from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';

import AnnouncementHeader from '../components/AnnouncementHeader';
import RealtimeHistoryTabs from '../components/RealtimeHistoryTabs';
import Keywords from '../components/Keywords';
import LiveRecording from '../components/LiveRecording';
import ListeningStatus from '../components/ListeningStatus';
import BroadcastHistory from '../components/BroadcastHistory';
import SettingsScreen from './SettingsScreen';
import { useSettings } from '../context/SettingsContext';
import { useSession } from '../context/SessionContext';
import { useKeywordAlert } from '../hooks/useKeywordAlert';
import CoreInfo from '../components/CoreInfo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHUNK_DURATION_MS = 10000;
const MAX_RECORDING_MS = 90000;

export default function MainScreen() {
  const { theme, settings } = useSettings();
  const {
    sessionId,
    lastSessionId, // (유지) - 하지만 결과 조회 타겟으로는 더 이상 믿지 않음
    resetSession,
    loading: sessionLoading,
    uploadAudioChunk,
    fetchSessionResults,
    fetchSessionStatus,
  } = useSession();

  const [route, setRoute] = useState('home');
  const [tab, setTab] = useState('realtime');
  const [recording, setRecording] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const intervalRef = useRef(null);

  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedRef = useRef(0);
  const recordingRef = useRef(false);

  // ✅ [FIX] “방금 종료된 세션(결과 조회 대상)”을 state 말고 ref로 확정 저장
  const endedSessionIdRef = useRef(null);

  // ✅ (상태조회 알림 중복 방지용)
  const alertedKeysRef = useRef(new Set());

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  const paddings = useMemo(
    () => ({
      outerPad: Math.round(16 * theme.scale),
      bottomPad: Math.round(120 * theme.scale),
    }),
    [theme.scale],
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // 🔔 키워드 감지 시 실제 OS 알림 보내기
  const handleKeywordAlert = useCallback(
    async ({ keyword }) => {
      if (!settings.alertsEnabled) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 키워드 감지',
          body: `"${keyword}" 키워드가 감지되었습니다.`,
        },
        trigger: null,
      });
    },
    [settings.alertsEnabled],
  );

  // SSE 구독 (그대로)
  useKeywordAlert(handleKeywordAlert);

  // ✅ 상태조회 기반 키워드 알림 폴링 (녹음 중 + 현재 sessionId로)
  useEffect(() => {
    if (!recording) return;
    if (!sessionId) return;
    if (!settings.alertsEnabled) return;

    let alive = true;
    const INTERVAL = 2000;

    const tick = async () => {
      try {
        const statusRes = await fetchSessionStatus(sessionId);
        const alerts = Array.isArray(statusRes?.keyword_alerts)
          ? statusRes.keyword_alerts
          : [];

        for (const a of alerts) {
          const keyword = String(a?.keyword ?? '').trim();
          if (!keyword) continue;

          const key = `${a?.broadcast_id ?? ''}:${keyword}:${a?.detected_at ?? ''}`;
          if (alertedKeysRef.current.has(key)) continue;
          alertedKeysRef.current.add(key);

          await handleKeywordAlert({ keyword });
        }
      } catch (e) {
        console.log('[StatusPoll] 상태 조회 실패:', e?.message ?? e);
      }
    };

    tick();
    const t = setInterval(() => {
      if (!alive) return;
      tick();
    }, INTERVAL);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [recording, sessionId, settings.alertsEnabled, fetchSessionStatus, handleKeywordAlert]);

  // --------------------------------------------
  // ⭐ COMPLETE 될 때까지 상태 조회 + 결과 조회
  // --------------------------------------------
  // ✅ [FIX] targetId를 “인자로” 받도록 변경 (state(lastSessionId)에 의존 X)
  const waitForCompleteAndShowResults = useCallback(
    async (targetId) => {
      if (!targetId) {
        Alert.alert('세션 오류', '조회할 세션 ID가 없습니다.');
        return;
      }

      setResultsLoading(true);

      const INTERVAL = 2000;
      const TIMEOUT = 30000; // 30초
      const startTime = Date.now();

      try {
        while (true) {
          const statusRes = await fetchSessionStatus(targetId);
          console.log('[Status]', statusRes);

          if (statusRes?.status === 'COMPLETE') {
            console.log('[Session] COMPLETE → 결과 조회 (targetId=', targetId, ')');
            await fetchSessionResults(targetId);
            setTab('history');
            break;
          }

          if (Date.now() - startTime > TIMEOUT) {
            Alert.alert('지연', '처리가 오래 걸립니다. 잠시 후 다시 확인해주세요.');
            break;
          }

          await new Promise((r) => setTimeout(r, INTERVAL));
        }
      } finally {
        setResultsLoading(false);
      }
    },
    [fetchSessionStatus, fetchSessionResults],
  );

  // --------------------------------------------
  // 🔍 결과 보기 Alert
  // --------------------------------------------
  // ✅ [FIX] Alert에서 “ref에 저장된 endedSessionId”로 조회
  const askMoveToHistory = (title, message) => {
    Alert.alert(
      title,
      message,
      [
        { text: '계속하기', style: 'cancel' },
        {
          text: '결과 보기',
          onPress: () => {
            const targetId =
              endedSessionIdRef.current || lastSessionId || sessionId;
            console.log('[UI] 결과 보기 클릭 → targetId =', targetId);
            waitForCompleteAndShowResults(targetId);
          },
        },
      ],
      { cancelable: true }
    );
  };

  // --------------------------------------------
  // 녹음 제어
  // --------------------------------------------
  const startNewChunk = async () => {
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stopAndSaveChunk = async (durationSec = 10) => {
    await audioRecorder.stop();
    const uri = audioRecorder.uri;
    await uploadAudioChunk(uri, durationSec);
  };

  const handleAutoStopAtLimit = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
    recordingRef.current = false;

    alertedKeysRef.current = new Set();
    askMoveToHistory('녹음 종료', '최대 녹음 시간에 도달했습니다.');
  };

  const toggleRecording = async () => {
    if (recording) {
      // ✅ [FIX] “녹음 종료 시점의 sessionId”를 확정 저장
      const endedId = sessionId;
      endedSessionIdRef.current = endedId;
      console.log('[Session] 녹음 종료 → endedSessionIdRef =', endedId);

      // 종료
      setRecording(false);
      recordingRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);

      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      await uploadAudioChunk(uri, null);

      // 세션 교체 (새 sessionId 생성)
      await resetSession(keywords);

      elapsedRef.current = 0;
      setElapsedMs(0);

      alertedKeysRef.current = new Set();

      askMoveToHistory('녹음 종료', '지금까지 녹음된 결과를 확인하시겠습니까?');
      return;
    }

    // 시작
    if (sessionLoading || !sessionId) {
      Alert.alert('세션 준비 중', '잠시 후 다시 시도해주세요.');
      return;
    }

    // ✅ 새 녹음 시작 시: 이전 종료 세션 타겟 초기화
    endedSessionIdRef.current = null;

    alertedKeysRef.current = new Set();

    setRecording(true);
    recordingRef.current = true;
    elapsedRef.current = 0;
    setElapsedMs(0);

    await startNewChunk();

    intervalRef.current = setInterval(async () => {
      if (!recordingRef.current) return;

      await stopAndSaveChunk(10);

      elapsedRef.current += CHUNK_DURATION_MS;
      setElapsedMs(elapsedRef.current);

      if (elapsedRef.current >= MAX_RECORDING_MS) {
        handleAutoStopAtLimit();
      } else {
        await startNewChunk();
      }
    }, CHUNK_DURATION_MS);
  };

  if (route === 'settings') {
    return <SettingsScreen onClose={() => setRoute('home')} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: paddings.outerPad,
            gap: Math.round(12 * theme.scale),
            paddingBottom: paddings.bottomPad,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AnnouncementHeader onPressSettings={() => setRoute('settings')} />
        <RealtimeHistoryTabs tab={tab} onChangeTab={setTab} />

        {tab === 'realtime' ? (
          <>
            <CoreInfo />
            <Keywords onChange={setKeywords} />
            {recording && <ListeningStatus />}
          </>
        ) : (
          <BroadcastHistory keywords={keywords} maxCount={5} />
        )}
      </ScrollView>

      <LiveRecording
        recording={recording}
        onToggle={toggleRecording}
        disabled={sessionLoading && !recording}
      />

      {resultsLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            세션 결과를 불러오는 중입니다...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {},
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});
