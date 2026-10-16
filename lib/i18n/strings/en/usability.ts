// path: lib/i18n/strings/en/usability.ts
/**
 * Copy for the usability primitives: saved views, undo, autosave and
 * optimistic updates.
 *
 * These four primitives are the ones a later step applies to a module without
 * rewriting it (docs/PLAN/09_REVISION_2_ADDITIONS.md), so their sentences are
 * the sentences dozens of screens will eventually show. They carry one rule
 * each:
 *
 *   - **A saved view says where it is kept.** A reader who believes their
 *     filters followed them to another device will be surprised by an empty
 *     list, so the note says "in this browser" and says that signing out
 *     removes them.
 *   - **An undo says what has not happened yet.** Five seconds of undo is only
 *     reassuring if the reader knows the action has not been carried out, so
 *     the description says so and the commit message says the window closed.
 *   - **An autosave says where the work is.** "Saved" alone invites the belief
 *     that the record on the server changed; the sentences distinguish the
 *     draft in this browser from the record.
 *   - **An optimistic update says what a failure costs.** The promise of the
 *     primitive is that a refused request takes back exactly one change, so
 *     the copy states it instead of leaving the reader to discover it.
 *
 * Append protocol: add, never rename or remove. A copy change is a new key.
 */
export const usability = {
  // -------------------------------------------------------------------------
  // Saved views.
  // -------------------------------------------------------------------------
  saved_views_title: 'Saved views',
  saved_views_description:
    'Keep the filters you use often under a name you choose. A saved view belongs to one person and one list.',
  saved_views_storage_note:
    'Saved views are kept in this browser and are removed when you sign out.',
  saved_views_empty: 'No saved views yet. Set the filters you want, then save them under a name.',
  saved_views_name_label: 'View name',
  saved_views_name_placeholder: 'For example: Overdue in Dhaka',
  saved_views_action_save: 'Save this view',
  saved_views_column_name: 'Name',
  saved_views_column_filters: 'Filters',
  saved_views_action_apply: 'Apply the view {name}',
  saved_views_action_delete: 'Delete the view {name}',
  saved_views_applied: 'The filters from {name} are now applied.',
  saved_views_created: 'Saved as {name}.',
  saved_views_updated: '{name} was updated with the filters you have now.',
  saved_views_renamed: '{name} is the new name of that view.',
  saved_views_removed: '{name} was deleted.',
  saved_views_invalid_name: 'Give the view a name of up to 40 characters.',
  saved_views_duplicate_name: 'Another view already has that name.',
  saved_views_limit_reached:
    'This list already has 20 saved views. Delete one before adding another.',
  saved_views_unavailable:
    'This browser will not keep saved views, so saving is switched off here.',
  saved_views_count_one: '{count} saved view',
  saved_views_count_other: '{count} saved views',

  // -------------------------------------------------------------------------
  // Undo.
  // -------------------------------------------------------------------------
  undo_title: 'Undo a destructive action',
  undo_description:
    'A destructive action stays reversible for five seconds. Until the window closes nothing has been sent, so undoing it leaves nothing to clean up.',
  undo_pending_one: '{count} action is inside its undo window.',
  undo_pending_other: '{count} actions are inside their undo window.',
  undo_toast_title: 'Removed {name}',
  undo_toast_description: 'Undo within five seconds, or the action is carried out.',
  undo_action: 'Undo',
  undo_undone: 'The action was undone. Nothing was changed.',
  undo_committed: 'The undo window closed, so the action was carried out.',
  undo_failed: 'The action could not be carried out, so it was left as it was.',
  undo_oldest_note:
    'A new action never steals an older one: the oldest pending action is carried out first.',
  undo_window_note:
    'The five second window is a floor. A caller may extend it, and a shorter value is refused.',
  undo_specimen_remove: 'Remove the sample row',
  undo_specimen_reset: 'Put the sample rows back',

  // -------------------------------------------------------------------------
  // Autosave.
  // -------------------------------------------------------------------------
  autosave_title: 'Autosave',
  autosave_description:
    'Work is kept in this browser while it is typed, so a closed tab or a crash does not cost the change. A kept draft is offered back, never applied behind your back.',
  autosave_field_label: 'Invoice note',
  autosave_field_placeholder: 'Type here. The draft is kept in this browser only.',
  autosave_status_idle: 'Nothing to save yet.',
  autosave_status_pending: 'Unsaved changes.',
  autosave_status_saving: 'Saving...',
  autosave_status_saved: 'Saved in this browser.',
  autosave_status_failed: 'The draft could not be kept. It will be tried again.',
  autosave_status_exhausted:
    'The draft could not be kept, and the automatic attempts are spent. Save again to retry.',
  autosave_status_recovered: 'A draft from an earlier session is available.',
  autosave_saved_at: 'Kept at {time}.',
  autosave_action_recover: 'Use the draft',
  autosave_action_discard: 'Discard the draft',
  autosave_recovered_note:
    'The field now holds the draft from this browser. The record on the server has not been changed.',
  autosave_denied_note:
    'This form cannot keep a draft, because a draft may never store a credential, a card number or an account number.',
  autosave_multi_tab_note:
    'Two tabs on the same record keep the newest draft. An older tab cannot overwrite a newer one.',
  autosave_size_note: 'A draft larger than 32 kilobytes is refused rather than written halfway.',

  // -------------------------------------------------------------------------
  // Optimistic updates.
  // -------------------------------------------------------------------------
  optimistic_title: 'Optimistic updates',
  optimistic_description:
    'The change appears at once and the request follows it. A refused request takes back exactly that change, never the ones made after it.',
  optimistic_field_label: 'Record name',
  optimistic_action_apply: 'Apply the change',
  optimistic_fail_label: 'Make the next request fail',
  optimistic_action_reset: 'Reset the specimen',
  optimistic_pending_one: '{count} change is waiting for an answer.',
  optimistic_pending_other: '{count} changes are waiting for an answer.',
  optimistic_confirmed: 'The server confirmed the change.',
  optimistic_rolled_back:
    'The request failed, so that change was taken back. Later changes stayed.',
  optimistic_queue_note:
    'Pending changes are a queue rather than one previous value, so two changes in flight cannot lose each other.',
  optimistic_specimen_initial: 'Sample record',
  optimistic_specimen_renamed: 'Renamed while the request was still in flight',
} as const;
