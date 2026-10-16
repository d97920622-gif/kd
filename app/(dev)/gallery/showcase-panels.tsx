// path: app/(dev)/gallery/showcase-panels.tsx
'use client';

import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { t } from '@/lib/i18n';

/**
 * The overlay and panel primitives from sub-step 1.16: dialog, side panel,
 * popover, menu, tabs and tooltip.
 *
 * Every overlay is reachable from the keyboard: a trigger opens it, focus
 * moves inside, Escape closes it and focus returns to the trigger. That
 * behaviour lives in the primitives; the gallery only gives each one a
 * trigger with an accessible name and real copy, so a reviewer can open every
 * panel in every theme and see the layering, the corner radius and the
 * contrast of a panel against the surface behind it.
 */
export function ShowcasePanels(): React.ReactElement {
  return (
    <section aria-labelledby="gallery-panels-heading" className="grid gap-4">
      <h3 id="gallery-panels-heading" className="text-xl font-semibold">
        {t('gallery.label_section_panels')}
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger asChild={true}>
            <Button variant="outline">{t('gallery.label_demo_open_dialog')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('gallery.label_demo_dialog_title')}</DialogTitle>
              <DialogDescription>{t('gallery.label_demo_dialog_message')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild={true}>
                <Button variant="secondary">{t('common.action_cancel')}</Button>
              </DialogClose>
              <Button variant="destructive">{t('common.action_delete')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild={true}>
            <Button variant="outline">{t('gallery.label_demo_open_sheet')}</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{t('gallery.label_demo_sheet_title')}</SheetTitle>
              <SheetDescription>{t('gallery.label_demo_sheet_message')}</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose asChild={true}>
                <Button variant="secondary">{t('common.action_close')}</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Popover>
          <PopoverTrigger asChild={true}>
            <Button variant="outline">{t('gallery.label_demo_open_popover')}</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="grid gap-2">
              <p className="text-sm font-semibold">{t('gallery.label_demo_popover_title')}</p>
              <p className="text-sm text-muted-foreground">
                {t('gallery.label_demo_popover_message')}
              </p>
              <PopoverClose asChild={true}>
                <Button variant="ghost" size="sm">
                  {t('common.action_close')}
                </Button>
              </PopoverClose>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild={true}>
            <Button variant="outline">{t('gallery.label_demo_open_menu')}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>{t('gallery.label_demo_company')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('gallery.label_demo_menu_edit')}</DropdownMenuItem>
            <DropdownMenuItem>{t('gallery.label_demo_menu_duplicate')}</DropdownMenuItem>
            <DropdownMenuItem destructive={true}>{t('gallery.label_demo_delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild={true}>
            <Button variant="ghost" size="icon" aria-label={t('gallery.label_demo_tooltip')}>
              <Info aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('gallery.label_demo_tooltip')}</TooltipContent>
        </Tooltip>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('gallery.label_demo_tab_overview')}</TabsTrigger>
          <TabsTrigger value="lines">{t('gallery.label_demo_tab_lines')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-2 text-sm text-muted-foreground">
          {t('gallery.label_demo_tab_overview_body')}
        </TabsContent>
        <TabsContent value="lines" className="pt-2 text-sm text-muted-foreground">
          {t('gallery.label_demo_tab_lines_body')}
        </TabsContent>
      </Tabs>
    </section>
  );
}
