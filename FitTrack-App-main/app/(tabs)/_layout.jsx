
import { Tabs } from 'expo-router';


import { useEffect } from 'react';

export default function TabLayout() {


  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue', headerShown: false }}>



      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',

        }}
      />
      <Tabs.Screen
        name="allproducts"
        options={{
          title: 'Products',

        }}
      />



      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',

        }}
      />


    </Tabs>
  );
}
