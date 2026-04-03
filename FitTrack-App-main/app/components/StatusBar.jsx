import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

export default function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const upd = () => {
      const n = new Date();
      setTime(`${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`);
    };
    upd();
    const i = setInterval(upd, 10000);
    return () => clearInterval(i);
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.statusBar}>
      <Text style={styles.time}>{time}</Text>
      <View style={styles.icons}>
        <Text style={styles.icon}>📶</Text>
        <Text style={styles.icon}>🛜</Text>
        <Text style={styles.icon}>🔋</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  time: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141416',
  },
  icons: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  icon: {
    fontSize: 14,
  },
});