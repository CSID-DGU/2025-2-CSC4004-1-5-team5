import { useState, useMemo, useRef } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';

// ✅ expo-audio용 API 임포트
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';

// 컴포넌트 임포트
import AnnouncementHeader from '../components/AnnouncementHeader';
import RealtimeHistoryTabs from '../components/RealtimeHistoryTabs';
import CoreInfo from '../components/CoreInfo';
import Keywords from '../components/Keywords';
import LiveRecording from '../components/LiveRecording';
import ListeningStatus from '../components/ListeningStatus';
import BroadcastHistory from '../components/BroadcastHistory';
import SettingsScreen from './SettingsScreen';
import { useSettings } from '../context/SettingsContext';
import { useSession } from '../context/SessionContext';

const CHUNK_DURATION_MS = 10000;

export default function MainScreen() {
  const { theme } = useSettings();
  const { sessionId, resetSession, loading: sessionLoading } = useSession();

  const [route, setRoute] = useState('home');
  const [tab, setTab] = useState('realtime');
  const [recording, setRecording] = useState(false);
  const [keywords, setKeywords] = useState([]);

  // ✅ expo-audio의 recorder 인스턴스 (High Quality 프리셋 사용)
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // 청크 타이머
  const intervalRef = useRef(null);

  // ✅ 새 10초 청크 시작
  const startNewChunk = async () => {
    try {
      console.log('새로운 10초 청크 녹음 시작...');

      // expo-audio 전용 오디오 모드 설정
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      // 준비 후 녹음 시작
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error('새 청크 녹음 시작 실패:', err);
      Alert.alert('녹음 실패', '새 녹음 시작에 실패했습니다.');
    }
  };

  // ✅ 이전 청크 중지 및 저장
  const stopAndSaveChunk = async () => {
    try {
      console.log('이전 10초 청크 저장 중...');
      // stop()이 끝나면 audioRecorder.uri에 파일 경로가 생김
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      console.log('10초 청크 저장 완료:', uri);
      // 여기서 서버 업로드 / 분석 API 호출 등 연결 가능
    } catch (error) {
      console.error('청크 저장 실패:', error);
    }
  };

  const toggleRecording = async () => {
    // --- 녹음 중지 ---
    if (recording) {
      console.log('전체 녹음을 중지합니다...');
      setRecording(false);

      // 타이머 제거
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      try {
        // 마지막 청크 중지 및 저장
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        console.log('마지막 청크 저장 완료:', uri);

        // 기기에서 바로 공유 테스트용
        if (uri && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(uri);
        }

        console.log('녹음 종료됨. 새 세션으로 교체를 요청합니다...');
        await resetSession(keywords);
      } catch (error) {
        console.error('마지막 청크 중지/저장 또는 세션 리셋 실패:', error);
      }

      return;
    }

    // --- 녹음 시작 ---
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

    // 첫 청크 시작
    await startNewChunk();

    // 이후 10초마다 이전 청크를 멈추고 새 청크 시작
    intervalRef.current = setInterval(async () => {
      await stopAndSaveChunk();
      await startNewChunk();
    }, CHUNK_DURATION_MS);
  };

  const paddings = useMemo(
    () => ({
      outerPad: Math.round(16 * theme.scale),
      bottomPad: Math.round(120 * theme.scale),
    }),
    [theme.scale]
  );

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
            <CoreInfo />
            <Keywords sessionId={sessionId} onChange={setKeywords} />
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    // 기존 스타일 그대로 사용
  },
});
