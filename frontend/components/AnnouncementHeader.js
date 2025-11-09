import { StyleSheet, Text, View, Image, Pressable } from 'react-native';

export default function AnnouncementHeader() {
  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.title}>안내방송 알림</Text>
        <Text style={styles.subtitle}>실시간 음성 인식</Text>
      </View>

      {/* 설정 아이콘 */}
      <Pressable onPress={() => console.log('설정 클릭')}>
        <Image source={require('../assets/Setting.png')} style={styles.icon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e6e6e6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  icon: {
    width: 45,
    height: 45,
    tintColor: '#6b7280',
  },
});
