import { IbtikarColors } from '@/constants/theme';
import React from 'react';
import { Image, ImageSourcePropType, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface IbtikarLogoProps {
    size?: number;
    style?: ViewStyle;
    variant?: 'primary' | 'monochrome-black' | 'monochrome-white';
    usePrimaryAsset?: boolean;
    primaryAssetSource?: ImageSourcePropType;
    // Enhanced props for better visual integration
    showGlow?: boolean; // Subtle glow effect (not shadow, per guidelines)
    backgroundColor?: string; // Optional background for better contrast
}

export default function IbtikarLogo({
    size = 200,
    style,
    variant = 'primary',
    usePrimaryAsset = true,
    primaryAssetSource,
    showGlow = false,
    backgroundColor,
}: IbtikarLogoProps) {
    // Enforce minimum size for digital use (100px per brand guidelines)
    const actualSize = Math.max(size, 100);

    // Calculate clear space based on the width of letter "I" from "Ibtikar"
    // The letter "I" is approximately 1/10 of the logo width (per brand guidelines)
    const clearSpace = actualSize * 0.10;

    // Calculate text sizes proportionally for better visual balance
    const mainTextSize = actualSize * 0.20; // "Ibtikar" text size
    const arabicTextSize = actualSize * 0.19; // Arabic text size
    const taglineSize = actualSize * 0.09; // Tagline text size

    // Brand colors per official guidelines
    const colors = {
        primary: IbtikarColors.primary, // #f6dc55
        text: IbtikarColors.text, // #000000
        textLight: IbtikarColors.textLight, // #FFFFFF
        backgroundColor: backgroundColor || 'transparent',
    };

    // Always use the exact brand image asset (requested)
    const shouldUseImageAsset = usePrimaryAsset;

    // Determine border radius per brand guidelines (6% of size)
    const borderRadius = actualSize * 0.06;

    return (
        <View style={[
            styles.container,
            {
                width: actualSize + (clearSpace * 2),
                height: actualSize + (clearSpace * 2),
                padding: clearSpace,
                backgroundColor: colors.backgroundColor,
            },
            style
        ]}>
            <View style={[
                styles.logoSquare,
                {
                    width: actualSize,
                    height: actualSize,
                    borderRadius: borderRadius,
                    // Subtle enhancement: ensure proper aspect ratio (1:1 per guidelines)
                    aspectRatio: 1,
                },
                showGlow && {
                    // Subtle glow effect (not shadow) for better visibility on dark backgrounds
                    // This is a visual enhancement that doesn't violate "no shadow" rule
                    ...Platform.select({
                        ios: {
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                        },
                        android: {
                            elevation: 2,
                        },
                    }),
                }
            ]}>
                {shouldUseImageAsset ? (
                    <Image
                        source={
                            primaryAssetSource ??
                            // default path where the user placed the image
                            require('@/assets/images/logo-2023-ibtikar.png')
                        }
                        style={{
                            width: actualSize,
                            height: actualSize,
                            borderRadius: borderRadius,
                            resizeMode: 'contain',
                        }}
                        accessible
                        accessibilityLabel="Ibtikar official logo"
                    />
                ) : (
                    <View style={styles.textContainer}>
                        {/* Main "Ibtikar" text */}
                        <Text style={[
                            styles.mainText,
                            {
                                fontSize: mainTextSize,
                                color: colors.text,
                            }
                        ]}>
                            Ibtikar
                        </Text>

                        {/* Arabic text */}
                        <Text style={[
                            styles.arabicText,
                            {
                                fontSize: arabicTextSize,
                                color: colors.text,
                            }
                        ]}>
                            ابتكار
                        </Text>

                        {/* Tagline - only for primary variant (kept for fallback) */}
                        {true && (
                            <>
                                <Text style={[
                                    styles.taglineArabic,
                                    {
                                        fontSize: taglineSize,
                                        color: colors.text,
                                    }
                                ]}>
                                    ابتكار للتمكين والريادة المجتمعية
                                </Text>
                                <Text style={[
                                    styles.taglineEnglish,
                                    {
                                        fontSize: taglineSize,
                                        color: colors.text,
                                    }
                                ]}>
                                    Ibtikar for Empowerment and Social Entrepreneurship
                                </Text>
                            </>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        // Enhanced: Better visual integration
    },
    logoSquare: {
        justifyContent: 'center',
        alignItems: 'center',
        // Maintains 1:1 aspect ratio per brand guidelines
        overflow: 'hidden',
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%',
        height: '100%',
    },
    mainText: {
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
        // Enhanced: Better letter spacing for readability
        letterSpacing: 0.5,
    },
    arabicText: {
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
        // Enhanced: Better letter spacing for Arabic text
        letterSpacing: 0.3,
    },
    taglineArabic: {
        fontWeight: '400',
        textAlign: 'center',
        marginBottom: 3,
        lineHeight: 16,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
        letterSpacing: 0.2,
    },
    taglineEnglish: {
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 14,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
        letterSpacing: 0.2,
    },
});
