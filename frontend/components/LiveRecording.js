import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { requestRecordingPermissionsAsync } from 'expo-audio';
// 1. 여기에 import 추가
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LiveRecording({ recording, onToggle, disabled = false }) {
  const { theme } = useSettings();
  
  // 2. 안전 영역(Safe Area) 크기 가져오기
  const insets = useSafeAreaInsets();

  const handlePress = async () => {
    // ... (기존 로직 동일) ...
    if (disabled && !recording) {
      console.log('Button is disabled (session loading), ignoring press.');
      return;
    }

    if (recording) {
      onToggle();
      return;
    }

    try {
      console.log('마이크 권한 상태 확인 및 요청 중...');
      const permission = await requestRecordingPermissionsAsync();
      const { granted, canAskAgain, status } = permission || {};

      if (granted) {
        console.log('마이크 권한이 허용되어 있습니다. (status:', status, ')');
        onToggle();
        return;
      }

      if (!granted && canAskAgain === false) {
        Alert.alert(
          '마이크 권한 필요',
          '실시간 분석을 위해 마이크 권한이 필요합니다. 앱 설정에서 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정으로 이동', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      Alert.alert('권한 거부', '마이크 권한이 거부되었습니다.');
    } catch (err) {
      console.error('마이크 권한 확인 중 치명적 오류 발생:', err);
      Alert.alert(
        '오류 발생',
        `마이크 권한을 확인하는 중 오류가 발생했습니다: ${err?.message ?? '알 수 없는 오류'}`
      );
    }
  };

  return (
    // 3. style에 하단 safe area 값을 더해서 패딩 적용
    // 기존 padding: 16에 insets.bottom을 더해줍니다.
    <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled && !recording}
        style={[
          styles.button,
          recording ? styles.buttonStop : styles.buttonStart,
          disabled && !recording && styles.buttonDisabled,
          { shadowColor: theme.colors.text },
        ]}
      >
        <Image
          source={
            recording
              ? require('../assets/Stop.png')
              : require('../assets/Record.png')
          }
          style={[styles.icon, recording && styles.iconActive]}
        />
        <Text
          style={{
            fontSize: Math.round(16 * theme.scale),
            fontWeight: theme.weight,
            color: '#fff',
          }}
        >
          {disabled && !recording
            ? '세션 준비 중...'
            : recording
            ? '분석 중지'
            : '실시간 분석 시작'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16, // 여기 기본 패딩은 유지하고 위에서 덮어씁니다
    backgroundColor: 'transparent',
  },
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonStart: {
    backgroundColor: '#635bff',
  },
  buttonStop: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    backgroundColor: '#b0b0b0',
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: '#ffffff',
    opacity: 0.9,
  },
  iconActive: {
    opacity: 1,
  },
});