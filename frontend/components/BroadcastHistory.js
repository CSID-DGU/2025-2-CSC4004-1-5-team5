// components/BroadcastHistory.js
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';

// ✅ 문자열 비교용: 대소문자 무시, 앞의 # 제거
const norm = (s) => String(s || '').trim().replace(/^#/, '').toLowerCase();

export default function BroadcastHistory({ keywords = [], maxCount = 5 }) {
  const { theme } = useSettings();

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
    <View
      style={[
        styles.listWrap,
        {
          backgroundColor: theme.colors.bg,
          borderColor: theme.colors.line,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text
          style={{
            fontSize: Math.round(14 * theme.scale),
            fontWeight: theme.weight,
            color: theme.colors.text,
          }}
        >
          방송 이력
        </Text>
        <Text
          style={{
            fontSize: Math.round(12 * theme.scale),
            color: theme.colors.sub,
          }}
        >
          {`${items.length}/${data.length}건`}
        </Text>
      </View>

      {items.map((it) => {
        const matched = extractMatchedKeywords(it.text, keywords);
        const hasMatch = matched.length > 0;

        return (
          <View
            key={it.id}
            style={[
              styles.card,
              {
                backgroundColor: hasMatch
                  ? '#FFF8DB'
                  : theme.colors.card,
                borderColor: hasMatch
                  ? '#FDE68A'
                  : theme.colors.line,
              },
            ]}
          >
            {/* 시간 + 배지 */}
            <View style={styles.timeRow}>
              <Text
                style={{
                  fontSize: Math.round(12 * theme.scale),
                  color: theme.colors.sub,
                }}
              >
                {it.time}
              </Text>

              {hasMatch && (
                <View style={styles.badge}>
                  <Text
                    style={{
                      fontSize: Math.round(12 * theme.scale),
                      fontWeight: '800',
                      color: '#8A6D00',
                    }}
                  >
                    알림
                  </Text>
                </View>
              )}
            </View>

            {/* 본문 */}
            <Text
              style={{
                fontSize: Math.round(14 * theme.scale),
                lineHeight: Math.round(20 * theme.scale),
                color: theme.colors.text,
              }}
            >
              {it.text}
            </Text>

            {/* 키워드 칩 */}
            {hasMatch && (
              <View style={styles.rowChips}>
                {matched.map((k, i) => (
                  <View
                    key={`${it.id}-kw-${i}`}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: '#ECFDF5',
                        borderColor: '#A7F3D0',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: Math.round(12 * theme.scale),
                        fontWeight: '700',
                        color: '#047857',
                      }}
                    >
                      #{k}
                    </Text>
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
  listWrap: {
    borderRadius: 14,
    padding: 10,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FACC15',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
