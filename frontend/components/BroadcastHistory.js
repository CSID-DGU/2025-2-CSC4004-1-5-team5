// components/BroadcastHistory.js
import { StyleSheet, Text, View, Image } from 'react-native';

// ✅ tone(정보 종류)에 따라 이미지 자동 매핑
const toneIcons = {
  blue: require('../assets/Current Station.png'),   // 현재역, 다음역 정보
  orange: require('../assets/Transfer.png'),        // 환승 노선 정보
  purple: require('../assets/Exit.png'),            // 출입문 정보 (필요 시)
  green: require('../assets/Next Station.png'),     // 키워드 / 알림 관련 (원하면 제외 가능)
};

const Chip = ({ text, tone = 'default' }) => (
  <View
    style={[
      styles.chip,
      tone === 'blue' && styles.chipBlue,
      tone === 'orange' && styles.chipOrange,
      tone === 'green' && styles.chipGreen,
    ]}
  >
    {/* tone에 맞는 아이콘 표시 */}
    {toneIcons[tone] && <Image source={toneIcons[tone]} style={styles.icon} />}
    <Text
      style={[
        styles.chipText,
        tone === 'blue' && styles.chipTextBlue,
        tone === 'orange' && styles.chipTextOrange,
        tone === 'green' && styles.chipTextGreen,
      ]}
    >
      {text}
    </Text>
  </View>
);

export default function BroadcastHistory({ keywords = [], maxCount = 5 }) {
  const data = [
    {
      id: '1',
      time: '오후 08:51',
      text: '이번 역은 강남역입니다. 2호선, 신분당선, 9호선 환승역입니다. 내리실 문은 오른쪽입니다.',
      entities: {
        blue: ['강남역'], // 현재역, 출입문 등
        orange: ['2호선', '신분당선', '9호선'], // 노선
        purple: ['오른쪽'],
      },
    },
    {
      id: '2',
      time: '오후 08:49',
      text: '승객 여러분께 안내 말씀 드리겠습니다. 열차 지연으로 불편을 끼쳐드려 죄송합니다.',
      entities: {
        green: ['#안전', '#지연'], // 키워드
      },
    },
  ];

  const hasKeyword = (txt) =>
    keywords.some((kw) => kw && txt.toLowerCase().includes(String(kw).toLowerCase()));

  const items = data.slice(0, maxCount);

  return (
    <View style={styles.listWrap}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>방송 이력</Text>
        <Text style={styles.headerCount}>{`${items.length}/${data.length}건`}</Text>
      </View>

      {items.map((it) => {
        const matched = hasKeyword(it.text);
        return (
          <View key={it.id} style={[styles.card, matched && styles.cardAlert]}>
            <View style={styles.timeRow}>
              <Text style={styles.time}>{it.time}</Text>
              {matched && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>알림</Text>
                </View>
              )}
            </View>

            <Text style={styles.body}>{it.text}</Text>

            {/* blue = 현재역, orange = 환승노선, green = 키워드 */}
            {Object.entries(it.entities).map(([tone, arr]) =>
              !!arr?.length ? (
                <View key={`${it.id}-${tone}`} style={styles.rowChips}>
                  {arr.map((t, i) => (
                    <Chip key={`${it.id}-${tone}-${i}`} text={t} tone={tone} />
                  ))}
                </View>
              ) : null
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  listWrap: { backgroundColor: '#E8F0FF', borderRadius: 14, padding: 10, gap: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  headerCount: { fontSize: 12, color: '#64748b' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#eef2ff' },
  cardAlert: { backgroundColor: '#FFF8DB', borderColor: '#FDE68A' },

  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 12, color: '#6b7280' },
  badge: { backgroundColor: '#FACC15', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#8A6D00' },

  body: { fontSize: 14, color: '#111827', lineHeight: 20 },
  rowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },
  icon: { width: 16, height: 16, marginRight: 4, resizeMode: 'contain' },

  chipBlue: { backgroundColor: '#EEF6FF', borderColor: '#BFDBFE' },
  chipTextBlue: { color: '#1D4ED8' },

  chipOrange: { backgroundColor: '#FFF1E6', borderColor: '#FECBA1' },
  chipTextOrange: { color: '#C2410C' },

  chipGreen: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  chipTextGreen: { color: '#047857' },
});
