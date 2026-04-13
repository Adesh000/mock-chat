/**
 * ChatApp – Group Chat with MockSocket & Context API
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChatProvider, useChat } from './src/context/ChatContext';
import GroupListScreen from './src/screens/GroupListScreen';
import ChatScreen from './src/screens/ChatScreen';

function AppNavigator() {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const { setActiveGroup } = useChat();

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveGroup(groupId);
  };

  const handleBack = () => {
    setActiveGroup(null);
    setActiveGroupId(null);
  };

  if (activeGroupId) {
    return <ChatScreen groupId={activeGroupId} onBack={handleBack} />;
  }

  return <GroupListScreen onSelectGroup={handleSelectGroup} />;
}

function App() {
  return (
    <SafeAreaProvider>
      <ChatProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0D0F14" />
        <View style={styles.container}>
          <AppNavigator />
        </View>
      </ChatProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
  },
});

export default App;
