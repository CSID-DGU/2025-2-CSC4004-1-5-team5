import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function Chip({ text, onRemove }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
      <Pressable onPress={onRemove} style={styles.chipX}>
        <Text style={styles.chipXText}>×</Text>
      </Pressable>
    </View>
  );
}

/** 최초 1회 시드용 기본 키워드 */
const DEFAULT_KEYWORDS = ['○○○○', '○○○○', '승강장', '안전', '지연', '출발', '혼잡', '환승', '좌측'];

export default function Keywords({
  sessionId = 'default',     // ✅ 세션 구분용
  onChange,                  // ✅ 부모(MainScreen)에 목록 전달
}) {
  const storageKey = useMemo(() => `keywords:${sessionId}`, [sessionId]);

  const [input, setInput] = useState('');
  const [items, setItems] = useState([]);     // ✅ 저장소에서 로드한 실제 목록
  const [collapsed, setCollapsed] = useState(true); // 2줄까지만 표시

  /** ✅ 저장 및 부모 콜백 통합 */
  const persist = async (next) => {
    setItems(next);
    onChange?.(next); // 부모에 최신 목록 전달
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {
      console.warn('키워드 저장 실패:', e);
    }
  };

  /** ✅ 최초 로드: 세션 키에서 읽고 없으면 기본값을 시드 */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(parsed);
            onChange?.(parsed); // 초기 값 부모 전달
            return;
          }
        }
        // 저장된 값이 없거나 포맷이 다르면 기본값 시드
        await AsyncStorage.setItem(storageKey, JSON.stringify(DEFAULT_KEYWORDS));
        setItems(DEFAULT_KEYWORDS);
        onChange?.(DEFAULT_KEYWORDS);
      } catch (e) {
        console.warn('키워드 로드 실패:', e);
        setItems(DEFAULT_KEYWORDS);
        onChange?.(DEFAULT_KEYWORDS);
      }
    })();
  }, [storageKey]);

  /** ✅ 추가: 중복은 맨 앞으로 이동(대소문자 무시) 후 저장 */
  const add = async () => {
    const v = input.trim();
    if (!v) return;
    const existsIdx = items.findIndex(k => k.toLowerCase() === v.toLowerCase());
    let next;
    if (existsIdx >= 0) {
      next = [items[existsIdx], ...items.filter((_, i) => i !== existsIdx)];
    } else {
      next = [v, ...items];
    }
    setInput('');
    await persist(next);
  };

  /** ✅ 삭제: 바로 저장 반영 */
  const remove = async (idx) => {
    const next = items.filter((_, i) => i !== idx);
    await persist(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>등록한 키워드가 안내방송에 포함되면 알림을 받습니다</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="새 키워드 입력"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Pressable onPress={add} style={styles.addBtn}>
          <Text style={styles.addBtnText}>＋</Text>
        </Pressable>
      </View>

      <View style={styles.rowHeader}>
        <Text style={styles.subTitle}>등록된 키워드 ({items.length})</Text>
        <Pressable onPress={() => setCollapsed(p => !p)}>
          <Text style={styles.moreBtn}>{collapsed ? '더 보기' : '접기'}</Text>
        </Pressable>
      </View>

      <View style={[styles.chips, collapsed && styles.chipsCollapsed]}>
        {items.map((t, i) => (
          <Chip key={`${t}-${i}`} text={t} onRemove={() => remove(i)} />
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
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 12, color: '#374151' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subTitle: { fontSize: 12, color: '#6b7280' },
  moreBtn: { fontSize: 12, color: '#2563eb', fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipsCollapsed: {
    maxHeight: TWO_ROWS_MAX_HEIGHT,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f5ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 6,
    height: CHIP_ROW_HEIGHT,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#1f4f7a' },
  chipX: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipXText: { fontSize: 12, color: '#432DD7' },
});
