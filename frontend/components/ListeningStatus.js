import { StyleSheet, Text, View, Image } from 'react-native';

export default function ListeningStatus() {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Image source={require('../assets/Live.png')} style={styles.icon} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>실시간 작업</Text>
          <Text style={styles.subtitle}>음성을 인식하는 중 …</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { width: 18, height: 18, tintColor: '#fff' },
  title: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 2 },
  subtitle: { fontSize: 16, color: '#fff', fontWeight: '700' },
});
