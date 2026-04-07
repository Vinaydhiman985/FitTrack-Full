
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"     options={{ title: 'Home' }} />
      <Tabs.Screen name="territory" options={{ title: 'Territory' }} />
      <Tabs.Screen name="track"     options={{ title: 'Track' }} />
      <Tabs.Screen name="shop"      options={{ title: 'Shop' }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profile' }} />
      <Tabs.Screen name="map"       options={{ href: null }} />
    </Tabs>
  );
}
