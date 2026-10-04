(function(){
  'use strict';

  const STORAGE_KEY='site-language';
  const LANGUAGES={
    ru:{code:'ru',label:'Русский',locale:'ru-RU'},
    be:{code:'be',label:'Беларуская',locale:'be-BY'},
    en:{code:'en',label:'English',locale:'en-US'}
  };
  const ORDER=['ru','be','en'];

  const I18N={
    'Перейти к содержимому':{be:'Перайсці да змесціва',en:'Skip to content'},
    'Новости':{be:'Навіны',en:'News'},
    'Профиль':{be:'Профіль',en:'Profile'},
    'О нас':{be:'Пра нас',en:'About'},
    'Разделы':{be:'Раздзелы',en:'Sections'},
    'Все разделы':{be:'Усе раздзелы',en:'All sections'},
    'Шпаргалка':{be:'Шпаргалка',en:'Cheat sheet'},
    'Слабовидящие':{be:'Слабавідушчыя',en:'Low vision'},
    'Войти':{be:'Увайсці',en:'Sign in'},
    'Сегодня':{be:'Сёння',en:'Today'},
    'Главные новости':{be:'Галоўныя навіны',en:'Top news'},
    'Случайная':{be:'Выпадковая',en:'Random'},
    'Сбросить':{be:'Скінуць',en:'Reset'},
    'Аккаунт':{be:'Акаўнт',en:'Account'},
    'Проект':{be:'Праект',en:'Project'},
    'Поиск новостей':{be:'Пошук навін',en:'Search news'},
    'Все новости':{be:'Усе навіны',en:'All news'},
    'Все':{be:'Усе',en:'All'},
    'Открыть меню':{be:'Адкрыць меню',en:'Open menu'},
    'Открыть настройки для слабовидящих':{be:'Адкрыць налады для слабавідушчых',en:'Open low-vision settings'},
    'Открыть настройки версии для слабовидящих':{be:'Адкрыць налады версіі для слабавідушчых',en:'Open low-vision settings'},
    'Открыть настройки версии для слабовидящих (включено)':{be:'Адкрыць налады версіі для слабавідушчых (уключана)',en:'Open low-vision settings (enabled)'},
    'Слабовидящие: вкл.':{be:'Слабавідушчыя: укл.',en:'Low vision: on'},
    'Переключить тему':{be:'Пераключыць тэму',en:'Toggle theme'},
    'Войти или зарегистрироваться':{be:'Увайсці або зарэгістравацца',en:'Sign in or register'},
    'Навигация без мыши':{be:'Навігацыя без мышы',en:'Mouse-free navigation'},
    'Динамическая генерация цветовой палитры':{be:'Дынамічная генерацыя каляровай палітры',en:'Dynamic color palette generation'},
    'Весь дизайн сайта построен на основе системы Material 3 с открытым исходным кодом.':{be:'Увесь дызайн сайта пабудаваны на аснове сістэмы Material 3 з адкрытым зыходным кодам.',en:'The entire site design is based on the open-source Material 3 system.'},
    'Благодаря MATUGEN цветовая палитра сайта генерируется на основе контента в каждой отдельной новости.':{be:'Дзякуючы MATUGEN каляровая палітра сайта генеруецца на аснове кантэнту кожнай асобнай навіны.',en:'MATUGEN generates the site color palette from the content of each individual story.'},
    'На ПК поддерживается управление исключительно с клавиатуры, вдохновленное Neovim/Helix.':{be:'На ПК падтрымліваецца кіраванне выключна з клавіятуры, натхнёнае Neovim/Helix.',en:'On desktop, the site supports keyboard-only control inspired by Neovim/Helix.'},
    'Стек':{be:'Стэк',en:'Stack'},
    'Статьи хранятся в Supabase, Markdown рендерится на клиенте через Marked и очищается DOMPurify перед вставкой в DOM.':{be:'Артыкулы захоўваюцца ў Supabase, Markdown адлюстроўваецца на кліенце праз Marked і ачышчаецца DOMPurify перад устаўкай у DOM.',en:'Articles are stored in Supabase, Markdown is rendered client-side with Marked and sanitized by DOMPurify before being inserted into the DOM.'},
    'Все сочетания клавиш сайта':{be:'Усе спалучэнні клавіш сайта',en:'All site keyboard shortcuts'},
    'Закрыть шпаргалку':{be:'Закрыць шпаргалку',en:'Close cheat sheet'},
    'Жесты':{be:'Жэсты',en:'Gestures'},
    'Открыть шпаргалку жестов':{be:'Адкрыць шпаргалку жэстаў',en:'Open gesture cheat sheet'},
    'Закрыть шпаргалку жестов':{be:'Закрыць шпаргалку жэстаў',en:'Close gesture cheat sheet'},
    'Шпаргалка жестов':{be:'Шпаргалка жэстаў',en:'Gesture cheat sheet'},
    'Все жесты мобильной версии':{be:'Усе жэсты мабільнай версіі',en:'All mobile gestures'},
    'ЖЕСТЫ МОБИЛЬНОЙ ВЕРСИИ':{be:'ЖЭСТЫ МАБІЛЬНАЙ ВЕРСІІ',en:'MOBILE GESTURES'},
    'Открыть эту шпаргалку':{be:'Адкрыць гэтую шпаргалку',en:'Open this cheat sheet'},
    'Проведите от правой границы экрана влево.':{be:'Правядзіце ад правага краю экрана ўлева.',en:'Swipe left from the right edge of the screen.'},
    'Открыть меню':{be:'Адкрыць меню',en:'Open menu'},
    'Проведите от левой границы экрана вправо.':{be:'Правядзіце ад левага краю экрана ўправа.',en:'Swipe right from the left edge of the screen.'},
    'Переключать разделы':{be:'Пераключаць раздзелы',en:'Switch sections'},
    'Проведите влево или вправо по нижней навигационной панели.':{be:'Правядзіце ўлева або ўправа па ніжняй навігацыйнай панэлі.',en:'Swipe left or right across the bottom navigation bar.'},
    'Переключать режим редактора':{be:'Пераключаць рэжым рэдактара',en:'Switch editor mode'},
    'Проведите влево или вправо по области редактора.':{be:'Правядзіце ўлева або ўправа па вобласці рэдактара.',en:'Swipe left or right across the editor area.'},
    'Обновить новости':{be:'Абнавіць навіны',en:'Refresh news'},
    'Потяните список вниз от самого верха и отпустите на индикаторе обновления.':{be:'Пацягніце спіс уніз ад самага верху і адпусціце на індыкатары абнаўлення.',en:'Pull down from the top and release on the refresh indicator.'},
    'Следующая статья':{be:'Наступны артыкул',en:'Next article'},
    'Свайп влево по открытой статье.':{be:'Свайп улева па адкрытым артыкуле.',en:'Swipe left on the open article.'},
    'Предыдущая статья':{be:'Папярэдні артыкул',en:'Previous article'},
    'Свайп вправо по открытой статье.':{be:'Свайп управа па адкрытым артыкуле.',en:'Swipe right on the open article.'},
    'Закрыть меню':{be:'Закрыць меню',en:'Close menu'},
    'Свайп влево по открытому боковому меню.':{be:'Свайп улева па адкрытым бакавым меню.',en:'Swipe left on the open side menu.'},
    'Закрыть эту шпаргалку':{be:'Закрыць гэтую шпаргалку',en:'Close this cheat sheet'},
    'Свайп вправо по области шпаргалки.':{be:'Свайп управа па вобласці шпаргалкі.',en:'Swipe right on the cheat sheet.'},

    'Вход':{be:'Уваход',en:'Sign in'},
    'Регистрация':{be:'Рэгістрацыя',en:'Register'},
    'Ник':{be:'Нік',en:'Nickname'},
    'Пароль':{be:'Пароль',en:'Password'},
    'Минимум 6 символов':{be:'Мінімум 6 сімвалаў',en:'At least 6 characters'},
    'Ваш ник':{be:'Ваш нік',en:'Your nickname'},
    'Отмена':{be:'Адмена',en:'Cancel'},
    'Редактирование':{be:'Рэдагаванне',en:'Editing'},
    'Сохранить':{be:'Захаваць',en:'Save'},
    'Сохранить изменения':{be:'Захаваць змены',en:'Save changes'},
    'Сохранить изменения или предложение':{be:'Захаваць змены або прапанову',en:'Save changes or suggestion'},
    'Аватар URL':{be:'URL аватара',en:'Avatar URL'},
    'Или загрузите файл':{be:'Або загрузіце файл',en:'Or upload a file'},
    'Для локального файла после выбора откроется кадрирование 1:1.':{be:'Пасля выбару лакальнага файла адкрыецца кадраванне 1:1.',en:'Selecting a local file opens 1:1 cropping.'},
    'О себе':{be:'Пра сябе',en:'About you'},
    'Расскажите немного о себе':{be:'Раскажыце крыху пра сябе',en:'Tell us a little about yourself'},
    'Обложка новости':{be:'Вокладка навіны',en:'News cover'},
    'Обрезка изображения':{be:'Кадраванне выявы',en:'Image cropping'},
    'Масштаб':{be:'Маштаб',en:'Zoom'},
    'Влево':{be:'Улева',en:'Left'},
    'Вправо':{be:'Управа',en:'Right'},
    'Перетаскивайте изображение внутри области 16:9. Обрезка применяется только к копии изображения.':{be:'Перацягвайце выяву ўнутры вобласці 16:9. Кадраванне ўжываецца толькі да копіі выявы.',en:'Drag the image inside the 16:9 area. Cropping is applied only to the image copy.'},
    'Применить':{be:'Ужыць',en:'Apply'},
    'Аватар':{be:'Аватар',en:'Avatar'},
    'Обрезка и подгонка':{be:'Кадраванне і падганянне',en:'Crop and fit'},
    'Перетаскивайте изображение внутри квадрата. На телефоне используйте жесты или ползунок масштаба.':{be:'Перацягвайце выяву ўнутры квадрата. На тэлефоне выкарыстоўвайце жэсты або паўзунок маштабу.',en:'Drag the image inside the square. On a phone, use gestures or the zoom slider.'},
    'Доступность':{be:'Даступнасць',en:'Accessibility'},
    'Версия для слабовидящих':{be:'Версія для слабавідушчых',en:'Low-vision version'},
    'Настройки применяются сразу и сохраняются на этом устройстве. Режим работает одинаково на компьютере, планшете и телефоне.':{be:'Налады ўжываюцца адразу і захоўваюцца на гэтай прыладзе. Рэжым аднолькава працуе на камп’ютары, планшэце і тэлефоне.',en:'Settings apply immediately and are saved on this device. The mode works the same on desktop, tablet, and phone.'},
    'Включить версию для слабовидящих':{be:'Уключыць версію для слабавідушчых',en:'Enable low-vision version'},
    'Увеличенный текст, повышенный контраст, заметный фокус и упрощённая компоновка.':{be:'Павялічаны тэкст, павышаны кантраст, прыкметны фокус і спрошчаная кампаноўка.',en:'Larger text, higher contrast, visible focus, and simplified layout.'},
    'Шрифт':{be:'Шрыфт',en:'Font'},
    'Размер текста':{be:'Памер тэксту',en:'Text size'},
    'Межбуквенное расстояние':{be:'Міжлітарны інтэрвал',en:'Letter spacing'},
    'Стандартное':{be:'Стандартнае',en:'Standard'},
    'Увеличенное':{be:'Павялічанае',en:'Increased'},
    'Большое':{be:'Вялікае',en:'Large'},
    'Межстрочный интервал':{be:'Міжрадковы інтэрвал',en:'Line spacing'},
    'Цветовая схема':{be:'Каляровая схема',en:'Color scheme'},
    'Чёрным по белому':{be:'Чорным па белым',en:'Black on white'},
    'Белым по чёрному':{be:'Белым па чорным',en:'White on black'},
    'Жёлтым по тёмно-синему':{be:'Жоўтым па цёмна-сінім',en:'Yellow on dark navy'},
    'Тёмно-синим по светло-жёлтому':{be:'Цёмна-сінім па светла-жоўтым',en:'Dark navy on light yellow'},
    'Цветовое восприятие':{be:'Каляровае ўспрыманне',en:'Color perception'},
    'Стандартная палитра':{be:'Стандартная палітра',en:'Standard palette'},
    'Красно-зелёно-безопасная':{be:'Чырвона-зялёна-бяспечная',en:'Red-green safe'},
    'Сине-жёлто-безопасная':{be:'Сіне-жоўта-бяспечная',en:'Blue-yellow safe'},
    'Монохромная':{be:'Монахромная',en:'Monochrome'},
    'Подчёркивать ссылки':{be:'Падкрэсліваць спасылкі',en:'Underline links'},
    'Не использовать цвет как единственный признак':{be:'Не выкарыстоўваць колер як адзіны прыкмета',en:'Do not use color as the only cue'},
    'Отключить анимации и плавную прокрутку':{be:'Адключыць анімацыі і плыўную пракрутку',en:'Disable animations and smooth scrolling'},
    'Скрывать изображения в новостях':{be:'Хаваць выявы ў навінах',en:'Hide images in news'},
    'Настройки предназначены для повышения читаемости интерфейса. Изображения и содержание новостей не изменяются.':{be:'Налады прызначаны для павышэння чытальнасці інтэрфейсу. Выявы і змесціва навін не змяняюцца.',en:'These settings improve interface readability. Images and news content are not changed.'},
    'Сбросить настройки':{be:'Скінуць налады',en:'Reset settings'},
    'Готово':{be:'Гатова',en:'Done'},

    'Материал не найден':{be:'Матэрыял не знойдзены',en:'Material not found'},
    'Вернуться к новостям':{be:'Вярнуцца да навін',en:'Back to news'},
    'Материал':{be:'Матэрыял',en:'Article'},
    'Редактор':{be:'Рэдактар',en:'Editor'},
    'Редактировать':{be:'Рэдагаваць',en:'Edit'},
    'Удалить':{be:'Выдаліць',en:'Delete'},
    'Отклонить':{be:'Адхіліць',en:'Reject'},
    'Опубликовать':{be:'Апублікаваць',en:'Publish'},
    'Предложить':{be:'Прапанаваць',en:'Suggest'},
    'Публикация':{be:'Публікацыя',en:'Publishing'},
    'Предложение':{be:'Прапановы',en:'Suggestion'},
    'Раздел':{be:'Раздзел',en:'Section'},
    'Раздел новости':{be:'Раздзел навіны',en:'News section'},
    'Автор':{be:'Аўтар',en:'Author'},
    'Автор:':{be:'Аўтар:',en:'Author:'},
    'Лид':{be:'Лід',en:'Lead'},
    'Заголовок новости':{be:'Загаловак навіны',en:'News headline'},
    'Короткое описание или лид. Если оставить пустым, он будет взят из первого абзаца Markdown.':{be:'Кароткае апісанне або лід. Калі пакінуць пустым, ён будзе ўзяты з першага абзаца Markdown.',en:'Short description or lead. If left empty, it will be taken from the first Markdown paragraph.'},
    'Загрузка авторов…':{be:'Загрузка аўтараў…',en:'Loading authors…'},
    'Нет доступных авторов':{be:'Няма даступных аўтараў',en:'No authors available'},
    'Загрузить изображение':{be:'Загрузіць выяву',en:'Upload image'},
    'Обрезать':{be:'Абрэзаць',en:'Crop'},
    'Взять первую картинку из Markdown':{be:'Узяць першую выяву з Markdown',en:'Use the first Markdown image'},
    'Палитра будет сгенерирована автоматически из цветов обложки. Ручного Accent HEX нет.':{be:'Палітра будзе аўтаматычна згенераваная з колераў вокладкі. Ручнога Accent HEX няма.',en:'The palette will be generated automatically from the cover colors. There is no manual Accent HEX.'},
    'URL обложки':{be:'URL вокладкі',en:'Cover URL'},
    'Изображение является единственным источником цветовой палитры.':{be:'Выява з’яўляецца адзінай крыніцай каляровай палітры.',en:'The image is the only source of the color palette.'},
    'Два окна':{be:'Два акны',en:'Split view'},
    'Предпросмотр':{be:'Папярэдні прагляд',en:'Preview'},
    '*Начните писать — предпросмотр появится здесь.*':{be:'*Пачніце пісаць — папярэдні прагляд з’явіцца тут.*',en:'*Start writing — the preview will appear here.*'},
    'жирный текст':{be:'тлусты тэкст',en:'bold text'},
    'курсив':{be:'курсіў',en:'italic'},
    'зачёркнутый':{be:'закрэслены',en:'strikethrough'},
    'код':{be:'код',en:'code'},
    'текст ссылки':{be:'тэкст спасылкі',en:'link text'},
    'описание':{be:'апісанне',en:'description'},
    'Владелец':{be:'Уладальнік',en:'Owner'},
    'Администратор':{be:'Адміністратар',en:'Administrator'},
    'Читатель':{be:'Чытач',en:'Reader'},
    'Редакция':{be:'Рэдакцыя',en:'Editorial team'},
    'Пользователь':{be:'Карыстальнік',en:'User'},
    'Не авторизован':{be:'Не аўтарызаваны',en:'Not signed in'},
    'Создайте профиль читателя':{be:'Стварыце профіль чытача',en:'Create a reader profile'},
    'Ник, аватар и поле «О себе» сохраняются в Supabase. Публиковать новости могут только администраторы и владелец.':{be:'Нік, аватар і поле «Пра сябе» захоўваюцца ў Supabase. Публікаваць навіны могуць толькі адміністратары і ўладальнік.',en:'Nickname, avatar, and the “About you” field are stored in Supabase. Only administrators and the owner can publish news.'},
    'Войти или зарегистрироваться':{be:'Увайсці або зарэгістравацца',en:'Sign in or register'},
    'Что доступно':{be:'Што даступна',en:'What is available'},
    'Чтение новостей':{be:'Чытанне навін',en:'Reading news'},
    'Профиль пользователя':{be:'Профіль карыстальніка',en:'User profile'},
    'Все публикации':{be:'Усе публікацыі',en:'All publications'},
    'Пока ничего не рассказано.':{be:'Пакуль нічога не расказана.',en:'Nothing has been shared yet.'},
    'Изменить профиль':{be:'Змяніць профіль',en:'Edit profile'},

    'Управление новостями':{be:'Кіраванне навінамі',en:'News management'},
    'Предложенные новости':{be:'Прапанаваныя навіны',en:'Suggested news'},
    'Сохранённые черновики':{be:'Захаваныя чарнавікі',en:'Saved drafts'},
    'Материалы, сохранённые в вашем аккаунте':{be:'Матэрыялы, захаваныя ў вашым акаўнце',en:'Materials saved in your account'},
    'Опубликованные материалы и редактирование':{be:'Апублікаваныя матэрыялы і рэдагаванне',en:'Published materials and editing'},
    'Ваши предложения и изменения на проверке':{be:'Вашы прапановы і змены на праверцы',en:'Your suggestions and changes under review'},
    'Предложения на проверке':{be:'Прапановы на праверцы',en:'Suggestions under review'},
    'Мои предложения':{be:'Мае прапановы',en:'My suggestions'},
    'Новых предложений и изменений на проверке нет.':{be:'Новых прапаноў і зменаў на праверцы няма.',en:'There are no new suggestions or changes under review.'},
    'Вы ещё не предлагали новости.':{be:'Вы яшчэ не прапаноўвалі навіны.',en:'You have not suggested any news yet.'},
    'Ожидает проверки':{be:'Чакае праверкі',en:'Pending review'},
    'Изменения ожидают проверки':{be:'Змены чакаюць праверкі',en:'Changes pending review'},
    'Опубликована':{be:'Апублікавана',en:'Published'},
    'Отклонена':{be:'Адхілена',en:'Rejected'},
    'Просмотреть и изменить':{be:'Праглядзець і змяніць',en:'Review and edit'},
    'Изменения опубликованы':{be:'Змены апублікаваны',en:'Changes published'},
    'Предложение опубликовано':{be:'Прапанову апублікавана',en:'Suggestion published'},
    'Предложение отклонено':{be:'Прапанову адхілена',en:'Suggestion rejected'},
    'Продолжить редактирование':{be:'Працягнуць рэдагаванне',en:'Continue editing'},
    'Удалить черновик':{be:'Выдаліць чарнавік',en:'Delete draft'},
    'Черновик сохранён':{be:'Чарнавік захаваны',en:'Draft saved'},
    'Черновик открыт':{be:'Чарнавік адкрыты',en:'Draft opened'},
    'Сохранённых черновиков пока нет.':{be:'Захаваных чарнавікоў пакуль няма.',en:'There are no saved drafts yet.'},
    'Загрузка черновиков…':{be:'Загрузка чарнавікоў…',en:'Loading drafts…'},
    'Без названия':{be:'Без назвы',en:'Untitled'},

    'Обсуждение':{be:'Абмеркаванне',en:'Discussion'},
    'Комментарии':{be:'Каментарыі',en:'Comments'},
    'Ответить':{be:'Адказаць',en:'Reply'},
    'Изменить':{be:'Змяніць',en:'Edit'},
    'Заблокировать':{be:'Заблакіраваць',en:'Block'},
    'Открыть профиль':{be:'Адкрыць профіль',en:'Open profile'},
    'Апвоут':{be:'Апвоут',en:'Upvote'},
    'Даунвоут':{be:'Даунвоут',en:'Downvote'},
    'В этой статье нет комментариев.':{be:'У гэтым артыкуле няма каментарыяў.',en:'There are no comments on this article.'},
    'Комментариев нет.':{be:'Каментарыяў няма.',en:'No comments.'},
    'Для этого комментария нет доступных кнопок управления.':{be:'Для гэтага каментарыя няма даступных кнопак кіравання.',en:'There are no available controls for this comment.'},
    'Чтобы оставить комментарий, войдите в аккаунт.':{be:'Каб пакінуць каментарый, увайдзіце ў акаўнт.',en:'Sign in to leave a comment.'},
    'Изменять можно только свой комментарий.':{be:'Змяняць можна толькі свой каментарый.',en:'You can only edit your own comment.'},
    'Удаление доступно только для своего комментария или модерации.':{be:'Выдаленне даступна толькі для свайго каментарыя або мадэрацыі.',en:'Deletion is available only for your own comment or moderation.'},
    'Блокировка доступна только администратору или владельцу.':{be:'Блакіроўка даступная толькі адміністратару або ўладальніку.',en:'Blocking is available only to an administrator or the owner.'},
    'В этой статье пока нет комментариев.':{be:'У гэтым артыкуле пакуль няма каментарыяў.',en:'There are no comments on this article yet.'},
    'Пока никто не оставил комментарий.':{be:'Пакуль ніхто не пакінуў каментарый.',en:'No one has left a comment yet.'},
    'Станьте первым, кто выскажется.':{be:'Станьце першым, хто выкажацца.',en:'Be the first to have your say.'},
    'Присоединитесь к обсуждению':{be:'Далучайцеся да абмеркавання',en:'Join the discussion'},
    'Войдите в аккаунт, чтобы оставлять комментарии, отвечать и голосовать.':{be:'Увайдзіце ў акаўнт, каб пакідаць каментарыі, адказваць і галасаваць.',en:'Sign in to comment, reply, and vote.'},
    'Комментарии недоступны':{be:'Каментарыі недаступныя',en:'Comments unavailable'},
    'Ваш ответ…':{be:'Ваш адказ…',en:'Your reply…'},
    'Поделитесь своим мнением…':{be:'Падзяліцеся сваім меркаваннем…',en:'Share your opinion…'},
    'Опубликовать':{be:'Апублікаваць',en:'Publish'},
    'Модерация':{be:'Мадэрацыя',en:'Moderation'},
    'Блокировка пользователя':{be:'Блакіроўка карыстальніка',en:'Block user'},
    'Укажите причину блокировки. Она сохранится в профиле и будет доступна модераторам.':{be:'Укажыце прычыну блакіроўкі. Яна захаваецца ў профілі і будзе даступная мадэратарам.',en:'Provide a reason for the block. It will be saved in the profile and visible to moderators.'},
    'Причина блокировки':{be:'Прычына блакіроўкі',en:'Block reason'},
    'Например: неоднократное нарушение правил сообщества':{be:'Напрыклад: неаднаразовае парушэнне правілаў супольнасці',en:'For example: repeated violation of community rules'},
    'Заблокировать пользователя':{be:'Заблакіраваць карыстальніка',en:'Block user'},
    'Пользователь заблокирован':{be:'Карыстальнік заблакіраваны',en:'User blocked'},
    'Причина не указана':{be:'Прычына не ўказаная',en:'No reason provided'},
    'Разблокировать':{be:'Разблакіраваць',en:'Unblock'},
    'Пользователь разблокирован.':{be:'Карыстальнік разблакіраваны.',en:'User unblocked.'},
    'Пользователь заблокирован.':{be:'Карыстальнік заблакіраваны.',en:'User blocked.'},
    'Сведения':{be:'Звесткі',en:'Details'},
    'Регистрация':{be:'Рэгістрацыя',en:'Registration'},
    'Возраст аккаунта':{be:'Узрост акаўнта',en:'Account age'},
    'Участник сообщества':{be:'Удзельнік супольнасці',en:'Community member'},
    'Архив автора':{be:'Архіў аўтара',en:'Author archive'},
    'Публикаций пока нет.':{be:'Публікацый пакуль няма.',en:'No publications yet.'},
    'Защищённый владелец':{be:'Абаронены ўладальнік',en:'Protected owner'},
    'Назначить администратором':{be:'Прызначыць адміністратарам',en:'Make administrator'},
    'Снять администратора':{be:'Зняць адміністратара',en:'Remove administrator'},

    'Предыдущая':{be:'Папярэдняя',en:'Previous'},
    'Следующая':{be:'Наступная',en:'Next'},
    'Других материалов в этом направлении нет':{be:'Іншых матэрыялаў у гэтым напрамку няма',en:'No other materials in this direction'},
    'Предыдущей страницы в приложении нет.':{be:'Папярэдняй старонкі ў дадатку няма.',en:'There is no previous page in the app.'},
    'Новостей пока нет':{be:'Навін пакуль няма',en:'No news yet'},
    'Ничего не найдено':{be:'Нічога не знойдзена',en:'Nothing found'},
    'Попробуйте другой запрос или измените раздел.':{be:'Паспрабуйце іншы запыт або змяніце раздзел.',en:'Try another query or change the section.'},
    'Публикации появятся здесь после того, как администратор разместит первую новость.':{be:'Публікацыі з’явяцца тут пасля таго, як адміністратар размесціць першую навіну.',en:'Publications will appear here after an administrator posts the first news story.'},
    'Сбросить поиск и раздел':{be:'Скінуць пошук і раздзел',en:'Reset search and section'},
    'Очистить поиск':{be:'Ачысціць пошук',en:'Clear search'},
    'Случайная новость':{be:'Выпадковая навіна',en:'Random news'},
    'Политика':{be:'Палітыка',en:'Politics'},
    'Экономика':{be:'Эканоміка',en:'Economy'},
    'Общество':{be:'Грамадства',en:'Society'},
    'Технологии и наука':{be:'Тэхналогіі і навука',en:'Technology and science'},
    'Культура':{be:'Культура',en:'Culture'},
    'Спорт':{be:'Спорт',en:'Sports'},
    'Образование':{be:'Адукацыя',en:'Education'},
    'Семья':{be:'Сям’я',en:'Family'},
    'Молодежь':{be:'Моладзь',en:'Youth'},
    'Туризм':{be:'Турызм',en:'Tourism'},
    'Военнообязанные':{be:'Ваеннаабавязаныя',en:'Military conscripts'},
    'Язык интерфейса':{be:'Мова інтэрфейсу',en:'Interface language'},
    'Выбор языка интерфейса':{be:'Выбар мовы інтэрфейсу',en:'Interface language selection'},

    'Навигация по новостям':{be:'Навігацыя па навінах',en:'News navigation'},
    'Следующая новость':{be:'Наступная навіна',en:'Next news story'},
    'Предыдущая новость':{be:'Папярэдняя навіна',en:'Previous news story'},
    'Прокрутить страницу вниз почти на высоту окна':{be:'Пракруціць старонку ўніз амаль на вышыню акна',en:'Scroll down by almost one viewport'},
    'Прокрутить страницу вверх почти на высоту окна':{be:'Пракруціць старонку ўверх амаль на вышыню акна',en:'Scroll up by almost one viewport'},
    'Перейти к первой новости':{be:'Перайсці да першай навіны',en:'Jump to the first news story'},
    'В конец списка':{be:'У канец спіса',en:'Jump to the end of the list'},
    'Открыть выбранную новость':{be:'Адкрыць выбраную навіну',en:'Open the selected news story'},
    'Вернуться на предыдущую страницу':{be:'Вярнуцца на папярэднюю старонку',en:'Go to the previous page'},
    'Назад или закрыть текущий экран':{be:'Назад або закрыць бягучы экран',en:'Go back or close the current screen'},
    'Предыдущая / следующая статья':{be:'Папярэдні / наступны артыкул',en:'Previous / next article'},
    'Открыть случайную новость':{be:'Адкрыць выпадковую навіну',en:'Open a random news story'},
    'Разделы и страницы':{be:'Раздзелы і старонкі',en:'Sections and pages'},
    'Перейти к разделу «Все новости»':{be:'Перайсці ў раздзел «Усе навіны»',en:'Go to the “All news” section'},
    'Поиск и интерфейс':{be:'Пошук і інтэрфейс',en:'Search and interface'},
    'Активировать сфокусированную кнопку или ссылку':{be:'Актываваць сфакусаваную кнопку або спасылку',en:'Activate the focused button or link'},
    'Перейти к соседнему элементу из текстового поля на границе текста':{be:'Перайсці да суседняга элемента з тэкставага поля на мяжы тэксту',en:'Move to the adjacent element from a text field at a text boundary'},
    'Перейти к следующему / предыдущему фокусируемому элементу':{be:'Перайсці да наступнага / папярэдняга элемента, які можна сфакусаваць',en:'Move to the next / previous focusable element'},
    'Фокус поиска':{be:'Фокус пошуку',en:'Focus search'},
    'Открыть / закрыть расширенную шпаргалку':{be:'Адкрыць / закрыць пашыраную шпаргалку',en:'Open / close the extended cheat sheet'},
    'Переключить светлую / тёмную тему':{be:'Пераключыць светлую / цёмную тэму',en:'Toggle light / dark theme'},
    'Открыть настройки версии для слабовидящих':{be:'Адкрыць налады версіі для слабавідушчых',en:'Open low-vision settings'},
    'Написание новостей':{be:'Напісанне навін',en:'Writing news'},
    'Написать новость / предложить новость читателем':{be:'Напісаць навіну / прапанаваць навіну чытачом',en:'Write a news story / suggest one as a reader'},
    'Редактировать открытую новость / предложить изменение читателем':{be:'Рэдагаваць адкрытую навіну / прапанаваць змену чытачом',en:'Edit the open story / suggest a change as a reader'},
    'Удалить открытую новость (администратор)':{be:'Выдаліць адкрытую навіну (адміністратар)',en:'Delete the open story (administrator)'},
    'Опубликовать новость / отправить предложение редактору':{be:'Апублікаваць навіну / адправіць прапанову рэдактару',en:'Publish the story / send the suggestion to the editor'},
    'Комментарии — всегда доступно':{be:'Каментарыі — заўсёды даступна',en:'Comments — always available'},
    'Включить / выключить управление комментариями':{be:'Уключыць / выключыць кіраванне каментарыямі',en:'Toggle comment keyboard controls'},
    'Перейти к написанию комментария':{be:'Перайсці да напісання каментарыя',en:'Go to the comment composer'},
    'Опубликовать комментарий в поле ввода':{be:'Апублікаваць каментарый у полі ўводу',en:'Post the comment from the input'},
    'Создать новый абзац в поле ввода':{be:'Стварыць новы абзац у полі ўводу',en:'Create a new paragraph in the input'},
    'Комментарии — режим управления':{be:'Каментарыі — рэжым кіравання',en:'Comments — control mode'},
    'Выбрать следующий комментарий':{be:'Выбраць наступны каментарый',en:'Select next comment'},
    'Выбрать предыдущий комментарий':{be:'Выбраць папярэдні каментарый',en:'Select previous comment'},
    'Предыдущая кнопка выбранного комментария':{be:'Папярэдняя кнопка выбранага каментарыя',en:'Previous button of the selected comment'},
    'Следующая кнопка выбранного комментария':{be:'Наступная кнопка выбранага каментарыя',en:'Next button of the selected comment'},
    'Активировать выбранную кнопку комментария':{be:'Актываваць выбраную кнопку каментарыя',en:'Activate the selected comment button'},
    'Изменить свой выбранный комментарий':{be:'Змяніць свой выбраны каментарый',en:'Edit your selected comment'},
    'Ответить на выбранный комментарий':{be:'Адказаць на выбраны каментарый',en:'Reply to the selected comment'},
    'Удалить свой выбранный комментарий':{be:'Выдаліць свой выбраны каментарый',en:'Delete your selected comment'},
    'Заблокировать автора выбранного комментария (администратор / владелец)':{be:'Заблакіраваць аўтара выбранага каментарыя (адміністратар / уладальнік)',en:'Block the selected comment author (administrator / owner)'},
    'Открыть публичный профиль автора':{be:'Адкрыць публічны профіль аўтара',en:'Open the author’s public profile'},
    'Положительная реакция':{be:'Станоўчая рэакцыя',en:'Positive reaction'},
    'Отрицательная реакция':{be:'Адмоўная рэакцыя',en:'Negative reaction'},
    'Редактор — всегда доступно':{be:'Рэдактар — заўсёды даступна',en:'Editor — always available'},
    'Включить / выключить управление редактором':{be:'Уключыць / выключыць кіраванне рэдактарам',en:'Toggle editor keyboard controls'},
    'Редактор — режим управления':{be:'Рэдактар — рэжым кіравання',en:'Editor — control mode'},
    'Следующий элемент редактора':{be:'Наступны элемент рэдактара',en:'Next editor element'},
    'Предыдущий элемент редактора':{be:'Папярэдні элемент рэдактара',en:'Previous editor element'},
    'Предыдущая кнопка панели редактора':{be:'Папярэдняя кнопка панэлі рэдактара',en:'Previous editor toolbar button'},
    'Следующая кнопка панели редактора':{be:'Наступная кнопка панэлі рэдактара',en:'Next editor toolbar button'},
    'Активировать выбранный элемент':{be:'Актываваць выбраны элемент',en:'Activate the selected element'},
    'Перейти к текстовому полю Markdown':{be:'Перайсці да тэкставага поля Markdown',en:'Focus the Markdown text field'},
    'Редактор Markdown':{be:'Рэдактар Markdown',en:'Markdown editor'},
    'Жирный текст':{be:'Тлусты тэкст',en:'Bold text'},
    'Курсив':{be:'Курсіў',en:'Italic'},
    'Добавить ссылку':{be:'Дадаць спасылку',en:'Add link'},
    'Нумерованный список':{be:'Нумараваны спіс',en:'Numbered list'},
    'Маркированный список':{be:'Маркіраваны спіс',en:'Bulleted list'},
    'Переключить язык интерфейса':{be:'Пераключыць мову інтэрфейсу',en:'Switch interface language'},
    'следующий язык':{be:'наступную мову',en:'next language'},
    'Переключить на следующий язык интерфейса':{be:'Пераключыць на наступную мову інтэрфейсу',en:'Switch to the next interface language'},

    'Изображение недоступно для анализа цвета.':{be:'Выява недаступная для аналізу колеру.',en:'The image is unavailable for color analysis.'},
    'Canvas недоступен.':{be:'Canvas недаступны.',en:'Canvas is unavailable.'},
    'В изображении нет непрозрачных пикселей.':{be:'У выяве няма непразрыстых пікселяў.',en:'The image has no opaque pixels.'},
    'Версия для слабовидящих включена.':{be:'Версія для слабавідушчых уключана.',en:'Low-vision version enabled.'},
    'Обычная версия сайта включена.':{be:'Звычайная версія сайта ўключана.',en:'Standard site version enabled.'},
    'Настройки доступности сброшены.':{be:'Налады даступнасці скінутыя.',en:'Accessibility settings reset.'},
    'Редактор доступен только администраторам':{be:'Рэдактар даступны толькі адміністратарам',en:'The editor is available only to administrators'},
    'Редактор доступен только авторизованным пользователям.':{be:'Рэдактар даступны толькі аўтарызаваным карыстальнікам.',en:'The editor is available only to signed-in users.'},
    'Сначала войдите в аккаунт':{be:'Спачатку ўвайдзіце ў акаўнт',en:'Sign in first'},
    'Ваш аккаунт заблокирован.':{be:'Ваш акаўнт заблакіраваны.',en:'Your account is blocked.'},
    'Нужен аккаунт.':{be:'Патрэбен акаўнт.',en:'An account is required.'},
    'Нужен аккаунт администратора.':{be:'Патрэбен акаўнт адміністратара.',en:'An administrator account is required.'},
    'Не удалось загрузить комментарии:':{be:'Не ўдалося загрузіць каментарыі:',en:'Failed to load comments:'},
    'неизвестная ошибка':{be:'невядомая памылка',en:'unknown error'},
    'Новость обновлена':{be:'Навіна абноўлена',en:'News story updated'},
    'Новость опубликована':{be:'Навіна апублікавана',en:'News story published'},
    'Новость удалена':{be:'Навіна выдалена',en:'News story deleted'},
    'Не удалось сохранить новость.':{be:'Не ўдалося захаваць навіну.',en:'Failed to save the news story.'},
    'Не удалось удалить новость.':{be:'Не ўдалося выдаліць навіну.',en:'Failed to delete the news story.'},
    'В редакторе пока нет доступных элементов.':{be:'У рэдактары пакуль няма даступных элементаў.',en:'There are no available editor elements yet.'},
    'Управление редактором с клавиатуры доступно в редакторе администратору или владельцу.':{be:'Кіраванне рэдактарам з клавіятуры даступнае ўладальніку або адміністратару ў рэдактары.',en:'Keyboard editor controls are available to an administrator or owner in the editor.'},
    'Управление редактором с клавиатуры включено.':{be:'Кіраванне рэдактарам з клавіятуры ўключана.',en:'Editor keyboard controls enabled.'},
    'Управление редактором с клавиатуры выключено.':{be:'Кіраванне рэдактарам з клавіятуры выключана.',en:'Editor keyboard controls disabled.'},
    'Других материалов в этом направлении нет':{be:'Іншых матэрыялаў у гэтым напрамку няма',en:'No other materials in this direction'},
    'Кадрирование применено. После сохранения изображение будет загружено в Supabase Storage.':{be:'Кадраванне ўжыта. Пасля захавання выява будзе загружана ў Supabase Storage.',en:'Cropping applied. The image will be uploaded to Supabase Storage after saving.'},
    'Загружаем обложку…':{be:'Загрузка вокладкі…',en:'Uploading cover…'},
    'Пока нет опубликованных материалов из Supabase.':{be:'Пакуль няма апублікаваных матэрыялаў з Supabase.',en:'There are no published materials from Supabase yet.'},
    'Новых предложений пока нет.':{be:'Новых прапаноў пакуль няма.',en:'There are no new suggestions yet.'},
    'Чтобы оставить комментарий, войдите в аккаунт.':{be:'Каб пакінуць каментарый, увайдзіце ў акаўнт.',en:'Sign in to leave a comment.'},
    'Дата неизвестна':{be:'Дата невядомая',en:'Unknown date'},
    'Подтверждение':{be:'Пацвярджэнне',en:'Confirmation'},
    'Подтвердить действие?':{be:'Пацвердзіць дзеянне?',en:'Confirm action?'},
    'Назад':{be:'Назад',en:'Back'},
    'Закрыть':{be:'Закрыць',en:'Close'},
    'Станьте первым, кто выскажется.':{be:'Станьце першым, хто выкажацца.',en:'Be the first to have your say.'},
    'Сохранить черновик':{be:'Захаваць чарнавік',en:'Save draft'},
    'Выйти':{be:'Выйсці',en:'Sign out'},
    'Написать новость':{be:'Напісаць навіну',en:'Write a news story'},
    'Предложить новость':{be:'Прапанаваць навіну',en:'Suggest a news story'},
    'Управление пользователями':{be:'Кіраванне карыстальнікамі',en:'User management'},
    'Пользователи':{be:'Карыстальнікі',en:'Users'},
    'Показать все':{be:'Паказаць усё',en:'Show all'},
    'Действия':{be:'Дзеянні',en:'Actions'},
    'Чистые реакции':{be:'Чыстыя рэакцыі',en:'Net reactions'},
    'Публикации':{be:'Публікацыі',en:'Publications'},
    'Аккаунт заблокирован':{be:'Акаўнт заблакіраваны',en:'Account blocked'},
    'Написание новостей':{be:'Напісанне навін',en:'Writing news'},
    'Редактор сохраняет черновик локально.':{be:'Рэдактар захоўвае чарнавік лакальна.',en:'The editor saves the draft locally.'},
    'Поддерживаются':{be:'Падтрымліваюцца',en:'Supported'},
    'Начните писать…\\n\\nПоддерживается обычный Markdown: заголовки, **жирный**, *курсив*, списки, цитаты, ссылки, изображения, таблицы, код и разделители.':{be:'Пачніце пісаць…\\n\\nПадтрымліваецца звычайны Markdown: загалоўкі, **тлусты**, *курсіў*, спісы, цытаты, спасылкі, выявы, табліцы, код і раздзяляльнікі.',en:'Start writing…\\n\\nStandard Markdown is supported: headings, **bold**, *italic*, lists, quotes, links, images, tables, code, and dividers.'}
  };

  const userContentSelector=[
    'input','textarea','select','[contenteditable="true"]',
    '.news-title','.news-summary','.article-markdown','.article-lead',
    '.profile-name','.profile-bio','.community-comment-body',
    '.management-suggestion-title','.saved-draft-title','.profile-management-card-title',
    '[data-user-content]'
  ].join(',');

  let current='ru';
  try{const saved=localStorage.getItem(STORAGE_KEY);if(ORDER.includes(saved))current=saved;}catch(_){ }
  const textBindings=new WeakMap();
  const attrBindings=new WeakMap();
  const trackedTextNodes=new Set();
  const trackedElements=new Set();
  const richBindings=new WeakMap();

  const normalize=value=>String(value??'').replace(/\\s+/g,' ').trim();
  const locale=()=>LANGUAGES[current]?.locale||'ru-RU';

  function translateExact(source,code=current){
    const key=normalize(source);
    if(!key)return source;
    if(!I18N[key])return source;
    if(code==='ru')return key;
    return I18N[key][code]||key;
  }

  function transform(source,code=current){
    const exact=translateExact(source,code);
    if(exact!==normalize(source)||I18N[normalize(source)]) {
      return String(source).replace(normalize(source),exact);
    }
    const raw=String(source);
    const replacements=[
      [/^Автор:\\s*(.*)$/,'Автор:','Author:'],
      [/^Заблокирован:\\s*(.*)$/,'Заблокирован:','Blocked:'],
      [/^Изменено$/,'Изменено','Edited'],
      [/^(\\d+)\\s+новост(?:ь|и|ей)\\s+по\\s+запросу$/,'',''],
      [/^(\\d+)\\s+материал(?:а|ов)?$/,'',''],
      [/^(\\d+)\\s+сочетани(?:е|я|й)$/,'',''],
      [/^(\\d+)\\s+жест(?:а|ов)?$/,'','']
    ];
    for(const [rx,ruPrefix,enPrefix] of replacements){
      const m=raw.match(rx);
      if(!m)continue;
      if(/новост/.test(rx.source)){
        const n=Number(m[1]);
        if(code==='ru')return raw;
        if(code==='en')return n+' '+(n===1?'news story':'news stories')+' for the query';
        return n+' '+(n===1?'навіна':'навін')+' па запыце';
      }
      if(/материал/.test(rx.source)){
        const n=Number(m[1]);
        if(code==='ru')return raw;
        if(code==='en')return n+' '+(n===1?'material':'materials');
        return n+' '+(n===1?'матэрыял':'матэрыялы');
      }
      if(/сочетани/.test(rx.source)){
        const n=Number(m[1]);
        if(code==='ru')return raw;
        if(code==='en')return n+' '+(n===1?'shortcut':'shortcuts');
        return n+' '+(n===1?'спалучэнне':'спалучэнні');
      }
      if(/жест/.test(rx.source)){
        const n=Number(m[1]);
        if(code==='ru')return raw;
        if(code==='en')return n+' '+(n===1?'gesture':'gestures');
        return n+' '+(n===1?'жэст':'жэсты');
      }
      if(code==='ru')return raw;
      const marker=translateExact(ruPrefix,code);
      return raw.replace(ruPrefix,marker||enPrefix);
    }

    let m=raw.match(/^Ваш аккаунт заблокирован:\\s*(.*)$/);
    if(m&&code!=='ru')return (code==='en'?'Your account is blocked: ':'Ваш акаўнт заблакіраваны: ')+m[1];

    m=raw.match(/^Не удалось подключиться к Supabase:\\s*(.*)$/);
    if(m&&code!=='ru')return (code==='en'?'Failed to connect to Supabase: ':'Не ўдалося падключыцца да Supabase: ')+m[1];

    m=raw.match(/^Не удалось загрузить комментарии:\\s*(.*)$/);
    if(m&&code!=='ru')return (code==='en'?'Failed to load comments: ':'Не ўдалося загрузіць каментарыі: ')+m[1];

    m=raw.match(/^Регистрация:\\s*(.*?)\\s*·\\s*(.*?)\\s*·\\s*(\\d+)\\s+чистых реакций\\s*·\\s*(\\d+)\\s+публикаций$/);
    if(m&&code!=='ru'){
      return (code==='en'?'Registration: ':'Рэгістрацыя: ')+m[1]+' · '+m[2]+' · '+m[3]+' '+(code==='en'?'net reactions':'чыстых рэакцый')+' · '+m[4]+' '+(code==='en'?'publications':'публікацый');
    }

    m=raw.match(/^(\\d+)\\s+чистых реакций\\s*·\\s*(\\d+)\\s+публикаций$/);
    if(m&&code!=='ru')return m[1]+' '+(code==='en'?'net reactions':'чыстых рэакцый')+' · '+m[2]+' '+(code==='en'?'publications':'публікацый');

    return raw;
  }

  function localizeTextValue(value,code){
    const source=String(value??'');
    const core=normalize(source);
    if(!core)return source;
    const translated=translateExact(core,code)!==core||I18N[core]
      ?translateExact(core,code)
      :transform(core,code);
    if(translated===core)return source;
    const leading=(source.match(/^\\s*/)||[''])[0];
    const trailing=(source.match(/\\s*$/)||[''])[0];
    const start=leading.length;
    const end=trailing.length;
    return leading+translated+((end>0&&end<=source.length-start)?source.slice(source.length-end):'');
  }

  function isProtected(node){
    const el=node?.nodeType===Node.TEXT_NODE?node:node;
    return !!el?.closest?.(userContentSelector);
  }

  function isTranslatableText(node){
    if(!node||node.nodeType!==Node.TEXT_NODE||isProtected(node))return false;
    const key=normalize(node.nodeValue);
    if(!key)return false;
    if(I18N[key])return true;
    return transform(key,'be')!==key||transform(key,'en')!==key;
  }

  function translateTextNode(node){
    if(!node||node.nodeType!==Node.TEXT_NODE||isProtected(node))return;
    let key=textBindings.get(node);
    if(!key){
      if(!isTranslatableText(node))return;
      key=node.nodeValue;
      textBindings.set(node,key);
    }
    const next=localizeTextValue(key,current);
    if(node.nodeValue!==next)node.nodeValue=next;
    trackedTextNodes.add(node);
  }

  function translateAttributes(root){
    const elements=[];
    if(root?.nodeType===Node.ELEMENT_NODE)elements.push(root);
    if(root?.querySelectorAll)elements.push(...root.querySelectorAll('[aria-label],[placeholder],[title],[alt]'));
    for(const el of elements){
      if(!el)continue;
      const map=attrBindings.get(el)||Object.create(null);
      let useful=false;
      for(const attr of ['aria-label','placeholder','title','alt']){
        if(!el.hasAttribute(attr))continue;
        const value=el.getAttribute(attr);
        if(!value)continue;
        const key=map[attr]||normalize(value);
        if(!map[attr]&&I18N[key])map[attr]=key;
        if(!map[attr])continue;
        useful=true;
        const next=current==='ru'?map[attr]:I18N[map[attr]]?.[current]||map[attr];
        if(value!==next)el.setAttribute(attr,next);
      }
      if(useful){attrBindings.set(el,map);trackedElements.add(el);}
    }
  }

  const markdownHelpHtml={
    ru:'Поддерживаются <code># заголовки</code>, <code>**bold**</code>, <code>*italic*</code>, <code>~~strike~~</code>, <code>&#96;code&#96;</code>, блоки <code>&#96;&#96;&#96;</code>, цитаты <code>&gt;</code>, списки, <code>[ссылки](url)</code>, <code>![картинки](url)</code>, таблицы и <code>---</code>. Редактор сохраняет черновик локально.',
    be:'Падтрымліваюцца <code># загалоўкі</code>, <code>**bold**</code>, <code>*italic*</code>, <code>~~strike~~</code>, <code>&#96;code&#96;</code>, блокі <code>&#96;&#96;&#96;</code>, цытаты <code>&gt;</code>, спісы, <code>[спасылкі](url)</code>, <code>![выявы](url)</code>, табліцы і <code>---</code>. Рэдактар захоўвае чарнавік лакальна.',
    en:'Supported: <code># headings</code>, <code>**bold**</code>, <code>*italic*</code>, <code>~~strike~~</code>, <code>&#96;code&#96;</code> blocks, quotes <code>&gt;</code>, lists, <code>[links](url)</code>, <code>![images](url)</code>, tables, and <code>---</code>. The editor saves the draft locally.'
  };

  function translateRich(root=document.body){
    const elements=[];
    if(root?.nodeType===Node.ELEMENT_NODE&&root.matches?.('.markdown-help'))elements.push(root);
    if(root?.querySelectorAll)elements.push(...root.querySelectorAll('.markdown-help'));
    for(const el of elements){
      const html=markdownHelpHtml[current]||markdownHelpHtml.ru;
      if(el.innerHTML!==html){
        richBindings.set(el,true);
        el.innerHTML=html;
      }
    }
  }

  function translateTree(root=document.body){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);
    translateAttributes(root);
    translateRich(root);
  }

  function refreshTracked(){
    trackedTextNodes.forEach(node=>{if(!node.isConnected)trackedTextNodes.delete(node);});
    trackedElements.forEach(el=>{if(!el.isConnected)trackedElements.delete(el);});
    trackedTextNodes.forEach(translateTextNode);
    trackedElements.forEach(el=>translateAttributes(el));
    translateRich(document.body);
  }

  function closeLanguageMenu(){
    const control=document.querySelector('#language-select');
    if(!control)return;
    control.classList.remove('is-open');
    control.querySelector('.editor-select-button')?.setAttribute('aria-expanded','false');
  }

  function updatePicker(){
    const control=document.querySelector('#language-select');
    if(!control)return;
    const button=control.querySelector('.editor-select-button');
    const value=control.querySelector('.editor-select-value');
    if(value)value.textContent=LANGUAGES[current].label;
    button?.setAttribute('aria-label',(translateExact('Язык интерфейса',current)+': ')+LANGUAGES[current].label);
    control.querySelectorAll('[data-language]').forEach(option=>{
      option.classList.toggle('is-selected',option.dataset.language===current);
      option.setAttribute('aria-selected',option.dataset.language===current?'true':'false');
    });
  }

  let applying=false;
  function setLanguage(code,{persist=true,announce=true}={}){
    if(!LANGUAGES[code])return false;
    current=code;
    if(persist){try{localStorage.setItem(STORAGE_KEY,code);}catch(_){}}
    document.documentElement.lang=LANGUAGES[code].code;
    document.documentElement.dataset.language=code;
    updatePicker();
    applying=true;
    observer?.disconnect();
    try{refreshTracked();}finally{
      applying=false;
      if(document.body)observer?.observe(document.body,observerConfig);
    }
    if(announce&&typeof window.showToast==='function'){
      const text=code==='en'?'Interface language: English':code==='be'?'Мова інтэрфейсу: беларуская':'Язык интерфейса: русский';
      window.showToast(text);
    }
    window.dispatchEvent(new CustomEvent('interface-language-change',{detail:{code}}));
    return true;
  }

  function nextLanguage(){
    const index=ORDER.indexOf(current);
    return setLanguage(ORDER[(index+1)%ORDER.length]);
  }

  function initPicker(){
    const control=document.querySelector('#language-select');
    if(!control)return;
    const button=control.querySelector('.editor-select-button');
    const menu=control.querySelector('.editor-select-menu');
    if(!button||!menu)return;
    if(control.dataset.languageBound!=='1'){
      control.dataset.languageBound='1';
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        const open=control.classList.toggle('is-open');
        if(open){
          document.querySelectorAll('.editor-select-control.is-open').forEach(other=>{
            if(other!==control){
              other.classList.remove('is-open');
              other.querySelector('.editor-select-button')?.setAttribute('aria-expanded','false');
            }
          });
        }
        button.setAttribute('aria-expanded',open?'true':'false');
      });
      menu.querySelectorAll('[data-language]').forEach(option=>{
        option.addEventListener('click',event=>{
          event.preventDefault();event.stopPropagation();
          setLanguage(option.dataset.language);
          closeLanguageMenu();
        });
      });
      button.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();closeLanguageMenu();}
        else if(event.key==='Enter'||event.key===' '){event.preventDefault();button.click();}
      });
      document.addEventListener('click',event=>{
        if(!control.contains(event.target))closeLanguageMenu();
      },true);
    }
    updatePicker();
  }

  document.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    if(event.altKey&&!event.ctrlKey&&!event.metaKey&&event.code==='KeyL'){
      event.preventDefault();event.stopImmediatePropagation();nextLanguage();
    }
  },true);

  window.getInterfaceLanguage=()=>current;
  window.getInterfaceLocale=locale;
  window.tInterface=(key,fallback)=>translateExact(key,current)||fallback||key;
  window.setInterfaceLanguage=setLanguage;
  window.nextInterfaceLanguage=nextLanguage;

  const observerConfig={subtree:true,childList:true};
  const observer=new MutationObserver(mutations=>{
    if(applying)return;
    observer.disconnect();
    try{
      for(const mutation of mutations){
        mutation.addedNodes.forEach(node=>{
          if(node.nodeType===Node.TEXT_NODE)translateTextNode(node);
          else if(node.nodeType===Node.ELEMENT_NODE)translateTree(node);
        });
      }
    }finally{
      if(document.body&&!applying)observer.observe(document.body,observerConfig);
    }
  });

  const boot=()=>{
    document.documentElement.lang=LANGUAGES[current].code;
    document.documentElement.dataset.language=current;
    initPicker();
    translateTree(document.body);
    if(document.body)observer.observe(document.body,observerConfig);
  };


})();