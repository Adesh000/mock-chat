import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatState, type Group } from '../context/ChatContext';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';

interface Props {
  onSelectGroup: (groupId: string) => void;
}

export default function GroupListScreen({ onSelectGroup }: Props) {
  const state = useChatState();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: Group }) => {
    const isTyping = state.typing[item.id];
    const lastMsg = item.lastMessage;
    const time = lastMsg
      ? new Date(lastMsg.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <TouchableOpacity
        style={styles.groupItem}
        activeOpacity={0.7}
        onPress={() => onSelectGroup(item.id)}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
          <View style={styles.onlineDot} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.groupName} numberOfLines={1}>
              {item.name}
            </Text>
            {time ? <Text style={styles.time}>{time}</Text> : null}
          </View>
          <View style={styles.bottomRow}>
            {isTyping ? (
              <Text style={styles.typingText}>typing...</Text>
            ) : lastMsg ? (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {lastMsg.sender === 'me' ? 'You: ' : ''}
                {lastMsg.text}
              </Text>
            ) : (
              <Text style={styles.lastMessage}>No messages yet</Text>
            )}
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <View style={styles.connectionDot}>
          <View
            style={[
              styles.dot,
              { backgroundColor: state.connected ? Colors.online : Colors.unread },
            ]}
          />
          <Text style={styles.connectionText}>
            {state.connected ? 'Connected' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Group List */}
      <FlatList
        data={state.groups}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  connectionDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 24,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  groupName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  typingText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontStyle: 'italic',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  unreadText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 84,
    marginRight: Spacing.xl,
  },
});
