import { useState, useMemo, useRef } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';

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

  const recordingObjectRef = useRef(null);
  const intervalRef = useRef(null);
  
  // ✅ 키워드 state
  const [keywords, setKeywords] = useState([]); // (["ㅎㅇ", "호호"])

  // (startNewChunk, stopAndSaveChunk 헬퍼 함수 - 변경 없음)
  const startNewChunk = async () => {
    try {
      console.log('새로운 10초 청크 녹음 시작...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingObjectRef.current = recording;
    } catch (err) {
      console.error('새 청크 녹음 시작 실패:', err);
      Alert.alert('녹음 실패', '새 녹음 시작에 실패했습니다.');
    }
  };

  const stopAndSaveChunk = async () => {
    if (!recordingObjectRef.current) return;
    
    console.log('이전 10초 청크 저장 중...');
    try {
      const recordingToSave = recordingObjectRef.current;
      recordingObjectRef.current = null;

      await recordingToSave.stopAndUnloadAsync();
      const uri = recordingToSave.getURI();
      console.log('10초 청크 저장 완료:', uri);
      // TODO: 여기서 uri와 sessionId를 API로 전송할 수 있습니다.
      
    } catch (error) {
      console.error('청크 저장 실패:', error);
    }
  };

  // ✅ toggleRecording 수정
  const toggleRecording = async () => {
    if (recording) {
      // --- 녹음 중지 ---
      console.log('전체 녹음을 중지합니다...');
      setRecording(false);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (!recordingObjectRef.current) return;

      try {
        const finalRecording = recordingObjectRef.current;
        recordingObjectRef.current = null;

        await finalRecording.stopAndUnloadAsync();
        const uri = finalRecording.getURI();
        console.log('마지막 청크 저장 완료:', uri);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }

        // ✅ (수정) 녹음 종료 시, 현재 'keywords' state를 resetSession에 전달
        console.log("녹음 종료됨. 새 세션으로 교체를 요청합니다...");
        await resetSession(keywords); // keywords: ["ㅎㅇ", "호호"]

      } catch (error) {
        console.error('마지막 청크 중지/저장 또는 세션 리셋 실패:', error);
      }

    } else {
      // --- 녹음 시작 ---
      if (sessionLoading) {
        Alert.alert("세션 준비 중", "세션이 준비 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      if (!sessionId) {
        Alert.alert("세션 오류", "세션 ID가 없습니다. 앱을 다시 시작해주세요.");
        return;
      }
      
      console.log(`[Session: ${sessionId}] 10초 단위 청크 녹음을 시작합니다...`);
      setRecording(true);

      await startNewChunk();

      intervalRef.current = setInterval(async () => {
        await stopAndSaveChunk(); 
        await startNewChunk();
      }, CHUNK_DURATION_MS);
    }
  };

  // const sessionId = 'default'; // (제거됨)
  // const [keywords, setKeywords] = useState([]); // (위로 이동)

  const paddings = useMemo(() => ({
    outerPad: Math.round(16 * theme.scale),
    bottomPad: Math.round(120 * theme.scale),
  }), [theme.scale]);

  if (route === 'settings') {
    return <SettingsScreen onClose={() => setRoute('home')} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { padding: paddings.outerPad, gap: Math.round(12 * theme.scale), paddingBottom: paddings.bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnnouncementHeader onPressSettings={() => setRoute('settings')} />
        <RealtimeHistoryTabs tab={tab} onChangeTab={setTab} />

        {tab === 'realtime' ? (
          <>
            <CoreInfo />
            {/* ✅ Keywords가 변경될 때마다 MainScreen의 'keywords' state 업데이트 */}
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
    // ...
  },
});