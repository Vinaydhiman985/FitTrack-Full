import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TABS = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'territory', icon: '🗺️', label: 'Territory' },
  { id: 'track', icon: '▶️', label: '', fab: true },
  { id: 'shop', icon: '🛍️', label: 'Shop' },
  { id: 'profile', icon: '👤', label: 'Profile' },
];

export default function BottomNav({ active, onNav }) {
  return (
    <View style={styles.bottomNav}>
      {TABS.map((t) =>
        t.fab ? (
          <TouchableOpacity key={t.id} style={styles.fab} onPress={() => onNav(t.id)}>
            <Text style={styles.fabIcon}>▶️</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            key={t.id}
            style={styles.navItem}
            onPress={() => onNav(t.id)}
          >
            <Text style={styles.navIcon}>{t.icon}</Text>
            <Text style={[styles.navLabel, active === t.id && styles.navLabelActive]}>
              {t.label}
            </Text>
            {active === t.id && <View style={styles.navDot} />}
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    height: 80,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    position: 'relative',
  },
  navIcon: { fontSize: 20 },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  navLabelActive: { color: '#F4621F' },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F4621F',
    position: 'absolute',
    bottom: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4621F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    elevation: 6,
    shadowColor: '#F4621F',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: { fontSize: 24 },
});