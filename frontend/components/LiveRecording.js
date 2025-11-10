// components/LiveRecording.js
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function LiveRecording({ recording, onToggle }) {
  const { theme } = useSettings();

  return (
    <View style={styles.footer}>
      <Pressable
        onPress={onToggle}
        style={[
          styles.button,
          recording ? styles.buttonStop : styles.buttonStart,
          { shadowColor: theme.colors.text },
        ]}
      >
        <Image
          source={
            recording
              ? require('../assets/Stop.png') // 🔴 분석 중지 시
              : require('../assets/Record.png') // 🟣 실시간 분석 시작 시
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
