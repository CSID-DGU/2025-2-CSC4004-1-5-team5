// components/BroadcastHistory.js
import { StyleSheet, Text, View } from 'react-native';

// ✅ 문자열 비교용: 대소문자 무시, 앞의 # 제거
const norm = (s) => String(s || '').trim().replace(/^#/, '').toLowerCase();

export default function BroadcastHistory({ keywords = [], maxCount = 5 }) {
  // 데모 데이터 (실서비스에서는 실제 이력으로 교체)
  const data = [
    {
      id: '1',
      time: '오후 08:51',
      text:
        '이번 역은 강남역입니다. 2호선, 신분당선, 9호선 환승역입니다. 내리실 문은 오른쪽입니다.',
    },
    {
      id: '2',
      time: '오후 08:49',
      text:
        '승객 여러분께 안내 말씀 드리겠습니다. 열차 지연으로 불편을 끼쳐드려 죄송합니다.',
    },
  ];

  // 방송 본문에서 매칭된 키워드 목록만 추출
  const extractMatchedKeywords = (txt, kws) => {
    const t = String(txt || '').toLowerCase();
    const seen = new Set();
    const hits = [];
    kws.forEach((kw) => {
      const k = norm(kw);
      if (!k) return;
      if (t.includes(k) && !seen.has(k)) {
        seen.add(k);
        hits.push(k);
      }
    });
    return hits;
  };

  const items = data.slice(0, maxCount);

  return (
    <View style={styles.listWrap}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>방송 이력</Text>
        <Text style={styles.headerCount}>{`${items.length}/${data.length}건`}</Text>
      </View>

      {items.map((it) => {
        const matched = extractMatchedKeywords(it.text, keywords); // ← 핵심
        const hasMatch = matched.length > 0;

        return (
          <View key={it.id} style={[styles.card, hasMatch && styles.cardAlert]}>
            <View style={styles.timeRow}>
              <Text style={styles.time}>{it.time}</Text>
              {hasMatch && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>알림</Text>
                </View>
              )}
            </View>

            <Text style={styles.body}>{it.text}</Text>

            {/* 키워드가 포함된 방송에만 키워드 칩 노출 */}
            {hasMatch && (
              <View style={styles.rowChips}>
                {matched.map((k, i) => (
                  <View key={`${it.id}-kw-${i}`} style={[styles.chip, styles.chipGreen]}>
                    <Text style={[styles.chipText, styles.chipTextGreen]}>#{k}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  listWrap: { backgroundColor: '#E8F0FF', borderRadius: 14, padding: 10, gap: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  headerCount: { fontSize: 12, color: '#64748b' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  cardAlert: { backgroundColor: '#FFF8DB', borderColor: '#FDE68A' },

  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 12, color: '#6b7280' },
  badge: { backgroundColor: '#FACC15', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#8A6D00' },

  body: { fontSize: 14, color: '#111827', lineHeight: 20 },

  rowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  chip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },

  // 키워드 칩 스타일(녹색만 사용)
  chipGreen: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  chipTextGreen: { color: '#047857' },
});
