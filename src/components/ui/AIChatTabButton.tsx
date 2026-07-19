import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';

interface AIChatTabButtonProps {
  onPress: (e?: any) => void;
  accessibilityState?: any;
}

export const AIChatTabButton: React.FC<AIChatTabButtonProps> = ({ onPress, accessibilityState }) => {
  const selected = accessibilityState?.selected;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 10, stiffness: 200 });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={styles.container}
    >
      <Animated.View style={[styles.button, animatedStyle, selected && styles.activeButton]}>
        <Sparkles size={26} color={selected ? '#121212' : '#ff6b00'} fill={selected ? '#121212' : 'transparent'} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderWidth: 1.5,
    borderColor: '#ff6b00',
    justifyContent: 'center',
    alignItems: 'center',
    // Glow effect (liquid glass feel)
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  activeButton: {
    backgroundColor: '#ff6b00',
    borderColor: '#ffffff',
    shadowColor: '#ff6b00',
    shadowOpacity: 0.9,
    shadowRadius: 15,
  },
});
export default AIChatTabButton;
