// components/CoreInfo.js
import { StyleSheet, Text, View, Image } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useSession } from '../context/SessionContext';

const Card = ({ title, value, icon, theme }) => (
  <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
    <View style={styles.cardHeader}>
      {icon && <Image source={icon} style={styles.icon} />}
      <Text
        style={{
          fontSize: Math.round(12 * theme.scale),
          color: theme.colors.sub,
          fontWeight: theme.weight,
        }}
      >
        {title}
      </Text>
    </View>
    <Text
      style={{
        fontSize: Math.round(16 * theme.scale),
        fontWeight: theme.weight,
        color: theme.colors.text,
      }}
    >
      {value}
    </Text>
  </View>
);

const Badge = ({ label }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

// ✅ summary 문자열 파싱: "- 역: 물레역\n- 문 방향: 왼쪽\n- 환승: 없음\n- 기타: 없음"
function parseSummary(summaryText) {
  const parsed = {
    station: '인식 대기 중',
    door: '정보 없음',
    transfers: '정보 없음',
    extra: '정보 없음',
  };

  if (!summaryText || typeof summaryText !== 'string') {
    return parsed;
  }

  const lines = summaryText.split('\n');

  lines.forEach((rawLine) => {
    if (!rawLine) return;
    // 앞의 "- " 같은 불릿 제거
    const line = rawLine.replace(/^[-•]\s*/, '').trim();

    if (line.startsWith('역:')) {
      parsed.station = line.replace('역:', '').trim();
    } else if (line.startsWith('문 방향:')) {
      parsed.door = line.replace('문 방향:', '').trim();
    } else if (line.startsWith('환승:')) {
      parsed.transfers = line.replace('환승:', '').trim();
    } else if (line.startsWith('기타:')) {
      parsed.extra = line.replace('기타:', '').trim();
    }
  });

  return parsed;
}

export default function CoreInfo() {
  const { theme } = useSettings();
  const { sessionResults } = useSession();

  // 👉 결과 조회에서 온 summary 사용
  const summaryText = sessionResults?.summary ?? '';
  const { station, door, transfers, extra } = parseSummary(summaryText);

  // 환승 배지 처리
  let transferBadges = [];
  if (
    !transfers ||
    transfers === '없음' ||
    transfers === '정보 없음'
  ) {
    transferBadges = ['환승 없음'];
  } else {
    // "2호선, 신분당선" / "2호선 신분당선" 등 단순 분리
    transferBadges = transfers
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return (
    <View style={{ gap: Math.round(12 * theme.scale) }}>
      {/* 현재 역 / 기타 정보(다음 역 카드 자리에 기타 정보) */}
      <View style={{ flexDirection: 'row', gap: Math.round(12 * theme.scale) }}>
        <Card
          title="현재 역"
          value={station}
          icon={require('../assets/Current Station.png')}
          theme={theme}
        />
        <Card
          title="기타 정보"
          value={extra}
          icon={require('../assets/Next Station.png')}
          theme={theme}
        />
      </View>

      {/* 환승 노선 / 출입문 */}
      <View style={{ flexDirection: 'row', gap: Math.round(12 * theme.scale) }}>
        <View
          style={[styles.card, { flex: 1, backgroundColor: theme.colors.card }]}
        >
          <View style={styles.cardHeader}>
            <Image
              source={require('../assets/Transfer.png')}
              style={styles.icon}
            />
            <Text
              style={{
                fontSize: Math.round(12 * theme.scale),
                color: theme.colors.sub,
                fontWeight: theme.weight,
              }}
            >
              환승 노선
            </Text>
          </View>
          <View
            style={[
              styles.badgeWrap,
              { marginTop: Math.round(6 * theme.scale) },
            ]}
          >
            {transferBadges.map((label, idx) => (
              <Badge key={idx} label={label} />
            ))}
          </View>
        </View>

        <Card
          title="출입문"
          value={door}
          icon={require('../assets/Exit.png')}
          theme={theme}
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
  icon: { width: 20, height: 20 },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    backgroundColor: '#FFEDD4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#CA3500' },
});
