import { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native'; // 1. Alert 추가
import { Audio } from 'expo-av'; // 2. Audio 임포트
import * as Sharing from 'expo-sharing'; // 3. Sharing 임포트

import AnnouncementHeader from '../components/AnnouncementHeader';
import RealtimeHistoryTabs from '../components/RealtimeHistoryTabs';
import CoreInfo from '../components/CoreInfo';
import Keywords from '../components/Keywords';
import LiveRecording from '../components/LiveRecording';
import ListeningStatus from '../components/ListeningStatus';
import BroadcastHistory from '../components/BroadcastHistory';
import SettingsScreen from './SettingsScreen';
import { useSettings } from '../context/SettingsContext';

export default function MainScreen() {
  const { theme } = useSettings();
  const [route, setRoute] = useState('home');
  const [tab, setTab] = useState('realtime');
  const [recording, setRecording] = useState(false);
  const [recordingObject, setRecordingObject] = useState(null); // 4. 녹음 객체 state 추가

  // 5. 기존 toggleRecording 함수를 실제 녹음/중지/공유 로직으로 대체
  const toggleRecording = async () => {
    if (recording) {
      // --- 녹음 중지 ---
      console.log('녹음을 중지합니다...');
      setRecording(false);
      
      try {
        await recordingObject.stopAndUnloadAsync(); // 녹음 중지 및 언로드
        const uri = recordingObject.getURI(); // 파일 URI 가져오기
        console.log('녹음 완료. 파일 위치:', uri);

        // 파일 공유 기능 실행
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('공유 실패', '이 기기에서는 파일 공유를 사용할 수 없습니다.');
          return;
        }
        await Sharing.shareAsync(uri); // 공유 시트 열기

      } catch (error) {
        console.error('녹음 중지 또는 공유 실패:', error);
        Alert.alert('오류', '녹음 중지 중 오류가 발생했습니다.');
      } finally {
        setRecordingObject(null); // 녹음 객체 초기화
      }
      
    } else {
      // --- 녹음 시작 ---
      console.log('녹음을 시작합니다...');

      try {
        // iOS/Android 오디오 모드 설정
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
           Audio.RecordingOptionsPresets.HIGH_QUALITY // 녹음 품질
        );
        
        setRecordingObject(newRecording); // 녹음 객체 저장
        setRecording(true); // 녹음 상태로 변경
        
        console.log('녹음 시작됨');

      } catch (err) {
        console.error('녹음 시작 실패:', err);
        Alert.alert('녹음 실패', '녹음 시작 중 오류가 발생했습니다.');
      }
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
            {/* recording이 true일 때 ListeningStatus가 보이도록 이미 구현되어 있음 */}
            {recording && <ListeningStatus />} 
          </>
        ) : (
          <BroadcastHistory keywords={keywords} maxCount={5} />
        )}
      </ScrollView>

      {/* 하단 고정 버튼 */}
      {/* LiveRecording의 onToggle이 호출되면(권한 확인 후) 
        위에서 정의한 toggleRecording 함수가 실행됩니다.
      */}
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