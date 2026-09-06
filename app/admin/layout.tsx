import { redirect } from 'next/navigation';
import { getSessionUser } from '@/src/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }
  return <>{children}</>;
}