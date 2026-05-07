import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/admin/sidebar';
import { AdminTopBar } from '@/components/admin/top-bar';
import { MobileNav } from '@/components/admin/mobile-nav';
import { prisma } from '@/lib/db';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const plan = session.user?.plan || 'FREE';
  const userId = session.user.id;

  const [business, sidebarMenus] = await Promise.all([
    prisma.business.findUnique({
      where: { userId },
      select: {
        businessName: true,
        streetAddress: true,
        city: true,
      },
    }),
    prisma.menu.findMany({
      where: {
        userId,
        status: { in: ['DRAFT', 'PUBLISHED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    }),
  ]);

  const businessLocation = [business?.city, business?.streetAddress].filter(Boolean).join(' · ');

  return (
    <div data-testid="admin-shell" className="flex h-screen bg-bg">
      <div className="hidden h-full shrink-0 md:flex">
        <Sidebar
          userName={session.user?.name}
          userEmail={session.user?.email}
          userPlan={plan}
          businessName={business?.businessName ?? session.user?.name ?? null}
          businessLocation={businessLocation || null}
          menus={sidebarMenus.map((menu) => ({
            id: menu.id,
            name: menu.name,
            slug: menu.slug,
            status: menu.status as 'DRAFT' | 'PUBLISHED',
          }))}
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
