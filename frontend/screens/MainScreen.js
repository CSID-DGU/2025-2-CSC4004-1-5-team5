// screens/MainScreen.js
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
  const [tab, setTab] = useState('realtime'); // ← 타입 표기 제거
  const [recording, setRecording] = useState(false);
  const toggleRecording = () => setRecording((p) => !p);

  const registeredKeywords = ['안전', '지연', '출발', '승강장'];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnnouncementHeader />
        <RealtimeHistoryTabs tab={tab} onChangeTab={setTab} />

        {tab === 'realtime' ? (
          <>
            <CoreInfo />
            <Keywords />
            {recording && <ListeningStatus />}
          </>
        ) : (
          <BroadcastHistory keywords={registeredKeywords} maxCount={5} />
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
