import { ReactNode, useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
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
import { store } from '../src/store';
import { useAppSelector } from '../src/store/hooks';
import { useAuthBootstrap } from '../src/hooks/useAuthBootstrap';
import { SplashScreenView } from '../src/components/ui/SplashScreenView';

SplashScreen.preventAutoHideAsync();

function Bootstrap({ children }: { children: ReactNode }) {
  useAuthBootstrap();
  const hydrated = useAppSelector((s) => s.auth.hydrated);

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync();
    }
  }, [hydrated]);

  if (!hydrated) return <SplashScreenView />;
  return <>{children}</>;
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
        <Bootstrap>
          <Stack screenOptions={{ headerShown: false }} />
        </Bootstrap>
      </Provider>
    </SafeAreaProvider>
  );
}
