// components/RealtimeHistoryTabs.js
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function RealtimeHistoryTabs({ tab, onChangeTab }) {
  const { theme } = useSettings();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          shadowColor: theme.colors.text,
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.colors.bg },
        ]}
      >
        {/* 실시간 탭 */}
        <Pressable
          onPress={() => onChangeTab('realtime')}
          style={[
            styles.tab,
            tab === 'realtime' && {
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <Image
            source={require('../assets/Live.png')}
            style={[
              styles.icon,
              tab === 'realtime' && { opacity: 1 },
            ]}
          />
          <Text
            style={{
              fontSize: Math.round(14 * theme.scale),
              fontWeight: theme.weight,
              color:
                tab === 'realtime' ? theme.colors.text : theme.colors.sub,
            }}
          >
            실시간
          </Text>
        </Pressable>

        {/* 방송 이력 탭 */}
        <Pressable
          onPress={() => onChangeTab('history')}
          style={[
            styles.tab,
            tab === 'history' && {
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <Image
            source={require('../assets/History.png')}
            style={[
              styles.icon,
              tab === 'history' && { opacity: 1 },
            ]}
          />
          <Text
            style={{
              fontSize: Math.round(14 * theme.scale),
              fontWeight: theme.weight,
              color:
                tab === 'history' ? theme.colors.text : theme.colors.sub,
            }}
          >
            방송 이력
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 12,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  icon: { width: 16, height: 16, opacity: 0.5 },
});
