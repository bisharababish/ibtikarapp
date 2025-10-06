declare module 'lucide-react-native' {
    import { ComponentType } from 'react';

    export interface IconProps {
        color?: string;
        size?: number;
        strokeWidth?: number;
    }

    export const Twitter: ComponentType<IconProps>;
    export const LogOut: ComponentType<IconProps>;
    export const Sparkles: ComponentType<IconProps>;
    export const X: ComponentType<IconProps>;
    export const Home: ComponentType<IconProps>;
    export const User: ComponentType<IconProps>;
    export const Compass: ComponentType<IconProps>;
}