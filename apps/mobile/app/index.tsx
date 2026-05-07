import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/store/hooks';

export default function Index() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  if (!token) return <Redirect href="/welcome" />;
  if (!user?.emailVerifiedAt) {
    return <Redirect href={{ pathname: '/check-email', params: { email: user?.email ?? '' } }} />;
  }
  return <Redirect href="/home" />;
}
