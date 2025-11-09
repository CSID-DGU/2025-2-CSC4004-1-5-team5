import { StyleSheet, Text, View, Image } from 'react-native';

const Card = ({ title, value, icon }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      {icon && <Image source={icon} style={styles.icon} />}
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const Badge = ({ label }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

export default function CoreInfo() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Card
          title="현재 역"
          value="강남역"
          icon={require('../assets/Current Station.png')}
        />
        <Card
          title="다음 역"
          value="인식 대기 중"
          icon={require('../assets/Next Station.png')}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { flex: 1 }]}>
          <View style={styles.cardHeader}>
            <Image
              source={require('../assets/Transfer.png')}
              style={styles.icon}
            />
            <Text style={styles.cardTitle}>환승 노선</Text>
          </View>
          <View style={styles.badgeWrap}>
            <Badge label="2호선" />
            <Badge label="신분당선" />
            <Badge label="9호선" />
            <Badge label="환승" />
          </View>
        </View>

        <Card
          title="출입문"
          value="오른쪽"
          icon={require('../assets/Exit.png')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    width: 20,
    height: 20,
  },
  cardTitle: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  cardValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: {
    backgroundColor: '#FFEDD4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#CA3500' },
});
