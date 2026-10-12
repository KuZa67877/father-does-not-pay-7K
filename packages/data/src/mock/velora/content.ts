/** Тексты фикстур соцсети. Люди и посты вымышлены. */

export const USERS = [
  { name: 'Анна Соколова', login: 'demo', occupation: 'Фотограф', city: 'Москва', topic: 'Фото', img: 5 },
  { name: 'Екатерина Белова', login: 'belova', occupation: 'Тревел-блогер', city: 'Казань', topic: 'Путешествия', img: 47 },
  { name: 'Марина Лебедева', login: 'lebedeva', occupation: 'Плёночный фотограф', city: 'Санкт-Петербург', topic: 'Фото', img: 44 },
  { name: 'Павел Громов', login: 'gromov', occupation: 'Шеф-повар', city: 'Екатеринбург', topic: 'Еда', img: 13 },
  { name: 'Дмитрий Орлов', login: 'orlov', occupation: 'Инженер-реставратор', city: 'Нижний Новгород', topic: 'Ретро-автомобили', img: 12 },
  { name: 'Максим Ветров', login: 'vetrov', occupation: 'Продуктовый дизайнер', city: 'Москва', topic: 'Дизайн', img: 15 },
  { name: 'Вера Ким', login: 'kim', occupation: 'Иллюстратор', city: 'Владивосток', topic: 'Творчество', img: 45 },
  { name: 'Елизавета Морозова', login: 'morozova', occupation: 'Музыкант', city: 'Самара', topic: 'Музыка', img: 49 },
  { name: 'Никита Соловьёв', login: 'soloviev', occupation: 'Разработчик', city: 'Новосибирск', topic: 'Технологии', img: 60 },
  { name: 'Ольга Тихонова', login: 'tikhonova', occupation: 'Керамист', city: 'Ярославль', topic: 'Творчество', img: 32 },
  { name: 'Игорь Савельев', login: 'saveliev', occupation: 'Звукорежиссёр', city: 'Москва', topic: 'Музыка', img: 53 },
  { name: 'Команда Ольхи', login: 'admin', occupation: 'Команда сайта', city: '', topic: 'Мысли', img: 0 },
] as const;

export const CATEGORIES = [
  { slug: 'creativity', name: 'Творчество', icon: 'wand-sparkles', color: '#7A5AF8', description: 'Рисунки, керамика, рукоделие и всё, что сделано руками.' },
  { slug: 'everyday', name: 'Повседневность', icon: 'sun', color: '#E8A317', description: 'Маленькие радости обычных дней.' },
  { slug: 'tech', name: 'Технологии', icon: 'cpu', color: '#4B3FE0', description: 'Гаджеты, код и полезные сервисы.' },
  { slug: 'music', name: 'Музыка', icon: 'music', color: '#D9447A', description: 'Что слушаем, играем и записываем.' },
  { slug: 'design', name: 'Дизайн', icon: 'pen-tool', color: '#E2603A', description: 'Интерфейсы, шрифты и вещи, которые приятно держать в руках.' },
  { slug: 'food', name: 'Еда', icon: 'cooking-pot', color: '#E85D3F', description: 'Рецепты, рынки и места, куда хочется вернуться.' },
  { slug: 'retro-cars', name: 'Ретро-автомобили', icon: 'car', color: '#3B3B98', description: 'Восстановление, поездки и истории машин.' },
  { slug: 'travel', name: 'Путешествия', icon: 'map', color: '#1F6B55', description: 'Маршруты и впечатления.' },
  { slug: 'photo', name: 'Фото', icon: 'camera', color: '#2D4F9A', description: 'Кадры, плёнка, техника.' },
  { slug: 'thoughts', name: 'Мысли', icon: 'feather', color: '#1F6B55', description: 'Заметки и размышления.' },
] as const;

export interface PostSeed {
  author: string;
  title?: string;
  text: string;
  photos?: number;
  categories: string[];
  location?: string;
  poll?: { question: string; options: [string, number][] };
  video?: boolean;
  files?: string[];
  ago: number;
  pinned?: boolean;
  repostOf?: number;
}

export const POSTS: PostSeed[] = [
  {
    author: 'admin', pinned: true, title: 'Добро пожаловать в Ольху',
    text: 'Ольха — место для тех, кто пишет и снимает медленно. Здесь нет бесконечной ленты рекомендаций: только люди, на которых вы подписались, категории, которые вам интересны, и разговоры под постами.\n\nНачните с полосы историй сверху или загляните в «Обзор» — там лучшее за неделю. #добропожаловать',
    photos: 1, categories: ['thoughts'], ago: 60 * 24 * 22,
  },
  {
    author: 'lebedeva', title: 'Пока город не проснулся',
    text: 'Вышла в пять утра на набережную с плёночной камерой. Тишина, туман и ни одного человека. Плёнка — Portra 400, проявляла сама. #ПлёночноеФото #утро #Петербург',
    photos: 3, categories: ['photo'], location: 'Санкт-Петербург, Английская набережная', ago: 42,
  },
  {
    author: 'saveliev', title: 'Рахманинов играет сам себя',
    text: 'Нашёл в архиве оцифровку записи на перфоленте для механического пианино. Звучит удивительно живо — послушайте с хорошими наушниками. Расскажу, как такие записи восстанавливают, если будет интересно.',
    categories: ['music'], files: ['Заметки о реставрации записи.pdf'], ago: 95,
  },
  {
    author: 'gromov',
    text: 'Осенний суп из тыквы с печёным чесноком и ложкой сметаны. Рецепт простой, секрет — запечь тыкву, а не варить. Кто пробовал добавлять имбирь? #рецепты #осень',
    photos: 2, categories: ['food'], ago: 130,
  },
  {
    author: 'vetrov', title: 'Сдержанность — это фича',
    text: 'Чем дольше работаю с интерфейсами, тем больше ценю экраны, где ничего не мигает. Хороший продукт не борется за внимание, а уважает его. Собрал пять примеров приложений, которые делают это красиво — в комментариях.',
    categories: ['design', 'thoughts'], ago: 180,
  },
  {
    author: 'belova',
    text: 'Казанский кремль на закате — каждый раз как в первый. @lebedeva, помнишь, мы обещали сделать совместную прогулку с камерами? #Казань #МедленнаяЖизнь',
    photos: 4, categories: ['travel', 'photo'], location: 'Казань', ago: 240,
  },
  {
    author: 'soloviev',
    text: 'Какой редактор кода у вас сейчас основной? Хочу собрать статистику для доклада.',
    categories: ['tech'], ago: 300,
    poll: { question: 'Основной редактор кода', options: [['VS Code', 128], ['JetBrains IDE', 74], ['Vim / Neovim', 31], ['Что-то другое', 12]] },
  },
  {
    author: 'orlov', title: 'Двадцать лет в гараже',
    text: 'Закончили восстановление седана 1968 года. Кузов собирали буквально по частям, оригинальную краску подбирали по сохранившемуся куску под сиденьем. Первая поездка — завтра. #ретро #реставрация',
    photos: 4, categories: ['retro-cars'], location: 'Нижний Новгород', ago: 380,
  },
  {
    author: 'kim',
    text: 'Иллюстрация для детской книги про кота, который боялся дождя. Акварель + немного гуаши. Как вам цвета?',
    photos: 1, categories: ['creativity'], ago: 460,
  },
  {
    author: 'morozova', title: 'Репетиция в пустом зале',
    text: 'Иногда пустой зал звучит лучше полного. Записали короткое видео с прогона — смотрите со звуком. #музыка',
    video: true, categories: ['music'], ago: 600,
  },
  {
    author: 'tikhonova',
    text: 'Новая серия кружек: глазурь «северное море». Каждая получилась своей, ни одной одинаковой. #керамика',
    photos: 3, categories: ['creativity'], ago: 720,
  },
  {
    author: 'demo', title: 'Свет на Патриарших',
    text: 'Вечерний свет на прудах в октябре — лучшее, что случается с Москвой осенью. Снимала на 35 мм. #Москва #МедленнаяЖизнь',
    photos: 2, categories: ['photo'], location: 'Москва, Патриаршие пруды', ago: 900,
  },
  {
    author: 'gromov',
    text: 'Кофе или чай по утрам?',
    categories: ['food', 'everyday'], ago: 1100,
    poll: { question: 'Утренний напиток', options: [['Кофе', 212], ['Чай', 168], ['Вода с лимоном', 37]] },
  },
  {
    author: 'vetrov',
    text: 'Отличная мысль про спокойные интерфейсы — подписываюсь под каждым словом.',
    categories: ['design'], ago: 1300, repostOf: 4,
  },
  {
    author: 'belova',
    text: 'Маршрут выходного дня: три маленьких города в двух часах от Казани. Собрала всё в один файл — время в пути, где поесть, что посмотреть. #путешествия',
    categories: ['travel'], files: ['Маршрут выходного дня.pdf', 'Карта.png'], ago: 1600,
  },
  {
    author: 'soloviev',
    text: 'Переписал домашний сервер с нуля и наконец сделал нормальные бэкапы. Совет на миллион: проверяйте, что бэкап восстанавливается, а не только создаётся.',
    categories: ['tech'], ago: 2000,
  },
  {
    author: 'lebedeva',
    text: 'Купила старую дальномерную камеру на блошином рынке. Затвор живой, дальномер нужно юстировать. Есть мастер в Петербурге, кому можно доверить? @orlov, может, подскажешь?',
    photos: 1, categories: ['photo'], ago: 2400,
  },
  {
    author: 'kim',
    text: 'Скетчбук за сентябрь. Рисую по 15 минут каждый вечер — это оказалось лучше, чем по три часа в выходные. #творчество',
    photos: 4, categories: ['creativity', 'everyday'], ago: 3000,
  },
  {
    author: 'orlov',
    text: 'Утро на трассе. Машина не новая, но едет так, будто ей снова двадцать.',
    photos: 1, categories: ['retro-cars', 'travel'], location: 'Трасса М7', ago: 3800,
  },
  {
    author: 'morozova',
    text: 'Собрала плейлист для долгих осенних прогулок — ни одной громкой песни. Делитесь своими!',
    categories: ['music', 'everyday'], ago: 4500,
  },
  {
    author: 'tikhonova',
    text: 'Как вы относитесь к трещинкам на глазури: брак или характер?',
    categories: ['creativity'], ago: 5200,
    poll: { question: 'Трещинки на глазури', options: [['Это характер', 94], ['Это брак', 21], ['Зависит от вещи', 58]] },
  },
  {
    author: 'demo',
    text: 'Собрала историю из поездки на Ладогу в «Актуальное». Там тихо, холодно и очень красиво.',
    photos: 3, categories: ['travel', 'photo'], location: 'Ладожское озеро', ago: 6400,
  },
  {
    author: 'saveliev',
    text: 'Небольшой лайфхак для записи дома: одеяло на стене работает лучше, чем дешёвые акустические панели. Проверено.',
    categories: ['music', 'tech'], ago: 7800,
  },
  {
    author: 'gromov',
    text: 'Свежий хлеб на закваске. Третья попытка — наконец-то с правильной коркой.',
    photos: 2, categories: ['food'], ago: 9000,
  },
];

export const COMMENTS = [
  'Очень красиво, сохранила себе!',
  'А какой объектив?',
  'Спасибо, что делитесь процессом.',
  'Атмосферно. Хочется туда прямо сейчас.',
  'Попробую повторить на выходных.',
  'Согласен на сто процентов.',
  'Ничего себе, сколько работы!',
  'Подскажите, где такое купить?',
];

export const STORY_TEXTS = [
  { text: 'Сегодня без телефона до обеда. Кто со мной?', background: '#4B3FE0', font: 'serif' as const },
  { text: 'Новая партия кружек выйдет в пятницу', background: '#1F6B55', font: 'sans' as const },
  { text: 'Репетиция в 19:00, приходите', background: '#D9441F', font: 'mono' as const },
];

export const TRENDING = ['Москва', 'утро', 'Петербург', 'МедленнаяЖизнь', 'ПлёночноеФото'];
