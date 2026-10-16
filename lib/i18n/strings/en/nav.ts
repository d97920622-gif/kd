// path: lib/i18n/strings/en/nav.ts
/**
 * Copy for the navigation map: the headings the rail groups its entries under,
 * and the name of every module the product will offer.
 *
 * Why this is a namespace of its own. The module names are not chrome and they
 * are not any one surface's copy: the same word appears in the rail, in the
 * bottom bar, in the command palette (sub-step 1.23), in the breadcrumb trail
 * and - when a page exists - in the page's own title and metadata. A key that
 * several surfaces read is a key that belongs to the navigation, not to the
 * surface that happened to render it first.
 *
 * A module is named here before its page exists, because the map registers it
 * as planned: naming a thing is not shipping it, and the alternative - adding
 * the word at the moment the page lands - is how two surfaces end up calling
 * the same screen by two names.
 *
 * The appendix `_module_` is deliberate. It separates the name of a module
 * ("Invoices") from the label of a section the module is grouped under
 * ("Workspace"), which are the same kind of string to a reader and a different
 * kind of thing to the product: one is a destination, the other is a heading.
 *
 * Append protocol: add, never rename or remove. A copy change is a new key.
 */
export const nav = {
  label_section_product: 'Product',
  label_section_company: 'Company',
  label_section_legal: 'Legal',
  label_section_workspace: 'Workspace',
  label_section_account: 'Account',
  label_section_platform: 'Platform',
  label_section_client_account: 'Your account',
  label_section_specimen: 'Specimen surfaces',

  label_module_dashboard: 'Dashboard',
  label_module_clients: 'Clients',
  label_module_invoices: 'Invoices',
  label_module_estimates: 'Estimates',
  label_module_recurring_invoices: 'Recurring invoices',
  label_module_payments: 'Payments',
  label_module_payouts: 'Payouts',
  label_module_products: 'Products',
  label_module_inventory: 'Inventory',
  label_module_expenses: 'Expenses',
  label_module_reports: 'Reports',
  label_module_payroll: 'Payroll',
  label_module_team: 'Team',
  label_module_security: 'Security',
  label_module_settings: 'Settings',

  label_module_tenants: 'Tenants',
  label_module_platform_billing: 'Platform billing',
  label_module_plans: 'Plans',
  label_module_approvals: 'Approvals',
  label_module_audit_log: 'Audit log',
  label_module_feature_flags: 'Feature flags',
  label_module_platform_team: 'Platform team',
  label_module_platform_settings: 'Platform settings',

  label_module_client_invoices: 'Invoices',
  label_module_client_payments: 'Payments',
  label_module_client_documents: 'Documents',
  label_module_client_support: 'Support',

  label_public_features: 'Features',
  label_public_pricing: 'Pricing',
  label_public_industries: 'Industries',
  label_public_calculators: 'Calculators',
  label_public_invoice_generator: 'Free invoice generator',
  label_public_about: 'About',
  label_public_contact: 'Contact',
  label_public_blog: 'Blog',
  label_public_terms: 'Terms',
  label_public_privacy: 'Privacy',
} as const;
