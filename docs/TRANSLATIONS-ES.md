# TRANSLATIONS.es — Spanish translation (#44f)

**Register:** tú · **Variant:** Neutral Latin American Spanish · **Voice:** warm-but-neutral
**Source of truth:** `i18n-es-worksheet.md` (429 keys, 22 namespaces)
**Status:** in progress — approved namespaces recorded below as they are locked.

## Standing terms (locked — apply consistently across all namespaces)

| English | Spanish |
|---------|---------|
| household | hogar — always "de tu hogar", never "del hogar" |
| Tap | Presiona |
| See (imperative) | Ve |
| just now | recién |
| activity feed | feed de actividad |
| sync / in sync | sincronía / en sincronía |
| watered | regó |
| "live here" (metaphor) | viven aquí |
| Done (finish/confirm button) | Listo _(vs Hecha = task-status label, pending taskCard)_ |
| Add Task | Agregar Tarea |
| Owner | Responsable |
| due / due date | vencimiento / vence family |
| Repeating / recurrence (adj) | recurrente |
| Skip | Omitir |
| Resume | reanudar |
| Delete | Eliminar |
| Remove (undo selection) | Quitar _(vs Eliminar = destructive delete)_ |
| Save | Guardar |
| Back | Atrás |
| Edit | Editar |
| Recurs | Se repite |
| e.g. | ej. |
| icon | ícono (accented, LatAm) |
| weekday recurrence pattern | "los {days}" |
| yearly date order | "{day} de {month}" |
| Pick / Choose | Elige |
| Next | Siguiente |
| home (physical arrival) | casa _(vs hogar = household unit)_ |
| Optional | Opcional |
| plant object-pronoun default | feminine (-la, -las) |
| Sign In / Sign Out | Iniciar Sesión / Cerrar Sesión _(case mirrors source)_ |
| Email | Email _(kept English)_ |
| Password | Contraseña |
| member | miembro |
| admin | administrador |
| Confirm | Confirma |
| common English tech terms | keep where natural (Email, Apps, feed, link) |
| Home Screen | pantalla de inicio _(Apple Spanish)_ |
| Share (iOS button) | Compartir |
| View More (iOS) | Ver Más |
| Add to Home Screen (iOS menu) | Agregar a pantalla de inicio _(literal iOS label — case exception)_ |
| Add (iOS confirm button) | Agregar |
| Paste / Copy | Pega / Copia |
| Scroll | Desplázate |
| Reminders | Recordatorios |
| Undo | Deshacer |
| Could not save | No se pudo guardar |
| Photo limit reached | Límite de fotos alcanzado |
| notification status | Activadas / Desactivadas / Bloqueadas |
| Manage | Administrar |
| track / tracking | registrar |
| Allow (iOS prompt) | Permitir |
| Subscribe / Unsubscribe | Suscribirse / Cancelar suscripción |
| Troubleshooting | Solución de problemas |
| Close | Cerrar |
| Settings | Configuración _(Google)_ / Ajustes _(Apple)_ |
| Caring (tab) | Cuidados |
| **Capitalization rule** | **mirror English case: title case → title case (Spanish connectors lowercase), sentence case → sentence case** |

## Progress

| # | Namespace | Keys | Status |
|---|-----------|-----:|--------|
| 1 | `onboarding` | 36 | ✅ Approved |
| 2 | `taskSheet` | 33 | ✅ Approved |
| 3 | `addPlant` | 27 | ✅ Approved |
| 4 | `auth` | 15 | ✅ Approved |
| 5 | `install` | 18 | ✅ Approved |
| 6 | `menu` | 38 | ✅ Approved |
| 7 | `calendarSync` | 41 | ✅ Approved |
| 8 | `home` | 27 | ✅ Approved |
| 9 | `caring` | 6 | ⏳ Pending |
| 10 | `plantDetail` | 27 | ⏳ Pending |
| 11 | `taskCard` | 4 | ⏳ Pending |
| 12 | `manageHouseholds` | 13 | ⏳ Pending |
| 13 | `notes` | 15 | ⏳ Pending |
| 14 | `photos` | 15 | ⏳ Pending |
| 15 | `editPlant` | 14 | ⏳ Pending |
| 16 | `emojiPicker` | 1 | ⏳ Pending |
| 17 | `status` | 35 | ⏳ Pending |
| 18 | `relativeTime` | 17 | ⏳ Pending |
| 19 | `reschedule` | 23 | ⏳ Pending |
| 20 | `dialog` | 11 | ⏳ Pending |
| 21 | `careVerb` | 8 | ⏳ Pending |
| 22 | `activityFeed` | 5 | ⏳ Pending |

Approved so far: **241 / 429**

---

## 1. `onboarding` (36) ✅

| Key | Spanish |
|-----|---------|
| `onboarding.nameCapture.title` | ¿Cómo quieres que te llamemos? |
| `onboarding.nameCapture.subtitle` | Así te verán los miembros de tu hogar. |
| `onboarding.nameCapture.placeholder` | Tu nombre |
| `onboarding.nameCapture.cta` | Empecemos |
| `onboarding.step.counter` | Paso {step} de 3 |
| `onboarding.banner.label` | Empieza aquí |
| `onboarding.banner.step1` | Agrega una planta para empezar. |
| `onboarding.banner.step1Cta` | + Agregar Planta |
| `onboarding.banner.step2` | Crea una tarea para regar tu planta cada 3 días. |
| `onboarding.banner.step2Cta` | Crea una tarea → |
| `onboarding.banner.step3` | Presiona ✓ Listo abajo para terminar la configuración ↓ |
| `onboarding.inlineTask.markDone` | Marcar como hecha |
| `onboarding.reminders.noteText` | Puedes activar las notificaciones cuando quieras desde el menú. |
| `onboarding.reminders.blockedTitle` | Las notificaciones están desactivadas |
| `onboarding.reminders.blockedBody` | Para activarlas: <strong>{path}</strong>. |
| `onboarding.reminders.blockedPathIos` | Ajustes del iPhone &rarr; Plant Care &rarr; Notificaciones |
| `onboarding.reminders.blockedPathAndroid` | Ajustes de Android &rarr; Apps &rarr; Plant Care &rarr; Notificaciones |
| `onboarding.reminders.title` | Mantente en sincronía con tu hogar |
| `onboarding.reminders.subtitle` | Recibe un aviso cuando alguien complete una tarea de cuidado. |
| `onboarding.reminders.enable` | Activar notificaciones |
| `onboarding.card.maybeLater` | Quizás después |
| `onboarding.calendarCard.noteText` | Puedes sincronizar tus tareas con tu app de Calendario cuando quieras desde el menú. |
| `onboarding.calendarCard.title` | Ve tus tareas en tu calendario |
| `onboarding.calendarCard.subtitle` | Tus tareas de cuidado aparecerán automáticamente como eventos del calendario (un solo evento por día). |
| `onboarding.calendarCard.subscribe` | Configurar sincronización a tu calendario |
| `onboarding.coachmark.demoRow` | {name} regó {plant} · recién |
| `onboarding.coachmark.feedTitle` | Este es el feed de actividad de tu hogar |
| `onboarding.coachmark.feedBody` | Cada acción de cuidado aparece aquí en tiempo real. Olvídate de adivinar "quién hizo qué": todo tu hogar en sincronía. |
| `onboarding.coachmark.gotIt` | Entendido |
| `onboarding.coachmark.youFallback` | Tú |
| `onboarding.coachmark.plantFallback` | tu planta |
| `onboarding.caringCoachmark.title` | Tus tareas diarias viven aquí |
| `onboarding.caringCoachmark.body` | Ve qué necesita atención hoy y qué viene esta semana. |
| `onboarding.tasksBanner.step3` | Presiona ✓ Listo abajo para terminar la configuración |
| `onboarding.addTask.label` | Tu tarea de cuidado |
| `onboarding.addTask.instruction` | Preparamos una tarea de riego por ti. Ajústala o presiona Agregar tarea para continuar. |

---

## 2. `taskSheet` (33) ✅

| Key | Spanish |
|-----|---------|
| `taskSheet.step1.title` | Agregar Tarea |
| `taskSheet.step2.addButton` | Agregar Tarea |
| `taskSheet.type.added` | Agregada |
| `taskSheet.type.custom` | Personalizada |
| `taskSheet.customTask.header` | Tarea Personalizada |
| `taskSheet.field.taskName` | Nombre de la tarea |
| `taskSheet.field.taskNamePlaceholder` | ej. Rociar hojas |
| `taskSheet.field.owner` | Responsable |
| `taskSheet.field.dueDate` | Fecha de vencimiento |
| `taskSheet.field.startFrom` | Comenzar desde |
| `taskSheet.field.firstDueDate` | Primera fecha de vencimiento |
| `taskSheet.field.repeating` | Tarea recurrente |
| `taskSheet.icon.tapToChange` | presiona el ícono para cambiarlo |
| `taskSheet.recurrence.interval` | Cada X días |
| `taskSheet.recurrence.weekdays` | Días de la semana |
| `taskSheet.recurrence.yearly` | Anual |
| `taskSheet.recurrence.daysBetween` | días entre tareas |
| `taskSheet.pause.label` | Pausar tarea |
| `taskSheet.pause.subtitle` | Omitir hasta reanudar |
| `taskSheet.delete` | Eliminar tarea |
| `taskSheet.cancel` | Cancelar |
| `taskSheet.back` | Atrás |
| `taskSheet.saveChanges` | Guardar Cambios |
| `taskSheet.recSummary.yearlyLeap` | Se repite cada año el 29 de feb (1 de mar en años no bisiestos) |
| `taskSheet.recSummary.yearlyOn` | Se repite cada año el {day} de {month} |
| `taskSheet.recSummary.everyDays.one` | se repite cada {n} día |
| `taskSheet.recSummary.everyDays.other` | se repite cada {n} días |
| `taskSheet.recSummary.everyWeekdays` | se repite los {days} |
| `taskSheet.recSummary.started` | Comenzó |
| `taskSheet.recSummary.starts` | Comienza |
| `taskSheet.recSummary.firstOccurrence` | Primera vez: |
| `taskSheet.overdueSheet.skip` | Omitir esta vez |
| `taskSheet.overdueSheet.editTask` | Editar tarea |

---

## 3. `addPlant` (27) ✅

| Key | Spanish |
|-----|---------|
| `addPlant.step1.title` | Elige un ícono |
| `addPlant.step1.subtitle` | Elige uno que se parezca a la tuya |
| `addPlant.tab.all` | Todos (35) |
| `addPlant.tab.foliage` | 🌿 Follaje |
| `addPlant.tab.flowers` | 🌸 Flores |
| `addPlant.tab.edibles` | 🍋 Comestibles |
| `addPlant.photo.divider` | ¿ninguno se parece a la tuya? |
| `addPlant.photo.added` | Foto agregada |
| `addPlant.photo.usedAsIcon` | Se usará como el ícono de tu planta |
| `addPlant.photo.remove` | Quitar |
| `addPlant.photo.addInstead` | Mejor agrega una foto |
| `addPlant.photo.later` | También puedes hacer esto después desde la página de la planta |
| `addPlant.done` | Listo |
| `addPlant.next` | Siguiente → |
| `addPlant.step2.heading` | Ponle un nombre |
| `addPlant.step2.subtext` | Siempre puedes cambiarlo después |
| `addPlant.step2.nameLabel` | Nombre |
| `addPlant.step2.namePlaceholder` | ej. Monstera |
| `addPlant.step2.nameHint` | La verde, La grande… |
| `addPlant.step3.heading` | ¿Cuándo llegó {name} a casa? |
| `addPlant.step3.subtext` | Te mostraremos cuánto tiempo llevas cuidándola. |
| `addPlant.arrivalDate.label` | Fecha de llegada |
| `addPlant.arrivalDate.optional` | Opcional — puedes omitir esto |
| `addPlant.step3.addButton` | Agregar {name} |
| `addPlant.duplicate.title` | Ya tienes una {name} |
| `addPlant.duplicate.body` | Ponle un nombre distinto para diferenciarlas — o omite y la llamaremos '{name} 2'. |
| `addPlant.duplicate.altPlaceholder` | Nombre alternativo… |

---

## 4. `auth` (15) ✅

| Key | Spanish |
|-----|---------|
| `auth.error.title` | No se pudo cargar el hogar |
| `auth.error.signOut` | Cerrar sesión |
| `auth.error.noHousehold` | Tu cuenta no está asociada a ningún hogar. Contacta al administrador de tu hogar. |
| `auth.error.notMember` | No apareces como miembro de este hogar. |
| `auth.login.emailPlaceholder` | Email |
| `auth.login.passwordPlaceholder` | Contraseña |
| `auth.login.signIn` | Iniciar Sesión |
| `auth.reset.title` | Establecer Nueva Contraseña |
| `auth.reset.newPasswordPlaceholder` | Nueva contraseña |
| `auth.reset.confirmPasswordPlaceholder` | Confirma la nueva contraseña |
| `auth.reset.save` | Guardar |
| `auth.reset.errorTooShort` | La contraseña debe tener al menos 6 caracteres. |
| `auth.reset.errorMismatch` | Las contraseñas no coinciden. |
| `auth.reset.successTitle` | Contraseña Actualizada |
| `auth.reset.successBody` | Tu contraseña se ha actualizado. Redirigiendo al inicio de sesión… |

---

## 5. `install` (18) ✅

| Key | Spanish |
|-----|---------|
| `install.takeover.title` | Instala Plant Care |
| `install.takeover.lead` | Agrégala a tu pantalla de inicio para empezar. |
| `install.steps.tapShare` | Presiona el botón {share} en la barra inferior. Si no lo ves, presiona {more} primero. |
| `install.steps.shareLabel` | Compartir |
| `install.steps.viewMore` | Presiona {label} |
| `install.steps.viewMoreLabel` | Ver Más |
| `install.steps.addToHome` | Desplázate hasta {label} |
| `install.steps.addToHomeLabel` | Agregar a pantalla de inicio ➕ |
| `install.steps.tapAdd` | Presiona {label} |
| `install.steps.addLabel` | Agregar |
| `install.steps.openApp` | Cierra Safari y abre {icon} Plant Care desde tu pantalla de inicio como una app normal |
| `install.openInSafari.title` | Abre en Safari |
| `install.openInSafari.lead` | Plant Care solo se puede instalar desde Safari. Para continuar: |
| `install.openInSafari.copyLink` | Copia este link: |
| `install.openInSafari.openSafari` | Abre la app {label} |
| `install.openInSafari.safariLabel` | Safari |
| `install.openInSafari.paste` | Pega el link y sigue los pasos de instalación |
| `install.openInSafari.footer` | Esta pantalla permanece hasta que instales la app. |

---

## 6. `menu` (38) ✅

| Key | Spanish |
|-----|---------|
| `menu.section.profile` | Perfil |
| `menu.section.reminders` | Recordatorios y Notificaciones |
| `menu.section.account` | Cuenta |
| `menu.item.syncCalendar` | Sincronizar con el Calendario |
| `menu.item.changePassword` | Cambiar Contraseña |
| `menu.item.signOut` | Cerrar Sesión |
| `menu.notifications.label` | Notificaciones |
| `menu.notifications.blocked` | Bloqueadas |
| `menu.notifications.on` | Activadas |
| `menu.notifications.off` | Desactivadas |
| `menu.notifications.body` | Recibe un aviso en tu teléfono cuando alguien de tu hogar complete una tarea de cuidado. |
| `menu.notifications.enable` | Activar |
| `menu.changePassword.newLabel` | Nueva contraseña |
| `menu.changePassword.newPlaceholder` | Al menos 8 caracteres |
| `menu.changePassword.confirmLabel` | Confirma la contraseña |
| `menu.changePassword.confirmPlaceholder` | Repite la nueva contraseña |
| `menu.changePassword.errorTooShort` | La contraseña debe tener al menos 8 caracteres. |
| `menu.toast.markedDone` | {task} hecha |
| `menu.toast.addNotePrompt` | ¿Agregar una nota? |
| `menu.toast.undo` | Deshacer |
| `menu.toast.noteAdded` | Nota agregada |
| `menu.toast.couldNotSaveTapRetry` | No se pudo guardar — presiona Guardar para reintentar |
| `menu.toast.couldNotSavePleaseRetry` | No se pudo guardar — inténtalo de nuevo |
| `menu.toast.householdNameUpdated` | &#10003; Nombre de tu hogar actualizado |
| `menu.toast.passwordUpdated` | &#128274; ¡Contraseña actualizada! |
| `menu.toast.couldNotLoadImage` | No se pudo cargar la imagen |
| `menu.toast.photoLimitReached` | Límite de fotos alcanzado — administra las fotos primero |
| `menu.toast.couldNotSavePhoto` | No se pudo guardar la foto |
| `menu.toast.couldNotFindPhoto` | No se pudo encontrar la foto |
| `menu.toast.plantSaved` | ✅ ¡Planta guardada! |
| `menu.toast.plantAdded` | 🌱 ¡Planta agregada! |
| `menu.toast.taskAdded` | ✅ ¡Tarea agregada! |
| `menu.toast.taskSaved` | ✅ ¡Tarea guardada! |
| `menu.toast.taskDeleted` | 🗑️ ¡Tarea eliminada! |
| `menu.toast.plantDeleted` | {name} eliminada |
| `menu.toast.notificationsEnabled` | Notificaciones activadas |
| `menu.toast.notificationsEnabledBang` | 🔔 ¡Notificaciones activadas! |
| `menu.toast.notificationsNotEnabled` | No se activaron las notificaciones |

---

## 7. `calendarSync` (41) ✅

| Key | Spanish |
|-----|---------|
| `calendarSync.intro` | Las tareas aparecen como un evento en tu app de calendario. |
| `calendarSync.scope.my` | Mis tareas |
| `calendarSync.scope.all` | Todas las tareas |
| `calendarSync.scope.myBlurb` | Solo las tareas asignadas a ti. |
| `calendarSync.scope.allBlurb` | Todas las tareas de tu hogar. |
| `calendarSync.app.google` | Google Calendar |
| `calendarSync.app.apple` | Apple Calendar |
| `calendarSync.schedule.daily` | Todos los días a las {time} |
| `calendarSync.schedule.split` | Semana (Lun-Vie) {weekday} · Fin de semana {weekend} |
| `calendarSync.action.subscribe` | Suscribirse |
| `calendarSync.action.modify` | Modificar |
| `calendarSync.action.switchApp` | Cambiar de App |
| `calendarSync.action.unsubscribe` | Cancelar suscripción |
| `calendarSync.handoffNotice` | Al presionar Suscribirse se abrirá {app}. Presiona Permitir cuando se te pida agregar el feed. |
| `calendarSync.state1.chooseFeed` | Elige un feed |
| `calendarSync.state1.calendarAppLabel` | App de calendario |
| `calendarSync.state1.yourCalendarApp` | tu app de calendario |
| `calendarSync.state1.scheduleTime` | Hora programada |
| `calendarSync.state1.weekdaysLabel` | Lun &ndash; Vie |
| `calendarSync.state1.allDaysLabel` | Todos los días |
| `calendarSync.state1.weekendToggle` | Horario distinto los fines de semana |
| `calendarSync.state1.weekendLabel` | Sáb &amp; Dom |
| `calendarSync.options.activeSyncs` | SINCRONIZACIONES ACTIVAS |
| `calendarSync.options.noSyncs` | Aún no hay sincronizaciones — agrega una abajo. |
| `calendarSync.options.getHelp` | Obtener Ayuda |
| `calendarSync.options.getHelpSub` | Solución de problemas y consejos |
| `calendarSync.getHelp.title` | Solución de problemas |
| `calendarSync.getHelp.item1` | Espera un momento — el calendario puede tardar un poco en sincronizar después de agregar un feed nuevo. |
| `calendarSync.getHelp.item2` | Abre la app de calendario directamente y desliza hacia abajo para actualizar. |
| `calendarSync.getHelp.item3` | Asegúrate de que el calendario de Plant Care esté visible — presiona Calendarios abajo y verifica que esté activado. |
| `calendarSync.getHelp.item4` | Si no ves eventos después de suscribirte, verifica que el calendario esté marcado/visible en la lista de tu app de calendario. |
| `calendarSync.switch.title` | Cambiar de app de calendario |
| `calendarSync.switch.intro` | Primero elimina el feed {scope} actual de {app}, luego elige la nueva app y suscríbete de nuevo. |
| `calendarSync.unsubscribe.body` | Para detener estos eventos, elimina el feed de tu app de calendario: |
| `calendarSync.unsubscribe.confirm` | Ya lo eliminé |
| `calendarSync.removeFeed.google` | En Google Calendar, abre <strong>Configuración &rarr; el calendario de Plant Care</strong> y elige <strong>Cancelar suscripción</strong>. Esto solo elimina el feed del calendario, no tu cuenta de Plant Care. |
| `calendarSync.removeFeed.apple` | Ve a <strong>Ajustes &rarr; Calendario &rarr; Cuentas</strong>, busca el feed de Plant Care y presiona <strong>Eliminar cuenta</strong> — esto solo elimina el feed del calendario, no tu cuenta de Plant Care. |
| `calendarSync.copied` | ¡Copiado! |
| `calendarSync.toast.loading` | Cargando datos de tu hogar… inténtalo de nuevo en un momento. |
| `calendarSync.aria.back` | Atrás |
| `calendarSync.aria.close` | Cerrar |

---

## 8. `home` (27) ✅

| Key | Spanish |
|-----|---------|
| `home.householdFallback` | Mi hogar |
| `home.yourHouseholds` | Tus hogares |
| `home.manageHouseholds` | Administrar hogares |
| `home.tabPlants` | Mis plantas |
| `home.tabCaring` | Cuidados |
| `home.emptyTitle` | Tus plantas viven aquí |
| `home.emptySub` | Agrega una planta para empezar a registrar su cuidado. |
| `home.myPlants` | Mis plantas |
| `home.allGood` | Todo bien |
| `home.moreTasksAria` | {n} más |
| `home.addPlant` | Agregar Planta |
| `home.needsAttention` | Necesita Atención Hoy |
| `home.allDoneToday` | ¡Todo Listo por Hoy! |
| `home.recentActivity` | Actividad Reciente |
| `home.viewMore` | Ver Más |
| `home.activityEmpty` | Las acciones de cuidado aparecerán aquí |
| `home.aria.reportBug` | Reportar un error |
| `home.aria.markDone` | Marcar como hecha |
| `home.aria.addNote` | Agregar nota |
| `home.aria.resume` | Reanudar |
| `home.aria.dismiss` | Descartar |
| `home.lastCare` | Último cuidado: |
| `home.unnamedHousehold` | Hogar |
| `home.unknownAuthor` | Desconocido |
| `home.authorFallback` | Alguien |
| `home.taskFallback` | tarea |
| `home.careFallback` | cuidado |

---

## Open agreement notes (revisit when the relevant namespace comes up)

- **`activityFeed.care` — "Tú regó {plant}" agreement wrinkle.** `youFallback` ("Tú") slots into `{actor}`, but the verb is fixed 3rd-person. Decide at `activityFeed`.
- **`taskCard.done`** — "Done" as task-status → likely **Hecha** (vs Listo for buttons). Confirm at `taskCard`.
- **`status.recurrence.everyYearOn`** — apply "{day} de {month}" reorder.
- **`status.recurrence.everyWeekdays`** — apply "los {days}" pattern.
- **Month abbreviations** (feb, mar…) — lowercase, must match `taskSheet.recSummary.yearlyLeap` when translating `MONTH_NAMES`.
- **`calendarSync.switch.intro` {scope} interpolation** — renders awkwardly in both languages ("el feed Mis tareas actual"); QA-pass item, not a translation fix.
- **`home.recentActivity` vs feed de actividad** — section header uses "Actividad Reciente"; the feed concept stays "feed de actividad."
- **CTA voice** — verb CTAs imperative (Agrega, Crea).
- **Capitalization audit applied July 14, 2026** — all title-case English strings mirrored in Spanish; iOS literal-label exception on `install.steps.addToHomeLabel`.
