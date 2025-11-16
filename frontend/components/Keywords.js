// components/Keywords.js
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useSession } from '../context/SessionContext';
import { api } from '../api/instance';

// 개별 칩 UI
function Chip({ text, onRemove, theme }) {
  const scaledHeight = 28 * theme.scale;
  const scaledPaddingV = 6 * theme.scale;
  const scaledPaddingH = 10 * theme.scale;
  const scaledRadius = 999 * theme.scale;

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: '#e9f5ff',
          height: scaledHeight,
          paddingVertical: scaledPaddingV,
          paddingHorizontal: scaledPaddingH,
          borderRadius: scaledRadius,
        },
      ]}
    >
      <Text
        style={{
          fontSize: Math.round(12 * theme.scale),
          fontWeight: '600',
          color: '#1f4f7a',
        }}
      >
        {text}
      </Text>

      <Pressable
        onPress={onRemove}
        style={[
          styles.chipX,
          { transform: [{ scale: theme.scale }] },
        ]}
      >
        <Text
          style={{
            fontSize: Math.round(12 * theme.scale),
            color: '#432DD7',
          }}
        >
          ×
        </Text>
      </Pressable>
    </View>
  );
}

// items: [{ id: number | null, text: string }]
export default function Keywords({ onChange }) {
  const { theme } = useSettings();
  const { sessionId } = useSession();

  const [input, setInput] = useState('');
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(true);

  // 공통: items 변경 시 상위로 알림
  const emitChange = (nextItems) => {
    setItems(nextItems);
    onChange?.(nextItems.map((i) => i.text));
  };

  // 1. 키워드 조회 (GET /keywords/?session_id=...)
  const fetchKeywords = async () => {
    if (!sessionId) {
      console.log('[Keywords] 세션 ID 없음, 서버 조회 건너뜀');
      return;
    }

    try {
      console.log(
        `[Keywords] 서버 키워드 조회: GET /keywords/?session_id=${sessionId}`,
      );

      const res = await api.get('/keywords/', {
        params: { session_id: sessionId },
      });

      console.log('[Keywords] 조회 status:', res.status);
      console.log(
        '[Keywords] 조회 데이터:',
        JSON.stringify(res.data, null, 2),
      );

      // 응답 예시:
      // {
      //   "session_id": 7,
      //   "total_keywords": 1,
      //   "keywords": [
      //     { "id": 1, "word": "ㅎㄹ", "created_at": "..." }
      //   ]
      // }
      const rawList = Array.isArray(res.data?.keywords)
        ? res.data.keywords
        : [];

      const list = rawList.map((k, idx) => {
        // 혹시나 문자열 배열이 올 경우도 방어적으로 처리
        if (typeof k === 'string') {
          return {
            id: null,
            text: k,
            _localKey: `srv-${idx}-${k}`,
          };
        }

        const id = k.id ?? null;
        const word = k.word ?? '';

        return {
          id,
          text: String(word),
          _localKey: `srv-${id ?? idx}-${word}`,
        };
      });

      emitChange(list);
    } catch (e) {
      console.warn(
        '[Keywords] 서버 키워드 조회 실패:',
        e.response?.data ?? e.message,
      );
    }
  };

  // 세션 ID가 준비되면 한 번 조회
  useEffect(() => {
    fetchKeywords();
    // sessionId가 바뀔 때마다 다시 조회
  }, [sessionId]);

  // 2. 키워드 등록 (POST /keywords/)
  const add = async () => {
    const v = input.trim();
    if (!v) return;

    if (!sessionId) {
      console.log('[Keywords] 세션 ID 없음, 서버에 전송하지 않음');
      return;
    }

    try {
      const payload = {
        // 스펙: { "session_id": 5, "keywords": ["지연", "탑승구", ...] }
        session_id: sessionId,
        keywords: [v],
      };

      console.log('[Keywords] 등록 요청: POST /keywords/', payload);

      const res = await api.post('/keywords/', payload);

      console.log('[Keywords] 등록 응답 status:', res.status);
      console.log(
        '[Keywords] 등록 응답 데이터:',
        JSON.stringify(res.data, null, 2),
      );

      // 등록 후에는 항상 서버 기준으로 다시 불러오기
      setInput('');
      await fetchKeywords();
    } catch (e) {
      console.warn(
        '[Keywords] 서버 키워드 등록 실패:',
        e.response?.data ?? e.message,
      );
    }
  };

  // 3. 키워드 삭제 (DELETE /keywords/{id}/)
  const remove = async (item) => {
    const { id, text } = item;

    // id가 없으면 서버에 삭제 요청 불가 → 로컬에서만 제거
    if (id == null) {
      console.warn(
        `[Keywords] 이 키워드는 id가 없어 서버에 삭제 요청을 보낼 수 없습니다: "${text}"`,
      );
      const next = items.filter((it) => it !== item);
      emitChange(next);
      return;
    }

    if (!sessionId) {
      console.log('[Keywords] 세션 ID 없음, 삭제 요청 안 함');
      const next = items.filter((it) => it !== item);
      emitChange(next);
      return;
    }

    try {
      console.log(`[Keywords] 삭제 요청: DELETE /keywords/${id}/`);

      const res = await api.delete(`/keywords/${id}/`);

      console.log('[Keywords] 삭제 응답 status:', res.status);
      console.log(
        '[Keywords] 삭제 응답 데이터:',
        JSON.stringify(res.data, null, 2),
      );

      // 삭제 후에도 서버 기준으로 다시 불러오고 싶다면:
      // await fetchKeywords();
      // 현재 방식대로 로컬에서만 제거하려면 아래 코드 유지
      const next = items.filter((it) => it.id !== id);
      emitChange(next);
    } catch (e) {
      console.warn(
        '[Keywords] 서버 키워드 삭제 실패:',
        e.response?.data ?? e.message,
      );
    }
  };

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.colors.card, shadowColor: '#000' },
      ]}
    >
      <Text
        style={{
          fontSize: Math.round(12 * theme.scale),
          color: theme.colors.sub,
          fontWeight: theme.weight,
        }}
      >
        등록한 키워드가 안내방송에 포함되면 알림을 받습니다
      </Text>

      {/* 입력 영역 */}
      <View style={[styles.inputRow, { gap: 8 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="새 키워드 입력"
          placeholderTextColor={theme.colors.sub}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bg,
              color: theme.colors.text,
              fontSize: Math.round(14 * theme.scale),
            },
          ]}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Pressable
          onPress={add}
          style={[
            styles.addBtn,
            { backgroundColor: '#22c55e' },
          ]}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: Math.round(22 * theme.scale),
              fontWeight: '700',
            }}
          >
            ＋
          </Text>
        </Pressable>
      </View>

      {/* 리스트 헤더 */}
      <View style={styles.rowHeader}>
        <Text
          style={{
            fontSize: Math.round(12 * theme.scale),
            color: theme.colors.sub,
            fontWeight: theme.weight,
          }}
        >
          등록된 키워드 ({items.length})
        </Text>
        <Pressable onPress={() => setCollapsed((p) => !p)}>
          <Text
            style={{
              fontSize: Math.round(12 * theme.scale),
              color: '#2563eb',
              fontWeight: '700',
            }}
          >
            {collapsed ? '더 보기' : '접기'}
          </Text>
        </Pressable>
      </View>

      {/* 칩 목록 */}
      <View style={[styles.chips, collapsed && styles.chipsCollapsed]}>
        {items.map((item, idx) => (
          <Chip
            key={item._localKey ?? item.id ?? `${item.text}-${idx}`}
            text={item.text}
            onRemove={() => remove(item)}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
}

const CHIP_ROW_HEIGHT = 28;
const ROW_GAP = 8;
const TWO_ROWS_MAX_HEIGHT = CHIP_ROW_HEIGHT * 2 + ROW_GAP;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputRow: { flexDirection: 'row' },
  input: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipsCollapsed: {
    maxHeight: TWO_ROWS_MAX_HEIGHT,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipX: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
