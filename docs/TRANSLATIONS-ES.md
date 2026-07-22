# TRANSLATIONS.es — Spanish translation (#44f)

**Register:** tú · **Variant:** Neutral Latin American Spanish · **Voice:** warm-but-neutral
**Source of truth:** `i18n-es-worksheet.md` (worksheet base 429 keys, 22 namespaces) + deltas below → live dictionary **440**
**Status:** ✅ COMPLETE — all namespaces + date-name arrays + TASK_CONFIG presets translated and approved. **Dictionary now 440 keys** (EN↔ES parity **440/440**). **Lineage:** approved namespace baseline **432** (tabled below; July 22 content delta — `activityFeed.careSelf` removed via decision B / #44f-feedName, −1; `confirmComplete.*` trio added via #435, +3) → **+1** `menu.language` (#44g) → **+7** `taskSheet` recurrence-summary keys (#440) = **440**. **Updated:** 2026-07-22.

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
| Done (finish/confirm button) | Listo _(button sense only)_ |
| Done / completed (task-status) | Realizada _(app-wide completion word — realizar family; NOT "hecha")_ |
| Mark done (action/aria) | Marcar realizada |
| Add Task | Agregar Tarea |
| Owner | Responsable |
| due / due date | vencimiento / vence family |
| Repeating / recurrence (adj) | recurrente |
| Skip | Omitir |
| Skipped (task-status) | Omitida |
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
| Caring (tab) | Cuidar |
| Care Log / care history | Historial / historial de cuidados |
| completed (tasks) | realizadas _(realizar family — unified completion word app-wide)_ |
| selected users | usuarios seleccionados |
| "No … yet" | Aún no hay… |
| pending (tasks, generic) | pendientes |
| Photo timeline | Photo timeline _(kept English — one-off feature label)_ |
| "This cannot be undone" | Esta acción es irreversible _(delete confirmations)_ |
| take a photo | sacar (una foto) |
| Remove (photos context) | Eliminar _(real deletion; Quitar only for undoing a pending selection)_ |
| overdue (state) | Vencida / vencida |
| overdue duration / late | de retraso |
| early | de adelanto |
| due today / tomorrow / {date} | vence hoy / vence mañana / vence {date} |
| One-off | Única vez |
| {manual} suffix | " (manual)" _(untranslated, leading space preserved)_ |
| "done N days ago" | Realizada hace {n} días |
| "N ago" | hace {n}… construction |
| "About a [period] ago" | Hace [period] aprox. |
| Schedule (recurrence) | Programa _(vs Calendario = calendar app)_ |
| Missed (occurrence) | No realizada _(vs Omitida = skipped)_ |
| anchor (yearly) | fecha base |
| later / earlier | después / antes |
| "Please" (in alerts) | dropped _(imperative register)_ |
| enter (form input) / select | Ingresa / Selecciona |
| note creation | crear una nota |
| months | init caps (Enero, Febrero…); abbreviations Feb/Mar also capitalized |
| **Capitalization rule** | **mirror English case: title case → title case (Spanish connectors lowercase), sentence case → sentence case** |

## Progress

| # | Namespace | Keys | Status |
|---|-----------|-----:|--------|
| 1 | `onboarding` | 36 | ✅ Approved |
| 2 | `taskSheet` | 40 | ✅ Approved _(+7 recurrence-summary keys — #440)_ |
| 3 | `addPlant` | 27 | ✅ Approved |
| 4 | `auth` | 15 | ✅ Approved |
| 5 | `install` | 18 | ✅ Approved |
| 6 | `menu` | 39 | ✅ Approved _(+1 `menu.language` — #44g)_ |
| 7 | `calendarSync` | 41 | ✅ Approved |
| 8 | `home` | 27 | ✅ Approved |
| 9 | `caring` | 6 | ✅ Approved |
| 10 | `plantDetail` | 27 | ✅ Approved |
| 11 | `taskCard` | 4 | ✅ Approved |
| 12 | `manageHouseholds` | 13 | ✅ Approved |
| 13 | `notes` | 15 | ✅ Approved |
| 14 | `photos` | 15 | ✅ Approved |
| 15 | `editPlant` | 14 | ✅ Approved |
| 16 | `emojiPicker` | 1 | ✅ Approved |
| 17 | `status` | 35 | ✅ Approved |
| 18 | `relativeTime` | 17 | ✅ Approved |
| 19 | `reschedule` | 23 | ✅ Approved |
| 20 | `dialog` | 11 | ✅ Approved |
| 21 | `careVerb` | 8 | ✅ Approved |
| 22 | `activityFeed` | 5 | ✅ Approved _(careSelf removed July 22 — decision B)_ |
| 23 | `confirmComplete` | 3 | ✅ Approved July 22 (#435) |

Approved: **440 / 440** ✅ COMPLETE — plus date-name arrays and TASK_CONFIG presets (see clusters below)

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
| `onboarding.inlineTask.markDone` | Marcar realizada |
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
| `taskSheet.recSummary.yearlyLeap` | Se repite cada año el 29 de Feb (1 de Mar en años no bisiestos) |
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
| `menu.toast.markedDone` | {task} realizada |
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
| `home.tabCaring` | Cuidar |
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
| `home.aria.markDone` | Marcar realizada |
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

## 9. `caring` (6) ✅

| Key | Spanish |
|-----|---------|
| `caring.doneToday` | Realizadas hoy |
| `caring.emptyTitle` | Aquí cuidas tus plantas |
| `caring.emptySub` | Las tareas pendientes aparecerán aquí |
| `caring.upcoming` | Próximamente |
| `caring.allClear` | Todo al día |
| `caring.noTasksToday` | Sin tareas hoy |

---

## 10. `plantDetail` (27) ✅

| Key | Spanish |
|-----|---------|
| `plantDetail.aria.editPlant` | Editar planta |
| `plantDetail.tabSummary` | Resumen |
| `plantDetail.tabTasks` | Tareas |
| `plantDetail.tabNotes` | Notas |
| `plantDetail.tabCareLog` | Historial |
| `plantDetail.addTask` | Agregar tarea |
| `plantDetail.aria.addFab` | Agregar |
| `plantDetail.summary.homeTitle` | Tu {name} está en casa |
| `plantDetail.summary.emptySub` | Agrega una tarea para empezar a registrar su cuidado. Tu progreso aparecerá aquí. |
| `plantDetail.summary.daysOfCare` | días de cuidado |
| `plantDetail.summary.homeSince` | En casa desde {date} |
| `plantDetail.summary.arrivalPromptSub` | Establece una fecha de llegada para empezar a registrar los días de cuidado. |
| `plantDetail.summary.photoTimeline` | Photo timeline |
| `plantDetail.summary.photoCount` | {n} fotos · presiona para ver |
| `plantDetail.summary.needsAttention` | Necesita atención hoy |
| `plantDetail.summary.noUpcoming` | Sin tareas próximas |
| `plantDetail.summary.noActivity` | Aún no hay actividad |
| `plantDetail.tasks.emptyTitle` | Aún no hay tareas |
| `plantDetail.tasks.emptySub` | Agrega una tarea de cuidado para empezar a registrar lo que tu {name} necesita. |
| `plantDetail.tasks.noneForFilter` | Sin tareas para los usuarios seleccionados |
| `plantDetail.tasks.listHeader` | Lista de tareas |
| `plantDetail.notes.emptyTitle` | Aún no hay notas |
| `plantDetail.notes.emptySub` | Anota observaciones sobre tu {name} — crecimiento, salud, cualquier cosa que valga la pena recordar. Presiona el botón de abajo para agregar una. |
| `plantDetail.notes.noneForFilter` | Sin notas para los usuarios seleccionados |
| `plantDetail.careLog.emptyTitle` | Aún no hay cuidados registrados |
| `plantDetail.careLog.emptySub` | Tus tareas realizadas y notas aparecerán aquí. |
| `plantDetail.careLog.skipped` | Omitida |

---

## 11. `taskCard` (4) ✅

| Key | Spanish |
|-----|---------|
| `taskCard.paused` | Pausada |
| `taskCard.done` | Realizada |
| `taskCard.plusNote` | + Nota |
| `taskCard.resume` | Reanudar |

---

## 12. `manageHouseholds` (13) ✅

| Key | Spanish |
|-----|---------|
| `manageHouseholds.title` | Administrar Hogares |
| `manageHouseholds.yourHousehold` | Tu hogar |
| `manageHouseholds.editName` | Editar Nombre |
| `manageHouseholds.membersLabel` | Miembros |
| `manageHouseholds.unknownMember` | Desconocido |
| `manageHouseholds.role` | Miembro |
| `manageHouseholds.youBadge` | TÚ |
| `manageHouseholds.activityTitle` | Actividad del hogar |
| `manageHouseholds.noActivity` | Aún no hay actividad. |
| `manageHouseholds.noActivityFiltered` | Aún no hay actividad para los usuarios seleccionados. |
| `manageHouseholds.careFallback` | Cuidado |
| `manageHouseholds.memberCount.one` | {n} miembro |
| `manageHouseholds.memberCount.other` | {n} miembros |

_Note: `activityTitle` uses "del hogar" (non-possessive generic header) — a deliberate exception to the "de tu hogar" rule, which governs only possessive "your household."_

---

## 13. `notes` (15) ✅

| Key | Spanish |
|-----|---------|
| `notes.postTask.title` | Agregar una nota |
| `notes.optional` | Opcional |
| `notes.placeholder` | Describe lo que observaste... |
| `notes.addPhoto` | Agregar foto |
| `notes.postTask.skip` | Omitir |
| `notes.saveNote` | Guardar nota |
| `notes.addNote.title` | Agregar Nota |
| `notes.coach.title` | Replica tu última foto |
| `notes.coach.body` | Usa el mismo ángulo/distancia. ¡Ayuda a ver el progreso! |
| `notes.coach.bodyAlt` | ¡El mismo ángulo ayuda a registrar el progreso! |
| `notes.editNote.subtitle` | Editar nota |
| `notes.deleteNote` | Eliminar nota |
| `notes.noteTaskMeta` | después de {task} |
| `notes.saving` | Guardando… |
| `notes.editTooltip` | Editar |

---

## 14. `photos` (15) ✅

| Key | Spanish |
|-----|---------|
| `photos.tapToChange` | Presiona para cambiar |
| `photos.lastPhoto` | Última foto |
| `photos.aria.close` | Cerrar |
| `photos.aria.previous` | Anterior |
| `photos.aria.next` | Siguiente |
| `photos.slideshow.noteLabel` | NOTA |
| `photos.slideshow.count` | {current} de {total} |
| `photos.noNote` | Sin nota. |
| `photos.cap.title` | Límite de fotos alcanzado |
| `photos.cap.body` | Cada planta puede tener hasta {cap} fotos. Para agregar una nueva, primero debes eliminar una foto existente. |
| `photos.cap.deleteOldest` | Eliminar la foto más antigua |
| `photos.managePhotos` | Administrar fotos |
| `photos.loading` | Cargando… |
| `photos.noPhotos` | Aún no hay fotos. |
| `photos.delete` | Eliminar |

---

## 15. `editPlant` (14) ✅

| Key | Spanish |
|-----|---------|
| `editPlant.setDate` | Establecer fecha |
| `editPlant.sublabelPhoto` | Presiona Cambiar para volver a sacarla, elegir una nueva o usar un ícono |
| `editPlant.sublabelEmoji` | Presiona Cambiar para elegir un nuevo ícono o agregar una foto |
| `editPlant.iconLabel` | ÍCONO DE LA PLANTA |
| `editPlant.plantIcon` | Ícono de la planta |
| `editPlant.change` | Cambiar |
| `editPlant.nameLabel` | NOMBRE |
| `editPlant.namePlaceholder` | Nombre de la planta |
| `editPlant.arrivalDateLabel` | FECHA DE LLEGADA |
| `editPlant.whenArrive` | ¿Cuándo llegó a casa? |
| `editPlant.deletePlant` | Eliminar planta |
| `editPlant.deleteConfirmBody` | Esto eliminará permanentemente la planta y todas sus tareas, notas e historial de cuidados. Esta acción es irreversible. |
| `editPlant.deleteConfirmYes` | Sí, eliminar para siempre |
| `editPlant.saveChanges` | Guardar cambios |

---

## 16. `emojiPicker` (1) ✅

| Key | Spanish |
|-----|---------|
| `emojiPicker.pastePlaceholder` | O pega un emoji personalizado |

---

## 17. `status` (35) ✅

| Key | Spanish |
|-----|---------|
| `status.recurrence.oneOff` | Única vez |
| `status.recurrence.noDaysSet` | Sin días seleccionados |
| `status.recurrence.daysOfWeek` | Días de la semana |
| `status.recurrence.everyWeekdays` | Los {days} |
| `status.recurrence.everyYearOn` | Cada año el {day} de {month} |
| `status.recurrence.everyYear` | Cada año |
| `status.recurrence.everyDays.one` | Cada {n} día |
| `status.recurrence.everyDays.other` | Cada {n} días |
| `status.badge.done` | Realizada |
| `status.badge.inDaysOneOff.one` | En {n} día — única vez |
| `status.badge.inDaysOneOff.other` | En {n} días — única vez |
| `status.badge.dueTodayOneOff` | Vence hoy — única vez |
| `status.badge.overdueOneOff` | Vencida — única vez |
| `status.badge.dueTodayNeverDone` | Vence hoy — nunca realizada |
| `status.badge.daysOverdue.one` | {n} día de retraso{manual} |
| `status.badge.daysOverdue.other` | {n} días de retraso{manual} |
| `status.badge.dueToday` | Vence hoy{manual} |
| `status.badge.dueTomorrow` | Vence mañana{manual} |
| `status.badge.inDays` | En {n} días{manual} |
| `status.badge.manualSuffix` |  (manual) |
| `status.lastDone.never` | Nunca realizada |
| `status.lastDone.yesterday` | Realizada ayer |
| `status.lastDone.daysAgo` | Realizada hace {n} días |
| `status.home.daysLate.one` | {n} día de retraso |
| `status.home.daysLate.other` | {n} días de retraso |
| `status.home.dueToday` | vence hoy |
| `status.pill.overdue` | {n} vencidas |
| `status.pill.dueToday` | {n} vencen hoy |
| `status.row.doneToday` | ✓ realizada hoy |
| `status.row.done` | ✓ realizada |
| `status.row.dueDate` | vence {date} |
| `status.row.dueTomorrow` | vence mañana |
| `status.row.dueToday` | vence hoy |
| `status.row.overdue` | vencida |
| `status.row.dueInDays` | vence en {n} días |

_Note: `status.badge.manualSuffix` preserves a leading space — " (manual)" — so it concatenates onto the preceding badge text._

---

## 18. `relativeTime` (17) ✅

| Key | Spanish |
|-----|---------|
| `relativeTime.today` | Hoy |
| `relativeTime.yesterday` | Ayer |
| `relativeTime.someTimeAgo` | hace algún tiempo |
| `relativeTime.daysAgo.one` | hace {n} día |
| `relativeTime.daysAgo.other` | hace {n} días |
| `relativeTime.activity.justNow` | Recién |
| `relativeTime.activity.minutesAgo` | hace {n}m |
| `relativeTime.activity.hoursAgo` | hace {n}h |
| `relativeTime.arrival.aboutAWeek` | Hace una semana aprox. |
| `relativeTime.arrival.weeksAgo.one` | hace {n} semana |
| `relativeTime.arrival.weeksAgo.other` | hace {n} semanas |
| `relativeTime.arrival.aboutAMonth` | Hace un mes aprox. |
| `relativeTime.arrival.monthsAgo.one` | hace {n} mes |
| `relativeTime.arrival.monthsAgo.other` | hace {n} meses |
| `relativeTime.arrival.aboutAYear` | Hace un año aprox. |
| `relativeTime.arrival.yearsAgo.one` | Hace {n} año aprox. |
| `relativeTime.arrival.yearsAgo.other` | Hace {n} años aprox. |

---

## 19. `reschedule` (23) ✅

| Key | Spanish |
|-----|---------|
| `reschedule.keepOriginal.title` | Mantener Programa Original |
| `reschedule.acceptModified.title` | Aceptar Programa Modificado |
| `reschedule.todayIs` | Hoy es {date} |
| `reschedule.nextDue` | Próximo vencimiento: {date} |
| `reschedule.summaryDue` | vence {date} |
| `reschedule.recurrenceEveryDays.one` | Cada {n} día |
| `reschedule.recurrenceEveryDays.other` | Cada {n} días |
| `reschedule.runningLate.one` | {n} día de retraso |
| `reschedule.runningLate.other` | {n} días de retraso |
| `reschedule.daysEarly.one` | {n} día de adelanto |
| `reschedule.daysEarly.other` | {n} días de adelanto |
| `reschedule.deltaLater.one` | → {n} día después |
| `reschedule.deltaLater.other` | → {n} días después |
| `reschedule.deltaEarlier.one` | ← {n} día antes |
| `reschedule.deltaEarlier.other` | ← {n} días antes |
| `reschedule.legend.missed` | No realizada |
| `reschedule.legend.nextOccurrences` | Próximas ocurrencias |
| `reschedule.yearly.everyYearOn` | Cada año el {anchor} |
| `reschedule.yearly.runningLate.one` | {n} día de retraso |
| `reschedule.yearly.runningLate.other` | {n} días de retraso |
| `reschedule.yearly.runningEarly.one` | {n} día de adelanto |
| `reschedule.yearly.runningEarly.other` | {n} días de adelanto |
| `reschedule.yearly.moveAnchor` | Mover la fecha base al {date} cada año |

---

## 20. `dialog` (11) ✅

| Key | Spanish |
|-----|---------|
| `dialog.confirmDeleteTask` | ¿Eliminar esta tarea permanentemente? Esta acción es irreversible. |
| `dialog.confirmDeleteNote` | ¿Eliminar esta nota? |
| `dialog.confirmDeletePhoto` | ¿Eliminar esta foto? |
| `dialog.confirmRemoveRecurrence` | Esto quitará la recurrencia. ¿Continuar? |
| `dialog.alertNoteOrPhoto` | Agrega una nota o una foto. |
| `dialog.alertNoteEmpty` | La nota no puede estar vacía. |
| `dialog.alertPlantNameRequired` | Ingresa un nombre para la planta. |
| `dialog.alertTaskNameRequired` | Ingresa un nombre para la tarea. |
| `dialog.alertFrequencyInvalid` | Ingresa una frecuencia válida (mínimo 1 día). |
| `dialog.alertWeekdayRequired` | Selecciona al menos un día de la semana. |
| `dialog.alertMonthDayRequired` | Selecciona un mes y un día. |

---

## 21. `careVerb` (8) ✅

_3rd-person singular past, actor-subject. Consumed by `activityFeed.care` ({actor} {verb} {plant})._

| Key | Spanish |
|-----|---------|
| `careVerb.water` | regó |
| `careVerb.refill` | rellenó |
| `careVerb.fertilize` | abonó |
| `careVerb.check` | revisó |
| `careVerb.repot` | trasplantó |
| `careVerb.prune` | podó |
| `careVerb.pest` | revisó plagas en |
| `careVerb.rotate` | rotó |

---

## 22. `activityFeed` (5) ✅

| Key | Spanish |
|-----|---------|
| `activityFeed.care` | {actor} {verb} {plant} |
| `activityFeed.skipped` | {actor} omitió {task} |
| `activityFeed.careOther` | {actor} realizó {task} en {plant} |
| `activityFeed.noteOn` | {actor} creó una nota en {plant} |
| `activityFeed.noteAdded` | {actor} creó una nota |

_`careSelf` **removed** July 22, 2026 (decision B, #44f-feedName): the feed always shows the actor's display name, including for the current user's own actions ("Matu regó Monstera" — never "Realizaste…"). Third-person frames are always grammatical in Spanish, so the "Tú regó" agreement problem vanishes by construction. No self-frame exists in the dictionary._

---

## 23. `confirmComplete` (3) ✅ — added July 22, 2026 (#435)

_Confirm sheet shown before completing another member's task._

| Key | Spanish |
|-----|---------|
| `confirmComplete.title` | Esta tarea está asignada a {name} |
| `confirmComplete.body` | ¿Quieres completarla de todos modos? Se registrará como realizada por ti. |
| `confirmComplete.cta` | Completar |

_⚠️ Verify exact key names against `docs/i18n-en-backup.md` before transcription — the trio's English keys were added by #435; the names above are the expected shape, not confirmed against source._

---

## Cluster A — Date-name arrays (constants)

**MONTH_NAMES** (fills `{month}`; init caps):
Enero, Febrero, Marzo, Abril, Mayo, Junio, Julio, Agosto, Septiembre, Octubre, Noviembre, Diciembre

**WEEKDAY_NAMES_ABBR** (3-letter, fills `{days}`; matches calendarSync "Lun – Vie" / "Sáb & Dom"):
Dom, Lun, Mar, Mié, Jue, Vie, Sáb

**WEEKDAY_NAMES** (2-letter minimal):
Do, Lu, Ma, Mi, Ju, Vi, Sá

_`SEL_MONTH_NAMES` and `YEARLY_MONTH_NAMES` are aliases of MONTH_NAMES. Abbreviated months used in `taskSheet.recSummary.yearlyLeap` (Feb, Mar) follow the same init-caps convention._

---

## Cluster B — TASK_CONFIG preset display names (display-only; storage stays English)

| Storage key (English, unchanged) | Spanish display |
|----------------------------------|-----------------|
| `normal-water` | Riego |
| `refill-pot` | Rellenar maceta autorregante |
| `fertilize` | Abonar |
| `check` | Revisar |
| `repot` | Trasplantar |
| `prune` | Podar |
| `check-pests` | Revisar plagas |
| `rotate` | Rotar |

_Infinitive/noun label forms (distinct from the past-tense `careVerb.*` forms). Per settled decision, `tasks.name` storage stays English; only the type-picker display is translated._

---

## Open agreement notes (all resolved as of completion)

- **✅ `dialog.confirmDeleteTask`** — resolved: "Esta acción es irreversible" (matches `editPlant.deleteConfirmBody`).
- **✅ `status.row.done` / `status.row.doneToday`** — resolved: "realizada" (app-wide completion word).
- **✅ `activityFeed.care` "Tú regó" wrinkle** — resolved via **decision B** (July 22, supersedes the earlier #44f-careSelf approach): the feed always shows the actor's display name, never "You"/"Tú" frames. Third-person is always grammatical; `careSelf` removed from code and dictionary (#44f-feedName).
- **✅ `status.recurrence.everyYearOn`** — "{day} de {month}" reorder applied.
- **✅ `status.recurrence.everyWeekdays`** — "Los {days}" pattern applied.
- **✅ Month abbreviations** — now init caps (Feb, Mar) matching the MONTH_NAMES init-caps decision; `taskSheet.recSummary.yearlyLeap` updated accordingly.

## Remaining QA-pass items (Phase 3, #44g QA — cosmetic, not translation gaps)

- **Text overflow** — Spanish runs ~15–20% longer; watch `calendarSync.calendarCard.*`, `reminders.subtitle`, longer `getHelp` items, `plantDetail.notes.emptySub`.
- **`calendarSync.switch.intro` {scope} interpolation** — "el feed Mis tareas actual" reads awkwardly (structural, affects English too).
- **`{task}` mid-sentence capitalization** — user task names render with stored caps in `activityFeed.careOther` ("realizó Rociar hojas") — same as English, cosmetic.
- **Legacy preset task names stay English after locale switch (#438)** — preset names are *stored* at creation, so pre-existing preset tasks keep "Watering" etc. while the type picker shows "Riego"; fresh creates are Spanish. Names are now locked (not user-editable) for preset types. Verify this reads acceptably in live UI; a one-time migration or display-derive-from-type is a possible future item, not in scope.
- **`.toUpperCase()` width** on month/weekday abbreviations in tight grid/picker cells.
- **Months init caps mid-phrase** — "el 5 de Marzo" departs from standard Spanish orthography (lowercase) per the init-caps decision; confirm acceptable in live UI.
- **Capitalization audit (July 14)** — title-case English mirrored in Spanish; iOS literal-label exception on `install.steps.addToHomeLabel`.
