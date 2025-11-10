// components/ListeningStatus.js
import { StyleSheet, Text, View, Image } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function ListeningStatus() {
  const { theme } = useSettings();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: '#6C63FF',
          shadowColor: '#000',
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Image
            source={require('../assets/Live.png')}
            style={[styles.icon, { tintColor: '#fff' }]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: Math.round(12 * theme.scale),
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 2,
              fontWeight: theme.weight,
            }}
          >
            실시간 작업
          </Text>
          <Text
            style={{
              fontSize: Math.round(16 * theme.scale),
              color: '#fff',
              fontWeight: theme.weight,
            }}
          >
            음성을 인식하는 중 …
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    padding: 16,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 18, height: 18 },
});
