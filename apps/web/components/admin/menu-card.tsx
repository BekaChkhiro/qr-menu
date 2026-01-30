'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  QrCode,
  FolderOpen,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Menu } from '@/types/menu';

interface MenuCardProps {
  menu: Menu;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
  onTogglePublish: (menu: Menu) => void;
}

export function MenuCard({
  menu,
  onEdit,
  onDelete,
  onTogglePublish,
}: MenuCardProps) {
  const t = useTranslations('admin.menus.card');
  const tActions = useTranslations('actions');
  const tStatus = useTranslations('status');
  const tCategories = useTranslations('admin.categories');
  const tDashboard = useTranslations('admin.dashboard.stats');
  const tA11y = useTranslations('common.accessibility');

  const isPublished = menu.status === 'PUBLISHED';
  const publicUrl = `/m/${menu.slug}`;

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md" role="article" aria-label={menu.name}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold leading-none" id={`menu-title-${menu.id}`}>
              {menu.name}
            </CardTitle>
            <CardDescription className="text-sm">
              /{menu.slug}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100 focus-ring"
                aria-label={tA11y('menuActions')}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(menu)}>
                <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                {tActions('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/menus/${menu.id}`}>
                  <FolderOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('manageContent')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePublish(menu)}>
                {isPublished ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
                    {tActions('unpublish')}
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                    {tActions('publish')}
                  </>
                )}
              </DropdownMenuItem>
              {isPublished && (
                <DropdownMenuItem asChild>
                  <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t('viewMenu')}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(menu)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                {tActions('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Badge variant={isPublished ? 'success' : 'secondary'} className="mt-2 w-fit">
          {isPublished ? tStatus('published') : tStatus('draft')}
        </Badge>
      </CardHeader>
      <CardContent>
        {menu.description && (
          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
            {menu.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            <span>{menu._count.categories} {tCategories('title').toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            <span>{menu._count.views} {tDashboard('totalViews').toLowerCase()}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 focus-ring"
            asChild
          >
            <Link href={`/admin/menus/${menu.id}`}>
              <FolderOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('manage')}
            </Link>
          </Button>
          {isPublished && (
            <Button variant="outline" size="icon" className="h-9 w-9 focus-ring" asChild>
              <Link href={`/api/qr/${menu.id}`} target="_blank" rel="noopener noreferrer" aria-label={`${t('downloadQR')} - ${menu.name}`}>
                <QrCode className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
