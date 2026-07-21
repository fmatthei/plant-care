'use strict';

// ============================================================
// CONSTANTS
// ============================================================

const TASK_CONFIG = {
  'normal-water': { name: 'Watering',           icon: '💧', type: 'water' },
  'refill-pot':   { name: 'Refill Self-Watering Pot',  icon: '🫙', type: 'refill' },
  'fertilize':    { name: 'Fertilize',                 icon: '🌱', type: 'fertilize' },
  'check':        { name: 'Check',                     icon: '🔍', type: 'check' },
  'repot':        { name: 'Repot',                     icon: '🪴', type: 'repot' },
  'prune':        { name: 'Prune',                     icon: '✂️',  type: 'prune' },
  'check-pests':  { name: 'Check Pests',               icon: '🐛', type: 'pest' },
  'rotate':       { name: 'Rotate',                    icon: '🔄', type: 'rotate' },
};

// ── Shared date-name sources (Brief #44a) ───────────────────────────────────
// Single source of truth for weekday/month names. Sunday-indexed (index 0 = Sun)
// to match JS Date.getDay(). English values for now; Phase-2 i18n makes these
// locale-aware. Do NOT re-inline these arrays elsewhere — reference these consts.
const WEEKDAY_NAMES      = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];         // 2-letter (min)
const WEEKDAY_NAMES_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];  // 3-letter
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ── i18n foundation (Brief #44a) ────────────────────────────────────────────
// Minimal translation shell. `t(key, vars)` looks up `key` in the active-locale
// dictionary and substitutes {var} placeholders from `vars`. A missing key
// returns the key itself (a visible fallback that never throws), so gaps surface
// obviously in the UI instead of blanking out.
//
// CONVENTION: every NEW user-facing UI string added in future briefs MUST route
// through t() with a dot-namespaced key (e.g. t('task.overdue', { n })) rather
// than being hardcoded inline. Existing strings are migrated separately in a
// later phase — this brief only builds the mechanism; do not retrofit here.
const TRANSLATIONS = {
  en: {
    // ── Onboarding flow (Brief #44b-1) ──────────────────────────────────────
    'onboarding.nameCapture.title':       "What should we call you?",
    'onboarding.nameCapture.subtitle':    "This is how you'll appear to your household.",
    'onboarding.nameCapture.placeholder': "Your first name",
    'onboarding.nameCapture.cta':         "Let's go",

    'onboarding.step.counter': "Step {step} of 3",

    'onboarding.banner.label':    "Get started",
    'onboarding.banner.step1':    "Add a plant to get started.",
    'onboarding.banner.step1Cta': "+ Add Plant",
    'onboarding.banner.step2':    "Create a task to water your plant every 3 days.",
    'onboarding.banner.step2Cta': "Create a task →",
    'onboarding.banner.step3':    "Tap ✓ Done below to complete your setup ↓",

    'onboarding.inlineTask.markDone': "Mark as Done",

    'onboarding.reminders.noteText':          "You can enable notifications any time from the menu.",
    'onboarding.reminders.blockedTitle':      "Notifications are turned off",
    'onboarding.reminders.blockedBody':       "To turn them on: <strong>{path}</strong>.",
    'onboarding.reminders.blockedPathIos':    "iPhone Settings &rarr; Plant Care &rarr; Notifications",
    'onboarding.reminders.blockedPathAndroid':"Android Settings &rarr; Apps &rarr; Plant Care &rarr; Notifications",
    'onboarding.reminders.title':             "Stay in sync with your household",
    'onboarding.reminders.subtitle':          "Get a heads-up when someone completes a care task.",
    'onboarding.reminders.enable':            "Enable notifications",

    'onboarding.card.maybeLater': "Maybe later",

    'onboarding.calendarCard.noteText':  "You can sync your tasks to your Calendar app anytime from the menu.",
    'onboarding.calendarCard.title':     "See your tasks in your calendar",
    'onboarding.calendarCard.subtitle':  "Your plant care tasks will appear automatically as calendar events (a single event per day).",
    'onboarding.calendarCard.subscribe': "Set up Calendar Sync",

    'onboarding.coachmark.demoRow':   "{name} watered {plant} · just now",
    'onboarding.coachmark.feedTitle': "This is your household's activity feed",
    'onboarding.coachmark.feedBody':  "Every care action appears here in real time. No more guessing who did what — your whole household stays in sync automatically.",
    'onboarding.coachmark.gotIt':     "Got it",
    // Coach-mark render fallbacks (renderCoachMark) — Brief #44-extract-final
    'onboarding.coachmark.youFallback':   "You",
    'onboarding.coachmark.plantFallback': "your plant",

    'onboarding.caringCoachmark.title': "Your daily tasks live here",
    'onboarding.caringCoachmark.body':  "See what needs attention today and what's coming up this week.",

    'onboarding.tasksBanner.step3': "Tap ✓ Done below to complete your setup",

    'onboarding.addTask.label':       "Your care task",
    'onboarding.addTask.instruction': "We've pre-filled a watering task for you. Adjust it or tap Add task to continue.",

    // ── Task create/edit sheets (Brief #44b-2) ──────────────────────────────
    'taskSheet.step1.title':               "Add Task",
    'taskSheet.step2.addButton':           "Add Task", // same text as step1.title, distinct UI role (title vs primary action)
    'taskSheet.type.added':                "Added",
    'taskSheet.type.custom':               "Custom",
    'taskSheet.customTask.header':         "Custom Task",
    'taskSheet.field.taskName':            "Task name",
    'taskSheet.field.taskNamePlaceholder': "e.g. Mist leaves",
    'taskSheet.field.owner':               "Owner",
    'taskSheet.field.dueDate':             "Due date",
    'taskSheet.field.startFrom':           "Start from",
    'taskSheet.field.firstDueDate':        "First due date",
    'taskSheet.field.repeating':           "Repeating task",
    'taskSheet.icon.tapToChange':          "tap icon to change",
    'taskSheet.recurrence.interval':       "Every X days",
    'taskSheet.recurrence.weekdays':       "Days of week",
    'taskSheet.recurrence.yearly':         "Yearly",
    'taskSheet.recurrence.daysBetween':    "days between tasks",
    'taskSheet.pause.label':               "Pause task",
    'taskSheet.pause.subtitle':            "Skip until resumed",
    'taskSheet.delete':                    "Delete task",
    'taskSheet.cancel':                    "Cancel",
    'taskSheet.back':                      "Back",
    'taskSheet.saveChanges':               "Save Changes",
    // Live recurrence-summary preview (updateRecurrenceSummary) — Brief #44-extract-final
    'taskSheet.recSummary.yearlyLeap':     "Recurs every year on Feb 29 (Mar 1 in non-leap years)",
    'taskSheet.recSummary.yearlyOn':       "Recurs every year on {month} {day}",
    'taskSheet.recSummary.everyDays.one':   "recurs every {n} day",
    'taskSheet.recSummary.everyDays.other': "recurs every {n} days",
    'taskSheet.recSummary.everyWeekdays':  "recurs every {days}",
    'taskSheet.recSummary.started':        "Started",
    'taskSheet.recSummary.starts':         "Starts",
    'taskSheet.recSummary.firstOccurrence':"First occurrence:",
    // Overdue-task action sheet (openOverdueActionSheet) — reuses home.aria.markDone + taskSheet.cancel
    'taskSheet.overdueSheet.skip':         "Skip this time",
    'taskSheet.overdueSheet.editTask':     "Edit task",

    // ── Add-plant wizard (Brief #44b-3) ─────────────────────────────────────
    // Reuses taskSheet.cancel ("Cancel") and taskSheet.back ("Back") for the
    // shared button labels rather than duplicating — see flag in brief notes.
    'addPlant.step1.title':           "Pick an icon",
    'addPlant.step1.subtitle':        "Choose something that looks like yours",
    'addPlant.tab.all':               "All (35)",
    'addPlant.tab.foliage':           "🌿 Foliage",
    'addPlant.tab.flowers':           "🌸 Flowers",
    'addPlant.tab.edibles':           "🍋 Edibles",
    'addPlant.photo.divider':         "none of these look like yours?",
    'addPlant.photo.added':           "Photo added",
    'addPlant.photo.usedAsIcon':      "This will be used as your plant icon",
    'addPlant.photo.remove':          "Remove",
    'addPlant.photo.addInstead':      "Add a photo instead",
    'addPlant.photo.later':           "You can also do this later from the plant page",
    'addPlant.done':                  "Done",
    'addPlant.next':                  "Next →",
    'addPlant.step2.heading':         "Give it a name",
    'addPlant.step2.subtext':         "You can always change this later",
    'addPlant.step2.nameLabel':       "Name",
    'addPlant.step2.namePlaceholder': "e.g. Monstera",
    'addPlant.step2.nameHint':        "My green one, The big one…",
    'addPlant.step3.heading':         "When did {name} arrive home?",
    'addPlant.step3.subtext':         "We'll show you how long you've cared for it.",
    'addPlant.arrivalDate.label':     "Arrival date",
    'addPlant.arrivalDate.optional':  "Optional — you can skip this",
    'addPlant.step3.addButton':       "Add {name}",
    // Duplicate-name nudge (attachAddPlantNameListener) — Brief #44-extract-final
    'addPlant.duplicate.title':          "You already have a {name}",
    'addPlant.duplicate.body':           "Give this one a different name so you can tell them apart — or skip and we'll call it '{name} 2'.",
    'addPlant.duplicate.altPlaceholder': "Alternative name…",

    // ── Auth / login / password reset (Brief #44b-4) ────────────────────────
    // Note: the app-brand "Plant Care" <h2> on the login screen is intentionally
    // left un-extracted (product name, consistent with #44b-1's name-capture h1).
    // auth.error.noHousehold / notMember are rendered by renderAuthErrorScreen but
    // passed in from call sites in loadFromSupabase — see brief notes.
    'auth.error.title':                      "Can't load household",
    'auth.error.signOut':                    "Sign out",
    'auth.error.noHousehold':                "Your account isn't associated with a household. Contact your household admin.",
    'auth.error.notMember':                  "You aren't listed as a member of this household.",
    'auth.login.emailPlaceholder':           "Email",
    'auth.login.passwordPlaceholder':        "Password",
    'auth.login.signIn':                     "Sign In",
    'auth.reset.title':                      "Set New Password",
    'auth.reset.newPasswordPlaceholder':     "New password",
    'auth.reset.confirmPasswordPlaceholder': "Confirm new password",
    'auth.reset.save':                       "Save",
    'auth.reset.errorTooShort':              "Password must be at least 6 characters.",
    'auth.reset.errorMismatch':              "Passwords do not match.",
    'auth.reset.successTitle':               "Password Updated",
    'auth.reset.successBody':                "Your password has been updated. Redirecting to sign in…",

    // ── iOS PWA install takeover (Brief #44b-5) ─────────────────────────────
    // Inline HTML (pill spans, SVG share icon, <img>, <br>) is injected via
    // {placeholder} substitution — never embedded in a value — so HTML/SVG
    // structure stays untouched. Pill labels are their own keys (iOS UI names).
    'install.takeover.title':           "Install Plant Care",
    'install.takeover.lead':            "Add it to your Home Screen to get started.",
    'install.steps.tapShare':           "Tap the {share} button in the bottom toolbar. If you don't see it, tap {more} first.",
    'install.steps.shareLabel':         "Share",
    'install.steps.viewMore':           "Tap {label}",
    'install.steps.viewMoreLabel':      "View More",
    'install.steps.addToHome':          "Scroll down to {label}",
    'install.steps.addToHomeLabel':     "Add to Home Screen ➕",
    'install.steps.tapAdd':             "Tap {label}",
    'install.steps.addLabel':           "Add",
    'install.steps.openApp':            "Close Safari and open {icon} Plant Care from your Home Screen like a normal app",
    'install.openInSafari.title':       "Open in Safari",
    'install.openInSafari.lead':        "Plant Care can only be installed from Safari. To continue:",
    'install.openInSafari.copyLink':    "Copy this link:",
    'install.openInSafari.openSafari':  "Open the {label} app",
    'install.openInSafari.safariLabel': "Safari",
    'install.openInSafari.paste':       "Paste the link, then follow the install steps",
    'install.openInSafari.footer':      "This screen stays until the app is installed.",

    // ── Menu panel, notifications sheet, change-password, toasts (Brief #44b-6) ─
    // Reuses across namespaces (see brief notes): taskSheet.cancel ("Cancel"),
    // auth.reset.save ("Save"), auth.reset.errorMismatch ("Passwords do not
    // match."), and onboarding.reminders.blockedBody/blockedPath* for the shared
    // "notifications blocked" instruction. All toasts live under menu.toast.*.
    'menu.section.profile':                 "Profile",
    'menu.section.reminders':               "Reminders & Notifications",
    'menu.section.account':                 "Account",
    'menu.item.syncCalendar':               "Sync to Calendar",
    'menu.item.changePassword':             "Change Password",
    'menu.item.signOut':                    "Sign Out",

    'menu.notifications.label':             "Notifications",
    'menu.notifications.blocked':           "Blocked",
    'menu.notifications.on':                "On",
    'menu.notifications.off':               "Off",
    'menu.notifications.body':              "Get a heads-up on your phone whenever someone in your household completes a care task.",
    'menu.notifications.enable':            "Enable",

    'menu.changePassword.newLabel':         "New password",
    'menu.changePassword.newPlaceholder':   "At least 8 characters",
    'menu.changePassword.confirmLabel':     "Confirm password",
    'menu.changePassword.confirmPlaceholder':"Repeat new password",
    'menu.changePassword.errorTooShort':    "Password must be at least 8 characters.",

    'menu.toast.markedDone':                "{task} done",
    'menu.toast.addNotePrompt':             "Add a note?",
    'menu.toast.undo':                      "Undo",
    'menu.toast.noteAdded':                 "Note added",
    'menu.toast.couldNotSaveTapRetry':      "Could not save — tap Save to retry",
    'menu.toast.couldNotSavePleaseRetry':   "Could not save — please try again",
    'menu.toast.householdNameUpdated':      "&#10003; Household name updated",
    'menu.toast.passwordUpdated':           "&#128274; Password updated!",
    'menu.toast.couldNotLoadImage':         "Could not load that image",
    'menu.toast.photoLimitReached':         "Photo limit reached — manage photos first",
    'menu.toast.couldNotSavePhoto':         "Could not save photo",
    'menu.toast.couldNotFindPhoto':         "Could not find photo",
    'menu.toast.plantSaved':                "✅ Plant saved!",
    'menu.toast.plantAdded':                "🌱 Plant added!",
    'menu.toast.taskAdded':                 "✅ Task added!",
    'menu.toast.taskSaved':                 "✅ Task saved!",
    'menu.toast.taskDeleted':               "🗑️ Task deleted!",
    'menu.toast.plantDeleted':              "{name} deleted",
    'menu.toast.notificationsEnabled':      "Notifications enabled",
    'menu.toast.notificationsEnabledBang':  "🔔 Notifications enabled!",
    'menu.toast.notificationsNotEnabled':   "Notifications weren't enabled",

    // ── Calendar sync sheet (Brief #44e) ────────────────────────────────────
    // The sheet header title reuses menu.item.syncCalendar ("Sync to Calendar").
    // removeFeed.* keep inline <strong>/&rarr; in-value (multiple static bold
    // segments). handoffNotice/{app} and schedule/{time} slots are runtime vars.
    'calendarSync.intro':                 "Tasks appear as daily events in your calendar app.",
    'calendarSync.scope.my':              "My tasks",
    'calendarSync.scope.all':             "All household tasks",
    'calendarSync.scope.myBlurb':         "Only tasks assigned to you.",
    'calendarSync.scope.allBlurb':        "Every task across your household.",
    'calendarSync.app.google':            "Google Calendar",
    'calendarSync.app.apple':             "Apple Calendar",
    'calendarSync.schedule.daily':        "Daily at {time}",
    'calendarSync.schedule.split':        "Weekdays {weekday} · Weekends {weekend}",
    'calendarSync.action.subscribe':      "Subscribe",
    'calendarSync.action.modify':         "Modify",
    'calendarSync.action.switchApp':      "Switch App",
    'calendarSync.action.unsubscribe':    "Unsubscribe",
    'calendarSync.handoffNotice':         "Tapping Subscribe will open {app}. Tap Allow when prompted to add the feed.",
    'calendarSync.state1.chooseFeed':     "Choose a feed",
    'calendarSync.state1.calendarAppLabel':"Calendar app",
    'calendarSync.state1.yourCalendarApp':"your Calendar app",
    'calendarSync.state1.scheduleTime':   "Schedule time",
    'calendarSync.state1.weekdaysLabel':  "Mon &ndash; Fri",
    'calendarSync.state1.allDaysLabel':   "All days",
    'calendarSync.state1.weekendToggle':  "Different time on weekends",
    'calendarSync.state1.weekendLabel':   "Sat &amp; Sun",
    'calendarSync.options.activeSyncs':   "ACTIVE SYNCS",
    'calendarSync.options.noSyncs':       "No calendar syncs yet — add one below.",
    'calendarSync.options.getHelp':       "Get Help",
    'calendarSync.options.getHelpSub':    "Troubleshooting &amp; tips",
    'calendarSync.getHelp.title':         "Troubleshooting",
    'calendarSync.getHelp.item1':         "Wait a minute — Calendar can take a moment to sync after adding a new feed.",
    'calendarSync.getHelp.item2':         "Open the Calendar app directly and pull down to refresh.",
    'calendarSync.getHelp.item3':         "Make sure the Plant Care calendar is visible — tap Calendars at the bottom and check it's enabled.",
    'calendarSync.getHelp.item4':         "If you don't see events after subscribing, check that the calendar is checked/visible in your calendar app's list.",
    'calendarSync.switch.title':          "Switch calendar app",
    'calendarSync.switch.intro':          "First remove the current {scope} feed from {app}, then pick the new app and subscribe again.",
    'calendarSync.unsubscribe.body':      "To stop these events, remove the feed from your calendar app:",
    'calendarSync.unsubscribe.confirm':   "I've removed it",
    'calendarSync.removeFeed.google':     "In Google Calendar, open <strong>Settings &rarr; the Plant Care calendar</strong> and choose <strong>Unsubscribe</strong>. This only removes the calendar feed, not your Plant Care account.",
    'calendarSync.removeFeed.apple':      "Go to <strong>Settings &rarr; Calendar &rarr; Accounts</strong>, find the Plant Care feed, and tap <strong>Delete Account</strong> — this only removes the calendar feed, not your Plant Care account.",
    'calendarSync.copied':                "Copied!",
    'calendarSync.toast.loading':         "Loading household data… please try again in a moment.",
    'calendarSync.aria.back':             "Back",
    'calendarSync.aria.close':            "Close",

    // ── Home & Caring shell (Brief #44c-1a) ─────────────────────────────────
    // The "Undo" aria-label reuses menu.toast.undo. Status-count pills
    // ("{n} overdue" / "{n} due today") and the "{plant} · {n} days late" /
    // "due today" subtitles are intentionally left for #44c-2 (status/plural).
    'home.householdFallback': "My Household",
    'home.yourHouseholds':    "Your households",
    'home.manageHouseholds':  "Manage households",
    'home.tabPlants':         "My Plants",
    'home.tabCaring':         "Caring",
    'home.emptyTitle':        "Your plants live here",
    'home.emptySub':          "Add a plant to start tracking its care.",
    'home.myPlants':          "My plants",
    'home.allGood':           "All good",
    'home.moreTasksAria':     "{n} more",
    'home.addPlant':          "Add Plant",
    'home.needsAttention':    "Needs Attention Today",
    'home.allDoneToday':      "All done for today!",
    'home.recentActivity':    "Recent activity",
    'home.viewMore':          "View more",
    'home.activityEmpty':     "Care actions will appear here",
    'home.aria.reportBug':    "Report a bug",
    'home.aria.markDone':     "Mark done",
    'home.aria.addNote':      "Add note",
    'home.aria.resume':       "Resume",
    'home.aria.dismiss':      "Dismiss",
    // Last-care line (lastCareLabel) + rendered fallbacks — Brief #44-extract-final
    'home.lastCare':          "Last care:",
    'home.unnamedHousehold':  "Household",
    'home.unknownAuthor':     "Unknown",
    'home.authorFallback':    "Someone",
    'home.taskFallback':      "task",
    'home.careFallback':      "care",

    'caring.doneToday':       "Done today",
    'caring.emptyTitle':      "Where care happens",
    'caring.emptySub':        "Overdue and upcoming tasks will appear here.",
    'caring.upcoming':        "Upcoming",
    'caring.allClear':        "All clear",
    'caring.noTasksToday':    "No tasks today",

    // ── Plant detail & task cards (Brief #44c-1b) ───────────────────────────
    // Reuses (see brief notes): home.aria.reportBug/addNote/markDone,
    // home.recentActivity/viewMore/allDoneToday, caring.allClear/noTasksToday/
    // upcoming, addPlant.step3.heading, menu.toast.undo/noteAdded. Status/
    // recurrence/relative labels and the verb-map assembly are left untouched.
    'plantDetail.aria.editPlant':       "Edit plant",
    'plantDetail.tabSummary':           "Summary",
    'plantDetail.tabTasks':             "Tasks",
    'plantDetail.tabNotes':             "Notes",
    'plantDetail.tabCareLog':           "Care Log",
    'plantDetail.addTask':              "Add task",
    'plantDetail.aria.addFab':          "Add",
    'plantDetail.summary.homeTitle':    "Your {name} is home",
    'plantDetail.summary.emptySub':     "Add a task to start tracking its care. Your progress will show up here.",
    'plantDetail.summary.daysOfCare':   "days of care",
    'plantDetail.summary.homeSince':    "Home since {date}",
    'plantDetail.summary.arrivalPromptSub': "Set an arrival date to start tracking days of care.",
    'plantDetail.summary.photoTimeline':"Photo timeline",
    'plantDetail.summary.photoCount':   "{n} photos · tap to view",
    'plantDetail.summary.needsAttention':"Needs attention today",
    'plantDetail.summary.noUpcoming':   "No upcoming tasks",
    'plantDetail.summary.noActivity':   "No activity yet",
    'plantDetail.tasks.emptyTitle':     "No tasks yet",
    'plantDetail.tasks.emptySub':       "Add a care task to start tracking what your {name} needs.",
    'plantDetail.tasks.noneForFilter':  "No tasks for selected users",
    'plantDetail.tasks.listHeader':     "Task list",
    'plantDetail.notes.emptyTitle':     "No notes yet",
    'plantDetail.notes.emptySub':       "Jot down observations about your {name} — growth, health, anything worth remembering. Tap the button below to add one.",
    'plantDetail.notes.noneForFilter':  "No notes for selected users",
    'plantDetail.careLog.emptyTitle':   "Your plant's care history",
    'plantDetail.careLog.emptySub':     "Your completed tasks and notes will appear here.",
    'plantDetail.careLog.skipped':      "Skipped",

    'taskCard.paused':   "Paused",
    'taskCard.done':     "Done",
    'taskCard.plusNote': "+ Note",
    'taskCard.resume':   "Resume",

    // ── Manage households & household activity (Brief #44c-1c) ───────────────
    // Reuses (see brief notes): home.householdFallback, taskSheet.cancel/back,
    // auth.reset.save, plantDetail.careLog.skipped, menu.toast.noteAdded.
    // The "{n} member(s)" count keeps its plural ternary — reserved for #44c-2.
    'manageHouseholds.title':              "Manage Households",
    'manageHouseholds.yourHousehold':      "Your household",
    'manageHouseholds.editName':           "Edit Name",
    'manageHouseholds.membersLabel':       "Members",
    'manageHouseholds.unknownMember':      "Unknown",
    'manageHouseholds.role':               "Member",
    'manageHouseholds.youBadge':           "YOU",
    'manageHouseholds.activityTitle':      "Household activity",
    'manageHouseholds.noActivity':         "No activity yet.",
    'manageHouseholds.noActivityFiltered': "No activity yet for selected users.",
    'manageHouseholds.careFallback':       "Care",

    // ── Note & photo sheets (Brief #44c-1d) ─────────────────────────────────
    // Reuses (see brief notes): addPlant.photo.added/remove, taskSheet.cancel/
    // back/saveChanges, auth.reset.save. The photo-count "{n} photo(s)" plural
    // ternary is left for #44c-2.
    'notes.postTask.title':   "Add a note",
    'notes.optional':         "Optional",
    'notes.placeholder':      "Describe what you observed...",
    'notes.addPhoto':         "Add photo",
    'notes.postTask.skip':    "Skip",
    'notes.saveNote':         "Save note",
    'notes.addNote.title':    "Add Note",
    'notes.coach.title':      "Match your last photo",
    'notes.coach.body':       "Use the same angle/distance. Helps to see progress!",
    'notes.coach.bodyAlt':    "Same angle helps track progress!",
    'notes.editNote.subtitle':"Edit note",
    'notes.deleteNote':       "Delete note",
    // Note card / note-edit + Add-Note save state — Brief #44-extract-final
    // (Cancel reuses taskSheet.cancel; Save reuses auth.reset.save; Delete tooltip reuses photos.delete)
    'notes.noteTaskMeta':     "after {task}",
    'notes.saving':           "Saving…",
    'notes.editTooltip':      "Edit",

    'photos.tapToChange':     "Tap to change",
    'photos.lastPhoto':       "Last photo",
    'photos.aria.close':      "Close",
    'photos.aria.previous':   "Previous",
    'photos.aria.next':       "Next",
    'photos.slideshow.noteLabel': "NOTE",
    'photos.slideshow.count': "{current} of {total}",
    'photos.noNote':          "No note added.",
    'photos.cap.title':       "Photo limit reached",
    'photos.cap.body':        "Each plant can have up to {cap} photos. To add a new one, you'll need to remove an existing photo first.",
    'photos.cap.deleteOldest':"Delete oldest photo",
    'photos.managePhotos':    "Manage photos",
    'photos.loading':         "Loading…",
    'photos.noPhotos':        "No photos yet.",
    'photos.delete':          "Delete",

    // ── Edit plant & emoji picker (Brief #44c-1e) ───────────────────────────
    // Reuses: plantDetail.aria.editPlant ("Edit plant" sheet title), taskSheet.
    // cancel. The edit-plant "change icon" screen reuses renderAddPlantStep1Html
    // (addPlant.tab.*/done, taskSheet.cancel — already migrated in #44b-3).
    // The inline delete-confirm body is a custom sheet element, not a native
    // confirm() dialog, so it is in scope here.
    'editPlant.setDate':           "Set date",
    'editPlant.sublabelPhoto':     "Tap Change to retake, pick a new one, or use an icon",
    'editPlant.sublabelEmoji':     "Tap Change to pick a new icon or add a photo",
    'editPlant.iconLabel':         "PLANT ICON",
    'editPlant.plantIcon':         "Plant icon",
    'editPlant.change':            "Change",
    'editPlant.nameLabel':         "NAME",
    'editPlant.namePlaceholder':   "Plant name",
    'editPlant.arrivalDateLabel':  "ARRIVAL DATE",
    'editPlant.whenArrive':        "When did it arrive home?",
    'editPlant.deletePlant':       "Delete plant",
    'editPlant.deleteConfirmBody': "This will permanently delete the plant and all its tasks, notes, and care history. This cannot be undone.",
    'editPlant.deleteConfirmYes':  "Yes, delete forever",
    'editPlant.saveChanges':       "Save changes",

    'emojiPicker.pastePlaceholder': "Or paste custom emoji",

    // ── Status / recurrence / lastDone (Brief #44c-2a) ──────────────────────
    // Plural pairs use tn() (.one/.other). Reuses: caring.doneToday ("Done
    // today"), taskCard.paused ("Paused"). The summary due-status reuses
    // status.badge.daysOverdue/dueToday with {manual:''} (subset case).
    'status.recurrence.oneOff':        "One-off",
    'status.recurrence.noDaysSet':     "No days set",
    'status.recurrence.daysOfWeek':    "Days of week",
    'status.recurrence.everyWeekdays': "Every {days}",
    'status.recurrence.everyYearOn':   "Every year on {month} {day}",
    'status.recurrence.everyYear':     "Every year",
    'status.recurrence.everyDays.one':   "Every {n} day",
    'status.recurrence.everyDays.other': "Every {n} days",

    'status.badge.done':               "Done",
    'status.badge.inDaysOneOff.one':   "In {n} day — one-off",
    'status.badge.inDaysOneOff.other': "In {n} days — one-off",
    'status.badge.dueTodayOneOff':     "Due today — one-off",
    'status.badge.overdueOneOff':      "Overdue — one-off",
    'status.badge.dueTodayNeverDone':  "Due today — never done",
    'status.badge.daysOverdue.one':    "{n} day overdue{manual}",
    'status.badge.daysOverdue.other':  "{n} days overdue{manual}",
    'status.badge.dueToday':           "Due today{manual}",
    'status.badge.dueTomorrow':        "Due tomorrow{manual}",
    'status.badge.inDays':             "In {n} days{manual}",
    'status.badge.manualSuffix':       " (manual)",

    'status.lastDone.never':     "Never done",
    'status.lastDone.yesterday': "Done yesterday",
    'status.lastDone.daysAgo':   "Done {n} days ago",

    'status.home.daysLate.one':   "{n} day late",
    'status.home.daysLate.other': "{n} days late",
    'status.home.dueToday':       "due today",

    'status.pill.overdue':  "{n} overdue",
    'status.pill.dueToday': "{n} due today",

    'status.row.doneToday':   "✓ done today",
    'status.row.done':        "✓ done",
    'status.row.dueDate':     "due {date}",
    'status.row.dueTomorrow': "due tomorrow",
    'status.row.dueToday':    "due today",
    'status.row.overdue':     "overdue",
    'status.row.dueInDays':   "due in {n} days",

    'manageHouseholds.memberCount.one':   "{n} member",
    'manageHouseholds.memberCount.other': "{n} members",

    // ── Relative time (Brief #44c-2b) ───────────────────────────────────────
    // relativeDaysLabel() (lastCareLabel + Summary) and formatActivityTime()
    // are distinct formats — day-granularity vs minute/hour. daysAgo.one is
    // reachable only via a hypothetical caller; the day-granularity path maps
    // diff===1 to "Yesterday", so "1 day ago" is never displayed today.
    'relativeTime.today':              "Today",
    'relativeTime.yesterday':          "Yesterday",
    'relativeTime.someTimeAgo':        "some time ago",
    'relativeTime.daysAgo.one':        "{n} day ago",
    'relativeTime.daysAgo.other':      "{n} days ago",
    'relativeTime.activity.justNow':   "Just now",
    'relativeTime.activity.minutesAgo':"{n}m ago",
    'relativeTime.activity.hoursAgo':  "{n}h ago",
    // reserved for a future arrival-age label (former relativeArrivalLabel, removed #44-followup-2b)
    // Reuses relativeTime.today/.yesterday/.daysAgo for the day-granularity
    // branches; week/month/year branches below. The "{n}" plural branches are
    // only ever reached with n >= 2 (e.g. weeks = round(days/7) for 14..29 days),
    // so .one is a never-displayed safety form kept for tn() symmetry.
    'relativeTime.arrival.aboutAWeek':   "About a week ago",
    'relativeTime.arrival.weeksAgo.one':   "{n} week ago",
    'relativeTime.arrival.weeksAgo.other': "{n} weeks ago",
    'relativeTime.arrival.aboutAMonth':  "About a month ago",
    'relativeTime.arrival.monthsAgo.one':   "{n} month ago",
    'relativeTime.arrival.monthsAgo.other': "{n} months ago",
    'relativeTime.arrival.aboutAYear':   "About a year ago",
    'relativeTime.arrival.yearsAgo.one':   "About {n} year ago",
    'relativeTime.arrival.yearsAgo.other': "About {n} years ago",

    // ── Reschedule / occurrence prompt (Brief #44c-2c) ──────────────────────
    // Reuses relativeTime.today for the "Today" legend chips. NOTE: pre-existing
    // pluralization inconsistency preserved verbatim — the yearly headline and
    // the delta pill are plural-aware (tn), while the interval/weekday headline
    // and interval recurrence summary are always "days" (fixed, byte-identical).
    'reschedule.keepOriginal.title':      "Keep Original Schedule",
    'reschedule.acceptModified.title':    "Accept Modified Schedule",
    'reschedule.todayIs':                 "Today is {date}",
    'reschedule.nextDue':                 "Next due: {date}",
    'reschedule.summaryDue':              "due {date}",
    'reschedule.recurrenceEveryDays.one':   "Every {n} day",
    'reschedule.recurrenceEveryDays.other': "Every {n} days",
    'reschedule.runningLate.one':           "Running {n} day late",
    'reschedule.runningLate.other':         "Running {n} days late",
    'reschedule.daysEarly.one':             "{n} day early",
    'reschedule.daysEarly.other':           "{n} days early",
    'reschedule.deltaLater.one':          "→ {n} day later",
    'reschedule.deltaLater.other':        "→ {n} days later",
    'reschedule.deltaEarlier.one':        "← {n} day earlier",
    'reschedule.deltaEarlier.other':      "← {n} days earlier",
    'reschedule.legend.missed':           "Missed",
    'reschedule.legend.nextOccurrences':  "Next occurrences",
    'reschedule.yearly.everyYearOn':      "Every year on {anchor}",
    'reschedule.yearly.runningLate.one':  "Running {n} day late",
    'reschedule.yearly.runningLate.other':"Running {n} days late",
    'reschedule.yearly.runningEarly.one': "Running {n} day early",
    'reschedule.yearly.runningEarly.other':"Running {n} days early",
    'reschedule.yearly.moveAnchor':       "Move anchor to {date} every year",

    // ── Native confirm()/alert() dialogs (Brief #44-dialogs) ────────────────
    // Plain text only (native dialogs don't render HTML). No interpolation.
    'dialog.confirmDeleteTask':       "Permanently delete this task? This cannot be undone.",
    'dialog.confirmDeleteNote':       "Delete this note?",
    'dialog.confirmDeletePhoto':      "Delete this photo?",
    'dialog.confirmRemoveRecurrence': "This will remove the recurrence schedule. The task will become a one-off. Continue?",
    'dialog.alertNoteOrPhoto':        "Please add a note or photo.",
    'dialog.alertNoteEmpty':          "Note cannot be empty.",
    'dialog.alertPlantNameRequired':  "Please enter a plant name.",
    'dialog.alertTaskNameRequired':   "Please enter a task name.",
    'dialog.alertFrequencyInvalid':   "Please enter a valid frequency (minimum 1 day).",
    'dialog.alertWeekdayRequired':    "Please select at least one day of the week.",
    'dialog.alertMonthDayRequired':   "Please select a month and day.",

    // ── Activity-feed verb map & sentence frames (Brief #44-verbmap) ─────────
    // careVerb.* is keyed by task type and resolved via careVerb() so #44f can
    // supply conjugated Spanish verbs (regó/abonó/…). These are 3rd-person
    // singular past-tense, actor-subject — no gender agreement needed.
    // #44f notes: (a) "checked pests on" bakes its preposition into the verb,
    // like Spanish "revisó plagas en" can; (b) activityFeed.noteOn's "{actor} on
    // {plant}" frame may read awkwardly in Spanish and could need reordering.
    'careVerb.water':     "watered",
    'careVerb.refill':    "refilled",
    'careVerb.fertilize': "fertilized",
    'careVerb.check':     "checked",
    'careVerb.repot':     "repotted",
    'careVerb.prune':     "pruned",
    'careVerb.pest':      "checked pests on",
    'careVerb.rotate':    "rotated",
    // Sentence frames — shared by the Home and Summary-tab activity feeds.
    'activityFeed.care':      "{actor} {verb} {plant}",
    'activityFeed.skipped':   "{actor} skipped {task}",
    'activityFeed.careOther': "{actor} · {task} — {plant}",
    'activityFeed.noteOn':    "{actor} on {plant}",
    'activityFeed.noteAdded': "{actor} added a note",
  },
};
let activeLocale = 'en';

function t(key, vars) {
  const dict = TRANSLATIONS[activeLocale] ?? TRANSLATIONS.en;
  let str = dict[key];
  if (str === undefined) return key; // visible fallback — never throws
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.replaceAll(`{${name}}`, String(value));
    }
  }
  return str;
}

// Pluralized lookup (Brief #44c-2a). Picks `${key}.one` / `${key}.other` via
// Intl.PluralRules for the active locale (English/Spanish are both one/other,
// so a manual .one/.other pair per string is sufficient — no CLDR few/many).
// `{n}` is auto-injected; extra `vars` merge in. Non-finite n falls to 'other'.
function tn(key, n, vars) {
  const form = (typeof n === 'number' && Number.isFinite(n))
    ? new Intl.PluralRules(activeLocale).select(n)
    : 'other';
  return t(`${key}.${form}`, { n, ...(vars || {}) });
}

// BCP-47 locale for on-screen date/time formatting (Brief #44c-2d). Maps the
// active app locale to the tag passed to toLocale*/Intl.DateTimeFormat. 'en'
// resolves to 'en-US' — byte-identical to the prior hardcoded value. Storage/
// compute formatting (todayStr → en-CA) intentionally does NOT route through here.
function displayLocale() {
  return activeLocale === 'en' ? 'en-US' : activeLocale;
}

// Canonical display order is Monday-first, Sunday last (matches the weekday
// selector's [1,2,3,4,5,6,0]). JS getDay() uses 0=Sun, so Sunday sorts to 7.
// Display-only; never mutate/persist task.weekdays with this.
const compareWeekdaysMonFirst = (a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b);

const VAPID_PUBLIC_KEY = 'BLVM0ZnxinWDENKHaZ5QslyAmUJNjf-9w4q3Sxc0mFuVKS19lVLePh39yuaZIc_a_PX5PPnIECGUFeQl2XkOpWQ';

// When the PWA returns to the foreground after this long, force a data reload.
const FOREGROUND_RELOAD_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// #418: cadence of the visibility-gated ambient activity-feed poll.
const POLL_INTERVAL_MS = 45 * 1000; // 45 seconds

// Care-action verbs keyed by task type (Brief #44-verbmap). Resolved through the
// dictionary (careVerb.*) so #44f can supply conjugated Spanish verbs without a
// code change. Returns undefined for task types with no verb, which preserves the
// activity-feed "{actor} · {task} — {plant}" fallback frame branching.
const CARE_VERB_TYPES = ['water', 'refill', 'fertilize', 'check', 'repot', 'prune', 'pest', 'rotate'];
function careVerb(taskType) {
  return CARE_VERB_TYPES.includes(taskType) ? t(`careVerb.${taskType}`) : undefined;
}

const CARE_ICON = {
  water:     '💧',
  refill:    '🪣',
  fertilize: '🌱',
  check:     '🔍',
  repot:     '🪴',
  prune:     '✂️',
  pest:      '🐛',
  rotate:    '🔄',
  skipped:   '⏭',
};

const CUSTOM_ICONS = ['🌿', '💦', '🧴', '🌊', '✂️', '🔍', '🪴', '🐛', '🔄', '🌞', '🧪', '🌸', '🍃', '🌼', '🌡️', '🪥'];

const USERS = {
  Matu: { color: '#283593' },
  Vale: { color: '#880e4f' },
};

// Snapshot the hash before createClient() processes and clears it.
const initialHash = window.location.hash;

const supabaseClient = window.supabase.createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const DEFAULT_PLANTS = [
  {
    id: 'mandarin',
    name: 'Mandarin Tree',
    emoji: '🍊',
    dateAcquired: '',
    tasks: [
      { id: 'normal-water', recurrenceType: 'interval', frequencyDays: 2,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'refill-pot',   recurrenceType: 'interval', frequencyDays: 7,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'fertilize',    recurrenceType: 'interval', frequencyDays: 14, weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'check',        recurrenceType: 'interval', frequencyDays: 3,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: 'Check leaf color, pests, and soil condition' },
    ],
    careLog: [],
  },
  {
    id: 'bougainvillea',
    name: 'Bougainvillea',
    emoji: '🌺',
    dateAcquired: '',
    tasks: [
      { id: 'normal-water', recurrenceType: 'interval', frequencyDays: 3,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'refill-pot',   recurrenceType: 'interval', frequencyDays: 7,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'fertilize',    recurrenceType: 'interval', frequencyDays: 14, weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'check',        recurrenceType: 'interval', frequencyDays: 7,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: 'Check for blooms and overall health' },
    ],
    careLog: [],
  },
];

// ============================================================
// STATE
// ============================================================

const state = {
  view: 'home',
  plantId: null,
  sheetMode: null,
  sheetData: {},
};

let plants = [];
let notes  = [];
let notesShowAll = new Set(); // plantIds where "Show all" is expanded
let editingNoteId = null;
let activeUser = null;
let activeTab = 'plants';
let activeFilter = []; // array of household member display_names — empty means show all (no filter)
let careLogFiltersOpen = false;
let careLogMode = 'tasks'; // 'tasks' | 'all'
let plantDetailTab = 'summary';
let careLogSegment = 'full';
let membersCache = []; // household_members rows: { id, display_name }
let currentMemberId = null;
let isSaving = false;
let householdId = null;
let userHouseholds = [];
let activityFeed = []; // merged care_log + notes, top 5 across all plants
let currentUserId = null;
let isAdmin = false; // app_metadata.is_admin from the auth JWT — gates dev tools
let inRecovery = false;
let swRegistration = null;
let openedFromCaring = false;
let openedFromCareLog = false;
let sheetEntryTab = null;
let householdName = null;
let userTouchedArrivalDate = false;
let manageHouseholdsEditingName = false;
let lastSyncedAt = null; // ms timestamp of the last completed loadFromSupabase()
let remindersCardCollapsed = false; // #339: in-session only (Full→Note). Resets on reload; no flag written.
let calendarCardCollapsed  = false; // #366: mirrors remindersCardCollapsed for the calendar card.
let activityFeedPollTimer  = null; // #418: single setInterval handle for the visibility-gated feed poll.

// ============================================================
// ACTIVE USER (auto-resolved from Supabase auth)
// ============================================================

async function routeAfterAuth() {
  window.scrollTo(0, 0);
  if (inRecovery) return;

  await loadFromSupabase();

  // routeAfterAuth: if loadFromSupabase already rendered an auth error, bail
  if (!currentMemberId) return;

  // #319/#321/#396: iOS browser-tab users must install to Home Screen. Gated
  // AFTER loadFromSupabase() validates the session (currentMemberId set above)
  // so a stale/expired INITIAL_SESSION token can no longer trip the takeover —
  // #396: on a dead token loadFromSupabase() renders the login screen and we
  // bail at the guard above, never reaching here. Re-runs every load; once
  // installed, isStandalone() is true and it never shows.
  if (isIOS() && !isStandalone()) {
    renderIOSInstallTakeover();
    return;
  }

  // #418: begin the ambient feed poll now that a session is loaded. Idempotent —
  // only the first successful load starts it; later loads (household switch) reuse it.
  startActivityFeedPoll();

  const currentMember = membersCache.find(m => m.id === currentMemberId);
  if (!currentMember?.display_name) {
    renderNameCaptureScreen();
    return;
  }

  navigateTo('home');
  posthog.capture('tab_viewed', { tab: 'my_plants' });
}

function renderAuthErrorScreen(message) {
  document.getElementById('app').innerHTML = `
    <div class="user-select-screen">
      <h2>${t('auth.error.title')}</h2>
      <p style="color:var(--text-muted);font-size:14px;text-align:center;line-height:1.5;max-width:320px;margin:0 auto;">${escapeHtml(message)}</p>
      <div class="user-select-buttons" style="margin-top:20px;">
        <button class="btn btn-primary" data-action="menu-sign-out" style="width:100%;padding:14px;font-size:15px;">${t('auth.error.signOut')}</button>
      </div>
    </div>`;
}

// ============================================================
// iOS PWA INSTALL TAKEOVER (#319)
// ============================================================
// Gated in onAuthStateChange immediately before routeAfterAuth(): on iOS in a
// browser tab (not the installed PWA) the user must Add to Home Screen before
// any data loads, onboarding fires, or the home renders. The gate re-runs on
// every load; once installed, isStandalone() returns true and it never shows.
// Uses the .user-select-screen full-screen pattern (replaces #app innerHTML) —
// no overlay, no dismiss control.

function isIOS() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  // iPadOS 13+ reports a desktop (Macintosh) UA; disambiguate via touch points.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || navigator.standalone === true;
}

function isIOSSafari() {
  // Chrome (CriOS), Firefox (FxiOS), Edge (EdgiOS), Opera (OPiOS) on iOS are
  // not Safari and cannot install to the Home Screen.
  return !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent || '');
}

const IOS_SHARE_ICON = `<svg class="ios-step-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>`;

function renderIOSInstallTakeover() {
  document.getElementById('app').innerHTML = isIOSSafari()
    ? renderInstallStepsHTML()
    : renderOpenInSafariHTML();
}

function renderInstallStepsHTML() {
  return `
    <div class="user-select-screen ios-install">
      <div class="ios-install-card">
        <img src="/icons/plant-care-icon-192.png" alt="Plant Care" style="width:64px;height:64px;border-radius:14px;display:block;margin:0 auto 8px;">
        <h2>${t('install.takeover.title')}</h2>
        <p class="ios-install-lead">${t('install.takeover.lead')}</p>
        <ol class="ios-install-steps">
          <li><span class="ios-step-num">1</span><span class="ios-step-text">${t('install.steps.tapShare', { share: `<span class="ios-step-pill">${IOS_SHARE_ICON} ${t('install.steps.shareLabel')}</span>`, more: `<span class="ios-step-pill">•••</span>` })}</span></li>
          <li><span class="ios-step-num">2</span><span class="ios-step-text">${t('install.steps.viewMore', { label: `<span class="ios-step-pill">${t('install.steps.viewMoreLabel')}</span>` })}</span></li>
          <li><span class="ios-step-num">3</span><span class="ios-step-text">${t('install.steps.addToHome', { label: `<span class="ios-step-pill">${t('install.steps.addToHomeLabel')}</span>` })}</span></li>
          <li><span class="ios-step-num">4</span><span class="ios-step-text">${t('install.steps.tapAdd', { label: `<span class="ios-step-pill">${t('install.steps.addLabel')}</span>` })}</span></li>
          <li class="ios-install-step--highlight" style="background:#eef7f1;border-radius:8px;padding:7px 8px;border:0.5px solid #b8ddc8;"><span class="ios-step-num" style="background:#1e5c3a;">5</span><span class="ios-step-text">${t('install.steps.openApp', { icon: `<img src="/icons/plant-care-icon-192.png" alt="" style="width:18px;height:18px;border-radius:4px;vertical-align:middle;margin:0 2px;">` })}</span></li>
        </ol>
      </div>
    </div>`;
}

function renderOpenInSafariHTML() {
  return `
    <div class="user-select-screen ios-install">
      <div class="ios-install-card">
        <div class="ios-install-emoji">🧭</div>
        <h2>${t('install.openInSafari.title')}</h2>
        <p class="ios-install-lead">${t('install.openInSafari.lead')}</p>
        <ol class="ios-install-steps">
          <li><span class="ios-step-num">1</span><span class="ios-step-text">${t('install.openInSafari.copyLink')}<br><span class="ios-step-link">${escapeHtml(window.location.href)}</span></span></li>
          <li><span class="ios-step-num">2</span><span class="ios-step-text">${t('install.openInSafari.openSafari', { label: `<span class="ios-step-pill">${t('install.openInSafari.safariLabel')}</span>` })}</span></li>
          <li><span class="ios-step-num">3</span><span class="ios-step-text">${t('install.openInSafari.paste')}</span></li>
        </ol>
        <p class="ios-install-footer">${t('install.openInSafari.footer')}</p>
      </div>
    </div>`;
}

function renderLoginScreen(errorMsg) {
  document.getElementById('app').innerHTML = `
    <div class="user-select-screen">
      <h2>Plant Care</h2>
      <div class="user-select-buttons">
        <input class="form-input" type="email" id="login-email" placeholder="${t('auth.login.emailPlaceholder')}" autocomplete="email">
        <input class="form-input" type="password" id="login-password" placeholder="${t('auth.login.passwordPlaceholder')}" autocomplete="current-password">
        <button class="btn btn-primary" data-action="login" style="width:100%;padding:16px;font-size:16px;">${t('auth.login.signIn')}</button>
        ${errorMsg ? `<p style="color:var(--due);font-size:14px;text-align:center;margin:0;">${errorMsg}</p>` : ''}
      </div>
    </div>`;
  document.getElementById('app').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
}

async function handleLogin() {
  // #326: dismiss the soft keyboard before the auth round-trip so its viewport
  // reflow settles during the await — otherwise that late reflow lands after
  // renderHome's window.scrollTo(0,0) (:2616) and leaves home scrolled down.
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    renderLoginScreen(error.message);
    return;
  }
  await routeAfterAuth();
}

function renderPasswordResetScreen(errorMsg) {
  document.getElementById('app').innerHTML = `
    <div class="user-select-screen">
      <h2>${t('auth.reset.title')}</h2>
      <div class="user-select-buttons">
        <input class="form-input" type="password" id="reset-password" placeholder="${t('auth.reset.newPasswordPlaceholder')}" autocomplete="new-password">
        <input class="form-input" type="password" id="reset-password-confirm" placeholder="${t('auth.reset.confirmPasswordPlaceholder')}" autocomplete="new-password">
        <button class="btn btn-primary" data-action="save-new-password" style="width:100%;padding:16px;font-size:16px;">${t('auth.reset.save')}</button>
        ${errorMsg ? `<p style="color:var(--due);font-size:14px;text-align:center;margin:0;">${errorMsg}</p>` : ''}
      </div>
    </div>`;
  document.getElementById('app').addEventListener('keydown', e => {
    if (e.key === 'Enter') handlePasswordReset();
  });
}

async function handlePasswordReset() {
  const password = document.getElementById('reset-password').value;
  const confirm  = document.getElementById('reset-password-confirm').value;
  if (password.length < 6) {
    renderPasswordResetScreen(t('auth.reset.errorTooShort'));
    return;
  }
  if (password !== confirm) {
    renderPasswordResetScreen(t('auth.reset.errorMismatch'));
    return;
  }
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    renderPasswordResetScreen(error.message);
    return;
  }
  document.getElementById('app').innerHTML = `
    <div class="user-select-screen">
      <h2>${t('auth.reset.successTitle')}</h2>
      <p style="color:var(--text-muted);font-size:15px;text-align:center;">${t('auth.reset.successBody')}</p>
    </div>`;
  await supabaseClient.auth.signOut();
  inRecovery = false;
  setTimeout(renderLoginScreen, 2000);
}

function renderNameCaptureScreen() {
  document.getElementById('app').innerHTML = `
    <div class="name-capture-screen">
      <div class="app-header">
        <h1>Plant Care</h1>
      </div>
      <div class="name-capture-body">
        <div class="name-capture-emoji">🌿</div>
        <h2 class="name-capture-heading">${t('onboarding.nameCapture.title')}</h2>
        <p class="name-capture-sub">${t('onboarding.nameCapture.subtitle')}</p>
        <input class="form-input" type="text" id="name-capture-input" placeholder="${t('onboarding.nameCapture.placeholder')}" autocomplete="given-name" maxlength="50">
        <button class="btn btn-primary name-capture-btn" id="name-capture-btn" data-action="save-name" disabled>${t('onboarding.nameCapture.cta')}</button>
      </div>
    </div>`;
  const input = document.getElementById('name-capture-input');
  const btn   = document.getElementById('name-capture-btn');
  input.addEventListener('input', () => {
    btn.disabled = input.value.trim().length === 0;
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleNameCapture();
  });
  input.focus();
}

async function handleNameCapture() {
  const input = document.getElementById('name-capture-input');
  const name  = input?.value?.trim();
  if (!name || !currentMemberId) return;

  const { error } = await supabaseClient
    .from('household_members')
    .update({ display_name: name })
    .eq('id', currentMemberId);

  if (error) return;

  const m = membersCache.find(m => m.id === currentMemberId);
  if (m) m.display_name = name;

  activeUser = name;
  navigateTo('home');
  posthog.capture('tab_viewed', { tab: 'my_plants' });
}

// ============================================================
// DATA PERSISTENCE
// ============================================================

function loadData() {
  try {
    const raw = localStorage.getItem('plant-care-v1');
    if (raw) {
      plants = JSON.parse(raw);
    } else {
      plants = JSON.parse(JSON.stringify(DEFAULT_PLANTS));
      saveData();
    }
  } catch (_) {
    plants = JSON.parse(JSON.stringify(DEFAULT_PLANTS));
  }
}

function saveData() {
  try {
    localStorage.setItem('plant-care-v1', JSON.stringify(plants));
  } catch (_) {}
}

async function loadFromSupabase() {
  // 1. Get the logged-in user
  const { data: { user } } = await supabaseClient.auth.getUser();
  // #396: a stale/expired INITIAL_SESSION token resolves to a null user here.
  // Render the login screen rather than returning silently onto the boot spinner.
  if (!user) { renderLoginScreen(); return; }
  currentUserId = user.id;
  isAdmin = user.app_metadata?.is_admin === true;

  // 2. Resolve household_id from auth user — needed to scope subsequent queries
  const { data: userMemberRows } = await supabaseClient
    .from('household_members')
    .select('household_id, deleted_at')
    .eq('user_id', user.id);

  if (!userMemberRows || userMemberRows.length === 0) {
    renderAuthErrorScreen(t('auth.error.noHousehold'));
    return;
  }

  // Keep only households where the user has at least one live (non-deleted)
  // membership row, then dedup — a household with both a soft-deleted and a
  // live row must appear exactly once; a household with only soft-deleted rows
  // must not appear at all. (Filtering happens here in JS, not in the query
  // above, because a deleted_at filter on that query previously caused a 500.)
  const householdIds = [...new Set(
    userMemberRows.filter(r => r.deleted_at === null).map(r => r.household_id)
  )];

  if (householdIds.length === 0) {
    renderAuthErrorScreen(t('auth.error.noHousehold'));
    return;
  }

  const { data: householdRows } = await supabaseClient
    .from('households')
    .select('id, name')
    .in('id', householdIds);

  userHouseholds = householdIds.map(id => ({
    id,
    name: householdRows?.find(h => h.id === id)?.name || t('home.unnamedHousehold')
  }));

  const validIds = userHouseholds.map(h => h.id);
  const stored = localStorage.getItem('active_household_id');
  if (!householdId || !validIds.includes(householdId)) {
    householdId = (stored && validIds.includes(stored)) ? stored : userHouseholds[0].id;
  }

  // 3. Fetch all non-deleted plants, household_members, and household name in parallel
  const [{ data: plantRows }, { data: memberRows }, { data: householdRow }] = await Promise.all([
    supabaseClient
      .from('plants')
      .select('*')
      .eq('household_id', householdId)
      .is('deleted_at', null),
    supabaseClient
      .from('household_members')
      .select('id, display_name, color, user_id, calendar_time, calendar_weekend_time, notifications_enabled, onboarding_completed_at')
      .eq('household_id', householdId)
      .is('deleted_at', null),
    supabaseClient
      .from('households')
      .select('name')
      .eq('id', householdId)
      .single(),
  ]);

  householdName = householdRow?.name ?? null;
  const headerNameEl = document.getElementById('header-household-name');
  if (headerNameEl) headerNameEl.textContent = householdName ?? t('home.householdFallback');

  if (!plantRows) return;

  // Cache members for write operations — must be set before any early return
  // so handleSaveNewPlant() always has a valid membersCache even with no plants.
  membersCache = memberRows ?? [];

  // Resolve current member from cache by user_id — replaces the legacy "Who are you" selector
  const meInCache = membersCache.find(m => m.user_id === currentUserId);
  if (!meInCache) {
    renderAuthErrorScreen(t('auth.error.notMember'));
    return;
  }
  currentMemberId = meInCache.id;
  activeUser = meInCache.display_name ?? '';

  // #403: server is the source of truth for "finished onboarding". If this
  // person completed it on any device, force the local device-facts to agree
  // so a second device doesn't re-show the banner or re-lock the FAB.
  reconcileOnboardingFromServer();

  if (plantRows.length === 0) {
    plants = [];
    notes  = [];
    activityFeed = [];
    const currentMember = membersCache.find(m => m.id === currentMemberId);
    if (currentUserId && currentMemberId && householdId && currentMember && householdName) {
      posthog.identify(currentUserId, {
        display_name:   currentMember.display_name,
        household_id:   householdId,
        household_name: householdName,
      });
    }
    return;
  }

  // Build a map from household_members.id → display_name for resolving task owners
  const ownerMap = {};
  for (const m of membersCache) {
    ownerMap[m.id] = m.display_name;
  }

  // 4. Fetch tasks, care log, notes, and activity-feed rows for all plants in
  //    one batch. Tasks and care_log use a single `.in('plant_id', plantIds)`
  //    query each (matching the notes pattern) instead of one query per plant.
  //    loadActivityFeed()'s two queries are folded into this same Promise.all —
  //    they only depend on plantIds + membersCache, both ready here.
  const plantIds = plantRows.map(p => p.id);
  const [
    { data: taskRows },
    { data: careRows },
    { data: noteRows, error: notesError },
    { data: feedCareRows },
    { data: feedNoteRows },
  ] = await Promise.all([
    supabaseClient
      .from('tasks')
      .select('*')
      .in('plant_id', plantIds)
      .is('deleted_at', null),
    supabaseClient
      .from('care_log')
      .select('*')
      .in('plant_id', plantIds)
      .order('date', { ascending: false }),
    supabaseClient
      .from('notes')
      .select('*')
      .in('plant_id', plantIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabaseClient
      .from('care_log')
      .select('plant_id, task_name, task_type, household_member_id, created_at')
      .in('plant_id', plantIds)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseClient
      .from('notes')
      .select('id, plant_id, note, household_member_id, created_at, photo_url')
      .in('plant_id', plantIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  // Group the flat task/care_log result sets by plant_id. Global ordering from
  // the queries (care_log by date desc) is preserved within each plant group.
  const tasksByPlant = {};
  for (const t of (taskRows ?? [])) (tasksByPlant[t.plant_id] ??= []).push(t);
  const careLogByPlant = {};
  for (const r of (careRows ?? [])) (careLogByPlant[r.plant_id] ??= []).push(r);

  if (notesError) console.error('loadFromSupabase: notes fetch error:', notesError);
  notes = (noteRows ?? []).map(r => ({
    id:        r.id,
    plantId:   r.plant_id,
    memberId:  r.household_member_id,
    author:    ownerMap[r.household_member_id] ?? t('home.unknownAuthor'),
    note:      r.note,
    createdAt: r.created_at,
    taskId:    r.task_id ?? null,
    photoUrl:  r.photo_url ?? null,
  }));

  plants = plantRows.map((plantRow) => {
    const taskRows = tasksByPlant[plantRow.id] ?? [];
    const tasks = taskRows.map(t => ({
      id:              t.id,
      recurrenceType:  t.recurrence?.type,
      frequencyDays:   t.recurrence?.every,
      recurrenceUnit:  t.recurrence?.unit  ?? 'days',
      weekdays:        t.recurrence?.days  ?? [],
      recurrenceMonth: t.recurrence?.month ?? null,
      recurrenceDay:   t.recurrence?.day   ?? null,
      lastDone:        t.last_done         ?? null,
      nextDueOverride: t.next_due_override ?? null,
      preCompletionLastDone:        t.pre_completion_last_done         ?? null,
      preCompletionNextDueOverride: t.pre_completion_next_due_override ?? null,
      paused:          t.paused            ?? false,
      owner:           ownerMap[t.owner_id] ?? '',
      note:            t.note              ?? '',
      name:            t.name,
      icon:            t.icon              ?? '',
      type:            t.type              ?? 'custom',
      ...(t.custom_name ? { customName: t.custom_name } : {}),
      ...(t.custom_icon ? { customIcon: t.custom_icon } : {}),
    }));

    const careLogRows = careLogByPlant[plantRow.id] ?? [];
    const careLog = careLogRows.map(r => ({
      id:        r.id,
      date:      r.date,
      createdAt: r.created_at,
      author:    ownerMap[r.household_member_id] ?? t('home.unknownAuthor'),
      taskId:    r.task_id,
      taskName:  r.task_name,
      taskType:  r.task_type,
    }));

    return {
      id:               plantRow.id,
      name:             plantRow.name,
      emoji:            plantRow.emoji            ?? '🪴',
      photoUrl:         plantRow.photo_url        ?? null,
      dateAcquired: plantRow.date_acquired ?? '',
      tasks,
      careLog,
    };
  });

  // Build the activity feed from the rows already fetched in the batch above —
  // no extra round trip. plantMap/ownerMap are now ready (plants just built).
  const plantMap = Object.fromEntries(plants.map(p => [p.id, p]));
  activityFeed = buildActivityFeed(feedCareRows, feedNoteRows, plantMap, ownerMap);

  const currentMember = membersCache.find(m => m.id === currentMemberId);
  if (currentUserId && currentMemberId && householdId && currentMember && householdName) {
    posthog.identify(currentUserId, {
      display_name:   currentMember.display_name,
      household_id:   householdId,
      household_name: householdName,
    });
  }

  lastSyncedAt = Date.now();
}

async function loadActivityFeed() {
  if (!householdId || plants.length === 0) { activityFeed = []; return; }

  const plantIds = plants.map(p => p.id);
  const plantMap = Object.fromEntries(plants.map(p => [p.id, p]));
  const ownerMap = Object.fromEntries(membersCache.map(m => [m.id, m.display_name]));

  const [{ data: careRows }, { data: noteRows }] = await Promise.all([
    supabaseClient
      .from('care_log')
      .select('plant_id, task_name, task_type, household_member_id, created_at')
      .in('plant_id', plantIds)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseClient
      .from('notes')
      .select('id, plant_id, note, household_member_id, created_at, photo_url')
      .in('plant_id', plantIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  activityFeed = buildActivityFeed(careRows, noteRows, plantMap, ownerMap);
}

// #418: ambient activity-feed refresh. A single visibility-gated interval that
// re-fetches ONLY the feed (not a full loadFromSupabase) so an open, foregrounded
// app picks up other members' activity without a reload, notification tap, or
// background→foreground transition (#417 gap). Additive alongside the #260
// visibilitychange reload and the #370 notification-tap handler. Started once from
// routeAfterAuth(); the module-level handle guards against duplicate intervals, so
// household switches reuse the same timer and pick up the new householdId next tick.
function startActivityFeedPoll() {
  if (activityFeedPollTimer !== null) return;
  activityFeedPollTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (!householdId || !currentMemberId) return;
    // Reuse the #260 open-sheet check so a tick never yanks state mid-edit.
    if (document.getElementById('sheet')?.classList.contains('active')) return;
    loadActivityFeed().then(() => renderApp());
  }, POLL_INTERVAL_MS);
}

// Shared by loadActivityFeed() and the batched load in loadFromSupabase().
// Merges care_log + note rows into the sorted, capped activity feed.
function buildActivityFeed(careRows, noteRows, plantMap, ownerMap) {
  const careItems = (careRows ?? []).map(r => ({
    type:      'care',
    sortKey:   r.created_at,
    plantId:   r.plant_id,
    plantName: plantMap[r.plant_id]?.name ?? '',
    taskName:  r.task_name,
    taskType:  r.task_type,
    member:    ownerMap[r.household_member_id] ?? '',
  }));

  const noteItems = (noteRows ?? []).map(r => ({
    type:      'note',
    sortKey:   r.created_at,
    noteId:    r.id,
    plantId:   r.plant_id,
    plantName: plantMap[r.plant_id]?.name ?? '',
    note:      r.note,
    member:    ownerMap[r.household_member_id] ?? '',
    photoUrl:  r.photo_url ?? null,
  }));

  return [...careItems, ...noteItems]
    .sort((a, b) => (b.sortKey ?? '').localeCompare(a.sortKey ?? ''))
    .slice(0, 15);
}

// ============================================================
// DATE UTILITIES
// ============================================================

function lastCareLabel(plant) {
  const entry = plant.careLog?.[0];
  if (!entry) return '';
  const dateStr = entry.date ?? (entry.createdAt ? entry.createdAt.split('T')[0] : null);
  if (!dateStr) return '';
  const when = relativeDaysLabel(dateStr);
  return `<div class="last-care-line">${t('home.lastCare')} ${escapeHtml(entry.taskName)} · ${when}</div>`;
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA');
}

// Returns b - a in whole days
function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / msPerDay);
}

// Formats an ISO timestamp as "2h ago", "Yesterday", "Mar 28", etc.
function formatActivityTime(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 60)  return diffMins <= 1 ? t('relativeTime.activity.justNow') : t('relativeTime.activity.minutesAgo', { n: diffMins });
  if (diffHours < 24) return t('relativeTime.activity.hoursAgo', { n: diffHours });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const entry = new Date(date); entry.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((today - entry) / 86400000);
  if (dayDiff === 1) return t('relativeTime.yesterday');
  return date.toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric' });
}

// Canonical day-granularity relative label (Brief #44c-2b). Consolidates the
// prior true-duplicate copies in lastCareLabel and the Summary tab (whose
// two-step lowercase-then-remap produced the same displayed strings). Returns
// "Today" / "Yesterday" / "{n} days ago" / "some time ago" (null/NaN).
function relativeDaysLabel(dateStr) {
  if (!dateStr) return t('relativeTime.someTimeAgo');
  const diff = daysBetween(dateStr, todayStr());
  if (isNaN(diff)) return t('relativeTime.someTimeAgo');
  if (diff <= 0)  return t('relativeTime.today');
  if (diff === 1) return t('relativeTime.yesterday');
  return tn('relativeTime.daysAgo', diff);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// Returns the nearest upcoming date (today or future) matching one of the given weekday numbers (0=Sun)
function nextWeekdayOccurrence(days, skipToday = false, anchor = todayStr()) {
  if (!days || days.length === 0) return anchor;
  const anchorDow = new Date(anchor + 'T12:00:00').getDay();
  for (let d = skipToday ? 1 : 0; d <= 7; d++) {
    if (days.includes((anchorDow + d) % 7)) return addDays(anchor, d);
  }
  return anchor;
}

// Returns the first yearly occurrence of month/day (1-based month) on or after
// fromDate. Steps by calendar year via setFullYear (NOT addDays(·,365), which
// drifts a day per leap year), so the month/day is preserved exactly. JS Date
// normalizes an out-of-range day, so a Feb-29 anchor resolves to Mar 1 in
// non-leap years. Noon-anchored, matching addDays()'s DST/UTC-safe convention.
function nextYearlyOccurrence(month, day, fromDate = todayStr()) {
  const fromYear = Number(fromDate.slice(0, 4));
  const occ = (y) => {
    const d = new Date(fromDate + 'T12:00:00');
    d.setFullYear(y, month - 1, day);
    return d.toISOString().split('T')[0];
  };
  const thisYear = occ(fromYear);
  return thisYear >= fromDate ? thisYear : occ(fromYear + 1);
}

// Computes the next due date for a task (ignoring pause state)
function computeNextDue(task) {
  if (task.nextDueOverride) {
    const recType = task.recurrenceType ?? 'interval';
    if (recType === 'weekdays') {
      const days = task.weekdays ?? [];
      if (days.includes(new Date(task.nextDueOverride + 'T12:00:00').getDay())) {
        return task.nextDueOverride;
      }
      return nextWeekdayOccurrence(days, false, task.nextDueOverride);
    }
    // yearly override is a literal date (like interval/one-off): return as-is.
    return task.nextDueOverride;
  }
  const recType = task.recurrenceType ?? 'interval';
  if (recType === 'one-off') {
    // null = complete (never show as due); todayStr() = pending (always due until done)
    return task.lastDone ? null : todayStr();
  }
  if (recType === 'weekdays') {
    const skipToday = task.lastDone === todayStr();
    return nextWeekdayOccurrence(task.weekdays ?? [], skipToday);
  }
  if (recType === 'yearly') {
    // Once completed (lastDone set), a yearly task always advances to the anchor
    // in the year AFTER lastDone's year — whether completion was before, on, or
    // after this year's anchor (#401-8). With no lastDone, use this year's anchor
    // if it hasn't passed relative to today, else next year's (Build 1 behavior).
    // Feb 29 → Mar 1 fallback comes from nextYearlyOccurrence in both paths.
    if (task.lastDone) {
      const nextYear = Number(task.lastDone.slice(0, 4)) + 1;
      return nextYearlyOccurrence(task.recurrenceMonth, task.recurrenceDay, `${nextYear}-01-01`);
    }
    return nextYearlyOccurrence(task.recurrenceMonth, task.recurrenceDay);
  }
  if (!task.lastDone) return todayStr();
  return addDays(task.lastDone, task.frequencyDays);
}

// True if task has a recurrence occurrence on dateStr, projecting forward from its next due date.
// Used by the Caring tab Upcoming section to render every occurrence within the 7-day window.
function taskOccursOnDate(task, dateStr) {
  const recType = task.recurrenceType ?? 'interval';
  const first = computeNextDue(task);
  if (first === null) return false;
  if (recType === 'one-off') return first === dateStr;
  if (first === dateStr) return true;
  if (dateStr < first) return false;
  if (recType === 'weekdays') {
    const weekdays = task.weekdays ?? [];
    if (weekdays.length === 0) return false;
    const dow = new Date(dateStr + 'T12:00:00').getDay();
    return weekdays.includes(dow);
  }
  if (recType === 'yearly') {
    // Occurs on dateStr iff it is the anchor's occurrence for dateStr's own year
    // (leap-year fallback respected: Feb 29 → Mar 1 in non-leap years).
    const year = dateStr.slice(0, 4);
    const occ  = nextYearlyOccurrence(task.recurrenceMonth, task.recurrenceDay, `${year}-01-01`);
    return occ === dateStr;
  }
  const interval = task.frequencyDays;
  if (!interval || interval <= 0) return false;
  return daysBetween(first, dateStr) % interval === 0;
}

// Positive = days remaining, 0 = due today, negative = overdue, Infinity = complete (one-off done)
function daysUntilDue(task) {
  const next = computeNextDue(task);
  if (next === null) return Infinity;
  return daysBetween(todayStr(), next);
}

function isDue(task) {
  if (task.paused) return false;
  if ((task.recurrenceType ?? 'interval') === 'weekdays' && task.lastDone === todayStr()) return false;
  return daysUntilDue(task) < 0;
}

function dueLabelAndClass(task) {
  const days = daysUntilDue(task);
  const manual = task.nextDueOverride ? t('status.badge.manualSuffix') : '';
  const recType = task.recurrenceType ?? 'interval';
  if (recType === 'one-off') {
    if (days === Infinity) return { label: t('status.badge.done'), cls: 'ok' };
    if (days > 0)  return { label: tn('status.badge.inDaysOneOff', days), cls: 'upcoming' };
    if (days === 0) return { label: t('status.badge.dueTodayOneOff'), cls: 'due' };
    return { label: t('status.badge.overdueOneOff'), cls: 'due' };
  }
  // "never done" only makes sense for interval tasks with no override
  if (recType === 'interval' && !task.lastDone && !task.nextDueOverride) {
    return { label: t('status.badge.dueTodayNeverDone'), cls: 'due' };
  }
  if (days < 0)   return { label: tn('status.badge.daysOverdue', Math.abs(days), { manual }), cls: 'due' };
  if (days === 0) return { label: t('status.badge.dueToday', { manual }), cls: 'due' };
  if (days === 1) return { label: t('status.badge.dueTomorrow', { manual }), cls: 'soon' };
  if (days <= 3)  return { label: t('status.badge.inDays', { n: days, manual }), cls: 'soon' };
  return { label: t('status.badge.inDays', { n: days, manual }), cls: 'ok' };
}

function lastDoneLabel(task) {
  if (!task.lastDone) return t('status.lastDone.never');
  const diff = daysBetween(task.lastDone, todayStr());
  if (diff === 0) return t('caring.doneToday');
  if (diff === 1) return t('status.lastDone.yesterday');
  return t('status.lastDone.daysAgo', { n: diff });
}

// Consolidated recurrence label (Brief #44c-2a). `opts` selects the display
// variant so both prior copies stay byte-identical:
//   • compact (default): 2-letter weekdays ("Su, We"), no prefix, "No days set"
//     empty — used by task cards/rows/carelog.
//   • verbose: 3-letter ("Every Sun, Wed"), "Days of week" empty, invalid-day
//     filter, interval default 1 — used by the Summary tab + task-row meta.
function recurrenceLabel(task, opts = {}) {
  const {
    weekdayStyle     = 'min',                         // 'min' → WEEKDAY_NAMES; 'abbr' → WEEKDAY_NAMES_ABBR
    everyPrefix      = false,                          // wrap weekday list in "Every {days}"
    weekdaysEmptyKey = 'status.recurrence.noDaysSet',
    filterInvalid    = false,                          // drop null/NaN/out-of-range weekday values
    freqFallback     = undefined,                      // interval frequency default (verbose passes 1)
  } = opts;
  const recType = task.recurrenceType ?? 'interval';
  if (recType === 'one-off') return t('status.recurrence.oneOff');
  if (recType === 'weekdays') {
    let days = task.weekdays ?? [];
    if (filterInvalid) days = days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6);
    days = days.slice().sort(compareWeekdaysMonFirst);
    if (days.length === 0) return t(weekdaysEmptyKey);
    const arr = weekdayStyle === 'abbr' ? WEEKDAY_NAMES_ABBR : WEEKDAY_NAMES;
    const list = days.map(d => arr[d]).join(', ');
    return everyPrefix ? t('status.recurrence.everyWeekdays', { days: list }) : list;
  }
  if (recType === 'yearly') {
    const m = task.recurrenceMonth, d = task.recurrenceDay;
    return (m && d) ? t('status.recurrence.everyYearOn', { month: YEARLY_MONTH_NAMES[m - 1], day: d }) : t('status.recurrence.everyYear');
  }
  return tn('status.recurrence.everyDays', task.frequencyDays ?? freqFallback);
}

// Verbose-variant opts, shared by the Summary tab and task-row meta line.
const RECURRENCE_VERBOSE_OPTS = { weekdayStyle: 'abbr', everyPrefix: true, weekdaysEmptyKey: 'status.recurrence.daysOfWeek', filterInvalid: true, freqFallback: 1 };

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric' });
}

function formatNoteDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString(displayLocale(), { hour: 'numeric', minute: '2-digit' });
}

// Returns the ISO date string of the Monday of the week containing dateStr
function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay(); // 0=Sun, 1=Mon...
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

// ============================================================
// DATA HELPERS
// ============================================================

function getPlant(id) {
  return plants.find(p => p.id === id);
}

function getTask(plantId, taskId) {
  return getPlant(plantId)?.tasks.find(t => t.id === taskId);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Returns config for a task, falling back to task.customName/customIcon for custom tasks
function getTaskConfig(task) {
  if (TASK_CONFIG[task.id]) return TASK_CONFIG[task.id];
  return {
    name: task.name ?? task.customName ?? task.id,
    icon: task.icon ?? task.customIcon ?? '🌿',
    type: task.type ?? 'custom',
  };
}

// ============================================================
// ACTIONS
// ============================================================

// Fire-and-forget coordination push via the notify-care-log Edge Function.
// `payload` carries an event_type discriminator ('task_done' | 'note_added' |
// 'task_reassigned') plus the fields that event needs. Recipient resolution and
// actor/owner exclusion happen server-side, keyed on household_member_id.
function notifyPush(payload) {
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-care-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ household_id: householdId, ...payload }),
  }).catch(() => {});
}

async function markTaskDone(plantId, taskId) {
  if (isSaving) return;
  isSaving = true;
  try {
  const plant = getPlant(plantId);
  const task = plant?.tasks.find(t => t.id === taskId);
  if (!task) return;

  // Capture pre-mark-done schedule so we can prompt to reschedule if the
  // completion is off the original due date. Skip one-off tasks entirely.
  const preRecType = task.recurrenceType ?? 'interval';
  const preDueDate = preRecType !== 'one-off' ? computeNextDue(task) : null;

  // #411: preserve pre-completion schedule state so undo can restore the exact
  // due date instead of re-anchoring to today. Capture BEFORE overwriting; the
  // restore is a verbatim field-copy, so it is recurrence-type-agnostic.
  const preCompletionLastDone = task.lastDone;
  const preCompletionOverride = task.nextDueOverride;

  task.lastDone = todayStr();
  task.nextDueOverride = null; // clear any manual override when marking done
  task.preCompletionLastDone = preCompletionLastDone;
  task.preCompletionNextDueOverride = preCompletionOverride;

  const taskCfg = getTaskConfig(task);
  // #434: attribute the completion to the actual actor (the logged-in member),
  // not the task's assigned owner. Assignment (task.owner) is unchanged.
  plant.careLog.unshift({
    id: uid(),
    date: todayStr(),
    createdAt: new Date().toISOString(),
    author: activeUser,
    taskId: task.id,
    taskName: taskCfg.name,
    taskType: taskCfg.type,
  });

  plant.careLog = plant.careLog.slice(0, 50);

  await supabaseClient
    .from('tasks')
    .update({
      last_done: todayStr(),
      next_due_override: null,
      pre_completion_last_done: preCompletionLastDone,
      pre_completion_next_due_override: preCompletionOverride,
    })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('markTaskDone task update error:', error); });
  await supabaseClient
    .from('care_log')
    .insert({
      plant_id:            plantId,
      task_id:             taskId,
      household_member_id: currentMemberId,
      task_name:           taskCfg.name,
      task_type:           taskCfg.type,
      date:                todayStr(),
    })
    .then(({ error }) => {
      if (error) { console.error('markTaskDone care_log insert error:', error); return; }
      posthog.capture('task_completed', {
        plant_id:  plantId,
        task_type: task.type,
        task_name: task.name,
      });

      // #370: only notify once the care_log row is confirmed written, so a
      // recipient tapping the push always finds the entry in Recent Activity.
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-care-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          event_type:      'task_done',
          care_log_id:     null,
          plant_name:      plant.name,
          task_name:       taskCfg.name,
          task_type:       taskCfg.type,
          actor_name:      activeUser,
          actor_member_id: currentMemberId,
          household_id:    householdId,
        }),
      }).catch(() => {});
    });

  loadActivityFeed().then(() => { if (state.view === 'home') renderHome(); });

  if (preDueDate) {
    const displacement = daysBetween(preDueDate, todayStr());
    const every = task.frequencyDays;
    const isExactIntervalMultiple = preRecType === 'interval' && every > 0 && displacement % every === 0;
    if (Math.abs(displacement) >= 1 && !isExactIntervalMultiple) {
      showReschedulePrompt(plantId, taskId, displacement, preDueDate);
    }
  }
  } finally {
    isSaving = false;
  }
}

async function undoMarkTaskDone(plantId, taskId) {
  const plant = getPlant(plantId);
  const task = plant?.tasks.find(t => t.id === taskId);
  if (!task) return;

  // #411: restore the exact pre-completion schedule captured at mark-done time
  // rather than nulling (which made computeNextDue() re-anchor to today). Copy
  // verbatim — recurrence-type-agnostic — then clear the capture columns.
  const restoreLastDone = task.preCompletionLastDone ?? null;
  const restoreOverride = task.preCompletionNextDueOverride ?? null;
  task.lastDone = restoreLastDone;
  task.nextDueOverride = restoreOverride;
  task.preCompletionLastDone = null;
  task.preCompletionNextDueOverride = null;

  // Remove the most recent care log entry for this task (today's entry)
  const idx = plant.careLog.findIndex(e => e.taskId === taskId && e.date === todayStr());
  if (idx !== -1) plant.careLog.splice(idx, 1);

  await supabaseClient
    .from('tasks')
    .update({
      last_done: restoreLastDone,
      next_due_override: restoreOverride,
      pre_completion_last_done: null,
      pre_completion_next_due_override: null,
    })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('undoMarkTaskDone task update error:', error); });
  await supabaseClient
    .from('care_log')
    .delete()
    .eq('plant_id', plantId)
    .eq('task_id', taskId)
    .eq('date', todayStr())
    .then(({ error }) => { if (error) console.error('undoMarkTaskDone care_log delete error:', error); });
}

async function reassignTask(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (!task) return;
  task.owner = task.owner === 'Matu' ? 'Vale' : 'Matu';

  const member = membersCache.find(m => m.display_name === task.owner);
  await supabaseClient
    .from('tasks')
    .update({ owner_id: member?.id ?? null })
    .eq('id', taskId)
    .then(({ error }) => {
      if (error) { console.error('reassignTask error:', error); return; }
      if (member?.id) {
        notifyPush({
          event_type:          'task_reassigned',
          plant_name:          getPlant(plantId)?.name,
          task_name:           task.name,
          recipient_member_id: member.id,
        });
      }
    });
}

async function skipTask(plantId, taskId) {
  if (isSaving) return;
  isSaving = true;
  try {
    const plant = getPlant(plantId);
    const task  = plant?.tasks.find(t => t.id === taskId);
    if (!task) return;
    if ((task.recurrenceType ?? 'interval') === 'one-off') return;

    const today = todayStr();

    // Weekday tasks have no frequencyDays — skip to the next selected weekday
    // strictly after today. Mirrors the interval pattern below.
    if ((task.recurrenceType ?? task.recurrence?.type) === 'weekdays') {
      const newOverride = nextWeekdayOccurrence(task.weekdays, true);
      const cfg = getTaskConfig(task);
      plant.careLog.unshift({
        id: uid(),
        date: today,
        createdAt: new Date().toISOString(),
        author: activeUser,
        taskId: task.id,
        taskName: cfg.name,
        taskType: 'skipped',
      });
      plant.careLog = plant.careLog.slice(0, 50);

      await updateTask(plantId, taskId, { nextDueOverride: newOverride });

      await supabaseClient
        .from('care_log')
        .insert({
          plant_id:            plantId,
          task_id:             taskId,
          household_member_id: currentMemberId,
          task_name:           cfg.name,
          task_type:           'skipped',
          date:                today,
        });

      await loadActivityFeed();
      return;
    }

    // Yearly tasks skip to next year's occurrence: step strictly past the date
    // the task is currently sitting on (computeNextDue), so a skip never returns
    // the same date. Feb 29 → Mar 1 fallback comes from nextYearlyOccurrence.
    // Writes next_due_override the same way the interval branch does.
    if ((task.recurrenceType ?? task.recurrence?.type) === 'yearly') {
      if (task.recurrenceMonth == null || task.recurrenceDay == null) return;
      const currentDue = computeNextDue(task);
      if (!currentDue) return;
      const newOverride = nextYearlyOccurrence(task.recurrenceMonth, task.recurrenceDay, addDays(currentDue, 1));
      const cfg = getTaskConfig(task);
      plant.careLog.unshift({
        id: uid(),
        date: today,
        createdAt: new Date().toISOString(),
        author: activeUser,
        taskId: task.id,
        taskName: cfg.name,
        taskType: 'skipped',
      });
      plant.careLog = plant.careLog.slice(0, 50);

      await updateTask(plantId, taskId, { nextDueOverride: newOverride });

      await supabaseClient
        .from('care_log')
        .insert({
          plant_id:            plantId,
          task_id:             taskId,
          household_member_id: currentMemberId,
          task_name:           cfg.name,
          task_type:           'skipped',
          date:                today,
        });

      await loadActivityFeed();
      return;
    }

    const every = task.frequencyDays;
    if (!every || every < 1) return;

    // Anchor = most recent due date ≤ today.
    let anchor;
    if (task.nextDueOverride) {
      anchor = task.nextDueOverride;
    } else if (!task.lastDone) {
      anchor = today;
    } else {
      anchor = task.lastDone;
      while (addDays(anchor, every) <= today) {
        anchor = addDays(anchor, every);
      }
    }
    const newOverride = addDays(anchor, every);

    const cfg = getTaskConfig(task);
    plant.careLog.unshift({
      id: uid(),
      date: today,
      createdAt: new Date().toISOString(),
      author: activeUser,
      taskId: task.id,
      taskName: cfg.name,
      taskType: 'skipped',
    });
    plant.careLog = plant.careLog.slice(0, 50);

    await updateTask(plantId, taskId, { nextDueOverride: newOverride });

    await supabaseClient
      .from('care_log')
      .insert({
        plant_id:            plantId,
        task_id:             taskId,
        household_member_id: currentMemberId,
        task_name:           cfg.name,
        task_type:           'skipped',
        date:                today,
      })
      .then(({ error }) => {
        if (error) { console.error('skipTask care_log insert error:', error); return; }
        posthog.capture('task_skipped', {
          plant_id:  plantId,
          task_type: task.type,
          task_name: task.name,
        });
      });

    loadActivityFeed();
  } finally {
    isSaving = false;
  }
}

async function updateTask(plantId, taskId, updates) {
  const task = getTask(plantId, taskId);
  if (!task) return;
  const prevOwner = task.owner; // capture before mutation to detect a real reassignment
  Object.assign(task, updates);

  const dbUpdates = {};

  if ('lastDone'        in updates) dbUpdates.last_done         = updates.lastDone;
  if ('nextDueOverride' in updates) dbUpdates.next_due_override = updates.nextDueOverride;
  if ('paused'          in updates) dbUpdates.paused            = updates.paused;
  if ('note'            in updates) dbUpdates.note              = updates.note;
  if ('name'            in updates) dbUpdates.name              = updates.name;
  if ('icon'            in updates) dbUpdates.icon              = updates.icon;

  // Fire a reassignment push only when the owner actually changed — the sheet
  // save always includes `owner`, so an unchanged owner must not notify.
  let reassignMember = null;
  if ('owner' in updates) {
    const member = membersCache.find(m => m.display_name === updates.owner);
    dbUpdates.owner_id = member?.id ?? null;
    if (updates.owner !== prevOwner && member?.id) reassignMember = member;
  }

  const recurrenceFields = ['recurrenceType', 'frequencyDays', 'recurrenceUnit', 'weekdays', 'recurrenceMonth', 'recurrenceDay'];
  if (recurrenceFields.some(f => f in updates)) {
    dbUpdates.recurrence = task.recurrenceType === 'one-off'
      ? { type: 'one-off' }
      : task.recurrenceType === 'yearly'
      ? { type: 'yearly', month: task.recurrenceMonth, day: task.recurrenceDay }
      : { type: task.recurrenceType, every: task.frequencyDays, unit: task.recurrenceUnit ?? 'days', days: task.weekdays ?? [] };
  }

  if (Object.keys(dbUpdates).length === 0) return;

  await supabaseClient
    .from('tasks')
    .update(dbUpdates)
    .eq('id', taskId)
    .then(({ error }) => {
      if (error) { console.error('updateTask error:', error); return; }
      if (reassignMember) {
        notifyPush({
          event_type:          'task_reassigned',
          plant_name:          getPlant(plantId)?.name,
          task_name:           task.name,
          recipient_member_id: reassignMember.id,
        });
      }
    });
}

async function pauseTask(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (task) { task.paused = true; }

  await supabaseClient
    .from('tasks')
    .update({ paused: true })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('pauseTask error:', error); });
}

async function resumeTask(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (task) { task.paused = false; }

  await supabaseClient
    .from('tasks')
    .update({ paused: false })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('resumeTask error:', error); });
}

async function deleteTask(plantId, taskId) {
  if (isSaving) return;
  isSaving = true;
  try {
    const plant = getPlant(plantId);
    if (!plant) return;
    plant.tasks = plant.tasks.filter(t => t.id !== taskId);

    await supabaseClient
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId)
      .then(({ error }) => { if (error) console.error('deleteTask error:', error); });
  } finally {
    isSaving = false;
  }
}

async function deletePlant(plantId) {
  if (isSaving) return;
  isSaving = true;
  try {
    const now = new Date().toISOString();

    await Promise.all([
      supabaseClient
        .from('plants')
        .update({ deleted_at: now })
        .eq('id', plantId)
        .then(({ error }) => { if (error) console.error('deletePlant plants error:', error); }),
      supabaseClient
        .from('tasks')
        .update({ deleted_at: now })
        .eq('plant_id', plantId)
        .is('deleted_at', null)
        .then(({ error }) => { if (error) console.error('deletePlant tasks error:', error); }),
    ]);

    plants = plants.filter(p => p.id !== plantId);
  } finally {
    isSaving = false;
  }
}

async function addNote(plantId, noteText, taskId, photoUrl = null) {
  if (isSaving) return null;
  isSaving = true;
  try {
    const member = membersCache.find(m => m.display_name === activeUser);
    const insertData = { plant_id: plantId, household_member_id: member?.id ?? null, note: noteText, task_id: taskId ?? null };
    if (photoUrl) insertData.photo_url = photoUrl;
    const { data: inserted, error } = await supabaseClient
      .from('notes')
      .insert(insertData)
      .select()
      .single();
    if (error) { console.error('addNote error:', error); return null; }
    notifyPush({
      event_type:      'note_added',
      plant_name:      getPlant(plantId)?.name,
      actor_name:      activeUser,
      actor_member_id: currentMemberId,
    });
    const newNote = {
      id:        inserted.id,
      plantId:   inserted.plant_id,
      memberId:  inserted.household_member_id,
      author:    activeUser,
      note:      inserted.note,
      createdAt: inserted.created_at,
      taskId:    inserted.task_id ?? null,
      photoUrl:  inserted.photo_url ?? null,
    };
    notes.unshift(newNote);
    await loadActivityFeed();
    return newNote;
  } finally {
    isSaving = false;
  }
}

async function deleteNote(noteId) {
  if (isSaving) return;
  isSaving = true;
  try {
    const { data: photoRows, error: photoFetchErr } = await supabaseClient
      .from('plant_photos')
      .select('id, storage_url, note_id')
      .eq('note_id', noteId);
    if (photoFetchErr) console.error('deleteNote: plant_photos fetch error:', photoFetchErr);

    if (photoRows?.length) {
      for (const photoRow of photoRows) {
        await deletePlantPhoto(photoRow);
      }
    } else {
      const inMemNote = notes.find(n => n.id === noteId);
      if (inMemNote?.photoUrl) {
        const path = storagePathFromPublicUrl(inMemNote.photoUrl);
        if (path) {
          const { error: storageErr } = await supabaseClient.storage.from(PLANT_PHOTOS_BUCKET).remove([path]);
          if (storageErr) console.error('deleteNote storage cleanup error:', storageErr);
        }
      }
    }

    const { error } = await supabaseClient
      .from('notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', noteId);
    if (error) { console.error('deleteNote error:', error); return; }
    notes = notes.filter(n => n.id !== noteId);
  } finally {
    isSaving = false;
  }
}

async function updateNote(noteId, newText) {
  const { error } = await supabaseClient
    .from('notes')
    .update({ note: newText })
    .eq('id', noteId);
  if (error) { console.error('updateNote error:', error); return; }
  const n = notes.find(n => n.id === noteId);
  if (n) n.note = newText;
}

const PLANT_PHOTOS_BUCKET = 'plant-photos';
const PHOTO_CAP_PER_PLANT = 5;

function plantIconImgHtml(photoUrl, sizePx, radiusCss) {
  return `<img loading="lazy" src="${escapeHtml(photoUrl)}" alt="" style="width:${sizePx}px;height:${sizePx}px;object-fit:cover;border-radius:${radiusCss};border:1.5px solid #c8c8c8;box-sizing:border-box;display:inline-block;vertical-align:middle;flex-shrink:0;" />`;
}

async function compressImage(file, maxDim = 1200, quality = 0.8) {
  const objUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Image load failed'));
      i.src = objUrl;
    });
    let { width, height } = img;
    if (width >= height && width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width  = maxDim;
    } else if (height > maxDim) {
      width  = Math.round((width * maxDim) / height);
      height = maxDim;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    return await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
  } finally {
    URL.revokeObjectURL(objUrl);
  }
}

async function uploadPlantPhoto(blob, plantId) {
  const path = `${plantId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error } = await supabaseClient.storage
    .from(PLANT_PHOTOS_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(PLANT_PHOTOS_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

function storagePathFromPublicUrl(url) {
  if (!url) return null;
  const m = url.match(new RegExp(`/${PLANT_PHOTOS_BUCKET}/(.+)$`));
  return m ? m[1] : null;
}

async function countPlantPhotos(plantId) {
  const { count, error } = await supabaseClient
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('plant_id', plantId)
    .not('photo_url', 'is', null)
    .is('deleted_at', null);
  if (error) { console.error('countPlantPhotos error:', error); return 0; }
  return count ?? 0;
}

async function fetchLastPlantPhoto(plantId) {
  const { data, error } = await supabaseClient
    .from('plant_photos')
    .select('id, plant_id, note_id, storage_url, created_at')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) { console.error('fetchLastPlantPhoto error:', error); return null; }
  return data?.[0] ?? null;
}

async function fetchAllPlantPhotos(plantId) {
  const { data, error } = await supabaseClient
    .from('plant_photos')
    .select('id, plant_id, note_id, storage_url, created_at')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchAllPlantPhotos error:', error); return []; }
  return data ?? [];
}

async function deletePlantPhoto(photoRow) {
  const path = storagePathFromPublicUrl(photoRow.storage_url);
  if (path) {
    const { error: storageErr } = await supabaseClient.storage.from(PLANT_PHOTOS_BUCKET).remove([path]);
    if (storageErr) console.error('deletePlantPhoto storage error:', storageErr);
  }
  const { error: rowErr } = await supabaseClient.from('plant_photos').delete().eq('id', photoRow.id);
  if (rowErr) console.error('deletePlantPhoto row error:', rowErr);
  if (photoRow.note_id) {
    await supabaseClient.from('notes').update({ photo_url: null }).eq('id', photoRow.note_id);
    const note = notes.find(n => n.id === photoRow.note_id);
    if (note) note.photoUrl = null;
  }
}

async function deleteOldestPlantPhoto(plantId) {
  const { data, error } = await supabaseClient
    .from('plant_photos')
    .select('id, plant_id, note_id, storage_url, created_at')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error || !data?.[0]) return;
  await deletePlantPhoto(data[0]);
}

async function runSaveNoteFlow(plantId) {
  console.log('[saveNote] ENTER', { plantId, sheetData: state.sheetData, isSaving });
  const textEl = document.getElementById('sheet-note-text');
  const text = (textEl?.value ?? state.sheetData?.pendingText ?? '').trim();
  if (!text && !state.sheetData?.pendingPhoto) { alert(t('dialog.alertNoteOrPhoto')); return; }
  state.sheetData.pendingText = text;

  const pendingPhoto = state.sheetData?.pendingPhoto;
  console.log('[saveNote] pendingPhoto snapshot', {
    hasPhoto: !!pendingPhoto,
    blobSize: pendingPhoto?.blob?.size,
    blobType: pendingPhoto?.blob?.type,
    previewUrl: pendingPhoto?.previewUrl,
  });

  // Photo cap check before upload
  if (pendingPhoto) {
    const count = await countPlantPhotos(plantId);
    console.log('[saveNote] photo count for plant', { plantId, count });
    if (count >= PHOTO_CAP_PER_PLANT) {
      console.log('[saveNote] cap reached, switching to cap sheet');
      renderPhotoCapSheet(plantId);
      return;
    }
  }

  const saveBtn = document.querySelector('#sheet [data-action="sheet-save-note"]');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = t('notes.saving'); }

  try {
    let photoUrl = null;
    if (pendingPhoto) {
      console.log('[saveNote] uploading photo to storage…');
      const upRes = await uploadPlantPhoto(pendingPhoto.blob, plantId);
      photoUrl = upRes.publicUrl;
      console.log('[saveNote] upload OK', { path: upRes.path, publicUrl: photoUrl });
      posthog.capture('photo_added', { plant_id: plantId });
    } else {
      console.log('[saveNote] no photo — skipping upload');
    }

    console.log('[saveNote] inserting note row', { plantId, photoUrl });
    const newNote = await addNote(plantId, text, null, photoUrl);
    console.log('[saveNote] addNote returned', { newNote });
    if (!newNote) throw new Error('Note insert failed');
    posthog.capture('note_added', { plant_id: plantId, has_photo: !!photoUrl });

    if (photoUrl && newNote.id) {
      console.log('[saveNote] inserting plant_photos row', { plantId, noteId: newNote.id, photoUrl });
      const ppRes = await supabaseClient
        .from('plant_photos')
        .insert({ plant_id: plantId, note_id: newNote.id, storage_url: photoUrl });
      console.log('[saveNote] plant_photos insert response', ppRes);
    } else {
      console.log('[saveNote] skipping plant_photos insert', { photoUrl, newNoteId: newNote.id });
    }

    if (pendingPhoto?.previewUrl) URL.revokeObjectURL(pendingPhoto.previewUrl);
    state.sheetData.pendingPhoto = null;
    state.sheetData.pendingText = '';

    closeSheet();
    if (state.view === 'home') {
      renderHome();
      showToast(t('menu.toast.noteAdded'));
    } else if (state.view === 'plant' && plantDetailTab === 'tasks') {
      renderPlantDetail(plantId);
      showToast(t('menu.toast.noteAdded'));
    } else {
      renderPlantDetail(plantId);
    }
    console.log('[saveNote] DONE');
  } catch (err) {
    console.error('[saveNote] FAILED', err);
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('auth.reset.save'); }
    showToast(t('menu.toast.couldNotSaveTapRetry'));
  }
}

function updatePlantInfo(plantId, updates) {
  const plant = getPlant(plantId);
  if (!plant) return;
  Object.assign(plant, updates);
}

// ============================================================
// TOAST
// ============================================================

function showToast(message, opts = {}) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = message;
  toast.classList.toggle('toast--interactive', !!opts.interactive);
  if (opts.data) {
    Object.assign(toast.dataset, opts.data);
  } else {
    delete toast.dataset.action;
    delete toast.dataset.plant;
    delete toast.dataset.task;
  }
  toast.classList.add('visible');
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => {
    // Hide AND fully reset interactive state, so a faded toast is no longer a
    // clickable target (pointer-events reverts to none) and carries no stale
    // action. Mirrors the non-interactive else-branch above.
    toast.classList.remove('visible', 'toast--interactive');
    delete toast.dataset.action;
    delete toast.dataset.plant;
    delete toast.dataset.task;
  }, opts.duration ?? 2500);
}

function showDoneToast(plantId, taskId, taskName) {
  showToast(
    `&#10003; ${t('menu.toast.markedDone', { task: escapeHtml(taskName) })} &middot; <span class="toast-link">${t('menu.toast.addNotePrompt')}</span>`,
    { interactive: true, duration: 4000, data: { action: 'toast-add-note', plant: plantId, task: taskId } }
  );
}

function showUndoDoneToast(plantId, taskId, taskName, plantName) {
  showToast(
    `&#10003; ${escapeHtml(taskName)} &middot; ${escapeHtml(plantName)} &middot; <span class="toast-link">${t('menu.toast.undo')}</span>`,
    { interactive: true, duration: 4000, data: { action: 'caring-undo-done', plant: plantId, task: taskId } }
  );
}

// ============================================================
// PLANT EMOJI PICKER
// ============================================================

const EMOJI_CATEGORIES = {
  foliage: ['🌱','🪴','🌿','🍃','🎋','🎍','🌾','🍀','🌵','🌲','🌳','🌴','🫘'],
  flowers: ['🌸','🌺','🌻','🌹','🌷','💐','🪷','🌼'],
  edibles: ['🍊','🍋','🍇','🍓','🫐','🥦','🌶️','🧅','🧄','🍄','🥕','🍅','🌽','🥬'],
};
const PLANT_EMOJIS = [
  ...EMOJI_CATEGORIES.foliage,
  ...EMOJI_CATEGORIES.flowers,
  ...EMOJI_CATEGORIES.edibles,
];

function renderEmojiPickerHtml(currentEmoji) {
  const gridItems = PLANT_EMOJIS.map(e => {
    const sel = e === currentEmoji ? ' selected' : '';
    return `<div class="emoji-option${sel}" data-action="pick-plant-emoji" data-emoji="${e}">${e}</div>`;
  }).join('');
  const customVal = PLANT_EMOJIS.includes(currentEmoji) ? '' : (currentEmoji ?? '');
  return `
    <div class="emoji-picker-grid">${gridItems}</div>
    <div class="emoji-custom-row">
      <input type="text" class="form-input" id="sheet-plant-emoji" placeholder="${t('emojiPicker.pastePlaceholder')}" autocomplete="off" value="${escapeHtml(customVal)}">
    </div>`;
}

// ============================================================
// ADD PLANT — THREE-STEP FLOW
// ============================================================

function renderAddPlantEmojiItems(emojis, selectedEmoji) {
  return emojis.map(e => {
    const sel = e === selectedEmoji ? ' selected' : '';
    return `<div class="emoji-option${sel}" data-action="pick-plant-emoji" data-emoji="${e}">${e}</div>`;
  }).join('');
}

function renderAddPlantProgressDots(currentStep) {
  return `<div class="add-plant-progress-dots">
    ${[1, 2, 3].map(s => {
      const cls = s < currentStep ? 'done' : s === currentStep ? 'active' : 'pending';
      return `<span class="add-plant-dot add-plant-dot--${cls}"></span>`;
    }).join('')}
  </div>`;
}

function renderAddPlantStep1Html(activeTab, selectedEmoji, pendingPhoto) {
  const emojis = activeTab === 'all' ? PLANT_EMOJIS : (EMOJI_CATEGORIES[activeTab] ?? PLANT_EMOJIS);
  const isEditFlow = state.sheetMode === 'edit-plant';
  const showPhotoUI = state.sheetMode === 'add-plant' || isEditFlow;
  const hasPhoto = showPhotoUI && !!pendingPhoto?.previewUrl;
  const grayedStyle = hasPhoto ? 'opacity:0.38;pointer-events:none;' : '';
  const gridGrayedStyle = hasPhoto ? 'opacity:0.38;pointer-events:none;filter:grayscale(1);' : '';
  const dividerGrayedStyle = hasPhoto ? 'opacity:0.38;' : '';

  const photoRowHtml = hasPhoto ? `
    <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #e5e5e5;border-radius:10px;margin-top:12px;">
      <img loading="lazy" src="${escapeHtml(pendingPhoto.previewUrl)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;border:1.5px solid #c8c8c8;flex-shrink:0;" />
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:15px;">${t('addPlant.photo.added')}</div>
        <div style="color:#6b7280;font-size:13px;margin-top:2px;">${t('addPlant.photo.usedAsIcon')}</div>
      </div>
      <button type="button" data-action="add-plant-remove-photo" style="flex-shrink:0;padding:8px 12px;background:#fff5f5;border:0.5px solid #f0c0c0;color:#c0392b;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">${t('addPlant.photo.remove')}</button>
    </div>` : `
    <div data-action="add-plant-pick-photo" style="display:flex;align-items:center;gap:12px;padding:12px;background:#eef5ee;border:1px solid #a8c4a8;border-radius:10px;margin-top:12px;cursor:pointer;">
      <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📷</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:15px;">${t('addPlant.photo.addInstead')}</div>
        <div style="color:#6b7280;font-size:13px;margin-top:2px;">${t('addPlant.photo.later')}</div>
      </div>
      <div style="flex-shrink:0;color:#9ca3af;font-size:20px;">›</div>
    </div>`;

  return `
    ${renderAddPlantProgressDots(1)}
    <div class="sheet-title">${t('addPlant.step1.title')}</div>
    <div class="add-plant-subtitle">${t('addPlant.step1.subtitle')}</div>
    <div class="emoji-cat-tabs" style="${grayedStyle}">
      <button class="emoji-cat-tab${activeTab === 'all' ? ' active' : ''}" data-action="add-plant-tab" data-tab="all">${t('addPlant.tab.all')}</button>
      <button class="emoji-cat-tab${activeTab === 'foliage' ? ' active' : ''}" data-action="add-plant-tab" data-tab="foliage">${t('addPlant.tab.foliage')}</button>
      <button class="emoji-cat-tab${activeTab === 'flowers' ? ' active' : ''}" data-action="add-plant-tab" data-tab="flowers">${t('addPlant.tab.flowers')}</button>
      <button class="emoji-cat-tab${activeTab === 'edibles' ? ' active' : ''}" data-action="add-plant-tab" data-tab="edibles">${t('addPlant.tab.edibles')}</button>
    </div>
    <div class="add-plant-emoji-grid" id="add-plant-emoji-grid" style="${gridGrayedStyle}">
      ${renderAddPlantEmojiItems(emojis, selectedEmoji)}
    </div>
    ${showPhotoUI ? `
    <div style="display:flex;align-items:center;gap:10px;margin-top:14px;color:#9ca3af;font-size:13px;${dividerGrayedStyle}">
      <div style="flex:1;height:1px;background:#e5e5e5;"></div>
      <div>${t('addPlant.photo.divider')}</div>
      <div style="flex:1;height:1px;background:#e5e5e5;"></div>
    </div>
    ${photoRowHtml}
    <input type="file" id="add-plant-file-input" accept="image/*" hidden />` : ''}
    ${isEditFlow ? `
    <div class="sheet-actions" style="margin-top:16px;display:flex;gap:8px;">
      <button class="btn btn-ghost" data-action="edit-plant-change-cancel" style="flex:1;">${t('taskSheet.cancel')}</button>
      <button class="btn btn-primary" data-action="add-plant-next" style="flex:1;">${t('addPlant.done')}</button>
    </div>` : `
    <div class="sheet-actions" style="margin-top:16px;display:flex;gap:8px;">
      <button class="btn btn-ghost" data-action="sheet-cancel" style="flex:1;">${t('taskSheet.cancel')}</button>
      <button class="btn btn-primary" data-action="add-plant-next" style="flex:1;">${t('addPlant.next')}</button>
    </div>`}`;
}

function renderAddPlantStep2Html(selectedEmoji) {
  return `
    ${renderAddPlantProgressDots(2)}
    <div class="add-plant-step-emoji-tile">${escapeHtml(selectedEmoji)}</div>
    <div class="add-plant-step-heading">${t('addPlant.step2.heading')}</div>
    <div class="add-plant-step-subtext">${t('addPlant.step2.subtext')}</div>
    <div class="ap2-field-label">${t('addPlant.step2.nameLabel')}</div>
    <input type="text" class="form-input" id="sheet-plant-name" placeholder="${t('addPlant.step2.namePlaceholder')}" autocomplete="off">
    <div class="ap2-input-hint">${t('addPlant.step2.nameHint')}</div>
    <div id="add-plant-duplicate-nudge" class="duplicate-nudge" style="display:none;margin-bottom:12px;"></div>
    <div class="sheet-actions" style="margin-top:16px;">
      <button class="btn btn-primary" data-action="add-plant-to-step3" id="ap2-next-btn" style="flex:1;opacity:0.4;" disabled>${t('addPlant.next')}</button>
    </div>
    <button class="add-plant-back-link" data-action="add-plant-back">← ${t('taskSheet.back')}</button>`;
}

function renderAddPlantStep3Html(selectedEmoji, plantName) {
  const curYear = new Date().getFullYear();
  return `
    ${renderAddPlantProgressDots(3)}
    <div class="add-plant-step-emoji-tile">${escapeHtml(selectedEmoji)}</div>
    <div class="add-plant-step-heading">${t('addPlant.step3.heading', { name: escapeHtml(plantName || '') })}</div>
    <div class="add-plant-step-subtext">${t('addPlant.step3.subtext')}</div>
    <div class="ap3-arrival-card" id="ap3-arrival-card">
      <div class="ap3-arrival-top-row">
        <span class="ap3-arrival-card-icon">📅</span>
        <div>
          <div class="ap3-arrival-card-title">${t('addPlant.arrivalDate.label')}</div>
          <div class="ap3-arrival-card-optional">${t('addPlant.arrivalDate.optional')}</div>
        </div>
      </div>
      ${renderDateSelectHtml('arrival', null, 2000, curYear)}
    </div>
    <div class="sheet-actions" style="margin-top:auto;">
      <button class="btn btn-primary" data-action="sheet-save-new-plant" style="flex:1;">${t('addPlant.step3.addButton', { name: escapeHtml(plantName || '') })}</button>
    </div>
    <button class="add-plant-back-link" data-action="add-plant-back">← ${t('taskSheet.back')}</button>`;
}

function attachAddPlantNameListener() {
  const nameInput = document.getElementById('sheet-plant-name');
  if (!nameInput) return;

  // B19: lift sheet above iOS software keyboard
  if (window.visualViewport) {
    const sheet = document.getElementById('sheet');
    let vvListener = null;

    function onVVResize() {
      const vv = window.visualViewport;
      const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (sheet) sheet.style.transform = kh > 0 ? `translateY(-${kh}px)` : '';
    }

    nameInput.addEventListener('focus', () => {
      vvListener = onVVResize;
      window.visualViewport.addEventListener('resize', vvListener);
      onVVResize();
    });

    nameInput.addEventListener('blur', () => {
      if (vvListener) {
        window.visualViewport.removeEventListener('resize', vvListener);
        vvListener = null;
      }
      if (sheet) sheet.style.transform = '';
    });
  }

  nameInput.addEventListener('input', function() {
    const val = this.value.trim();
    const nudge = document.getElementById('add-plant-duplicate-nudge');
    if (!nudge) return;
    const isDuplicate = val && plants.some(p => p.name.toLowerCase() === val.toLowerCase());
    if (isDuplicate) {
      nudge.style.display = '';
      nudge.innerHTML = `
        <div class="duplicate-nudge-title">${t('addPlant.duplicate.title', { name: escapeHtml(val) })}</div>
        <div class="duplicate-nudge-body">${t('addPlant.duplicate.body', { name: escapeHtml(val) })}</div>
        <input type="text" class="form-input" id="sheet-plant-alt-name" placeholder="${t('addPlant.duplicate.altPlaceholder')}" autocomplete="off" style="margin-top:8px;">`;
    } else {
      nudge.style.display = 'none';
      nudge.innerHTML = '';
    }
  });
}

function attachAddPlantStep2State() {
  const nameInput = document.getElementById('sheet-plant-name');
  const nextBtn   = document.getElementById('ap2-next-btn');
  if (!nameInput || !nextBtn) return;
  function update() {
    const empty = nameInput.value.trim().length === 0;
    nextBtn.disabled     = empty;
    nextBtn.style.opacity = empty ? '0.4' : '1';
  }
  nameInput.addEventListener('input', update);
  update();
}

// ============================================================
// RENDER: HOME
// ============================================================

const FEEDBACK_BUBBLE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
// #400: chevron-right on the plant-detail title (tappable → Edit Plant). Inline
// SVG (matches the repo's icon convention) since no Tabler webfont is loaded.
const CHEVRON_RIGHT_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;

function renderHeaderRight() {
  const activeMember = membersCache.find(m => m.display_name === activeUser);
  const userColor    = activeMember?.color ?? '#2e7d51';
  const initial      = (activeUser ?? '?')[0].toUpperCase();
  return `
    <div class="header-right">
      <button class="header-flag-btn" data-action="feedback" aria-label="${t('home.aria.reportBug')}">🚩</button>
      <button class="user-initial-circle" data-action="open-menu" style="background:${escapeHtml(userColor)}">${escapeHtml(initial)}</button>
    </div>`;
}

function renderHomeDueToday() {
  const allItems = [];
  for (const plant of plants) {
    for (const task of plant.tasks) {
      if (task.paused) continue;
      if (!matchesFilter(task.owner)) continue;
      const days = daysUntilDue(task);
      if (days === 0) {
        allItems.push({ plant, task, days, overdue: false });
      } else if (days < 0) {
        allItems.push({ plant, task, days, overdue: true });
      }
    }
  }
  if (allItems.length === 0) {
    // Congrats state: show if any plants were cared for today
    const caredNames = [];
    const caredSeen = new Set();
    for (const plant of plants) {
      if (!caredSeen.has(plant.id) && plant.careLog.some(e => e.date === todayStr())) {
        caredNames.push(plant.name);
        caredSeen.add(plant.id);
      }
    }
    if (caredNames.length === 0) return '';
    const plantNamesHtml = caredNames.map(n => escapeHtml(n)).join(' · ');
    return `<div class="home-section-header">
    <div class="home-section-header-accent" style="background:#2e7d32;"></div>
    <span class="home-section-header-text" style="color:#2e7d32;">${t('home.needsAttention')}</span>
  </div>
  <div class="home-activity-feed">
    <div class="needs-attention-list">
      <div class="attention-done-row">
        <span class="attention-done-tile">🏆</span>
        <span class="home-due-today-info">
          <span style="font-size:13px;font-weight:500;color:#2e7d32;">${t('home.allDoneToday')}</span>
          <span style="font-size:11px;color:#5a8c58;">${plantNamesHtml}</span>
        </span>
      </div>
    </div>
  </div>`;
  }

  // Sort: overdue first (most days late = most negative = first), then due today
  allItems.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return a.days - b.days;
  });

  let html = `<div class="home-section-header">
    <div class="home-section-header-accent" style="background:#e24b4a;"></div>
    <span class="home-section-header-text">${t('home.needsAttention')}</span>
  </div>`;

  html += `<div class="home-activity-feed"><div class="needs-attention-list">`;

  for (const { plant, task, days, overdue } of allItems) {
    const cfg = getTaskConfig(task);
    const ownerMember = membersCache.find(m => m.display_name === task.owner);
    const ownerColor = ownerMember?.color ?? '#888';
    const ownerInitial = (task.owner ?? '?')[0].toUpperCase();
    const daysLate = Math.abs(days);
    const urgencyRowCls = overdue ? 'attention-row--overdue' : 'attention-row--duetoday';
    const subtitleHtml = overdue
      ? `<span style="color:#c0392b;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name)} · ${tn('status.home.daysLate', daysLate)}</span>`
      : `<span style="color:#b07a2a;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name)} · ${t('status.home.dueToday')}</span>`;
    const rowAction = overdue ? 'caring-overdue-row-tap' : 'caring-open-edit-task';

    html += `<div class="activity-row home-due-today-row attention-row ${urgencyRowCls}" data-action="${rowAction}" data-plant="${plant.id}" data-task="${task.id}">
      ${plant.photoUrl
        ? plantIconImgHtml(plant.photoUrl, 26, '8px')
        : `<span style="width:26px;height:26px;border-radius:8px;background:#eef2ee;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;line-height:1;">${plant.emoji}</span>`}
      <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;"></span>
      <span class="activity-icon">${cfg.icon}</span>
      <span class="home-due-today-info">
        <span class="home-due-today-task">${escapeHtml(cfg.name)}</span>
        ${subtitleHtml}
      </span>
      <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:4px;">${escapeHtml(ownerInitial)}</span>
      <button class="attention-check-circle" data-action="home-mark-done" data-plant="${plant.id}" data-task="${task.id}" aria-label="${t('home.aria.markDone')}">
        <span class="attention-check-icon">✓</span>
      </button>
    </div>`;
  }

  html += `</div></div>`;
  return html;
}

function renderCaringDoneToday() {
  const today = todayStr();
  const doneItems = [];
  for (const plant of plants) {
    for (const task of plant.tasks) {
      if (task.paused) continue;
      if (!matchesFilter(task.owner)) continue;
      if (task.lastDone === today) doneItems.push({ plant, task });
    }
  }
  if (doneItems.length === 0) return '';

  doneItems.reverse();
  doneItems.sort((a, b) => {
    const aTime = a.plant.careLog.find(e => e.taskId === a.task.id && e.date === today)?.createdAt ?? '';
    const bTime = b.plant.careLog.find(e => e.taskId === b.task.id && e.date === today)?.createdAt ?? '';
    return bTime.localeCompare(aTime);
  });

  let html = `<div class="home-section-header">
    <div class="home-section-header-accent" style="background:#2e7d51;"></div>
    <span class="home-section-header-text">${t('caring.doneToday')}</span>
  </div>
  <div class="home-activity-feed"><div class="needs-attention-list">`;

  for (const { plant, task } of doneItems) {
    const cfg = getTaskConfig(task);
    // #434: attribute the completion to the actual actor recorded on today's
    // care_log entry, not the task's assignee. Fall back to the assignee only
    // if no matching completion is found.
    const doneEntry    = plant.careLog.find(e => e.taskId === task.id && e.date === today);
    const actorName    = doneEntry?.author ?? task.owner;
    const ownerMember  = membersCache.find(m => m.display_name === actorName);
    const ownerColor   = ownerMember?.color ?? '#888';
    const ownerInitial = (actorName ?? '?')[0].toUpperCase();
    html += `<div class="activity-row home-due-today-row attention-row" data-action="caring-open-edit-task" data-plant="${plant.id}" data-task="${task.id}" style="background:#fff;border-color:#e8ece6;">
      <span style="width:26px;height:26px;border-radius:8px;background:#eaf3de;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;line-height:1;">${plant.emoji}</span>
      <span style="width:1px;height:28px;background:#c0dd97;flex-shrink:0;"></span>
      <span style="width:26px;height:26px;border-radius:8px;background:#eaf3de;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;line-height:1;">${cfg.icon}</span>
      <span class="home-due-today-info">
        <span class="home-due-today-task" style="text-decoration:line-through;text-decoration-color:#aab09f;color:#6b7c61;">${escapeHtml(cfg.name)}</span>
        <span style="color:#8a9180;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name)} · ${escapeHtml(actorName ?? '')}</span>
      </span>
      <button data-action="add-note" data-plant="${plant.id}" style="width:26px;height:26px;border-radius:50%;border:0.5px solid #dde0d9;background:#f4f6f2;display:inline-flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;cursor:pointer;padding:0;" aria-label="${t('home.aria.addNote')}"><svg viewBox="0 0 16 16" fill="none" stroke="#8a9180" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg></button>
      <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:#fff;font-size:11px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(ownerInitial)}</span>
      <button data-action="caring-undo-done" data-plant="${plant.id}" data-task="${task.id}" style="width:26px;height:26px;border-radius:50%;border:none;background:#3b6d11;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;cursor:pointer;padding:0;" aria-label="${t('menu.toast.undo')}">✓</button>
    </div>`;
  }

  html += `</div></div>`;
  return html;
}

function renderHomeActivityFeed() {
  if (activityFeed.length === 0) {
    if (plants.length === 0) return '';
    return `
  <div class="home-section-header">
    <div class="home-section-header-accent" style="background:var(--primary);"></div>
    <span class="home-section-header-text">${t('home.recentActivity')}</span>
    <button class="summary-view-all-link" style="margin-left:auto;" data-action="open-household-activity">${t('home.viewMore')}</button>
  </div>
  <div class="home-activity-feed"><div class="activity-list">
    <div class="activity-row activity-row--home">
      <span class="activity-icon" style="opacity:0.3;">💧</span>
      <span class="activity-text" style="color:#bbb;">${t('home.activityEmpty')}</span>
    </div>
  </div></div>`;
  }

  let html = `
  <div class="home-section-header">
    <div class="home-section-header-accent" style="background:var(--primary);"></div>
    <span class="home-section-header-text">${t('home.recentActivity')}</span>
    <button class="summary-view-all-link" style="margin-left:auto;" data-action="open-household-activity">${t('home.viewMore')}</button>
  </div>
  <div class="home-activity-feed"><div class="activity-list">`;

  const seenRaw = currentMemberId ? localStorage.getItem(`seen_photos_${currentMemberId}`) : null;
  const seenPhotos = seenRaw ? JSON.parse(seenRaw) : [];

  for (const item of activityFeed.slice(0, 3)) {
    const time = formatActivityTime(item.sortKey);
    if (item.type === 'care') {
      const isSkipped = item.taskType === 'skipped';
      const verb = careVerb(item.taskType);
      const icon = CARE_ICON[item.taskType] ?? '🌿';
      const text = isSkipped
        ? t('activityFeed.skipped', { actor: escapeHtml(item.member), task: escapeHtml(item.taskName) })
        : verb
          ? t('activityFeed.care', { actor: escapeHtml(item.member), verb: escapeHtml(verb), plant: escapeHtml(item.plantName) })
          : t('activityFeed.careOther', { actor: escapeHtml(item.member), task: escapeHtml(item.taskName), plant: escapeHtml(item.plantName) });
      html += `
      <div class="activity-row activity-row--home${isSkipped ? ' activity-row-skipped' : ''}">
        <span class="activity-icon${isSkipped ? ' activity-icon-skipped' : ''}">${icon}</span>
        <span class="activity-text">${text}</span>
        <span class="activity-home-thumb-slot"></span>
        <span class="activity-time">${time}</span>
      </div>`;
    } else {
      let thumbSlot;
      if (item.photoUrl) {
        const seen = item.noteId && seenPhotos.includes(item.noteId);
        const dotHtml = seen ? '' : '<span class="activity-thumb-dot"></span>';
        thumbSlot = `<span class="activity-home-thumb-slot activity-home-thumb-slot--photo">${dotHtml}<img loading="lazy" class="activity-thumb-inline" src="${escapeHtml(item.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(item.photoUrl)}" data-note-id="${escapeHtml(item.noteId ?? '')}" data-plant-id="${escapeHtml(item.plantId ?? '')}" /></span>`;
      } else {
        thumbSlot = '<span class="activity-home-thumb-slot"></span>';
      }
      html += `
      <div class="activity-row activity-row--home">
        <span class="activity-icon">💬</span>
        <span class="activity-text">${t('activityFeed.noteOn', { actor: escapeHtml(item.member), plant: escapeHtml(item.plantName) })} · <span class="activity-note-preview">${escapeHtml(item.note)}</span></span>
        ${thumbSlot}
        <span class="activity-time">${time}</span>
      </div>`;
    }
  }

  html += `</div></div>`;
  return html;
}



// ============================================================
// ONBOARDING
// ============================================================

// #403: onboarding completion is a server-side fact (household_members.
// onboarding_completed_at). When it's set, mirror it into the local device-facts
// the existing surfaces read, so the Get-Started banner stays suppressed, the
// Add-Plant FAB stays unlocked, and the Notifications card stays gone — on every
// device, regardless of this browser's local onboarding_* flags. When it's null,
// the local flags drive (same-device, in-progress fallback).
function reconcileOnboardingFromServer() {
  if (!currentMemberId) return;
  const m = membersCache.find(mm => mm.id === currentMemberId);
  if (!m?.onboarding_completed_at) return;
  localStorage.setItem(`onboarding_session6_done_${currentMemberId}`, 'true');
  localStorage.setItem(`onboarding_coordination_shown_${currentMemberId}`, '1');
  localStorage.setItem(`onboarding_step_${currentMemberId}`, '4');
  localStorage.setItem(`reminders_card_dismissed_${currentMemberId}`, 'true');
}

function getOnboardingStep() {
  if (!currentMemberId) return null;
  const stored = localStorage.getItem(`onboarding_step_${currentMemberId}`);
  if (stored) return parseInt(stored, 10);
  localStorage.setItem(`onboarding_step_${currentMemberId}`, '1');
  return 1;
}

function setOnboardingStep(step) {
  if (!currentMemberId) return;
  localStorage.setItem(`onboarding_step_${currentMemberId}`, String(step));
}

function getOnboardingPlantId() {
  return currentMemberId ? localStorage.getItem(`onboarding_plant_id_${currentMemberId}`) : null;
}

function setOnboardingPlantId(id) {
  if (!currentMemberId) return;
  localStorage.setItem(`onboarding_plant_id_${currentMemberId}`, id);
}

function getOnboardingTaskId() {
  return currentMemberId ? localStorage.getItem(`onboarding_task_id_${currentMemberId}`) : null;
}

function setOnboardingTaskId(id) {
  if (!currentMemberId) return;
  localStorage.setItem(`onboarding_task_id_${currentMemberId}`, id);
}

function renderOnboardingInlineTaskCard() {
  const onboardingPlantId = getOnboardingPlantId();
  const onboardingTaskId  = getOnboardingTaskId();
  if (!onboardingPlantId || !onboardingTaskId) return '';

  // #351: derive copy from the real onboarding task (created via the Add Task
  // sheet in #349). Fall back gracefully if it can't be resolved.
  const onboardingTask = getTask(onboardingPlantId, onboardingTaskId);
  const cardName  = onboardingTask?.name ?? 'Watering (Example)';
  const cardSub   = onboardingTask ? recurrenceLabel(onboardingTask) : '';

  return `
    <div style="padding:0 16px;margin-top:12px;">
      <div style="background:#f4faf4;border:1.5px solid #3a6b3a;border-radius:12px;padding:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:20px;">💧</span>
          <div>
            <div style="font-size:14px;font-weight:500;color:#1a1a1a;">${escapeHtml(cardName)}</div>
            <div style="font-size:12px;color:#888;">${escapeHtml(cardSub)}</div>
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%;" data-action="mark-done" data-plant="${onboardingPlantId}" data-task="${onboardingTaskId}">&#10003; ${t('onboarding.inlineTask.markDone')}</button>
      </div>
    </div>`;
}

function shouldShowOnboardingBanner() {
  if (localStorage.getItem(`onboarding_coordination_shown_${currentMemberId}`)) return false;
  const step = getOnboardingStep();
  return step !== null && step < 4;
}

function renderOnboardingBanner() {
  const step = getOnboardingStep();
  if (!step || step >= 4) return '';

  const onboardingPlantId = getOnboardingPlantId();
  const onboardingPlant = plants.find(p => p.id === onboardingPlantId);
  const ctaStyle = 'width:100%;padding:10px 12px;font-size:13px;font-weight:500;background:#3a6b3a;color:#fff;border:none;border-radius:8px;cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent;';

  let instruction, ctaHtml;
  if (step === 1) {
    instruction = t('onboarding.banner.step1');
    ctaHtml = `<button style="${ctaStyle}" data-action="add-plant">${t('onboarding.banner.step1Cta')}</button>`;
  } else if (step === 2) {
    instruction = t('onboarding.banner.step2');
    ctaHtml = `<button style="${ctaStyle}" data-action="onboarding-open-plant" data-plant="${onboardingPlantId ?? ''}">${t('onboarding.banner.step2Cta')}</button>`;
  } else {
    instruction = t('onboarding.banner.step3');
    ctaHtml = '';
  }

  return `
    <div class="onboarding-banner">
      <div class="onboarding-banner-top">
        <span class="onboarding-label">${t('onboarding.banner.label')}</span>
        <span style="font-size:11px;font-weight:500;color:#3a6b3a;">${t('onboarding.step.counter', { step })}</span>
      </div>
      <p class="onboarding-instruction" style="margin-bottom:${ctaHtml ? '8px' : '0'};">${instruction}</p>
      ${ctaHtml}
    </div>`;
}

// #363: Notifications invitation card — fills the home slot vacated by the
// completed onboarding "Get started" flow. States:
//   Gone       — tour not done, OR permanently dismissed (reminders_card_dismissed flag).
//   Note       — in-session collapsed view (remindersCardCollapsed); writes NO flag.
//   OS-blocked — notifications denied at the OS level; the Enable button is a dead
//                end until the user flips it in device settings. Detected live from
//                Notification.permission, so it survives reloads while denial holds.
//   Full       — the invitation card with an inline Enable button.
function renderRemindersCard() {
  if (!currentMemberId) return '';
  if (!localStorage.getItem(`onboarding_session6_done_${currentMemberId}`)) return '';
  if (localStorage.getItem(`reminders_card_dismissed_${currentMemberId}`)) return '';

  if (remindersCardCollapsed) {
    return `
    <div class="reminders-card-note">
      <span class="reminders-card-note-bell" aria-hidden="true">🔔</span>
      <span class="reminders-card-note-text">${t('onboarding.reminders.noteText')}</span>
      <button class="reminders-card-note-close" data-action="reminders-note-dismiss" aria-label="${t('home.aria.dismiss')}">&#10005;</button>
    </div>`;
  }

  // #363: OS-denied → the Full card's Enable button can't work, so show the
  // settings-path state instead. Feature-detect before reading permission (#361 §6).
  if ('Notification' in window && Notification.permission === 'denied') {
    return `
    <div class="reminders-card-blocked">
      <button class="reminders-card-blocked-close" data-action="reminders-note-dismiss" aria-label="${t('home.aria.dismiss')}">&#10005;</button>
      <div class="reminders-card-blocked-title">${t('onboarding.reminders.blockedTitle')}</div>
      <div class="reminders-card-blocked-body">${t('onboarding.reminders.blockedBody', { path: isIOS() ? t('onboarding.reminders.blockedPathIos') : t('onboarding.reminders.blockedPathAndroid') })}</div>
    </div>`;
  }

  return `
    <div class="reminders-card">
      <div class="reminders-card-icon" aria-hidden="true">🔔</div>
      <div class="reminders-card-title">${t('onboarding.reminders.title')}</div>
      <div class="reminders-card-subtitle">${t('onboarding.reminders.subtitle')}</div>
      <button class="btn btn-primary reminders-card-btn" data-action="reminders-enable">${t('onboarding.reminders.enable')}</button>
      <button class="reminders-card-later" data-action="reminders-maybe-later">${t('onboarding.card.maybeLater')}</button>
    </div>`;
}

function shouldShowCalendarCard() {
  if (!currentMemberId) return false;
  if (!localStorage.getItem(`onboarding_session6_done_${currentMemberId}`)) return false;
  if (!localStorage.getItem(`calendar_card_triggered_${currentMemberId}`)) return false;
  if (localStorage.getItem(`calendar_card_dismissed_${currentMemberId}`)) return false;
  return true;
}

function renderCalendarCard() {
  if (localStorage.getItem(`calendar_card_dismissed_${currentMemberId}`)) return '';

  if (calendarCardCollapsed) {
    return `
    <div class="reminders-card-note">
      <span class="reminders-card-note-bell" aria-hidden="true">📅</span>
      <span class="reminders-card-note-text">${t('onboarding.calendarCard.noteText')}</span>
      <button class="reminders-card-note-close" data-action="cal-card-dismiss" aria-label="${t('home.aria.dismiss')}">&#10005;</button>
    </div>`;
  }

  return `
    <div style="position:relative;display:grid;grid-template-columns:40px 1fr;grid-template-areas:'icon title' 'icon subtitle' 'btn btn' 'later later';column-gap:12px;align-items:start;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:11px 36px 11px 12px;margin:12px 16px 0;">
      <button type="button" data-action="cal-card-dismiss" aria-label="${t('home.aria.dismiss')}" style="position:absolute;top:8px;right:8px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:none;border:none;font-size:17px;color:#6b7c6b;cursor:pointer;padding:0;">&#10005;</button>
      <div style="grid-area:icon;align-self:center;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;background:#eef3fb;border-radius:10px;" aria-hidden="true">📅</div>
      <div style="grid-area:title;font-size:12px;font-weight:500;color:#1c2b1c;">${t('onboarding.calendarCard.title')}</div>
      <div style="grid-area:subtitle;font-size:11px;color:#6b7c6b;line-height:1.4;margin-top:2px;">${t('onboarding.calendarCard.subtitle')}</div>
      <button class="btn btn-primary" data-action="cal-card-subscribe" style="grid-area:btn;width:100%;padding:10px 14px;font-size:14px;margin-top:8px;height:38px;min-height:38px;line-height:1;">${t('onboarding.calendarCard.subscribe')}</button>
      <button type="button" data-action="cal-card-maybe-later" style="grid-area:later;justify-self:center;margin-top:8px;background:none;border:none;font-size:13px;color:#2e7d51;cursor:pointer;padding:6px;font-family:inherit;">${t('onboarding.card.maybeLater')}</button>
    </div>`;
}

function renderHome() {
  if (document.querySelector('.onboarding-complete-overlay')) return;

  let html = `
    <div class="app-header app-header--home">
      <button class="household-pill" data-action="toggle-household-switcher" aria-expanded="false">
        <span id="header-household-name" class="header-household-name">${escapeHtml(householdName ?? t('home.householdFallback'))}</span>
        <span class="header-chevron" aria-hidden="true">▾</span>
      </button>
      ${renderHeaderRight()}
      <div class="household-switcher" id="household-switcher" role="menu">
        <div class="household-switcher-inner">
          <div class="household-switcher-label">${t('home.yourHouseholds')}</div>
          ${userHouseholds.map(h => {
            const isActive   = h.id === householdId;
            const showCheck  = isActive && userHouseholds.length > 1;
            const actionAttr = isActive ? '' : ` data-action="switch-household" data-household-id="${h.id}"`;
            return `<button class="household-switcher-item${isActive ? ' is-active' : ''}"${actionAttr}>
            <span class="household-switcher-item-name">${escapeHtml(h.name)}</span>
            ${showCheck ? '<span class="household-switcher-check">✓</span>' : ''}
          </button>`;
          }).join('')}
          <div class="household-switcher-divider"></div>
          <button class="household-switcher-manage" data-action="open-manage-households">
            <span class="household-switcher-manage-icon" aria-hidden="true">⚙️</span>
            <span class="household-switcher-manage-label">${t('home.manageHouseholds')}</span>
          </button>
        </div>
      </div>
    </div>
    <div class="tab-bar">
      <button class="tab-btn${activeTab === 'plants' ? ' active' : ''}" data-action="switch-tab" data-tab="plants">&#127807; ${t('home.tabPlants')}</button>
      <button class="tab-btn${activeTab === 'schedule' ? ' active' : ''}" data-action="switch-tab" data-tab="schedule">&#9989; ${t('home.tabCaring')}</button>
    </div>`;

  if (activeTab === 'plants') {
    if (shouldShowOnboardingBanner()) html += renderOnboardingBanner();

    html += shouldShowCalendarCard() ? renderCalendarCard() : renderRemindersCard();

    if (getOnboardingStep() === 3) html += renderOnboardingInlineTaskCard();


    html += renderHomeActivityFeed();

    if (plants.length === 0) {
      html += `
    <div class="plants-empty-state">
      <span class="empty-emoji">🌱</span>
      <h2>${t('home.emptyTitle')}</h2>
      <p>${t('home.emptySub')}</p>
    </div>`;
    }

    if (plants.length > 0) {
      html += `<div class="home-section-header">
      <div class="home-section-header-accent" style="background:var(--primary);"></div>
      <span class="home-section-header-text">${t('home.myPlants')}</span>
    </div>`;
    }
    html += '<div class="plants-list">';

    // Smart sort: overdue plants first (most overdue at top), then due-today
    // (most due-today tasks first), then all-good in original order. If no plant
    // is overdue or due-today, skip the sort and keep the existing order.
    const classifiedPlants = plants.map((plant, idx) => {
      let minDays = Infinity;      // most-negative daysUntilDue across tasks
      let dueTodayCount = 0;
      for (const task of plant.tasks) {
        if (task.paused) continue;
        const d = daysUntilDue(task);
        if (d === Infinity) continue;
        if (d < minDays) minDays = d;
        if (d === 0) dueTodayCount++;
      }
      let group;
      if (minDays < 0) group = 1;
      else if (dueTodayCount > 0) group = 2;
      else group = 3;
      return { plant, idx, group, minDays, dueTodayCount };
    });
    const needsSort = classifiedPlants.some(c => c.group === 1 || c.group === 2);
    const plantsOrdered = needsSort
      ? classifiedPlants
          .slice()
          .sort((a, b) => {
            if (a.group !== b.group) return a.group - b.group;
            if (a.group === 1) return a.minDays - b.minDays; // most overdue (most negative) first
            if (a.group === 2) return b.dueTodayCount - a.dueTodayCount; // most due-today first
            return a.idx - b.idx; // group 3: preserve original order
          })
          .map(c => c.plant)
      : plants;

    for (const plant of plantsOrdered) {
      // Collect urgent tasks split by state so pills + task badges can tint consistently.
      const overdueTasks  = [];
      const dueTodayTasks = [];
      for (const task of plant.tasks) {
        if (task.paused) continue;
        const d = daysUntilDue(task);
        if (d === Infinity) continue;
        if (d < 0)        overdueTasks.push(task);
        else if (d === 0) dueTodayTasks.push(task);
      }

      const suppressOnboarding = getOnboardingStep() === 3 && plant.id === getOnboardingPlantId();

      let dueBadgeHtml = '';
      if (suppressOnboarding) {
        dueBadgeHtml = '';
      } else if (plant.tasks.length === 0) {
        dueBadgeHtml = '';
      } else if (overdueTasks.length > 0 || dueTodayTasks.length > 0) {
        const parts = [];
        if (overdueTasks.length > 0)  parts.push(`<span class="pill-overdue">${t('status.pill.overdue', { n: overdueTasks.length })}</span>`);
        if (dueTodayTasks.length > 0) parts.push(`<span class="pill-duetoday">${t('status.pill.dueToday', { n: dueTodayTasks.length })}</span>`);
        dueBadgeHtml = `<div class="plant-card-pill-stack">${parts.join('')}</div>`;
      } else {
        dueBadgeHtml = `<span class="all-good-badge">&#10003; ${t('home.allGood')}</span>`;
      }

      const dueTasks = [...overdueTasks, ...dueTodayTasks];
      const suppressPills = suppressOnboarding;

      // Task icon tiles: cap at 4, then a "+N" overflow tile if there are more.
      let taskIconsHtml = '';
      if (!suppressPills && dueTasks.length > 0) {
        const MAX_ICONS = 4;
        const shown = dueTasks.slice(0, MAX_ICONS);
        const extra = dueTasks.length - MAX_ICONS;
        const iconTiles = shown.map(t => {
          const cfg = getTaskConfig(t);
          return `<span class="plant-card-task-icon">${cfg.icon}</span>`;
        }).join('');
        const overflowTile = extra > 0
          ? `<span class="plant-card-task-icon plant-card-task-icon--overflow" aria-label="${t('home.moreTasksAria', { n: extra })}">+${extra}</span>`
          : '';
        taskIconsHtml = `<div class="plant-card-task-icons">${iconTiles}${overflowTile}</div>`;
      }

      html += `
    <div class="plant-card" data-action="open-plant" data-plant="${plant.id}">
      <div class="plant-card-row">
        ${plant.photoUrl
          ? `<span class="plant-card-emoji">${plantIconImgHtml(plant.photoUrl, 36, '8px')}</span>`
          : `<span class="plant-card-emoji">${plant.emoji}</span>`}
        <div class="plant-card-meta">
          <div class="plant-card-name">${escapeHtml(plant.name)}</div>
          ${overdueTasks.length === 0 && dueTodayTasks.length === 0 ? lastCareLabel(plant) : ''}
          ${taskIconsHtml}
        </div>
        <div class="plant-card-right">
          ${dueBadgeHtml}
        </div>
      </div>
    </div>`;
    }

    html += '</div>';

    if (plants.length > 0 && !shouldShowOnboardingBanner()
        && localStorage.getItem(`onboarding_session6_done_${currentMemberId}`)) {
      html += `<button class="fab-add-plant" data-action="add-plant">&#43; ${t('home.addPlant')}</button>`;
    }

    html += `<div id="dev-build-ts" style="text-align:center;font-size:10px;color:var(--text-muted);margin-top:4px;opacity:0.6;">Built: ${typeof __BUILD_TIME__ !== 'undefined' ? new Date(__BUILD_TIME__).toLocaleString('es-CL', { timeZone: 'America/Santiago' }) : 'dev'}</div>`;
  } else {
    html += renderUserFilterPills();
    html += renderSchedule();
  }

  const showCoachMark = localStorage.getItem(`onboarding_show_coachmark_${currentMemberId}`);
  localStorage.removeItem(`onboarding_show_coachmark_${currentMemberId}`);

  document.getElementById('app').innerHTML = html;

  attachDevToolsTrigger(); // DEV TOOLS — remove before public launch

  if (showCoachMark) {
    setTimeout(() => renderCoachMark(), 50);
  }
}

function renderCoachMark() {
  const currentMember = membersCache.find(m => m.id === currentMemberId);
  const displayName   = currentMember?.display_name ?? activeUser ?? t('onboarding.coachmark.youFallback');
  const onboardingPlant = plants.find(p => p.id === getOnboardingPlantId());
  const plantName     = onboardingPlant?.name ?? t('onboarding.coachmark.plantFallback');

  const body = t('onboarding.coachmark.feedBody');

  const appRect = document.getElementById('app').getBoundingClientRect();

  // Layer 1 — dark backdrop
  const darkEl = document.createElement('div');
  darkEl.id = 'coachmark-dark';
  darkEl.className = 'coach-overlay';
  darkEl.style.position = 'fixed';
  darkEl.style.top      = appRect.top + 'px';
  darkEl.style.left     = appRect.left + 'px';
  darkEl.style.width    = appRect.width + 'px';
  darkEl.style.height   = appRect.height + 'px';
  darkEl.style.background = 'rgba(0,0,0,0.55)';
  darkEl.style.zIndex   = '100';

  // Layer 2 — coach block
  const blockEl = document.createElement('div');
  blockEl.id = 'coachmark-block';
  blockEl.style.position  = 'fixed';
  const tabBar = document.querySelector('.tab-bar');
  const anchorBottom = tabBar ? tabBar.getBoundingClientRect().bottom : 92;
  blockEl.style.top       = (anchorBottom + 6) + 'px';
  blockEl.style.left      = (appRect.left + 10) + 'px';
  blockEl.style.width     = (appRect.width - 20) + 'px';
  blockEl.style.zIndex    = '101';
  blockEl.style.display   = 'flex';
  blockEl.style.flexDirection = 'column';
  blockEl.style.gap       = '14px';
  blockEl.innerHTML = `
    <div style="width:100%;box-sizing:border-box;background:#fff;border:2px solid #3a6b3a;border-radius:10px;padding:9px 11px;font-size:14px;color:#1a1a1a;">
      💧 ${t('onboarding.coachmark.demoRow', { name: escapeHtml(displayName), plant: escapeHtml(plantName) })}
    </div>
    <div id="coachmark-tooltip" style="width:100%;box-sizing:border-box;background:#fff;border-radius:12px;padding:13px;position:relative;">
      <div style="position:absolute;top:-9px;left:18px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:9px solid #fff;"></div>
      <div style="font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:6px;">${t('onboarding.coachmark.feedTitle')}</div>
      <div style="font-size:13px;color:#555;line-height:1.5;margin-bottom:14px;">${escapeHtml(body)}</div>
      <button id="coachmark-got-it" style="width:100%;padding:12px;background:#3a6b3a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;">${t('onboarding.coachmark.gotIt')}</button>
    </div>`;

  document.body.appendChild(darkEl);
  document.body.appendChild(blockEl);

  function dismissCoachMark() {
    darkEl.remove();
    blockEl.remove();
  }

  document.getElementById('coachmark-got-it').addEventListener('click', () => {
    // #330: notif coach-mark removed — go straight from the activity-feed
    // coach-mark to the Caring-tab coach-mark. Dismiss this overlay first.
    dismissCoachMark();
    showCaringTabCoachMark();
  });
}

function showCaringTabCoachMark() {
  // Full-screen dark overlay — tab bar appears above it via z-index: 1001
  const overlayEl = document.createElement('div');
  overlayEl.id = 'caring-cm-overlay';
  overlayEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background:rgba(0,0,0,0.55);';

  const caringBtn = document.querySelector('.tab-btn[data-tab="schedule"]');

  // Bubble — just below the tab bar, centered horizontally
  const tabBar   = document.querySelector('.tab-bar');
  const tabBottom = tabBar ? tabBar.getBoundingClientRect().bottom : 110;
  const bubbleEl = document.createElement('div');
  bubbleEl.id = 'caring-cm-bubble';
  const bubbleLeft = (window.innerWidth - 220) / 2;
  const caringCenter = caringBtn ? caringBtn.getBoundingClientRect().left + caringBtn.getBoundingClientRect().width / 2 : window.innerWidth / 2;
  const arrowLeft = Math.min(Math.max(caringCenter - bubbleLeft - 12, 16), 204);
  bubbleEl.style.cssText = `position:fixed;z-index:1002;width:220px;left:50%;transform:translateX(-50%);top:${tabBottom + 8}px;background:#fff;border-radius:12px;padding:14px;box-sizing:border-box;`;
  bubbleEl.innerHTML = `
    <div style="position:absolute;top:-8px;left:${arrowLeft}px;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid #fff;"></div>
    <div style="font-size:15px;font-weight:500;color:#1a2e1a;margin-bottom:6px;">${t('onboarding.caringCoachmark.title')}</div>
    <div style="font-size:13px;color:#666;line-height:1.5;margin-bottom:12px;">${t('onboarding.caringCoachmark.body')}</div>
    <button id="caring-cm-got-it" style="width:100%;padding:12px;background:#3a6b3a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;">${t('onboarding.coachmark.gotIt')}</button>`;

  document.body.appendChild(overlayEl);
  document.body.appendChild(bubbleEl);

  document.getElementById('caring-cm-got-it').addEventListener('click', () => {
    overlayEl.remove();
    bubbleEl.remove();
    if (currentMemberId) localStorage.setItem(`onboarding_session6_done_${currentMemberId}`, '1');
    renderHome();
  });
}

// ============================================================
// RENDER: SCHEDULE
// ============================================================

function renderSchedule() {
  const today = new Date().toLocaleDateString('en-CA');

  const totalTasks = plants.reduce((sum, p) => sum + p.tasks.length, 0);
  if (totalTasks === 0) {
    return `<div style="text-align:center;padding:48px 24px 32px;">
  <div style="font-size:32px;margin-bottom:12px;">✅</div>
  <div style="font-size:15px;font-weight:600;color:#3a6b3a;margin-bottom:8px;">${t('caring.emptyTitle')}</div>
  <div style="font-size:13px;color:#888;line-height:1.5;">${t('caring.emptySub')}</div>
</div>`;
  }

  let html = renderHomeDueToday();

  html += renderCaringDoneToday();

  // Upcoming: next 7 days (tomorrow through today+7)
  html += `<div class="home-section-header">
    <div class="home-section-header-accent" style="background:#2e7d51;"></div>
    <span class="home-section-header-text">${t('caring.upcoming')}</span>
  </div>`;

  html += `<div class="upcoming-rows">`;
  let lastUpcomingDate = null;
  for (let i = 1; i <= 7; i++) {
    const dateStr = addDays(today, i);
    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayAbbr = dateObj.toLocaleDateString(displayLocale(), { weekday: 'short' });
    const monAbbr = dateObj.toLocaleDateString(displayLocale(), { month: 'short' }).toUpperCase();
    const dayNum  = dateObj.getDate();

    const dayTasks = [];
    for (const plant of plants) {
      for (const task of plant.tasks) {
        if (task.paused) continue;
        if (task.lastDone === todayStr() && computeNextDue(task) === todayStr()) continue;
        if (!matchesFilter(task.owner)) continue;
        if (taskOccursOnDate(task, dateStr)) dayTasks.push({ plant, task });
      }
    }

    const dateColHtml = () => {
      if (dateStr !== lastUpcomingDate) {
        lastUpcomingDate = dateStr;
        return `<div class="upcoming-date-col">
          <span class="upcoming-date-mon">${monAbbr}</span>
          <span class="upcoming-date-num">${dayNum}</span>
          <span class="upcoming-date-dow">${dayAbbr}</span>
        </div>`;
      }
      return `<div class="upcoming-date-col" aria-hidden="true"></div>`;
    };

    if (dayTasks.length === 0) {
      html += `<div class="upcoming-row">
        ${dateColHtml()}
        <div class="upcoming-card upcoming-empty-card" style="background:#f0eef8;border:0.5px solid #d0c8ee;">
          <span class="upcoming-empty-tile" style="background:#ddd8f0;border-radius:9px;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;">🎈</span>
          <span class="home-due-today-info">
            <span style="font-size:13px;font-weight:500;color:#3a2a7a;">${t('caring.allClear')}</span>
            <span style="font-size:11px;color:#6a5aaa;">${t('caring.noTasksToday')}</span>
          </span>
        </div>
      </div>`;
    } else {
      for (const { plant, task } of dayTasks) {
        const cfg = getTaskConfig(task);
        const ownerMember = membersCache.find(m => m.display_name === task.owner);
        const ownerColor  = ownerMember?.color ?? '#888';
        const ownerInitial = (task.owner ?? '?')[0].toUpperCase();
        html += `<div class="upcoming-row" data-action="caring-open-edit-task" data-plant="${plant.id}" data-task="${task.id}">
          ${dateColHtml()}
          <div class="upcoming-card">
            ${plant.photoUrl
              ? plantIconImgHtml(plant.photoUrl, 36, '8px')
              : `<span class="upcoming-card-emoji-tile">${plant.emoji}</span>`}
            <span class="upcoming-card-divider"></span>
            <span class="upcoming-card-icon">${cfg.icon}</span>
            <span class="home-due-today-info">
              <span style="font-size:13px;font-weight:500;color:#1a1a1a;">${escapeHtml(cfg.name)}</span>
              <span class="home-due-today-plant">${escapeHtml(plant.name)}</span>
            </span>
            <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:4px;">${escapeHtml(ownerInitial)}</span>
            <button class="attention-check-circle" data-action="home-mark-done" data-plant="${plant.id}" data-task="${task.id}" aria-label="${t('home.aria.markDone')}">
              <span class="attention-check-icon">✓</span>
            </button>
          </div>
        </div>`;
      }
    }
  }
  html += `</div>`;

  return html;
}

// ============================================================
// RENDER: PLANT DETAIL
// ============================================================

function renderPlantDetail(plantId) {
  const plant = getPlant(plantId);
  if (!plant) { navigateTo('home'); return; }

  const activeMember = membersCache.find(m => m.display_name === activeUser);
  const userColor    = activeMember?.color ?? '#2e7d51';
  const initial      = (activeUser ?? '?')[0].toUpperCase();

  let html = `
  <div class="app-header app-header--plant-detail">
    <button class="back-btn" data-action="go-home">&#8249;</button>
    <div class="detail-header-title" data-action="open-edit-plant" data-plant="${plant.id}" role="button" aria-label="${t('plantDetail.aria.editPlant')}">
      ${plant.photoUrl
        ? plantIconImgHtml(plant.photoUrl, 30, '50%')
        : `<span class="detail-header-emoji-circle">${plant.emoji}</span>`}
      <div class="detail-header-name-row">
        <span class="detail-header-name">${escapeHtml(plant.name)}</span>
        <span class="header-edit-chevron-icon" aria-hidden="true">${CHEVRON_RIGHT_SVG}</span>
      </div>
    </div>
    <button class="header-feedback-btn" data-action="feedback" aria-label="${t('home.aria.reportBug')}">${FEEDBACK_BUBBLE_SVG}</button>
    <button class="user-initial-circle" data-action="open-menu" style="background:${escapeHtml(userColor)}">${escapeHtml(initial)}</button>
  </div>
  <div class="plant-detail-tabs">
    <button class="detail-tab-btn${plantDetailTab === 'summary'  ? ' active' : ''}" data-action="plant-detail-tab" data-tab="summary">${t('plantDetail.tabSummary')}</button>
    <button class="detail-tab-btn${plantDetailTab === 'tasks'    ? ' active' : ''}" data-action="plant-detail-tab" data-tab="tasks">${t('plantDetail.tabTasks')}</button>
    <button class="detail-tab-btn${plantDetailTab === 'notes'    ? ' active' : ''}" data-action="plant-detail-tab" data-tab="notes">${t('plantDetail.tabNotes')}</button>
    <button class="detail-tab-btn${plantDetailTab === 'carelog'  ? ' active' : ''}" data-action="plant-detail-tab" data-tab="carelog">${t('plantDetail.tabCareLog')}</button>
  </div>
  ${renderUserFilterPills()}
  <div class="plant-detail">`;

  if (plantDetailTab === 'summary') {
    html += renderSummaryTab(plant);
  } else if (plantDetailTab === 'tasks') {
    html += renderTasksTab(plant);
  } else if (plantDetailTab === 'notes') {
    html += renderNotesTab(plant);
  } else {
    html += renderCareLogTab(plant);
  }

  html += `</div>`;

  // Context-aware FABs
  const isOnboardingTasksView = plantDetailTab === 'tasks'
    && plant.id === getOnboardingPlantId()
    && (getOnboardingStep() === 2 || getOnboardingStep() === 3);
  const showNote = plantDetailTab === 'summary' || plantDetailTab === 'notes' || plantDetailTab === 'carelog';
  const showTask = !isOnboardingTasksView && (plantDetailTab === 'summary' || plantDetailTab === 'tasks' || plantDetailTab === 'carelog');
  if (plantDetailTab === 'summary' || plantDetailTab === 'carelog') {
    html += `
      <div class="summary-fab" id="summary-fab">
        <div class="summary-fab-scrim" data-action="summary-fab-collapse"></div>
        <div class="summary-fab-options">
          <button class="summary-fab-option" data-action="summary-fab-add-note" data-plant="${plant.id}">
            <span class="summary-fab-option-label">${t('home.aria.addNote')}</span>
            <span class="summary-fab-option-icon summary-fab-option-icon--note">&#128221;</span>
          </button>
          <button class="summary-fab-option" data-action="summary-fab-add-task" data-plant="${plant.id}">
            <span class="summary-fab-option-label">${t('plantDetail.addTask')}</span>
            <span class="summary-fab-option-icon summary-fab-option-icon--task">+</span>
          </button>
        </div>
        <button class="summary-fab-main" data-action="summary-fab-toggle" aria-label="${t('plantDetail.aria.addFab')}">
          <span class="summary-fab-icon summary-fab-icon-plus">+</span>
          <span class="summary-fab-icon summary-fab-icon-close">&#10005;</span>
        </button>
      </div>`;
  } else {
    html += `<div class="detail-fab-stack">`;
    if (showNote) {
      html += `<button class="detail-fab detail-fab-note" data-action="add-note" data-plant="${plant.id}">&#128221; ${t('home.aria.addNote')}</button>`;
    }
    if (showTask) {
      html += `<button class="detail-fab detail-fab-task" data-action="add-task" data-plant="${plant.id}">&#43; ${t('plantDetail.addTask')}</button>`;
    }
    html += `</div>`;
  }

  document.getElementById('app').innerHTML = html;
}

function renderManageHouseholds() {
  const name = householdName ?? t('home.householdFallback');
  const memberCount = membersCache.length;
  const memberSubtitle = tn('manageHouseholds.memberCount', memberCount);

  const cardClass = manageHouseholdsEditingName ? 'manage-household-card editing' : 'manage-household-card';
  const nameRow = manageHouseholdsEditingName
    ? `<input id="manage-household-name-input" class="manage-household-name-input" type="text" value="${escapeHtml(name)}" maxlength="60" autocomplete="off" />
       <div class="manage-household-edit-actions">
         <button class="manage-household-btn-cancel" data-action="manage-households-cancel-name">${t('taskSheet.cancel')}</button>
         <button class="manage-household-btn-save" data-action="manage-households-save-name">${t('auth.reset.save')}</button>
       </div>`
    : `<div class="manage-household-row">
         <span class="manage-household-icon" aria-hidden="true">🏠</span>
         <div class="manage-household-text">
           <div class="manage-household-name">${escapeHtml(name)}</div>
           <div class="manage-household-sub">${memberSubtitle}</div>
         </div>
         <button class="manage-household-edit-btn" data-action="manage-households-start-edit">${t('manageHouseholds.editName')}</button>
       </div>`;

  const memberRows = membersCache.map(m => {
    const initial = (m.display_name ?? '?')[0].toUpperCase();
    const color = m.color ?? '#2e7d51';
    const isYou = m.id === currentMemberId;
    return `
      <div class="manage-member-row">
        <span class="manage-member-avatar" style="background:${escapeHtml(color)};">${escapeHtml(initial)}</span>
        <div class="manage-member-text">
          <div class="manage-member-name">${escapeHtml(m.display_name ?? t('manageHouseholds.unknownMember'))}</div>
          <div class="manage-member-role">${t('manageHouseholds.role')}</div>
        </div>
        ${isYou ? `<span class="manage-member-you">${t('manageHouseholds.youBadge')}</span>` : ''}
      </div>`;
  }).join('');

  const html = `
  <div class="app-header app-header--manage">
    <button class="manage-back-btn" data-action="manage-households-back" aria-label="${t('taskSheet.back')}">&#8249;</button>
    <div class="manage-header-title">${t('manageHouseholds.title')}</div>
    <div class="manage-header-spacer" aria-hidden="true"></div>
  </div>
  <div class="manage-households-body">
    <div class="manage-section-label">${t('manageHouseholds.yourHousehold')}</div>
    <div class="${cardClass}">${nameRow}</div>

    <div class="manage-section-label">${t('manageHouseholds.membersLabel')}</div>
    <div class="manage-members-card">${memberRows}</div>
  </div>`;

  document.getElementById('app').innerHTML = html;

  if (manageHouseholdsEditingName) {
    const input = document.getElementById('manage-household-name-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

function buildHouseholdActivityContent() {
  const activeMember = membersCache.find(m => m.display_name === activeUser);
  const userColor    = activeMember?.color ?? '#2e7d51';
  const initial      = (activeUser ?? '?')[0].toUpperCase();

  const filtered = activityFeed.filter(item => matchesFilter(item.member));

  let bodyHtml;
  if (filtered.length === 0) {
    bodyHtml = `<div class="detail-empty" style="padding:48px 16px;text-align:center;color:#888;">${activeFilter.length ? t('manageHouseholds.noActivityFiltered') : t('manageHouseholds.noActivity')}</div>`;
  } else {
    let lastDate = null;
    let rowsHtml = '';
    for (const item of filtered) {
      const dateStr = item.sortKey ? item.sortKey.split('T')[0] : null;

      let monAbbr = '—', dayNum = '—', dayAbbr = '';
      if (dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        if (!isNaN(d.getTime())) {
          monAbbr = d.toLocaleDateString(displayLocale(), { month: 'short' }).toUpperCase();
          dayNum  = String(d.getDate());
          dayAbbr = d.toLocaleDateString(displayLocale(), { weekday: 'short' });
        }
      }

      const showDate = dateStr !== lastDate;
      lastDate = dateStr;
      const dateColHtml = showDate
        ? `<div class="upcoming-date-col">
             <span class="upcoming-date-mon">${escapeHtml(monAbbr)}</span>
             <span class="upcoming-date-num">${escapeHtml(dayNum)}</span>
             <span class="upcoming-date-dow">${escapeHtml(dayAbbr)}</span>
           </div>`
        : `<div class="upcoming-date-col" aria-hidden="true"></div>`;

      const plant         = plants.find(p => p.id === item.plantId);
      const plantName     = plant?.name ?? item.plantName ?? '';
      const plantEmoji    = plant?.emoji ?? '🪴';
      const plantPhotoUrl = plant?.photoUrl ?? null;

      const plantTileHtml = plantPhotoUrl
        ? plantIconImgHtml(plantPhotoUrl, 32, '8px')
        : `<span style="width:32px;height:32px;border-radius:8px;background:#e8f0e4;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;line-height:1;">${escapeHtml(plantEmoji)}</span>`;

      const member       = membersCache.find(m => m.display_name === item.member);
      const ownerColor   = member?.color ?? '#888';
      const ownerInitial = (item.member ?? '?')[0].toUpperCase();

      let titleText, subtitleText, taskIcon, photoThumbHtml = '';
      const isSkipped = item.type === 'care' && item.taskType === 'skipped';
      if (item.type === 'care') {
        titleText    = item.taskName ?? t('manageHouseholds.careFallback');
        subtitleText = isSkipped ? `${plantName} · ${t('plantDetail.careLog.skipped')}` : plantName;
        taskIcon     = CARE_ICON[item.taskType] ?? '✅';
      } else {
        titleText = t('menu.toast.noteAdded');
        const noteText  = (item.note ?? '').trim();
        const truncated = noteText.length > 30 ? noteText.slice(0, 30) + '…' : noteText;
        subtitleText = noteText ? `${plantName} · ${truncated}` : plantName;
        taskIcon     = '💬';
        if (item.photoUrl) {
          photoThumbHtml = `<span class="care-log-thumb"><img loading="lazy" class="carelog-note-thumb" src="${escapeHtml(item.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(item.photoUrl)}" data-note-id="${escapeHtml(item.id)}" data-plant-id="${escapeHtml(item.plantId)}" style="width:36px;height:36px;border-radius:8px;border:1.5px solid #7a907f;" /></span>`;
        }
      }

      rowsHtml += `<div class="upcoming-row${isSkipped ? ' activity-row-skipped' : ''}">
        ${dateColHtml}
        <div class="upcoming-card">
          ${plantTileHtml}
          <span class="upcoming-card-divider"></span>
          <span class="upcoming-card-icon${isSkipped ? ' activity-icon-skipped' : ''}">${taskIcon}</span>
          <span class="home-due-today-info">
            <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(titleText)}</span>
            <span class="home-due-today-plant${isSkipped ? ' activity-sub-skipped' : ''}">${escapeHtml(subtitleText)}</span>
          </span>
          ${photoThumbHtml}
          <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(ownerInitial)}</span>
        </div>
      </div>`;
    }
    bodyHtml = `<div class="upcoming-rows" style="padding:0 12px 80px;">${rowsHtml}</div>`;
  }

  return `
  <div class="app-header app-header--household-activity">
    <button class="back-btn" data-action="close-household-activity" aria-label="${t('taskSheet.back')}">&#8249;</button>
    <span class="household-activity-title">${t('manageHouseholds.activityTitle')}</span>
    <button class="user-initial-circle" data-action="open-menu" style="background:${escapeHtml(userColor)}">${escapeHtml(initial)}</button>
  </div>
  ${renderUserFilterPills()}
  ${bodyHtml}`;
}

function openHouseholdActivity() {
  if (document.getElementById('household-activity-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'household-activity-overlay';
  overlay.className = 'household-activity-overlay';
  overlay.innerHTML = buildHouseholdActivityContent();
  overlay.addEventListener('click', handleEvent);
  document.body.appendChild(overlay);
  // Force the initial translateY(100%) to flush before transitioning to 0.
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function refreshHouseholdActivity() {
  const overlay = document.getElementById('household-activity-overlay');
  if (!overlay) return;
  overlay.innerHTML = buildHouseholdActivityContent();
}

function closeHouseholdActivity() {
  const overlay = document.getElementById('household-activity-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}

async function handleManageHouseholdsSaveName() {
  const input = document.getElementById('manage-household-name-input');
  if (!input) return;
  const newName = input.value.trim();
  if (!newName || newName === householdName) {
    manageHouseholdsEditingName = false;
    renderManageHouseholds();
    return;
  }

  const { error } = await supabaseClient
    .from('households')
    .update({ name: newName })
    .eq('id', householdId);

  if (error) {
    showToast(t('menu.toast.couldNotSavePleaseRetry'));
    return;
  }

  householdName = newName;
  manageHouseholdsEditingName = false;
  renderManageHouseholds();

  const headerNameEl = document.getElementById('header-household-name');
  if (headerNameEl) headerNameEl.textContent = newName;

  showToast(t('menu.toast.householdNameUpdated'));
}

// Predicate: does a given author/owner display_name satisfy the current global filter?
// Empty activeFilter = no filter applied (show all).
function matchesFilter(author) {
  return activeFilter.length === 0 || activeFilter.includes(author);
}

function renderUserFilterPills() {
  let html = `<div class="user-filter-row">`;
  for (const m of membersCache) {
    const active = activeFilter.includes(m.display_name);
    const color = m.color ?? '#666';
    const borderColor = hexToRgba(color, 0.5);
    const pillStyle = active
      ? `background:${color};color:#fff;border:0.5px solid transparent;`
      : `background:#fff;color:#333;border:0.5px solid ${borderColor};`;
    const dotStyle = active
      ? `background:rgba(255,255,255,0.65);`
      : `background:${color};`;
    const checkStyle = active ? `color:#fff;` : `color:#aaa;`;
    const checkChar = active ? '✓' : '✕';
    html += `<div class="user-pill" data-action="user-filter-toggle" data-user="${escapeHtml(m.display_name)}" style="${pillStyle}">
      <div class="user-pill-dot" style="${dotStyle}"></div>
      ${escapeHtml(m.display_name)}
      <span class="user-pill-check" style="${checkStyle}">${checkChar}</span>
    </div>`;
  }
  html += `</div>`;
  return html;
}

function renderSummaryTab(plant) {
  if (plant.tasks.length === 0 && plant.careLog.length === 0) {
    return `<div style="text-align:center;padding:48px 24px 32px;">
  <div style="font-size:52px;margin-bottom:16px;">${escapeHtml(plant.emoji)}</div>
  <div style="font-size:17px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">${t('plantDetail.summary.homeTitle', { name: escapeHtml(plant.name) })}</div>
  <div style="font-size:13px;color:#888;line-height:1.5;max-width:260px;margin:0 auto;">${t('plantDetail.summary.emptySub')}</div>
</div>`;
  }

  const today = todayStr();

  const summarySectionHeader = (label) => `<div style="display:flex;align-items:center;gap:8px;padding:16px 0 8px;">
    <span style="width:3px;height:14px;background:#3a6b3a;border-radius:2px;flex-shrink:0;"></span>
    <span style="font-size:11px;font-weight:500;color:#6b7a6b;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(label)}</span>
  </div>`;



  let html = '';

  // ── Zone 1: Hero card (two states) ────────────────────────
  const dateAcquired = plant.dateAcquired;
  if (dateAcquired) {
    const totalDays   = daysBetween(dateAcquired, today);
    const yearN       = Math.floor(totalDays / 365) + 1;
    const yearLabel   = yearN === 1 ? '1 year' : `${yearN} years`;
    const progressPct = ((totalDays % 365) / 365) * 100;
    html += `
  <div class="hero-card">
    <div class="hero-card-top">
      <div class="hero-card-days">${totalDays}</div>
      <div class="hero-card-text">
        <div class="hero-card-label">${t('plantDetail.summary.daysOfCare')}</div>
        <div class="hero-card-since">${t('plantDetail.summary.homeSince', { date: escapeHtml(formatDate(dateAcquired)) })}</div>
      </div>
    </div>
    <div class="hero-card-bar-row">
      <div class="hero-card-bar"><div class="hero-card-bar-fill" style="width:${progressPct}%;"></div></div>
      <div class="hero-card-milestone">⭐ ${yearLabel}</div>
    </div>
  </div>`;
  } else {
    html += `
  <button class="hero-card-prompt" data-action="open-edit-plant" data-plant="${plant.id}">
    <span class="hero-card-prompt-icon" aria-hidden="true">🏠</span>
    <div class="hero-card-prompt-text">
      <div class="hero-card-prompt-title">${t('addPlant.step3.heading', { name: escapeHtml(plant.name) })}</div>
      <div class="hero-card-prompt-sub">${t('plantDetail.summary.arrivalPromptSub')}</div>
    </div>
    <span class="hero-card-prompt-chevron" aria-hidden="true">›</span>
  </button>`;
  }

  // ── Photo timeline entry (only if 2+ photos) ──────────────
  const summaryPhotoCount = notes.filter(n => n.plantId === plant.id && n.photoUrl).length;
  if (summaryPhotoCount >= 2) {
    html += `
  <div data-action="open-slideshow" data-plant="${escapeHtml(plant.id)}" style="display:flex;align-items:center;gap:10px;background:#fff;border:0.5px solid #e8ede8;border-radius:10px;padding:10px 14px;margin:0 0 12px;cursor:pointer;">
    <span style="width:30px;height:30px;background:#eaf3de;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#3b6d11" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h2l1.5-2h3l1.5 2h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"/><circle cx="8" cy="9" r="2.5"/></svg>
    </span>
    <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
      <span style="font-size:14px;font-weight:500;color:#1a1a1a;">${t('plantDetail.summary.photoTimeline')}</span>
      <span style="font-size:12px;color:#8a8d86;">${t('plantDetail.summary.photoCount', { n: summaryPhotoCount })}</span>
    </span>
    <span style="width:30px;height:30px;background:#3d6b3d;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:13px;line-height:1;" aria-hidden="true">▶</span>
  </div>`;
  }

  // ── Zone 2: Needs attention today ─────────────────────────
  const attentionTasks = plant.tasks.filter(t => {
    if (t.paused) return false;
    if (!matchesFilter(t.owner)) return false;
    const d = daysUntilDue(t);
    return d === 0 || (d < 0 && d !== -Infinity);
  });
  const caredToday = plant.careLog.some(e => e.date === today);

  if (attentionTasks.length === 0 && caredToday) {
    // Congratulatory state — green header + trophy row (Caring-tab pattern)
    html += `<div class="home-section-header">
      <div class="home-section-header-accent" style="background:#2e7d32;"></div>
      <span class="home-section-header-text" style="color:#2e7d32;">${t('plantDetail.summary.needsAttention')}</span>
    </div>
    <div class="home-activity-feed">
      <div class="needs-attention-list">
        <div class="attention-done-row">
          <span class="attention-done-tile">🏆</span>
          <span class="home-due-today-info">
            <span style="font-size:13px;font-weight:500;color:#2e7d32;">${t('home.allDoneToday')}</span>
            <span style="font-size:11px;color:#5a8c58;">${escapeHtml(plant.name)}</span>
          </span>
        </div>
      </div>
    </div>`;
  } else {
    html += summarySectionHeader(t('plantDetail.summary.needsAttention'));

    if (attentionTasks.length === 0) {
      html += `<div style="margin:0;display:flex;align-items:center;gap:10px;background:#f0eef8;border:0.5px solid #d0c8ee;border-radius:12px;padding:10px 12px;">
        <span style="width:40px;height:40px;background:#ddd8f0;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🎈</span>
        <span style="display:flex;flex-direction:column;gap:2px;min-width:0;">
          <span style="font-size:13px;font-weight:500;color:#3a2a7a;">${t('caring.allClear')}</span>
          <span style="font-size:11px;color:#6a5aaa;">${t('caring.noTasksToday')}</span>
        </span>
      </div>`;
    } else {
      for (const task of attentionTasks) {
        const cfg         = getTaskConfig(task);
        const ownerMember = membersCache.find(m => m.display_name === task.owner);
        const ownerColor  = ownerMember?.color ?? '#888';
        const ownerInit   = (task.owner ?? '?')[0].toUpperCase();
        const d           = daysUntilDue(task);
        const daysLate    = Math.abs(d);
        const status      = d < 0 ? tn('status.badge.daysOverdue', daysLate, { manual: '' }) : t('status.badge.dueToday', { manual: '' });
        const metaText    = `${status} · ${recurrenceLabel(task, RECURRENCE_VERBOSE_OPTS)}`;
        const rowAction   = d < 0 ? 'caring-overdue-row-tap' : 'edit-task';
        const urgencyCls  = d < 0 ? 'attention-row--overdue' : 'attention-row--duetoday';
        html += `<div class="attention-row ${urgencyCls}" style="margin:0 0 8px;display:flex;align-items:center;gap:10px;border-radius:12px;padding:10px 12px;cursor:pointer;" data-action="${rowAction}" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(task.id)}">
          <span style="width:36px;height:36px;background:#eef3eb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${cfg.icon}</span>
          <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;"></span>
          <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
            <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(cfg.name)}</span>
            <span style="font-size:11px;color:#8a5a0f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(metaText)}</span>
          </span>
          <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(ownerInit)}</span>
          <button class="attention-check-circle" data-action="summary-mark-done" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(task.id)}" aria-label="${t('home.aria.markDone')}">
            <span class="attention-check-icon">✓</span>
          </button>
        </div>`;
      }
    }
  }

  // ── Zone 3a: Upcoming (next 3 occurrences) ────────────────
  html += summarySectionHeader(t('caring.upcoming'));

  const projectStart = addDays(today, 1);
  const projectEnd   = addDays(today, 365);
  const allOccs      = [];
  for (const task of plant.tasks) {
    if (task.paused) continue;
    if (task.lastDone === todayStr() && computeNextDue(task) === todayStr()) continue;
    if (!matchesFilter(task.owner)) continue;
    const rt    = task.recurrenceType ?? 'interval';
    const first = computeNextDue(task);
    if (!first) continue;

    if (rt === 'one-off') {
      if (first >= projectStart) allOccs.push({ date: first, task });
      continue;
    }

    if (rt === 'yearly') {
      // Single occurrence per year: `first` is already the next yearly occurrence
      // (computeNextDue → nextYearlyOccurrence). Emit it iff it lands in the window.
      if (first >= projectStart && first <= projectEnd) allOccs.push({ date: first, task });
      continue;
    }

    if (rt === 'weekdays') {
      const wd = task.weekdays ?? [];
      if (wd.length === 0) continue;
      const picks = [];
      if (first >= projectStart) picks.push(first);
      let d = addDays(first, 1);
      while (picks.length < 3 && d <= projectEnd) {
        const dow = new Date(d + 'T12:00:00').getDay();
        if (wd.includes(dow) && d >= projectStart) picks.push(d);
        d = addDays(d, 1);
      }
      for (const date of picks) allOccs.push({ date, task });
      continue;
    }

    const interval = task.frequencyDays;
    if (!interval || interval <= 0) {
      if (first >= projectStart) allOccs.push({ date: first, task });
      continue;
    }
    let d = first;
    while (d < projectStart) d = addDays(d, interval);
    for (let i = 0; i < 3 && d <= projectEnd; i++) {
      allOccs.push({ date: d, task });
      d = addDays(d, interval);
    }
  }
  allOccs.sort((a, b) => a.date.localeCompare(b.date));
  const upcoming3 = allOccs.slice(0, 3);

  if (upcoming3.length === 0) {
    html += `<div style="margin:0;padding:12px 16px;color:#888;font-size:13px;">${t('plantDetail.summary.noUpcoming')}</div>`;
  } else {
    for (const { date, task } of upcoming3) {
      const cfg         = getTaskConfig(task);
      const ownerMember = membersCache.find(m => m.display_name === task.owner);
      const ownerColor  = ownerMember?.color ?? '#888';
      const ownerInit   = (task.owner ?? '?')[0].toUpperCase();
      const dObj        = new Date(date + 'T12:00:00');
      const monAbbr     = dObj.toLocaleDateString(displayLocale(), { month: 'short' });
      const dayAbbr     = dObj.toLocaleDateString(displayLocale(), { weekday: 'short' });
      const dayNum      = dObj.getDate();
      html += `<div style="margin:0 0 8px;display:flex;align-items:center;gap:10px;background:#fff;border:0.5px solid #e8ede8;border-radius:12px;padding:10px 12px;cursor:pointer;" data-action="edit-task" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(task.id)}">
        <div style="display:flex;flex-direction:column;align-items:center;min-width:36px;flex-shrink:0;">
          <span style="font-size:10px;color:#7a8a7a;text-transform:uppercase;line-height:1.1;">${escapeHtml(monAbbr)}</span>
          <span style="font-size:15px;font-weight:500;color:#1a1a1a;line-height:1.1;">${dayNum}</span>
          <span style="font-size:10px;color:#7a8a7a;line-height:1.1;">${escapeHtml(dayAbbr)}</span>
        </div>
        <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;"></span>
        <span style="width:36px;height:36px;background:#f0f0f0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${cfg.icon}</span>
        <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
          <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(cfg.name)}</span>
          <span style="font-size:11px;color:#8a8d86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(recurrenceLabel(task, RECURRENCE_VERBOSE_OPTS))}</span>
        </span>
        <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(ownerInit)}</span>
      </div>`;
    }
  }

  // ── Zone 3b: Recent activity (last 3 entries) ─────────────
  html += `<div style="display:flex;align-items:center;gap:8px;padding:16px 0 8px;">
    <span style="width:3px;height:14px;background:#3a6b3a;border-radius:2px;flex-shrink:0;"></span>
    <span style="font-size:11px;font-weight:500;color:#6b7a6b;text-transform:uppercase;letter-spacing:0.05em;">${t('home.recentActivity')}</span>
    <button class="summary-view-all-link" style="margin-left:auto;" data-action="plant-detail-tab" data-tab="carelog">${t('home.viewMore')}</button>
  </div>`;

  const plantNotes = notes.filter(n => n.plantId === plant.id);
  const activityItems = [
    ...plant.careLog.filter(e => matchesFilter(e.author)).map(e => ({ type: 'care', sortKey: e.date ?? '',                     data: e, raw: e.createdAt ?? '' })),
    ...plantNotes.filter(n => matchesFilter(n.author)).map(n   => ({ type: 'note', sortKey: (n.createdAt ?? '').split('T')[0],  data: n, raw: n.createdAt ?? '' })),
  ].sort((a, b) => {
    const cmp = (b.sortKey || '').localeCompare(a.sortKey || '');
    if (cmp !== 0) return cmp;
    return ((b.raw ?? '') || '').localeCompare(a.raw ?? '');
  }).slice(0, 3);

  if (activityItems.length === 0) {
    html += `<div style="margin:0;padding:12px 16px;color:#888;font-size:13px;">${t('plantDetail.summary.noActivity')}</div>`;
  } else {
    for (const item of activityItems) {
      if (item.type === 'care') {
        const e           = item.data;
        const isSkipped   = e.taskType === 'skipped';
        const matchedTask = plant.tasks.find(t => t.id === e.taskId);
        const cfgM        = matchedTask ? getTaskConfig(matchedTask) : null;
        const icon        = isSkipped ? '⏭' : (cfgM?.icon ?? '✓');
        const tType       = isSkipped ? 'skipped' : (cfgM?.type ?? e.taskType);
        const relTime     = relativeDaysLabel(e.date);
        const absDate     = e.date ? formatDate(e.date) : '';
        const verb        = careVerb(tType);
        const author      = e.author ?? t('home.authorFallback');
        const primary     = isSkipped
          ? t('activityFeed.skipped', { actor: author, task: e.taskName ?? t('home.taskFallback') })
          : verb
            ? t('activityFeed.care', { actor: author, verb, plant: plant.name })
            : t('activityFeed.careOther', { actor: author, task: e.taskName ?? t('home.careFallback'), plant: plant.name });
        const isDoneToday = !isSkipped && e.date === today;
        const tileHtml    = isSkipped
          ? `<span class="activity-icon-skipped" style="width:40px;height:40px;background:#f4f6f2;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icon}</span>`
          : isDoneToday
            ? `<span style="width:40px;height:40px;background:#eaf3de;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icon}</span>`
            : activityTaskTileHtml(tType, icon);
        const actionsHtml = isDoneToday
          ? `<button data-action="summary-carelog-add-note" data-plant="${escapeHtml(plant.id)}" style="width:30px;height:30px;border-radius:50%;border:0.5px solid #dde0d9;background:#f4f6f2;display:inline-flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;cursor:pointer;padding:0;" aria-label="${t('home.aria.addNote')}"><svg viewBox="0 0 16 16" fill="none" stroke="#8a9180" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg></button>
            <button data-action="summary-carelog-undo" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(e.taskId ?? '')}" data-entry="${escapeHtml(e.id ?? '')}" style="width:28px;height:28px;border-radius:50%;border:none;background:#3b6d11;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;cursor:pointer;padding:0;margin-left:6px;" aria-label="${t('menu.toast.undo')}">✓</button>`
          : '';
        html += `<div class="${isSkipped ? 'activity-row-skipped ' : ''}" style="margin:0 0 8px;display:flex;align-items:center;gap:10px;background:#fff;${isSkipped ? '' : 'border:0.5px solid #e8ede8;border-radius:12px;'}padding:10px 12px;cursor:pointer;" data-action="carelog-open-edit-task" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(e.taskId ?? '')}">
          ${tileHtml}
          <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;"></span>
          <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
            <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(primary)}</span>
            <span class="${isSkipped ? 'activity-sub-skipped' : ''}" style="font-size:11px;${isSkipped ? '' : 'color:#8a8d86;'}overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(relTime)} · ${escapeHtml(absDate)}</span>
          </span>
          ${actionsHtml}
        </div>`;
      } else {
        const n       = item.data;
        const relTime = relativeDaysLabel(item.sortKey);
        const absDate = item.sortKey ? formatDate(item.sortKey) : '';
        const primary = t('activityFeed.noteAdded', { actor: n.author ?? t('home.authorFallback') });
        const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
        const isOwn = n.memberId && n.memberId === activeMemberId;
        const rowAction = isOwn
          ? `data-action="edit-note" data-note="${escapeHtml(n.id)}" data-plant="${escapeHtml(plant.id)}"`
          : '';
        const bodyHtml = `<span style="font-size:13px;color:#4a4a4a;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:2px;">${escapeHtml(n.note ?? '')}</span>`;
        const thumbHtml = n.photoUrl
          ? `<span class="care-log-thumb"><img loading="lazy" class="activity-thumb-inline" src="${escapeHtml(n.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(n.photoUrl)}" /></span>`
          : '';
        html += `<div style="margin:0 0 8px;display:flex;align-items:flex-start;gap:10px;background:#fff;border:0.5px solid #e8ede8;border-radius:12px;padding:10px 12px;${isOwn ? 'cursor:pointer;' : ''}" ${rowAction}>
          <span style="width:36px;height:36px;background:#e8f0fb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">💬</span>
          <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;margin-top:4px;"></span>
          <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
            <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(primary)}</span>
            ${bodyHtml}
            <span style="font-size:11px;color:#8a8d86;margin-top:2px;">${escapeHtml(relTime)} · ${escapeHtml(absDate)}</span>
          </span>
          ${thumbHtml}
        </div>`;
      }
    }
  }

  return html;
}

function renderTasksTab(plant) {
  const step = getOnboardingStep();
  const isOnboardingPlant = plant.id === getOnboardingPlantId();

  if (step === 3 && isOnboardingPlant) {
    const onboardingTask = plant.tasks.find(t => t.id === getOnboardingTaskId());
    if (onboardingTask) {
      return `<div style="font-size:13px;font-weight:500;color:#3a6b3a;margin-bottom:8px;">${t('onboarding.tasksBanner.step3')}</div>
<div class="task-list">${renderTaskCard(plant.id, onboardingTask, true)}</div>`;
    }
  }

  if (plant.tasks.length === 0) {
    return `<div class="tasks-empty-state">
  <div class="tasks-empty-icon">📋</div>
  <div class="tasks-empty-title">${t('plantDetail.tasks.emptyTitle')}</div>
  <div class="tasks-empty-sub">${t('plantDetail.tasks.emptySub', { name: escapeHtml(plant.name) })}</div>
</div>`;
  }
  let html = '';
  const filtered = plant.tasks.filter(t => matchesFilter(t.owner));
  if (filtered.length === 0) {
    html += `<div class="detail-empty">${t('plantDetail.tasks.noneForFilter')}</div>`;
    return html;
  }
  const today = todayStr();
  const urgencyGroup = (t) => {
    if (t.paused) return 5;
    if (t.lastDone === today) return 6;
    const d = daysUntilDue(t);
    if (d === Infinity) return 6;
    if (d < 0)   return 1;
    if (d === 0) return 2;
    if (d === 1) return 3;
    return 4;
  };
  const sorted = [...filtered].sort((a, b) => {
    const ga = urgencyGroup(a);
    const gb = urgencyGroup(b);
    if (ga !== gb) return ga - gb;
    if (ga === 4)  return daysUntilDue(a) - daysUntilDue(b);
    return 0;
  });
  if (sorted.length > 0) {
    html += `<div style="display:flex;align-items:center;gap:8px;padding:0 0 8px;">
      <span style="width:3px;height:14px;background:#2e7d32;border-radius:2px;flex-shrink:0;"></span>
      <span style="font-size:11px;font-weight:500;color:#8a9180;text-transform:uppercase;letter-spacing:0.05em;">${t('plantDetail.tasks.listHeader')}</span>
    </div>
    <div class="task-row-list">`;
    for (const task of sorted) {
      html += renderTaskRow(plant.id, task);
    }
    html += `</div>`;
  }

  return html;
}

function renderNotesTab(plant) {
  const plantNotes = notes
    .filter(n => n.plantId === plant.id)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  if (plantNotes.length === 0) {
    return `<div style="text-align:center;padding:48px 24px 32px;">
  <div style="font-size:32px;margin-bottom:12px;">📝</div>
  <div style="font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">${t('plantDetail.notes.emptyTitle')}</div>
  <div style="font-size:13px;color:#888;line-height:1.5;max-width:260px;margin:0 auto;">${t('plantDetail.notes.emptySub', { name: escapeHtml(plant.name) })}</div>
</div>`;
  }

  let html = '';
  const filteredNotes = plantNotes.filter(n => matchesFilter(n.author));

  if (filteredNotes.length === 0) {
    html += `<div class="detail-empty">${t('plantDetail.notes.noneForFilter')}</div>`;
    return html;
  }

  const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
  html += `<div class="notes-tab-container" style="padding:0 16px 16px;">`;
  let lastMon = null;

  for (const note of filteredNotes) {
    // Month group header
    const dateStr  = note.createdAt ? note.createdAt.split('T')[0] : null;
    const monthKey = dateStr ? dateStr.slice(0, 7) : null;
    if (monthKey && monthKey !== lastMon) {
      lastMon = monthKey;
      const [y, m] = monthKey.split('-').map(Number);
      const lbl = new Date(y, m - 1, 1).toLocaleDateString(displayLocale(), { month: 'long', year: 'numeric' });
      html += `<div class="carelog-month-header">${lbl.toUpperCase()}</div>`;
    }

    // Date column
    let dayAbbr = '—', dayNum = '—';
    if (dateStr) {
      const d = new Date(dateStr + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        dayAbbr = d.toLocaleDateString(displayLocale(), { weekday: 'short' }).toUpperCase().slice(0, 3);
        dayNum  = String(d.getDate());
      }
    }

    // Owner circle
    const member  = membersCache.find(m2 => m2.display_name === note.author);
    const color   = member?.color ?? '#888';
    const initial = (note.author ?? '?')[0].toUpperCase();

    const isOwn     = note.memberId && note.memberId === activeMemberId;
    const rowAction = isOwn
      ? `data-action="edit-note" data-note="${escapeHtml(note.id)}" data-plant="${escapeHtml(plant.id)}"`
      : '';

    const photoThumbHtml = note.photoUrl
      ? `<span class="care-log-thumb"><img loading="lazy" class="notes-tab-thumb" src="${escapeHtml(note.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(note.photoUrl)}" data-note-id="${escapeHtml(note.id)}" data-plant-id="${escapeHtml(note.plantId)}" style="width:36px;height:36px;border-radius:8px;border:1.5px solid #7a907f;" /></span>`
      : '';

    html += `
    <div class="upcoming-row notes-tab-row" ${rowAction}>
      <div class="upcoming-date-col">
        <span class="upcoming-date-dow">${dayAbbr}</span>
        <span class="upcoming-date-num">${dayNum}</span>
      </div>
      <div class="upcoming-card">
        <span class="upcoming-card-emoji-tile" style="background:#eef1e8;">${plant.emoji}</span>
        <span class="upcoming-card-divider"></span>
        <div class="notes-tab-body">${escapeHtml(note.note)}</div>
        ${photoThumbHtml}
        <div class="notes-tab-owner" style="background:${escapeHtml(color)};">${escapeHtml(initial)}</div>
      </div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

function renderCareLogTab(plant) {
  let html = '';

  // Build unified list: care_log entries + notes, filtered by the global activeFilter
  const plantNotes = notes.filter(n => n.plantId === plant.id);

  const careItems = plant.careLog
    .filter(e => matchesFilter(e.author))
    .map(e => ({
      kind:   'care',
      sortKey: e.date ?? '',
      date:   e.date ?? null,
      data:   e,
    }));

  const noteItems = plantNotes
    .filter(n => matchesFilter(n.author))
    .map(n => {
    const isoDate = n.createdAt ? n.createdAt.split('T')[0] : null;
    return {
      kind:    'note',
      sortKey: n.createdAt ?? '',
      date:    isoDate,
      data:    n,
    };
  });

  const unified = [...careItems, ...noteItems]
    .sort((a, b) => (b.sortKey ?? '').localeCompare(a.sortKey ?? ''));

  if (unified.length === 0) {
    html += `<div style="text-align:center;padding:40px 24px 24px;">
  <div style="font-size:32px;margin-bottom:12px;">📖</div>
  <div style="font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">${t('plantDetail.careLog.emptyTitle')}</div>
  <div style="font-size:13px;color:#888;line-height:1.5;">${t('plantDetail.careLog.emptySub')}</div>
</div>`;
    return html;
  }

  // Group by month (YYYY-MM)
  let lastMonth = null;
  html += `<div class="carelog-new-list" style="padding:0 16px 16px;">`;
  for (const item of unified) {
    const dateStr = item.date;
    const monthKey = dateStr ? dateStr.slice(0, 7) : null;

    if (monthKey && monthKey !== lastMonth) {
      lastMonth = monthKey;
      const [y, m] = monthKey.split('-').map(Number);
      const monthLabel = new Date(y, m - 1, 1).toLocaleDateString(displayLocale(), { month: 'long', year: 'numeric' });
      html += `<div class="carelog-month-header">${monthLabel.toUpperCase()}</div>`;
    }

    if (item.kind === 'care') {
      html += renderCareLogNewRow(item.data, plant);
    } else {
      html += renderCareLogNoteRow(item.data);
    }
  }
  html += `</div>`;

  return html;
}

function activityTaskTileHtml(taskType, icon) {
  const t = String(taskType ?? '').toLowerCase().replace(/[^a-z]/g, '') || 'custom';
  return `<span style="width:40px;height:40px;background:var(--${t}-bg, #f4f6f2);border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icon}</span>`;
}

function renderCareLogNewRow(entry, plant) {
  const isSkipped   = entry.taskType === 'skipped';
  const matchedTask = plant?.tasks?.find(t => t.id === entry.taskId);
  const cfg         = matchedTask ? getTaskConfig(matchedTask) : null;
  const taskIcon    = isSkipped
    ? (CARE_ICON.skipped ?? '⏭')
    : (cfg?.icon ?? (entry.taskType ? (CARE_ICON[entry.taskType] ?? '✅') : '✅'));
  const taskType    = isSkipped ? 'skipped' : (cfg?.type ?? entry.taskType);
  const member      = membersCache.find(m => m.display_name === entry.author);
  const color       = member?.color ?? '#888';
  const initial     = (entry.author ?? '?')[0].toUpperCase();

  const dateStr = entry.date ?? (entry.createdAt ? entry.createdAt.split('T')[0] : null);
  let dayAbbr = '—';
  let dayNum  = '—';
  if (dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    if (!isNaN(d.getTime())) {
      dayAbbr = d.toLocaleDateString(displayLocale(), { weekday: 'short' }).toUpperCase();
      dayNum  = String(d.getDate());
    }
  }

  const iconTileHtml = isSkipped
    ? `<span class="activity-icon-skipped" style="width:40px;height:40px;background:#f4f6f2;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${taskIcon}</span>`
    : activityTaskTileHtml(taskType, taskIcon);

  return `<div class="carelog-new-row${isSkipped ? ' activity-row-skipped' : ''}" data-action="carelog-open-edit-task" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(entry.taskId ?? '')}">
  <div class="carelog-new-date-col">
    <span class="carelog-new-date-dow">${dayAbbr}</span>
    <span class="carelog-new-date-num">${dayNum}</span>
  </div>
  <div class="carelog-new-card">
    ${iconTileHtml}
    <div class="carelog-new-info">
      <span class="carelog-new-name">${escapeHtml(entry.taskName ?? '')}</span>
      <span class="carelog-new-time${isSkipped ? ' activity-sub-skipped' : ''}">${isSkipped ? t('plantDetail.careLog.skipped') : '—'}</span>
    </div>
    <div class="carelog-new-owner" style="background:${escapeHtml(color)};">${escapeHtml(initial)}</div>
  </div>
</div>`;
}

function renderCareLogNoteRow(note) {
  const member  = membersCache.find(m => m.display_name === note.author);
  const color   = member?.color ?? '#888';
  const initial = (note.author ?? '?')[0].toUpperCase();

  const dateStr = note.createdAt ? note.createdAt.split('T')[0] : null;
  let dayAbbr = '—';
  let dayNum  = '—';
  let timeStr = '—';
  if (note.createdAt) {
    const d = new Date(note.createdAt);
    if (!isNaN(d.getTime())) {
      dayAbbr = d.toLocaleDateString(displayLocale(), { weekday: 'short' }).toUpperCase();
      dayNum  = String(d.getDate());
      timeStr = d.toLocaleTimeString(displayLocale(), { hour: 'numeric', minute: '2-digit' });
    }
  }

  const preview = note.note.length > 30 ? note.note.slice(0, 30) + '…' : note.note;

  const photoThumbHtml = note.photoUrl
    ? `<span class="care-log-thumb"><img loading="lazy" class="carelog-note-thumb" src="${escapeHtml(note.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(note.photoUrl)}" data-note-id="${escapeHtml(note.id)}" data-plant-id="${escapeHtml(note.plantId)}" style="width:36px;height:36px;border-radius:8px;border:1.5px solid #7a907f;" /></span>`
    : '';

  return `<div class="carelog-new-row" data-action="carelog-open-edit-note" data-plant="${escapeHtml(note.plantId)}" data-note="${escapeHtml(note.id)}">
  <div class="carelog-new-date-col">
    <span class="carelog-new-date-dow">${dayAbbr}</span>
    <span class="carelog-new-date-num">${dayNum}</span>
  </div>
  <div class="carelog-new-card">
    <span style="width:36px;height:36px;background:#e8f0fb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">💬</span>
    <div class="carelog-new-info">
      <span class="carelog-new-name">${t('menu.toast.noteAdded')}</span>
      <span class="carelog-new-time">${escapeHtml(preview)}</span>
    </div>
    ${photoThumbHtml}
    <div class="carelog-new-owner" style="background:${escapeHtml(color)};">${escapeHtml(initial)}</div>
  </div>
</div>`;
}

function renderCareLogUpcomingRow(task) {
  const cfg        = getTaskConfig(task);
  const { label: dueLabel, cls: dueCls } = dueLabelAndClass(task);
  const ownerColor = membersCache.find(m => m.display_name === task.owner)?.color
    ?? USERS[task.owner]?.color ?? '#666';

  return `
  <div class="carelog-upcoming-row">
    <span class="carelog-row-icon">${cfg.icon}</span>
    <div class="carelog-upcoming-meta">
      <span class="carelog-row-name">${escapeHtml(cfg.name)}</span>
      <span class="carelog-row-sub">${escapeHtml(recurrenceLabel(task))}</span>
    </div>
    <span class="owner-dot" style="background:${escapeHtml(ownerColor)}"></span>
    <span class="task-status-badge ${dueCls}">${escapeHtml(dueLabel)}</span>
  </div>`;
}

function renderCareLogPastRow(entry, linkedNote, plant) {
  const matchedTask = plant?.tasks?.find(t => t.id === entry.taskId);
  const cfg         = matchedTask ? getTaskConfig(matchedTask) : null;
  const taskIcon    = cfg?.icon ?? getTaskConfig({ type: entry.taskType, name: entry.taskName })?.icon ?? '✅';
  const member      = membersCache.find(m => m.display_name === entry.author);
  const color       = member?.color ?? '#888';
  const diff       = daysBetween(entry.date, todayStr());
  const when       = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`;
  const noteLine   = linkedNote
    ? `<div class="carelog-past-note">${escapeHtml(linkedNote.note)}</div>`
    : '';

  return `
  <div class="carelog-past-row">
    <span class="carelog-row-icon">✅</span>
    <div class="carelog-past-meta">
      <div class="carelog-past-main">
        <span style="background:${color}20;color:${color};font-weight:500;border-radius:20px;padding:2px 9px;font-size:13px;display:inline-block;">${escapeHtml(entry.author)}</span> ${taskIcon} ${escapeHtml(entry.taskName)}
      </div>
      ${noteLine}
    </div>
    <div class="carelog-past-date">${when}</div>
  </div>`;
}

function renderExpandedTaskRow(plantId, task) {
  const cfg        = getTaskConfig(task);
  const ownerColor = membersCache.find(m => m.display_name === task.owner)?.color
    ?? USERS[task.owner]?.color ?? '#666';
  const { label: dueLabel, cls: dueCls } = dueLabelAndClass(task);
  const otherOwner = task.owner === 'Matu' ? 'Vale' : 'Matu';
  const doneToday  = task.lastDone === todayStr();

  return `
  <div class="expanded-task-row" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">
    <div class="expanded-task-top">
      <span class="task-icon">${cfg.icon}</span>
      <div class="expanded-task-meta">
        <span class="task-name">${escapeHtml(cfg.name)}</span>
        <span class="task-meta-line">${escapeHtml(recurrenceLabel(task))} &middot; ${lastDoneLabel(task)}</span>
      </div>
      <span class="owner-dot" style="background:${escapeHtml(ownerColor)}" title="${escapeHtml(task.owner)}"></span>
      <span class="task-status-badge ${dueCls}">${escapeHtml(dueLabel)}</span>
    </div>
    <div class="task-actions">
      ${doneToday
        ? `<button class="btn btn-warning" data-action="undo-mark-done" data-plant="${plantId}" data-task="${task.id}">&#8630; ${t('menu.toast.undo')}</button>`
        : `<button class="btn btn-primary" data-action="mark-done" data-plant="${plantId}" data-task="${task.id}">&#10003; ${t('taskCard.done')}</button>
           <button class="btn btn-secondary" data-action="mark-done-with-note" data-plant="${plantId}" data-task="${task.id}">&#10003; ${t('taskCard.plusNote')}</button>`
      }
      <button class="btn btn-secondary" data-action="reassign-task" data-plant="${plantId}" data-task="${task.id}">&#8644; ${escapeHtml(otherOwner)}</button>
      <button class="btn btn-ghost" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">&#9999;&#xFE0E;</button>
    </div>
  </div>`;
}

function renderCompactTaskRow(plantId, task) {
  const cfg        = getTaskConfig(task);
  const ownerColor = membersCache.find(m => m.display_name === task.owner)?.color
    ?? USERS[task.owner]?.color ?? '#666';
  const { label: dueLabel, cls: dueCls } = dueLabelAndClass(task);

  return `
  <div class="compact-task-row" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">
    <span class="task-icon">${cfg.icon}</span>
    <div class="compact-task-meta">
      <span class="task-name">${escapeHtml(cfg.name)}</span>
      <span class="task-meta-line">${escapeHtml(recurrenceLabel(task))}</span>
    </div>
    <span class="owner-dot" style="background:${escapeHtml(ownerColor)}" title="${escapeHtml(task.owner)}"></span>
    <span class="task-status-badge ${dueCls}">${escapeHtml(dueLabel)}</span>
    <span class="task-edit-chevron">&#8250;</span>
  </div>`;
}

function renderTaskCard(plantId, task, onboardingMode = false) {
  const cfg = getTaskConfig(task);
  const isPaused = task.paused ?? false;
  const ownerCls = task.owner.toLowerCase();
  const otherOwner = task.owner === 'Matu' ? 'Vale' : 'Matu';

  const cardStyle = onboardingMode
    ? ' style="border: 1.5px solid #3a6b3a; background: #f4faf4;"'
    : '';

  let html = `
  <div class="task-card${isPaused ? ' paused' : ''}"${cardStyle}>
    <div class="task-card-inner">
      <div class="task-left-bar ${cfg.type}"></div>
      <div class="task-body">
        <div class="task-row1">
          <span class="task-icon">${cfg.icon}</span>
          <span class="task-name">${cfg.name}</span>
          ${isPaused ? `<span class="task-paused-badge">${t('taskCard.paused')}</span>` : ''}
          <span class="owner-badge ${ownerCls}">${task.owner}</span>
        </div>
        <div class="task-meta">${escapeHtml(recurrenceLabel(task))} &middot; ${lastDoneLabel(task)}</div>`;

  if (!isPaused) {
    const _daysDebug = daysUntilDue(task);
    console.log('[due-debug]', { id: task.id, lastDone: task.lastDone, today: todayStr(), daysUntilDue: _daysDebug, recurrenceType: task.recurrenceType });
    const { label: dueLabel, cls: dueCls } = dueLabelAndClass(task);
    const dueIcon = dueCls === 'due' ? '&#9888;&#65039;' : dueCls === 'soon' ? '&#128276;' : '&#10003;';
    html += `<div class="task-due-label ${dueCls}">${dueIcon} ${escapeHtml(dueLabel)}</div>`;
  }

  if (task.note) {
    html += `<div class="task-note-text">${escapeHtml(task.note)}</div>`;
  }

  if (onboardingMode) {
    html += `
        <div class="task-actions">
          <button class="btn btn-primary" data-action="mark-done" data-plant="${plantId}" data-task="${task.id}">&#10003; ${t('taskCard.done')}</button>
        </div>`;
  } else if (isPaused) {
    html += `
        <div class="task-actions">
          <button class="btn btn-secondary" data-action="resume-task" data-plant="${plantId}" data-task="${task.id}">&#9654; ${t('taskCard.resume')}</button>
          <button class="btn btn-ghost task-edit-icon-btn" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">&#9999;&#xFE0E;</button>
        </div>`;
  } else {
    const doneToday = task.lastDone === todayStr();
    html += `
        <div class="task-actions">
          ${doneToday
            ? `<button class="btn btn-warning" data-action="undo-mark-done" data-plant="${plantId}" data-task="${task.id}">&#8630; ${t('menu.toast.undo')}</button>`
            : `<button class="btn btn-primary" data-action="mark-done" data-plant="${plantId}" data-task="${task.id}">&#10003; ${t('taskCard.done')}</button>
               <button class="btn btn-secondary" data-action="mark-done-with-note" data-plant="${plantId}" data-task="${task.id}">&#10003; ${t('taskCard.plusNote')}</button>`
          }
          <button class="btn btn-secondary" data-action="reassign-task" data-plant="${plantId}" data-task="${task.id}">&#8644; ${escapeHtml(otherOwner)}</button>
          <button class="btn btn-ghost task-edit-icon-btn" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">&#9999;&#xFE0E;</button>
        </div>`;
  }

  html += `
      </div>
    </div>
  </div>`;

  return html;
}

function renderTaskRow(plantId, task) {
  const cfg      = getTaskConfig(task);
  const isPaused = task.paused ?? false;
  const doneToday = !isPaused && task.lastDone === todayStr();

  // Meta line: recurrence text
  const recType = task.recurrenceType ?? 'interval';
  const recText = recurrenceLabel(task, RECURRENCE_VERBOSE_OPTS);

  // Meta line: urgency text (neutral color regardless of due date)
  let urgencyText;
  if (isPaused) {
    urgencyText = t('taskCard.paused');
  } else if (doneToday) {
    urgencyText = t('status.row.doneToday');
  } else {
    const days = daysUntilDue(task);
    if (recType === 'one-off') {
      if (days === Infinity) {
        urgencyText = t('status.row.done');
      } else {
        const nd = computeNextDue(task);
        const ds = nd ? new Date(nd + 'T12:00:00').toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric' }) : '—';
        if (days > 1)        urgencyText = t('status.row.dueDate', { date: ds });
        else if (days === 1) urgencyText = t('status.row.dueTomorrow');
        else if (days === 0) urgencyText = t('status.row.dueToday');
        else                 urgencyText = t('status.row.overdue');
      }
    } else {
      if (days < 0)        urgencyText = t('status.row.overdue');
      else if (days === 0) urgencyText = t('status.row.dueToday');
      else if (days === 1) urgencyText = t('status.row.dueTomorrow');
      else                 urgencyText = t('status.row.dueInDays', { n: days });
    }
  }

  // Owner circle
  const ownerMember = membersCache.find(m => m.display_name === task.owner);
  const ownerColor  = ownerMember?.color ?? '#888';
  const ownerInit   = (task.owner ?? '?')[0].toUpperCase();

  // Right-edge button: pause-badge for paused tasks (resumes on tap). No button otherwise.
  const rightHtml = isPaused
    ? `<button class="task-row-check task-row-pause" data-action="resume-task" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(task.id)}" aria-label="${t('home.aria.resume')}" style="background:#f0a500;border:none;border-radius:50%;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;gap:3px;flex-shrink:0;padding:0;cursor:pointer;">
        <span style="width:3px;height:10px;background:white;border-radius:1px;display:inline-block;"></span>
        <span style="width:3px;height:10px;background:white;border-radius:1px;display:inline-block;"></span>
      </button>`
    : '';

  return `<div class="task-row${isPaused ? ' task-row--paused' : ''}" data-action="edit-task" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(task.id)}">
  <span class="task-row-tile task-row-tile--${escapeHtml(cfg.type)}">${cfg.icon}</span>
  <span class="task-row-divider"></span>
  <div class="task-row-content">
    <div class="task-row-name">${escapeHtml(cfg.name)}</div>
    <div class="task-row-meta" style="color:#8a8d86;">${escapeHtml(recText)} &middot; ${escapeHtml(urgencyText)}</div>
  </div>
  <div class="task-row-owner" style="background:${escapeHtml(ownerColor)};">${escapeHtml(ownerInit)}</div>
  ${rightHtml}
</div>`;
}

function renderNoteCard(note) {
  const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
  const isOwn = note.memberId && note.memberId === activeMemberId;
  const noteMember = membersCache.find(m => m.display_name === note.author);
  const noteColor = noteMember?.color ?? '#888';
  const isEditing = editingNoteId === note.id;

  const actions = isOwn
    ? `<div class="health-note-btns">
         <button class="note-action-btn" data-action="edit-note" data-note="${note.id}" title="${t('notes.editTooltip')}">&#9999;&#xFE0E;</button>
         <button class="note-action-btn note-action-btn--delete" data-action="delete-note" data-plant="${note.plantId}" data-note="${note.id}" title="${t('photos.delete')}">&#128465;&#xFE0E;</button>
       </div>`
    : '';

  const taskMeta = (() => {
    if (!note.taskId) return '';
    const plant = getPlant(note.plantId);
    const task = plant?.tasks.find(t => t.id === note.taskId);
    if (!task) return '';
    const cfg = getTaskConfig(task);
    return ` &middot; ${cfg.icon} ${t('notes.noteTaskMeta', { task: escapeHtml(cfg.name) })}`;
  })();

  const body = isEditing
    ? `<textarea class="form-textarea note-edit-textarea" data-note="${note.id}" style="min-height:80px">${escapeHtml(note.note)}</textarea>
       <div class="note-edit-actions">
         <button class="btn btn-ghost btn-sm" data-action="cancel-note-edit" data-note="${note.id}">${t('taskSheet.cancel')}</button>
         <button class="btn btn-primary btn-sm" data-action="save-note-edit" data-note="${note.id}">${t('auth.reset.save')}</button>
       </div>`
    : `<div class="health-note-text">${escapeHtml(note.note)}</div>`;

  return `
  <div class="health-note-card">
    <div class="health-note-header">
      <span class="health-note-meta">
        <span style="background:${noteColor}20;color:${noteColor};font-weight:500;border-radius:20px;padding:2px 9px;font-size:13px;display:inline-block;">${escapeHtml(note.author)}</span>
        &middot; ${formatNoteDate(note.createdAt)}${taskMeta}
      </span>
      ${actions}
    </div>
    ${body}
  </div>`;
}

function renderCareLogEntry(entry) {
  const type = entry.taskType ?? TASK_CONFIG[entry.taskId]?.type ?? 'custom';
  return `
  <div class="care-log-entry">
    <div class="care-log-dot ${type}"></div>
    <div class="care-log-info">
      <div class="care-log-task">${escapeHtml(entry.taskName)}</div>
    </div>
    <div class="care-log-date">${formatDateShort(entry.date)}</div>
  </div>`;
}

// ============================================================
// BOTTOM SHEET
// ============================================================

function openSheet(contentHtml) {
  document.getElementById('sheet-content').innerHTML = contentHtml;
  document.getElementById('sheet').classList.add('active');
  document.getElementById('overlay').classList.add('active');
}

function openOverdueActionSheet(plantId, taskId) {
  const plant = getPlant(plantId);
  const task  = plant?.tasks.find(t => t.id === taskId);
  if (!task) return;
  const cfg     = getTaskConfig(task);
  const isOneOff = (task.recurrenceType ?? 'interval') === 'one-off';

  const skipBtnHtml = isOneOff ? '' : `
    <button class="btn btn-ghost" data-action="caring-skip-task" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" style="width:100%;text-align:center;padding:14px;font-size:15px;">⏭ ${t('taskSheet.overdueSheet.skip')}</button>`;

  state.sheetMode = 'overdue-action';
  state.sheetData = { plantId, taskId };

  openSheet(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <span style="width:36px;height:36px;background:#eef3eb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${cfg.icon}</span>
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
        <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(cfg.name)}</div>
        <div style="font-size:12px;color:#8a8d86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name)}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="btn btn-primary" data-action="caring-action-mark-done" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" style="width:100%;text-align:center;padding:14px;font-size:15px;">✓ ${t('home.aria.markDone')}</button>
      ${skipBtnHtml}
      <button class="btn btn-ghost" data-action="caring-open-edit-task" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" style="width:100%;text-align:center;padding:14px;font-size:15px;">${t('taskSheet.overdueSheet.editTask')}</button>
      <button class="btn btn-ghost" data-action="close-sheet" style="width:100%;text-align:center;padding:14px;font-size:15px;margin-top:6px;">${t('taskSheet.cancel')}</button>
    </div>
  `);
}

// ============================================================
// RESCHEDULE PROMPT (off-schedule mark-done)
// ============================================================

// Sunday of the week containing dateStr (Sun=0…Sat=6)
function getSundayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

// Occurrence dates (strictly after today, through gridEnd) on the sequence
// anchorDate + interval, +2*interval, +3*interval, …
function intervalOccurrencesAfterToday(anchorDate, intervalDays, gridEnd) {
  const out = [];
  const today = todayStr();
  let cursor = addDays(anchorDate, intervalDays);
  while (cursor <= today) cursor = addDays(cursor, intervalDays);
  while (cursor <= gridEnd) {
    out.push(cursor);
    cursor = addDays(cursor, intervalDays);
  }
  return out;
}

// Occurrence dates (strictly after today, through gridEnd) of any of the given weekday numbers.
function weekdayOccurrencesAfterToday(weekdays, gridEnd) {
  if (!weekdays || weekdays.length === 0) return [];
  const out = [];
  let cursor = addDays(todayStr(), 1);
  while (cursor <= gridEnd) {
    const dow = new Date(cursor + 'T12:00:00').getDay();
    if (weekdays.includes(dow)) out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

function showReschedulePrompt(plantId, taskId, displacement, mostRecentDueDate) {
  const plant = getPlant(plantId);
  const task  = plant?.tasks.find(t => t.id === taskId);
  if (!task) return;
  const cfg     = getTaskConfig(task);
  const recType = task.recurrenceType ?? 'interval';
  if (recType === 'one-off') return;

  // Yearly uses a simplified, text-only card (no 28-day grid — the next occurrence
  // is ~a year out, off-grid). Two options share the overlay shell and the same
  // reschedule-keep-original / reschedule-modify data-actions as interval/weekday.
  // markTaskDone has already set lastDone=today (and cleared any override), so
  // computeNextDue(task) here is the post-#401-8 next-year original anchor.
  if (recType === 'yearly') {
    const today       = todayStr();
    const shiftMonth  = Number(today.slice(5, 7));   // completion-date month
    const shiftDay    = Number(today.slice(8, 10));  // completion-date day
    const shiftLabel  = formatDateShort(today);      // e.g. "Jul 8"
    const keepNextDue = computeNextDue(task);         // next year's original anchor
    const keepLabel   = keepNextDue ? formatDate(keepNextDue) : '—';
    const anchorLabel = `${YEARLY_MONTH_NAMES[(task.recurrenceMonth ?? 1) - 1]} ${task.recurrenceDay ?? ''}`;
    const isLate      = displacement > 0;   // #401-12: yearly is late when a prior cycle's anchor has already passed
    const offsetDays  = Math.abs(displacement);
    const headlineColor = isLate ? '#a32d2d' : '#2e6b28';   // red only for late, matching the interval branch
    // formatFullDate is a const declared further down (interval/weekday path) —
    // out of scope here (TDZ), so inline the same "Wkd, Mon D" format.
    const todayFull   = new Date(today + 'T12:00:00').toLocaleDateString(displayLocale(), { weekday: 'short', month: 'short', day: 'numeric' });

    const yearlyCard = `
      <div style="background:#ffffff;border-radius:20px;padding:24px 20px;max-width:390px;width:calc(100% - 32px);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f7f8f6;border-radius:12px;margin-bottom:16px;">
          <div style="width:44px;height:44px;border-radius:10px;background:#e8f5e9;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${cfg.icon}</div>
          <div>
            <div style="font-size:15px;font-weight:700;color:#1a2e1a;margin:0 0 2px;">${escapeHtml(cfg.name)} · ${escapeHtml(plant.name)}</div>
            <div style="font-size:12px;color:#6b7c6b;">${t('reschedule.yearly.everyYearOn', { anchor: escapeHtml(anchorLabel) })}</div>
          </div>
        </div>
        <div style="font-size:18px;font-weight:600;color:${headlineColor};text-align:center;margin-bottom:4px;">${isLate ? tn('reschedule.yearly.runningLate', offsetDays) : tn('reschedule.yearly.runningEarly', offsetDays)}</div>
        <div style="font-size:12px;color:#888;text-align:center;margin-bottom:16px;">${t('reschedule.todayIs', { date: todayFull })}</div>
        <div data-action="reschedule-keep-original" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" data-direction="${isLate ? 'late' : 'early'}" data-days="${offsetDays}" style="background:#f7f8f6;border:1px solid #d8ddd4;border-radius:14px;padding:16px;cursor:pointer;margin-bottom:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div>
              <div style="font-size:14px;font-weight:600;color:#4a5e4a;margin-bottom:2px;">${t('reschedule.keepOriginal.title')}</div>
              <div style="font-size:12px;color:#6b7c6b;">${t('reschedule.nextDue', { date: escapeHtml(keepLabel) })}</div>
            </div>
            <div style="font-size:20px;font-weight:300;color:#aaaaaa;line-height:1;">›</div>
          </div>
        </div>
        <div data-action="reschedule-modify" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" data-direction="${isLate ? 'late' : 'early'}" data-days="${offsetDays}" style="background:#f0f7ec;border:2px solid #4a8c3f;border-radius:14px;padding:16px;cursor:pointer;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div style="min-width:0;">
              <div style="font-size:14px;font-weight:700;color:#2e6b28;margin-bottom:2px;">${t('reschedule.acceptModified.title')}</div>
              <div style="font-size:12px;color:#2e6b28;">${t('reschedule.yearly.moveAnchor', { date: escapeHtml(shiftLabel) })}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <div style="background:#c8e6c9;color:#1b5e20;font-size:12px;font-weight:500;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0;">&rarr; ${escapeHtml(shiftLabel)}</div>
              <div style="font-size:20px;font-weight:300;color:#2e6b28;line-height:1;">›</div>
            </div>
          </div>
        </div>
      </div>`;

    closeReschedulePrompt();
    const overlay = document.createElement('div');
    overlay.id = 'reschedule-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;overflow:hidden;';
    // Stash the shifted anchor for reschedule-modify (yearly writes the anchor,
    // not next_due_override — the override self-reverts on the next completion).
    overlay.dataset.modifiedMonth = String(shiftMonth);
    overlay.dataset.modifiedDay   = String(shiftDay);
    overlay.innerHTML = yearlyCard;
    overlay.addEventListener('click', handleEvent);
    document.body.appendChild(overlay);
    return;
  }

  const isLate = displacement > 0;
  const absDays = Math.abs(displacement);

  // Compute Original and Modified occurrence dates.
  let originalDates = [];
  let modifiedDates = [];
  let shiftedWeekdays = null;
  let originalWeekdaysLabel = '';
  let modifiedWeekdaysLabel = '';

  // Highlight every future occurrence that lands within the 28-day calendar grid.
  const gridEnd = addDays(getMondayOfWeek(todayStr()), 27);

  if (recType === 'weekdays') {
    const origWd = (task.weekdays ?? []).slice();
    shiftedWeekdays = origWd.map(d => ((d + displacement) % 7 + 7) % 7);
    const sortAndDedupe = arr => Array.from(new Set(arr)).sort((a, b) => a - b);
    const origSorted = sortAndDedupe(origWd);
    const modSorted  = sortAndDedupe(shiftedWeekdays);
    shiftedWeekdays = modSorted;
    const full = WEEKDAY_NAMES_ABBR;
    originalWeekdaysLabel = origSorted.slice().sort(compareWeekdaysMonFirst).map(d => full[d]).join(' & ');
    modifiedWeekdaysLabel = modSorted.slice().sort(compareWeekdaysMonFirst).map(d => full[d]).join(' & ');
    originalDates = weekdayOccurrencesAfterToday(origSorted, gridEnd);
    modifiedDates = weekdayOccurrencesAfterToday(modSorted, gridEnd);
  } else {
    const interval = task.frequencyDays ?? 1;
    originalDates = intervalOccurrencesAfterToday(mostRecentDueDate, interval, gridEnd);
    // Modified: shift each original date by displacement.
    modifiedDates = originalDates.map(d => addDays(d, displacement));
  }

  const today = todayStr();
  const modSet = new Set(modifiedDates);

  // Keep-original future due set: future Original-schedule occurrences after today.
  // For early case, most_recent_due is itself in the future and worth showing.
  const keepFutureSet = new Set(originalDates);
  if (mostRecentDueDate > today) keepFutureSet.add(mostRecentDueDate);

  // Direction palette.
  const headlineColor   = isLate ? '#a32d2d' : '#2e6b28';
  const todayCircleBg   = isLate ? '#fde8e8' : '#e8f5e9';
  const todayCircleEdge = isLate ? '#a32d2d' : '#2e6b28';
  const todayCircleFg   = isLate ? '#a32d2d' : '#2e6b28';
  const modifyCardBg    = '#f0f7ec';
  const modifyCardBd    = '#4a8c3f';
  const modifyTitleFg   = '#2e6b28';
  const modifyPillBg    = '#c8e6c9';
  const modifyPillFg    = '#1b5e20';
  const modifyFutureBg  = '#4a8c3f';
  const modifyFutureFg  = '#ffffff';

  const deltaText = isLate
    ? tn('reschedule.deltaLater', displacement)
    : tn('reschedule.deltaEarlier', Math.abs(displacement));

  const recurrenceSummary = recType === 'weekdays'
    ? originalWeekdaysLabel
    : tn('reschedule.recurrenceEveryDays', task.frequencyDays ?? 1);

  const formatFullDate = (s) => new Date(s + 'T12:00:00')
    .toLocaleDateString(displayLocale(), { weekday: 'short', month: 'short', day: 'numeric' });

  // Calendar layout: 4 rows, week starts Monday.
  // Keep card: anchored to missed due (late) or today (early).
  // Modify card: anchored to today.
  const WEEKS = 4;
  const keepStartMonday   = getMondayOfWeek(isLate ? mostRecentDueDate : today);
  const modifyStartMonday = getMondayOfWeek(today);

  const cellBase = 'font-size:11px;text-align:center;padding:4px 2px;border-radius:6px;line-height:1.8;box-sizing:border-box;';
  const dayHeaders = ['M','T','W','T','F','S','S']
    .map(l => `<div style="font-size:9px;color:#cccccc;text-align:center;padding:2px 0;">${l}</div>`)
    .join('');

  const renderCalendar = ({ startMonday, firstVisible, todayCellHasBg, futureDueSet, futureDueBg, futureDueFg, showMissedDue }) => {
    const endDate = addDays(startMonday, WEEKS * 7 - 1);
    const startMonthLbl = new Date(startMonday + 'T12:00:00').toLocaleDateString(displayLocale(), { month: 'short' });
    const endMonthLbl   = new Date(endDate     + 'T12:00:00').toLocaleDateString(displayLocale(), { month: 'short' });
    const monthLabel    = startMonthLbl === endMonthLbl ? startMonthLbl : `${startMonthLbl} – ${endMonthLbl}`;

    let cells = '';
    let cursor = startMonday;
    for (let i = 0; i < WEEKS * 7; i++) {
      const day = new Date(cursor + 'T12:00:00').getDate();
      const isToday      = cursor === today;
      const isMissedDue  = showMissedDue && isLate && cursor === mostRecentDueDate;
      const isFutureDue  = futureDueSet.has(cursor) && !isMissedDue && !isToday;
      const isInvisible  = firstVisible && cursor < firstVisible;

      if (isInvisible) {
        cells += `<div style="${cellBase}visibility:hidden;">${day}</div>`;
      } else if (isToday) {
        const cellBg = todayCellHasBg ? `background:${todayCircleBg};` : '';
        const circle = `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font-size:11px;font-weight:700;border:1.5px solid ${todayCircleEdge};background:${todayCircleBg};color:${todayCircleFg};">${day}</span>`;
        cells += `<div style="${cellBase}${cellBg}padding:1px 2px;">${circle}</div>`;
      } else if (isMissedDue) {
        cells += `<div style="${cellBase}background:#e8e8e6;color:#999999;font-weight:700;">${day}</div>`;
      } else if (isFutureDue) {
        cells += `<div style="${cellBase}background:${futureDueBg};color:${futureDueFg};font-weight:700;">${day}</div>`;
      } else {
        cells += `<div style="${cellBase}color:#cccccc;">${day}</div>`;
      }
      cursor = addDays(cursor, 1);
    }

    return `
      <div style="font-size:10px;color:#bbbbbb;text-align:center;margin-bottom:4px;">${escapeHtml(monthLabel)}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;">${dayHeaders}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;">${cells}</div>
    `;
  };

  const keepCalendar = renderCalendar({
    startMonday:     keepStartMonday,
    firstVisible:    isLate ? mostRecentDueDate : today,
    todayCellHasBg:  true,
    futureDueSet:    keepFutureSet,
    futureDueBg:     '#e8e8e6',
    futureDueFg:     '#444444',
    showMissedDue:   true,
  });

  const modifyCalendar = renderCalendar({
    startMonday:     modifyStartMonday,
    firstVisible:    null,
    todayCellHasBg:  false,
    futureDueSet:    modSet,
    futureDueBg:     modifyFutureBg,
    futureDueFg:     modifyFutureFg,
    showMissedDue:   false,
  });

  const cardHtml = `
    <div style="background:#ffffff;border-radius:20px;padding:24px 20px;max-width:390px;width:calc(100% - 32px);max-height:calc(100vh - 32px);overflow:hidden;box-sizing:border-box;">
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f7f8f6;border-radius:12px;margin-bottom:16px;">
        <div style="width:44px;height:44px;border-radius:10px;background:${isLate ? '#fce8e8' : '#e8f5e9'};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${cfg.icon}</div>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a2e1a;margin:0 0 2px;">${escapeHtml(cfg.name)} · ${escapeHtml(plant.name)}</div>
          <div style="font-size:12px;color:#6b7c6b;">${escapeHtml(recurrenceSummary)} · ${t('reschedule.summaryDue', { date: formatDateShort(mostRecentDueDate) })}</div>
        </div>
      </div>
      <div style="font-size:18px;font-weight:600;color:${headlineColor};text-align:center;margin-bottom:4px;">${isLate ? tn('reschedule.runningLate', absDays) : tn('reschedule.daysEarly', absDays)}</div>
      <div style="font-size:12px;color:#888;text-align:center;margin-bottom:16px;">${t('reschedule.todayIs', { date: formatFullDate(today) })}</div>
      <div data-action="reschedule-keep-original" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" data-direction="${isLate ? 'late' : 'early'}" data-days="${absDays}" style="background:#f7f8f6;border:1px solid #d8ddd4;border-radius:14px;padding:14px;cursor:pointer;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:14px;font-weight:600;color:#4a5e4a;">${t('reschedule.keepOriginal.title')}</div>
          <div style="font-size:20px;font-weight:300;color:#aaaaaa;line-height:1;">›</div>
        </div>
        ${keepCalendar}
        <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;">
          ${isLate ? `<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:2px;background:#fce8e8;border:1px solid #f09595;"></div>${t('reschedule.legend.missed')}</div>` : ''}
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:50%;border:1.5px solid ${todayCircleEdge};"></div>${t('relativeTime.today')}</div>
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:2px;background:#d8ddd4;"></div>${t('reschedule.legend.nextOccurrences')}</div>
        </div>
      </div>
      <div data-action="reschedule-modify" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" data-direction="${isLate ? 'late' : 'early'}" data-days="${absDays}" style="background:${modifyCardBg};border:2px solid #4a8c3f;border-radius:14px;padding:14px;cursor:pointer;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:14px;font-weight:700;color:${modifyTitleFg};">${t('reschedule.acceptModified.title')}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="background:${modifyPillBg};color:${modifyPillFg};font-size:12px;font-weight:500;padding:2px 8px;border-radius:20px;">${deltaText}</div>
            <div style="font-size:20px;font-weight:300;color:#2e6b28;line-height:1;">›</div>
          </div>
        </div>
        ${modifyCalendar}
        <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:50%;border:1.5px solid ${todayCircleEdge};"></div>${t('relativeTime.today')}</div>
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:2px;background:#4a8c3f;"></div>${t('reschedule.legend.nextOccurrences')}</div>
        </div>
      </div>
    </div>`;

  // Remove any existing overlay (in case of overlapping mark-dones).
  closeReschedulePrompt();

  const overlay = document.createElement('div');
  overlay.id = 'reschedule-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;overflow:hidden;';

  // Stash recurrence shift data so the action handler can apply it without
  // recomputing.
  overlay.dataset.modifiedFirstDate = modifiedDates[0] ?? '';
  if (recType === 'weekdays' && shiftedWeekdays) {
    overlay.dataset.modifiedWeekdays = JSON.stringify(shiftedWeekdays);
  }

  overlay.innerHTML = cardHtml;
  overlay.addEventListener('click', handleEvent);
  document.body.appendChild(overlay);
}

function closeReschedulePrompt() {
  const el = document.getElementById('reschedule-overlay');
  if (el) el.remove();
}

function closeSheet() {
  const sheet = document.getElementById('sheet');
  sheet.style.transform = '';
  sheet.classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
  state.sheetMode = null;
  state.sheetData = {};
  // Clear content after transition to release DOM listeners and touch state
  setTimeout(() => { document.getElementById('sheet-content').innerHTML = ''; }, 320);
}

// Subtle full-screen sync indicator for background foreground-reloads. Sits
// above content but below open sheets (see .reload-indicator z-index in CSS).
function showReloadIndicator() {
  if (document.getElementById('reload-indicator')) return;
  const el = document.createElement('div');
  el.id = 'reload-indicator';
  el.className = 'reload-indicator';
  el.innerHTML = '<div class="reload-spinner"></div>';
  document.body.appendChild(el);
}

function hideReloadIndicator() {
  document.getElementById('reload-indicator')?.remove();
}

function openMenu() {
  renderMenuPanel();
  document.body.classList.add('menu-open');
  document.getElementById('menu-panel').classList.add('active');
  document.getElementById('menu-overlay').classList.add('active');
}

function closeMenu() {
  document.body.classList.remove('menu-open');
  document.getElementById('menu-panel').classList.remove('active');
  document.getElementById('menu-overlay').classList.remove('active');
}

function openCalendarSyncSheet() {
  if (!currentMemberId || !householdId) {
    showToast(t('calendarSync.toast.loading'));
    return;
  }
  const base       = import.meta.env.VITE_SUPABASE_URL;
  const baseHost   = base.replace(/^https?:\/\//, '');
  // Cache-busting feed version (#430). Google Calendar caches subscribed ICS
  // feeds server-side keyed on the URL and refetches on its own slow schedule,
  // so a resubscribe to an identical URL keeps serving the old body (#429). Bump
  // this whenever the feed FORMAT changes: existing subscribers then get a new
  // URL key, forcing Google to fetch fresh. Appended to every subscribe/copy URL
  // (Apple webcal, Google render's cid, copied https) so all paths share one key.
  // The Edge Function ignores `v`; it only reads member_id / household_id.
  const feedVer    = '2';
  const meHttps    = `${base}/functions/v1/get-calendar-feed?member_id=${currentMemberId}&v=${feedVer}`;
  const meWebcal   = `webcal://${baseHost}/functions/v1/get-calendar-feed?member_id=${currentMemberId}&v=${feedVer}`;
  const hhHttps    = `${base}/functions/v1/get-calendar-feed?household_id=${householdId}&v=${feedVer}`;
  const hhWebcal   = `webcal://${baseHost}/functions/v1/get-calendar-feed?household_id=${householdId}&v=${feedVer}`;

  // Time values are stored as Postgres `time` (e.g. "20:00:00"); inputs use HH:MM.
  const toHHMM = (v) => (v ? String(v).slice(0, 5) : null);
  const to12h  = (hhmm) => {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };
  const member = membersCache.find(m => m.id === currentMemberId);

  // Last custom weekend time — survives toggle off/on within this sheet session.
  let lastCustomWeekend = toHHMM(member?.calendar_weekend_time);

  let weekdayTimer = null;
  let weekendTimer = null;

  // Debounced persist (800ms) + in-memory cache update.
  function saveField(field, value) {
    const m = membersCache.find(mm => mm.id === currentMemberId);
    if (m) m[field] = value;
    const run = async () => {
      const { error } = await supabaseClient
        .from('household_members')
        .update({ [field]: value })
        .eq('id', currentMemberId);
      if (error) console.error('calendar time save failed:', error);
    };
    if (field === 'calendar_time') {
      clearTimeout(weekdayTimer);
      weekdayTimer = setTimeout(run, 800);
    } else {
      clearTimeout(weekendTimer);
      weekendTimer = setTimeout(run, 800);
    }
  }

  const mySubKey  = `calendar_subscribed_my_tasks_${householdId}_${currentMemberId}`;
  const allSubKey = `calendar_subscribed_all_tasks_${householdId}_${currentMemberId}`;

  let calScope = 'my';
  // In-progress calendar-app selection for the configure/switch views (#432).
  // Seeded from the target scope's persisted choice on entry, written back on
  // Subscribe. Default follows the platform (iOS → Apple, else Google).
  let calendarAppChoice = isIOS() ? 'apple' : 'google';

  // Multi-subscription view state (#432). One of: 'options' (root list),
  // 'configure' (State 1), 'switch', 'help', 'unsubscribe'. Null until the first
  // render picks a root from subscription state. activeScope is the scope a
  // per-card action targets; cameFromOptions decides whether 'configure' shows a
  // Back affordance (true) or is the first-time root (false).
  let view = null;
  let activeScope = 'my';
  let cameFromOptions = false;

  // Per-scope persisted calendar-app choice (#432). Each active subscription
  // (my / all) can live on a different app, so the choice can no longer be a
  // single shared value. Key shape mirrors the subscribed-flag keys.
  const appKey    = (scope) => `calendar_app_${scope === 'all' ? 'all' : 'my'}_${householdId}_${currentMemberId}`;
  const getApp    = (scope) => localStorage.getItem(appKey(scope)) || (isIOS() ? 'apple' : 'google');
  const setApp    = (scope, app) => localStorage.setItem(appKey(scope), app);
  const scopeName = (scope) => scope === 'all' ? t('calendarSync.scope.all') : t('calendarSync.scope.my');
  const appLabel  = (scope) => getApp(scope) === 'google' ? t('calendarSync.app.google') : t('calendarSync.app.apple');

  // Shared header row (title + optional Back + close), reused by every view.
  const headerRow = (back) => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        ${back ? `<button type="button" data-action="cal-back" aria-label="${t('calendarSync.aria.back')}" style="background:none;border:none;font-size:22px;line-height:1;color:#2e7d51;cursor:pointer;padding:0 2px 0 0;font-family:inherit;">&#8249;</button>` : ''}
        <div class="sheet-title" style="margin-bottom:0;flex:1;">${t('menu.item.syncCalendar')}</div>
        <button type="button" class="menu-close" data-action="close-sheet" aria-label="${t('calendarSync.aria.close')}" style="position:static;">&#10005;</button>
      </div>`;

  // Segmented Calendar-app chooser (#373), iOS-only. Shared by configure + switch.
  const segStyle = (active) =>
    `flex:1;border:none;border-radius:8px;padding:10px 8px;font-family:inherit;font-size:14px;font-weight:500;cursor:pointer;`
    + `background:${active ? '#fff' : 'transparent'};color:${active ? '#2e7d51' : '#6b7280'};`
    + `box-shadow:${active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'};`;
  const appChooserFor = (choice) => !isIOS() ? '' : `
        <div style="margin-bottom:16px;">
          <div class="manage-section-label" style="margin:0 0 10px;">${t('calendarSync.state1.calendarAppLabel')}</div>
          <div style="display:flex;gap:6px;background:#f4f6f2;border-radius:10px;padding:4px;">
            <button type="button" data-action="cal-app-toggle" data-app="apple" style="${segStyle(choice === 'apple')}">${t('calendarSync.app.apple')}</button>
            <button type="button" data-action="cal-app-toggle" data-app="google" style="${segStyle(choice !== 'apple')}">${t('calendarSync.app.google')}</button>
          </div>
        </div>`;

  // Human-readable schedule line for a subscription card.
  const scheduleText = (m) => {
    const wd = toHHMM(m?.calendar_time) || '20:00';
    if (m?.calendar_weekend_time == null) return t('calendarSync.schedule.daily', { time: to12h(wd) });
    const we = toHHMM(m?.calendar_weekend_time) || wd;
    return t('calendarSync.schedule.split', { weekday: to12h(wd), weekend: to12h(we) });
  };

  // Platform/app-specific feed-removal copy (relocated from #365b's "start over"
  // block). Used by both Switch App and Unsubscribe.
  const removeFeedCopy = (scope) => getApp(scope) === 'google'
    ? t('calendarSync.removeFeed.google')
    : t('calendarSync.removeFeed.apple');

  // Builds every view except 'configure' (State 1), which falls through to the
  // main render() body below. Each view supplies its own body; the shared shell
  // adds the header + intro and re-runs wire() so nav handlers attach.
  function renderSecondaryView(m, mySub, allSub) {
    let body;
    let back = true;

    if (view === 'options') {
      back = false;
      const styleBlock = `<style>
        #cal-sync-body .section-label{font-size:12px;font-weight:700;letter-spacing:0.5px;color:#8a958a;margin:20px 0 12px;}
        #cal-sync-body .sub-card{border:1.5px solid #e0e5e0;border-radius:14px;padding:14px 16px;margin-bottom:12px;}
        #cal-sync-body .sub-card-top{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
        #cal-sync-body .sub-dot{width:8px;height:8px;border-radius:50%;background:#2e7d51;flex-shrink:0;}
        #cal-sync-body .sub-title{font-size:14.5px;font-weight:700;color:#1a2e1a;}
        #cal-sync-body .sub-sub{font-size:12px;color:#8a958a;margin-top:1px;}
        #cal-sync-body .sub-actions{display:flex;gap:8px;padding-top:12px;border-top:1px solid #eef1ee;}
        #cal-sync-body .sub-action{flex:1;text-align:center;font-size:12.5px;font-weight:700;color:#2e7d51;background:#f4f6f2;border-radius:8px;padding:8px 4px;cursor:pointer;}
        #cal-sync-body .sub-action.danger{color:#b13a3a;}
        #cal-sync-body .option-card{display:flex;align-items:center;gap:14px;padding:16px;border:1.5px solid #e0e5e0;border-radius:14px;margin-bottom:10px;cursor:pointer;}
        #cal-sync-body .option-icon{font-size:20px;width:36px;height:36px;background:#f4f6f2;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        #cal-sync-body .option-title{font-size:15px;font-weight:700;color:#1a2e1a;}
        #cal-sync-body .option-sub{font-size:12.5px;color:#8a958a;margin-top:1px;}
        #cal-sync-body .option-chevron{margin-left:auto;color:#c5ccc5;font-size:16px;}
      </style>`;
      const cardFor = (scope) => `
        <div class="sub-card">
          <div class="sub-card-top">
            <div class="sub-dot"></div>
            <div>
              <div class="sub-title">${scopeName(scope)} &rarr; ${appLabel(scope)}</div>
              <div class="sub-sub">${scheduleText(m)}</div>
            </div>
          </div>
          <div class="sub-actions">
            <div class="sub-action" data-action="cal-modify" data-scope="${scope}">${t('calendarSync.action.modify')}</div>
            ${isIOS() ? `<div class="sub-action" data-action="cal-switch" data-scope="${scope}">${t('calendarSync.action.switchApp')}</div>` : ''}
            <div class="sub-action danger" data-action="cal-unsub" data-scope="${scope}">${t('calendarSync.action.unsubscribe')}</div>
          </div>
        </div>`;
      const scopeBlurb = (scope) => scope === 'all'
        ? t('calendarSync.scope.allBlurb')
        : t('calendarSync.scope.myBlurb');
      const addCardFor = (scope) => `
        <div class="sub-card">
          <div class="sub-card-top">
            <div class="sub-dot" style="background:#c5ccc5;"></div>
            <div>
              <div class="sub-title">${scopeName(scope)}</div>
              <div class="sub-sub">${scopeBlurb(scope)}</div>
            </div>
          </div>
          <div class="sub-actions">
            <div class="sub-action" data-action="cal-add" data-scope="${scope}">${t('calendarSync.action.subscribe')}</div>
          </div>
        </div>`;
      const cards = [];
      if (mySub)  cards.push(cardFor('my'));
      if (allSub) cards.push(cardFor('all'));
      const addRows = [];
      if (!mySub)  addRows.push(addCardFor('my'));
      if (!allSub) addRows.push(addCardFor('all'));
      body = `${styleBlock}
        <div class="section-label">${t('calendarSync.options.activeSyncs')}</div>
        ${cards.join('') || `<p style="font-size:13px;color:var(--text-muted);margin:0 0 4px;">${t('calendarSync.options.noSyncs')}</p>`}
        ${addRows.join('')}
        <div class="option-card" data-action="cal-help" style="margin-top:20px;">
          <div class="option-icon">&#10067;</div>
          <div>
            <div class="option-title">${t('calendarSync.options.getHelp')}</div>
            <div class="option-sub">${t('calendarSync.options.getHelpSub')}</div>
          </div>
          <div class="option-chevron">&#8250;</div>
        </div>`;
    } else if (view === 'help') {
      body = `
        <div style="font-size:16px;font-weight:600;color:#1a2e1a;margin-bottom:12px;">${t('calendarSync.getHelp.title')}</div>
        <ol style="margin:0;padding:0;list-style:none;">
          <li style="display:flex;gap:8px;font-size:12.5px;color:#4b5563;line-height:1.55;margin-bottom:10px;">
            <span style="font-weight:700;color:#2e7d51;flex-shrink:0;">1.</span>
            <span>${t('calendarSync.getHelp.item1')}</span>
          </li>
          <li style="display:flex;gap:8px;font-size:12.5px;color:#4b5563;line-height:1.55;margin-bottom:10px;">
            <span style="font-weight:700;color:#2e7d51;flex-shrink:0;">2.</span>
            <span>${t('calendarSync.getHelp.item2')}</span>
          </li>
          <li style="display:flex;gap:8px;font-size:12.5px;color:#4b5563;line-height:1.55;margin-bottom:10px;">
            <span style="font-weight:700;color:#2e7d51;flex-shrink:0;">3.</span>
            <span>${t('calendarSync.getHelp.item3')}</span>
          </li>
          <li style="display:flex;gap:8px;font-size:12.5px;color:#4b5563;line-height:1.55;margin-bottom:10px;">
            <span style="font-weight:700;color:#2e7d51;flex-shrink:0;">4.</span>
            <span>${t('calendarSync.getHelp.item4')}</span>
          </li>
        </ol>`;
    } else if (view === 'switch') {
      const chosen = calendarAppChoice === 'apple' ? t('calendarSync.app.apple') : t('calendarSync.app.google');
      body = `
        <div style="font-size:16px;font-weight:600;color:#1a2e1a;margin-bottom:6px;">${t('calendarSync.switch.title')}</div>
        <p style="font-size:13px;color:var(--text-muted);line-height:1.5;margin:0 0 14px;">${t('calendarSync.switch.intro', { scope: scopeName(activeScope), app: appLabel(activeScope) })}</p>
        <div style="background:#f4f6f2;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#4b5563;line-height:1.6;">${removeFeedCopy(activeScope)}</div>
        ${appChooserFor(calendarAppChoice)}
        <div style="background:#f4f6f2;border-radius:8px;padding:10px 12px;font-size:12px;color:var(--text-muted);margin-bottom:16px;">${t('calendarSync.handoffNotice', { app: chosen })}</div>
        <button type="button" class="btn btn-primary" id="cal-subscribe-btn" style="width:100%;">${t('calendarSync.action.subscribe')}</button>`;
    } else if (view === 'unsubscribe') {
      body = `
        <div style="font-size:16px;font-weight:600;color:#1a2e1a;margin-bottom:6px;">${t('calendarSync.action.unsubscribe')} &middot; ${scopeName(activeScope)}</div>
        <p style="font-size:13px;color:var(--text-muted);line-height:1.5;margin:0 0 14px;">${t('calendarSync.unsubscribe.body')}</p>
        <div style="background:#f4f6f2;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#4b5563;line-height:1.6;">${removeFeedCopy(activeScope)}</div>
        <button type="button" class="btn btn-primary" data-action="cal-unsub-confirm" data-scope="${activeScope}" style="width:100%;">${t('calendarSync.unsubscribe.confirm')}</button>`;
    }

    openSheet(`<div id="cal-sync-body">
      ${headerRow(back)}
      <p style="font-size:13px;color:var(--text-muted);line-height:1.45;margin:0 0 18px;">${t('calendarSync.intro')}</p>
      ${body}
    </div>`);
    wire();
  }

  function render() {
    const m = membersCache.find(mm => mm.id === currentMemberId);

    const mySub  = localStorage.getItem(mySubKey)  === 'true';
    const allSub = localStorage.getItem(allSubKey) === 'true';
    if (view === null) view = (mySub || allSub) ? 'options' : 'configure';
    // Non-configure views build their own body and short-circuit; only the
    // 'configure' view (State 1) falls through to the schedule/feed markup below.
    if (view !== 'configure') { renderSecondaryView(m, mySub, allSub); return; }

    const weekdayTime    = toHHMM(m?.calendar_time) || '20:00';
    const weekendEnabled = m?.calendar_weekend_time != null;
    const weekendTime    = weekendEnabled ? (toHHMM(m?.calendar_weekend_time) || weekdayTime) : weekdayTime;

    const memberName = member?.display_name ?? '';
    const hhName     = householdName ?? 'My Household';

    // 30-minute slots from 06:00 to 23:30, 24-hour format.
    const slots = [];
    for (let h = 6; h <= 23; h++) {
      for (const mm of ['00', '30']) slots.push(`${String(h).padStart(2, '0')}:${mm}`);
    }
    const timeSelect = (id, value, disabled) => {
      // Preserve a saved value that isn't on a 30-min boundary by prepending it.
      const opts = (slots.includes(value) ? slots : [value, ...slots])
        .map(t => `<option value="${t}"${t === value ? ' selected' : ''}>${t}</option>`)
        .join('');
      const selStyle = `appearance:none;-webkit-appearance:none;border:1px solid #ddd;border-radius:8px;padding:8px 32px 8px 12px;font-size:14px;min-width:90px;font-family:inherit;color:var(--text);background:${disabled ? '#f4f6f2' : 'white'};`;
      return `<div id="${id}-wrap" style="position:relative;display:inline-block;${disabled ? 'opacity:0.35;' : ''}">
            <select id="${id}" style="${selStyle}"${disabled ? ' disabled' : ''}>${opts}</select>
            <span style="position:absolute;right:11px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:11px;color:#555;">&#9662;</span>
          </div>`;
    };

    // The configure view (State 1) always renders the full schedule + feed +
    // app chooser, whether reached first-time, via Modify, or via Add sync.
    let feedBlock;
    {
      const myActive = calScope === 'my';

      // Calendar-app chooser is iOS-only (#373). Android/desktop keep #423's
      // auto-route to Google, so their handoff copy stays "your Calendar app".
      const showAppChooser = isIOS();
      const appleActive    = calendarAppChoice === 'apple';
      const chosenAppName  = appleActive ? t('calendarSync.app.apple') : t('calendarSync.app.google');
      const handoffApp     = showAppChooser ? chosenAppName : t('calendarSync.state1.yourCalendarApp');

      const appChooserHtml = appChooserFor(calendarAppChoice);

      feedBlock = `
        <div style="margin-bottom:16px;">
          <div class="manage-section-label" style="margin:0 0 10px;">${t('calendarSync.state1.chooseFeed')}</div>

          <div data-action="cal-scope-toggle" data-scope="my"
            style="border:1.5px solid ${myActive ? '#2e7d51' : '#e5e7eb'};border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:12px;cursor:pointer;background:${myActive ? '#f0faf4' : '#fff'};">
            <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${myActive ? '#2e7d51' : '#d1d5db'};flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;background:${myActive ? '#2e7d51' : 'transparent'};">
              ${myActive ? '<div style="width:6px;height:6px;border-radius:50%;background:#fff;"></div>' : ''}
            </div>
            <div>
              <div style="font-size:14px;font-weight:500;color:${myActive ? '#2e7d51' : '#1a1a1a'};margin-bottom:2px;">${t('calendarSync.scope.my')}</div>
              <div style="font-size:12px;color:#6b7280;line-height:1.45;">${t('calendarSync.scope.myBlurb')}</div>
            </div>
          </div>

          <div data-action="cal-scope-toggle" data-scope="all"
            style="border:1.5px solid ${!myActive ? '#2e7d51' : '#e5e7eb'};border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:12px;cursor:pointer;background:${!myActive ? '#f0faf4' : '#fff'};">
            <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${!myActive ? '#2e7d51' : '#d1d5db'};flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;background:${!myActive ? '#2e7d51' : 'transparent'};">
              ${!myActive ? '<div style="width:6px;height:6px;border-radius:50%;background:#fff;"></div>' : ''}
            </div>
            <div>
              <div style="font-size:14px;font-weight:500;color:${!myActive ? '#2e7d51' : '#1a1a1a'};margin-bottom:2px;">${t('calendarSync.scope.all')}</div>
              <div style="font-size:12px;color:#6b7280;line-height:1.45;">${t('calendarSync.scope.allBlurb')}</div>
            </div>
          </div>
        </div>
        ${appChooserHtml}
        <div style="background:#f4f6f2;border-radius:8px;padding:10px 12px;font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          ${t('calendarSync.handoffNotice', { app: handoffApp })}
        </div>
        <button type="button" class="btn btn-primary" id="cal-subscribe-btn" style="width:100%;">${t('calendarSync.action.subscribe')}</button>`;
    }

    openSheet(`
      ${headerRow(cameFromOptions)}
      <p style="font-size:13px;color:var(--text-muted);line-height:1.45;margin:0 0 18px;">${t('calendarSync.intro')}</p>

      <div style="background:#eef7f1;border-radius:12px;padding:14px 14px 6px;">
        <div class="manage-section-label" style="margin:0 0 10px;">${t('calendarSync.state1.scheduleTime')}</div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
          <span style="font-size:14px;font-weight:500;color:#1a2e1a;" id="cal-weekday-label">${weekendEnabled ? t('calendarSync.state1.weekdaysLabel') : t('calendarSync.state1.allDaysLabel')}</span>
          ${timeSelect('cal-weekday-time', weekdayTime, false)}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
          <span style="font-size:14px;font-weight:500;color:#1a2e1a;">${t('calendarSync.state1.weekendToggle')}</span>
          <button type="button" class="task-toggle-btn${weekendEnabled ? ' on' : ''}" id="cal-weekend-toggle" role="switch" aria-checked="${weekendEnabled}">
            <span class="task-toggle-knob"></span>
          </button>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
          <span style="font-size:14px;font-weight:500;color:#1a2e1a;${weekendEnabled ? '' : 'opacity:0.35;'}" id="cal-weekend-label">${t('calendarSync.state1.weekendLabel')}</span>
          ${timeSelect('cal-weekend-time', weekendTime, !weekendEnabled)}
        </div>
      </div>

      <div style="margin-top:22px;">${feedBlock}</div>
    `);

    wire();
  }

  function wire() {
    const weekdayInput = document.getElementById('cal-weekday-time');
    const weekendInput = document.getElementById('cal-weekend-time');
    const weekendWrap  = document.getElementById('cal-weekend-time-wrap');
    const weekendLabel = document.getElementById('cal-weekend-label');
    const weekdayLabel = document.getElementById('cal-weekday-label');
    const toggle       = document.getElementById('cal-weekend-toggle');

    const isOn = () => toggle?.getAttribute('aria-checked') === 'true';

    weekdayInput?.addEventListener('input', () => {
      const v = weekdayInput.value;
      if (!v) return;
      saveField('calendar_time', v);
      // When weekend uses the same time, mirror live.
      if (!isOn()) weekendInput.value = v;
    });

    weekendInput?.addEventListener('input', () => {
      if (!isOn()) return;
      const v = weekendInput.value;
      if (!v) return;
      lastCustomWeekend = v;
      saveField('calendar_weekend_time', v);
    });

    toggle?.addEventListener('click', () => {
      const turningOn = !isOn();
      toggle.setAttribute('aria-checked', String(turningOn));
      toggle.classList.toggle('on', turningOn);
      if (weekdayLabel) weekdayLabel.innerHTML = turningOn ? t('calendarSync.state1.weekdaysLabel') : t('calendarSync.state1.allDaysLabel');
      if (turningOn) {
        const v = lastCustomWeekend || weekdayInput.value || '20:00';
        weekendInput.value = v;
        weekendInput.disabled = false;
        weekendInput.style.background = 'white';
        if (weekendWrap) weekendWrap.style.opacity = '';
        if (weekendLabel) weekendLabel.style.opacity = '';
        saveField('calendar_weekend_time', v);
      } else {
        weekendInput.value = weekdayInput.value;
        weekendInput.disabled = true;
        weekendInput.style.background = '#f4f6f2';
        if (weekendWrap) weekendWrap.style.opacity = '0.35';
        if (weekendLabel) weekendLabel.style.opacity = '0.35';
        saveField('calendar_weekend_time', null);
      }
    });

    document.getElementById('cal-subscribe-btn')?.addEventListener('click', () => {
      // Configure view subscribes the toggled feed (calScope); Switch App view
      // re-subscribes the card being switched (activeScope).
      const scope     = view === 'switch' ? activeScope : calScope;
      const webcalUrl = scope === 'my' ? meWebcal : hhWebcal;
      const subKey    = scope === 'my' ? mySubKey : allSubKey;
      const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`;
      // iOS: user picks Apple (native webcal://) or Google (#373). Other platforms
      // (Android/desktop) have no webcal handler, so always route through Google
      // Calendar's render endpoint, which takes the same feed URL as its `cid`.
      const useGoogle = isIOS() ? (calendarAppChoice === 'google') : true;
      window.open(useGoogle ? googleUrl : webcalUrl);
      localStorage.setItem(subKey, 'true');
      setApp(scope, isIOS() ? calendarAppChoice : 'google');   // persist per-scope app (#432)
      view = 'options';
      cameFromOptions = false;
      render();
    });

    document.querySelectorAll('[data-action="cal-app-toggle"]').forEach(btn => {
      btn.addEventListener('click', () => { calendarAppChoice = btn.dataset.app; render(); });
    });

    document.querySelectorAll('[data-action="cal-scope-toggle"]').forEach(btn => {
      btn.addEventListener('click', () => { calScope = btn.dataset.scope; render(); });
    });

    // Options-screen navigation (#432). Each per-card action carries data-scope.
    document.querySelector('[data-action="cal-back"]')?.addEventListener('click', () => {
      view = 'options'; cameFromOptions = false; render();
    });
    document.querySelector('[data-action="cal-help"]')?.addEventListener('click', () => {
      view = 'help'; render();
    });
    const toConfigure = (btn) => {
      const scope = btn.dataset.scope;
      activeScope = scope; calScope = scope; calendarAppChoice = getApp(scope);
      view = 'configure'; cameFromOptions = true; render();
    };
    document.querySelectorAll('[data-action="cal-modify"]').forEach(btn =>
      btn.addEventListener('click', () => toConfigure(btn)));
    document.querySelectorAll('[data-action="cal-add"]').forEach(btn =>
      btn.addEventListener('click', () => toConfigure(btn)));
    document.querySelectorAll('[data-action="cal-switch"]').forEach(btn =>
      btn.addEventListener('click', () => {
        const scope = btn.dataset.scope;
        activeScope = scope; calendarAppChoice = getApp(scope);
        view = 'switch'; render();
      }));
    document.querySelectorAll('[data-action="cal-unsub"]').forEach(btn =>
      btn.addEventListener('click', () => {
        activeScope = btn.dataset.scope; view = 'unsubscribe'; render();
      }));
    document.querySelector('[data-action="cal-unsub-confirm"]')?.addEventListener('click', (e) => {
      const scope  = e.currentTarget.dataset.scope;
      localStorage.removeItem(scope === 'my' ? mySubKey : allSubKey);
      localStorage.removeItem(appKey(scope));
      view = 'options'; render();
    });
  }

  render();
}

async function handleCopyCalendarLink(btn) {
  const url = btn?.dataset?.url;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
  } catch (_) {
    return;
  }
  const original = btn.textContent;
  btn.textContent = t('calendarSync.copied');
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 2000);
}

function renderMenuPanel() {
  document.getElementById('menu-content').innerHTML = `
    <button class="menu-close" data-action="close-menu">&#10005;</button>
    <div class="menu-section">
      <div class="menu-section-title">${t('menu.section.profile')}</div>
      <div class="menu-user-name">&#128100; ${escapeHtml(activeUser)}</div>
    </div>
    <div class="menu-section">
      <div class="menu-section-title">${t('menu.section.reminders')}</div>
      ${('Notification' in window && Notification.permission === 'denied')
        ? `<button class="menu-item" data-action="menu-notifications">🔔 ${t('menu.notifications.label')} &middot; <span style="color:#c0392b;">${t('menu.notifications.blocked')}</span></button>
        <div style="padding:0 20px 12px;font-size:12px;color:#999;line-height:1.4;">${t('onboarding.reminders.blockedBody', { path: isIOS() ? t('onboarding.reminders.blockedPathIos') : t('onboarding.reminders.blockedPathAndroid') })}</div>`
        : membersCache.find(m => m.id === currentMemberId)?.notifications_enabled
        ? `<button class="menu-item" style="color:#3a6b3a;opacity:0.7;" disabled>🔔 ${t('menu.notifications.label')} &middot; ${t('menu.notifications.on')}</button>`
        : `<button class="menu-item" data-action="menu-notifications">🔔 ${t('menu.notifications.label')} &middot; <span style="color:#aaa;">${t('menu.notifications.off')}</span></button>`}
      <button class="menu-item" data-action="open-calendar-sync">📅 ${t('menu.item.syncCalendar')}</button>
    </div>
    <div class="menu-section">
      <div class="menu-section-title">${t('menu.section.account')}</div>
      <button class="menu-item" data-action="change-password">${t('menu.item.changePassword')}</button>
      <button class="menu-item menu-item-danger" data-action="menu-sign-out">${t('menu.item.signOut')}</button>
    </div>
  `;
}

function renderNotificationsSheet() {
  openSheet(`
    <div class="sheet-title">${t('menu.notifications.label')}</div>
    <p style="font-size:14px;color:#555;line-height:1.5;margin-bottom:20px;">${t('menu.notifications.body')}</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="close-sheet">${t('taskSheet.cancel')}</button>
      <button class="btn btn-primary" data-action="sheet-enable-notifications">${t('menu.notifications.enable')}</button>
    </div>
  `);
}

function renderChangePasswordSheet() {
  openSheet(`
    <div class="sheet-title">${t('menu.item.changePassword')}</div>
    <div class="form-group">
      <label class="form-label">${t('menu.changePassword.newLabel')}</label>
      <input type="password" class="form-input" id="sheet-new-password" placeholder="${t('menu.changePassword.newPlaceholder')}" autocomplete="new-password">
    </div>
    <div class="form-group">
      <label class="form-label">${t('menu.changePassword.confirmLabel')}</label>
      <input type="password" class="form-input" id="sheet-confirm-password" placeholder="${t('menu.changePassword.confirmPlaceholder')}" autocomplete="new-password">
    </div>
    <div id="change-password-error" style="color:var(--due);font-size:14px;margin-bottom:8px;display:none;"></div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="close-sheet">${t('taskSheet.cancel')}</button>
      <button class="btn btn-primary" data-action="save-change-password">${t('auth.reset.save')}</button>
    </div>
  `);
}

async function handleChangePassword() {
  if (isSaving) return;
  const password = document.getElementById('sheet-new-password')?.value ?? '';
  const confirm  = document.getElementById('sheet-confirm-password')?.value ?? '';
  const errorEl  = document.getElementById('change-password-error');

  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  };

  if (password.length < 8) { showError(t('menu.changePassword.errorTooShort')); return; }
  if (password !== confirm) { showError(t('auth.reset.errorMismatch')); return; }

  isSaving = true;
  try {
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) { showError(error.message); return; }

    closeSheet();
    showToast(t('menu.toast.passwordUpdated'));
  } finally {
    isSaving = false;
  }
}

function renderOwnerPills(selectedOwner) {
  return membersCache.map(m => {
    const color = m.color ?? '#2e7d51';
    const initial = (m.display_name ?? '?')[0].toUpperCase();
    const sel = m.display_name === selectedOwner ? 'selected' : '';
    return `<div class="owner-pill ${sel}" data-action="sheet-set-owner" data-owner="${escapeHtml(m.display_name)}" style="--pill-color:${escapeHtml(color)}">` +
      `<span class="owner-pill-check">✓</span>` +
      `<span class="owner-pill-initial">${escapeHtml(initial)}</span>${escapeHtml(m.display_name)}</div>`;
  }).join('');
}

function renderEditTaskSheet(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (!task) return;
  const plant       = getPlant(plantId);
  const cfg         = getTaskConfig(task);
  const isPaused    = task.paused ?? false;
  const recType     = task.recurrenceType ?? 'interval';
  const isRepeating = recType !== 'one-off';
  const curYear     = new Date().getFullYear();

  state.sheetMode = 'edit-task';
  state.sheetData = { plantId, taskId };
  sheetEntryTab = plantDetailTab;

  const weekdayBtns = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const sel = (task.weekdays ?? []).includes(d) ? 'selected' : '';
    return `<button class="weekday-btn ${sel}" data-action="sheet-toggle-weekday" data-day="${d}">${WEEKDAY_NAMES[d]}</button>`;
  }).join('');

  // Yearly anchor prefill: from the task if set, else today's month/day.
  const yMonth = task.recurrenceMonth ?? (new Date().getMonth() + 1);
  const yDay   = task.recurrenceDay   ?? new Date().getDate();

  const isCustom    = !TASK_CONFIG[task.id];
  const overrideDate = task.nextDueOverride && task.nextDueOverride >= todayStr() ? task.nextDueOverride : null;

  const rowLabelStyle = 'display:block;font-size:11px;color:#8a8d86;margin:0 0 4px;text-transform:none;font-weight:500;letter-spacing:normal;';

  openSheet(`
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:0.5px solid #e8ece6;">
      <button type="button" class="edit-task-icon-tile" ${isCustom ? `data-action="edit-task-toggle-icon-picker" data-emoji="${escapeHtml(cfg.icon)}"` : ''} style="width:36px;height:36px;background:#eef3eb;border-radius:8px;${isCustom ? 'border:1.5px dashed #a0c0a0;cursor:pointer;' : 'border:none;cursor:default;'}display:flex;align-items:center;justify-content:center;font-size:20px;padding:0;flex-shrink:0;">${cfg.icon}</button>
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;">
        <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(cfg.name)}</div>
        <div style="font-size:12px;color:#8a8d86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant?.name ?? '')}</div>
        ${isCustom ? `<div style="font-size:10px;color:#3a6b3a;margin-top:2px;">${t('taskSheet.icon.tapToChange')}</div>` : ''}
      </div>
    </div>

    ${isCustom ? `
    <div id="edit-task-icon-picker" class="icon-picker" style="display:none;padding:8px 16px;border-bottom:0.5px solid #f0f0ee;">
      ${CUSTOM_ICONS.map(ic =>
        `<div class="icon-option${ic === cfg.icon ? ' selected' : ''}" data-action="edit-task-pick-icon" data-icon="${ic}">${ic}</div>`
      ).join('')}
    </div>

    <div style="padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" style="${rowLabelStyle}">${t('taskSheet.field.taskName')}</label>
      <input type="text" class="form-input" id="sheet-task-name" value="${escapeHtml(task.name ?? '')}" style="background:#f8f8f6;border:0.5px solid #e0e0dc;border-radius:8px;padding:8px 10px;font-size:14px;width:100%;box-sizing:border-box;">
    </div>` : ''}

    <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" style="font-size:11px;color:#8a8d86;margin:0;text-transform:none;font-weight:500;letter-spacing:normal;flex-shrink:0;">${t('taskSheet.field.owner')}</label>
      <div class="owner-pill-group" style="flex:1;display:flex;gap:6px;flex-wrap:wrap;margin:0;">${renderOwnerPills(task.owner)}</div>
    </div>

    <div id="task-due-home"></div>
    <div id="task-due-field" style="padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" id="task-due-label" style="${rowLabelStyle}">${t('taskSheet.field.dueDate')}</label>
      ${renderDateSelectHtml('task-override', overrideDate, curYear, curYear + 2)}
    </div>

    <div class="task-toggle-row${isRepeating ? ' task-toggle-row--expanded' : ''}" id="repeating-toggle-row" data-action="toggle-repeating-task" style="padding:10px 16px;">
      <span class="task-toggle-label">${t('taskSheet.field.repeating')}</span>
      <button class="task-toggle-btn${isRepeating ? ' on' : ''}" id="repeating-toggle" role="switch" aria-checked="${isRepeating}" type="button">
        <span class="task-toggle-knob"></span>
      </button>
    </div>

    <div id="task-recurrence-block" style="${isRepeating ? '' : 'display:none;'}padding:0 16px 10px;">
      <div style="background:#f4f6f2;border-radius:10px;padding:8px 10px;">
        <div class="recurrence-type-toggle" style="margin-bottom:8px;">
          <div class="recurrence-option${recType === 'interval' ? ' selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="interval" style="font-size:12px;padding:5px 8px;">${t('taskSheet.recurrence.interval')}</div>
          <div class="recurrence-option${recType === 'weekdays' ? ' selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="weekdays" style="font-size:12px;padding:5px 8px;">${t('taskSheet.recurrence.weekdays')}</div>
          <div class="recurrence-option${recType === 'yearly' ? ' selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="yearly" style="font-size:12px;padding:5px 8px;">${t('taskSheet.recurrence.yearly')}</div>
        </div>
        <div id="recurrence-container" class="recurrence-${isRepeating ? recType : 'one-off'}">
          <div class="recurrence-interval-section form-group" style="margin:0;">
            <div class="freq-row">
              <input type="number" class="form-input" id="sheet-frequency" min="1" max="365" value="${task.frequencyDays}" style="width:auto;min-width:52px;font-size:13px;padding:5px 8px;overflow:visible;text-overflow:unset;">
              <span style="font-size:13px;">${t('taskSheet.recurrence.daysBetween')}</span>
            </div>
          </div>
          <div class="recurrence-weekdays-section form-group" style="margin:0;">
            <div class="weekday-picker">${weekdayBtns}</div>
          </div>
          ${yearlySectionHtml(yMonth, yDay)}
          <div id="recurrence-summary" data-started="${task.lastDone ? 'true' : 'false'}" style="display:none;background:#eef3eb;border-radius:8px;padding:5px 8px;margin:8px 0 0;font-size:12px;color:#3a6b3a;"></div>
        </div>
      </div>
    </div>

    <div id="pause-toggle-row" class="task-toggle-row task-toggle-row--sub" data-action="toggle-task-pause" style="${isRepeating ? '' : 'display:none;'}padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <div>
        <div class="task-toggle-label">${t('taskSheet.pause.label')}</div>
        <div class="task-toggle-subtitle">${t('taskSheet.pause.subtitle')}</div>
      </div>
      <button class="task-toggle-btn${isPaused ? ' on' : ''}" id="pause-toggle" role="switch" aria-checked="${isPaused}" type="button">
        <span class="task-toggle-knob"></span>
      </button>
    </div>

    <div class="task-delete-section" style="padding:10px 16px 6px;">
      <button class="task-delete-link" data-action="delete-task" data-plant="${plantId}" data-task="${taskId}" style="font-size:13px;">${t('taskSheet.delete')}</button>
    </div>

    <div class="sheet-footer-sticky">
      <div class="sheet-actions" style="padding:8px 16px 14px;">
        <button class="btn btn-ghost" data-action="sheet-cancel">&#8592; ${t('taskSheet.cancel')}</button>
        <button class="btn btn-primary" data-action="sheet-save-task">${t('taskSheet.saveChanges')}</button>
      </div>
    </div>
  `);

  attachFutureDateSelectListeners('task-override');
  attachRecurrenceSummaryListeners('task-override');
  applyCompactDateSelectStyles('task-override');
  relocateTaskDueField(isRepeating);
  syncYearlyRecurrenceUI();
}

function renderAddTaskStep1(plantId) {
  const plant = getPlant(plantId);
  if (!plant) return;
  const existingIds = new Set(plant.tasks.map(t => t.id));

  state.sheetMode = 'add-task-step1';
  state.sheetData = { plantId };
  sheetEntryTab = plantDetailTab;

  const presetOptions = Object.entries(TASK_CONFIG).map(([key, cfg]) => {
    if (existingIds.has(key)) {
      return `
      <div class="task-type-option task-type-option-disabled">
        <span class="task-type-icon">${cfg.icon}</span>
        <span class="task-type-name">${escapeHtml(cfg.name)}</span>
        <span class="task-type-assigned">${t('taskSheet.type.added')}</span>
      </div>`;
    }
    return `
      <div class="task-type-option" data-action="add-task-select-type" data-plant="${plantId}" data-type-key="${key}">
        <span class="task-type-icon">${cfg.icon}</span>
        <span class="task-type-name">${escapeHtml(cfg.name)}</span>
      </div>`;
  }).join('');

  openSheet(`
    <div class="sheet-title">${t('taskSheet.step1.title')}</div>
    <div class="task-type-list">
      ${presetOptions}
      <div class="task-type-option task-type-option-custom" data-action="add-task-select-type" data-plant="${plantId}" data-type-key="custom">
        <span class="task-type-icon">✏️</span>
        <span class="task-type-name">${t('taskSheet.type.custom')}</span>
      </div>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="sheet-cancel">${t('taskSheet.cancel')}</button>
    </div>
  `);
}

function renderAddTaskStep2(plantId, typeKey, prefill = {}) {
  const isCustom = typeKey === 'custom';
  const cfg = isCustom ? null : TASK_CONFIG[typeKey];
  // #349: onboarding opens this sheet pre-filled (repeating interval, 3 days,
  // owner = current member). Defaults below preserve the normal behavior.
  const isOnboarding = !!prefill.onboarding;
  const repeating    = prefill.repeating ?? false;
  const recType      = prefill.recType  ?? 'interval';
  const freqValue    = prefill.frequency ?? 7;
  const defaultOwner = prefill.owner ?? activeUser ?? Object.keys(USERS)[0];

  state.sheetMode = 'add-task-step2';
  state.sheetData = { plantId, typeKey };

  const weekdayBtns = [1, 2, 3, 4, 5, 6, 0].map((d) =>
    `<button class="weekday-btn" data-action="sheet-toggle-weekday" data-day="${d}">${WEEKDAY_NAMES[d]}</button>`
  ).join('');

  // Yearly anchor default: today's month/day (yearly is never a default type).
  const yMonth = new Date().getMonth() + 1;
  const yDay   = new Date().getDate();

  const ownerPillsHtml = renderOwnerPills(defaultOwner);

  const plant = getPlant(plantId);
  const headerIcon = isCustom ? CUSTOM_ICONS[0] : cfg.icon;
  const headerName = isCustom ? t('taskSheet.customTask.header') : cfg.name;

  const customFields = isCustom ? `
    <div id="edit-task-icon-picker" class="icon-picker" style="display:none;padding:8px 16px;border-bottom:0.5px solid #f0f0ee;">
      ${CUSTOM_ICONS.map((ic, i) =>
        `<div class="icon-option${i === 0 ? ' selected' : ''}" data-action="edit-task-pick-icon" data-icon="${ic}">${ic}</div>`
      ).join('')}
    </div>
    <div style="padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" style="display:block;font-size:11px;color:#8a8d86;margin:0 0 4px;text-transform:none;font-weight:500;letter-spacing:normal;">${t('taskSheet.field.taskName')}</label>
      <input type="text" class="form-input" id="sheet-custom-name" placeholder="${t('taskSheet.field.taskNamePlaceholder')}" autocomplete="off" style="background:#f8f8f6;border:0.5px solid #e0e0dc;border-radius:8px;padding:8px 10px;font-size:14px;width:100%;box-sizing:border-box;">
    </div>` : '';

  const todayVal = todayStr();
  const curYear  = new Date().getFullYear();

  const rowLabelStyle = 'display:block;font-size:11px;color:#8a8d86;margin:0 0 4px;text-transform:none;font-weight:500;letter-spacing:normal;';

  openSheet(`
    ${isOnboarding ? `
    <div style="background:#eef7f1;padding:12px 16px;border-bottom:0.5px solid #d6e6d6;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:13px;font-weight:600;color:#3a6b3a;">${t('onboarding.addTask.label')}</span>
        <span style="font-size:11px;font-weight:500;color:#3a6b3a;">${t('onboarding.step.counter', { step: 2 })}</span>
      </div>
      <div style="font-size:12px;color:#3a6b3a;line-height:1.4;">${t('onboarding.addTask.instruction')}</div>
    </div>` : ''}
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:0.5px solid #e8ece6;">
      ${isCustom
        ? `<button type="button" class="edit-task-icon-tile" data-action="edit-task-toggle-icon-picker" data-emoji="${escapeHtml(headerIcon)}" style="width:36px;height:36px;background:#eef3eb;border-radius:8px;border:1.5px dashed #a0c0a0;display:flex;align-items:center;justify-content:center;font-size:20px;padding:0;cursor:pointer;flex-shrink:0;">${headerIcon}</button>`
        : `<div style="width:36px;height:36px;background:#eef3eb;border-radius:8px;border:none;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${headerIcon}</div>`}
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;">
        <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(headerName)}</div>
        <div style="font-size:12px;color:#8a8d86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant?.name ?? '')}</div>
        ${isCustom ? `<div style="font-size:10px;color:#3a6b3a;margin-top:2px;">${t('taskSheet.icon.tapToChange')}</div>` : ''}
      </div>
    </div>

    ${customFields}

    <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" style="font-size:11px;color:#8a8d86;margin:0;text-transform:none;font-weight:500;letter-spacing:normal;flex-shrink:0;">${t('taskSheet.field.owner')}</label>
      <div class="owner-pill-group" style="flex:1;display:flex;gap:6px;flex-wrap:wrap;margin:0;">${ownerPillsHtml}</div>
    </div>

    <div id="task-due-home"></div>
    <div id="task-due-field" style="padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" id="task-due-label" style="${rowLabelStyle}">${t('taskSheet.field.dueDate')}</label>
      ${renderDateSelectHtml('task-due-oneoff', todayVal, curYear, curYear + 2)}
    </div>

    <div class="task-toggle-row${repeating ? ' task-toggle-row--expanded' : ''}" id="repeating-toggle-row" data-action="toggle-repeating-task" style="padding:10px 16px;">
      <span class="task-toggle-label">${t('taskSheet.field.repeating')}</span>
      <button class="task-toggle-btn${repeating ? ' on' : ''}" id="repeating-toggle" role="switch" aria-checked="${repeating}" type="button">
        <span class="task-toggle-knob"></span>
      </button>
    </div>

    <div id="task-recurrence-block" style="${repeating ? '' : 'display:none;'}padding:0 16px 10px;">
      <div style="background:#f4f6f2;border-radius:10px;padding:8px 10px;">
        <div class="recurrence-type-toggle" style="margin-bottom:8px;">
          <div class="recurrence-option${recType === 'interval' ? ' selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="interval" style="font-size:12px;padding:5px 8px;">${t('taskSheet.recurrence.interval')}</div>
          <div class="recurrence-option${recType === 'weekdays' ? ' selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="weekdays" style="font-size:12px;padding:5px 8px;">${t('taskSheet.recurrence.weekdays')}</div>
          <div class="recurrence-option${recType === 'yearly' ? ' selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="yearly" style="font-size:12px;padding:5px 8px;">${t('taskSheet.recurrence.yearly')}</div>
        </div>
        <div id="recurrence-container" class="recurrence-${repeating ? recType : 'one-off'}">
          <div class="recurrence-interval-section form-group" style="margin:0;">
            <div class="freq-row">
              <input type="number" class="form-input" id="sheet-frequency" min="1" max="365" value="${freqValue}" style="width:auto;min-width:52px;font-size:13px;padding:5px 8px;overflow:visible;text-overflow:unset;">
              <span style="font-size:13px;">${t('taskSheet.recurrence.daysBetween')}</span>
            </div>
          </div>
          <div class="recurrence-weekdays-section form-group" style="margin:0;">
            <div class="weekday-picker">${weekdayBtns}</div>
          </div>
          ${yearlySectionHtml(yMonth, yDay)}
          <div id="recurrence-summary" data-started="false" style="display:none;background:#eef3eb;border-radius:8px;padding:5px 8px;margin:8px 0 0;font-size:12px;color:#3a6b3a;"></div>
        </div>
      </div>
    </div>

    <div class="sheet-footer-sticky">
      <div class="sheet-actions" style="padding:8px 16px 14px;">
        ${isOnboarding
          ? `<button class="btn btn-ghost" data-action="sheet-cancel">${t('taskSheet.cancel')}</button>`
          : `<button class="btn btn-ghost" data-action="add-task-back" data-plant="${plantId}">&#8592; ${t('taskSheet.back')}</button>`}
        <button class="btn btn-primary" data-action="sheet-save-new-task">${t('taskSheet.step2.addButton')}</button>
      </div>
    </div>
  `);

  attachFutureDateSelectListeners('task-due-oneoff');
  attachRecurrenceSummaryListeners('task-due-oneoff');
  applyCompactDateSelectStyles('task-due-oneoff');
  relocateTaskDueField(repeating);
  syncYearlyRecurrenceUI();
}

function renderPostTaskNoteSheet(plantId, taskId) {
  state.sheetMode = 'post-task-note';
  state.sheetData = { plantId, taskId };

  openSheet(`
    <div class="sheet-title">${t('notes.postTask.title')} <span class="sheet-title-optional">${t('notes.optional')}</span></div>
    <div class="form-group">
      <textarea class="form-textarea" id="post-task-note-text" placeholder="${t('notes.placeholder')}" style="min-height:110px"></textarea>
    </div>
    <button class="btn btn-ghost post-task-photo-btn" disabled>&#128247; ${t('notes.addPhoto')}</button>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="sheet-skip-post-task-note">${t('notes.postTask.skip')}</button>
      <button class="btn btn-primary" data-action="sheet-save-post-task-note" data-task="${taskId ?? ''}">${t('notes.saveNote')}</button>
    </div>
  `);
}

function renderAddNoteSheet(plantId) {
  state.sheetMode = 'add-note';
  state.sheetData = { plantId, pendingText: state.sheetData?.pendingText ?? '', pendingPhoto: state.sheetData?.pendingPhoto ?? null };

  openSheet(`
    <div class="sheet-title">${t('notes.addNote.title')}</div>
    <div class="form-group">
      <textarea class="form-textarea" id="sheet-note-text" placeholder="${t('notes.placeholder')}" style="min-height:110px">${escapeHtml(state.sheetData.pendingText)}</textarea>
    </div>
    <div id="add-note-photo-area" class="add-note-photo-area">${renderAddNotePhotoArea()}</div>
    <div id="add-note-coach" class="add-note-coach">${renderAddNoteCoachTip(null)}</div>
    <input type="file" id="add-note-file-input" accept="image/*" capture="environment" hidden />
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="close-sheet">${t('taskSheet.cancel')}</button>
      <button class="btn btn-primary" data-action="sheet-save-note">${t('auth.reset.save')}</button>
    </div>
  `);

  // Async fill in last photo thumbnail (don't block sheet open)
  fetchLastPlantPhoto(plantId).then(photo => {
    if (state.sheetMode !== 'add-note' || state.sheetData.plantId !== plantId) return;
    const coach = document.getElementById('add-note-coach');
    if (coach) coach.innerHTML = renderAddNoteCoachTip(photo);
  });
}

function renderAddNotePhotoArea() {
  const pending = state.sheetData?.pendingPhoto;
  if (pending) {
    return `
      <div class="add-note-photo-preview">
        <img loading="lazy" class="add-note-photo-thumb" src="${escapeHtml(pending.previewUrl)}" alt="" />
        <div class="add-note-photo-meta">
          <div class="add-note-photo-meta-title">&#10003; ${t('addPlant.photo.added')}</div>
          <button type="button" class="add-note-photo-change" data-action="add-note-pick-photo">${t('photos.tapToChange')}</button>
        </div>
        <button type="button" class="add-note-photo-remove" data-action="add-note-remove-photo">&#10005; ${t('addPlant.photo.remove')}</button>
      </div>`;
  }
  return `<button type="button" class="add-note-photo-btn" data-action="add-note-pick-photo">📷 ${t('notes.addPhoto')}</button>`;
}

function renderAddNoteCoachTip(lastPhoto) {
  let thumbHtml = '';
  if (lastPhoto?.storage_url) {
    const dateLabel = lastPhoto.created_at
      ? new Date(lastPhoto.created_at).toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric' })
      : '';
    thumbHtml = `
      <div class="add-note-coach-last">
        <img loading="lazy" class="add-note-coach-last-thumb" src="${escapeHtml(lastPhoto.storage_url)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(lastPhoto.storage_url)}" style="width:56px;height:56px;border-radius:8px;border:1.5px solid #7a907f;" />
        <div class="add-note-coach-last-label">${t('photos.lastPhoto')}${dateLabel ? ' · ' + escapeHtml(dateLabel) : ''}</div>
      </div>`;
  }
  return `
    <div class="add-note-coach-text">
      <div class="add-note-coach-title">📐 ${t('notes.coach.title')}</div>
      <div class="add-note-coach-body">${t('notes.coach.body')}</div>
    </div>
    ${thumbHtml}`;
}

function refreshAddNotePhotoArea() {
  const area = document.getElementById('add-note-photo-area');
  if (area) area.innerHTML = renderAddNotePhotoArea();
}

async function handleAddNoteFileSelected(file) {
  console.log('[fileSelected] ENTER', { name: file?.name, type: file?.type, size: file?.size, sheetMode: state.sheetMode, sheetData: state.sheetData });
  if (!file || !file.type?.startsWith('image/')) {
    console.log('[fileSelected] rejected — not an image or no file');
    return;
  }
  try {
    const blob = await compressImage(file, 1200, 0.8);
    console.log('[fileSelected] compressed', { blobSize: blob?.size, blobType: blob?.type });
    if (!blob) return;
    const previewUrl = URL.createObjectURL(blob);
    if (state.sheetData?.pendingPhoto?.previewUrl) {
      console.log('[fileSelected] revoking prior previewUrl', state.sheetData.pendingPhoto.previewUrl);
      URL.revokeObjectURL(state.sheetData.pendingPhoto.previewUrl);
    }
    state.sheetData = state.sheetData || {};
    state.sheetData.pendingPhoto = { blob, previewUrl };
    console.log('[fileSelected] pendingPhoto set on sheetData', { sheetData: state.sheetData });
    refreshAddNotePhotoArea();
  } catch (err) {
    console.error('[fileSelected] error:', err);
    showToast(t('menu.toast.couldNotLoadImage'));
  }
}

function clearPendingPhoto() {
  const p = state.sheetData?.pendingPhoto;
  if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
  if (state.sheetData) state.sheetData.pendingPhoto = null;
}

function openSlideshow(plantId, originPhotoId) {
  const plant = getPlant(plantId);
  if (!plant) return;

  const sequence = notes
    .filter(n => n.plantId === plantId && n.photoUrl)
    .slice()
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
  if (sequence.length === 0) return;

  let currentIndex = 0;

  const plantTileHtml = plant.photoUrl
    ? `<span class="slideshow-plant-tile"><img loading="lazy" src="${escapeHtml(plant.photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" /></span>`
    : `<span class="slideshow-plant-tile">${escapeHtml(plant.emoji ?? '🪴')}</span>`;

  const overlay = document.createElement('div');
  overlay.className = 'photo-slideshow-overlay';
  overlay.innerHTML = `
    <div class="slideshow-topbar">
      <button type="button" class="slideshow-close" aria-label="${t('photos.aria.close')}">&times;</button>
      <div class="slideshow-count"></div>
      <div class="slideshow-plant">${escapeHtml(plant.name ?? '')}</div>
    </div>
    <div class="slideshow-photo-area">
      <img loading="lazy" class="slideshow-photo" alt="" />
      <button type="button" class="slideshow-nav slideshow-nav-prev" aria-label="${t('photos.aria.previous')}">&#8249;</button>
      <button type="button" class="slideshow-nav slideshow-nav-next" aria-label="${t('photos.aria.next')}">&#8250;</button>
    </div>
    <div class="slideshow-gap"></div>
    <div class="slideshow-panel">
      <div class="slideshow-meta">
        ${plantTileHtml}
        <span class="slideshow-plant-name">${escapeHtml(plant.name ?? '')}</span>
        <span class="slideshow-date"></span>
        <span class="slideshow-avatar"></span>
      </div>
      <div class="slideshow-note-label">${t('photos.slideshow.noteLabel')}</div>
      <div class="slideshow-note-text"></div>
      <div class="slideshow-divider"></div>
      <div class="slideshow-controls">
        <div class="slideshow-dots"></div>
      </div>
    </div>
  `;

  const img        = overlay.querySelector('.slideshow-photo');
  const countEl    = overlay.querySelector('.slideshow-count');
  const dateEl     = overlay.querySelector('.slideshow-date');
  const avatarEl   = overlay.querySelector('.slideshow-avatar');
  const noteTextEl = overlay.querySelector('.slideshow-note-text');
  const dotsWrap   = overlay.querySelector('.slideshow-dots');
  const prevBtn    = overlay.querySelector('.slideshow-nav-prev');
  const nextBtn    = overlay.querySelector('.slideshow-nav-next');
  const photoArea  = overlay.querySelector('.slideshow-photo-area');

  const renderCurrent = () => {
    const note = sequence[currentIndex];
    img.src = note.photoUrl;
    countEl.textContent = t('photos.slideshow.count', { current: currentIndex + 1, total: sequence.length });

    dateEl.textContent = note.createdAt
      ? new Date(note.createdAt).toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    const member        = membersCache.find(m => m.id === note.memberId);
    const memberColor   = member?.color ?? '#888';
    const memberInitial = (member?.display_name ?? note.author ?? '?')[0].toUpperCase();
    avatarEl.style.background = memberColor;
    avatarEl.textContent = memberInitial;

    const noteText = (note.note ?? '').trim();
    if (noteText) {
      noteTextEl.textContent = noteText;
      noteTextEl.classList.remove('slideshow-note-text--empty');
    } else {
      noteTextEl.textContent = t('photos.noNote');
      noteTextEl.classList.add('slideshow-note-text--empty');
    }

    const atStart = currentIndex === 0;
    const atEnd   = currentIndex === sequence.length - 1;
    prevBtn.style.display = atStart ? 'none' : '';
    nextBtn.style.display = atEnd   ? 'none' : '';

    dotsWrap.innerHTML = sequence.map((_, i) => {
      const cls = i === currentIndex ? 'slideshow-dot active' : 'slideshow-dot';
      return `<span class="${cls}"></span>`;
    }).join('');
  };

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    if (originPhotoId) {
      const originNote = sequence.find(n => n.id === originPhotoId);
      if (originNote?.photoUrl) openPhotoFullscreen(originNote.photoUrl, originNote.id, originNote.plantId);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  overlay.querySelector('.slideshow-close').addEventListener('click', close);
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrent();
    }
  });
  nextBtn.addEventListener('click', () => {
    if (currentIndex < sequence.length - 1) {
      currentIndex++;
      renderCurrent();
    }
  });

  let touchStartX = null;
  photoArea.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0]?.clientX ?? null;
  }, { passive: true });
  photoArea.addEventListener('touchend', (e) => {
    if (touchStartX == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const deltaX = endX - touchStartX;
    touchStartX = null;
    if (deltaX > 40 && currentIndex > 0) {
      currentIndex--;
      renderCurrent();
    } else if (deltaX < -40 && currentIndex < sequence.length - 1) {
      currentIndex++;
      renderCurrent();
    }
  });

  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  renderCurrent();
}

function openPhotoFullscreen(url, noteId = null, plantId = null, bare = false) {
  if (!url) return;

  let matchingNote = bare
    ? null
    : noteId
      ? notes.find(n => n.id === noteId)
      : notes.find(n => n.photoUrl === url);
  const resolvedPlantId = plantId ?? matchingNote?.plantId ?? null;

  const photoSequence = resolvedPlantId
    ? notes
        .filter(n => n.plantId === resolvedPlantId && n.photoUrl)
        .slice()
        .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
    : [];

  let currentIndex = 0;
  if (matchingNote) {
    const idx = photoSequence.findIndex(n => n.id === matchingNote.id);
    if (idx >= 0) currentIndex = idx;
  }

  // Bare-image mode (no note resolved) — preserved untouched.
  if (!matchingNote) {
    const div = document.createElement('div');
    div.className = 'photo-fullscreen-overlay is-zoomed';
    div.innerHTML = `
      <button type="button" class="photo-fullscreen-close" aria-label="${t('photos.aria.close')}">&times;</button>
      <div class="photo-fullscreen-photo-area">
        <img loading="lazy" src="${escapeHtml(url)}" alt="" />
      </div>
    `;
    const close = () => {
      div.remove();
      document.body.classList.remove('photo-overlay-open');
      document.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    };
    div.querySelector('.photo-fullscreen-close')?.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(div);
    document.body.classList.add('photo-overlay-open');
    return;
  }

  // Note-context mode — redesigned layout (Brief #218).
  const currentPlant = plants.find(p => p.id === matchingNote.plantId);
  const photoCount = photoSequence.length;

  const plantTileInner = currentPlant?.photoUrl
    ? `<img loading="lazy" src="${escapeHtml(currentPlant.photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : escapeHtml(currentPlant?.emoji ?? '🪴');

  const thumbsHtml = photoSequence.map(n =>
    `<img loading="lazy" class="photo-fullscreen-thumb" src="${escapeHtml(n.photoUrl)}" alt="" />`
  ).join('');

  const div = document.createElement('div');
  div.className = 'photo-fullscreen-overlay';
  div.innerHTML = `
    <div class="photo-fullscreen-header">
      <div class="photo-fullscreen-plant-chip">
        <span class="photo-fullscreen-plant-tile">${plantTileInner}</span>
        <div>
          <div class="photo-fullscreen-plant-name">${escapeHtml(currentPlant?.name ?? '')}</div>
          <div class="photo-fullscreen-photo-count">${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}</div>
        </div>
      </div>
      <button type="button" class="photo-fullscreen-close" aria-label="${t('photos.aria.close')}">&times;</button>
    </div>
    <div class="photo-fullscreen-photo-card">
      <img loading="lazy" src="${escapeHtml(url)}" alt="" />
      <button type="button" class="photo-fullscreen-prev" aria-label="${t('photos.aria.previous')}">&#8249;</button>
      <button type="button" class="photo-fullscreen-next" aria-label="${t('photos.aria.next')}">&#8250;</button>
      <div class="photo-fullscreen-zoom-icon">⤢</div>
    </div>
    <div class="photo-fullscreen-thumbs">${thumbsHtml}</div>
    <div class="photo-fullscreen-meta-card">
      <div class="photo-fullscreen-note-label">${t('photos.slideshow.noteLabel')}</div>
      <div class="photo-fullscreen-note-text"></div>
      <div class="photo-fullscreen-meta-footer">
        <div class="photo-fullscreen-avatar-row">
          <span class="photo-fullscreen-avatar"></span>
          <span class="photo-fullscreen-member-name"></span>
        </div>
        <span class="photo-fullscreen-date-badge"></span>
      </div>
    </div>
  `;

  const photoCard  = div.querySelector('.photo-fullscreen-photo-card');
  const imgEl      = photoCard?.querySelector('img');
  const prevBtn    = div.querySelector('.photo-fullscreen-prev');
  const nextBtn    = div.querySelector('.photo-fullscreen-next');
  const thumbEls   = Array.from(div.querySelectorAll('.photo-fullscreen-thumb'));
  const noteTextEl = div.querySelector('.photo-fullscreen-note-text');
  const avatarEl   = div.querySelector('.photo-fullscreen-avatar');
  const memberEl   = div.querySelector('.photo-fullscreen-member-name');
  const dateEl     = div.querySelector('.photo-fullscreen-date-badge');

  const renderCurrent = () => {
    const note = photoSequence[currentIndex] ?? matchingNote;
    if (!note) return;

    if (imgEl) imgEl.src = note.photoUrl;

    if (noteTextEl) {
      const text = (note.note ?? '').trim();
      noteTextEl.textContent = text || t('photos.noNote');
    }

    const member = membersCache.find(m => m.id === note.memberId);
    if (avatarEl) {
      avatarEl.style.background = member?.color ?? '#888';
      avatarEl.textContent = (member?.display_name ?? note.author ?? '?')[0].toUpperCase();
    }
    if (memberEl) {
      memberEl.textContent = member?.display_name ?? note.author ?? '';
    }
    if (dateEl) {
      dateEl.textContent = note.createdAt
        ? new Date(note.createdAt).toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
    }

    thumbEls.forEach((el, i) => el.classList.toggle('active', i === currentIndex));
    thumbEls[currentIndex]?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    if (prevBtn) prevBtn.hidden = currentIndex === 0;
    if (nextBtn) nextBtn.hidden = currentIndex === photoSequence.length - 1;
  };

  const close = () => {
    div.remove();
    document.body.classList.remove('photo-overlay-open');
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  };
  div.querySelector('.photo-fullscreen-close')?.addEventListener('click', close);

  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrent();
    }
  });
  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentIndex < photoSequence.length - 1) {
      currentIndex++;
      renderCurrent();
    }
  });

  thumbEls.forEach((el, i) => {
    el.addEventListener('click', () => {
      currentIndex = i;
      renderCurrent();
    });
  });

  const zoomIconEl = div.querySelector('.photo-fullscreen-zoom-icon');
  zoomIconEl?.addEventListener('click', () => {
    const currentUrl = photoSequence[currentIndex]?.photoUrl ?? url;
    openPhotoFullscreen(currentUrl, null, null, true);
  });

  document.addEventListener('keydown', onKey);
  document.body.appendChild(div);
  document.body.classList.add('photo-overlay-open');

  renderCurrent();
}

function renderPhotoCapSheet(plantId) {
  state.sheetMode = 'photo-cap';
  openSheet(`
    <div class="sheet-title">${t('photos.cap.title')}</div>
    <div class="photo-cap-body">
      <div class="photo-cap-msg">${t('photos.cap.body', { cap: PHOTO_CAP_PER_PLANT })}</div>
    </div>
    <div class="sheet-actions" style="flex-direction:column;gap:8px;">
      <button class="btn btn-primary" data-action="photo-cap-delete-oldest" data-plant="${escapeHtml(plantId)}">${t('photos.cap.deleteOldest')}</button>
      <button class="btn btn-ghost" data-action="photo-cap-manage" data-plant="${escapeHtml(plantId)}">${t('photos.managePhotos')}</button>
      <button class="btn btn-ghost" data-action="photo-cap-back">${t('taskSheet.back')}</button>
    </div>
  `);
}

async function renderManagePhotosSheet(plantId) {
  state.sheetMode = 'manage-photos';
  openSheet(`
    <div class="sheet-title">${t('photos.managePhotos')}</div>
    <div class="manage-photos-list" id="manage-photos-list"><div class="manage-photos-loading">${t('photos.loading')}</div></div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="photo-cap-back">&#8592; ${t('taskSheet.back')}</button>
    </div>
  `);
  const photos = await fetchAllPlantPhotos(plantId);
  const list = document.getElementById('manage-photos-list');
  if (!list || state.sheetMode !== 'manage-photos') return;
  if (photos.length === 0) {
    list.innerHTML = `<div class="manage-photos-empty">${t('photos.noPhotos')}</div>`;
    return;
  }
  list.innerHTML = photos.map(p => {
    const date = p.created_at
      ? new Date(p.created_at).toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    return `
      <div class="manage-photos-row" data-photo-id="${escapeHtml(p.id)}">
        <img loading="lazy" class="manage-photos-thumb" src="${escapeHtml(p.storage_url)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(p.storage_url)}" style="width:56px;height:56px;border-radius:8px;border:1.5px solid #7a907f;" />
        <div class="manage-photos-date">${escapeHtml(date)}</div>
        <button class="manage-photos-delete" data-action="manage-photos-delete" data-photo-id="${escapeHtml(p.id)}" data-plant="${escapeHtml(plantId)}" data-note-id="${escapeHtml(p.note_id ?? '')}" data-url="${escapeHtml(p.storage_url ?? '')}">${t('photos.delete')}</button>
      </div>`;
  }).join('');
}

function renderEditNotePhotoSection(note, lastPhoto, photoMeta) {
  if (note.photoUrl) {
    const dateSrc = photoMeta?.created_at ?? note.createdAt;
    const dateLabel = dateSrc
      ? new Date(dateSrc).toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:8px;background:#fff;border:1px solid #e4e9e0;border-radius:10px;">
        <img loading="lazy" class="notes-tab-thumb" src="${escapeHtml(note.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(note.photoUrl)}" style="width:56px;height:56px;border-radius:8px;border:1.5px solid #7a907f;" />
        <div style="flex:1;font-size:13px;color:#1a2e1f;">${escapeHtml(dateLabel)}</div>
        <button class="manage-photos-delete" data-action="edit-note-delete-photo">${t('photos.delete')}</button>
      </div>`;
  }
  let coachHtml = '';
  if (lastPhoto?.storage_url) {
    const dateLabel = lastPhoto.created_at
      ? new Date(lastPhoto.created_at).toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric' })
      : '';
    coachHtml = `
      <div class="add-note-coach" style="margin-top:8px;background:#eef5fc;border:1px solid #b8d4f0;">
        <div class="add-note-coach-text">
          <div class="add-note-coach-title" style="color:#1a4a7a;">💡 ${t('notes.coach.title')}</div>
          <div class="add-note-coach-body" style="color:#2a5a8a;">${t('notes.coach.bodyAlt')}</div>
        </div>
        <div class="add-note-coach-last">
          <img loading="lazy" class="add-note-coach-last-thumb" src="${escapeHtml(lastPhoto.storage_url)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(lastPhoto.storage_url)}" style="width:56px;height:56px;border-radius:8px;border:1.5px solid #7a907f;" />
          <div class="add-note-coach-last-label" style="color:#5a82aa;">${t('photos.lastPhoto')}${dateLabel ? ' · ' + escapeHtml(dateLabel) : ''}</div>
        </div>
      </div>`;
  }
  return `
    <button type="button" class="add-note-photo-btn" data-action="edit-note-pick-photo">📷 ${t('notes.addPhoto')}</button>
    ${coachHtml}`;
}

async function fetchPhotoForNote(noteId) {
  const { data, error } = await supabaseClient
    .from('plant_photos')
    .select('id, plant_id, note_id, storage_url, created_at')
    .eq('note_id', noteId)
    .maybeSingle();
  if (error) { console.error('fetchPhotoForNote error:', error); return null; }
  return data ?? null;
}

async function refreshEditNotePhotoSection() {
  const noteId = state.sheetData?.noteId;
  const plantId = state.sheetData?.plantId;
  if (!noteId || !plantId) return;
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  const area = document.getElementById('edit-note-photo-area');
  if (!area) return;

  if (note.photoUrl) {
    area.innerHTML = renderEditNotePhotoSection(note, null, state.sheetData?.editNotePhotoMeta ?? null);
    const meta = await fetchPhotoForNote(noteId);
    if (state.sheetMode !== 'edit-note' || state.sheetData?.noteId !== noteId) return;
    state.sheetData.editNotePhotoMeta = meta;
    const area2 = document.getElementById('edit-note-photo-area');
    if (area2 && note.photoUrl) area2.innerHTML = renderEditNotePhotoSection(note, null, meta);
  } else {
    state.sheetData.editNotePhotoMeta = null;
    area.innerHTML = renderEditNotePhotoSection(note, null, null);
    const lastPhoto = await fetchLastPlantPhoto(plantId);
    if (state.sheetMode !== 'edit-note' || state.sheetData?.noteId !== noteId) return;
    if (note.photoUrl) return;
    const area2 = document.getElementById('edit-note-photo-area');
    if (area2) area2.innerHTML = renderEditNotePhotoSection(note, lastPhoto, null);
  }
}

async function handleEditNotePhotoFileSelected(file) {
  if (!file || !file.type?.startsWith('image/')) return;
  const noteId = state.sheetData?.noteId;
  const plantId = state.sheetData?.plantId;
  if (!noteId || !plantId) return;
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  const count = await countPlantPhotos(plantId);
  if (count >= PHOTO_CAP_PER_PLANT) {
    showToast(t('menu.toast.photoLimitReached'));
    return;
  }

  let blob;
  try {
    blob = await compressImage(file, 1200, 0.8);
  } catch (err) {
    console.error('[editNotePhoto] compress error:', err);
    showToast(t('menu.toast.couldNotLoadImage'));
    return;
  }
  if (!blob) return;

  try {
    const upRes = await uploadPlantPhoto(blob, plantId);
    const photoUrl = upRes.publicUrl;
    posthog.capture('photo_added', { plant_id: plantId });
    const { data: photoRow, error: ppErr } = await supabaseClient
      .from('plant_photos')
      .insert({ plant_id: plantId, note_id: noteId, storage_url: photoUrl })
      .select('id, plant_id, note_id, storage_url, created_at')
      .single();
    if (ppErr) throw ppErr;
    const { error: noteErr } = await supabaseClient
      .from('notes')
      .update({ photo_url: photoUrl })
      .eq('id', noteId);
    if (noteErr) throw noteErr;
    note.photoUrl = photoUrl;
    if (state.sheetData) state.sheetData.editNotePhotoMeta = photoRow;
    await refreshEditNotePhotoSection();
  } catch (err) {
    console.error('[editNotePhoto] upload/attach failed:', err);
    showToast(t('menu.toast.couldNotSavePhoto'));
  }
}

function renderEditNoteSheet(plantId, noteId) {
  const note  = notes.find(n => n.id === noteId);
  const plant = getPlant(plantId);
  if (!note || !plant) return;

  state.sheetMode = 'edit-note';
  state.sheetData = { plantId, noteId };
  sheetEntryTab   = plantDetailTab;

  openSheet(`
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:0.5px solid #e8ece6;">
      <span style="width:36px;height:36px;background:#eef3eb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${escapeHtml(plant.emoji ?? '🪴')}</span>
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;">
        <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name ?? '')}</div>
        <div style="font-size:12px;color:#8a8d86;">${t('notes.editNote.subtitle')}</div>
      </div>
    </div>

    <div style="padding:12px 16px 4px;">
      <textarea class="form-textarea" id="sheet-edit-note-text" style="min-height:110px;width:100%;box-sizing:border-box;">${escapeHtml(note.note ?? '')}</textarea>
    </div>

    <div id="edit-note-photo-area" style="padding:4px 16px 8px;">${renderEditNotePhotoSection(note, null, null)}</div>
    <input type="file" id="edit-note-file-input" accept="image/*" capture="environment" hidden />

    <div class="task-delete-section" style="padding:4px 16px 6px;">
      <button class="task-delete-link" data-action="sheet-delete-note" data-plant="${escapeHtml(plantId)}" data-note="${escapeHtml(noteId)}" style="font-size:13px;">${t('notes.deleteNote')}</button>
    </div>

    <div class="sheet-footer-sticky">
      <div class="sheet-actions" style="padding:8px 16px 14px;">
        <button class="btn btn-ghost" data-action="sheet-cancel">&#8592; ${t('taskSheet.cancel')}</button>
        <button class="btn btn-primary" data-action="sheet-save-edit-note" data-plant="${escapeHtml(plantId)}" data-note="${escapeHtml(noteId)}">${t('taskSheet.saveChanges')}</button>
      </div>
    </div>
  `);

  refreshEditNotePhotoSection();
}

function renderEditPlantStep2Html(plant) {
  const sd = state.sheetData;
  const dateDisplay = plant.dateAcquired
    ? new Date(plant.dateAcquired + 'T12:00:00').toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
    : t('editPlant.setDate');
  const nameValue = sd.editPlantName ?? plant.name;

  let iconHtml;
  let sublabel;
  if (sd.editIconMode === 'photo') {
    const photoSrc = sd.pendingPlantPhoto?.previewUrl ?? sd.editExistingPhotoUrl ?? '';
    iconHtml = `<img loading="lazy" src="${escapeHtml(photoSrc)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;border:1.5px solid #c8c8c8;flex-shrink:0;display:block;box-sizing:border-box;" />`;
    sublabel = t('editPlant.sublabelPhoto');
  } else {
    const emoji = sd.selectedEmoji ?? plant.emoji ?? '🪴';
    iconHtml = `<div style="width:40px;height:40px;background:#f0f4f0;border:0.5px solid #d0dcd0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;line-height:1;box-sizing:border-box;">${escapeHtml(emoji)}</div>`;
    sublabel = t('editPlant.sublabelEmoji');
  }

  return `
    <div class="sheet-title edit-plant-sheet-title">${t('plantDetail.aria.editPlant')}</div>

    <div class="edit-plant-field-label">${t('editPlant.iconLabel')}</div>
    <div id="edit-plant-icon-row" style="display:flex;align-items:center;gap:12px;margin-top:4px;padding-bottom:14px;">
      ${iconHtml}
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;color:#1a1a1a;">${t('editPlant.plantIcon')}</div>
        <div style="font-size:11px;color:#888;margin-top:2px;">${sublabel}</div>
      </div>
      <button data-action="edit-plant-change-icon" style="font-size:12px;color:#3a6b3a;background:transparent;border:0.5px solid #a8c4a8;border-radius:8px;padding:5px 10px;cursor:pointer;font-family:inherit;flex-shrink:0;">${t('editPlant.change')}</button>
    </div>
    <div style="height:0.5px;background:var(--border);margin-bottom:14px;"></div>

    <div class="edit-plant-field-label" style="margin-top:0;">${t('editPlant.nameLabel')}</div>
    <div id="edit-plant-fields">
      <input type="text" class="form-input" id="sheet-plant-name" value="${escapeHtml(nameValue)}" placeholder="${t('editPlant.namePlaceholder')}">
    </div>

    <div class="edit-plant-field-label" style="margin-top:14px;">${t('editPlant.arrivalDateLabel')}</div>
    <div class="arrival-step2-row">
      <div class="arrival-step2-left">
        <span>🌱</span>
        <span>${t('editPlant.whenArrive')}</span>
      </div>
      <label class="arrival-optional-pill${plant.dateAcquired ? ' has-value' : ''}" id="edit-plant-arrival-pill" for="sheet-acquired-date">
        <span id="arrival-date-display">${escapeHtml(dateDisplay)}</span>
        <input type="date" id="sheet-acquired-date" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:2;max-width:100%;" value="${escapeHtml(plant.dateAcquired ?? '')}">
      </label>
    </div>

    <div style="height:0.5px;background:var(--border);margin-top:20px;"></div>
    <div id="edit-plant-delete-wrap">
      <button data-action="edit-plant-show-delete" id="edit-plant-delete-btn" style="background:transparent;border:none;color:#c04040;font-size:13px;padding:10px 0;width:100%;text-align:left;cursor:pointer;font-family:inherit;">${t('editPlant.deletePlant')}</button>
      <div class="edit-plant-delete-confirm" id="edit-plant-delete-confirm" style="display:none;">
        <div class="edit-plant-delete-confirm-body">${t('editPlant.deleteConfirmBody')}</div>
        <div class="edit-plant-delete-confirm-actions">
          <button class="btn btn-ghost" data-action="edit-plant-hide-delete" style="flex:1;">${t('taskSheet.cancel')}</button>
          <button class="btn" data-action="delete-plant" data-plant="${escapeHtml(String(plant.id))}" style="flex:1;background:#c62828;color:#fff;">${t('editPlant.deleteConfirmYes')}</button>
        </div>
      </div>
    </div>
    <div style="height:0.5px;background:var(--border);"></div>

    <div style="margin-top:14px;display:flex;gap:8px;" id="edit-plant-save-row">
      <button class="btn btn-ghost" data-action="edit-plant-cancel" style="flex:1;">${t('taskSheet.cancel')}</button>
      <button class="btn btn-primary" data-action="sheet-save-plant" style="flex:1;">${t('editPlant.saveChanges')}</button>
    </div>`;
}

function renderEditPlantSheet(plantId) {
  const plant = getPlant(plantId);
  if (!plant) return;

  state.sheetMode = 'edit-plant';
  state.sheetData = {
    plantId,
    step: 2,
    selectedEmoji: plant.emoji,
    activeTab: 'all',
    editIconMode: plant.photoUrl ? 'photo' : 'emoji',
    editExistingPhotoUrl: plant.photoUrl ?? null,
    pendingPlantPhoto: null,
    editPlantName: null,
  };

  openSheet(renderEditPlantStep2Html(plant));
  attachArrivalDateListener(t('editPlant.setDate'));
}

async function handleSavePlant() {
  if (isSaving) return;
  isSaving = true;
  try {
  const sd = state.sheetData;
  const { plantId: pid } = sd;
  const plant = getPlant(pid);
  if (!plant) return;

  const name  = document.getElementById('sheet-plant-name')?.value?.trim();
  const emoji = sd.selectedEmoji
    || document.querySelector('#sheet .emoji-option.selected')?.dataset.emoji
    || document.getElementById('sheet-plant-emoji')?.value?.trim();
  const date  = document.getElementById('sheet-acquired-date')?.value;

  let newPhotoUrl = null;
  if (sd.editIconMode === 'photo') {
    if (sd.pendingPlantPhoto?.blob) {
      try {
        const upRes = await uploadPlantPhoto(sd.pendingPlantPhoto.blob, pid);
        newPhotoUrl = upRes.publicUrl;
      } catch (err) {
        console.error('handleSavePlant: photo upload error:', err);
        newPhotoUrl = sd.editExistingPhotoUrl;
      }
    } else {
      newPhotoUrl = sd.editExistingPhotoUrl;
    }
  }

  const localUpdates = {
    name:         name  || plant.name,
    emoji:        emoji || plant.emoji,
    photoUrl:     newPhotoUrl,
    dateAcquired: date  || null,
  };

  updatePlantInfo(pid, localUpdates);

  const dbUpdates = {
    name:         localUpdates.name,
    emoji:        localUpdates.emoji,
    photo_url:    newPhotoUrl,
    date_acquired: localUpdates.dateAcquired,
  };

  await supabaseClient
    .from('plants')
    .update(dbUpdates)
    .eq('id', pid)
    .then(({ error }) => { if (error) console.error('handleSavePlant error:', error); });

  if (sd.pendingPlantPhoto?.previewUrl) {
    URL.revokeObjectURL(sd.pendingPlantPhoto.previewUrl);
  }

  closeSheet();
  renderPlantDetail(pid);
  showToast(t('menu.toast.plantSaved'));
  } finally {
    isSaving = false;
  }
}

function renderAddPlantSheet() {
  state.sheetMode = 'add-plant';
  state.sheetData = { step: 1, selectedEmoji: '🪴', activeTab: 'all', pendingPlantPhoto: null };
  openSheet(renderAddPlantStep1Html('all', '🪴', null));
}

async function handleAddPlantFileSelected(file) {
  if (!file || !file.type?.startsWith('image/')) return;
  try {
    const blob = await compressImage(file, 1200, 0.8);
    if (!blob) return;
    const previewUrl = URL.createObjectURL(blob);
    if (state.sheetData?.pendingPlantPhoto?.previewUrl) {
      URL.revokeObjectURL(state.sheetData.pendingPlantPhoto.previewUrl);
    }
    state.sheetData = state.sheetData || {};
    state.sheetData.pendingPlantPhoto = { blob, previewUrl };
    openSheet(renderAddPlantStep1Html(
      state.sheetData.activeTab || 'all',
      state.sheetData.selectedEmoji || '🪴',
      state.sheetData.pendingPlantPhoto
    ));
  } catch (err) {
    console.error('[addPlantFileSelected] error:', err);
    showToast(t('menu.toast.couldNotLoadImage'));
  }
}

function clearPendingPlantPhoto() {
  const p = state.sheetData?.pendingPlantPhoto;
  if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
  if (state.sheetData) state.sheetData.pendingPlantPhoto = null;
}

async function handleSaveNewPlant() {
  if (isSaving) return;
  isSaving = true;

  const sheetContent = document.getElementById('sheet-content');
  const interactiveEls = sheetContent ? [...sheetContent.querySelectorAll('button, input, textarea')] : [];
  interactiveEls.forEach(el => { el.disabled = true; });

  const reEnable = () => {
    interactiveEls.forEach(el => { el.disabled = false; });
    isSaving = false;
  };

  try {
  const typedName = state.sheetData.plantName || document.getElementById('sheet-plant-name')?.value?.trim();
  if (!typedName) { alert(t('dialog.alertPlantNameRequired')); reEnable(); return; }

  const isDuplicate = plants.some(p => p.name.toLowerCase() === typedName.toLowerCase());
  let name;
  if (isDuplicate) {
    const altName = document.getElementById('sheet-plant-alt-name')?.value?.trim();
    name = altName || `${typedName} 2`;
  } else {
    name = typedName;
  }

  const emoji = state.sheetData.selectedEmoji || '🪴';
  const dateAcquired = userTouchedArrivalDate ? (getSelectDate('arrival') || null) : null;
  const sortOrder = plants.length + 1;
  const pendingPhoto = state.sheetData.pendingPlantPhoto;

  const { data: inserted, error } = await supabaseClient
    .from('plants')
    .insert({
      household_id:  householdId,
      name,
      emoji,
      date_acquired: dateAcquired,
      sort_order:    sortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('handleSaveNewPlant: Supabase insert error:', error);
    reEnable();
    return;
  }

  let photoUrl = null;
  if (pendingPhoto?.blob && inserted?.id) {
    try {
      const upRes = await uploadPlantPhoto(pendingPhoto.blob, inserted.id);
      photoUrl = upRes.publicUrl;
      const { error: updErr } = await supabaseClient
        .from('plants')
        .update({ photo_url: photoUrl })
        .eq('id', inserted.id);
      if (updErr) {
        console.error('handleSaveNewPlant: photo_url update error:', updErr);
        photoUrl = null;
      }
    } catch (err) {
      console.error('handleSaveNewPlant: photo upload error:', err);
    }
    if (pendingPhoto.previewUrl) URL.revokeObjectURL(pendingPhoto.previewUrl);
  }

  const newPlant = {
    id:           inserted?.id ?? uid(),
    name,
    emoji,
    dateAcquired: dateAcquired ?? '',
    photoUrl:     photoUrl,
    tasks:        [],
    careLog:      [],
  };

  plants.push(newPlant);
  state.sheetData.plantName = null;
  if (getOnboardingStep() === 1) {
    setOnboardingPlantId(newPlant.id);
    setOnboardingStep(2);
    closeSheet();
    navigateTo('home');
  } else {
    closeSheet();
    navigateTo('plant', newPlant.id);
  }
  showToast(t('menu.toast.plantAdded'));
  } catch (err) {
    console.error('handleSaveNewPlant:', err);
    reEnable();
  } finally {
    isSaving = false;
  }
}

async function handleSaveNewTask() {
  if (isSaving) return;
  isSaving = true;
  try {
  const { plantId: pid, typeKey } = state.sheetData;
  const isCustom = typeKey === 'custom';

  // #349: this save is the onboarding Step-2 task ONLY when onboarding is at
  // Step 2 on the onboarding plant. A normal task creation never matches.
  const isOnboardingTaskSave = getOnboardingStep() === 2 && pid === getOnboardingPlantId();

  // Resolve name, icon, type
  let name, icon, type, customName, customIcon;
  if (isCustom) {
    customName = document.getElementById('sheet-custom-name')?.value?.trim();
    if (!customName) { alert(t('dialog.alertTaskNameRequired')); return; }
    customIcon = document.querySelector('#sheet .icon-option.selected')?.dataset.icon ?? '🌿';
    name = customName;
    icon = customIcon;
    type = 'custom';
  } else {
    const cfg = TASK_CONFIG[typeKey];
    name = cfg.name;
    icon = cfg.icon;
    type = cfg.type;
  }
  // The onboarding sample task is a real, persistent water task with a fixed name.
  if (isOnboardingTaskSave) name = 'Watering (Example)';

  const container = document.getElementById('recurrence-container');
  const recType = container?.classList.contains('recurrence-weekdays') ? 'weekdays'
                : container?.classList.contains('recurrence-yearly')   ? 'yearly'
                : container?.classList.contains('recurrence-one-off')  ? 'one-off'
                : 'interval';
  let frequencyDays = 7;
  let weekdays = [];
  let yearlyMonth = null, yearlyDay = null;

  if (recType === 'interval') {
    const freq = parseInt(document.getElementById('sheet-frequency')?.value ?? '');
    if (!freq || freq < 1) { alert(t('dialog.alertFrequencyInvalid')); return; }
    frequencyDays = freq;
  } else if (recType === 'weekdays') {
    weekdays = [...document.querySelectorAll('#sheet .weekday-btn.selected')].map(b => parseInt(b.dataset.day));
    if (weekdays.length === 0) { alert(t('dialog.alertWeekdayRequired')); return; }
  } else if (recType === 'yearly') {
    yearlyMonth = parseInt(document.getElementById('yearly-month')?.value ?? '');
    yearlyDay   = parseInt(document.getElementById('yearly-day')?.value ?? '');
    if (!yearlyMonth || !yearlyDay) { alert(t('dialog.alertMonthDayRequired')); return; }
  }

  // Yearly is anchored by month/day; it has no first-due override.
  const firstDueVal = recType === 'yearly' ? null : getSelectDate('task-due-oneoff');

  const selectedOwner = document.querySelector('#sheet .owner-pill.selected, #sheet .owner-option.selected');
  const owner = selectedOwner?.dataset.owner ?? Object.keys(USERS)[0];

  const plant = getPlant(pid);
  if (!plant) return;

  const ownerMember = membersCache.find(m => m.display_name === owner);
  const sortOrder = plant.tasks.length + 1;

  const supabaseRow = {
    plant_id:         pid,
    name,
    icon,
    type,
    recurrence: recType === 'one-off' ? { type: 'one-off' }
      : recType === 'yearly'          ? { type: 'yearly', month: yearlyMonth, day: yearlyDay }
      : { type: recType, every: frequencyDays, unit: 'days', days: weekdays },
    owner_id:         ownerMember?.id ?? null,
    paused:           false,
    note:             '',
    sort_order:       sortOrder,
    next_due_override: firstDueVal,
  };

  const { data: inserted, error } = await supabaseClient
    .from('tasks')
    .insert(supabaseRow)
    .select()
    .single();

  if (error) {
    console.error('handleSaveNewTask: Supabase insert error:', error);
  } else {
    posthog.capture('task_created', { plant_id: pid, task_type: type });
    if (!isOnboardingTaskSave && currentMemberId) {
      localStorage.setItem(`calendar_card_triggered_${currentMemberId}`, '1');
    }
  }

  const taskId = inserted?.id ?? uid();

  const newTask = {
    id: taskId,
    name,
    icon,
    type,
    recurrenceType: recType,
    frequencyDays,
    recurrenceUnit: 'days',
    weekdays,
    recurrenceMonth: yearlyMonth,
    recurrenceDay: yearlyDay,
    lastDone: null,
    nextDueOverride: firstDueVal,
    paused: false,
    owner,
    note: '',
    ...(isCustom ? { customName, customIcon } : {}),
  };

  plant.tasks.push(newTask);

  // #349: advance onboarding Step 2 → 3 only for the guided onboarding save.
  if (isOnboardingTaskSave) {
    setOnboardingTaskId(taskId);
    setOnboardingStep(3);
  }

  closeSheet();
  const _appEl = document.getElementById('app');
  _appEl.style.pointerEvents = 'none';
  if (isOnboardingTaskSave) {
    // #351: land on home so the polished Step 3 card renders (renderHome :2442).
    sheetEntryTab = null;
    navigateTo('home');
  } else {
    if (sheetEntryTab) plantDetailTab = sheetEntryTab;
    sheetEntryTab = null;
    renderPlantDetail(pid);
  }
  setTimeout(() => { _appEl.style.pointerEvents = ''; }, 350);
  showToast(t('menu.toast.taskAdded'));
  } finally {
    isSaving = false;
  }
}

// ============================================================
// NAVIGATION
// ============================================================

function renderApp() {
  if (state.view === 'home') renderHome();
  else if (state.view === 'plant') renderPlantDetail(state.plantId);
  else if (state.view === 'manage-households') renderManageHouseholds();
}


function navigateTo(view, plantId = null) {
  window.scrollTo(0, 0);
  closeSheet();
  state.view = view;
  state.plantId = plantId;
  if (view === 'home') renderHome();
  else if (view === 'plant') { plantDetailTab = 'summary'; renderPlantDetail(plantId); }
  else if (view === 'manage-households') renderManageHouseholds();
}

// ============================================================
// EVENT HANDLING
// ============================================================

async function handleEvent(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  try {
  const action  = target.dataset.action;
  const plantId = target.dataset.plant;
  const taskId  = target.dataset.task;
  const noteId  = target.dataset.note;

  switch (action) {

    case 'login':
      handleLogin();
      break;

    case 'save-name':
      handleNameCapture();
      break;

    case 'save-new-password':
      handlePasswordReset();
      break;

    case 'sign-out':
      supabaseClient.auth.signOut().then(() => renderLoginScreen());
      break;

    case 'feedback':
      handleFeedbackTap();
      break;

    case 'toggle-household-switcher': {
      e.stopPropagation();
      const switcher = document.getElementById('household-switcher');
      const pill     = target.closest('.household-pill');
      const open     = switcher?.classList.toggle('open');
      pill?.classList.toggle('open', open);
      pill?.setAttribute('aria-expanded', open ? 'true' : 'false');
      break;
    }

    case 'open-manage-households': {
      const switcher = document.getElementById('household-switcher');
      const pill     = document.querySelector('.household-pill');
      switcher?.classList.remove('open');
      pill?.classList.remove('open');
      pill?.setAttribute('aria-expanded', 'false');
      manageHouseholdsEditingName = false;
      navigateTo('manage-households');
      break;
    }

    case 'switch-household': {
      const newId = target.dataset.householdId;
      if (!newId || newId === householdId) break;
      const switcher = document.getElementById('household-switcher');
      const pill     = document.querySelector('.household-pill');
      switcher?.classList.remove('open');
      pill?.classList.remove('open');
      pill?.setAttribute('aria-expanded', 'false');
      householdId = newId;
      localStorage.setItem('active_household_id', newId);
      activeTab = 'plants';
      showReloadIndicator();
      try {
        await loadFromSupabase();
      } finally {
        hideReloadIndicator();
      }
      navigateTo('home');
      break;
    }

    case 'manage-households-back':
      navigateTo('home');
      break;

    case 'manage-households-start-edit':
      manageHouseholdsEditingName = true;
      renderManageHouseholds();
      break;

    case 'manage-households-cancel-name':
      manageHouseholdsEditingName = false;
      renderManageHouseholds();
      break;

    case 'manage-households-save-name':
      await handleManageHouseholdsSaveName();
      break;

    case 'open-menu':
      openMenu();
      break;

    case 'close-menu':
      closeMenu();
      break;

    case 'change-password':
      closeMenu();
      renderChangePasswordSheet();
      break;

    case 'menu-notifications':
      // #358: OS-blocked state is informational only — subscribeToPush() can't
      // grant once permission is 'denied', so don't open the enable flow.
      if ('Notification' in window && Notification.permission === 'denied') break;
      closeMenu();
      renderNotificationsSheet();
      break;

    case 'reminders-enable': {
      // #363: inline enable — replaces the removed reminders setup dialog.
      // Model on sheet-enable-notifications: only persist/celebrate on real grant.
      const ok = await subscribeToPush();
      if (ok) {
        await setNotificationsEnabled(true);
        if (currentMemberId) localStorage.setItem(`reminders_card_dismissed_${currentMemberId}`, 'true');
        await markOnboardingCompleteIfNeeded(); // #403: enabling completes onboarding
        showToast(t('menu.toast.notificationsEnabled'));
      }
      // On false: a denial flips the card to the OS-blocked state on re-render;
      // any other failure (no SW/PushManager) leaves the full card. No toast either way.
      renderHome();
      break;
    }

    case 'reminders-maybe-later':
      // #339: Full → Note, in-session only — no flag written, reload restores Full.
      remindersCardCollapsed = true;
      renderHome();
      break;

    case 'reminders-note-dismiss':
      // #339: Note → Gone, permanent.
      if (currentMemberId) localStorage.setItem(`reminders_card_dismissed_${currentMemberId}`, 'true');
      await markOnboardingCompleteIfNeeded(); // #403: dismissing the card completes onboarding
      renderHome();
      break;

    case 'cal-card-dismiss':
      if (currentMemberId) localStorage.setItem(`calendar_card_dismissed_${currentMemberId}`, '1');
      calendarCardCollapsed = false;
      renderHome();
      break;

    case 'cal-card-maybe-later':
      calendarCardCollapsed = true;
      renderHome();
      break;

    case 'cal-card-subscribe':
      openCalendarSyncSheet();
      break;

    case 'sheet-enable-notifications': {
      // #341: only persist + celebrate on genuine success; denial/failure writes nothing.
      const ok = await subscribeToPush();
      if (ok) await setNotificationsEnabled(true);
      closeSheet();
      renderMenuPanel(); // re-render so the row reflects the real state
      showToast(ok ? t('menu.toast.notificationsEnabledBang') : t('menu.toast.notificationsNotEnabled'));
      break;
    }

    case 'save-change-password':
      await handleChangePassword();
      break;

    case 'menu-sign-out':
      closeMenu();
      localStorage.removeItem('active_household_id');
      supabaseClient.auth.signOut().then(() => renderLoginScreen());
      break;

    case 'open-calendar-sync':
      closeMenu();
      openCalendarSyncSheet();
      break;

    case 'copy-calendar-link':
      await handleCopyCalendarLink(target);
      break;

    case 'subscribe-calendar': {
      const url = target.dataset.url;
      if (url) window.open(url);
      break;
    }

    case 'open-plant':
      navigateTo('plant', plantId);
      break;

    case 'onboarding-open-plant': {
      // #349: open the real Add Task sheet pre-filled (skipping the type picker)
      // instead of navigating to the scripted Example card. state.view stays as-is
      // so Cancel returns to wherever the banner was tapped (home); a successful
      // save routes to the plant's Tasks tab via handleSaveNewTask.
      const _obMember = membersCache.find(m => m.id === currentMemberId);
      state.plantId = plantId;
      plantDetailTab = 'tasks';
      renderAddTaskStep2(plantId, 'normal-water', {
        onboarding: true,
        repeating:  true,
        recType:    'interval',
        frequency:  3,
        owner:      _obMember?.display_name,
      });
      break;
    }

    case 'go-home':
      navigateTo('home');
      break;

    case 'open-household-activity':
      openHouseholdActivity();
      posthog.capture('household_activity_viewed');
      break;

    case 'close-household-activity':
      closeHouseholdActivity();
      break;

    case 'switch-tab': {
      activeTab = target.dataset.tab;
      renderHome();
      posthog.capture('tab_viewed', { tab: activeTab === 'plants' ? 'my_plants' : 'caring' });
      break;
    }

    case 'view-schedule-tab': {
      activeTab = 'schedule';
      renderHome();
      break;
    }

    case 'enable-notifications': {
      console.log('enable-notifications handler reached');
      // #341: gate the toast + DB write on the real outcome, not an unconditional write.
      const ok = await subscribeToPush();
      if (ok) await setNotificationsEnabled(true);
      showToast(ok ? t('menu.toast.notificationsEnabled') : t('menu.toast.notificationsNotEnabled'));
      renderHome();
      break;
    }

    case 'mark-done': {
      const _doneTask = getTask(plantId, taskId);
      const _doneName = getTaskConfig(_doneTask)?.name ?? _doneTask?.name ?? 'Task';
      const _isOnboardingDone = getOnboardingStep() === 3 && taskId === getOnboardingTaskId();
      markTaskDone(plantId, taskId);
      if (_isOnboardingDone) {
        setOnboardingStep(4);
        localStorage.setItem(`onboarding_coordination_shown_${currentMemberId}`, '1');
        // #329: no celebration overlay — write the coach-mark trigger flag and
        // render home directly. renderHome's existing read-and-delete trigger
        // (:2291) picks it up and fires the activity-feed coach-mark.
        localStorage.setItem(`onboarding_show_coachmark_${currentMemberId}`, 'true');
        navigateTo('home');
      } else {
        renderPlantDetail(state.plantId);
        showDoneToast(plantId, taskId, _doneName);
      }
      break;
    }

    case 'toast-add-note': {
      const pid = target.dataset.plant;
      const tid = target.dataset.task;
      const _toastEl = document.getElementById('toast');
      _toastEl?.classList.remove('visible', 'toast--interactive');
      const _appEl2 = document.getElementById('app');
      _appEl2.style.pointerEvents = 'none';
      setTimeout(() => { _appEl2.style.pointerEvents = ''; }, 350);
      if (pid && tid) renderPostTaskNoteSheet(pid, tid);
      break;
    }

    case 'mark-done-with-note':
      markTaskDone(plantId, taskId);
      renderPostTaskNoteSheet(plantId, taskId);
      break;

    case 'undo-mark-done':
      undoMarkTaskDone(plantId, taskId);
      renderPlantDetail(state.plantId);
      break;

    case 'tasks-mark-done': {
      const _tasksRow = target.closest('.task-row');
      const _tasksList = _tasksRow?.parentElement;
      if (!_tasksRow || !_tasksList || _tasksRow.dataset.sliding === '1') break;
      const _rowRect  = _tasksRow.getBoundingClientRect();
      const _listRect = _tasksList.getBoundingClientRect();
      const _dy = Math.max(0, _listRect.bottom - _rowRect.bottom);
      _tasksRow.dataset.sliding = '1';
      _tasksRow.style.pointerEvents = 'none';
      _tasksRow.style.transition = 'transform 300ms ease, opacity 300ms ease';
      target.classList.add('done');
      requestAnimationFrame(() => {
        _tasksRow.style.transform = `translateY(${_dy}px)`;
        _tasksRow.style.opacity = '0';
      });
      setTimeout(() => {
        markTaskDone(plantId, taskId);
        renderPlantDetail(state.plantId);
      }, 300);
      break;
    }

    case 'tasks-undo-done':
      undoMarkTaskDone(plantId, taskId);
      renderPlantDetail(state.plantId);
      break;

    case 'home-mark-done': {
      const _homeRow = target.closest('.attention-row, .upcoming-row');
      if (!_homeRow || _homeRow.classList.contains('marking-done')) break;
      const _homeTask = getTask(plantId, taskId);
      const _homeName = getTaskConfig(_homeTask)?.name ?? _homeTask?.name ?? 'Task';
      const _homePlantName = getPlant(plantId)?.name ?? '';
      target.classList.add('done');
      _homeRow.style.height = _homeRow.offsetHeight + 'px';
      _homeRow.style.overflow = 'hidden';
      requestAnimationFrame(() => { _homeRow.classList.add('marking-done'); });
      setTimeout(() => {
        markTaskDone(plantId, taskId);
        showUndoDoneToast(plantId, taskId, _homeName, _homePlantName);
      }, 280);
      break;
    }

    case 'summary-mark-done': {
      const _sumRow = target.closest('.attention-row');
      if (!_sumRow || _sumRow.classList.contains('marking-done')) break;
      const _sumTask = getTask(plantId, taskId);
      const _sumName = getTaskConfig(_sumTask)?.name ?? _sumTask?.name ?? 'Task';
      target.classList.add('done');
      _sumRow.style.height = _sumRow.offsetHeight + 'px';
      _sumRow.style.overflow = 'hidden';
      requestAnimationFrame(() => { _sumRow.classList.add('marking-done'); });
      setTimeout(() => {
        markTaskDone(plantId, taskId);
        showDoneToast(plantId, taskId, _sumName);
        renderPlantDetail(state.plantId);
      }, 320);
      break;
    }

    case 'caring-undo-done': {
      const _undoPid = target.dataset.plant;
      const _undoTid = target.dataset.task;
      const _undoToastEl = document.getElementById('toast');
      _undoToastEl?.classList.remove('visible', 'toast--interactive');
      clearTimeout(_undoToastEl?._hideTimeout);
      if (_undoPid && _undoTid) {
        undoMarkTaskDone(_undoPid, _undoTid);
        renderApp();
      }
      break;
    }

    case 'schedule-mark-done': {
      const _schedTask = getTask(plantId, taskId);
      const _schedName = getTaskConfig(_schedTask)?.name ?? _schedTask?.name ?? 'Task';
      markTaskDone(plantId, taskId);
      renderHome();
      showDoneToast(plantId, taskId, _schedName);
      break;
    }

    case 'caring-overdue-row-tap':
      openOverdueActionSheet(plantId, taskId);
      break;

    case 'caring-action-mark-done': {
      const _caTask = getTask(plantId, taskId);
      const _caName = getTaskConfig(_caTask)?.name ?? _caTask?.name ?? 'Task';
      const _caPlantName = getPlant(plantId)?.name ?? '';
      closeSheet();
      markTaskDone(plantId, taskId);
      renderApp();
      showUndoDoneToast(plantId, taskId, _caName, _caPlantName);
      break;
    }

    case 'caring-skip-task': {
      closeSheet();
      await skipTask(plantId, taskId);
      renderApp();
      break;
    }

    case 'reschedule-close':
    case 'reschedule-keep-original': {
      const direction = target.dataset.direction ?? null;
      const daysOffset = Number(target.dataset.days ?? 0);
      const recurrenceType = getTask(plantId, taskId)?.recurrenceType ?? 'interval';
      closeReschedulePrompt();
      if (action === 'reschedule-keep-original') {
        posthog.capture('schedule_adjusted', {
          choice: 'original',
          direction,
          days_offset: daysOffset,
          recurrence_type: recurrenceType,
        });
      }
      break;
    }

    case 'reschedule-modify': {
      const overlay = document.getElementById('reschedule-overlay');
      const newOverride = overlay?.dataset.modifiedFirstDate || null;
      const shiftedWeekdaysRaw = overlay?.dataset.modifiedWeekdays;
      const modifiedMonth = overlay?.dataset.modifiedMonth;
      const modifiedDay   = overlay?.dataset.modifiedDay;
      const direction = target.dataset.direction ?? null;
      const daysOffset = Number(target.dataset.days ?? 0);
      const task = getTask(plantId, taskId);
      const recurrenceType = task?.recurrenceType ?? 'interval';
      if (task && recurrenceType === 'yearly' && modifiedMonth && modifiedDay) {
        // Yearly shift is a PERMANENT anchor change (mirrors weekday's `weekdays`
        // write) — writing next_due_override would self-revert on the next
        // completion (markTaskDone clears it, then computeNextDue falls back to
        // the old month/day). No override needed: the new anchor's this-year
        // occurrence is the completion date, already done, so next due rolls to
        // next year's new anchor via #401-8.
        await updateTask(plantId, taskId, {
          recurrenceMonth: Number(modifiedMonth),
          recurrenceDay:   Number(modifiedDay),
        });
      } else if (task && newOverride) {
        const updates = { nextDueOverride: newOverride };
        if (recurrenceType === 'weekdays' && shiftedWeekdaysRaw) {
          try { updates.weekdays = JSON.parse(shiftedWeekdaysRaw); } catch {}
        }
        await updateTask(plantId, taskId, updates);
      }
      closeReschedulePrompt();
      posthog.capture('schedule_adjusted', {
        choice: 'modified',
        direction,
        days_offset: daysOffset,
        recurrence_type: recurrenceType,
      });
      renderApp();
      break;
    }

    case 'schedule-mark-done-with-note':
      markTaskDone(plantId, taskId);
      renderPostTaskNoteSheet(plantId, taskId);
      break;

    case 'schedule-undo-mark-done':
      undoMarkTaskDone(plantId, taskId);
      renderHome();
      break;

    case 'user-filter-toggle': {
      const user = target.dataset.user;
      activeFilter = activeFilter.includes(user)
        ? activeFilter.filter(u => u !== user)
        : [...activeFilter, user];
      renderApp();
      refreshHouseholdActivity();
      break;
    }

    case 'carelog-toggle-filters':
      careLogFiltersOpen = !careLogFiltersOpen;
      renderPlantDetail(state.plantId);
      break;

    case 'carelog-mode':
      careLogMode = target.dataset.mode;
      renderPlantDetail(state.plantId);
      break;

    case 'reassign-task':
      reassignTask(plantId, taskId);
      renderPlantDetail(state.plantId);
      break;

    case 'pause-task':
      pauseTask(plantId, taskId);
      closeSheet();
      renderPlantDetail(state.plantId);
      break;

    case 'resume-task':
      resumeTask(plantId, taskId);
      closeSheet();
      renderPlantDetail(state.plantId);
      break;

    case 'delete-plant': {
      const plantToDelete = getPlant(plantId);
      if (!plantToDelete) break;
      const deletedName = plantToDelete.name;
      await deletePlant(plantId);
      closeSheet();
      navigateTo('home');
      showToast(`🗑️ ${t('menu.toast.plantDeleted', { name: deletedName })}`);
      break;
    }

    case 'delete-task':
      if (confirm(t('dialog.confirmDeleteTask'))) {
        deleteTask(plantId, taskId);
        closeSheet();
        renderPlantDetail(state.plantId);
        showToast(t('menu.toast.taskDeleted'));
      }
      break;

    case 'caring-open-edit-task':
      openedFromCaring = true;
      renderEditTaskSheet(plantId, taskId);
      break;

    case 'carelog-open-edit-task':
      if (!taskId) break;
      openedFromCareLog = true;
      renderEditTaskSheet(plantId, taskId);
      break;

    case 'carelog-open-edit-note': {
      const noteId2 = target.dataset.note;
      if (!noteId2) break;
      const activeMemberId2 = membersCache.find(m => m.display_name === activeUser)?.id;
      const noteToOpen = notes.find(n => n.id === noteId2);
      if (!noteToOpen || noteToOpen.memberId !== activeMemberId2) break;
      renderEditNoteSheet(target.dataset.plant, noteId2);
      break;
    }

    case 'edit-task':
      renderEditTaskSheet(plantId, taskId);
      break;

    case 'edit-plant':
    case 'open-edit-plant':
      renderEditPlantSheet(plantId);
      break;

    case 'edit-plant-change-icon': {
      const nameInput = document.getElementById('sheet-plant-name');
      if (nameInput) state.sheetData.editPlantName = nameInput.value;

      state.sheetData.subSheetSnapshot = {
        selectedEmoji: state.sheetData.selectedEmoji,
        pendingPlantPhoto: state.sheetData.pendingPlantPhoto,
        activeTab: state.sheetData.activeTab,
      };

      if (state.sheetData.editIconMode === 'photo') {
        state.sheetData.pendingPlantPhoto = null;
        state.sheetData.selectedEmoji = null;
      }

      state.sheetData.step = 1;
      openSheet(renderAddPlantStep1Html(
        state.sheetData.activeTab || 'all',
        state.sheetData.selectedEmoji,
        state.sheetData.pendingPlantPhoto
      ));
      break;
    }

    case 'edit-plant-change-cancel': {
      const snap = state.sheetData.subSheetSnapshot;
      if (snap) {
        const cur = state.sheetData.pendingPlantPhoto;
        if (cur && cur !== snap.pendingPlantPhoto && cur.blob && cur.previewUrl) {
          URL.revokeObjectURL(cur.previewUrl);
        }
        state.sheetData.selectedEmoji = snap.selectedEmoji;
        state.sheetData.pendingPlantPhoto = snap.pendingPlantPhoto;
        state.sheetData.activeTab = snap.activeTab;
        state.sheetData.subSheetSnapshot = null;
      }
      state.sheetData.step = 2;
      const editPlant = getPlant(state.sheetData.plantId);
      openSheet(renderEditPlantStep2Html(editPlant));
      attachArrivalDateListener(t('editPlant.setDate'));
      break;
    }

    case 'edit-plant-cancel':
      if (state.sheetData?.pendingPlantPhoto?.blob && state.sheetData.pendingPlantPhoto.previewUrl) {
        URL.revokeObjectURL(state.sheetData.pendingPlantPhoto.previewUrl);
      }
      closeSheet();
      break;

    case 'edit-plant-show-delete': {
      document.getElementById('edit-plant-delete-btn').style.display = 'none';
      document.getElementById('edit-plant-delete-confirm').style.display = '';
      const lockStyle = 'pointer-events:none;opacity:0.4;';
      const iconRow = document.getElementById('edit-plant-icon-row');
      if (iconRow) iconRow.style.cssText = lockStyle;
      document.getElementById('edit-plant-fields').style.cssText = lockStyle;
      document.getElementById('edit-plant-arrival-pill').style.cssText = lockStyle;
      document.getElementById('edit-plant-save-row').style.cssText = `${lockStyle}margin-top:14px;display:flex;gap:8px;`;
      break;
    }

    case 'edit-plant-hide-delete': {
      document.getElementById('edit-plant-delete-btn').style.display = '';
      document.getElementById('edit-plant-delete-confirm').style.display = 'none';
      const iconRow = document.getElementById('edit-plant-icon-row');
      if (iconRow) iconRow.style.cssText = 'display:flex;align-items:center;gap:12px;margin-top:4px;padding-bottom:14px;';
      document.getElementById('edit-plant-fields').style.cssText = '';
      document.getElementById('edit-plant-arrival-pill').style.cssText = '';
      document.getElementById('edit-plant-save-row').style.cssText = 'margin-top:14px;display:flex;gap:8px;';
      break;
    }

    case 'add-note':
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddNoteSheet(plantId);
      break;

    case 'summary-fab-toggle': {
      document.getElementById('summary-fab')?.classList.toggle('expanded');
      break;
    }

    case 'summary-fab-collapse': {
      document.getElementById('summary-fab')?.classList.remove('expanded');
      break;
    }

    case 'summary-fab-add-note': {
      document.getElementById('summary-fab')?.classList.remove('expanded');
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddNoteSheet(plantId);
      break;
    }

    case 'summary-fab-add-task': {
      document.getElementById('summary-fab')?.classList.remove('expanded');
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddTaskStep1(plantId);
      break;
    }

    case 'close-sheet':
      closeSheet();
      break;

    case 'summary-carelog-add-note':
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddNoteSheet(plantId);
      break;

    case 'summary-carelog-undo': {
      if (plantId && taskId) {
        undoMarkTaskDone(plantId, taskId);
        renderPlantDetail(state.plantId);
      }
      break;
    }

    case 'delete-note': {
      const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
      const noteToDelete = notes.find(n => n.id === noteId);
      if (!noteToDelete || noteToDelete.memberId !== activeMemberId) break;
      if (confirm(t('dialog.confirmDeleteNote'))) {
        await deleteNote(noteId);
        renderPlantDetail(state.plantId);
      }
      break;
    }

    case 'edit-note': {
      const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
      const noteToEdit = notes.find(n => n.id === noteId);
      if (!noteToEdit || noteToEdit.memberId !== activeMemberId) break;
      renderEditNoteSheet(plantId ?? noteToEdit.plantId, noteId);
      break;
    }

    case 'sheet-save-edit-note': {
      const _nid = target.dataset.note;
      const textarea = document.getElementById('sheet-edit-note-text');
      const newText = textarea?.value?.trim();
      if (!newText) { alert(t('dialog.alertNoteEmpty')); return; }
      await updateNote(_nid, newText);
      await loadActivityFeed();
      const _restoreTab = sheetEntryTab;
      sheetEntryTab = null;
      closeSheet();
      if (_restoreTab && state.view === 'plant') plantDetailTab = _restoreTab;
      renderPlantDetail(state.plantId);
      break;
    }

    case 'sheet-delete-note': {
      const _nid = target.dataset.note;
      const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
      const noteToDelete = notes.find(n => n.id === _nid);
      if (!noteToDelete || noteToDelete.memberId !== activeMemberId) break;
      if (!confirm(t('dialog.confirmDeleteNote'))) break;
      await deleteNote(_nid);
      await loadActivityFeed();
      const _restoreTab = sheetEntryTab;
      sheetEntryTab = null;
      closeSheet();
      if (_restoreTab && state.view === 'plant') plantDetailTab = _restoreTab;
      renderPlantDetail(state.plantId);
      break;
    }

    case 'edit-note-pick-photo': {
      const input = document.getElementById('edit-note-file-input');
      if (input) { input.value = ''; input.click(); }
      break;
    }

    case 'edit-note-delete-photo': {
      const _nid = state.sheetData?.noteId;
      if (!_nid) break;
      const _note = notes.find(n => n.id === _nid);
      if (!_note?.photoUrl) break;
      if (!confirm(t('dialog.confirmDeletePhoto'))) break;
      let _meta = state.sheetData?.editNotePhotoMeta;
      if (!_meta?.id) _meta = await fetchPhotoForNote(_nid);
      if (!_meta?.id) { showToast(t('menu.toast.couldNotFindPhoto')); break; }
      await deletePlantPhoto({ id: _meta.id, storage_url: _meta.storage_url, note_id: _nid });
      if (state.sheetData) state.sheetData.editNotePhotoMeta = null;
      await refreshEditNotePhotoSection();
      break;
    }

    case 'toggle-notes-show-all':
      if (notesShowAll.has(plantId)) {
        notesShowAll.delete(plantId);
      } else {
        notesShowAll.add(plantId);
      }
      renderPlantDetail(state.plantId);
      break;

    case 'add-plant':
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddPlantSheet();
      break;

    case 'add-plant-tab': {
      const tab = target.dataset.tab;
      state.sheetData.activeTab = tab;
      const tabEmojis = tab === 'all' ? PLANT_EMOJIS : (EMOJI_CATEGORIES[tab] ?? PLANT_EMOJIS);
      const grid = document.getElementById('add-plant-emoji-grid');
      if (grid) {
        grid.innerHTML = renderAddPlantEmojiItems(tabEmojis, state.sheetData.selectedEmoji);
      }
      document.querySelectorAll('#sheet .emoji-cat-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
      });
      break;
    }

    case 'add-plant-next': {
      state.sheetData.step = 2;
      if (state.sheetMode === 'edit-plant') {
        const newIconMode = state.sheetData.pendingPlantPhoto ? 'photo' : 'emoji';
        if (newIconMode === 'emoji' && !state.sheetData.selectedEmoji) {
          state.sheetData.selectedEmoji = state.sheetData.subSheetSnapshot?.selectedEmoji || '🪴';
        }
        state.sheetData.editIconMode = newIconMode;
        state.sheetData.subSheetSnapshot = null;
        const editPlant = getPlant(state.sheetData.plantId);
        openSheet(renderEditPlantStep2Html(editPlant));
        attachArrivalDateListener(t('editPlant.setDate'));
      } else {
        const emoji = state.sheetData.selectedEmoji || '🪴';
        state.sheetData.selectedEmoji = emoji;
        openSheet(renderAddPlantStep2Html(emoji));
        attachAddPlantNameListener();
        const savedName = state.sheetData.plantName;
        if (savedName) {
          const nameInput = document.getElementById('sheet-plant-name');
          if (nameInput) nameInput.value = savedName;
        }
        attachAddPlantStep2State();
        setTimeout(() => document.getElementById('sheet-plant-name')?.focus(), 80);
      }
      break;
    }

    case 'add-plant-to-step3': {
      const name = document.getElementById('sheet-plant-name')?.value?.trim();
      if (!name) return;
      state.sheetData.plantName = name;
      state.sheetData.step = 3;
      openSheet(renderAddPlantStep3Html(state.sheetData.selectedEmoji || '🪴', state.sheetData.plantName));
      attachArrivalSelectListeners();
      break;
    }

    case 'add-plant-back': {
      const curStep = state.sheetData.step ?? 1;
      if (curStep === 3) {
        state.sheetData.step = 2;
        openSheet(renderAddPlantStep2Html(state.sheetData.selectedEmoji || '🪴'));
        attachAddPlantNameListener();
        const savedName = state.sheetData.plantName;
        if (savedName) {
          const nameInput = document.getElementById('sheet-plant-name');
          if (nameInput) nameInput.value = savedName;
        }
        attachAddPlantStep2State();
      } else {
        state.sheetData.step = 1;
        openSheet(renderAddPlantStep1Html(state.sheetData.activeTab || 'all', state.sheetData.selectedEmoji || '🪴', state.sheetData.pendingPlantPhoto));
      }
      break;
    }

    case 'add-plant-change-emoji':
      state.sheetData.step = 1;
      openSheet(renderAddPlantStep1Html(state.sheetData.activeTab || 'all', state.sheetData.selectedEmoji || '🪴', state.sheetData.pendingPlantPhoto));
      break;

    case 'add-plant-pick-photo': {
      const input = document.getElementById('add-plant-file-input');
      if (input) { input.value = ''; input.click(); }
      break;
    }

    case 'add-plant-remove-photo':
      clearPendingPlantPhoto();
      openSheet(renderAddPlantStep1Html(
        state.sheetData.activeTab || 'all',
        state.sheetData.selectedEmoji || '🪴',
        null
      ));
      break;

    case 'add-task':
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddTaskStep1(plantId);
      break;

    case 'add-task-select-type': {
      const typeKey = target.dataset.typeKey;
      const pid = target.dataset.plant;
      renderAddTaskStep2(pid, typeKey);
      break;
    }

    case 'add-task-back': {
      const pid = target.dataset.plant;
      renderAddTaskStep1(pid);
      break;
    }

    case 'add-task-pick-icon':
      document.querySelectorAll('#sheet .icon-option').forEach(o => o.classList.remove('selected'));
      target.classList.add('selected');
      break;

    case 'edit-task-toggle-icon-picker': {
      const picker = document.getElementById('edit-task-icon-picker');
      if (picker) picker.style.display = picker.style.display === 'none' ? '' : 'none';
      break;
    }

    case 'edit-task-pick-icon': {
      const icon = target.dataset.icon;
      const tile = document.querySelector('#sheet .edit-task-icon-tile');
      if (tile && icon) { tile.textContent = icon; tile.dataset.emoji = icon; }
      document.querySelectorAll('#sheet #edit-task-icon-picker .icon-option').forEach(o => o.classList.remove('selected'));
      target.classList.add('selected');
      const picker = document.getElementById('edit-task-icon-picker');
      if (picker) picker.style.display = 'none';
      break;
    }

    case 'pick-plant-emoji':
      document.querySelectorAll('#sheet .emoji-option').forEach(o => o.classList.remove('selected'));
      target.classList.add('selected');
      if (state.sheetMode === 'add-plant' || state.sheetMode === 'edit-plant') state.sheetData.selectedEmoji = target.dataset.emoji;
      break;

    case 'sheet-save-new-plant':
      handleSaveNewPlant();
      break;

    case 'sheet-save-new-task':
      handleSaveNewTask();
      break;

    case 'sheet-cancel':
      if (openedFromCaring) {
        openedFromCaring = false;
        sheetEntryTab = null;
        closeSheet();
        activeTab = 'schedule';
        renderHome();
      } else if (openedFromCareLog) {
        openedFromCareLog = false;
        sheetEntryTab = null;
        closeSheet();
        plantDetailTab = 'carelog';
        renderPlantDetail(state.plantId);
      } else {
        if (sheetEntryTab && state.view === 'plant') {
          plantDetailTab = sheetEntryTab;
          closeSheet();
          renderPlantDetail(state.plantId);
        } else {
          closeSheet();
        }
        sheetEntryTab = null;
      }
      break;

    case 'sheet-set-owner':
      document.querySelectorAll('#sheet .owner-option, #sheet .owner-pill').forEach(btn => btn.classList.remove('selected'));
      target.classList.add('selected');
      break;

    case 'sheet-toggle-recurrence': {
      const rtype = target.dataset.rtype;
      const container = document.getElementById('recurrence-container');
      if (container) container.className = `recurrence-${rtype}`;
      document.querySelectorAll('#sheet .recurrence-option').forEach(o => o.classList.remove('selected'));
      target.classList.add('selected');
      syncYearlyRecurrenceUI();
      updateTaskDueLabel();
      updateRecurrenceSummary();
      break;
    }

    case 'toggle-repeating-task': {
      const toggleBtn = document.getElementById('repeating-toggle');
      if (!toggleBtn) break;
      const isOn      = toggleBtn.getAttribute('aria-checked') === 'true';
      const willTurnOn = !isOn;

      // Edit Task: confirm before stripping recurrence from an existing recurring task
      if (!willTurnOn && state.sheetMode === 'edit-task') {
        const { plantId: _pid, taskId: _tid } = state.sheetData;
        const _existTask = getTask(_pid, _tid);
        if ((_existTask?.recurrenceType ?? 'interval') !== 'one-off') {
          if (!confirm(t('dialog.confirmRemoveRecurrence'))) break;
        }
      }

      toggleBtn.setAttribute('aria-checked', String(willTurnOn));
      toggleBtn.classList.toggle('on', willTurnOn);

      const toggleRow = document.getElementById('repeating-toggle-row');
      const block     = document.getElementById('task-recurrence-block');
      const container = document.getElementById('recurrence-container');
      const pauseRow  = document.getElementById('pause-toggle-row');

      if (willTurnOn) {
        toggleRow?.classList.add('task-toggle-row--expanded');
        if (block)     block.style.display = '';
        if (container) {
          container.className = 'recurrence-interval';
          document.querySelectorAll('#sheet .recurrence-option').forEach(o => {
            o.classList.toggle('selected', o.dataset.rtype === 'interval');
          });
        }
        if (pauseRow) pauseRow.style.display = '';
      } else {
        toggleRow?.classList.remove('task-toggle-row--expanded');
        if (block)     block.style.display = 'none';
        if (container) container.className = 'recurrence-one-off';
        if (pauseRow)  pauseRow.style.display = 'none';
      }
      relocateTaskDueField(willTurnOn);
      updateRecurrenceSummary();
      break;
    }

    case 'toggle-task-pause': {
      const btn = document.getElementById('pause-toggle');
      if (!btn) break;
      const isOn = btn.getAttribute('aria-checked') === 'true';
      btn.setAttribute('aria-checked', String(!isOn));
      btn.classList.toggle('on', !isOn);
      break;
    }

    case 'sheet-toggle-weekday':
      target.classList.toggle('selected');
      updateRecurrenceSummary();
      break;

    case 'sheet-save-task': {
      const { plantId: pid, taskId: tid } = state.sheetData;

      const container = document.getElementById('recurrence-container');
      const recType = container?.classList.contains('recurrence-weekdays') ? 'weekdays'
                    : container?.classList.contains('recurrence-yearly')   ? 'yearly'
                    : container?.classList.contains('recurrence-one-off')  ? 'one-off'
                    : 'interval';

      let frequencyDays = getTask(pid, tid)?.frequencyDays ?? 1;
      let weekdays = [];
      let yearlyMonth = getTask(pid, tid)?.recurrenceMonth ?? null;
      let yearlyDay   = getTask(pid, tid)?.recurrenceDay ?? null;

      if (recType === 'interval') {
        const freq = parseInt(document.getElementById('sheet-frequency')?.value ?? '');
        if (!freq || freq < 1) { alert(t('dialog.alertFrequencyInvalid')); return; }
        frequencyDays = freq;
      } else if (recType === 'weekdays') {
        weekdays = [...document.querySelectorAll('#sheet .weekday-btn.selected')].map(b => parseInt(b.dataset.day));
        if (weekdays.length === 0) { alert(t('dialog.alertWeekdayRequired')); return; }
      } else if (recType === 'yearly') {
        yearlyMonth = parseInt(document.getElementById('yearly-month')?.value ?? '');
        yearlyDay   = parseInt(document.getElementById('yearly-day')?.value ?? '');
        if (!yearlyMonth || !yearlyDay) { alert(t('dialog.alertMonthDayRequired')); return; }
      }

      const selectedOwner = document.querySelector('#sheet .owner-pill.selected, #sheet .owner-option.selected');
      const lastDoneEl  = document.getElementById('sheet-last-done');
      const overrideVal = getSelectDate('task-override');

      const taskUpdates = {
        recurrenceType: recType,
        frequencyDays,
        weekdays,
        recurrenceMonth: yearlyMonth,
        recurrenceDay: yearlyDay,
        owner: selectedOwner?.dataset.owner ?? 'Matu',
        // Yearly is anchored by month/day; clear any first-due override.
        nextDueOverride: recType === 'yearly' ? null : (overrideVal || null),
      };
      if (lastDoneEl) taskUpdates.lastDone = lastDoneEl.value || null;
      const pauseToggleEl = document.getElementById('pause-toggle');
      if (pauseToggleEl) taskUpdates.paused = pauseToggleEl.getAttribute('aria-checked') === 'true';

      if (!TASK_CONFIG[tid]) {
        const nameVal = document.getElementById('sheet-task-name')?.value?.trim();
        if (nameVal) taskUpdates.name = nameVal;
        const iconVal = document.querySelector('#sheet .edit-task-icon-tile')?.dataset.emoji;
        if (iconVal) taskUpdates.icon = iconVal;
      }

      updateTask(pid, tid, taskUpdates);
      closeSheet();
      if (openedFromCaring) {
        openedFromCaring = false;
        sheetEntryTab = null;
        activeTab = 'schedule';
        renderHome();
      } else if (openedFromCareLog) {
        openedFromCareLog = false;
        sheetEntryTab = null;
        plantDetailTab = 'carelog';
        renderPlantDetail(pid);
      } else {
        if (sheetEntryTab) plantDetailTab = sheetEntryTab;
        sheetEntryTab = null;
        renderPlantDetail(pid);
      }
      showToast(t('menu.toast.taskSaved'));
      break;
    }

    case 'add-note-pick-photo': {
      console.log('[pickPhoto] tapped', { sheetMode: state.sheetMode, sheetData: state.sheetData });
      const textEl = document.getElementById('sheet-note-text');
      if (textEl) state.sheetData.pendingText = textEl.value;
      const input = document.getElementById('add-note-file-input');
      console.log('[pickPhoto] input element', { found: !!input, prevValue: input?.value, prevFiles: input?.files?.length });
      if (input) { input.value = ''; input.click(); }
      break;
    }

    case 'add-note-remove-photo':
      clearPendingPhoto();
      refreshAddNotePhotoArea();
      break;

    case 'add-note-view-photo': {
      const _noteId = target.dataset.noteId;
      openPhotoFullscreen(target.dataset.url, _noteId, target.dataset.plantId);
      if (_noteId && currentMemberId) {
        const _key = `seen_photos_${currentMemberId}`;
        const _seen = JSON.parse(localStorage.getItem(_key) ?? '[]');
        if (!_seen.includes(_noteId)) {
          _seen.push(_noteId);
          localStorage.setItem(_key, JSON.stringify(_seen));
        }
        const _dot = target.closest('.activity-home-thumb-slot--photo')?.querySelector('.activity-thumb-dot');
        if (_dot) _dot.remove();
      }
      break;
    }

    case 'open-slideshow': {
      const pid = target.dataset.plant;
      openSlideshow(pid, null);
      break;
    }

    case 'photo-cap-delete-oldest': {
      const pid = target.dataset.plant;
      await deleteOldestPlantPhoto(pid);
      // Resume the save flow with the original plantId + preserved sheetData
      renderAddNoteSheet(pid);
      // Auto-trigger save since the user already committed
      await runSaveNoteFlow(pid);
      break;
    }

    case 'photo-cap-manage': {
      await renderManagePhotosSheet(target.dataset.plant);
      break;
    }

    case 'photo-cap-back': {
      const pid = state.sheetData?.plantId;
      if (pid) renderAddNoteSheet(pid);
      break;
    }

    case 'manage-photos-delete': {
      const photoId = target.dataset.photoId;
      const pid     = target.dataset.plant;
      const noteId  = target.dataset.noteId || null;
      const url     = target.dataset.url || null;
      await deletePlantPhoto({ id: photoId, storage_url: url, note_id: noteId });
      await renderManagePhotosSheet(pid);
      break;
    }

    case 'sheet-save-note': {
      const { plantId: pid } = state.sheetData;
      await runSaveNoteFlow(pid);
      break;
    }

    case 'sheet-save-post-task-note': {
      const { plantId: pid, taskId: tid } = state.sheetData;
      const text = document.getElementById('post-task-note-text')?.value?.trim();
      closeSheet();
      if (text) await addNote(pid, text, tid);
      if (state.view === 'plant') renderPlantDetail(pid);
      else renderHome();
      break;
    }

    case 'sheet-skip-post-task-note':
      closeSheet();
      break;

    case 'plant-detail-tab':
      plantDetailTab = target.dataset.tab;
      renderPlantDetail(state.plantId);
      posthog.capture('tab_viewed', { tab: plantDetailTab === 'carelog' ? 'care_log' : plantDetailTab });
      break;

    case 'carelog-segment':
      careLogSegment = target.dataset.segment;
      renderPlantDetail(state.plantId);
      break;

    case 'sheet-save-plant':
      handleSavePlant();
      break;

    // DEV TOOLS — remove before public launch
    case 'dev-seed-empty':     showDevToolsConfirm('empty',     'Empty state');  break;
    case 'dev-seed-heavy-v4':  showDevToolsConfirm('heavy-v4',  'Heavy v4');     break;
    case 'dev-seed-reminders-test': showDevToolsConfirm('reminders-test', 'Reminders Test'); break;
    case 'dev-full-onboarding-reset': showOnboardingResetConfirm(); break;
    case 'dev-tools-cancel': document.getElementById('dev-tools-body').innerHTML = `
      <button class="dev-tools-btn" data-action="dev-seed-empty">🌱 Empty state</button>
      <button class="dev-tools-btn" data-action="dev-seed-heavy-v4">🌲 Heavy v4</button>
      <button class="dev-tools-btn" data-action="dev-seed-reminders-test">🔔 Reminders Test</button>
      <div style="height:1px;background:#eee;margin:10px 0;"></div>
      <button class="dev-tools-btn" data-action="dev-full-onboarding-reset">♻️ Full Onboarding Reset (this member)</button>`; break;
    case 'dev-copy-debug-info': {
      // #402e: read-only diagnostic — assemble the onboarding-flag values for
      // currentMemberId plus every onboarding/session6/push key, copy to clipboard.
      // Writes nothing; does not close the panel.
      const mid = currentMemberId;
      const fmt = k => `${k}: ${localStorage.getItem(k) ?? 'null'}`;
      const allKeys = Object.keys(localStorage).filter(k => /onboarding_|session6_|push_/.test(k));
      const keyList = allKeys.length
        ? allKeys.map(k => `${k}: ${localStorage.getItem(k)}`).join('\n')
        : 'none found';
      const builtTs = document.getElementById('dev-build-ts')?.textContent ?? 'unknown';
      const debugString =
`=== Plant Care Debug ===
currentMemberId: ${mid}
${fmt(`onboarding_coordination_shown_${mid}`)}
${fmt(`onboarding_session6_done_${mid}`)}
${fmt(`onboarding_step_${mid}`)}

All onboarding/session6/push keys:
${keyList}

${builtTs}`;
      const _origLabel = target.textContent;
      const _flashCopied = () => {
        target.textContent = '✓ Copied';
        setTimeout(() => { target.textContent = _origLabel; }, 2000);
      };
      try {
        await navigator.clipboard.writeText(debugString);
        _flashCopied();
      } catch (_) {
        // iOS PWA clipboard can be restricted — fall back to a copyable prompt.
        prompt('Copy this:', debugString);
      }
      break;
    }

    case 'dev-tools-confirm': {
      if (target.disabled) break;
      target.disabled = true;
      const _origLabel = target.textContent;
      target.textContent = 'Running…';
      const _ok = await runDevSeed(target.dataset.scenario);
      if (!_ok) {
        target.disabled = false;
        target.textContent = _origLabel;
      }
      break;
    }

    case 'dev-onboarding-reset-confirm': {
      if (target.disabled) break;
      target.disabled = true;
      const _origLabel = target.textContent;
      target.textContent = 'Running…';
      const _ok = await runOnboardingReset();
      if (!_ok) {
        target.disabled = false;
        target.textContent = _origLabel;
      }
      break;
    }
  }
  } catch (err) {
    console.error('handleEvent error:', err);
  }
}

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('[SW] registration failed:', err);
  }

  // #370: when a push notification is tapped, the SW focuses this window and
  // posts 'notification-tapped'. Refresh the activity feed so the new entry
  // shows without the user closing and reopening the PWA.
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'notification-tapped') {
      loadActivityFeed().then(() => renderApp());
    }
  });
}

// #341: returns true ONLY on genuine success (permission granted + subscribe +
// upsert ok); false on every other path (no SW/PushManager, denied, no member,
// upsert error, throw). Callers gate the success toast + DB write on this.
async function subscribeToPush() {
  if (!swRegistration || !('PushManager' in window)) return false;

  let permission = Notification.permission;
  if (permission === 'default') permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  try {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    if (membersCache.length === 0) await loadFromSupabase();
    const member = membersCache.find(m => m.display_name === activeUser);
    if (!member) return false;

    const { error } = await supabaseClient
      .from('push_subscriptions')
      .upsert(
        { household_member_id: member.id, subscription: subscription.toJSON() },
        { onConflict: 'household_member_id' }
      );
    if (error) { console.error('[Push] upsert error:', error); return false; }
    return true;
  } catch (err) {
    console.error('[Push] subscription failed:', err);
    return false;
  }
}

// #332: persist the notification preference on the current member's
// household_members row and mirror it into the cache so the menu label
// (driven by notifications_enabled) reflects it immediately.
async function setNotificationsEnabled(enabled) {
  if (!currentMemberId) return;
  const m = membersCache.find(mm => mm.id === currentMemberId);
  if (m) m.notifications_enabled = enabled;
  const { error } = await supabaseClient
    .from('household_members')
    .update({ notifications_enabled: enabled })
    .eq('id', currentMemberId);
  if (error) console.error('notifications_enabled save failed:', error);
}

// #403: stamp first onboarding completion on the current member's
// household_members row and mirror it into the cache. Set-only-if-null semantics
// (cache short-circuit + DB-level `.is(null)` guard) so the timestamp records the
// first completion and isn't overwritten on repeat dismisses or a second device.
async function markOnboardingCompleteIfNeeded() {
  if (!currentMemberId) return;
  const m = membersCache.find(mm => mm.id === currentMemberId);
  if (m?.onboarding_completed_at) return;
  const nowIso = new Date().toISOString();
  if (m) m.onboarding_completed_at = nowIso;
  const { error } = await supabaseClient
    .from('household_members')
    .update({ onboarding_completed_at: nowIso })
    .eq('id', currentMemberId)
    .is('onboarding_completed_at', null);
  if (error) console.error('onboarding_completed_at save failed:', error);
}

// ============================================================
// THREE-SELECT DATE PICKERS
// ============================================================

const SEL_MONTH_NAMES = MONTH_NAMES; // shared source (Brief #44a)

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month is 1-indexed
}

function attachDowLabel(prefix) {
  const dayEl   = document.getElementById(`${prefix}-day`);
  const monthEl = document.getElementById(`${prefix}-month`);
  const yearEl  = document.getElementById(`${prefix}-year`);
  const labelEl = document.getElementById(`${prefix}-dow-label`);
  if (!dayEl || !monthEl || !yearEl || !labelEl) return;

  function update() {
    const d = parseInt(dayEl.value);
    const m = parseInt(monthEl.value);
    const y = parseInt(yearEl.value);
    if (!d || !m || !y) { labelEl.textContent = ''; return; }
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime()) || date.getDate() !== d) { labelEl.textContent = ''; return; }
    labelEl.textContent = date.toLocaleDateString(displayLocale(), { weekday: 'long', month: 'short', day: 'numeric' });
  }

  dayEl.addEventListener('change',   update);
  monthEl.addEventListener('change', update);
  yearEl.addEventListener('change',  update);
  update();
}

function renderDateSelectHtml(prefix, initialDate, yearMin, yearMax) {
  const ref = (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) ? initialDate : todayStr();
  const [ry, rm, rd] = ref.split('-').map(Number);
  const initYear  = Math.max(yearMin, Math.min(yearMax, ry));
  const initMonth = rm;
  const maxD      = daysInMonth(initYear, initMonth);
  const initDay   = Math.min(rd, maxD);

  const dayOpts = Array.from({length: maxD}, (_, i) => {
    const v = i + 1;
    return `<option value="${v}"${v === initDay ? ' selected' : ''}>${v}</option>`;
  }).join('');

  const monthOpts = SEL_MONTH_NAMES.map((name, i) => {
    const v = i + 1;
    return `<option value="${v}"${v === initMonth ? ' selected' : ''}>${name}</option>`;
  }).join('');

  const yearOpts = [];
  for (let y = yearMin; y <= yearMax; y++) {
    yearOpts.push(`<option value="${y}"${y === initYear ? ' selected' : ''}>${y}</option>`);
  }

  setTimeout(() => attachDowLabel(prefix), 0);

  return `<div style="display:flex;gap:8px;width:100%;">
    <select id="${prefix}-month" class="form-input" style="flex:2;">${monthOpts}</select>
    <select id="${prefix}-day" class="form-input" style="flex:1;">${dayOpts}</select>
    <select id="${prefix}-year" class="form-input" style="flex:1.5;">${yearOpts}</select>
  </div>
  <div id="${prefix}-dow-label" class="date-select-dow-label"></div>`;
}

function getSelectDate(prefix) {
  const d = parseInt(document.getElementById(`${prefix}-day`)?.value  ?? '');
  const m = parseInt(document.getElementById(`${prefix}-month`)?.value ?? '');
  const y = parseInt(document.getElementById(`${prefix}-year`)?.value  ?? '');
  if (!d || !m || !y) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Arrival picker — past-only constraints, sets userTouchedArrivalDate flag
function attachArrivalSelectListeners() {
  userTouchedArrivalDate = false;
  const today = todayStr();
  const [ty, tm, td] = today.split('-').map(Number);

  const dayEl   = document.getElementById('arrival-day');
  const monthEl = document.getElementById('arrival-month');
  const yearEl  = document.getElementById('arrival-year');
  if (!dayEl || !monthEl || !yearEl) return;

  function refresh(setFlag) {
    if (setFlag) userTouchedArrivalDate = true;
    const y = parseInt(yearEl.value);
    const m = parseInt(monthEl.value);
    const d = parseInt(dayEl.value);

    // Constrain month options: if year == today's year, max month = today's month
    const maxM = (y === ty) ? tm : 12;
    const curM = Math.min(m, maxM);
    monthEl.innerHTML = SEL_MONTH_NAMES.map((name, i) => {
      const v = i + 1;
      if (v > maxM) return '';
      return `<option value="${v}"${v === curM ? ' selected' : ''}>${name}</option>`;
    }).join('');

    // Constrain day options: respect month length; if year+month == today, max day = today
    const dMax  = daysInMonth(y, curM);
    const maxD  = (y === ty && curM === tm) ? Math.min(td, dMax) : dMax;
    const curD  = Math.min(d, maxD);
    dayEl.innerHTML = Array.from({length: maxD}, (_, i) => {
      const v = i + 1;
      if (v > maxD) return '';
      return `<option value="${v}"${v === curD ? ' selected' : ''}>${v}</option>`;
    }).join('');

    // Safety: if result is still in future, snap to today
    const built = `${y}-${String(curM).padStart(2, '0')}-${String(curD).padStart(2, '0')}`;
    if (built > today) {
      yearEl.value  = String(ty);
      refresh(false);
    }
  }

  yearEl.addEventListener('change',  () => refresh(true));
  monthEl.addEventListener('change', () => refresh(true));
  dayEl.addEventListener('change',   () => refresh(true));
  refresh(false); // apply initial constraints without touching the flag
}

// Task-due / task-override pickers — future-only constraints
function attachFutureDateSelectListeners(prefix) {
  const today = todayStr();
  const [ty, tm, td] = today.split('-').map(Number);

  const dayEl   = document.getElementById(`${prefix}-day`);
  const monthEl = document.getElementById(`${prefix}-month`);
  const yearEl  = document.getElementById(`${prefix}-year`);
  if (!dayEl || !monthEl || !yearEl) return;

  function refresh() {
    const y = parseInt(yearEl.value);
    const m = parseInt(monthEl.value);
    const d = parseInt(dayEl.value);

    // Constrain month options: if year == today's year, min month = today's month
    const minM = (y === ty) ? tm : 1;
    const curM = Math.max(m, minM);
    monthEl.innerHTML = SEL_MONTH_NAMES.map((name, i) => {
      const v = i + 1;
      if (v < minM) return '';
      return `<option value="${v}"${v === curM ? ' selected' : ''}>${name}</option>`;
    }).join('');

    // Constrain day options: if year+month == today, min day = today
    const dMax  = daysInMonth(y, curM);
    const minD  = (y === ty && curM === tm) ? td : 1;
    const curD  = Math.min(Math.max(d, minD), dMax);
    dayEl.innerHTML = Array.from({length: dMax}, (_, i) => {
      const v = i + 1;
      if (v < minD) return '';
      return `<option value="${v}"${v === curD ? ' selected' : ''}>${v}</option>`;
    }).join('');

    // Safety: if result is still in past, snap to today
    const built = `${y}-${String(curM).padStart(2, '0')}-${String(curD).padStart(2, '0')}`;
    if (built < today) {
      yearEl.value = String(ty);
      refresh();
    }
  }

  yearEl.addEventListener('change',  refresh);
  monthEl.addEventListener('change', refresh);
  dayEl.addEventListener('change',   refresh);
  refresh(); // apply initial constraints
}

// Rebuilds the Edit/Add Task recurrence summary line from current DOM state.
// Sets the "Due date" label on the shared task-due field according to current
// recurrence state: one-off → "Due date", interval → "First due date",
// weekdays → "Start from".
// ===== Yearly recurrence UI helpers (Add/Edit Task sheet) =====
const YEARLY_MONTH_NAMES = MONTH_NAMES; // shared source (Brief #44a)
const YEARLY_MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Max selectable day per 1-based month. February is 29 so a Feb 29 anchor is
// pickable; the engine (Build 1) resolves it to Mar 1 in non-leap years.
const YEARLY_MONTH_MAXDAY = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function yearlyMaxDay(month) { return YEARLY_MONTH_MAXDAY[(month || 1) - 1] ?? 31; }

function yearlyMonthOptionsHtml(selMonth) {
  return YEARLY_MONTH_NAMES
    .map((n, i) => `<option value="${i + 1}"${i + 1 === selMonth ? ' selected' : ''}>${n}</option>`)
    .join('');
}
function yearlyDayOptionsHtml(month, selDay) {
  const max = yearlyMaxDay(month);
  let out = '';
  for (let d = 1; d <= max; d++) out += `<option value="${d}"${d === selDay ? ' selected' : ''}>${d}</option>`;
  return out;
}
// The Yearly input section: month + day selects (no year field). Mirrors the
// container/section pattern of the interval/weekday sections.
function yearlySectionHtml(selMonth, selDay) {
  return `<div class="recurrence-yearly-section form-group" style="margin:0;">
            <div style="display:flex;gap:8px;align-items:center;">
              <select id="yearly-month" class="form-input" style="flex:1.6;font-size:13px;padding:6px 8px;">${yearlyMonthOptionsHtml(selMonth)}</select>
              <select id="yearly-day" class="form-input" style="flex:0.8;font-size:13px;padding:6px 8px;">${yearlyDayOptionsHtml(selMonth, selDay)}</select>
            </div>
          </div>`;
}
// Rebuild day options when the month changes, clamping a now-out-of-range day.
function rebuildYearlyDayOptions() {
  const ym = document.getElementById('yearly-month');
  const yd = document.getElementById('yearly-day');
  if (!ym || !yd) return;
  const month = parseInt(ym.value) || 1;
  let day = parseInt(yd.value) || 1;
  const max = yearlyMaxDay(month);
  if (day > max) day = max;
  yd.innerHTML = yearlyDayOptionsHtml(month, day);
}
// Yearly is anchored purely by month/day and has no first-due-date field, so
// hide the shared task-due field whenever the yearly section is active.
function syncYearlyRecurrenceUI() {
  const container = document.getElementById('recurrence-container');
  const field = document.getElementById('task-due-field');
  if (!field) return;
  field.style.display = container?.classList.contains('recurrence-yearly') ? 'none' : '';
}

function updateTaskDueLabel() {
  const label = document.getElementById('task-due-label');
  if (!label) return;
  const toggleBtn = document.getElementById('repeating-toggle');
  const isOn = toggleBtn?.getAttribute('aria-checked') === 'true';
  if (!isOn) { label.textContent = t('taskSheet.field.dueDate'); return; }
  const container = document.getElementById('recurrence-container');
  // Yearly has no first-due-date field (it's hidden), so nothing to relabel.
  if (container?.classList.contains('recurrence-yearly')) return;
  const rtype = container?.classList.contains('recurrence-weekdays') ? 'weekdays' : 'interval';
  label.textContent = rtype === 'weekdays' ? t('taskSheet.field.startFrom') : t('taskSheet.field.firstDueDate');
}

// Moves the shared task-due field: outside the recurrence block when one-off,
// inside it (below the visible section, above the summary) when repeating.
function relocateTaskDueField(isRepeating) {
  const field = document.getElementById('task-due-field');
  if (!field) return;
  const OUT_STYLE = 'padding:10px 16px;border-bottom:0.5px solid #f0f0ee;';
  const IN_STYLE  = 'border-top:1px solid #d8ddd3;margin-top:8px;padding-top:8px;';
  if (isRepeating) {
    const summary = document.getElementById('recurrence-summary');
    if (summary) summary.parentNode.insertBefore(field, summary);
    field.setAttribute('style', IN_STYLE);
  } else {
    const home = document.getElementById('task-due-home');
    if (home) home.parentNode.insertBefore(field, home.nextSibling);
    field.setAttribute('style', OUT_STYLE);
  }
  updateTaskDueLabel();
}

function updateRecurrenceSummary() {
  const el = document.getElementById('recurrence-summary');
  if (!el) return;

  const toggleBtn = document.getElementById('repeating-toggle');
  const isOn = toggleBtn?.getAttribute('aria-checked') === 'true';
  if (!isOn) { el.style.display = 'none'; return; }

  const container = document.getElementById('recurrence-container');

  // Yearly summary is anchored purely by the month/day selects — independent of
  // the (hidden) first-due-date field. Feb 29 gets the leap-year special copy.
  if (container?.classList.contains('recurrence-yearly')) {
    const month = parseInt(document.getElementById('yearly-month')?.value ?? '');
    const day   = parseInt(document.getElementById('yearly-day')?.value ?? '');
    if (!month || !day) { el.style.display = 'none'; return; }
    el.textContent = (month === 2 && day === 29)
      ? t('taskSheet.recSummary.yearlyLeap')
      : t('taskSheet.recSummary.yearlyOn', { month: YEARLY_MONTH_SHORT[month - 1], day });
    el.style.display = '';
    return;
  }

  const prefix = document.getElementById('task-override-day') ? 'task-override'
               : document.getElementById('task-due-oneoff-day') ? 'task-due-oneoff'
               : null;
  const firstDue = prefix ? getSelectDate(prefix) : null;
  if (!firstDue) { el.style.display = 'none'; return; }

  const rtype = container?.classList.contains('recurrence-weekdays') ? 'weekdays' : 'interval';
  const fmtDow = (d) => new Date(d + 'T12:00:00')
    .toLocaleDateString(displayLocale(), { weekday: 'short', month: 'short', day: 'numeric' });

  if (rtype === 'interval') {
    const freq = parseInt(document.getElementById('sheet-frequency')?.value ?? '');
    if (!freq || freq < 1) { el.style.display = 'none'; return; }
    const tail = tn('taskSheet.recSummary.everyDays', freq);
    const verb = el.dataset.started === 'true' ? t('taskSheet.recSummary.started') : t('taskSheet.recSummary.starts');
    el.textContent = `${verb} ${fmtDow(firstDue)} · ${tail}`;
  } else {
    const selected = Array.from(document.querySelectorAll('#sheet .weekday-btn.selected'))
      .map(b => parseInt(b.dataset.day))
      .filter(n => !Number.isNaN(n))
      .sort(compareWeekdaysMonFirst);
    if (selected.length === 0) { el.style.display = 'none'; return; }
    const SHORT_DOW = WEEKDAY_NAMES_ABBR;
    const tail = t('taskSheet.recSummary.everyWeekdays', { days: selected.map(d => SHORT_DOW[d]).join(', ') });
    // Resolve the first actual occurrence: first selected weekday on/after the
    // entered date (mirrors computeNextDue's weekday-override snapping, #236).
    const resolved = computeNextDue({ recurrenceType: 'weekdays', weekdays: selected, nextDueOverride: firstDue });
    el.textContent = `${t('taskSheet.recSummary.firstOccurrence')} ${fmtDow(resolved)} · ${tail}`;
  }
  el.style.display = '';
}

// Compacts the shared date selects for the Add/Edit Task sheet (arrival picker unaffected).
function applyCompactDateSelectStyles(prefix) {
  const apply = (el, flexVal) => {
    if (!el) return;
    el.style.flex     = flexVal;
    el.style.fontSize = '13px';
    el.style.padding  = '6px 8px';
  };
  apply(document.getElementById(`${prefix}-day`),   '0.7');
  apply(document.getElementById(`${prefix}-month`), '1.6');
  apply(document.getElementById(`${prefix}-year`),  '0.9');
  const dow = document.getElementById(`${prefix}-dow-label`);
  if (dow) { dow.style.fontSize = '11px'; dow.style.color = '#7a8a7a'; }
}

function attachRecurrenceSummaryListeners(datePrefix) {
  const update = () => updateRecurrenceSummary();
  document.getElementById('sheet-frequency')?.addEventListener('input', update);
  ['day', 'month', 'year'].forEach(part => {
    document.getElementById(`${datePrefix}-${part}`)?.addEventListener('change', update);
  });
  // Yearly selects: month change rebuilds day options (clamping), then re-summarizes.
  document.getElementById('yearly-month')?.addEventListener('change', () => { rebuildYearlyDayOptions(); update(); });
  document.getElementById('yearly-day')?.addEventListener('change', update);
  update();
}

// ============================================================
// ARRIVAL DATE LISTENER
// ============================================================

function attachArrivalDateListener(emptyText = t('editPlant.setDate')) {
  const input = document.getElementById('sheet-acquired-date');
  if (!input) return;

  input.max = todayStr();

  document.querySelector('.arrival-date-btn, .arrival-optional-pill')?.addEventListener('click', function(e) {
    e.preventDefault();
    input.max = todayStr();
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  });

  input.addEventListener('change', function() {
    const display = document.getElementById('arrival-date-display');
    const btn = this.closest('.arrival-date-btn') ?? this.closest('.arrival-optional-pill');
    if (this.value) {
      if (display) display.textContent = new Date(this.value + 'T12:00:00').toLocaleDateString(displayLocale(), { month: 'short', day: 'numeric', year: 'numeric' });
      btn?.classList.add('has-value');
    } else {
      if (display) display.textContent = emptyText;
      btn?.classList.remove('has-value');
    }
  });
}

// ============================================================
// FEEDBACK
// ============================================================

function handleFeedbackTap() {
  const key = `feedbackCaseCount_${currentUserId ?? 'anon'}`;
  const count = (parseInt(localStorage.getItem(key) ?? '0', 10) || 0) + 1;
  localStorage.setItem(key, String(count));

  const displayName = activeUser ?? membersCache.find(m => m.display_name)?.display_name ?? 'User';
  const caseNum = String(count).padStart(3, '0');
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev';

  const message = [
    '[Plant Care Feedback]',
    `Case: ${displayName}-#${caseNum}`,
    `Build: ${buildTime}`,
    '',
    'What happened:',
  ].join('\n');

  window.open(`https://wa.me/56994343285?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

// ============================================================
// DEV TOOLS — remove before public launch
// ============================================================

function attachDevToolsTrigger() {
  if (!isAdmin) return; // dev tools are admin-only — never wire the listener otherwise
  const el = document.getElementById('dev-build-ts');
  if (!el) return;
  let _lpTimer = null;
  el.addEventListener('pointerdown', () => {
    _lpTimer = setTimeout(() => openDevToolsPanel(), 500);
  });
  el.addEventListener('pointerup',   () => clearTimeout(_lpTimer));
  el.addEventListener('pointerleave', () => clearTimeout(_lpTimer));
}

function openDevToolsPanel() {
  openSheet(`
    <div style="width:36px;height:4px;background:#ddd;border-radius:2px;margin:0 auto 16px;"></div>
    <div style="font-size:13px;font-weight:500;color:#222;margin-bottom:4px;">Dev Tools</div>
    <div style="font-size:11px;color:#888;margin-bottom:16px;">Seed scenarios replace household data · Onboarding reset affects only you</div>
    <div id="dev-tools-body">
      <button class="dev-tools-btn" data-action="dev-seed-empty">🌱 Empty state</button>
      <button class="dev-tools-btn" data-action="dev-seed-heavy-v4">🌲 Heavy v4</button>
      <button class="dev-tools-btn" data-action="dev-seed-reminders-test">🔔 Reminders Test</button>
      <div style="height:1px;background:#eee;margin:10px 0;"></div>
      <button class="dev-tools-btn" data-action="dev-full-onboarding-reset">♻️ Full Onboarding Reset (this member)</button>
    </div>
    <button class="dev-tools-btn" data-action="dev-copy-debug-info" style="margin-top:8px;">📋 Copy Debug Info</button>
    <button class="add-plant-back-link" data-action="close-sheet" style="margin-top:12px;">Cancel</button>
  `);
}

function showDevToolsConfirm(scenario, label) {
  document.getElementById('dev-tools-body').innerHTML = `
    <p style="font-size:13px;color:#333;margin-bottom:16px;">
      Replace all data with <strong>${escapeHtml(label)}</strong> state? This cannot be undone.
    </p>
    <div style="display:flex;gap:8px;">
      <button class="dev-tools-btn" style="flex:1;" data-action="dev-tools-cancel">Cancel</button>
      <button class="dev-tools-btn" style="flex:1;background:#c0392b;color:#fff;border-color:#c0392b;"
              data-action="dev-tools-confirm" data-scenario="${escapeHtml(scenario)}">Yes, replace data</button>
    </div>`;
}

// Seeds are destructive — only ever run against known throwaway test households.
const SEED_ALLOWED_HOUSEHOLDS = [
  'b3b5aeb6-ddcc-47c2-bb5e-b2e67d59f635', // Test Household 2
  'e296ba61-2fd7-4bfb-a8c2-d273abd234af', // Sweet Home Paderewsky
];

async function runDevSeed(scenario) {
  if (!SEED_ALLOWED_HOUSEHOLDS.includes(householdId)) {
    showToast('Seeds disabled for this household');
    return false;
  }
  const labels = {
    empty:      'Empty state',
    'heavy-v4': 'Heavy v4',
    'reminders-test': 'Reminders Test',
  };
  try {
    if (scenario === 'empty')    await seedEmpty({ resetOnboarding: true });
    if (scenario === 'heavy-v4') await seedHeavyV4();
    if (scenario === 'reminders-test') await seedRemindersTest();
    closeSheet();
    await loadFromSupabase();
    navigateTo('home');
    showToast(`✅ ${labels[scenario]} data loaded`);
    return true;
  } catch (err) {
    console.error('[DevTools] seed error:', err);
    showToast('❌ Seed failed — check console');
    return false;
  }
}

// #405a: confirm screen for the onboarding-only reset. Distinct from the seed
// confirm (showDevToolsConfirm) — this touches no household data, only the current
// member's onboarding flags/completion column/notification state.
function showOnboardingResetConfirm() {
  document.getElementById('dev-tools-body').innerHTML = `
    <p style="font-size:13px;color:#333;margin-bottom:16px;">
      Reset <strong>onboarding</strong> for <strong>${escapeHtml(activeUser || 'this member')}</strong>?
      Clears local onboarding flags, sets <code>onboarding_completed_at</code> → null, and (if on)
      disables notifications. Plants and tasks are left untouched.
    </p>
    <div style="display:flex;gap:8px;">
      <button class="dev-tools-btn" style="flex:1;" data-action="dev-tools-cancel">Cancel</button>
      <button class="dev-tools-btn" style="flex:1;background:#c0392b;color:#fff;border-color:#c0392b;"
              data-action="dev-onboarding-reset-confirm">Yes, reset onboarding</button>
    </div>`;
}

// #405a: onboarding-state-only reset for the CURRENT member. Clears the local
// onboarding-adjacent keys (same prefix list as seedEmpty, but scoped to this
// member), nulls the server completion column, and — only if notifications were
// enabled — disables them and drops the push subscription. Does NOT touch
// plants/tasks/care_log/notes/plant_photos.
async function runOnboardingReset() {
  if (!currentMemberId) { showToast('No current member'); return false; }
  try {
    // 1. Local: clear onboarding-adjacent keys for THIS member only.
    const resetPrefixes = ['onboarding_', 'push_accepted_', 'reminders_card_dismissed_', 'calendar_card_dismissed_', 'calendar_card_triggered_', 'calendar_subscribed_', 'calendar_app_'];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.includes(currentMemberId) && resetPrefixes.some(p => key.startsWith(p))) {
        localStorage.removeItem(key);
      }
    }

    // 2. Server: null the completion column so reconcileOnboardingFromServer()
    //    early-returns and the local flags drive a fresh tour.
    const { error: obErr } = await supabaseClient
      .from('household_members')
      .update({ onboarding_completed_at: null })
      .eq('id', currentMemberId);
    if (obErr) throw obErr;
    const m = membersCache.find(mm => mm.id === currentMemberId);
    if (m) m.onboarding_completed_at = null;

    // 3. Server: if notifications were on, turn them off and remove the push sub.
    //    Skip entirely (no-op) when already off.
    if (m?.notifications_enabled) {
      const { error: nErr } = await supabaseClient
        .from('household_members')
        .update({ notifications_enabled: false })
        .eq('id', currentMemberId);
      if (nErr) throw nErr;
      m.notifications_enabled = false;

      const { error: pErr } = await supabaseClient
        .from('push_subscriptions')
        .delete()
        .eq('household_member_id', currentMemberId);
      if (pErr) throw pErr;
    }

    closeSheet();
    await loadFromSupabase();
    navigateTo('home');
    showToast('✅ Onboarding reset');
    return true;
  } catch (err) {
    console.error('[DevTools] onboarding reset error:', err);
    showToast('❌ Reset failed — check console');
    return false;
  }
}

// Wipe all plants in household (tasks/care_log/notes are plant-scoped)
async function seedEmpty({ resetOnboarding = false } = {}) {
  const now = new Date().toISOString();
  const { data: rows } = await supabaseClient
    .from('plants').select('id').eq('household_id', householdId).is('deleted_at', null);
  if (rows?.length) {
    await supabaseClient.from('plants').update({ deleted_at: now })
      .in('id', rows.map(r => r.id));
  }
  if (resetOnboarding) {
    // Wipe onboarding + push-accepted state for ALL members on this browser, not
    // just the current one — clears every key starting with these prefixes so a
    // fresh Empty State produces a clean onboarding for whoever logs in next.
    const resetPrefixes = ['onboarding_', 'push_accepted_', 'reminders_card_dismissed_', 'calendar_card_dismissed_', 'calendar_card_triggered_', 'calendar_subscribed_', 'calendar_app_'];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && resetPrefixes.some(p => key.startsWith(p))) localStorage.removeItem(key);
    }
    if (currentMemberId) {
      await supabaseClient
        .from('household_members')
        .update({ calendar_time: '20:00', calendar_weekend_time: null })
        .eq('id', currentMemberId);
      const m = membersCache.find(m => m.id === currentMemberId);
      if (m) { m.calendar_time = '20:00'; m.calendar_weekend_time = null; }
    }
  }
}

async function seedHeavyV4() {

  // Teardown — children before parent.
  if (householdId) {
    const { data: allPlants } = await supabaseClient
      .from('plants').select('id').eq('household_id', householdId);
    const plantIds = (allPlants ?? []).map(r => r.id);
    if (plantIds.length) {
      await supabaseClient.from('plant_photos').delete().in('plant_id', plantIds);
      await supabaseClient.from('care_log').delete().in('plant_id', plantIds);
      await supabaseClient.from('notes').delete().in('plant_id', plantIds);
      await supabaseClient.from('tasks').delete().in('plant_id', plantIds);
      await supabaseClient.from('plants').delete().in('id', plantIds);
    }
  }

  const today = todayStr();
  const memberA = membersCache[0]?.id ?? null;
  const memberB = (membersCache[1] ?? membersCache[0])?.id ?? null;

  const PHOTO_BASE = 'https://kmkfywdzoitgdtbttxaa.supabase.co/storage/v1/object/public/plant-photos/test-assets';

  const insertPlant = async (name, emoji, sortOrder, daysAgo, photoUrl = null) => {
    const payload = {
      household_id:  householdId,
      name,
      emoji,
      date_acquired: addDays(today, -daysAgo),
      sort_order:    sortOrder,
    };
    if (photoUrl) payload.photo_url = photoUrl;
    const { data } = await supabaseClient.from('plants').insert(payload).select().single();
    return data;
  };

  const insertTask = async (plantId, idx, def) => {
    const { data } = await supabaseClient.from('tasks').insert({
      plant_id:          plantId,
      name:              def.name,
      icon:              def.icon,
      type:              def.type,
      recurrence:        def.rec,
      owner_id:          def.owner,
      paused:            def.paused ?? false,
      note:              '',
      sort_order:        idx + 1,
      last_done:         def.ld ?? null,
      next_due_override: def.ndo ?? null,
    }).select().single();
    return data;
  };

  const logCare = async (plantId, taskId, memberId, taskName, taskType, daysAgo, hourOfDay = 10) => {
    const ts = new Date();
    ts.setDate(ts.getDate() - daysAgo);
    ts.setHours(hourOfDay, 0, 0, 0);
    await supabaseClient.from('care_log').insert({
      plant_id:            plantId,
      task_id:             taskId,
      household_member_id: memberId,
      task_name:           taskName,
      task_type:           taskType,
      date:                addDays(today, -daysAgo),
      created_at:          ts.toISOString(),
    });
  };

  const insertNote = async (plantId, memberId, noteText, photoUrl, daysAgo, hourOfDay = 11) => {
    const ts = new Date();
    ts.setDate(ts.getDate() - daysAgo);
    ts.setHours(hourOfDay, 0, 0, 0);
    await supabaseClient.from('notes').insert({
      plant_id:            plantId,
      household_member_id: memberId,
      note:                noteText,
      photo_url:           photoUrl ?? null,
      created_at:          ts.toISOString(),
    });
  };

  const todayDow = new Date().getDay();
  const tomorrowDow = todayDow === 6 ? 1 : todayDow + 1;
  const safeDays = [1, 2, 3, 4, 5].filter(d => d !== todayDow && d !== tomorrowDow);

  // 1. MANDARIN TREE — attention plant
  const mandarin = await insertPlant('Mandarin Tree', '🍊', 1, 180);
  // 5 overdue
  const manWater = await insertTask(mandarin.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -10),
  });
  const manFert = await insertTask(mandarin.id, 1, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 14, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -16),
  });
  const manPruning = await insertTask(mandarin.id, 2, {
    name: 'Pruning', icon: '✂️', type: 'prune',
    rec: { type: 'interval', every: 30, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -32),
  });
  const manCheck = await insertTask(mandarin.id, 3, {
    name: 'Check leaves', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: safeDays },
    owner: memberB, ld: addDays(today, -8),
  });
  const manMisting = await insertTask(mandarin.id, 4, {
    name: 'Misting', icon: '💦', type: 'water',
    rec: { type: 'interval', every: 3, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -5),
  });

  // 5 due today
  const manRotation = await insertTask(mandarin.id, 5, {
    name: 'Rotation', icon: '🔄', type: 'rotate',
    rec: { type: 'interval', every: 5, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -5),
  });
  const manRepot = await insertTask(mandarin.id, 6, {
    name: 'Repot', icon: '🪴', type: 'repot',
    rec: { type: 'one-off' },
    owner: memberA, ld: null, ndo: today,
  });
  const manSoilCheck = await insertTask(mandarin.id, 7, {
    name: 'Soil check', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: safeDays },
    owner: memberB, ld: addDays(today, -7),
  });
  const manDeepWater = await insertTask(mandarin.id, 8, {
    name: 'Deep watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 10, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -10),
  });
  const manHumidity = await insertTask(mandarin.id, 9, {
    name: 'Humidity check', icon: '🌡️', type: 'check',
    rec: { type: 'interval', every: 2, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -2),
  });

  await logCare(mandarin.id, manWater.id,     memberA, 'Watering',       'water',     10);
  await logCare(mandarin.id, manFert.id,      memberB, 'Fertilizing',    'fertilize', 16);
  await logCare(mandarin.id, manPruning.id,   memberA, 'Pruning',        'prune',     32);
  await logCare(mandarin.id, manCheck.id,     memberB, 'Check leaves',   'check',      8);
  await logCare(mandarin.id, manMisting.id,   memberA, 'Misting',        'water',      5);
  await logCare(mandarin.id, manRotation.id,  memberB, 'Rotation',       'rotate',     5);
  await logCare(mandarin.id, manSoilCheck.id, memberB, 'Soil check',     'check',      7);
  await logCare(mandarin.id, manDeepWater.id, memberA, 'Deep watering',  'water',     10);
  await logCare(mandarin.id, manHumidity.id,  memberB, 'Humidity check', 'check',      2);
  await insertNote(mandarin.id, memberA, 'First fruits forming on the lower branches 🍊', `${PHOTO_BASE}/bugam-photo.jpeg`, 78);
  await insertNote(mandarin.id, memberB, 'Some yellowing on older leaves — might be overwatering', null, 65);
  await insertNote(mandarin.id, memberA, 'Yellowing resolved, new growth looking healthy', `${PHOTO_BASE}/Fiddle01.jpeg`, 52);
  await insertNote(mandarin.id, memberB, 'Moved closer to the window for more light', null, 38);
  await insertNote(mandarin.id, memberA, 'Tiny new fruits visible on two branches!', `${PHOTO_BASE}/Fiddle02.jpeg`, 24);
  await insertNote(mandarin.id, memberB, 'Noticed some scale insects on the stem — treated with neem oil', null, 12);
  await insertNote(mandarin.id, memberA, 'Recovery looking good after neem treatment', `${PHOTO_BASE}/bugam-photo.jpeg`, 3);

  // 2. POTHOS — attention plant
  const pothos = await insertPlant('Pothos', '🪴', 2, 150);
  const potWater = await insertTask(pothos.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -14),
  });
  const potRotation = await insertTask(pothos.id, 1, {
    name: 'Rotation', icon: '🔄', type: 'rotate',
    rec: { type: 'interval', every: 3, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -3),
  });
  const potCheck = await insertTask(pothos.id, 2, {
    name: 'Check soil', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: [safeDays[0], safeDays[2]] },
    owner: memberA, ld: addDays(today, -4),
  });
  await insertTask(pothos.id, 3, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 21, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -10), paused: true,
  });
  const potRepot = await insertTask(pothos.id, 4, {
    name: 'Repot', icon: '🪴', type: 'repot',
    rec: { type: 'one-off' },
    owner: memberA, ld: addDays(today, -60),
  });
  await logCare(pothos.id, potRotation.id, memberB, 'Rotation', 'rotate', 0, 10);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 14);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 21);
  await logCare(pothos.id, potWater.id,    memberB, 'Watering', 'water', 28);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 35);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 42);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 49);
  await logCare(pothos.id, potWater.id,    memberB, 'Watering', 'water', 56);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 63);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 70);
  await logCare(pothos.id, potWater.id,    memberB, 'Watering', 'water', 77);
  await logCare(pothos.id, potRotation.id, memberB, 'Rotation', 'rotate', 3);
  await logCare(pothos.id, potRotation.id, memberA, 'Rotation', 'rotate', 6);
  await logCare(pothos.id, potRotation.id, memberB, 'Rotation', 'rotate', 9);
  await logCare(pothos.id, potRotation.id, memberB, 'Rotation', 'rotate', 12);
  await logCare(pothos.id, potCheck.id,    memberA, 'Check soil', 'check', 4);
  await logCare(pothos.id, potCheck.id,    memberA, 'Check soil', 'check', 11);
  await logCare(pothos.id, potCheck.id,    memberB, 'Check soil', 'check', 18);
  await logCare(pothos.id, potRepot.id,    memberA, 'Repot', 'repot', 60);
  await insertNote(pothos.id, memberB, 'Repotted into a bigger pot — roots were totally bound 🪴', `${PHOTO_BASE}/bugam-photo.jpeg`, 60);
  await insertNote(pothos.id, memberA, 'New growth after repot, three new leaves in a week', null, 50);
  await insertNote(pothos.id, memberB, 'Trailing vines getting long — might need a trim soon', `${PHOTO_BASE}/Fiddle01.jpeg`, 35);
  await insertNote(pothos.id, memberA, 'Soil still moist, skipping watering today', null, 20);
  await insertNote(pothos.id, memberB, 'Two leaves yellowing at the base — normal aging', null, 8);
  await insertNote(pothos.id, memberA, 'Looking lush after move to brighter spot', `${PHOTO_BASE}/Fiddle02.jpeg`, 2);

  // 3. FERN — attention plant
  const fern = await insertPlant('Fern', '🌿', 3, 120);
  const fernMisting = await insertTask(fern.id, 0, {
    name: 'Misting', icon: '💦', type: 'water',
    rec: { type: 'interval', every: 2, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -5),
  });
  const fernWater = await insertTask(fern.id, 1, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -7),
  });
  const fernCheck = await insertTask(fern.id, 2, {
    name: 'Check humidity', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: [safeDays[0], safeDays[2]] },
    owner: memberA, ld: addDays(today, -3),
  });
  await insertTask(fern.id, 3, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 30, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -15), paused: true,
  });
  const fernHumidity = await insertTask(fern.id, 4, {
    name: 'Humidity check', icon: '🌡️', type: 'check',
    rec: { type: 'one-off' },
    owner: memberA, ld: addDays(today, -30),
  });
  // Overdue weekday task — ndo = most recent past Mon or Wed strictly before today
  let fernWdDue = addDays(today, -1);
  while (![1, 3].includes(new Date(fernWdDue + 'T12:00:00').getDay())) {
    fernWdDue = addDays(fernWdDue, -1);
  }
  await insertTask(fern.id, 5, {
    name: 'Weekday Watering', icon: '💧', type: 'water',
    rec: { type: 'weekdays', days: [1, 3] },
    owner: memberA, ld: addDays(today, -5), ndo: fernWdDue,
  });
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 5);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 7);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 9);
  await logCare(fern.id, fernMisting.id,  memberB, 'Misting', 'water', 11);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 15);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 20);
  await logCare(fern.id, fernMisting.id,  memberB, 'Misting', 'water', 25);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 30);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 40);
  await logCare(fern.id, fernMisting.id,  memberB, 'Misting', 'water', 50);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 60);
  await logCare(fern.id, fernWater.id,    memberB, 'Watering', 'water', 7);
  await logCare(fern.id, fernWater.id,    memberB, 'Watering', 'water', 14);
  await logCare(fern.id, fernWater.id,    memberA, 'Watering', 'water', 21);
  await logCare(fern.id, fernWater.id,    memberB, 'Watering', 'water', 28);
  await logCare(fern.id, fernWater.id,    memberA, 'Watering', 'water', 42);
  await logCare(fern.id, fernWater.id,    memberB, 'Watering', 'water', 56);
  await logCare(fern.id, fernCheck.id,    memberA, 'Check humidity', 'check', 3);
  await logCare(fern.id, fernCheck.id,    memberA, 'Check humidity', 'check', 10);
  await logCare(fern.id, fernCheck.id,    memberB, 'Check humidity', 'check', 17);
  await logCare(fern.id, fernHumidity.id, memberA, 'Humidity check', 'check', 30);
  await insertNote(fern.id, memberA, 'Moved to the bathroom — humidity is perfect in there', `${PHOTO_BASE}/bugam-photo.jpeg`, 85);
  await insertNote(fern.id, memberB, 'Tips going brown — air is too dry. Moving it back', null, 70);
  await insertNote(fern.id, memberA, 'Misting daily for a week seems to have helped a lot', null, 55);
  await insertNote(fern.id, memberB, 'New leaves uncurling beautifully 🌿', `${PHOTO_BASE}/Fiddle01.jpeg`, 40);
  await insertNote(fern.id, memberA, 'Still growing steadily — one new frond this week', null, 25);
  await insertNote(fern.id, memberB, 'Looking really full now compared to when we got it', `${PHOTO_BASE}/Fiddle02.jpeg`, 10);
  await insertNote(fern.id, memberA, 'Brown tips back — might need to increase misting again', null, 2);

  // 4. BOUGAINVILLEA — healthy plant
  const { data: bougainvillea } = await supabaseClient.from('plants').insert({
    household_id:  householdId,
    name:          'Bougainvillea',
    emoji:         '🌸',
    date_acquired: addDays(today, -200),
    sort_order:    4,
    photo_url:     `${PHOTO_BASE}/bugam-photo.jpeg`,
  }).select().single();
  const bouWater = await insertTask(bougainvillea.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -3),
  });
  const bouFert = await insertTask(bougainvillea.id, 1, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 21, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -5),
  });
  const bouCheck = await insertTask(bougainvillea.id, 2, {
    name: 'Check flowers', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: [safeDays[0], safeDays[2]] },
    owner: memberA, ld: addDays(today, -2),
  });
  await insertTask(bougainvillea.id, 3, {
    name: 'Repot', icon: '🪴', type: 'repot',
    rec: { type: 'one-off' },
    owner: memberB, ld: null, ndo: addDays(today, 5),
  });
  // Upcoming weekday task — ndo = nearest future Wed or Fri strictly after today
  let bouWdDue = addDays(today, 1);
  while (![3, 5].includes(new Date(bouWdDue + 'T12:00:00').getDay())) {
    bouWdDue = addDays(bouWdDue, 1);
  }
  await insertTask(bougainvillea.id, 4, {
    name: 'Weekday Misting', icon: '💧', type: 'water',
    rec: { type: 'weekdays', days: [3, 5] },
    owner: memberB, ld: addDays(today, -2), ndo: bouWdDue,
  });
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 3);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 10);
  await logCare(bougainvillea.id, bouWater.id,  memberB, 'Watering', 'water', 17);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 24);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 31);
  await logCare(bougainvillea.id, bouWater.id,  memberB, 'Watering', 'water', 38);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 45);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 52);
  await logCare(bougainvillea.id, bouWater.id,  memberB, 'Watering', 'water', 59);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 66);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 73);
  await logCare(bougainvillea.id, bouWater.id,  memberB, 'Watering', 'water', 80);
  await logCare(bougainvillea.id, bouFert.id,   memberB, 'Fertilizing', 'fertilize', 5);
  await logCare(bougainvillea.id, bouFert.id,   memberB, 'Fertilizing', 'fertilize', 26);
  await logCare(bougainvillea.id, bouFert.id,   memberA, 'Fertilizing', 'fertilize', 47);
  await logCare(bougainvillea.id, bouFert.id,   memberB, 'Fertilizing', 'fertilize', 68);
  await logCare(bougainvillea.id, bouCheck.id,  memberA, 'Check flowers', 'check', 2);
  await logCare(bougainvillea.id, bouCheck.id,  memberB, 'Check flowers', 'check', 9);
  await logCare(bougainvillea.id, bouCheck.id,  memberA, 'Check flowers', 'check', 16);
  await logCare(bougainvillea.id, bouCheck.id,  memberB, 'Check flowers', 'check', 30);
  await insertNote(bougainvillea.id, memberA, 'Blooming heavily this season — absolutely stunning 🌸', `${PHOTO_BASE}/bugam-photo.jpeg`, 75);
  await insertNote(bougainvillea.id, memberB, 'Pruned back the longest stems after flowering', null, 60);
  await insertNote(bougainvillea.id, memberA, 'New pink bracts forming on all the pruned stems', `${PHOTO_BASE}/Fiddle01.jpeg`, 45);
  await insertNote(bougainvillea.id, memberB, 'Moving to a sunnier spot for the summer', null, 28);
  await insertNote(bougainvillea.id, memberA, 'Second bloom cycle starting — three new clusters', `${PHOTO_BASE}/Fiddle02.jpeg`, 12);
  await insertNote(bougainvillea.id, memberB, 'Root-bound in current pot — scheduled repot for next week', null, 3);

  // 5. CACTUS — healthy plant
  const cactus = await insertPlant('Cactus', '🌵', 5, 240);
  const cactusWeekdays = [safeDays[0], safeDays[1]];
  const cacWater = await insertTask(cactus.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'weekdays', days: cactusWeekdays },
    owner: memberA, ld: addDays(today, -2),
  });
  const cacFert = await insertTask(cactus.id, 1, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 30, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -5),
  });
  const cacHealth = await insertTask(cactus.id, 2, {
    name: 'Health check', icon: '🔍', type: 'check',
    rec: { type: 'one-off' },
    owner: memberA, ld: addDays(today, -30),
  });
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 2);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 9);
  await logCare(cactus.id, cacWater.id,  memberB, 'Watering', 'water', 16);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 23);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 30);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 44);
  await logCare(cactus.id, cacWater.id,  memberB, 'Watering', 'water', 58);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 72);
  await logCare(cactus.id, cacFert.id,   memberB, 'Fertilizing', 'fertilize', 5);
  await logCare(cactus.id, cacFert.id,   memberB, 'Fertilizing', 'fertilize', 35);
  await logCare(cactus.id, cacFert.id,   memberA, 'Fertilizing', 'fertilize', 65);
  await logCare(cactus.id, cacHealth.id, memberA, 'Health check', 'check', 30);
  await insertNote(cactus.id, memberA, 'Tiny new growth on the top — first sign of life in months 🌵', null, 80);
  await insertNote(cactus.id, memberB, 'Spine color looks slightly off — keeping an eye on it', null, 65);
  await insertNote(cactus.id, memberA, 'All good — spine color normal, just a lighting issue', `${PHOTO_BASE}/bugam-photo.jpeg`, 50);
  await insertNote(cactus.id, memberB, 'Growing visibly taller, maybe 2cm since we got it', null, 30);
  await insertNote(cactus.id, memberA, 'Still going strong with minimal care 💪', `${PHOTO_BASE}/Fiddle01.jpeg`, 15);
  await insertNote(cactus.id, memberB, 'Considering moving it to the windowsill for more sun', null, 4);
  setOnboardingStep(4);
} // end seedHeavyV4

// #342: "Reminders Test" — lands on a clean home with the #339 reminders card
// visible, onboarding read as complete (FAB unlocked, no Getting Started flow),
// notifications OFF, and one plant with two feed-valid tasks so the calendar
// feed emits VEVENTs. Mirrors seedHeavyV4's teardown order and seedEmpty's
// all-members flag wipe.
async function seedRemindersTest() {
  // Teardown — children before parent (same order as Heavy v4).
  if (householdId) {
    const { data: allPlants } = await supabaseClient
      .from('plants').select('id').eq('household_id', householdId);
    const plantIds = (allPlants ?? []).map(r => r.id);
    if (plantIds.length) {
      await supabaseClient.from('plant_photos').delete().in('plant_id', plantIds);
      await supabaseClient.from('care_log').delete().in('plant_id', plantIds);
      await supabaseClient.from('notes').delete().in('plant_id', plantIds);
      await supabaseClient.from('tasks').delete().in('plant_id', plantIds);
      await supabaseClient.from('plants').delete().in('id', plantIds);
    }
  }

  // Clear onboarding + reminder state for ALL members on this browser (#314),
  // including calendar-subscribed flags, so both dialog sections read action-state.
  const resetPrefixes = ['onboarding_', 'push_accepted_', 'reminders_card_dismissed_', 'calendar_subscribed_', 'calendar_app_'];
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && resetPrefixes.some(p => key.startsWith(p))) localStorage.removeItem(key);
  }

  // Tour complete → reminders card renders + FAB unlocked, and onboarding step
  // past the banner (step 4) so no Getting Started flow appears. Set AFTER the
  // wipe above (which clears the onboarding_ prefix, resetting step to 1).
  if (currentMemberId) {
    localStorage.setItem(`onboarding_session6_done_${currentMemberId}`, 'true');
  }
  setOnboardingStep(4);

  // Notifications OFF so the Push section renders in its action-state.
  await setNotificationsEnabled(false);

  const today = todayStr();
  const { data: plant } = await supabaseClient.from('plants').insert({
    household_id:  householdId,
    name:          'Reminder Test Plant',
    emoji:         '🪴',
    date_acquired: addDays(today, -30),
    sort_order:    1,
  }).select().single();

  // Two feed-valid tasks owned by the current member:
  //   - interval water, every 3 days, first due today (no last_done → computeNextDue = today)
  //   - weekday fertilize, Mon+Thu, no override (→ next Mon/Thu)
  await supabaseClient.from('tasks').insert([
    {
      plant_id:   plant.id,
      name:       'Watering', icon: '💧', type: 'water',
      recurrence: { type: 'interval', every: 3, unit: 'days', days: [] },
      owner_id:   currentMemberId,
      sort_order: 1,
    },
    {
      plant_id:   plant.id,
      name:       'Fertilizing', icon: '🌿', type: 'fertilize',
      recurrence: { type: 'weekdays', days: [1, 4] },
      owner_id:   currentMemberId,
      sort_order: 2,
    },
  ]);
}

// DEV TOOLS — handleEvent cases added inline in the switch statement

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await registerServiceWorker();
  } catch (e) {
    console.warn('Service worker registration failed:', e);
  }

  document.getElementById('app').addEventListener('click', handleEvent);
  document.getElementById('sheet').addEventListener('click', handleEvent);
  document.getElementById('menu-panel').addEventListener('click', handleEvent);
  document.getElementById('toast').addEventListener('click', handleEvent);

  document.getElementById('sheet').addEventListener('change', (ev) => {
    console.log('[sheet change]', { targetId: ev.target?.id, filesCount: ev.target?.files?.length });
    if (ev.target?.id === 'add-note-file-input') {
      const file = ev.target.files?.[0];
      if (file) handleAddNoteFileSelected(file);
    } else if (ev.target?.id === 'edit-note-file-input') {
      const file = ev.target.files?.[0];
      if (file) handleEditNotePhotoFileSelected(file);
    } else if (ev.target?.id === 'add-plant-file-input') {
      const file = ev.target.files?.[0];
      if (file) handleAddPlantFileSelected(file);
    }
  });
  document.getElementById('overlay').addEventListener('click', closeSheet);
  document.getElementById('menu-overlay').addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => {
    const sheetActive = document.getElementById('sheet')?.classList.contains('active');
    if (!sheetActive) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      const cancelBtn = document.querySelector('#sheet [data-action="sheet-cancel"]');
      if (cancelBtn) cancelBtn.click();
      else closeSheet();
      return;
    }

    if (e.key === 'Enter' && !e.isComposing) {
      const el = document.activeElement;
      if (el?.tagName === 'TEXTAREA' || el?.isContentEditable) return;
      const primary = document.querySelector('#sheet .btn-primary:not([disabled])');
      if (primary) {
        e.preventDefault();
        primary.click();
      }
    }
  });

  document.addEventListener('click', (ev) => {
    const switcher = document.getElementById('household-switcher');
    if (!switcher || !switcher.classList.contains('open')) return;
    if (switcher.contains(ev.target)) return;
    if (ev.target.closest?.('.household-pill')) return;
    switcher.classList.remove('open');
    const pill = document.querySelector('.household-pill');
    pill?.classList.remove('open');
    pill?.setAttribute('aria-expanded', 'false');
  });

  localStorage.removeItem('active-user');

  // When the PWA returns to the foreground after being away long enough, force a
  // background data reload so stale content (e.g. care log added on another
  // device) refreshes without a manual pull. Skipped while a sheet is open so we
  // don't yank state out from under an in-progress edit.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (lastSyncedAt === null) return;
    if (Date.now() - lastSyncedAt < FOREGROUND_RELOAD_THRESHOLD_MS) return;
    if (document.getElementById('sheet')?.classList.contains('active')) return;
    showReloadIndicator();
    loadFromSupabase()
      .then(() => renderApp())
      .finally(() => hideReloadIndicator());
  });

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      inRecovery = true;
      renderPasswordResetScreen();
      return;
    }

    if (event !== 'INITIAL_SESSION') return;

    // If the URL carried a recovery token, let the PASSWORD_RECOVERY event handle it.
    // Use initialHash (captured before createClient clears window.location.hash).
    if (initialHash.includes('type=recovery')) return;

    if (!session) {
      renderLoginScreen();
      return;
    }

    // The iOS install gate lives in routeAfterAuth() (#321) — the single
    // chokepoint all post-auth paths funnel through.
    await routeAfterAuth();
  });
});
