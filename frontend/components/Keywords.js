// components/Keywords.js
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useSession } from '../context/SessionContext';
import { api } from '../api/instance';

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

export default function Keywords({ onChange }) {
  const { theme } = useSettings();
  const { sessionId } = useSession();

  const [input, setInput] = useState('');
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(true);

  // 외부로는 항상 "word 목록"만 전달
  const emitChange = (nextItems) => {
    setItems(nextItems);
    onChange?.(nextItems.map((i) => i.text)); // ← 여기서 id는 절대 안 나감
  };

  // 1. 키워드 조회 (GET /keywords?session_id={세션ID})
  const fetchKeywords = async () => {
    if (!sessionId) return;

    try {
      console.log('[Keywords] 조회 요청: /keywords?session_id=', sessionId);

      const res = await api.get('/keywords', {
        params: { session_id: sessionId },
      });

      if (!Array.isArray(res.data)) {
        console.warn('[Keywords] 예상과 다른 응답 형태:', res.data);
        emitChange([]);
        return;
      }

      const list = res.data.map((k) => ({
        id: k.id,
        text: k.keyword,
        sessionId: k.session_id,
        createdAt: k.created_at,
        _localKey: `srv-${k.id}-${k.keyword}`,
      }));

      console.log(`[Keywords] 조회 성공, ${list.length}개`, list);
      emitChange(list);
    } catch (e) {
      console.warn('[Keywords] 조회 실패:', e.response?.data ?? e.message);
    }
  };

  // 세션이 바뀌면:
  // 1) 기존 items / onChange 상태 비우고
  // 2) 새 세션 기준으로 다시 GET
  useEffect(() => {
    // 세션 변경 시 이전 세션의 키워드/ID는 버림
    setItems([]);
    onChange?.([]);
    if (sessionId) {
      fetchKeywords();
    }
  }, [sessionId]);

  // 2. 키워드 등록 (POST /keywords/)
  // request:
  // {
  //   "session_id": 5,
  //   "keywords": ["구로","나가는 문","오른쪽"]
  // }
  // 응답은 리스트 갱신에 사용하지 않고, 성공 후 다시 fetchKeywords() 호출
  const add = async () => {
    const v = input.trim();
    if (!v) return;

    if (!sessionId) {
      console.log('[Keywords] 세션 ID 없음');
      return;
    }

    try {
      const payload = {
        session_id: sessionId,
        keywords: [v], // ← word만 넘김, id는 없음
      };

      console.log('[Keywords] 등록 요청 payload:', payload);
      const res = await api.post('/keywords/', payload);
      console.log('[Keywords] 등록 응답:', res.data);

      // 서버 상태를 기준으로 전체 목록 재조회
      await fetchKeywords();

      setInput('');
    } catch (e) {
      console.warn(
        '[Keywords] 등록 실패:',
        e.response?.data ?? e.message,
      );
    }
  };

  // 3. 키워드 삭제 (DELETE /keywords/{id})
  // url의 {id}는 키워드 id
  // response:
  // {
  //   "id": 5,
  //   "keyword": "오른쪽",
  //   "detail": "deleted"
  // }
  const remove = async (item) => {
    const { id, text } = item;

    console.log(`[Keywords] 삭제 시도: "${text}", ID값: ${id}`);

    if (id == null) {
      console.warn('[Keywords] ID가 null입니다. 화면에서만 제거합니다.');
      const next = items.filter((it) => it !== item);
      emitChange(next);
      return;
    }

    try {
      const requestUrl = `/keywords/${id}/`;
      console.log(`▶️ [삭제 요청 URL]: ${requestUrl}`);

      const res = await api.delete(requestUrl);
      console.log('[Keywords] 삭제 응답:', res.data);

      if (res.data?.detail === 'deleted') {
        console.log(`✅ [삭제 성공] ID: ${res.data.id}, keyword: ${res.data.keyword}`);
      } else {
        console.warn('[Keywords] 삭제 응답이 예상과 다릅니다:', res.data);
      }

      const next = items.filter((it) => it.id !== id);
      emitChange(next);
    } catch (e) {
      console.error('[Keywords] 삭제 실패:', e.response?.data ?? e.message);
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
