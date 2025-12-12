// FRONTEND/App.js
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// 화면
import MainScreen from './screens/MainScreen';

// 컨텍스트
import { SettingsProvider } from './context/SettingsContext';
import { SessionProvider } from './context/SessionContext'; // ✅ 세션 Provider 추가

export default function App() {
  return (
    <SafeAreaProvider>

      {/* 1️⃣ 앱 전체를 SessionProvider로 감싼다 */}
      <SessionProvider>

        {/* 2️⃣ 그 안에 SettingsProvider (순서는 상관없음) */}
        <SettingsProvider sessionId="default">

          <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <MainScreen />
            <StatusBar style="auto" />
          </SafeAreaView>

        </SettingsProvider>

      </SessionProvider>

    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
});
