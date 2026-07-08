import { ReactNode, useEffect } from 'react';
import { Stack } from 'expo-router';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_600SemiBold_Italic,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { persistor, store } from '../src/store';
import { useAppSelector } from '../src/store/hooks';
import { useAuthBootstrap } from '../src/hooks/useAuthBootstrap';
import { usePushNotificationsBootstrap } from '../src/hooks/usePushNotifications';
import { startConnectivityMonitor } from '../src/services/connectivity';
import { flushOutbox } from '../src/store/outboxFlush';
import { SplashScreenView } from '../src/components/ui/SplashScreenView';
import { OfflineBanner } from '../src/components/ui/OfflineBanner';
import { AppErrorBoundary } from '../src/components/ui/AppErrorBoundary';
import { colors } from '../src/constants/theme';

SplashScreen.preventAutoHideAsync();

// React Navigation's default theme paints a light-gray backdrop behind screens,
// which shows through around the floating tab-bar pill. Match it to our white
// page background so nothing gray peeks out.
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background },
};

function Bootstrap({ children }: { children: ReactNode }) {
  useAuthBootstrap();
  usePushNotificationsBootstrap();
  const hydrated = useAppSelector((s) => s.auth.hydrated);

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync();
    }
  }, [hydrated]);

  // Track connectivity and drain any queued offline writes on reconnect.
  useEffect(() => {
    startConnectivityMonitor({
      dispatch: store.dispatch,
      getState: store.getState,
      onReconnect: () => {
        void store.dispatch(flushOutbox());
      },
    });
    // Also attempt a flush on launch in case writes were queued last session.
    void store.dispatch(flushOutbox());
  }, []);

  if (!hydrated) return <SplashScreenView />;
  return (
    <>
      {children}
      <OfflineBanner />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_600SemiBold_Italic,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <Provider store={store}>
          <PersistGate loading={<SplashScreenView />} persistor={persistor}>
            <Bootstrap>
              <ThemeProvider value={navTheme}>
                <Stack screenOptions={{ headerShown: false }} />
              </ThemeProvider>
            </Bootstrap>
          </PersistGate>
        </Provider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
