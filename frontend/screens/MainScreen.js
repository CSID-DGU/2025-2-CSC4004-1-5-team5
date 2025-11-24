// screens/MainScreen.js
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Text,
  Image,
  Pressable,
} from 'react-native';
import * as Notifications from 'expo-notifications';

// expo-audio용 API 임포트
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';

// 컴포넌트 임포트
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

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHUNK_DURATION_MS = 10000;  // 10초
const MAX_RECORDING_MS = 90000;   // 1분 30초

export default function MainScreen() {
  const { theme, settings } = useSettings();
  const {
    sessionId,
    resetSession,
    loading: sessionLoading,
    uploadAudioChunk,
    fetchSessionResults,     // ✅ 결과 조회 함수 사용
  } = useSession();

  const [route, setRoute] = useState('home');
  const [tab, setTab] = useState('realtime');
  const [recording, setRecording] = useState(false);
  const [keywords, setKeywords] = useState([]);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const intervalRef = useRef(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedRef = useRef(0);
  const recordingRef = useRef(false);

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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 🔔 키워드 감지 시 실제 OS 알림 보내기
  const handleKeywordAlert = useCallback(
    async ({ keyword, detectedAt }) => {
      // 설정에서 알림이 꺼져 있으면 무시
      if (!settings.alertsEnabled) {
        console.log('[KeywordAlert] 알림 비활성화 상태, 무시');
        return;
      }

      console.log('[KeywordAlert] 키워드 감지:', keyword, detectedAt);

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔔 키워드 감지',
            body: `"${keyword}" 키워드가 감지되었습니다.`,
            sound: 'default',
          },
          // null → 즉시 발송 (포그라운드/백그라운드 상단 알림)
          trigger: null,
        });
      } catch (e) {
        console.log('[KeywordAlert] 알림 전송 실패:', e);
      }
    },
    [settings.alertsEnabled],
  );

  // ✅ SSE로 /session/{id}/stream/ 구독해서 keyword_alert 받기
  useKeywordAlert(handleKeywordAlert);

  // --- 녹음 관련 로직 ---

  const startNewChunk = async () => {
    try {
      console.log('새로운 10초 청크 녹음 시작...');
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error('새 청크 녹음 시작 실패:', err);
      Alert.alert('녹음 실패', '새 녹음 시작에 실패했습니다.');
    }
  };

  const stopAndSaveChunk = async (durationSec = 10) => {
    try {
      console.log('이전 10초 청크 저장/업로드 중...');
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      console.log('10초 청크 저장 완료:', uri);
      await uploadAudioChunk(uri, durationSec);
    } catch (error) {
      console.error('청크 저장/업로드 실패:', error);
    }
  };

  // ✅ 공통 결과 이동 알림 함수
  const askMoveToHistory = (title, message) => {
    Alert.alert(
      title,
      message,
      [
        { text: '계속하기', style: 'cancel' },
        {
          text: '결과 보기',
          onPress: async () => {
            // 🔹 직전 세션(lastSessionId 기준) 결과 조회 → SessionContext.sessionResults에 저장
            await fetchSessionResults();
            // 🔹 탭을 history로 전환 (BroadcastHistory + CoreInfo 둘 다 최신 결과 사용)
            setTab('history');
          },
        },
      ],
      { cancelable: true }
    );
  };

  // 1. 시간 초과로 인한 자동 종료
  const handleAutoStopAtLimit = () => {
    console.log('최대 녹음 시간(1분 30초) 도달, 자동 종료');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setRecording(false);
    recordingRef.current = false;

    askMoveToHistory(
      '녹음 시간 종료',
      '최대 녹음 시간(1분 30초)에 도달했습니다.\n지금까지 녹음된 내용을 확인하시겠습니까?'
    );
  };

  // 2. 사용자가 버튼 눌러서 수동 종료 (+시작)
  const toggleRecording = async () => {
    // 이미 녹음 중이면 → 녹음 종료
    if (recording) {
      console.log('전체 녹음을 중지합니다...');
      setRecording(false);
      recordingRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      try {
        // 마지막 청크도 서버로 전송
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        console.log('마지막 청크 저장 완료:', uri);
        await uploadAudioChunk(uri, null);

        console.log('녹음 종료됨. 새 세션으로 교체를 요청합니다...');
        await resetSession(keywords); // 세션 교체 (결과 조회용 ID 저장됨)

        elapsedRef.current = 0;
        setElapsedMs(0);

        askMoveToHistory(
          '녹음 종료',
          '녹음이 종료되었습니다.\n지금까지 녹음된 결과를 확인하시겠습니까?'
        );
      } catch (error) {
        console.error('마지막 청크 중지/업로드 또는 세션 리셋 실패:', error);
      }
      return;
    }

    // 녹음 시작
    if (sessionLoading) {
      Alert.alert('세션 준비 중', '세션이 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (!sessionId) {
      Alert.alert('세션 오류', '세션 ID가 없습니다. 앱을 다시 시작해주세요.');
      return;
    }

    console.log(`[Session: ${sessionId}] 10초 단위 청크 녹음을 시작합니다...`);
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
        keyboardShouldPersistTaps="handled"
      >
        <AnnouncementHeader onPressSettings={() => setRoute('settings')} />
        <RealtimeHistoryTabs tab={tab} onChangeTab={setTab} />

        {tab === 'realtime' ? (
          <>
            {/* 🔹 CoreInfo: 서버 결과 summary / info 표시 */}
            <CoreInfo />

            {/* 키워드 설정 */}
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
    </View>
  );
}

// --- 헬퍼 스타일 ---

const t = (theme, base) => ({
  fontSize: Math.round(base * theme.scale),
  fontWeight: theme.weight,
  color: theme.colors.text,
});
const ts = (theme, base) => ({
  fontSize: Math.round(base * theme.scale),
  color: theme.colors.sub,
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {},
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leadImg: { width: 20, height: 20, resizeMode: 'contain' },
  cardTitle: { fontWeight: '700' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontWeight: '700' },
  helpText: {},
  tipBox: { backgroundColor: '#EEF6FF', borderRadius: 10, padding: 10 },
  tipText: {},
});
