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

const CHUNK_DURATION_MS = 10000; // 10초

export default function MainScreen() {
  const { theme } = useSettings();
  const [route, setRoute] = useState('home');
  const [tab, setTab] = useState('realtime');
  const [recording, setRecording] = useState(false);

  // state 대신 ref 사용 (setInterval 내부에서 최신 값 접근)
  const recordingObjectRef = useRef(null);
  const intervalRef = useRef(null);

  // (신규) 새로운 청크 녹음 시작 헬퍼 함수
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

  // (신규) 현재 청크 중지 및 저장 헬퍼 함수 (공유 X)
  const stopAndSaveChunk = async () => {
    if (!recordingObjectRef.current) return;
    
    console.log('이전 10초 청크 저장 중...');
    try {
      const recordingToSave = recordingObjectRef.current;
      recordingObjectRef.current = null; // ref 비우기

      await recordingToSave.stopAndUnloadAsync();
      const uri = recordingToSave.getURI();
      console.log('10초 청크 저장 완료:', uri);
      // TODO: 여기서 uri를 API로 전송할 수 있습니다.
      
    } catch (error) {
      console.error('청크 저장 실패:', error);
    }
  };

  // (수정) toggleRecording 로직 전체 변경
  const toggleRecording = async () => {
    if (recording) {
      // --- 녹음 중지 ---
      console.log('전체 녹음을 중지합니다...');
      setRecording(false);

      // 1. 10초 루프 정지
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // 2. 마지막 (10초 미만) 청크 중지 및 저장
      if (!recordingObjectRef.current) return;

      try {
        const finalRecording = recordingObjectRef.current;
        recordingObjectRef.current = null;

        await finalRecording.stopAndUnloadAsync();
        const uri = finalRecording.getURI();
        console.log('마지막 청크 저장 완료:', uri);

        // 3. 마지막 청크만 공유해서 들어보기
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }

      } catch (error) {
        console.error('마지막 청크 중지/저장 실패:', error);
      }

    } else {
      // --- 녹음 시작 ---
      console.log('10초 단위 청크 녹음을 시작합니다...');
      setRecording(true);

      // 1. 첫 번째 청크 즉시 시작
      await startNewChunk();

      // 2. 10초 간격으로 루프 설정
      intervalRef.current = setInterval(async () => {
        // (10초 도달)
        // 1. 이전 청크 중지/저장 (공유 X)
        await stopAndSaveChunk(); 
        
        // 2. 다음 청크 즉시 시작 (이 사이에 약간의 갭 발생)
        await startNewChunk();

      }, CHUNK_DURATION_MS);
    }
  };

  const sessionId = 'default';
  const [keywords, setKeywords] = useState([]);

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
            <Keywords sessionId={sessionId} onChange={setKeywords} />
            {recording && <ListeningStatus />}
          </>
        ) : (
          <BroadcastHistory keywords={keywords} maxCount={5} />
        )}
      </ScrollView>

      {/* 하단 고정 버튼 (LiveRecording.js는 수정 불필요) */}
      <LiveRecording recording={recording} onToggle={toggleRecording} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    // padding과 gap은 theme.scale에 맞춰 동적으로 설정 (위에서 덮어씀)
  },
});