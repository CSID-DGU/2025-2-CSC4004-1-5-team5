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
      numberOfLines={2}
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

function extractLatestInfo(sessionResults) {
  const defaults = {
    station: '인식 대기 중',
    door: '정보 없음',
    transfers: [],
    extra: '정보 없음',
  };

  if (
    !sessionResults ||
    !Array.isArray(sessionResults.timeline) ||
    sessionResults.timeline.length === 0
  ) {
    return defaults;
  }

  const timeline = sessionResults.timeline;

  // 🔥 announcement_id만 체크
  let latest = timeline[0];
  let latestId = Number(latest.announcement_id) || 0;

  for (const item of timeline) {
    const currentId = Number(item.announcement_id) || 0;
    if (currentId > latestId) {
      latest = item;
      latestId = currentId;
    }
  }

  const info = latest.info || {};
  const station = info.station || defaults.station;
  const door = info.door || defaults.door;
  const transfers = Array.isArray(info.transfers)
    ? info.transfers
    : [];

  const warnings = Array.isArray(info.warnings)
    ? info.warnings
    : [];
  const extra =
    warnings.length > 0 ? warnings.join(', ') : '없음';

  return { station, door, transfers, extra };
}

export default function CoreInfo() {
  const { theme } = useSettings();
  const { sessionResults } = useSession();

  // 🔥 최신 방송 info만 추출
  const { station, door, transfers, extra } =
    extractLatestInfo(sessionResults);

  // 환승 표시 처리
  let transferBadges = [];
  if (!transfers || transfers.length === 0) {
    transferBadges = ['환승 없음'];
  } else {
    transferBadges = transfers
      .map((s) => String(s).trim())
      .filter(Boolean);
  }

  return (
    <View style={{ gap: Math.round(12 * theme.scale) }}>
      {/* 현재 역 / 기타 정보 */}
      <View
        style={{
          flexDirection: 'row',
          gap: Math.round(12 * theme.scale),
        }}
      >
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

      {/* 환승 / 출입문 */}
      <View
        style={{
          flexDirection: 'row',
          gap: Math.round(12 * theme.scale),
        }}
      >
        <View
          style={[
            styles.card,
            { flex: 1, backgroundColor: theme.colors.card },
          ]}
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
