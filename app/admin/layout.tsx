import { redirect } from 'next/navigation';
import { getSessionUser, STAFF_ROLES } from '@/src/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || !STAFF_ROLES.includes(user.role)) {
    redirect('/');
  }
  return <>{children}</>;
}