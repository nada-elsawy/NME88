/* ============================================================
   i18n.js — shared English/Arabic engine with RTL support.
   Translations are natural Modern Standard Arabic (not literal).
   Works by localizing the live DOM in place (idempotent, reversible).
   ============================================================ */
(function () {
  'use strict';

  var AR = {
    /* ---- nav / chrome ---- */
    'Dashboard': 'لوحة التحكم', 'Schedule': 'الجدول', 'Attendance': 'الحضور', 'Leave': 'الإجازات',
    'Announcements': 'الإعلانات', 'Team': 'الفريق', 'My Profile': 'ملفي الشخصي', 'Settings': 'الإعدادات',
    'Account & Billing': 'الحساب والفوترة', 'Sign out': 'تسجيل الخروج', 'Notifications': 'الإشعارات',
    /* ---- auth ---- */
    'Log in': 'تسجيل الدخول', 'Create account': 'إنشاء حساب', 'Welcome back': 'مرحبًا بعودتك',
    'Log in to your NME Workforce account.': 'سجّل الدخول إلى حسابك في NME Workforce.',
    'Email': 'البريد الإلكتروني', 'Password': 'كلمة المرور', 'No account yet?': 'ليس لديك حساب بعد؟',
    'Create one': 'أنشئ حسابًا', 'Incorrect email or password.': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'Forgot password?': 'هل نسيت كلمة المرور؟', 'Create your account': 'أنشئ حسابك',
    'Start your NME Workforce workspace in minutes.': 'ابدأ مساحة عمل NME Workforce خلال دقائق.',
    'Full name': 'الاسم الكامل', 'Work email': 'بريد العمل الإلكتروني', 'Company': 'الشركة', 'Confirm': 'تأكيد',
    'Continue to payment →': 'المتابعة إلى الدفع →', 'Already have an account?': 'لديك حساب بالفعل؟',
    'Passwords do not match.': 'كلمتا المرور غير متطابقتين.',
    'An account with this email already exists.': 'يوجد حساب مسجّل بهذا البريد الإلكتروني بالفعل.',
    'Run every shift without the spreadsheet chaos.': 'أدِر كل وردية دون فوضى جداول البيانات.',
    'Scheduling, attendance, and leave — one workspace your whole team actually enjoys using.':
      'الجدولة والحضور والإجازات — مساحة عمل واحدة يستمتع فريقك كله باستخدامها فعلًا.',
    'Smart weekly scheduling & breaks': 'جدولة أسبوعية ذكية مع فترات الاستراحة',
    'One-tap clock in / out & overtime': 'تسجيل الدخول والخروج والعمل الإضافي بلمسة واحدة',
    'Leave requests & approvals': 'طلبات الإجازات والموافقات',
    'Fully customizable — week start, time format & more': 'قابل للتخصيص بالكامل — بداية الأسبوع وتنسيق الوقت والمزيد',
    '© 2026 NME Workforce · Demo environment': '© 2026 NME Workforce · بيئة تجريبية',
    /* ---- payment ---- */
    'Choose your plan': 'اختر خطتك', 'Monthly': 'شهري', 'Annual · save 25%': 'سنوي · وفّر 25%',
    'Name on card': 'الاسم على البطاقة', 'Card number': 'رقم البطاقة', 'Expiry': 'تاريخ الانتهاء',
    'CVC': 'رمز التحقق', 'Due today': 'المستحق اليوم', 'Complete sign up': 'إكمال التسجيل', '← Back': 'رجوع',
    'Account': 'الحساب', 'Payment': 'الدفع', 'Done': 'تم', 'Cancel anytime': 'إلغاء في أي وقت',
    'Free plan available': 'تتوفر خطة مجانية', 'Set up in under an hour': 'الإعداد في أقل من ساعة',
    'Secure demo checkout': 'دفع تجريبي آمن', 'Starter': 'المبتدئ', 'Enterprise': 'المؤسسات', 'Free': 'مجاني',
    'Up to 10 employees': 'حتى 10 موظفين', 'Per user / month': 'لكل مستخدم / شهر',
    '⚠ Demo checkout — this does not process real payments. Please do':
      '⚠ دفع تجريبي — لا تتم معالجة أي مدفوعات حقيقية. الرجاء عدم',
    'enter real card details. Any values are accepted.': 'إدخال بيانات بطاقة حقيقية. تُقبل أي قيم.',
    /* ---- forgot password ---- */
    'Reset your password': 'إعادة تعيين كلمة المرور',
    "Enter your account email and we'll send you a verification code.": 'أدخل بريد حسابك وسنرسل إليك رمز تحقق.',
    'Send code': 'إرسال الرمز', 'No account found with that email.': 'لا يوجد حساب مرتبط بهذا البريد.',
    'Enter the 6-digit code we sent to your email.': 'أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى بريدك.',
    'Verification code': 'رمز التحقق', 'Verify code': 'تحقق من الرمز',
    'Incorrect code. Please try again.': 'الرمز غير صحيح. حاول مرة أخرى.',
    'Create a new password': 'أنشئ كلمة مرور جديدة', 'New password': 'كلمة مرور جديدة',
    'Confirm new password': 'تأكيد كلمة المرور الجديدة', 'Update password': 'تحديث كلمة المرور',
    'Back to log in': 'العودة إلى تسجيل الدخول',
    'Password updated — you can now log in.': 'تم تحديث كلمة المرور — يمكنك الآن تسجيل الدخول.',
    'Demo — normally this code is emailed to you:': 'تجريبي — عادةً يُرسل هذا الرمز إلى بريدك:',
    /* ---- dashboard / clock ---- */
    'Team size': 'عدد أعضاء الفريق', 'Present today': 'الحاضرون اليوم', 'On leave': 'في إجازة',
    'Pending approvals': 'الموافقات المعلّقة', 'Time clock': 'ساعة الدوام', 'Latest announcements': 'أحدث الإعلانات',
    'No shift scheduled today.': 'لا توجد وردية مجدولة اليوم.', 'Clock in': 'تسجيل الحضور',
    'Clock out': 'تسجيل الانصراف', 'Welcome back,': 'مرحبًا بعودتك،',
    /* ---- schedule ---- */
    'Day off': 'يوم إجازة', 'Break 1': 'استراحة 1', 'Break 2': 'استراحة 2', 'Lunch': 'الغداء',
    'change in Settings': 'التغيير من الإعدادات', 'Today': 'اليوم',
    'monday': 'الاثنين', 'sunday': 'الأحد', 'saturday': 'السبت',
    /* ---- attendance ---- */
    'Team attendance': 'حضور الفريق', 'Employee': 'الموظف', 'Date': 'التاريخ', 'Status': 'الحالة',
    'Overtime': 'العمل الإضافي', 'No records.': 'لا توجد سجلات.',
    /* ---- leave ---- */
    '+ Request leave': '+ طلب إجازة', 'Type': 'النوع', 'From': 'من', 'To': 'إلى', 'Approve': 'موافقة',
    'Reject': 'رفض', 'Request leave': 'طلب إجازة', 'Start': 'من تاريخ', 'End': 'إلى تاريخ', 'Reason': 'السبب',
    'Submit': 'إرسال', 'Cancel': 'إلغاء', 'No leave requests.': 'لا توجد طلبات إجازة.', 'Optional': 'اختياري',
    'annual': 'سنوية', 'sick': 'مرضية', 'personal': 'شخصية', 'unpaid': 'بدون راتب',
    /* ---- announcements ---- */
    '+ New announcement': '+ إعلان جديد', 'New announcement': 'إعلان جديد', 'Title': 'العنوان',
    'Description': 'الوصف', 'Priority': 'الأولوية', 'Post': 'نشر',
    'low': 'منخفضة', 'medium': 'متوسطة', 'high': 'عالية', 'urgent': 'عاجلة',
    /* ---- team management ---- */
    '+ Create team': '+ إنشاء فريق', 'Create team': 'إنشاء فريق', 'Create': 'إنشاء', 'Rename': 'إعادة تسمية',
    'Rename team': 'إعادة تسمية الفريق', 'Team name': 'اسم الفريق', '+ Add member': '+ إضافة عضو',
    'Manager': 'المدير', 'Employees under this manager (same company)': 'الموظفون تحت هذا المدير (نفس الشركة)',
    'No unassigned employees available.': 'لا يوجد موظفون غير معيّنين متاحون.', 'No managers in your company': 'لا يوجد مديرون في شركتك',
    'No members yet.': 'لا يوجد أعضاء بعد.', 'Unassigned': 'غير معيّن', 'Remove': 'إزالة', 'Add': 'إضافة', 'Done': 'تم',
    'Employee ID': 'معرّف الموظف', 'Department': 'القسم', 'Joined': 'تاريخ الانضمام', 'members': 'أعضاء',
    /* ---- team / roles / statuses ---- */
    'ID': 'المعرّف', 'Role': 'الدور', 'Not in': 'لم يسجّل الحضور', 'on leave': 'في إجازة',
    'present': 'حاضر', 'late': 'متأخر', 'absent': 'غائب', 'active': 'نشط', 'pending': 'معلّق',
    'approved': 'مقبول', 'rejected': 'مرفوض', 'employee': 'موظف', 'manager': 'مدير', 'super admin': 'مدير عام',
    /* ---- settings ---- */
    'Start day of the week': 'أول أيام الأسبوع',
    'Which day your schedule week begins on.': 'اليوم الذي يبدأ به أسبوع الجدول.',
    'Time format': 'تنسيق الوقت', 'Show times as 24-hour or 12-hour (AM/PM).': 'عرض الوقت بنظام 24 ساعة أو 12 ساعة (ص/م).',
    'Date format': 'تنسيق التاريخ', 'How dates are displayed throughout the app.': 'كيفية عرض التواريخ في التطبيق.',
    'Working days': 'أيام العمل', 'Days that get a scheduled shift.': 'الأيام التي تُجدول فيها الورديات.',
    'Currency': 'العملة', 'Used for billing and pricing displays.': 'تُستخدم في الفوترة وعرض الأسعار.',
    'Default shift start': 'بداية الوردية الافتراضية', 'Start time used when generating schedules.': 'وقت البدء المستخدم عند إنشاء الجداول.',
    'Default shift end': 'نهاية الوردية الافتراضية', 'End time used when generating schedules.': 'وقت الانتهاء المستخدم عند إنشاء الجداول.',
    'Overtime after': 'العمل الإضافي بعد', 'Hours worked before overtime applies.': 'عدد ساعات العمل قبل احتساب العمل الإضافي.',
    'Max concurrent breaks': 'الحد الأقصى للاستراحات المتزامنة', 'How many teammates can break at once.': 'عدد الزملاء الذين يمكنهم أخذ استراحة في وقت واحد.',
    'Workspace name': 'اسم مساحة العمل', 'Shown in the sidebar and on screens.': 'يظهر في الشريط الجانبي وعلى الشاشات.',
    'Save changes': 'حفظ التغييرات', 'Reset all demo data & settings': 'إعادة تعيين جميع البيانات والإعدادات التجريبية',
    '6 hours': '6 ساعات', '8 hours': '8 ساعات', '9 hours': '9 ساعات', '10 hours': '10 ساعات',
    '24-hour': '24 ساعة', '12-hour': '12 ساعة',
    /* ---- profile ---- */
    'to apply.': 'للتطبيق.', 'Profile details': 'بيانات الملف الشخصي', 'Country': 'الدولة',
    'Employee / Unique ID': 'معرّف الموظف / المعرّف الفريد',
    'Your own unique ID across the company. Leave blank for none.': 'معرّفك الفريد داخل الشركة. اتركه فارغًا إن لم ترغب.',
    'That ID is already taken. Please choose a different one.': 'هذا المعرّف مستخدم بالفعل. يرجى اختيار معرّف آخر.',
    'Select country': 'اختر الدولة', 'Mobile number': 'رقم الجوال', 'Change password': 'تغيير كلمة المرور',
    'Current password': 'كلمة المرور الحالية', 'Leave blank to keep current': 'اتركه فارغًا للإبقاء على الحالية',
    'At least 6 characters': '6 أحرف على الأقل', 'Name cannot be empty.': 'لا يمكن ترك الاسم فارغًا.',
    'Enter a valid email address.': 'أدخل بريدًا إلكترونيًا صحيحًا.',
    'That email is already used by another account.': 'هذا البريد مستخدم من حساب آخر.',
    'Current password is incorrect.': 'كلمة المرور الحالية غير صحيحة.',
    'New password must be at least 6 characters.': 'يجب أن تتكوّن كلمة المرور الجديدة من 6 أحرف على الأقل.',
    'New passwords do not match.': 'كلمتا المرور الجديدتان غير متطابقتين.',
    /* ---- billing ---- */
    'Your plan': 'خطتك', 'Plan': 'الخطة', 'Billing currency': 'عملة الفوترة', 'Signed in as': 'مسجّل الدخول باسم',
    'This is a demo workspace — no real billing occurs. Payment details entered at sign-up are not stored or charged.':
      'هذه مساحة عمل تجريبية — لا تتم أي فوترة حقيقية. لا يتم حفظ أو خصم بيانات الدفع المُدخلة عند التسجيل.',
    /* ---- toasts (fixed) ---- */
    'Settings saved': 'تم حفظ الإعدادات', 'Profile saved': 'تم حفظ الملف الشخصي',
    'Leave request submitted': 'تم إرسال طلب الإجازة', 'Announcement posted': 'تم نشر الإعلان',
    'Request approved': 'تمت الموافقة على الطلب', 'Request rejected': 'تم رفض الطلب', 'Demo reset': 'تمت إعادة التعيين',
    'End must be after start': 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء',
    /* ---- signup roles / promo ---- */
    'I am a…': 'أنا…', 'Manager': 'مدير', 'Employee': 'موظف',
    'Promo code (optional)': 'رمز ترويجي (اختياري)', 'Enter a promo code': 'أدخل رمزًا ترويجيًا',
    'Create free account': 'إنشاء حساب مجاني',
    'Company size': 'حجم الشركة',
    '1–10 employees (free)': '1–10 موظفين (مجاني)', '11–50 employees': '11–50 موظفًا',
    '51–200 employees': '51–200 موظف', '200+ employees': 'أكثر من 200 موظف',
    'This promo code isn’t active. Please check the code and try again.':
      'رمز الترويج هذا غير مُفعّل. يرجى التحقق من الرمز والمحاولة مرة أخرى.',
    /* ---- shift swaps ---- */
    'Shift Swaps': 'تبادل الورديات', '+ Request a swap': '+ طلب تبديل', 'Request a shift swap': 'طلب تبديل وردية',
    'Shift to swap': 'الوردية المراد تبديلها', 'No shift swap requests.': 'لا توجد طلبات تبديل ورديات.',
    'Confirm': 'تأكيد', 'Shift date': 'تاريخ الوردية', 'No upcoming shifts': 'لا توجد ورديات قادمة',
    'Swap request submitted': 'تم إرسال طلب التبديل', 'Swap confirmed': 'تم تأكيد التبديل', 'Swap rejected': 'تم رفض التبديل',
    /* ---- schedule editing ---- */
    'Edit': 'تعديل', 'Shift start': 'بداية الوردية', 'Shift end': 'نهاية الوردية',
    'Break 1 start': 'بداية الاستراحة 1', 'Break 1 end': 'نهاية الاستراحة 1',
    'Break 2 start': 'بداية الاستراحة 2', 'Break 2 end': 'نهاية الاستراحة 2',
    'Lunch start': 'بداية الغداء', 'Lunch end': 'نهاية الغداء', 'Save': 'حفظ',
    'Company break schedule': 'جدول استراحات الشركة', 'Schedule updated': 'تم تحديث الجدول',
    'Break updated': 'تم تحديث الاستراحة', 'My schedule': 'جدولي', 'Team schedule': 'جدول الفريق',
    /* ---- settings: theme / country ---- */
    'Theme': 'المظهر', 'Light': 'فاتح', 'Dark': 'داكن', 'System': 'حسب النظام',
    'Choose light, dark, or match your system.': 'اختر الفاتح أو الداكن أو مطابقة نظامك.',
    'Business country': 'دولة النشاط', 'Sets the business location and clock time zone.': 'تحدّد موقع النشاط والمنطقة الزمنية للساعة.',
    /* ---- break reminders ---- */
    'Break Reminders': 'تذكيرات الاستراحة', 'Your break reminders': 'تذكيرات استراحتك', 'Reminder settings': 'إعدادات التذكير',
    'Reminders': 'التذكيرات', 'Turn break reminders on or off.': 'تشغيل أو إيقاف تذكيرات الاستراحة.', 'On': 'تشغيل', 'Off': 'إيقاف',
    'Remind me before': 'ذكّرني قبل', 'How far ahead of each break to remind you.': 'كم دقيقة قبل كل استراحة يتم التذكير.',
    '5 min': '5 دقائق', '10 min': '10 دقائق', '15 min': '15 دقيقة',
    'Notification tone': 'نغمة التنبيه', 'Sound played when a reminder fires.': 'الصوت الذي يُشغَّل عند التذكير.', '▶ Preview': '▶ معاينة',
    'Snooze time': 'مدة الغفوة', 'How long “Snooze” postpones a reminder.': 'مدة تأجيل التذكير عند الضغط على غفوة.',
    '🔔 Test reminder now': '🔔 اختبر التذكير الآن', 'Got it': 'حسنًا', 'Break reminder': 'تذكير استراحة',
    'Chime': 'رنين', 'Bell': 'جرس', 'Ding': 'دينغ', 'Digital': 'رقمي', 'Silent': 'صامت', 'Reminder settings saved': 'تم حفظ إعدادات التذكير',
    /* ============ marketing site ============ */
    'Features': 'المميزات', 'How it works': 'كيف يعمل', 'Pricing': 'الأسعار', 'FAQ': 'الأسئلة الشائعة',
    'Workforce management, simplified': 'إدارة القوى العاملة ببساطة',
    'Run every shift': 'أدِر كل وردية', 'without the spreadsheet chaos.': 'دون فوضى جداول البيانات.',
    'NME brings scheduling, time & attendance, and leave management into one clean workspace — so managers plan faster and teams always know where they need to be.':
      'يجمع NME الجدولة والحضور والإجازات في مساحة عمل واحدة منظّمة — ليخطّط المديرون بسرعة ويعرف الفريق دائمًا أين يجب أن يكون.',
    'Start free trial': 'ابدأ التجربة المجانية', 'See how it works': 'شاهد كيف يعمل',
    'Loved by': 'يثق به', 'shift-based teams': 'فريقًا يعمل بنظام الورديات',
    'Teams that run on shifts trust NME': 'فرق تعمل بنظام الورديات تثق بـ NME',
    'Everything in one place': 'كل شيء في مكان واحد',
    'One platform for the whole shift lifecycle': 'منصة واحدة لدورة حياة الوردية بالكامل',
    'From building the rota to approving leave, NME replaces the messy patchwork of spreadsheets, group chats, and paper forms.':
      'من إنشاء الجدول إلى اعتماد الإجازات، يستبدل NME خليط جداول البيانات والمحادثات الجماعية والنماذج الورقية الفوضوي.',
    'Smart scheduling': 'جدولة ذكية', 'Time & attendance': 'الوقت والحضور', 'Leave management': 'إدارة الإجازات',
    'Shift swaps': 'تبادل الورديات', 'Roles & admin': 'الأدوار والإدارة',
    'Build and publish weekly rotas in minutes, with break windows and shift times your team can see at a glance.':
      'أنشئ وانشر الجداول الأسبوعية خلال دقائق، مع أوقات الاستراحة والورديات التي يراها فريقك بلمحة.',
    'One-tap clock in and out, automatic late and overtime tracking, and a clean history for every employee.':
      'تسجيل حضور وانصراف بلمسة واحدة، وتتبّع تلقائي للتأخير والعمل الإضافي، وسجل واضح لكل موظف.',
    'Employees request time off, managers approve or decline in a click, and balances stay up to date automatically.':
      'يطلب الموظفون الإجازات، ويوافق المديرون أو يرفضون بضغطة واحدة، وتُحدَّث الأرصدة تلقائيًا.',
    'Let staff propose swaps and cover shifts themselves — with manager approval and break limits built in.':
      'دع الموظفين يقترحون التبادلات ويغطّون الورديات بأنفسهم — مع موافقة المدير وحدود الاستراحات المدمجة.',
    'Broadcast policy changes, events, and urgent notices so the whole team is always in the loop.':
      'انشر تغييرات السياسات والفعاليات والإشعارات العاجلة ليبقى الفريق كله على اطلاع.',
    'Granular roles for employees, managers, and admins — plus departments, teams, and full audit logs.':
      'أدوار دقيقة للموظفين والمديرين والمشرفين — إضافة إلى الأقسام والفرق وسجلات تدقيق كاملة.',
    'Up and running fast': 'جاهز للعمل بسرعة', 'How NME works': 'كيف يعمل NME',
    'Three steps from sign-up to a fully scheduled, self-serving team.': 'ثلاث خطوات من التسجيل إلى فريق مجدول بالكامل يخدم نفسه.',
    'Add your team': 'أضف فريقك',
    'Import employees, set up departments and teams, and assign managers. Roles decide who sees and does what.':
      'استورد الموظفين، وأنشئ الأقسام والفرق، وعيّن المديرين. الأدوار تحدّد من يرى ماذا ويفعل ماذا.',
    'Build the schedule': 'أنشئ الجدول',
    'Drop in shifts and breaks for the week and publish. Everyone gets their rota instantly on any device.':
      'أضف الورديات والاستراحات للأسبوع وانشرها. يحصل الجميع على جدولهم فورًا على أي جهاز.',
    'Let it run': 'دعه يعمل',
    'Staff clock in, request leave, and swap shifts. Managers approve on the go and track attendance in real time.':
      'يسجّل الموظفون حضورهم، ويطلبون الإجازات، ويتبادلون الورديات. ويوافق المديرون أثناء التنقّل ويتابعون الحضور لحظيًا.',
    'Built for clarity': 'مصمّم للوضوح',
    'A dashboard your whole team actually enjoys using': 'لوحة تحكم يستمتع فريقك كله باستخدامها فعلًا',
    "Today's shift, clock status, and breaks — front and center.": 'وردية اليوم وحالة الدوام والاستراحات — في المقدمة.',
    "Managers get a live team snapshot: who's in, who's out, what's pending.": 'يحصل المديرون على لقطة حية للفريق: من حاضر ومن غائب وما المعلّق.',
    'Role-based views keep everyone focused on what matters to them.': 'عروض مبنية على الأدوار تُبقي كل شخص مركّزًا على ما يهمّه.',
    'Works on desktop, tablet, and phone — no app install required.': 'يعمل على الحاسوب والجهاز اللوحي والهاتف — دون تثبيت أي تطبيق.',
    'Get a live demo': 'احصل على عرض توضيحي مباشر',
    'Present': 'حاضر', 'Late': 'متأخر',
    'Teams onboarded': 'فريقًا انضمّ', 'Shifts scheduled': 'وردية مجدولة', 'Uptime': 'مدة التشغيل', 'Average rating': 'متوسط التقييم',
    'What teams say': 'ماذا تقول الفرق', 'Managers get their evenings back': 'المديرون يستعيدون أمسياتهم',
    'We cut our weekly scheduling time from three hours to about twenty minutes. The team loves seeing their shifts instantly.':
      'قلّصنا وقت الجدولة الأسبوعية من ثلاث ساعات إلى نحو عشرين دقيقة. ويحب الفريق رؤية ورديّاتهم فورًا.',
    'Leave requests used to live in my inbox. Now approvals take one tap and nothing slips through the cracks.':
      'كانت طلبات الإجازة تتكدّس في بريدي. أما الآن فالموافقة بضغطة واحدة ولا يضيع شيء.',
    'Attendance and overtime finally add up automatically. Payroll day is no longer a nightmare.':
      'أصبح الحضور والعمل الإضافي يُحتسبان تلقائيًا أخيرًا. ولم يعد يوم الرواتب كابوسًا.',
    'Simple pricing': 'أسعار بسيطة', 'Plans that scale with your team': 'خطط تنمو مع فريقك',
    "Start free. Upgrade when you're ready. No contracts, cancel anytime.": 'ابدأ مجانًا. ارتقِ عندما تكون جاهزًا. بدون عقود، وألغِ في أي وقت.',
    'Most popular': 'الأكثر شيوعًا', 'Custom': 'مخصّص', '/mo': '/شهر', '/user/mo': '/مستخدم/شهر',
    'For small teams getting organized.': 'للفرق الصغيرة التي تبدأ بالتنظيم.',
    'For growing shift-based teams.': 'للفرق المتنامية التي تعمل بالورديات.',
    'For multi-site organizations.': 'للمؤسسات متعددة المواقع.',
    'Scheduling & attendance': 'الجدولة والحضور', 'Leave requests': 'طلبات الإجازات', 'Email support': 'دعم عبر البريد الإلكتروني',
    'Unlimited employees': 'عدد غير محدود من الموظفين', 'Shift swaps & approvals': 'تبادل الورديات والموافقات',
    'Announcements & roles': 'الإعلانات والأدوار', 'Priority support': 'دعم ذو أولوية',
    'Departments & teams': 'الأقسام والفرق', 'Audit logs & SSO': 'سجلات التدقيق والدخول الموحّد',
    'Dedicated manager': 'مدير حساب مخصّص', 'Custom onboarding': 'إعداد مخصّص',
    'Get started': 'ابدأ الآن', 'Contact sales': 'تواصل مع المبيعات',
    'Good to know': 'معلومات مفيدة', 'Frequently asked questions': 'الأسئلة الشائعة',
    'Do employees need to install an app?': 'هل يحتاج الموظفون إلى تثبيت تطبيق؟',
    'No. NME runs in any modern browser on desktop, tablet, and phone. Staff just log in and go.':
      'لا. يعمل NME في أي متصفح حديث على الحاسوب والجهاز اللوحي والهاتف. يسجّل الموظفون الدخول ويبدؤون فقط.',
    'Can I set different permissions for managers and staff?': 'هل يمكنني ضبط صلاحيات مختلفة للمديرين والموظفين؟',
    'Yes. Roles for employees, managers, and admins control exactly what each person can see and do, down to departments and teams.':
      'نعم. تتحكّم أدوار الموظفين والمديرين والمشرفين تمامًا في ما يراه كل شخص ويفعله، وصولًا إلى الأقسام والفرق.',
    'How does clocking in and attendance tracking work?': 'كيف يعمل تسجيل الحضور وتتبّعه؟',
    'Employees clock in and out with one tap. NME automatically flags late arrivals and totals overtime, and keeps a full attendance history.':
      'يسجّل الموظفون حضورهم وانصرافهم بلمسة واحدة. ويحدّد NME حالات التأخير تلقائيًا ويجمع العمل الإضافي ويحتفظ بسجل حضور كامل.',
    'Is there a free plan?': 'هل توجد خطة مجانية؟',
    'Absolutely. The Starter plan is free for up to 10 employees and includes scheduling, attendance, and leave requests.':
      'بالتأكيد. خطة المبتدئ مجانية حتى 10 موظفين وتشمل الجدولة والحضور وطلبات الإجازات.',
    'Can we import our existing team data?': 'هل يمكننا استيراد بيانات فريقنا الحالية؟',
    'Yes — bring in employees, departments, and teams during onboarding. Enterprise plans include a dedicated onboarding manager.':
      'نعم — استورد الموظفين والأقسام والفرق أثناء الإعداد. وتشمل خطط المؤسسات مدير إعداد مخصّصًا.',
    'Ready to tame your schedule?': 'جاهز للسيطرة على جدولك؟',
    "Start a free trial today, or book a 15-minute demo and we'll show you NME with your own team in mind.":
      'ابدأ تجربة مجانية اليوم، أو احجز عرضًا توضيحيًا مدته 15 دقيقة ونعرض لك NME بما يناسب فريقك.',
    '✓ Free for up to 10 employees': '✓ مجاني حتى 10 موظفين', '✓ No credit card required': '✓ دون الحاجة إلى بطاقة ائتمان',
    '✓ Set up in under an hour': '✓ الإعداد في أقل من ساعة', 'Team size': 'حجم الفريق',
    'By continuing you agree to our terms. This is a demo site — no data is sent.':
      'بالمتابعة فإنك توافق على شروطنا. هذا موقع تجريبي — لا تُرسَل أي بيانات.',
    'Scheduling, attendance & leave for modern teams.': 'الجدولة والحضور والإجازات للفرق الحديثة.',
    'Product': 'المنتج', 'About': 'من نحن', 'Careers': 'الوظائف', 'Blog': 'المدوّنة',
    'Support': 'الدعم', 'Contact': 'تواصل معنا', 'Status': 'حالة النظام',
    '© 2026 NME. Demo site.': '© 2026 NME. موقع تجريبي.', 'Privacy': 'الخصوصية', 'Terms': 'الشروط',
  };

  var ORIG = new WeakMap();          // text node -> original value
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };

  function insideSkip(node) {
    for (var p = node.parentNode; p && p.nodeType === 1; p = p.parentNode) {
      if (p.hasAttribute && p.hasAttribute('data-i18n-skip')) return true;
      if (SKIP[p.tagName]) return true;
    }
    return false;
  }

  var I = {
    lang: 'en',
    isAR: function () { return this.lang === 'ar'; },
    t: function (en) { return this.lang === 'ar' && AR[en] != null ? AR[en] : en; },

    localize: function (root) {
      root = root || document.body;
      if (!root) return;
      var ar = this.lang === 'ar';
      // text nodes
      var walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = walk.nextNode())) nodes.push(n);
      nodes.forEach(function (node) {
        if (insideSkip(node)) return;
        if (!ORIG.has(node)) ORIG.set(node, node.nodeValue);
        var orig = ORIG.get(node);
        var trimmed = orig.trim();
        if (!trimmed) return;
        var norm = trimmed.replace(/\s+/g, ' '); // collapse newlines/indentation in wrapped HTML
        if (ar && AR[norm] != null) {
          var lead = orig.match(/^\s*/)[0], tail = orig.match(/\s*$/)[0];
          node.nodeValue = lead + AR[norm] + tail;
        } else {
          node.nodeValue = orig;
        }
      });
      // attributes: placeholder, title, aria-label
      ['placeholder', 'title', 'aria-label'].forEach(function (attr) {
        var els = root.querySelectorAll ? root.querySelectorAll('[' + attr + ']') : [];
        Array.prototype.forEach.call(els, function (el) {
          if (el.hasAttribute('data-i18n-skip')) return;
          var dkey = 'o_' + attr.replace('-', '_');
          if (el.dataset[dkey] == null) el.dataset[dkey] = el.getAttribute(attr);
          var orig = el.dataset[dkey]; var key = orig.trim();
          if (ar && AR[key] != null) el.setAttribute(attr, AR[key]);
          else el.setAttribute(attr, orig);
        });
      });
    },

    apply: function () {
      document.documentElement.setAttribute('lang', this.lang);
      document.documentElement.setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
      this.localize(document.body);
      this.setLabels();
    },
    setLabels: function () {
      var txt = this.lang === 'ar' ? 'English' : 'العربية';
      document.querySelectorAll('.lang-btn').forEach(function (b) { b.textContent = txt; });
    },
    wire: function () {
      var self = this;
      document.querySelectorAll('.lang-btn').forEach(function (b) {
        if (b._wired) return; b._wired = true;
        b.setAttribute('data-i18n-skip', '');
        b.onclick = function () { self.setLang(self.lang === 'ar' ? 'en' : 'ar'); };
      });
      this.setLabels();
    },
    setLang: function (l) { this.lang = l; try { localStorage.setItem('nme_lang', l); } catch (e) {} this.wire(); this.apply(); if (this.onChange) this.onChange(l); },
    init: function () {
      try { this.lang = localStorage.getItem('nme_lang') || 'en'; } catch (e) { this.lang = 'en'; }
      this.wire(); this.apply();
    },
  };

  window.NME_I18N = I;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { I.init(); });
  else I.init();
})();
