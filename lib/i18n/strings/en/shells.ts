// path: lib/i18n/strings/en/shells.ts
/**
 * Copy for the layout shells and for the specimen page that renders them.
 *
 * Two kinds of string live here. The framing strings - the platform band and
 * the three approval notices - are product copy: they are read by real users
 * of the workspace and of platform administration, and they are referenced by
 * catalogue key from components/layout/role-framing.ts rather than written
 * into a component, so the type check proves the key exists. The specimen
 * strings are read only on the development-only specimen page.
 *
 * The page is a development surface: it lives under the development-only
 * route group and answers 404 outside development, so a customer never reads
 * these strings. They are in the catalogue anyway, because the rule that no
 * component holds literal display text has no exception for internal pages,
 * and because the specimen has to prove that a real page's words work inside
 * the shell rather than prove that filler text fits.
 *
 * Later steps append keys through the append protocol: add, never rename.
 */
export const shells = {
  label_title: 'Layout specimen',
  label_description:
    'Every route-group shell rendered with a document inside it, so the skip link, the focus order and the print rules can be inspected in a browser.',

  label_section_public: 'Public shell',
  label_section_auth: 'Auth shell',

  label_document_title: 'Invoice INV-1042',
  label_document_meta: 'Issued 12 March 2026 to Northwind Traders. Payment due 26 March 2026.',
  label_document_body:
    'Specimen content. This paragraph exists to give the shell something to lay out, to skip over and to print: the shell itself carries no product copy.',
  label_document_link: 'Read the sample terms',
  label_document_action: 'Send invoice',
  label_document_total: 'Total due',
  label_column_description: 'Description',
  label_column_amount: 'Amount',
  label_row_services: 'Consulting services, March',
  label_row_support: 'Support plan, annual',
  label_status_paid: 'Paid',
  label_print_header: 'KD SOLUTION IT, printed document, invoice INV-1042',
  label_print_footer: 'Printed from the layout specimen page.',

  label_specimen_note:
    'The chrome block above the content is marked to disappear in print; the header line below the title is marked to appear only in print.',
  label_chrome_placeholder: 'Navigation and controls live here',

  label_brand_home: 'KD SOLUTION IT home',
  label_nav_drawer_title: 'Navigation',
  label_nav_drawer_description: 'Every module you can reach from this workspace.',
  label_nav_bottom: 'Primary navigation',
  label_nav_sections: 'Modules',
  label_breadcrumb_home: 'Home',
  label_footer_links_heading: 'Product',
  /**
   * Appended in 1.29: what the header and the footer call the list of
   * every live public page. The 1.23 value above says "Product" and is
   * kept as the default the component ships with, because a surface that
   * renders the product links alone still wants it; the public surfaces
   * now carry the whole site, so they pass this one instead.
   */
  label_site_pages_heading: 'Site pages',
  label_nav_site: 'Site navigation',
  label_footer_note: 'Invoicing, payments and client management, in USD.',
  label_footer_legal: 'Copyright {year} KD SOLUTION IT. All rights reserved.',
  label_action_bar_heading: 'Form actions',
  label_section_navigation: 'Navigation surfaces',
  label_nav_specimen_note:
    'The rail, the drawer trigger, the bottom bar, the trail, the footer and the form action bar, described once and rendered by every surface that needs them. The entries come from the navigation map, through the same filter a real shell calls, so what this section shows is what the map publishes rather than what this page wrote down.',
  label_nav_specimen_top_bar: 'Top bar, drawer trigger and breadcrumb trail',
  label_nav_specimen_rail: 'Sidebar navigation rail',
  label_nav_specimen_bottom: 'Bottom navigation bar',
  label_nav_specimen_footer: 'Site footer',
  label_nav_specimen_action_bar: 'Sticky action bar',
  label_nav_specimen_offline: 'Offline banner',
  label_section_nav_map: 'Navigation map',
  label_section_command: 'Command surface',
  label_command_note:
    "The palette is the map's third reader. Its page rows come from the same role-filtered navigation the rail renders, so a reader who is offered no module in the rail is offered none here either, and its action rows come from the command registry.",
  label_command_list_heading:
    'Palette results, rendered without a browser: the list the dialog holds, in server markup',
  label_command_trigger_heading: 'Palette trigger, with the chord it advertises',
  label_command_set_development: 'Rows for the development audience, this page included',
  label_command_set_development_note:
    'Two specimen pages and the two global commands. The shortcuts page is public, and this audience does not serve it, so no search term finds it here.',
  label_command_set_public: 'Rows for the public audience, with no session',
  label_command_set_public_note:
    'One page and the same two commands. The reader is offered exactly what the map offers that reader, and the page they are on is marked as current by the same resolution the rail uses.',
  label_nav_map_note:
    'The map holds every destination the product will offer and the two routes this build serves. A planned entry has no destination at all, which is why the modules of the workspace, the platform console, the client portal and the public site appear in this table and nowhere in a menu.',
  label_nav_map_published: 'Published destinations',
  label_nav_map_readers_heading: 'What each reader is offered',
  label_nav_map_blocks_heading: 'What the map declares',
  label_nav_map_column_audience: 'Audience',
  label_nav_map_column_role: 'Role',
  label_nav_map_column_modules: 'Modules offered',
  label_nav_map_column_planned: 'Planned',
  label_nav_map_column_primary: 'Bottom bar',
  label_nav_map_column_trail: 'Trail for the current path',
  label_nav_map_column_block: 'Block',
  label_nav_map_column_heading: 'Heading',
  label_nav_map_column_live: 'Live entries',
  label_nav_map_column_hierarchy: 'Hierarchy declared',
  label_nav_map_none: 'None',
  label_nav_map_anonymous: 'No session',
  label_nav_map_planned_note:
    'A planned entry is dropped by every surface: it is not rendered as a link, a heading or a disabled control, because a destination that does not exist is not a destination. The menu shows what the build can serve.',
  label_nav_specimen_trails_heading: 'Breadcrumb trails generated from the map',
  label_nav_specimen_trail_registered: 'Breadcrumb for a registered path',
  label_nav_specimen_trail_nested: 'Breadcrumb for a path below a registered entry',
  label_nav_specimen_trail_unknown: 'Breadcrumb for a path the map does not know',
  label_nav_specimen_planned_drop: 'A rail for a reader the map has nothing live for',
  label_nav_specimen_offline_note:
    'The banner renders nothing while the browser reports a connection, so the honest specimen is its absence. The probe asserts that this page holds no offline banner while online.',
  label_nav_specimen_drawer_header: 'Northwind Traders',
  label_nav_specimen_overview: 'Overview',
  label_nav_specimen_layouts: 'Layout shells',
  label_nav_specimen_gallery: 'Component gallery',
  label_nav_specimen_payouts: 'Payouts',
  label_offline_title: 'No connection',
  label_offline_detail:
    'You are offline. The page stays readable, and changes cannot be saved until the connection returns.',
  label_sticky_summary: 'Total due',

  label_section_dashboard: 'Dashboard shell',
  label_section_admin: 'Admin shell',
  label_section_client_portal: 'Client portal shell',
  label_section_unresolved: 'Unresolved reader',

  label_nav_workspace: 'Workspace navigation',
  label_nav_platform: 'Platform navigation',
  label_platform_banner: 'Platform administration',
  label_platform_banner_message:
    'Every change on this surface affects a tenant and is recorded in the audit log.',
  label_notice_ceo_approval:
    'Actions at this level are submitted to the super admin for approval before they take effect.',
  label_notice_admin_staff_approval:
    'Actions at this level are approved by the platform CEO or the super admin before they take effect.',
  label_notice_staff_approval:
    'Your drafts are sent to the owner for approval before anything reaches a client.',
} as const;
