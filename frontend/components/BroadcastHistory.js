// components/BroadcastHistory.js
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useSession } from '../context/SessionContext';

export default function BroadcastHistory({ maxCount = 5 }) {
  const { theme } = useSettings();
  const { sessionResults } = useSession();

  // 세션 결과에서 timeline만 사용
  const timeline = Array.isArray(sessionResults?.timeline)
    ? sessionResults.timeline
    : [];

  const items = timeline.slice(0, maxCount);

  const totalCount =
    typeof sessionResults?.total_announcements === 'number'
      ? sessionResults.total_announcements
      : timeline.length;

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
          {`${items.length}/${totalCount}건`}
        </Text>
      </View>

      {items.map((it) => {
        // 서버가 주는 announcement_id만 사용
        const id = String(it.announcement_id ?? '');
        const text = it.full_text ?? '';

        // 🔥 서버에서 내려준 keywords_detected만 사용
        const detected = Array.isArray(it.keywords_detected)
          ? it.keywords_detected
          : [];

        const hasMatch = detected.length > 0;

        return (
          <View
            key={id}
            style={[
              styles.card,
              {
                backgroundColor: hasMatch ? '#FFF8DB' : theme.colors.card,
                borderColor: hasMatch ? '#FDE68A' : theme.colors.line,
              },
            ]}
          >
            {/* 상단: 방송 번호 + (필요 시) 알림 뱃지 */}
            <View style={styles.timeRow}>
              <Text
                style={{
                  fontSize: Math.round(12 * theme.scale),
                  color: theme.colors.sub,
                }}
              >
                {`방송 #${id}`}
              </Text>

              {hasMatch && (
                <View className="badge" style={styles.badge}>
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

            {/* 본문 전체 텍스트 */}
            <Text
              style={{
                fontSize: Math.round(14 * theme.scale),
                lineHeight: Math.round(20 * theme.scale),
                color: theme.colors.text,
              }}
            >
              {text}
            </Text>

            {/* 🔥 서버 keywords_detected가 있을 때만 키워드 칩 표시 */}
            {hasMatch && (
              <View style={styles.rowChips}>
                {detected.map((k, i) => (
                  <View
                    key={`${id}-kw-${i}`}
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
                      #{String(k)}
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
    marginTop: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
