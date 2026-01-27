import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/admin/sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        userName={session.user?.name}
        userPlan={session.user?.plan || 'FREE'}
      />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
