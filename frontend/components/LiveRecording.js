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
import { Audio } from 'expo-av';

// 1. 'disabled' prop 추가 (기본값 false)
export default function LiveRecording({ recording, onToggle, disabled = false }) {
  const { theme } = useSettings();

  const handlePress = async () => {
    // 2. 'disabled' 상태이거나, (녹음 중이 아닐 때) 버튼 클릭 방지
    if (disabled && !recording) {
      console.log('Button is disabled (session loading), ignoring press.');
      return;
    }

    // 이미 녹음 중(분석 중지)일 경우, 권한 체크 없이 onToggle만 실행
    // (disabled 여부와 상관없이 '중지'는 가능해야 함)
    if (recording) {
      onToggle();
      return;
    }

    // --- 이하 녹음 시작일 경우 권한 체크 (기존 코드 동일) ---
    const permission = await Audio.getPermissionsAsync();

    if (permission.granted) {
      console.log('마이크 권한이 허용되어 있습니다.');
      onToggle();
    } else if (permission.canAskAgain) {
      console.log('마이크 권한을 요청합니다.');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        console.log('마이크 권한이 허용되었습니다.');
        onToggle();
      } else {
        Alert.alert('권한 거부', '마이크 권한이 거부되었습니다.');
      }
    } else {
      Alert.alert(
        '마이크 권한 필요',
        '실시간 분석을 위해 마이크 권한이 필요합니다. 앱 설정에서 권한을 허용해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  return (
    <View style={styles.footer}>
      <Pressable
        onPress={handlePress}
        // 3. Pressable 자체에도 disabled prop 전달 (터치 효과 등 제어)
        disabled={disabled && !recording} 
        style={[
          styles.button,
          recording ? styles.buttonStop : styles.buttonStart,
          // 4. 비활성화 상태일 때 시각적 스타일 적용
          (disabled && !recording) && styles.buttonDisabled, 
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
          {/* 5. 세션 로딩 중일 때 텍스트 변경 (선택 사항) */}
          {disabled && !recording ? '세션 준비 중...' : (recording ? '분석 중지' : '실시간 분석 시작')}
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
    padding: 16,
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
  buttonStart: { backgroundColor: '#635bff' }, // 시작(보라색)
  buttonStop: { backgroundColor: '#ef4444' }, // 중지(빨강)
  // 6. 비활성화 시 스타일 추가
  buttonDisabled: {
    backgroundColor: '#b0b0b0', // 회색
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