import IbtikarLogo from "@/components/IbtikarLogo";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const dot1Anim = useRef(new Animated.Value(0.3)).current;
    const dot2Anim = useRef(new Animated.Value(0.3)).current;
    const dot3Anim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        let isMounted = true;
        let dotAnimation: Animated.CompositeAnimation | null = null;

        // Start all animations
        Animated.parallel([
            // Fade in
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            // Scale up logo
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 40,
                friction: 7,
                useNativeDriver: true,
            }),
            // Rotate
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            }),
            // Slide up text
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                delay: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Loading dots animation
        const animateDots = () => {
            if (!isMounted) return;

            dotAnimation = Animated.sequence([
                Animated.parallel([
                    Animated.timing(dot1Anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2Anim, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3Anim, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(dot1Anim, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2Anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3Anim, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(dot1Anim, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2Anim, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3Anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]),
            ]);

            dotAnimation.start(() => {
                if (isMounted) {
                    animateDots();
                }
            });
        };
        animateDots();

        // Finish after 2.5 seconds - gives time to see the animations
        const timer = setTimeout(() => {
            if (isMounted) {
                console.log("✅ Splash screen finished - transitioning to login");
                onFinish();
            }
        }, 2500);

        // Safety timeout - force finish after 4 seconds max
        const safetyTimer = setTimeout(() => {
            if (isMounted) {
                console.log("⚠️ Splash screen safety timeout - forcing finish");
                onFinish();
            }
        }, 4000);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            clearTimeout(safetyTimer);
            if (dotAnimation) {
                dotAnimation.stop();
            }
        };
    }, [onFinish]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <LinearGradient
            colors={["#6366f1", "#8b5cf6", "#a855f7", "#c084fc"]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { scale: scaleAnim },
                            { rotate: rotate },
                        ],
                    },
                ]}
            >
                <Animated.View
                    style={{
                        transform: [{ scale: pulseAnim }],
                    }}
                >
                    <IbtikarLogo size={Math.min(width * 0.4, 180)} style={styles.logo} />
                </Animated.View>
            </Animated.View>

            <Animated.View
                style={[
                    styles.textContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <Text style={styles.title}>Ibtikar</Text>
                <Text style={styles.subtitle}>Empowerment & Innovation</Text>
                <View style={styles.loadingContainer}>
                    <Animated.View style={[styles.loadingDot, { opacity: dot1Anim }]} />
                    <Animated.View style={[styles.loadingDot, { opacity: dot2Anim }]} />
                    <Animated.View style={[styles.loadingDot, { opacity: dot3Anim }]} />
                </View>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: width,
        height: height,
    },
    logoContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 40,
    },
    logo: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    textContainer: {
        alignItems: "center",
        marginTop: 40,
    },
    title: {
        fontSize: 42,
        fontWeight: "800",
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: 2,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "500",
        color: "#FFFFFF",
        textAlign: "center",
        opacity: 0.9,
        letterSpacing: 1,
    },
    loadingContainer: {
        flexDirection: "row",
        marginTop: 30,
        gap: 8,
    },
    loadingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#FFFFFF",
    },
});

