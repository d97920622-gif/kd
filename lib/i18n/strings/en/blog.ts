// path: lib/i18n/strings/en/blog.ts
/**
 * Copy for the blog shell (FEATURE_LIST item 248).
 *
 * The blog page exists in this sub-step as a destination with real copy and no
 * posts, and the copy says exactly that. What it does describe is the shape a
 * post will have and the one editorial rule the platform applies to itself: a
 * correction is a new note that names what it corrects, never a quiet edit of
 * the old one, because a page that can change under a reader without saying so
 * is a page a reader cannot cite.
 *
 * Append protocol: add, never rename or remove.
 */
export const blog = {
  meta_title: 'Blog: notes on the rules behind the platform',
  meta_description:
    'Notes on invoicing, payments, tax and the decisions behind the platform. No posts are published yet, and this page says so.',

  label_title: 'Blog',
  label_intro:
    'Notes from building the platform: what a rule is for, what a change in invoicing or tax means for a small business, and what the product decided rather than what it copied.',

  label_section_posts_title: 'Posts',
  label_empty_posts:
    'No posts are published yet. The list appears here when the first note is published.',

  label_section_shape_title: 'What a post is',
  label_shape_point_one:
    'A dated note with a title, a body and, where it matters, the list of what changed because of it.',
  label_shape_point_two:
    'A correction is a new note that names what it corrects. A published note is never edited to say something different.',
  label_shape_point_three:
    'Each post has a permanent address of its own, so a link to a note keeps working after the list has moved on.',

  label_note_list:
    'The first notes arrive with the content module, which is what gives a post an author, a publish date and an address that does not change.',

  action_features: 'See what the platform does',
  action_pricing: 'See what the plans cost',
} as const;
