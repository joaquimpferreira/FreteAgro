import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FreteAgro',
  slug: 'fretagro-mobile',
  owner: 'joaquimpferreira',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // The app follows the system appearance (lib/theme/ThemeProvider). Without
  // this, `useColorScheme()` is pinned to whatever is declared here and the
  // dark scheme can never be reached.
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    // Matches `colors.surface` on the light scheme, so the splash hands over to
    // the first screen without a flash of a different background.
    backgroundColor: '#f4f6f4',
    dark: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0f1311',
    },
  },
  scheme: 'fretagroapp',
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0D0D0D',
    },
    package: 'com.fretagro.mobile',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.fretagro.mobile',
    scheme: 'fretagroapp',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        photosPermission:
          'O aplicativo precisa de acesso às suas fotos para anexar recibos.',
        cameraPermission:
          'O aplicativo precisa de acesso à câmera para tirar fotos de recibos.',
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: '73537c29-1e97-436f-a4c3-fafe1ba4ffb4',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
