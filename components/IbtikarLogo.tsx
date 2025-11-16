import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform, Image, ImageSourcePropType } from 'react-native';

interface IbtikarLogoProps {
    size?: number;
    style?: ViewStyle;
    // Kept for backward compatibility but ignored: we always use the official asset
    variant?: 'primary' | 'monochrome-black' | 'monochrome-white';
    usePrimaryAsset?: boolean;
    primaryAssetSource?: ImageSourcePropType;
}

export default function IbtikarLogo({
    size = 200,
    style,
    variant = 'primary',
    usePrimaryAsset = true,
    primaryAssetSource,
}: IbtikarLogoProps) {
    // Enforce minimum size for digital use (100px per brand guidelines)
    const actualSize = Math.max(size, 100);

    // Calculate clear space based on the width of letter "I" from "Ibtikar"
    // The letter "I" is approximately 1/10 of the logo width
    const clearSpace = actualSize * 0.10;

    // Calculate text sizes proportionally for better visual balance
    const mainTextSize = actualSize * 0.20; // "Ibtikar" text size
    const arabicTextSize = actualSize * 0.19; // Arabic text size
    const taglineSize = actualSize * 0.09; // Tagline text size

    // Colors only used if we ever fall back to drawn version
    const colors = { backgroundColor: 'transparent', textColor: '#000000' as const };

    // Always use the exact brand image asset (requested)
    const shouldUseImageAsset = usePrimaryAsset;

    return (
        <View style={[
            styles.container,
            {
                width: actualSize + (clearSpace * 2),
                height: actualSize + (clearSpace * 2),
                padding: clearSpace,
            },
            style
        ]}>
            <View style={[
                styles.logoSquare,
                {
                    width: actualSize,
                    height: actualSize,
                    backgroundColor: 'transparent',
                    borderRadius: actualSize * 0.06, // Slightly rounded corners (6% of size per brand guidelines)
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
                            borderRadius: actualSize * 0.06,
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
                                color: colors.textColor,
                            }
                        ]}>
                            Ibtikar
                        </Text>

                        {/* Arabic text */}
                        <Text style={[
                            styles.arabicText,
                            {
                                fontSize: arabicTextSize,
                                color: colors.textColor,
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
                                        color: colors.textColor,
                                    }
                                ]}>
                                    ابتكار للتمكين والريادة المجتمعية
                                </Text>
                                <Text style={[
                                    styles.taglineEnglish,
                                    {
                                        fontSize: taglineSize,
                                        color: colors.textColor,
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
    },
    logoSquare: {
        justifyContent: 'center',
        alignItems: 'center',
        // No shadows as per official guidelines
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    mainText: {
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 6,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    },
    arabicText: {
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    },
    taglineArabic: {
        fontWeight: '400',
        textAlign: 'center',
        marginBottom: 3,
        lineHeight: 16,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    },
    taglineEnglish: {
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 14,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    },
});
