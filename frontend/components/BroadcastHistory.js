// components/BroadcastHistory.js
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useSession } from '../context/SessionContext';
import { api } from '../api/instance';

const norm = (s) => String(s || '').trim().replace(/^#/, '').toLowerCase();

export default function BroadcastHistory({ keywords = [], maxCount = 5 }) {
  const { theme } = useSettings();

  // ⬇️ 여기에서 sessionResults만 받아오면 됨
  const { sessionResults, sessionId } = useSession();

  // 서버에서 키워드 가져오는 부분은 유지
  const [serverKeywords, setServerKeywords] = useState([]);

  const fetchKeywords = async () => {
    if (!sessionId) {
      console.log('[BroadcastHistory] 세션 ID 없음, 키워드 조회 건너뜀');
      return;
    }

    try {
      console.log(
        `[BroadcastHistory] 키워드 조회: GET /keywords/?session_id=${sessionId}`,
      );

      const res = await api.get('/keywords/', {
        params: { session_id: sessionId },
      });

      const rawList = Array.isArray(res.data?.keywords)
        ? res.data.keywords
        : [];

      const list = rawList
        .map((k) => {
          if (typeof k === 'string') {
            return String(k);
          }
          return String(k.word ?? '');
        })
        .filter((w) => w.trim().length > 0);

      setServerKeywords(list);
    } catch (e) {
      console.warn(
        '[BroadcastHistory] 키워드 조회 실패:',
        e.response?.data ?? e.message,
      );
    }
  };

  // 키워드만 조회
  useEffect(() => {
    fetchKeywords();
  }, [sessionId]);

  // ❗❗ 여기로 results를 가져옴
  const results = sessionResults;

  // effective keywords
  const effectiveKeywords =
    Array.isArray(keywords) && keywords.length > 0
      ? keywords
      : serverKeywords;

  // timeline
  const timeline = Array.isArray(results?.timeline)
    ? results.timeline
    : [];

  const items = timeline.slice(0, maxCount);

  const totalCount =
    typeof results?.total_announcements === 'number'
      ? results.total_announcements
      : timeline.length;

  const summaryText = results?.summary ?? '';

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

      {summaryText ? (
        <View
          style={[
            styles.summaryBox,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.line },
          ]}
        >
          <Text
            style={{
              fontSize: Math.round(12 * theme.scale),
              color: theme.colors.sub,
            }}
          >
            {summaryText}
          </Text>
        </View>
      ) : null}

      {items.map((it) => {
        const id = String(it.announcement_id ?? it.id ?? '');
        const text = it.full_text ?? '';

        const detected = Array.isArray(it.keywords_detected)
          ? it.keywords_detected
          : [];

        let matched = [];

        if (detected.length > 0 && effectiveKeywords.length > 0) {
          const set = new Set(effectiveKeywords.map(norm));
          matched = detected
            .map((k) => String(k))
            .filter((k) => set.has(norm(k)));
        }

        const extractMatchedKeywordsFromText = (txt, kws) => {
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

        if (matched.length === 0 && effectiveKeywords.length > 0) {
          matched = extractMatchedKeywordsFromText(text, effectiveKeywords);
        }

        const hasMatch = matched.length > 0;

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

            <Text
              style={{
                fontSize: Math.round(14 * theme.scale),
                lineHeight: Math.round(20 * theme.scale),
                color: theme.colors.text,
              }}
            >
              {text}
            </Text>

            {hasMatch && (
              <View style={styles.rowChips}>
                {matched.map((k, i) => (
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
  summaryBox: {
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
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
