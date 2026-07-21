# i18n English source — Spanish translation worksheet (#44f-diag)

_Read-only extraction from `src/app.js` `TRANSLATIONS.en` + date/verb/preset constants. No files changed._

## 1. Namespace inventory

| # | Namespace | Keys |
|---|-----------|-----:|
| 1 | `onboarding` | 36 |
| 2 | `taskSheet` | 33 |
| 3 | `addPlant` | 27 |
| 4 | `auth` | 15 |
| 5 | `install` | 18 |
| 6 | `menu` | 38 |
| 7 | `calendarSync` | 41 |
| 8 | `home` | 27 |
| 9 | `caring` | 6 |
| 10 | `plantDetail` | 27 |
| 11 | `taskCard` | 4 |
| 12 | `manageHouseholds` | 13 |
| 13 | `notes` | 15 |
| 14 | `photos` | 15 |
| 15 | `editPlant` | 14 |
| 16 | `emojiPicker` | 1 |
| 17 | `status` | 35 |
| 18 | `relativeTime` | 17 |
| 19 | `reschedule` | 23 |
| 20 | `dialog` | 11 |
| 21 | `careVerb` | 8 |
| 22 | `activityFeed` | 5 |
| | **TOTAL** | **429** |

Total keys in `TRANSLATIONS.en`: **429** (expected 429 → ✅ match).
Namespaces: 22.

## 2. Per-namespace key dump (verbatim English values)

### `onboarding` (36)

| Key | English value |
|-----|---------------|
| `onboarding.nameCapture.title` | What should we call you? |
| `onboarding.nameCapture.subtitle` | This is how you'll appear to your household. |
| `onboarding.nameCapture.placeholder` | Your first name |
| `onboarding.nameCapture.cta` | Let's go |
| `onboarding.step.counter` | Step {step} of 3 |
| `onboarding.banner.label` | Get started |
| `onboarding.banner.step1` | Add a plant to get started. |
| `onboarding.banner.step1Cta` | + Add Plant |
| `onboarding.banner.step2` | Create a task to water your plant every 3 days. |
| `onboarding.banner.step2Cta` | Create a task → |
| `onboarding.banner.step3` | Tap ✓ Done below to complete your setup ↓ |
| `onboarding.inlineTask.markDone` | Mark as Done |
| `onboarding.reminders.noteText` | You can enable notifications any time from the menu. |
| `onboarding.reminders.blockedTitle` | Notifications are turned off |
| `onboarding.reminders.blockedBody` | To turn them on: <strong>{path}</strong>. |
| `onboarding.reminders.blockedPathIos` | iPhone Settings &rarr; Plant Care &rarr; Notifications |
| `onboarding.reminders.blockedPathAndroid` | Android Settings &rarr; Apps &rarr; Plant Care &rarr; Notifications |
| `onboarding.reminders.title` | Stay in sync with your household |
| `onboarding.reminders.subtitle` | Get a heads-up when someone completes a care task. |
| `onboarding.reminders.enable` | Enable notifications |
| `onboarding.card.maybeLater` | Maybe later |
| `onboarding.calendarCard.noteText` | You can sync your tasks to your Calendar app anytime from the menu. |
| `onboarding.calendarCard.title` | See your tasks in your calendar |
| `onboarding.calendarCard.subtitle` | Your plant care tasks will appear automatically as calendar events (a single event per day). |
| `onboarding.calendarCard.subscribe` | Set up Calendar Sync |
| `onboarding.coachmark.demoRow` | {name} watered {plant} · just now |
| `onboarding.coachmark.feedTitle` | This is your household's activity feed |
| `onboarding.coachmark.feedBody` | Every care action appears here in real time. No more guessing who did what — your whole household stays in sync automatically. |
| `onboarding.coachmark.gotIt` | Got it |
| `onboarding.coachmark.youFallback` | You |
| `onboarding.coachmark.plantFallback` | your plant |
| `onboarding.caringCoachmark.title` | Your daily tasks live here |
| `onboarding.caringCoachmark.body` | See what needs attention today and what's coming up this week. |
| `onboarding.tasksBanner.step3` | Tap ✓ Done below to complete your setup |
| `onboarding.addTask.label` | Your care task |
| `onboarding.addTask.instruction` | We've pre-filled a watering task for you. Adjust it or tap Add task to continue. |

### `taskSheet` (33)

| Key | English value |
|-----|---------------|
| `taskSheet.step1.title` | Add Task |
| `taskSheet.step2.addButton` | Add Task |
| `taskSheet.type.added` | Added |
| `taskSheet.type.custom` | Custom |
| `taskSheet.customTask.header` | Custom Task |
| `taskSheet.field.taskName` | Task name |
| `taskSheet.field.taskNamePlaceholder` | e.g. Mist leaves |
| `taskSheet.field.owner` | Owner |
| `taskSheet.field.dueDate` | Due date |
| `taskSheet.field.startFrom` | Start from |
| `taskSheet.field.firstDueDate` | First due date |
| `taskSheet.field.repeating` | Repeating task |
| `taskSheet.icon.tapToChange` | tap icon to change |
| `taskSheet.recurrence.interval` | Every X days |
| `taskSheet.recurrence.weekdays` | Days of week |
| `taskSheet.recurrence.yearly` | Yearly |
| `taskSheet.recurrence.daysBetween` | days between tasks |
| `taskSheet.pause.label` | Pause task |
| `taskSheet.pause.subtitle` | Skip until resumed |
| `taskSheet.delete` | Delete task |
| `taskSheet.cancel` | Cancel |
| `taskSheet.back` | Back |
| `taskSheet.saveChanges` | Save Changes |
| `taskSheet.recSummary.yearlyLeap` | Recurs every year on Feb 29 (Mar 1 in non-leap years) |
| `taskSheet.recSummary.yearlyOn` | Recurs every year on {month} {day} |
| `taskSheet.recSummary.everyDays.one` | recurs every {n} day |
| `taskSheet.recSummary.everyDays.other` | recurs every {n} days |
| `taskSheet.recSummary.everyWeekdays` | recurs every {days} |
| `taskSheet.recSummary.started` | Started |
| `taskSheet.recSummary.starts` | Starts |
| `taskSheet.recSummary.firstOccurrence` | First occurrence: |
| `taskSheet.overdueSheet.skip` | Skip this time |
| `taskSheet.overdueSheet.editTask` | Edit task |

### `addPlant` (27)

| Key | English value |
|-----|---------------|
| `addPlant.step1.title` | Pick an icon |
| `addPlant.step1.subtitle` | Choose something that looks like yours |
| `addPlant.tab.all` | All (35) |
| `addPlant.tab.foliage` | 🌿 Foliage |
| `addPlant.tab.flowers` | 🌸 Flowers |
| `addPlant.tab.edibles` | 🍋 Edibles |
| `addPlant.photo.divider` | none of these look like yours? |
| `addPlant.photo.added` | Photo added |
| `addPlant.photo.usedAsIcon` | This will be used as your plant icon |
| `addPlant.photo.remove` | Remove |
| `addPlant.photo.addInstead` | Add a photo instead |
| `addPlant.photo.later` | You can also do this later from the plant page |
| `addPlant.done` | Done |
| `addPlant.next` | Next → |
| `addPlant.step2.heading` | Give it a name |
| `addPlant.step2.subtext` | You can always change this later |
| `addPlant.step2.nameLabel` | Name |
| `addPlant.step2.namePlaceholder` | e.g. Monstera |
| `addPlant.step2.nameHint` | My green one, The big one… |
| `addPlant.step3.heading` | When did {name} arrive home? |
| `addPlant.step3.subtext` | We'll show you how long you've cared for it. |
| `addPlant.arrivalDate.label` | Arrival date |
| `addPlant.arrivalDate.optional` | Optional — you can skip this |
| `addPlant.step3.addButton` | Add {name} |
| `addPlant.duplicate.title` | You already have a {name} |
| `addPlant.duplicate.body` | Give this one a different name so you can tell them apart — or skip and we'll call it '{name} 2'. |
| `addPlant.duplicate.altPlaceholder` | Alternative name… |

### `auth` (15)

| Key | English value |
|-----|---------------|
| `auth.error.title` | Can't load household |
| `auth.error.signOut` | Sign out |
| `auth.error.noHousehold` | Your account isn't associated with a household. Contact your household admin. |
| `auth.error.notMember` | You aren't listed as a member of this household. |
| `auth.login.emailPlaceholder` | Email |
| `auth.login.passwordPlaceholder` | Password |
| `auth.login.signIn` | Sign In |
| `auth.reset.title` | Set New Password |
| `auth.reset.newPasswordPlaceholder` | New password |
| `auth.reset.confirmPasswordPlaceholder` | Confirm new password |
| `auth.reset.save` | Save |
| `auth.reset.errorTooShort` | Password must be at least 6 characters. |
| `auth.reset.errorMismatch` | Passwords do not match. |
| `auth.reset.successTitle` | Password Updated |
| `auth.reset.successBody` | Your password has been updated. Redirecting to sign in… |

### `install` (18)

| Key | English value |
|-----|---------------|
| `install.takeover.title` | Install Plant Care |
| `install.takeover.lead` | Add it to your Home Screen to get started. |
| `install.steps.tapShare` | Tap the {share} button in the bottom toolbar. If you don't see it, tap {more} first. |
| `install.steps.shareLabel` | Share |
| `install.steps.viewMore` | Tap {label} |
| `install.steps.viewMoreLabel` | View More |
| `install.steps.addToHome` | Scroll down to {label} |
| `install.steps.addToHomeLabel` | Add to Home Screen ➕ |
| `install.steps.tapAdd` | Tap {label} |
| `install.steps.addLabel` | Add |
| `install.steps.openApp` | Close Safari and open {icon} Plant Care from your Home Screen like a normal app |
| `install.openInSafari.title` | Open in Safari |
| `install.openInSafari.lead` | Plant Care can only be installed from Safari. To continue: |
| `install.openInSafari.copyLink` | Copy this link: |
| `install.openInSafari.openSafari` | Open the {label} app |
| `install.openInSafari.safariLabel` | Safari |
| `install.openInSafari.paste` | Paste the link, then follow the install steps |
| `install.openInSafari.footer` | This screen stays until the app is installed. |

### `menu` (38)

| Key | English value |
|-----|---------------|
| `menu.section.profile` | Profile |
| `menu.section.reminders` | Reminders & Notifications |
| `menu.section.account` | Account |
| `menu.item.syncCalendar` | Sync to Calendar |
| `menu.item.changePassword` | Change Password |
| `menu.item.signOut` | Sign Out |
| `menu.notifications.label` | Notifications |
| `menu.notifications.blocked` | Blocked |
| `menu.notifications.on` | On |
| `menu.notifications.off` | Off |
| `menu.notifications.body` | Get a heads-up on your phone whenever someone in your household completes a care task. |
| `menu.notifications.enable` | Enable |
| `menu.changePassword.newLabel` | New password |
| `menu.changePassword.newPlaceholder` | At least 8 characters |
| `menu.changePassword.confirmLabel` | Confirm password |
| `menu.changePassword.confirmPlaceholder` | Repeat new password |
| `menu.changePassword.errorTooShort` | Password must be at least 8 characters. |
| `menu.toast.markedDone` | {task} done |
| `menu.toast.addNotePrompt` | Add a note? |
| `menu.toast.undo` | Undo |
| `menu.toast.noteAdded` | Note added |
| `menu.toast.couldNotSaveTapRetry` | Could not save — tap Save to retry |
| `menu.toast.couldNotSavePleaseRetry` | Could not save — please try again |
| `menu.toast.householdNameUpdated` | &#10003; Household name updated |
| `menu.toast.passwordUpdated` | &#128274; Password updated! |
| `menu.toast.couldNotLoadImage` | Could not load that image |
| `menu.toast.photoLimitReached` | Photo limit reached — manage photos first |
| `menu.toast.couldNotSavePhoto` | Could not save photo |
| `menu.toast.couldNotFindPhoto` | Could not find photo |
| `menu.toast.plantSaved` | ✅ Plant saved! |
| `menu.toast.plantAdded` | 🌱 Plant added! |
| `menu.toast.taskAdded` | ✅ Task added! |
| `menu.toast.taskSaved` | ✅ Task saved! |
| `menu.toast.taskDeleted` | 🗑️ Task deleted! |
| `menu.toast.plantDeleted` | {name} deleted |
| `menu.toast.notificationsEnabled` | Notifications enabled |
| `menu.toast.notificationsEnabledBang` | 🔔 Notifications enabled! |
| `menu.toast.notificationsNotEnabled` | Notifications weren't enabled |

### `calendarSync` (41)

| Key | English value |
|-----|---------------|
| `calendarSync.intro` | Tasks appear as daily events in your calendar app. |
| `calendarSync.scope.my` | My tasks |
| `calendarSync.scope.all` | All household tasks |
| `calendarSync.scope.myBlurb` | Only tasks assigned to you. |
| `calendarSync.scope.allBlurb` | Every task across your household. |
| `calendarSync.app.google` | Google Calendar |
| `calendarSync.app.apple` | Apple Calendar |
| `calendarSync.schedule.daily` | Daily at {time} |
| `calendarSync.schedule.split` | Weekdays {weekday} · Weekends {weekend} |
| `calendarSync.action.subscribe` | Subscribe |
| `calendarSync.action.modify` | Modify |
| `calendarSync.action.switchApp` | Switch App |
| `calendarSync.action.unsubscribe` | Unsubscribe |
| `calendarSync.handoffNotice` | Tapping Subscribe will open {app}. Tap Allow when prompted to add the feed. |
| `calendarSync.state1.chooseFeed` | Choose a feed |
| `calendarSync.state1.calendarAppLabel` | Calendar app |
| `calendarSync.state1.yourCalendarApp` | your Calendar app |
| `calendarSync.state1.scheduleTime` | Schedule time |
| `calendarSync.state1.weekdaysLabel` | Mon &ndash; Fri |
| `calendarSync.state1.allDaysLabel` | All days |
| `calendarSync.state1.weekendToggle` | Different time on weekends |
| `calendarSync.state1.weekendLabel` | Sat &amp; Sun |
| `calendarSync.options.activeSyncs` | ACTIVE SYNCS |
| `calendarSync.options.noSyncs` | No calendar syncs yet — add one below. |
| `calendarSync.options.getHelp` | Get Help |
| `calendarSync.options.getHelpSub` | Troubleshooting &amp; tips |
| `calendarSync.getHelp.title` | Troubleshooting |
| `calendarSync.getHelp.item1` | Wait a minute — Calendar can take a moment to sync after adding a new feed. |
| `calendarSync.getHelp.item2` | Open the Calendar app directly and pull down to refresh. |
| `calendarSync.getHelp.item3` | Make sure the Plant Care calendar is visible — tap Calendars at the bottom and check it's enabled. |
| `calendarSync.getHelp.item4` | If you don't see events after subscribing, check that the calendar is checked/visible in your calendar app's list. |
| `calendarSync.switch.title` | Switch calendar app |
| `calendarSync.switch.intro` | First remove the current {scope} feed from {app}, then pick the new app and subscribe again. |
| `calendarSync.unsubscribe.body` | To stop these events, remove the feed from your calendar app: |
| `calendarSync.unsubscribe.confirm` | I've removed it |
| `calendarSync.removeFeed.google` | In Google Calendar, open <strong>Settings &rarr; the Plant Care calendar</strong> and choose <strong>Unsubscribe</strong>. This only removes the calendar feed, not your Plant Care account. |
| `calendarSync.removeFeed.apple` | Go to <strong>Settings &rarr; Calendar &rarr; Accounts</strong>, find the Plant Care feed, and tap <strong>Delete Account</strong> — this only removes the calendar feed, not your Plant Care account. |
| `calendarSync.copied` | Copied! |
| `calendarSync.toast.loading` | Loading household data… please try again in a moment. |
| `calendarSync.aria.back` | Back |
| `calendarSync.aria.close` | Close |

### `home` (27)

| Key | English value |
|-----|---------------|
| `home.householdFallback` | My Household |
| `home.yourHouseholds` | Your households |
| `home.manageHouseholds` | Manage households |
| `home.tabPlants` | My Plants |
| `home.tabCaring` | Caring |
| `home.emptyTitle` | Your plants live here |
| `home.emptySub` | Add a plant to start tracking its care. |
| `home.myPlants` | My plants |
| `home.allGood` | All good |
| `home.moreTasksAria` | {n} more |
| `home.addPlant` | Add Plant |
| `home.needsAttention` | Needs Attention Today |
| `home.allDoneToday` | All done for today! |
| `home.recentActivity` | Recent activity |
| `home.viewMore` | View more |
| `home.activityEmpty` | Care actions will appear here |
| `home.aria.reportBug` | Report a bug |
| `home.aria.markDone` | Mark done |
| `home.aria.addNote` | Add note |
| `home.aria.resume` | Resume |
| `home.aria.dismiss` | Dismiss |
| `home.lastCare` | Last care: |
| `home.unnamedHousehold` | Household |
| `home.unknownAuthor` | Unknown |
| `home.authorFallback` | Someone |
| `home.taskFallback` | task |
| `home.careFallback` | care |

### `caring` (6)

| Key | English value |
|-----|---------------|
| `caring.doneToday` | Done today |
| `caring.emptyTitle` | Where care happens |
| `caring.emptySub` | Overdue and upcoming tasks will appear here. |
| `caring.upcoming` | Upcoming |
| `caring.allClear` | All clear |
| `caring.noTasksToday` | No tasks today |

### `plantDetail` (27)

| Key | English value |
|-----|---------------|
| `plantDetail.aria.editPlant` | Edit plant |
| `plantDetail.tabSummary` | Summary |
| `plantDetail.tabTasks` | Tasks |
| `plantDetail.tabNotes` | Notes |
| `plantDetail.tabCareLog` | Care Log |
| `plantDetail.addTask` | Add task |
| `plantDetail.aria.addFab` | Add |
| `plantDetail.summary.homeTitle` | Your {name} is home |
| `plantDetail.summary.emptySub` | Add a task to start tracking its care. Your progress will show up here. |
| `plantDetail.summary.daysOfCare` | days of care |
| `plantDetail.summary.homeSince` | Home since {date} |
| `plantDetail.summary.arrivalPromptSub` | Set an arrival date to start tracking days of care. |
| `plantDetail.summary.photoTimeline` | Photo timeline |
| `plantDetail.summary.photoCount` | {n} photos · tap to view |
| `plantDetail.summary.needsAttention` | Needs attention today |
| `plantDetail.summary.noUpcoming` | No upcoming tasks |
| `plantDetail.summary.noActivity` | No activity yet |
| `plantDetail.tasks.emptyTitle` | No tasks yet |
| `plantDetail.tasks.emptySub` | Add a care task to start tracking what your {name} needs. |
| `plantDetail.tasks.noneForFilter` | No tasks for selected users |
| `plantDetail.tasks.listHeader` | Task list |
| `plantDetail.notes.emptyTitle` | No notes yet |
| `plantDetail.notes.emptySub` | Jot down observations about your {name} — growth, health, anything worth remembering. Tap the button below to add one. |
| `plantDetail.notes.noneForFilter` | No notes for selected users |
| `plantDetail.careLog.emptyTitle` | Your plant's care history |
| `plantDetail.careLog.emptySub` | Your completed tasks and notes will appear here. |
| `plantDetail.careLog.skipped` | Skipped |

### `taskCard` (4)

| Key | English value |
|-----|---------------|
| `taskCard.paused` | Paused |
| `taskCard.done` | Done |
| `taskCard.plusNote` | + Note |
| `taskCard.resume` | Resume |

### `manageHouseholds` (13)

| Key | English value |
|-----|---------------|
| `manageHouseholds.title` | Manage Households |
| `manageHouseholds.yourHousehold` | Your household |
| `manageHouseholds.editName` | Edit Name |
| `manageHouseholds.membersLabel` | Members |
| `manageHouseholds.unknownMember` | Unknown |
| `manageHouseholds.role` | Member |
| `manageHouseholds.youBadge` | YOU |
| `manageHouseholds.activityTitle` | Household activity |
| `manageHouseholds.noActivity` | No activity yet. |
| `manageHouseholds.noActivityFiltered` | No activity yet for selected users. |
| `manageHouseholds.careFallback` | Care |
| `manageHouseholds.memberCount.one` | {n} member |
| `manageHouseholds.memberCount.other` | {n} members |

### `notes` (15)

| Key | English value |
|-----|---------------|
| `notes.postTask.title` | Add a note |
| `notes.optional` | Optional |
| `notes.placeholder` | Describe what you observed... |
| `notes.addPhoto` | Add photo |
| `notes.postTask.skip` | Skip |
| `notes.saveNote` | Save note |
| `notes.addNote.title` | Add Note |
| `notes.coach.title` | Match your last photo |
| `notes.coach.body` | Use the same angle/distance. Helps to see progress! |
| `notes.coach.bodyAlt` | Same angle helps track progress! |
| `notes.editNote.subtitle` | Edit note |
| `notes.deleteNote` | Delete note |
| `notes.noteTaskMeta` | after {task} |
| `notes.saving` | Saving… |
| `notes.editTooltip` | Edit |

### `photos` (15)

| Key | English value |
|-----|---------------|
| `photos.tapToChange` | Tap to change |
| `photos.lastPhoto` | Last photo |
| `photos.aria.close` | Close |
| `photos.aria.previous` | Previous |
| `photos.aria.next` | Next |
| `photos.slideshow.noteLabel` | NOTE |
| `photos.slideshow.count` | {current} of {total} |
| `photos.noNote` | No note added. |
| `photos.cap.title` | Photo limit reached |
| `photos.cap.body` | Each plant can have up to {cap} photos. To add a new one, you'll need to remove an existing photo first. |
| `photos.cap.deleteOldest` | Delete oldest photo |
| `photos.managePhotos` | Manage photos |
| `photos.loading` | Loading… |
| `photos.noPhotos` | No photos yet. |
| `photos.delete` | Delete |

### `editPlant` (14)

| Key | English value |
|-----|---------------|
| `editPlant.setDate` | Set date |
| `editPlant.sublabelPhoto` | Tap Change to retake, pick a new one, or use an icon |
| `editPlant.sublabelEmoji` | Tap Change to pick a new icon or add a photo |
| `editPlant.iconLabel` | PLANT ICON |
| `editPlant.plantIcon` | Plant icon |
| `editPlant.change` | Change |
| `editPlant.nameLabel` | NAME |
| `editPlant.namePlaceholder` | Plant name |
| `editPlant.arrivalDateLabel` | ARRIVAL DATE |
| `editPlant.whenArrive` | When did it arrive home? |
| `editPlant.deletePlant` | Delete plant |
| `editPlant.deleteConfirmBody` | This will permanently delete the plant and all its tasks, notes, and care history. This cannot be undone. |
| `editPlant.deleteConfirmYes` | Yes, delete forever |
| `editPlant.saveChanges` | Save changes |

### `emojiPicker` (1)

| Key | English value |
|-----|---------------|
| `emojiPicker.pastePlaceholder` | Or paste custom emoji |

### `status` (35)

| Key | English value |
|-----|---------------|
| `status.recurrence.oneOff` | One-off |
| `status.recurrence.noDaysSet` | No days set |
| `status.recurrence.daysOfWeek` | Days of week |
| `status.recurrence.everyWeekdays` | Every {days} |
| `status.recurrence.everyYearOn` | Every year on {month} {day} |
| `status.recurrence.everyYear` | Every year |
| `status.recurrence.everyDays.one` | Every {n} day |
| `status.recurrence.everyDays.other` | Every {n} days |
| `status.badge.done` | Done |
| `status.badge.inDaysOneOff.one` | In {n} day — one-off |
| `status.badge.inDaysOneOff.other` | In {n} days — one-off |
| `status.badge.dueTodayOneOff` | Due today — one-off |
| `status.badge.overdueOneOff` | Overdue — one-off |
| `status.badge.dueTodayNeverDone` | Due today — never done |
| `status.badge.daysOverdue.one` | {n} day overdue{manual} |
| `status.badge.daysOverdue.other` | {n} days overdue{manual} |
| `status.badge.dueToday` | Due today{manual} |
| `status.badge.dueTomorrow` | Due tomorrow{manual} |
| `status.badge.inDays` | In {n} days{manual} |
| `status.badge.manualSuffix` |  (manual) |
| `status.lastDone.never` | Never done |
| `status.lastDone.yesterday` | Done yesterday |
| `status.lastDone.daysAgo` | Done {n} days ago |
| `status.home.daysLate.one` | {n} day late |
| `status.home.daysLate.other` | {n} days late |
| `status.home.dueToday` | due today |
| `status.pill.overdue` | {n} overdue |
| `status.pill.dueToday` | {n} due today |
| `status.row.doneToday` | ✓ done today |
| `status.row.done` | ✓ done |
| `status.row.dueDate` | due {date} |
| `status.row.dueTomorrow` | due tomorrow |
| `status.row.dueToday` | due today |
| `status.row.overdue` | overdue |
| `status.row.dueInDays` | due in {n} days |

### `relativeTime` (17)

| Key | English value |
|-----|---------------|
| `relativeTime.today` | Today |
| `relativeTime.yesterday` | Yesterday |
| `relativeTime.someTimeAgo` | some time ago |
| `relativeTime.daysAgo.one` | {n} day ago |
| `relativeTime.daysAgo.other` | {n} days ago |
| `relativeTime.activity.justNow` | Just now |
| `relativeTime.activity.minutesAgo` | {n}m ago |
| `relativeTime.activity.hoursAgo` | {n}h ago |
| `relativeTime.arrival.aboutAWeek` | About a week ago |
| `relativeTime.arrival.weeksAgo.one` | {n} week ago |
| `relativeTime.arrival.weeksAgo.other` | {n} weeks ago |
| `relativeTime.arrival.aboutAMonth` | About a month ago |
| `relativeTime.arrival.monthsAgo.one` | {n} month ago |
| `relativeTime.arrival.monthsAgo.other` | {n} months ago |
| `relativeTime.arrival.aboutAYear` | About a year ago |
| `relativeTime.arrival.yearsAgo.one` | About {n} year ago |
| `relativeTime.arrival.yearsAgo.other` | About {n} years ago |

### `reschedule` (23)

| Key | English value |
|-----|---------------|
| `reschedule.keepOriginal.title` | Keep Original Schedule |
| `reschedule.acceptModified.title` | Accept Modified Schedule |
| `reschedule.todayIs` | Today is {date} |
| `reschedule.nextDue` | Next due: {date} |
| `reschedule.summaryDue` | due {date} |
| `reschedule.recurrenceEveryDays.one` | Every {n} day |
| `reschedule.recurrenceEveryDays.other` | Every {n} days |
| `reschedule.runningLate.one` | Running {n} day late |
| `reschedule.runningLate.other` | Running {n} days late |
| `reschedule.daysEarly.one` | {n} day early |
| `reschedule.daysEarly.other` | {n} days early |
| `reschedule.deltaLater.one` | → {n} day later |
| `reschedule.deltaLater.other` | → {n} days later |
| `reschedule.deltaEarlier.one` | ← {n} day earlier |
| `reschedule.deltaEarlier.other` | ← {n} days earlier |
| `reschedule.legend.missed` | Missed |
| `reschedule.legend.nextOccurrences` | Next occurrences |
| `reschedule.yearly.everyYearOn` | Every year on {anchor} |
| `reschedule.yearly.runningLate.one` | Running {n} day late |
| `reschedule.yearly.runningLate.other` | Running {n} days late |
| `reschedule.yearly.runningEarly.one` | Running {n} day early |
| `reschedule.yearly.runningEarly.other` | Running {n} days early |
| `reschedule.yearly.moveAnchor` | Move anchor to {date} every year |

### `dialog` (11)

| Key | English value |
|-----|---------------|
| `dialog.confirmDeleteTask` | Permanently delete this task? This cannot be undone. |
| `dialog.confirmDeleteNote` | Delete this note? |
| `dialog.confirmDeletePhoto` | Delete this photo? |
| `dialog.confirmRemoveRecurrence` | This will remove the recurrence schedule. The task will become a one-off. Continue? |
| `dialog.alertNoteOrPhoto` | Please add a note or photo. |
| `dialog.alertNoteEmpty` | Note cannot be empty. |
| `dialog.alertPlantNameRequired` | Please enter a plant name. |
| `dialog.alertTaskNameRequired` | Please enter a task name. |
| `dialog.alertFrequencyInvalid` | Please enter a valid frequency (minimum 1 day). |
| `dialog.alertWeekdayRequired` | Please select at least one day of the week. |
| `dialog.alertMonthDayRequired` | Please select a month and day. |

### `careVerb` (8)

| Key | English value |
|-----|---------------|
| `careVerb.water` | watered |
| `careVerb.refill` | refilled |
| `careVerb.fertilize` | fertilized |
| `careVerb.check` | checked |
| `careVerb.repot` | repotted |
| `careVerb.prune` | pruned |
| `careVerb.pest` | checked pests on |
| `careVerb.rotate` | rotated |

### `activityFeed` (5)

| Key | English value |
|-----|---------------|
| `activityFeed.care` | {actor} {verb} {plant} |
| `activityFeed.skipped` | {actor} skipped {task} |
| `activityFeed.careOther` | {actor} · {task} — {plant} |
| `activityFeed.noteOn` | {actor} on {plant} |
| `activityFeed.noteAdded` | {actor} added a note |

## 3. Flagged clusters

### 3a. Plural pairs (`tn()` `.one`/`.other`) — 17 pairs

| Base | `.one` | `.other` |
|------|--------|----------|
| `taskSheet.recSummary.everyDays` | recurs every {n} day | recurs every {n} days |
| `status.recurrence.everyDays` | Every {n} day | Every {n} days |
| `status.badge.inDaysOneOff` | In {n} day — one-off | In {n} days — one-off |
| `status.badge.daysOverdue` | {n} day overdue{manual} | {n} days overdue{manual} |
| `status.home.daysLate` | {n} day late | {n} days late |
| `manageHouseholds.memberCount` | {n} member | {n} members |
| `relativeTime.daysAgo` | {n} day ago | {n} days ago |
| `relativeTime.arrival.weeksAgo` | {n} week ago | {n} weeks ago |
| `relativeTime.arrival.monthsAgo` | {n} month ago | {n} months ago |
| `relativeTime.arrival.yearsAgo` | About {n} year ago | About {n} years ago |
| `reschedule.recurrenceEveryDays` | Every {n} day | Every {n} days |
| `reschedule.runningLate` | Running {n} day late | Running {n} days late |
| `reschedule.daysEarly` | {n} day early | {n} days early |
| `reschedule.deltaLater` | → {n} day later | → {n} days later |
| `reschedule.deltaEarlier` | ← {n} day earlier | ← {n} days earlier |
| `reschedule.yearly.runningLate` | Running {n} day late | Running {n} days late |
| `reschedule.yearly.runningEarly` | Running {n} day early | Running {n} days early |

### 3b. `careVerb.*` verbs + `activityFeed.*` sentence frames

**careVerb.\*** (3rd-person singular past, actor-subject; resolved via `careVerb(taskType)`):

| Key | English value |
|-----|---------------|
| `careVerb.water` | watered |
| `careVerb.refill` | refilled |
| `careVerb.fertilize` | fertilized |
| `careVerb.check` | checked |
| `careVerb.repot` | repotted |
| `careVerb.prune` | pruned |
| `careVerb.pest` | checked pests on |
| `careVerb.rotate` | rotated |

**activityFeed.\*** (sentence frames that consume `{verb}` etc.):

| Key | English value |
|-----|---------------|
| `activityFeed.care` | {actor} {verb} {plant} |
| `activityFeed.skipped` | {actor} skipped {task} |
| `activityFeed.careOther` | {actor} · {task} — {plant} |
| `activityFeed.noteOn` | {actor} on {plant} |
| `activityFeed.noteAdded` | {actor} added a note |

### 3c. Date-name arrays (constants, not in the dictionary yet)

| Array | Contents |
|-------|----------|
| `WEEKDAY_NAMES` (2-letter min) | `Su`, `Mo`, `Tu`, `We`, `Th`, `Fr`, `Sa` |
| `WEEKDAY_NAMES_ABBR` (3-letter) | `Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat` |
| `MONTH_NAMES` (full) | `January`, `February`, `March`, `April`, `May`, `June`, `July`, `August`, `September`, `October`, `November`, `December` |

Derived forms in source: none found — no `.toUpperCase()` applied to these arrays. `SEL_MONTH_NAMES` and `YEARLY_MONTH_NAMES` are aliases of `MONTH_NAMES`.

### 3d. `TASK_CONFIG` preset display names (English in storage; display-only translation)

| Storage key (stays English) | `name` (display — translate) | `type` | icon |
|-----------------------------|------------------------------|--------|------|
| `normal-water` | Watering | `water` | 💧 |
| `refill-pot` | Refill Self-Watering Pot | `refill` | 🫙 |
| `fertilize` | Fertilize | `fertilize` | 🌱 |
| `check` | Check | `check` | 🔍 |
| `repot` | Repot | `repot` | 🪴 |
| `prune` | Prune | `prune` | ✂️ |
| `check-pests` | Check Pests | `pest` | 🐛 |
| `rotate` | Rotate | `rotate` | 🔄 |

Count: 8 presets.

## 4. Keys with interpolation variables (preserve placeholders intact) — 86 keys

| Key | Placeholders | English value |
|-----|--------------|---------------|
| `onboarding.step.counter` | `{step}` | Step {step} of 3 |
| `onboarding.reminders.blockedBody` | `{path}` | To turn them on: <strong>{path}</strong>. |
| `onboarding.coachmark.demoRow` | `{name}`, `{plant}` | {name} watered {plant} · just now |
| `taskSheet.recSummary.yearlyOn` | `{month}`, `{day}` | Recurs every year on {month} {day} |
| `taskSheet.recSummary.everyDays.one` | `{n}` | recurs every {n} day |
| `taskSheet.recSummary.everyDays.other` | `{n}` | recurs every {n} days |
| `taskSheet.recSummary.everyWeekdays` | `{days}` | recurs every {days} |
| `addPlant.step3.heading` | `{name}` | When did {name} arrive home? |
| `addPlant.step3.addButton` | `{name}` | Add {name} |
| `addPlant.duplicate.title` | `{name}` | You already have a {name} |
| `addPlant.duplicate.body` | `{name}` | Give this one a different name so you can tell them apart — or skip and we'll call it '{name} 2'. |
| `install.steps.tapShare` | `{share}`, `{more}` | Tap the {share} button in the bottom toolbar. If you don't see it, tap {more} first. |
| `install.steps.viewMore` | `{label}` | Tap {label} |
| `install.steps.addToHome` | `{label}` | Scroll down to {label} |
| `install.steps.tapAdd` | `{label}` | Tap {label} |
| `install.steps.openApp` | `{icon}` | Close Safari and open {icon} Plant Care from your Home Screen like a normal app |
| `install.openInSafari.openSafari` | `{label}` | Open the {label} app |
| `menu.toast.markedDone` | `{task}` | {task} done |
| `menu.toast.plantDeleted` | `{name}` | {name} deleted |
| `calendarSync.schedule.daily` | `{time}` | Daily at {time} |
| `calendarSync.schedule.split` | `{weekday}`, `{weekend}` | Weekdays {weekday} · Weekends {weekend} |
| `calendarSync.handoffNotice` | `{app}` | Tapping Subscribe will open {app}. Tap Allow when prompted to add the feed. |
| `calendarSync.switch.intro` | `{scope}`, `{app}` | First remove the current {scope} feed from {app}, then pick the new app and subscribe again. |
| `home.moreTasksAria` | `{n}` | {n} more |
| `plantDetail.summary.homeTitle` | `{name}` | Your {name} is home |
| `plantDetail.summary.homeSince` | `{date}` | Home since {date} |
| `plantDetail.summary.photoCount` | `{n}` | {n} photos · tap to view |
| `plantDetail.tasks.emptySub` | `{name}` | Add a care task to start tracking what your {name} needs. |
| `plantDetail.notes.emptySub` | `{name}` | Jot down observations about your {name} — growth, health, anything worth remembering. Tap the button below to add one. |
| `notes.noteTaskMeta` | `{task}` | after {task} |
| `photos.slideshow.count` | `{current}`, `{total}` | {current} of {total} |
| `photos.cap.body` | `{cap}` | Each plant can have up to {cap} photos. To add a new one, you'll need to remove an existing photo first. |
| `status.recurrence.everyWeekdays` | `{days}` | Every {days} |
| `status.recurrence.everyYearOn` | `{month}`, `{day}` | Every year on {month} {day} |
| `status.recurrence.everyDays.one` | `{n}` | Every {n} day |
| `status.recurrence.everyDays.other` | `{n}` | Every {n} days |
| `status.badge.inDaysOneOff.one` | `{n}` | In {n} day — one-off |
| `status.badge.inDaysOneOff.other` | `{n}` | In {n} days — one-off |
| `status.badge.daysOverdue.one` | `{n}`, `{manual}` | {n} day overdue{manual} |
| `status.badge.daysOverdue.other` | `{n}`, `{manual}` | {n} days overdue{manual} |
| `status.badge.dueToday` | `{manual}` | Due today{manual} |
| `status.badge.dueTomorrow` | `{manual}` | Due tomorrow{manual} |
| `status.badge.inDays` | `{n}`, `{manual}` | In {n} days{manual} |
| `status.lastDone.daysAgo` | `{n}` | Done {n} days ago |
| `status.home.daysLate.one` | `{n}` | {n} day late |
| `status.home.daysLate.other` | `{n}` | {n} days late |
| `status.pill.overdue` | `{n}` | {n} overdue |
| `status.pill.dueToday` | `{n}` | {n} due today |
| `status.row.dueDate` | `{date}` | due {date} |
| `status.row.dueInDays` | `{n}` | due in {n} days |
| `manageHouseholds.memberCount.one` | `{n}` | {n} member |
| `manageHouseholds.memberCount.other` | `{n}` | {n} members |
| `relativeTime.daysAgo.one` | `{n}` | {n} day ago |
| `relativeTime.daysAgo.other` | `{n}` | {n} days ago |
| `relativeTime.activity.minutesAgo` | `{n}` | {n}m ago |
| `relativeTime.activity.hoursAgo` | `{n}` | {n}h ago |
| `relativeTime.arrival.weeksAgo.one` | `{n}` | {n} week ago |
| `relativeTime.arrival.weeksAgo.other` | `{n}` | {n} weeks ago |
| `relativeTime.arrival.monthsAgo.one` | `{n}` | {n} month ago |
| `relativeTime.arrival.monthsAgo.other` | `{n}` | {n} months ago |
| `relativeTime.arrival.yearsAgo.one` | `{n}` | About {n} year ago |
| `relativeTime.arrival.yearsAgo.other` | `{n}` | About {n} years ago |
| `reschedule.todayIs` | `{date}` | Today is {date} |
| `reschedule.nextDue` | `{date}` | Next due: {date} |
| `reschedule.summaryDue` | `{date}` | due {date} |
| `reschedule.recurrenceEveryDays.one` | `{n}` | Every {n} day |
| `reschedule.recurrenceEveryDays.other` | `{n}` | Every {n} days |
| `reschedule.runningLate.one` | `{n}` | Running {n} day late |
| `reschedule.runningLate.other` | `{n}` | Running {n} days late |
| `reschedule.daysEarly.one` | `{n}` | {n} day early |
| `reschedule.daysEarly.other` | `{n}` | {n} days early |
| `reschedule.deltaLater.one` | `{n}` | → {n} day later |
| `reschedule.deltaLater.other` | `{n}` | → {n} days later |
| `reschedule.deltaEarlier.one` | `{n}` | ← {n} day earlier |
| `reschedule.deltaEarlier.other` | `{n}` | ← {n} days earlier |
| `reschedule.yearly.everyYearOn` | `{anchor}` | Every year on {anchor} |
| `reschedule.yearly.runningLate.one` | `{n}` | Running {n} day late |
| `reschedule.yearly.runningLate.other` | `{n}` | Running {n} days late |
| `reschedule.yearly.runningEarly.one` | `{n}` | Running {n} day early |
| `reschedule.yearly.runningEarly.other` | `{n}` | Running {n} days early |
| `reschedule.yearly.moveAnchor` | `{date}` | Move anchor to {date} every year |
| `activityFeed.care` | `{actor}`, `{verb}`, `{plant}` | {actor} {verb} {plant} |
| `activityFeed.skipped` | `{actor}`, `{task}` | {actor} skipped {task} |
| `activityFeed.careOther` | `{actor}`, `{task}`, `{plant}` | {actor} · {task} — {plant} |
| `activityFeed.noteOn` | `{actor}`, `{plant}` | {actor} on {plant} |
| `activityFeed.noteAdded` | `{actor}` | {actor} added a note |

