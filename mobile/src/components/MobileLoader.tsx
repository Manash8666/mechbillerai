import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/theme';

interface LoaderProps {
  text?: string;
}

export default function MobileLoader({ text = 'Generating' }: LoaderProps) {
  const letters = text.split('');
  const animatedValues = useRef(letters.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = letters.map((_, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(animatedValues[i], {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValues[i], {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(letters.length * 120),
        ])
      )
    );

    Animated.parallel(animations).start();
  }, [animatedValues, letters]);

  return (
    <View style={styles.container}>
      <View style={styles.pillWrapper}>
        <View style={styles.lettersRow}>
          {letters.map((char, index) => {
            const translateY = animatedValues[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, -6, 0],
            });
            const opacity = animatedValues[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.4, 1, 0.4],
            });

            return (
              <Animated.Text
                key={`${char}-${index}`}
                style={[
                  styles.letter,
                  {
                    transform: [{ translateY }],
                    opacity,
                  },
                ]}
              >
                {char === ' ' ? '\u00A0' : char}
              </Animated.Text>
            );
          })}
        </View>
        <View style={styles.goldLine} />
      </View>
      <Text style={styles.subtext}>MotoBan Engine</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillWrapper: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.35)',
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  lettersRow: {
    flexDirection: 'row',
  },
  letter: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  goldLine: {
    width: 28,
    height: 2,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    borderRadius: 1,
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
