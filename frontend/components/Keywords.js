import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';

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

export default function Keywords() {
  const [input, setInput] = useState('');
  const [items, setItems] = useState(['○○○○', '○○○○', '승강장', '안전', '지연', '출발', '혼잡', '환승', '좌측']);
  const [collapsed, setCollapsed] = useState(true); // 2줄까지만 표시

  const add = () => {
    const v = input.trim();
    if (!v) return;
    setItems((prev) => [v, ...prev]);
    setInput('');
  };

  const remove = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
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
        <Pressable onPress={() => setCollapsed((p) => !p)}>
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
