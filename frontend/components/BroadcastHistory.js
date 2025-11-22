// components/BroadcastHistory.js
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useSession } from '../context/SessionContext';
import { api } from '../api/instance';

// 문자열 비교용: 대소문자 무시, 앞의 # 제거
const norm = (s) => String(s || '').trim().replace(/^#/, '').toLowerCase();

export default function BroadcastHistory({ keywords = [], maxCount = 5 }) {
  const { theme } = useSettings();
  const { sessionId, fetchSessionResults } = useSession();

  // 🔹 서버에서 가져온 키워드를 보관
  const [serverKeywords, setServerKeywords] = useState([]);

  // 🔹 세션 결과 (summary + timeline)
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // 🔹 세션 ID로 키워드 GET
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

      console.log('[BroadcastHistory] 키워드 조회 status:', res.status);
      console.log(
        '[BroadcastHistory] 키워드 조회 데이터:',
        JSON.stringify(res.data, null, 2),
      );

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

  // 🔹 세션 결과 GET: /session/{id}/results/
  const fetchResults = async () => {
    if (!sessionId) {
      console.log('[BroadcastHistory] 세션 ID 없음, 결과 조회 건너뜀');
      return;
    }

    try {
      setLoadingResults(true);
      const data = await fetchSessionResults();
      setResults(data);
    } catch (e) {
      console.warn(
        '[BroadcastHistory] 결과 조회 실패:',
        e?.response?.data ?? e.message,
      );
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchResults();
  }, [sessionId]);

  // 🔹 실제로 사용할 키워드:
  //    - 부모에서 props로 넘겨주면 그걸 우선 사용
  //    - 안 넘겨주면 서버에서 가져온 서버 키워드 사용
  const effectiveKeywords =
    Array.isArray(keywords) && keywords.length > 0
      ? keywords
      : serverKeywords;

  // 방송 본문에서 매칭된 키워드 목록 추출 (텍스트 기반 fallback)
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

  // 🔹 timeline에서 사용할 아이템들 구성
  const timeline = Array.isArray(results?.timeline) ? results.timeline : [];

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
          {loadingResults
            ? '불러오는 중...'
            : `${items.length}/${totalCount}건`}
        </Text>
      </View>

      {/* 전체 요약이 있으면 위에 살짝 보여주기 (선택) */}
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
        // API 응답 구조에 맞게 필드 정리
        const id = String(it.announcement_id ?? it.id ?? '');
        const text = it.full_text ?? '';

        // ▸ 서버에서 감지한 키워드 (keywords_detected)
        const detected = Array.isArray(it.keywords_detected)
          ? it.keywords_detected
          : [];

        // ▸ effectiveKeywords와 비교해서 실제 매칭되는 키워드만 사용
        let matched = [];
        if (detected.length > 0 && effectiveKeywords.length > 0) {
          const set = new Set(effectiveKeywords.map(norm));
          matched = detected
            .map((k) => String(k))
            .filter((k) => set.has(norm(k)));
        }

        // ▸ 만약 keywords_detected가 비어 있으면,
        //    예전처럼 본문 텍스트 기준으로 매칭 시도 (fallback)
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
            {/* 시간/순번 표현 (API에 시간이 없으므로 순번 정도만) */}
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

            {/* 본문 */}
            <Text
              style={{
                fontSize: Math.round(14 * theme.scale),
                lineHeight: Math.round(20 * theme.scale),
                color: theme.colors.text,
              }}
            >
              {text}
            </Text>

            {/* 키워드 칩 */}
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
