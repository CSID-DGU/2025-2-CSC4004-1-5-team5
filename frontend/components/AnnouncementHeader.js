import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function AnnouncementHeader({ onPressSettings }) {
  const { theme } = useSettings();

  return (
    <View style={[styles.wrap, { borderColor: theme.colors.line, backgroundColor: theme.colors.card }]}>
      <View>
        <Text
          style={{
            fontSize: Math.round(18 * theme.scale),
            fontWeight: theme.weight,
            color: theme.colors.text,
          }}
        >
          안내방송 알림
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontSize: Math.round(12 * theme.scale),
            color: theme.colors.sub,
          }}
        >
          실시간 음성 인식
        </Text>
      </View>

      {/* 설정 아이콘 */}
      <Pressable
        onPress={onPressSettings}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="설정 열기"
      >
        <Image
          source={require('../assets/Setting.png')}
          style={[styles.icon, { tintColor: theme.colors.sub }]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 45,
    height: 45,
  },
});
