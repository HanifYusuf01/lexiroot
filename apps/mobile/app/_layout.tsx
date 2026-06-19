import { ReactNode, useEffect } from 'react';
import { Stack } from 'expo-router';
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
import { startConnectivityMonitor } from '../src/services/connectivity';
import { flushOutbox } from '../src/store/outboxFlush';
import { SplashScreenView } from '../src/components/ui/SplashScreenView';
import { OfflineBanner } from '../src/components/ui/OfflineBanner';

SplashScreen.preventAutoHideAsync();

function Bootstrap({ children }: { children: ReactNode }) {
  useAuthBootstrap();
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
      <Provider store={store}>
        <PersistGate loading={<SplashScreenView />} persistor={persistor}>
          <Bootstrap>
            <Stack screenOptions={{ headerShown: false }} />
          </Bootstrap>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}
