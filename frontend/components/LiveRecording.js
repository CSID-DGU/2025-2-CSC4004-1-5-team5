// components/LiveRecording.js
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Alert,
  Linking, // '설정으로 이동'을 위해 추가
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { Audio } from 'expo-av'; // 1. react-native-permissions 대신 expo-av 임포트

export default function LiveRecording({ recording, onToggle }) {
  const { theme } = useSettings();

  // 2. handlePress 함수를 expo-av 방식으로 수정
  const handlePress = async () => {
    // 이미 녹음 중(분석 중지)일 경우, 권한 체크 없이 onToggle만 실행
    if (recording) {
      onToggle();
      return;
    }

    // 녹음 시작일 경우, 권한 체크
    const permission = await Audio.getPermissionsAsync();

    if (permission.granted) {
      // 3-1. 권한이 이미 허용된 경우: 즉시 녹음 시작
      console.log('마이크 권한이 허용되어 있습니다.');
      onToggle();
    } else if (permission.canAskAgain) {
      // 3-2. 권한이 없지만, 요청할 수 있는 경우: 권한 요청
      console.log('마이크 권한을 요청합니다.');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        console.log('마이크 권한이 허용되었습니다.');
        onToggle(); // 권한 허용 시 녹음 시작
      } else {
        Alert.alert('권한 거부', '마이크 권한이 거부되었습니다.');
      }
    } else {
      // 3-3. 권한이 영구적으로 차단된 경우 (canAskAgain === false)
      Alert.alert(
        '마이크 권한 필요',
        '실시간 분석을 위해 마이크 권한이 필요합니다. 앱 설정에서 권한을 허용해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => Linking.openSettings() }, // 설정 앱 열기
        ]
      );
    }
  };

  return (
    <View style={styles.footer}>
      <Pressable
        onPress={handlePress} // 4. 수정된 handlePress 함수 연결
        style={[
          styles.button,
          recording ? styles.buttonStop : styles.buttonStart,
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
          {recording ? '분석 중지' : '실시간 분석 시작'}
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