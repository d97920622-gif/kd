// path: scripts/checks/public-site.mjs
/**
 * check:public-site -- the public pages of sub-steps 1.28 and 1.29, and the
 * claims they are allowed to make.
 *
 * A marketing page is the one place in a product where a sentence can describe
 * something that does not exist and nothing fails. That is the defect this
 * check exists for, and it is why the rules are about vocabulary as much as
 * about markup:
 *
 *   1. **Every page is a server component with its copy in the catalogue.**
 *      No `'use client'` on a marketing page, and metadata resolved through
 *      `t()` like every other string. A page that hard-codes its title in a
 *      `metadata` export is a page whose title is invisible to the i18n check.
 *   2. **The headings are a structure, not a decoration.** Exactly one `h1`,
 *      at least one `h2`, and no level skipped on the way down. A page that
 *      jumps from `h1` to `h3` breaks the outline a screen reader navigates by.
 *   3. **No claim this build cannot evidence.** No customer, no logo wall, no
 *      testimonial, no certification, no uptime figure, no comparison the
 *      business has not run. This is a Zero Tolerance rule expressed as a word
 *      list, and `FEATURE_LIST` items 210 to 216 - the sections that would
 *      carry those claims - are the reason the list has to exist: the sections
 *      are planned, and a planned section is not a licence to invent one.
 *   4. **No fabricated company facts.** A founding year, a headcount, an
 *      address and a phone number are facts the owner supplies and the contact
 *      page carries (`FEATURE_LIST` item 225). An invented one is a false
 *      statement with the same typography as a true one.
 *   5. **A price is data with one owner.** Prices live in the pricing namespace
 *      as digit strings, both the monthly and the annual figure, and no page
 *      writes a currency amount of its own.
 *   6. **No dead copy.** Every key in the namespaces is rendered somewhere
 *      in the application, so a paragraph cannot be deleted from a page and
 *      left in the catalogue for a reader to find later by accident.
 *   7. **A page that describes a tool says what the tool does not do.**
 *      Sub-step 1.29 added the pages that are not about the product's shape but
 *      about a job: the calculators, the free invoice generator, the industry
 *      pages, contact, the blog and the two legal outlines. Two of them - the
 *      generator and the blog - are shells, and the rule that keeps a shell
 *      honest is that the sentence saying so is part of the page. The list
 *      below names that sentence per page, and the near-miss it prevents is a
 *      page a reader finishes believing the tool exists.
 *   8. **The state surfaces render the state family's copy.** The 404, the
 *      route error page and the offline page are the three pages a reader
 *      reaches without choosing to, and each one is checked for the thing that
 *      makes it useful: the search bar and a way home on the 404, a reference
 *      and both actions on the error page, and a banner that knows the answer
 *      on the offline page.
 *
 * The rendered half of this sub-step is measured by
 * docs/EVIDENCE/step-01/public-pages-probe.py against a running server, and the
 * rules here are the ones that can be read from the source without one.
 */
import {
  listTrackedFiles,
  positionOf,
  readTextFile,
  reportResult,
  stripCommentsAndStrings,
} from './_lib.mjs';

const CHECK = 'public-site';

const NAMESPACES = [
  'home',
  'features',
  'pricing',
  'about',
  'industries',
  'calculators',
  'generator',
  'contact',
  'blog',
  'offline',
  'legal',
];

/**
 * The pages, in the order the site reads them.
 *
 * `requires` needles are read from the raw source and only the reason is
 * written here: a page that lost the sentence has lost the reason it may exist
 * in this step, and a needle that pointed at a key would pass just as happily
 * on a page whose section had been deleted from around it. `absent` needles are
 * the shape a shell must not grow: the generator collects nothing today, so a
 * form control on it would collect a reader's data and drop it. The rendered
 * half of every one of these pages is measured by
 * docs/EVIDENCE/step-01/public-pages-probe.py against a running server.
 */
const PAGES = [
  { file: 'app/(public)/page.tsx', namespace: 'home', label: 'the homepage' },
  { file: 'app/(public)/features/page.tsx', namespace: 'features', label: 'the features page' },
  { file: 'app/(public)/pricing/page.tsx', namespace: 'pricing', label: 'the pricing page' },
  { file: 'app/(public)/about/page.tsx', namespace: 'about', label: 'the about page' },
  {
    file: 'app/(public)/industries/page.tsx',
    namespace: 'industries',
    label: 'the industries page',
    counts: [
      {
        needle: "situationKey: 'industries.",
        count: 6,
        message:
          'FEATURE_LIST item 218 names the industries the page covers and each card is written as situation, work and rule: a card missing its situation is a card the page cannot finish',
      },
    ],
  },
  {
    file: 'app/(public)/calculators/page.tsx',
    namespace: 'calculators',
    label: 'the calculators page',
    requires: [
      [
        'CALCULATOR_TOOLS.map(',
        'the three tools of FEATURE_LIST item 255 are declared once, in lib/calculators/free-tools.ts, and the page renders that list rather than a hand-written card per tool',
      ],
      [
        '<FreeCalculator',
        'a calculator page without the calculator component is a page that describes a tool it does not carry',
      ],
    ],
  },
  {
    file: 'app/(public)/invoice-generator/page.tsx',
    namespace: 'generator',
    label: 'the free invoice generator page',
    requires: [
      [
        'generator.label_note_status',
        'the generator is a shell in this step (FEATURE_LIST item 254): the page must carry the sentence that says the tool is not here yet, or it reads as a working tool that produces nothing',
      ],
    ],
    absent: [
      [
        '<input',
        'the generator collects nothing yet, so it must render no input: a field a reader fills in and loses is worse than no field',
      ],
      [
        '<form',
        'a form on this page would have no destination: the tool arrives with the invoicing module, which owns how a document is numbered',
      ],
      ['<textarea', 'the generator collects nothing yet, so it must render no textarea'],
      ['<select', 'the generator collects nothing yet, so it must render no select'],
    ],
  },
  {
    file: 'app/(public)/contact/page.tsx',
    namespace: 'contact',
    label: 'the contact page',
    requires: [
      [
        'contact.label_note_address',
        'the address, the phone number and the response window are configuration (FEATURE_LIST item 225): the page must carry the sentence that says so, because the rest of the page is written for a deployment that has them',
      ],
    ],
  },
  {
    file: 'app/(public)/blog/page.tsx',
    namespace: 'blog',
    label: 'the blog shell',
    requires: [
      [
        'data-blog-empty',
        'the blog has no posts in this step, and an empty page reads as a broken one: the shell must render its own sentence and carry the marker the probe reads it by',
      ],
    ],
  },
  {
    file: 'app/(public)/terms/page.tsx',
    namespace: 'legal',
    marker: 'terms',
    label: 'the terms page',
    requires: [
      [
        'legal.terms_label_note_publish',
        'the binding terms are supplied by the business that runs the deployment (FEATURE_LIST item 229): the page must say which part is the outline and which part is the agreement',
      ],
    ],
  },
  {
    file: 'app/(public)/privacy/page.tsx',
    namespace: 'legal',
    marker: 'privacy',
    label: 'the privacy page',
    requires: [
      [
        'legal.privacy_label_note_scope',
        'the binding privacy policy is supplied by the business that runs the deployment (FEATURE_LIST item 230), and the outline must not be mistaken for it',
      ],
    ],
  },
  {
    file: 'app/(public)/offline/page.tsx',
    namespace: 'offline',
    label: 'the offline page',
    requires: [
      [
        '<OfflineBanner',
        'the offline page is the one page a reader reaches while the connection is already gone: the banner is the only element that knows the state, and a page about the connection renders it',
      ],
      [
        'offline.label_note_scope',
        'the page must state that it is a page rather than a cached copy of the product: caching arrives with the service worker in a later step (FEATURE_LIST item 3378)',
      ],
    ],
  },
];

/** The plan slugs the pricing page must publish (FEATURE_LIST item 698). */
const PLAN_SLUGS = ['free', 'starter', 'pro', 'enterprise'];

/**
 * Words that turn a sentence into a claim. Each is here because the platform
 * has nothing behind it yet: no customer to name, no audit to point at, no
 * measurement to quote. The list is deliberately blunt - a page that has to
 * reach for one of these words has not finished explaining the product.
 */
const CLAIM_PATTERNS = [
  [/trusted by/i, 'a customer claim'],
  [/our customers/i, 'a customer claim'],
  [/testimonial/i, 'a testimonial'],
  [/logo wall/i, 'a logo wall'],
  [/industry[- ]leading/i, 'a superlative'],
  [/world[- ]class/i, 'a superlative'],
  [/best[- ]in[- ]class/i, 'a superlative'],
  [/\bnumber one\b/i, 'a superlative'],
  [/\bguarantee/i, 'a guarantee'],
  [/\b(?:99|100)(?:\.\d+)?% uptime\b/i, 'an uptime figure'],
  [/\buptime\b/i, 'an uptime figure'],
  [/\baward[- ]winning\b/i, 'an award'],
  [/\bcertified\b/i, 'a certification'],
  [/\bsoc 2\b/i, 'a certification'],
  [/\biso 27001\b/i, 'a certification'],
  [/\bpci\b/i, 'a certification'],
  [/\bhipaa\b/i, 'a certification'],
  [/\bgdpr[- ]compliant\b/i, 'a compliance claim'],
  [/\b(?:millions|thousands) of (?:businesses|users|customers)\b/i, 'a scale claim'],
  [/available now/i, 'an availability claim'],
  [/\bworks offline\b/i, 'an offline claim'],
  [/\bavailable offline\b/i, 'an offline claim'],
  [/\bin beta\b/i, 'an availability claim'],
  [/launch date/i, 'an availability claim'],
  [/ships in/i, 'an availability claim'],
  [/compared (?:with|to) [A-Z]/, 'a competitor comparison'],
];

/** Words that would put an invented company fact on the page. */
const FACT_PATTERNS = [
  [/\bfounded\b/i, 'a founding year is a fact the owner supplies, not this repository'],
  [/\bheadquarter/i, 'an address is a fact the owner supplies, not this repository'],
  [/\bemployees\b/i, 'a headcount is a fact the owner supplies, not this repository'],
  [/\bour (?:team|staff|offices)\b/i, 'a team description is a fact the owner supplies'],
  [/\b(?:19|20)\d{2}\b/, 'a four digit year is a company fact, and none belongs in this copy'],
  [
    /\b\d+\s+(?:street|st|road|rd|avenue|ave|lane|ln)\b/i,
    'a street address belongs to the contact page',
  ],
  [/\+?\d[\d ()-]{7,}\d/, 'a phone number belongs to the contact page'],
];

const findings = [];

function finding(file, message, source = null, index = 0) {
  const { line, column } = source === null ? { line: 1, column: 1 } : positionOf(source, index);
  findings.push({ file, line, column, message });
}

function requireFile(file, message) {
  const text = readTextFile(file);
  if (text === null) {
    finding(file, message);
    return null;
  }
  return text;
}

/**
 * The catalogue keys one metadata field is written with, in source order.
 *
 * The field is read out of the metadata block rather than out of the whole
 * file: `title: t('home.meta_title')` appears twice in a page - once for the
 * page and once for its open graph preview - so a rule that accepted any
 * `title: t(` anywhere was satisfied by the preview while the page's own title
 * had become a literal.
 */
function metadataKeys(metadata, field) {
  const pattern = new RegExp(`${field}:\\s*t\\('([^']+)'\\)`, 'g');
  return [...metadata.matchAll(pattern)].map((match) => match[1]);
}

/** The two fields a page describes itself with, and what a reader loses. */
const METADATA_FIELDS = [
  {
    field: 'title',
    min: 20,
    max: 70,
    what: 'a search result shows between 20 and 70 characters, and a truncated title is a title nobody finished',
  },
  {
    field: 'description',
    min: 50,
    max: 160,
    what: 'a description between 50 and 160 characters is the one that is neither a fragment nor truncated',
  },
];

/** Every top level key of one namespace file, with its first string value. */
function namespaceEntries(namespace) {
  const file = `lib/i18n/strings/en/${namespace}.ts`;
  const text = readTextFile(file);
  if (text === null) {
    return null;
  }
  const entries = new Map();
  const pattern = /^ {2}([a-z][a-z0-9_]*):/gm;
  for (const match of text.matchAll(pattern)) {
    const rest = text.slice(match.index + match[0].length);
    const value = /^\s*'([^'\n]*)'/.exec(rest);
    entries.set(match[1], value === null ? null : value[1]);
  }
  return { file, text, entries };
}

// ---------------------------------------------------------------------------
// 1. The pages: server components, catalogue metadata, one h1, no skip
// ---------------------------------------------------------------------------

const titles = new Map();

for (const page of PAGES) {
  const text = requireFile(page.file, `${page.label} is missing`);
  if (text === null) {
    continue;
  }
  const code = stripCommentsAndStrings(text);

  // This rule and the marker rule below read the raw source, not `code`: the
  // stripper blanks string literals, so `'use client';` and
  // `data-public-page="home"` are gone from the stripped copy and a rule that
  // read it could never fire on the defect it was written for.
  if (/'use client'/.test(text)) {
    finding(
      page.file,
      'a public page must stay a server component: it has no state to keep, and a client boundary here ships the whole marketing page to the browser',
    );
  }

  // What the page must carry and what it must not, read from the raw source:
  // the needles are catalogue keys and markers, both of which live inside
  // string literals and would be blanked by the stripper above.
  for (const [needle, why] of page.requires ?? []) {
    if (!text.includes(needle)) {
      finding(page.file, `${page.label}: ${why}`);
    }
  }
  for (const [needle, why] of page.absent ?? []) {
    if (text.includes(needle)) {
      finding(page.file, `${page.label}: ${why}`, text, Math.max(0, text.indexOf(needle)));
    }
  }
  for (const marker of page.counts ?? []) {
    const seen = text.split(marker.needle).length - 1;
    if (seen !== marker.count) {
      finding(
        page.file,
        `${page.label} declares ${String(seen)} ${marker.needle} markers, not ${String(marker.count)}: ${marker.message}`,
        text,
        Math.max(0, text.indexOf(marker.needle)),
      );
    }
  }

  // Since sub-step 1.30 the metadata is composed by `publicPageMetadata(...)`,
  // so the block is either that call or the object it replaced. The fields that
  // differ per page - the two catalogue keys and the path - stay written in the
  // page file, which is what the rules after this one verify.
  const metadataBlock =
    /export const metadata: Metadata = (?:publicPageMetadata\()?\{[\s\S]*?\n\}(?:\))?;/.exec(text);
  if (metadataBlock === null) {
    finding(page.file, `${page.label} must export a typed metadata object`);
  }
  const metadata = metadataBlock === null ? '' : metadataBlock[0];
  if (!/publicPageMetadata\(/.test(metadata)) {
    finding(
      page.file,
      `${page.label} must compose its metadata through publicPageMetadata: a page that writes its own open graph block replaces the site-wide one rather than adding to it, which is how the first production run of 1.30 shipped a page with an og:title and no image`,
    );
  }

  const headings = [...code.matchAll(/<h([1-6])\b/g)].map((match) => ({
    level: Number(match[1]),
    index: match.index ?? 0,
  }));
  const h1Count = headings.filter((heading) => heading.level === 1).length;
  if (h1Count !== 1) {
    finding(
      page.file,
      `${page.label} declares ${String(h1Count)} h1 headings; a page has exactly one`,
    );
  }
  if (!headings.some((heading) => heading.level === 2)) {
    finding(
      page.file,
      `${page.label} declares no h2: a page of sections has more than one section`,
    );
  }
  for (let index = 1; index < headings.length; index += 1) {
    const previous = headings[index - 1];
    const current = headings[index];
    if (current.level > previous.level + 1) {
      finding(
        page.file,
        `a heading jumps from h${String(previous.level)} to h${String(current.level)}: a reader navigating by heading level is skipped over a section`,
        code,
        current.index,
      );
    }
  }

  const marker = /data-public-page="([a-z-]+)"/.exec(text);
  if (marker === null) {
    finding(
      page.file,
      'the page must carry data-public-page: the rendered probe identifies a page by that marker',
    );
  } else if (marker[1] !== (page.marker ?? page.namespace)) {
    finding(
      page.file,
      `the page marker is ${marker[1]}, not ${page.marker ?? page.namespace}, the name the probe and this check read the page by`,
    );
  }

  // The metadata of these four pages has to be findable, and no two pages may
  // describe themselves with the same words: a duplicate title is what a
  // template leaves behind when it is copied for a fifth page.
  for (const spec of METADATA_FIELDS) {
    // The first occurrence of the field is the page's own, and it is the one
    // that has to come from the catalogue: the open graph copy below it is a
    // second sentence about the same page, and a rule that accepted any
    // catalogue call in the block was satisfied by the preview while the page's
    // own title had become a literal.
    const firstValue = new RegExp(`\\n\\s*${spec.field}:([\\s\\S]{0,60})`).exec(metadata);
    if (firstValue === null || !/^t\('/.test(firstValue[1].trim())) {
      finding(
        page.file,
        `${page.label} must take its ${spec.field} from the catalogue: a literal here is copy the i18n check cannot see`,
      );
      continue;
    }
    const keys = metadataKeys(metadata, spec.field);
    if (new Set(keys).size > 1) {
      finding(
        page.file,
        `${page.label} writes its ${spec.field} from two keys (${keys.join(', ')}): the page and its open graph preview must be one sentence`,
      );
    }
    const key = keys[0];
    if (!key.startsWith(`${page.namespace}.`)) {
      finding(
        page.file,
        `${page.label} takes its ${spec.field} from ${key}, a key of another namespace`,
      );
      continue;
    }
    const namespace = namespaceEntries(page.namespace);
    const value =
      namespace === null ? null : namespace.entries.get(key.slice(page.namespace.length + 1));
    if (namespace === null || value === null || value === undefined) {
      finding(page.file, `${page.label} names the ${spec.field} key ${key}, which has no value`);
      continue;
    }
    if (value.length < spec.min || value.length > spec.max) {
      finding(
        page.file,
        `the ${spec.field} is ${String(value.length)} characters; ${spec.what}`,
        namespace.text,
        Math.max(0, namespace.text.indexOf(`'${value}'`)),
      );
    }
    if (spec.field === 'title') {
      for (const [otherFile, otherTitle] of titles) {
        if (otherTitle === value) {
          finding(page.file, `${page.label} repeats the title of ${otherFile}`);
        }
      }
      titles.set(page.file, value);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. The claims a page may not make
// ---------------------------------------------------------------------------

for (const namespace of NAMESPACES) {
  const parsed = namespaceEntries(namespace);
  if (parsed === null) {
    finding(
      `lib/i18n/strings/en/${namespace}.ts`,
      'the namespace named by this sub-step is missing',
    );
    continue;
  }
  for (const [key, value] of parsed.entries) {
    if (value === null) {
      finding(
        parsed.file,
        `${key} is not a literal string; the catalogue holds copy, not expressions`,
      );
      continue;
    }
    for (const [pattern, what] of CLAIM_PATTERNS) {
      if (pattern.test(value)) {
        finding(
          parsed.file,
          `${key} makes ${what}, and nothing in this build can evidence it: ${pattern.source}`,
          parsed.text,
          Math.max(0, parsed.text.indexOf(key)),
        );
      }
    }
    // Sub-step 1.29 opened the contact page, and the contact page is the one
    // place these may be stated (FEATURE_LIST item 225: the address, the phone
    // number and the response window are configuration the owner supplies). The
    // rule is therefore per namespace rather than per key: everywhere else the
    // fact is still refused outright, and in the contact namespace it is
    // allowed only in a sentence whose key says it is a note - the paragraph
    // that explains the fact is configuration, so a reader cannot mistake a
    // sentence about a deployment for one about this repository.
    for (const [pattern, why] of FACT_PATTERNS) {
      if (!pattern.test(value)) {
        continue;
      }
      if (namespace !== 'contact') {
        finding(
          parsed.file,
          `${key} states a company fact: ${why} (${pattern.source})`,
          parsed.text,
          Math.max(0, parsed.text.indexOf(key)),
        );
        continue;
      }
      if (!key.startsWith('label_note_')) {
        finding(
          parsed.file,
          `${key} states a company fact outside a note: ${why}; the contact namespace may describe a fact only in the paragraph that says the deployment configures it (${pattern.source})`,
          parsed.text,
          Math.max(0, parsed.text.indexOf(key)),
        );
      }
    }
    if (/ {2,}/.test(value) || value !== value.trim()) {
      finding(
        parsed.file,
        `${key} carries a double space or a stray edge: the copy is rendered as written`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Prices: one owner, digit strings, both figures, the four plan slugs
// ---------------------------------------------------------------------------

const pricing = namespaceEntries('pricing');
if (pricing !== null) {
  const published = new Set();
  for (const [key, value] of pricing.entries) {
    const match = /^tier_([a-z]+)_price_(monthly|yearly)$/.exec(key);
    if (match === null) {
      continue;
    }
    if (!/^\d{1,6}$/.test(value ?? '')) {
      finding(
        pricing.file,
        `${key} is "${String(value)}": a price is a digit string, so the billing module can own the number and no page can round it`,
        pricing.text,
        Math.max(0, pricing.text.indexOf(key)),
      );
    }
    published.add(`${match[1]}:${match[2]}`);
  }
  for (const slug of PLAN_SLUGS) {
    if (slug === 'enterprise') {
      continue;
    }
    if (!published.has(`${slug}:monthly`)) {
      finding(pricing.file, `the ${slug} plan publishes no monthly figure`);
    }
    if (!published.has(`${slug}:yearly`)) {
      finding(
        pricing.file,
        `the ${slug} plan publishes no annual figure; a reader comparing plans compares two numbers, not one`,
      );
    }
  }
  for (const key of [
    'tier_free_name',
    'tier_starter_name',
    'tier_pro_name',
    'tier_enterprise_name',
  ]) {
    if (!pricing.entries.has(key)) {
      finding(
        pricing.file,
        `the catalogue has no ${key}; the plan slugs of FEATURE_LIST item 698 have four names`,
      );
    }
  }
}

const pricingPage = readTextFile('app/(public)/pricing/page.tsx');
if (pricingPage !== null) {
  for (const slug of PLAN_SLUGS) {
    if (!pricingPage.includes(`id: '${slug}'`)) {
      finding(
        'app/(public)/pricing/page.tsx',
        `the pricing page publishes no ${slug} plan; the four slugs of the plan model are free, starter, pro and enterprise`,
      );
    }
  }
  // One marker per card branch, because the rendered probe reads a plan's
  // figure by the slug carried in that attribute: a branch that loses its
  // marker renders a card the probe cannot read, and the price would then go
  // unmeasured rather than measured wrong.
  const figureMarkers = pricingPage.match(/data-plan-figure=\{tier\.id\}/g) ?? [];
  if (figureMarkers.length < 2) {
    finding(
      'app/(public)/pricing/page.tsx',
      'a published price and an agreed price are two branches of one card, and each branch must carry the plan slug it belongs to, so the rendered probe can read a figure from the markup',
    );
  }
  const annualMarkers = pricingPage.match(/data-plan-annual-figure=\{tier\.id\}/g) ?? [];
  if (annualMarkers.length !== 1) {
    finding(
      'app/(public)/pricing/page.tsx',
      'the annual figure is rendered once per card, in the branch whose plan publishes a monthly figure',
    );
  }
}

// A price written on any other page is a second owner of a number.
for (const file of listTrackedFiles()) {
  if (!/^app\/\(public\)\//.test(file) || !file.endsWith('.tsx')) {
    continue;
  }
  if (file === 'app/(public)/pricing/page.tsx') {
    continue;
  }
  const text = readTextFile(file);
  if (text === null) {
    continue;
  }
  const match = /\$\s*\d/.exec(stripCommentsAndStrings(text));
  if (match !== null) {
    finding(
      file,
      'a currency amount is written on this page; prices belong to lib/i18n/strings/en/pricing.ts',
      stripCommentsAndStrings(text),
      Math.max(0, match.index),
    );
  }
}

// ---------------------------------------------------------------------------
// 4. No dead copy: every key in the four namespaces is rendered somewhere
// ---------------------------------------------------------------------------

const applicationFiles = listTrackedFiles().filter(
  (file) => /^(app|components|lib)\//.test(file) && file.endsWith('.tsx'),
);
const applicationText = applicationFiles.map((file) => readTextFile(file) ?? '').join('\n');

let checkedKeys = 0;
for (const namespace of NAMESPACES) {
  const parsed = namespaceEntries(namespace);
  if (parsed === null) {
    continue;
  }
  for (const key of parsed.entries.keys()) {
    checkedKeys += 1;
    if (!applicationText.includes(`'${namespace}.${key}'`)) {
      finding(
        parsed.file,
        `${namespace}.${key} is rendered by no page: copy that nothing reads is copy that drifts unnoticed`,
        parsed.text,
        Math.max(0, parsed.text.indexOf(key)),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 5. The footer is how a reader moves, and it reads the map
// ---------------------------------------------------------------------------

const shell = requireFile('components/layout/public-shell.tsx', 'the public shell is missing');
if (shell !== null) {
  if (!/<PublicFooter\b/.test(shell)) {
    finding(
      'components/layout/public-shell.tsx',
      'the public shell must render the public footer, or the public pages are reachable only by typing a URL',
    );
  }
  // The header arrived in sub-step 1.29 with the last eight routes
  // (FEATURE_LIST item 66: a public header whose navigation is managed). It
  // belongs to the shell rather than to a page, for the same reason the footer
  // does: twelve pages rendering their own header is twelve headers to keep in
  // step, and the one that drifts is the one nobody looks at.
  if (!/<PublicHeader\b/.test(shell)) {
    finding(
      'components/layout/public-shell.tsx',
      'the public shell must render the public header (FEATURE_LIST item 66): the only route back up from a deep page would otherwise be the footer',
    );
  }
  // The skip link and the landmark are a pair and the shell is where they meet:
  // the link points at the id the landmark declares, and the layout check reads
  // the pairing from the markup. What this rule adds is the order, which is a
  // reading-order decision rather than a markup one - the header is chrome, so
  // a skip link after it is a skip link that arrives too late.
  const skipIndex = shell.indexOf('<SkipLink');
  const headerIndex = shell.indexOf('<PublicHeader');
  const mainIndex = shell.indexOf('<MainContent');
  if (skipIndex === -1 || headerIndex === -1 || mainIndex === -1) {
    finding(
      'components/layout/public-shell.tsx',
      'the shell renders the skip link, the header and the main landmark; the order between them is what makes the skip link a shortcut',
    );
  } else if (!(skipIndex < headerIndex && headerIndex < mainIndex)) {
    finding(
      'components/layout/public-shell.tsx',
      'the skip link comes first, then the header, then the main landmark: a skip link after the chrome it skips is a tab stop that costs the reader a walk',
    );
  }
  // Read from the raw source: the shell writes destinations through the map,
  // and a rule that read the stripped copy would look for an `href="` that the
  // stripper had already blanked.
  if (/\bhref="/.test(shell)) {
    finding(
      'components/layout/public-shell.tsx',
      'the shell writes a destination of its own; chrome renders what config/nav-map.ts publishes',
    );
  }
}

const header = requireFile(
  'components/navigation/public-header.tsx',
  'the public header bridge is missing: chrome may not import the navigation map',
);
if (header !== null) {
  if (!/useNavigation\('public'/.test(header)) {
    finding(
      'components/navigation/public-header.tsx',
      'the header must ask the map for the public audience, not for a list of its own',
    );
  }
  if (!/homeHref=\{home\?\.href\}/.test(header)) {
    finding(
      'components/navigation/public-header.tsx',
      'the brand link must take its destination from the map entry, not from a literal path',
    );
  }
}

const footer = requireFile(
  'components/navigation/public-footer.tsx',
  'the public footer bridge is missing: chrome may not import the navigation map',
);
if (footer !== null) {
  if (!/useNavigation\('public'/.test(footer)) {
    finding(
      'components/navigation/public-footer.tsx',
      'the footer must ask the map for the public audience',
    );
  }
  if (!/homeHref=\{home\?\.href\}/.test(footer)) {
    finding(
      'components/navigation/public-footer.tsx',
      'the brand link must take its destination from the map entry, not from a literal path',
    );
  }
}

// ---------------------------------------------------------------------------
// 6. The state surfaces: the 404, the route error page, and the offline page
// ---------------------------------------------------------------------------

// The 404 (FEATURE_LIST item 134: a branded not-found page with a search bar).
// It renders in the public shell, so it is branded by construction; what is
// checked here is the rest of the item - the copy the state family already
// owns, and a search that exists rather than a field drawn on the page.
const notFound = requireFile('app/not-found.tsx', 'the branded 404 page is missing');
if (notFound !== null) {
  if (!notFound.includes('data-public-page="not-found"')) {
    finding('app/not-found.tsx', 'the 404 must carry data-public-page="not-found"');
  }
  if (!/<PublicShell\b/.test(notFound)) {
    finding(
      'app/not-found.tsx',
      'the 404 must render inside the public shell: it is the one page a reader arrives at from an old link, and the shell is what gives them a brand and a way back',
    );
  }
  for (const key of [
    'states.label_error_not_found_title',
    'states.label_error_not_found_description',
  ]) {
    if (!notFound.includes(key)) {
      finding(
        'app/not-found.tsx',
        `the 404 must render ${key}: the state family wrote that sentence in sub-step 1.24, and a second not-found sentence here would be a second answer to the same question`,
      );
    }
  }
  if (!/<SiteSearch\b/.test(notFound)) {
    finding(
      'app/not-found.tsx',
      'the 404 must render the site search (FEATURE_LIST item 134): the page that says a page is missing is the page where looking for one belongs',
    );
  }
}

// The route error page (FEATURE_LIST items 132, 133 and 135: the correlation
// id, the one-click report, and the report option on the server error page).
const routeError = requireFile('app/error.tsx', 'the route error page is missing');
if (routeError !== null) {
  if (!/^'use client';/m.test(routeError)) {
    finding(
      'app/error.tsx',
      'a route error boundary is a client module: Next.js hands it a reset callback, and a server component cannot hold one',
    );
  }
  if (!/<ErrorState\b/.test(routeError)) {
    finding(
      'app/error.tsx',
      'the error page must render the error member of the state family, or a failure looks like a different product',
    );
  }
  for (const [needle, why] of [
    [
      'onRetry=',
      'the error page must offer a retry: FEATURE_LIST item 129 asks for one on every page',
    ],
    ['onReport=', 'the error page must offer the one-click report of FEATURE_LIST item 133'],
  ]) {
    if (!routeError.includes(needle)) {
      finding('app/error.tsx', `the error page: ${why}`);
    }
  }
  // Read from the stripped copy: the comment above this rule explains why the
  // message is not printed and what error.digest carries, and a rule that read
  // the raw file would be satisfied by its own explanation.
  const routeErrorCode = stripCommentsAndStrings(routeError);
  if (!/error\.digest\s*\?\?/.test(routeErrorCode)) {
    finding(
      'app/error.tsx',
      'the error page: the reference shown to the reader must be the one the platform logged, which is what error.digest carries; the digest is the first choice and a generated reference is only the fallback for a failure that has none',
    );
  }
  if (!/newShortReference\(/.test(routeErrorCode)) {
    finding(
      'app/error.tsx',
      'the error page: a failure with no digest still owes the reader a reference, so the generated fallback is part of the page',
    );
  }
  if (routeErrorCode.includes('error.message')) {
    finding(
      'app/error.tsx',
      'the error page prints the exception message; a stack message names internals and is written for whoever wrote the code, which is why the state family renders the reference instead',
    );
  }
}

// The offline page is in the page list above, where its two needles live. What
// is checked here is the pair of claims the whole sub-step turns on: the page
// may describe a connection that dropped, and it may not promise a product that
// works without one, because caching arrives with the service worker in a later
// step (FEATURE_LIST item 3378) and item 3581 asks for the page alone.
const offline = namespaceEntries('offline');
if (offline !== null) {
  for (const [key, value] of offline.entries) {
    if (value !== null && /\b(?:cached|stored)\b/i.test(value)) {
      const framed = key.startsWith('label_note_');
      const honest = /\bnot\b/i.test(value);
      if (!framed || !honest) {
        finding(
          offline.file,
          `${key} says something is cached or stored without saying that it is not: nothing is cached in this build`,
          offline.text,
          Math.max(0, offline.text.indexOf(key)),
        );
      }
    }
  }
}

reportResult(
  CHECK,
  findings,
  `${String(PAGES.length)} public pages and ${String(NAMESPACES.length)} namespaces verified (server components with catalogue metadata composed through the 1.30 baseline, one h1 and no skipped heading level, no claim this build cannot evidence, product facts confined to the two namespaces allowed to describe the product, prices with one owner and two figures per published plan, every catalogue key rendered somewhere), plus the 404, the route error page and the offline page, ${String(titles.size)} distinct titles between 20 and 70 characters, ${String(checkedKeys)} keys checked for a reader, ${String(CLAIM_PATTERNS.length)} claim words and ${String(FACT_PATTERNS.length)} product fact shapes refused in copy`,
);
process.exitCode = findings.length === 0 ? 0 : 1;
