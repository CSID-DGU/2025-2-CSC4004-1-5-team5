import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import AnnouncementHeader from '../components/AnnouncementHeader';
import RealtimeHistoryTabs from '../components/RealtimeHistoryTabs';
import CoreInfo from '../components/CoreInfo';
import Keywords from '../components/Keywords';
import LiveRecording from '../components/LiveRecording';
import ListeningStatus from '../components/ListeningStatus';
import BroadcastHistory from '../components/BroadcastHistory';

export default function MainScreen() {
  const [tab, setTab] = useState('realtime');
  const [recording, setRecording] = useState(false);
  const toggleRecording = () => setRecording((p) => !p);

  // ✅ (1) 세션 아이디 (예시)
  const sessionId = 'default'; // 로그인 ID/기기 ID/UUID 등으로 대체 가능

  // ✅ (2) 부모에서 키워드 상태 보유
  const [keywords, setKeywords] = useState([]); // Keywords가 로드/수정 시 갱신

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnnouncementHeader />
        <RealtimeHistoryTabs tab={tab} onChangeTab={setTab} />

        {tab === 'realtime' ? (
          <>
            <CoreInfo />
            {/* ✅ (3) sessionId + onChange 전달 */}
            <Keywords sessionId={sessionId} onChange={setKeywords} />
            {recording && <ListeningStatus />}
          </>
        ) : (
          // ✅ (4) 하드코딩 대신 부모의 keywords 전달
          <BroadcastHistory keywords={keywords} maxCount={5} />
        )}
      </ScrollView>

      <LiveRecording recording={recording} onToggle={toggleRecording} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 120 },
});
