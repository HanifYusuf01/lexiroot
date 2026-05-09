import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/store/hooks';

export default function Index() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  if (!token) {
    if (pendingEmail) {
      return <Redirect href={{ pathname: '/check-email', params: { email: pendingEmail } }} />;
    }
    return <Redirect href="/welcome" />;
  }
  if (!user?.emailVerifiedAt) {
    return <Redirect href="/welcome" />;
  }
  return <Redirect href="/home" />;
}
