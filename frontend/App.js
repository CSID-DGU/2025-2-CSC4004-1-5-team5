import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MainScreen from './screens/MainScreen';
import { SettingsProvider } from './context/SettingsContext'; // ✅ 설정 컨텍스트 추가

export default function App() {
  return (
    <SafeAreaProvider>
      {/* ✅ 전역 설정을 제공 */}
      <SettingsProvider sessionId="default">
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <MainScreen />
          <StatusBar style="auto" />
        </SafeAreaView>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff', // 기본 배경 (SettingsProvider의 theme.bg와 조화)
  },
});
