// screens/MainScreen.js
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Text,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

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

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 테스트 알림 전송 함수
async function scheduleTestNotification() {
  console.log('테스트 알림을 1초 후에 전송합니다...');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 알림 테스트',
      body: '알림 권한이 성공적으로 설정되었습니다!',
      sound: 'default',
    },
    trigger: { seconds: 1 },
  });
}

const CHUNK_DURATION_MS = 10000;  // 10초
const MAX_RECORDING_MS = 90000;   // 1분 30초

export default function MainScreen() {
  const { theme, settings, apply } = useSettings();
  const {
    sessionId,
    resetSession,
    loading: sessionLoading,
    uploadAudioChunk,
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

  const persist = (next) => apply(next);

  const toggleAlerts = async () => {
    if (settings.alertsEnabled) {
      persist({ ...settings, alertsEnabled: false });
      console.log('알림이 비활성화되었습니다.');
      return;
    }
    if (!Device.isDevice) {
      Alert.alert('알림 테스트', '시뮬레이터에서는 알림 권한을 요청할 수 없습니다.');
      persist({ ...settings, alertsEnabled: true });
      return;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      console.log('알림 권한을 요청합니다...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus === 'granted') {
      console.log('알림 권한이 허용되었습니다.');
      persist({ ...settings, alertsEnabled: true });
      await scheduleTestNotification();
    } else {
      console.log('알림 권한이 거부되었습니다.');
      Alert.alert(
        '알림 권한 필요',
        '키워드 알림을 받으려면 앱 설정에서 권한을 허용해야 합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

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

  // ✅ [추가] 공통 결과 이동 알림 함수
  const askMoveToHistory = (title, message) => {
    Alert.alert(
      title,
      message,
      [
        { text: '계속하기', style: 'cancel' }, // 현재 화면 유지
        {
          text: '결과 보기',
          onPress: () => {
            setTab('history'); // 결과 탭으로 이동
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

    // ✅ 공통 함수 사용
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

        // ✅ [여기] 수동 종료 시에도 알림 띄우기
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
            {/* 알림 설정 카드 */}
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <View style={styles.cardTitleRow}>
                <Image
                  source={require('../assets/alarm.png')}
                  style={styles.leadImg}
                />
                <Text style={[styles.cardTitle, t(theme, 16)]}>알림 설정</Text>
              </View>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={[styles.label, t(theme, 13)]}>알림 활성화</Text>
                  <Text style={[styles.helpText, ts(theme, 12)]}>
                    키워드 감지 시 알림을 받습니다
                  </Text>
                </View>
                <SwitchLike on={settings.alertsEnabled} onPress={toggleAlerts} />
              </View>
              <View style={styles.tipBox}>
                <Text style={[styles.tipText, ts(theme, 12)]}>
                  💡 알림이 켜져 있어야 등록된 키워드 감지 시 알림이 옵니다.
                </Text>
              </View>
            </View>

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

// --- 헬퍼 컴포넌트 및 스타일 ---

function SwitchLike({ on, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.switch, on && styles.switchOn]}>
      <View style={[styles.knob, on && styles.knobOn]} />
    </Pressable>
  );
}

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
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: '#111827' },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  knobOn: { transform: [{ translateX: 20 }] },
});