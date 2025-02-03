import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';

interface LightRequirementCircleProps {
    lightRequirement: number; // Yüzdelik ışık gereksinimi
}

const LightRequirementCircle: React.FC<LightRequirementCircleProps> = ({ lightRequirement }) => {
    const animatedSize = useRef(new Animated.Value(lightRequirement || 0)).current;

    useEffect(() => {
        if (lightRequirement) {
            Animated.timing(animatedSize, {
                toValue: lightRequirement,
                duration: 1000,
                useNativeDriver: false, // Animasyon boyut değişimi için false
            }).start();
        }
    }, [lightRequirement]);


    // BorderRadius'u manuel hesaplamak için animatedSize'ın geçerli değerini kullanıyoruz
    const animatedStyle = {
        width: animatedSize,
        height: animatedSize,
        borderRadius: Animated.add(animatedSize, 0).interpolate({
            inputRange: [0, 100],
            outputRange: [0, 50], // Yarıçapı boyutun yarısı kadar ayarlar
        }),
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.sun, animatedStyle]}>
                <Text style={styles.text}>{lightRequirement}%</Text>
            </Animated.View>
        </View>
    );
};

export default LightRequirementCircle;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    sun: {
        backgroundColor: '#FFD700', // Altın sarısı
        borderWidth: 2,
        borderColor: '#FFA500', // Turuncu kenar çizgisi
        shadowColor: '#FFA500',
        shadowOpacity: 0.6,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        elevation: 5, // Android gölgesi
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
