import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const WaterTank: React.FC<{ tankLevel: number }> = ({ tankLevel }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopAnimation = Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000, // Daha yavaş hareket
        useNativeDriver: true,
      })
    );
    loopAnimation.start();

    return () => loopAnimation.stop();
  }, [waveAnim]);

  const waveWidth = width * 0.8; // Bar genişliği
  const waveHeight = 20; // Dalga yüksekliği
  const wavePath = `
    M 0 ${waveHeight / 2}
    C ${waveWidth / 4} ${waveHeight} ${waveWidth / 2} 0 ${waveWidth} ${waveHeight / 2}
    C ${waveWidth * 1.25} ${waveHeight} ${waveWidth * 1.5} 0 ${waveWidth * 2} ${waveHeight / 2}
    V ${waveHeight}
    H 0
    Z
  `;

  const translateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -waveWidth],
  });

  return (
    <View style={styles.container}>
      {/* Su Tankı Barı */}
      <View style={styles.tankContainer}>
        <View style={[styles.tankBackground, { width: `${tankLevel}%` }]}>
          <Animated.View
            style={{
              transform: [{ translateX }],
            }}
          >
            <Svg
              height={waveHeight}
              width={waveWidth * 2}
              style={styles.wave}
              viewBox={`0 0 ${waveWidth * 2} ${waveHeight}`}
            >
              <Path d={wavePath} fill="#1e90ff" />
            </Svg>
          </Animated.View>
        </View>
      </View>
      {/* Su Seviyesi Yazısı */}
      <View style={styles.tankLabel}>
        <Text style={styles.tankText}>Su Tankı Seviyesi: {tankLevel}%</Text>
      </View>
    </View>
  );
};

export default WaterTank;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  tankContainer: {
    width: '90%', // Bar genişliği
    height: 20, // Bar yüksekliği
    backgroundColor: '#f5f5f5', // Arka plan rengi
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  tankBackground: {
    height: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tankLabel: {
    marginTop: 10,
  },
  tankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
