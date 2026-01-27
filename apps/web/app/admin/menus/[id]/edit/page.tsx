'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MenuForm } from '@/components/admin/menu-form';
import { useMenu, useUpdateMenu } from '@/hooks/use-menus';
import type { CreateMenuInput } from '@/lib/validations/menu';

interface EditMenuPageProps {
  params: Promise<{ id: string }>;
}

export default function EditMenuPage({ params }: EditMenuPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: menu, isLoading, error } = useMenu(id);
  const updateMenu = useUpdateMenu(id);

  const handleSubmit = async (data: CreateMenuInput) => {
    await updateMenu.mutateAsync(data);
    router.push(`/admin/menus/${id}`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/menus">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Menu</h1>
          </div>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            {error?.message || 'Menu not found'}
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/admin/menus">Back to Menus</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/menus/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Menu</h1>
          <p className="text-muted-foreground">
            Update the details for &quot;{menu.name}&quot;
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Details</CardTitle>
          <CardDescription>
            Update your menu information. Changes will be reflected on the
            public menu immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MenuForm
            menu={menu}
            onSubmit={handleSubmit}
            isLoading={updateMenu.isPending}
          />
          {updateMenu.error && (
            <p className="mt-4 text-sm text-destructive">
              {updateMenu.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
