import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/admin/sidebar';
import { AdminTopBar } from '@/components/admin/top-bar';
import { MobileNav } from '@/components/admin/mobile-nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const plan = session.user?.plan || 'FREE';

  return (
    <div data-testid="admin-shell" className="flex h-screen bg-bg">
      <div className="hidden h-full shrink-0 md:flex">
        <Sidebar
          userName={session.user?.name}
          userEmail={session.user?.email}
          userPlan={plan}
        />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopBar
          userName={session.user?.name}
          userEmail={session.user?.email}
          userPlan={plan}
          hasUnreadNotifications={false}
        />
        <main
          id="main-content"
          data-testid="admin-main"
          tabIndex={-1}
          className="flex-1 overflow-auto bg-bg p-6 pb-24 md:pb-6"
        >
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
