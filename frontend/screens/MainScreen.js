import { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import AnnouncementHeader from '../components/AnnouncementHeader';
import RealtimeHistoryTabs from '../components/RealtimeHistoryTabs';
import CoreInfo from '../components/CoreInfo';
import Keywords from '../components/Keywords';
import LiveRecording from '../components/LiveRecording';
import ListeningStatus from '../components/ListeningStatus';
import BroadcastHistory from '../components/BroadcastHistory';
import SettingsScreen from './SettingsScreen';
import { useSettings } from '../context/SettingsContext'; // ✅ 전역 설정 사용

export default function MainScreen() {
  const { theme } = useSettings();                 // ✅ 테마/스케일/굵기
  const [route, setRoute] = useState('home');      // 'home' | 'settings'
  const [tab, setTab] = useState('realtime');
  const [recording, setRecording] = useState(false);
  const toggleRecording = () => setRecording((p) => !p);

  const sessionId = 'default';
  const [keywords, setKeywords] = useState([]);

  // ✅ 스케일에 따라 여백도 조정
  const paddings = useMemo(() => ({
    outerPad: Math.round(16 * theme.scale),
    bottomPad: Math.round(120 * theme.scale),
  }), [theme.scale]);

  // ✅ 설정 화면
  if (route === 'settings') {
    return <SettingsScreen onClose={() => setRoute('home')} />;
  }

  // ✅ 메인 화면
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
        {/* 헤더 (설정 아이콘 → 설정 화면) */}
        <AnnouncementHeader onPressSettings={() => setRoute('settings')} />

        {/* 탭 */}
        <RealtimeHistoryTabs tab={tab} onChangeTab={setTab} />

        {/* 본문 분기 */}
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

      {/* 하단 고정 버튼 */}
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
