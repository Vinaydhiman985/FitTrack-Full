import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../hooks';

const CONF_COLORS = ['#F4621F','#F59E0B','#7C3AED','#16A34A','#06B6D4','#EF4444','#F472B6'];

export default function AchievementPopup() {
  const { achievement, setAchievement, dark } = useApp();

  if (!achievement) return null;

  const confetti = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    color: CONF_COLORS[i % CONF_COLORS.length],
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 6 + Math.random() * 6,
  }));

  return (
    <Modal transparent animationType="slide" onRequestClose={() => setAchievement(null)}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => setAchievement(null)}
      >
        <View style={[styles.content, { backgroundColor: dark ? '#1A1A20' : '#fff' }]}>

          {/* Confetti */}
          {confetti.map((c) => (
            <View
              key={c.id}
              style={[
                styles.confetti,
                {
                  left: `${c.left}%`,
                  top: c.top,
                  width: c.size,
                  height: c.size,
                  backgroundColor: c.color,
                },
              ]}
            />
          ))}

          {/* Icon */}
          <Text style={styles.icon}>{achievement.icon}</Text>

          {/* Title */}
          <Text style={[styles.title, { color: dark ? '#F0F0F5' : '#141416' }]}>
            {achievement.title}
          </Text>

          {/* Subtitle */}
          <Text style={styles.sub}>{achievement.sub}</Text>

          {/* XP */}
          {achievement.xp > 0 && (
            <Text style={styles.xp}>+{achievement.xp} XP earned!</Text>
          )}

          {/* Button */}
          <TouchableOpacity
            style={styles.btn}
            onPress={() => setAchievement(null)}
          >
            <Text style={styles.btnText}>Awesome! 🎉</Text>
          </TouchableOpacity>

        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  content: {
    borderRadius: 24,
    padding: 32,
    paddingBottom: 40,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
    opacity: 0.8,
  },
  icon: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  xp: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 12,
  },
  btn: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#F4621F',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#F4621F',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});