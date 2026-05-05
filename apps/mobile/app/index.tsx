import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/store/hooks';

export default function Index() {
  const token = useAppSelector((s) => s.auth.token);
  if (!token) return <Redirect href="/welcome" />;
  return <Redirect href="/home" />;
}
