import { StyleSheet, Text, View, Pressable, Image } from 'react-native';

export default function RealtimeHistoryTabs({ tab, onChangeTab }) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => onChangeTab('realtime')}
          style={[styles.tab, tab === 'realtime' && styles.tabActive]}
        >
          <Image source={require('../assets/Live.png')}
                 style={[styles.icon, tab === 'realtime' && styles.iconActive]} />
          <Text style={[styles.tabText, tab === 'realtime' && styles.tabTextActive]}>실시간</Text>
        </Pressable>

        <Pressable
          onPress={() => onChangeTab('history')}
          style={[styles.tab, tab === 'history' && styles.tabActive]}
        >
          <Image source={require('../assets/History.png')}
                 style={[styles.icon, tab === 'history' && styles.iconActive]} />
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>방송 이력</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#ffffff' },
  icon: { width: 16, height: 16, opacity: 0.5 },
  iconActive: { opacity: 1 },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#111827' },
});
