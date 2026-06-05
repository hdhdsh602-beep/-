export interface VocabularyMeta {
  english: string;
  arabic: string;
  phonetics: string;
  category: string;
  exampleEn: string;
  exampleAr: string;
}

export const VOCABULARY_MAP: Record<string, VocabularyMeta> = {
  person: {
    english: "Person",
    arabic: "شخص / إنسان",
    phonetics: "/ˈpɜː.sən/",
    category: "عام" ,
    exampleEn: "Every person has a unique voice.",
    exampleAr: "لكل شخص صوت فريد من نوعه."
  },
  bicycle: {
    english: "Bicycle",
    arabic: "دراجة هوائية",
    phonetics: "/ˈbaɪ.sɪ.kəl/",
    category: "وسائل النقل",
    exampleEn: "He rides his bicycle to school every morning.",
    exampleAr: "يركب دراجته الهوائية إلى المدرسة كل صباح."
  },
  car: {
    english: "Car",
    arabic: "سيارة",
    phonetics: "/kɑːr/",
    category: "وسائل النقل",
    exampleEn: "My parents bought a new red car.",
    exampleAr: "اشترى والداي سيارة حمراء جديدة."
  },
  motorcycle: {
    english: "Motorcycle",
    arabic: "دراجة نارية",
    phonetics: "/ˈməʊ.tə.saɪ.kəl/",
    category: "وسائل النقل",
    exampleEn: "A motorcycle can travel very fast.",
    exampleAr: "الدراجة النارية يمكن أن تسير بسرعة كبيرة."
  },
  airplane: {
    english: "Airplane",
    arabic: "طائرة",
    phonetics: "/ˈeə.pleɪn/",
    category: "وسائل النقل",
    exampleEn: "The airplane landed safely at the airport.",
    exampleAr: "هبطت الطائرة بسلام في المطار."
  },
  bus: {
    english: "Bus",
    arabic: "حافلة",
    phonetics: "/bʌs/",
    category: "وسائل النقل",
    exampleEn: "We missed the school bus this morning.",
    exampleAr: "فاتتنا حافلة المدرسة هذا الصباح."
  },
  train: {
    english: "Train",
    arabic: "قطار",
    phonetics: "/treɪn/",
    category: "وسائل النقل",
    exampleEn: "The train departs from platform four.",
    exampleAr: "يغادر القطار من الرصيف رقم أربعة."
  },
  truck: {
    english: "Truck",
    arabic: "شاحنة",
    phonetics: "/trʌk/",
    category: "وسائل النقل",
    exampleEn: "The big truck is carrying heavy cargo.",
    exampleAr: "الشاحنة الكبيرة تحمل بضائع ثقيلة."
  },
  boat: {
    english: "Boat",
    arabic: "قارب",
    phonetics: "/bəʊt/",
    category: "وسائل النقل",
    exampleEn: "The small boat was sailing on the calm lake.",
    exampleAr: "الشراع الصغير كان يبحر في البحيرة الهادئة."
  },
  "traffic light": {
    english: "Traffic light",
    arabic: "إشارة مرور",
    phonetics: "/ˈtræf.ɪk laɪt/",
    category: "أدوات الشارع",
    exampleEn: "Stop when the traffic light turns red.",
    exampleAr: "قف عندما تتحول إشارة المرور إلى اللون الأحمر."
  },
  "fire hydrant": {
    english: "Fire hydrant",
    arabic: "صنبور حريق",
    phonetics: "/ˈfaɪə ˌhaɪ.drənt/",
    category: "أدوات الشارع",
    exampleEn: "Firefighters connect their hoses to the fire hydrant.",
    exampleAr: "يربط رجال الإطفاء خراطيمهم بصنبور الحريق."
  },
  "stop sign": {
    english: "Stop sign",
    arabic: "لوحة قف",
    phonetics: "/stɒp saɪn/",
    category: "أدوات الشارع",
    exampleEn: "All drivers must halt at the stop sign.",
    exampleAr: "يجب على جميع السائقين التوقف الكامل عند لوحة قف."
  },
  "parking meter": {
    english: "Parking meter",
    arabic: "عداد مواقف السيارات",
    phonetics: "/ˈpɑː.kɪŋ ˌmiː.tər/",
    category: "أدوات الشارع",
    exampleEn: "Insert a coin into the parking meter.",
    exampleAr: "أدخل عملة معدنية في عداد مواقف السيارات."
  },
  bench: {
    english: "Bench",
    arabic: "مقعد طويل",
    phonetics: "/bentʃ/",
    category: "الأثاث",
    exampleEn: "We rested on a park bench under the tree.",
    exampleAr: "لقد استرحنا على مقعد الحديقة الطويل تحت الشجرة."
  },
  bird: {
    english: "Bird",
    arabic: "طائر",
    phonetics: "/bɜːd/",
    category: "الحيوانات",
    exampleEn: "A colorful bird is singing in the garden.",
    exampleAr: "طائر ملون يغرد في الحديقة."
  },
  cat: {
    english: "Cat",
    arabic: "قطة",
    phonetics: "/kæt/",
    category: "الحيوانات",
    exampleEn: "The kitten is sleeping on the warm sofa.",
    exampleAr: "تنام القطة الصغيرة على الأريكة الدافئة."
  },
  dog: {
    english: "Dog",
    arabic: "كلب",
    phonetics: "/dɒɡ/",
    category: "الحيوانات",
    exampleEn: "The friendly dog wagged its tail happily.",
    exampleAr: "هز الكلب الودود ذيله بسعادة."
  },
  horse: {
    english: "Horse",
    arabic: "حصان",
    phonetics: "/hɔːs/",
    category: "الحيوانات",
    exampleEn: "He rode a white horse across the green meadow.",
    exampleAr: "ركب حصاناً أبيض عبر المرج الأخضر."
  },
  sheep: {
    english: "Sheep",
    arabic: "خروف / غنم",
    phonetics: "/ʃiːp/",
    category: "الحيوانات",
    exampleEn: "The sheep was grazing in the peaceful pasture.",
    exampleAr: "كان الخروف يرعى في المرعى الهادئ."
  },
  cow: {
    english: "Cow",
    arabic: "بقرة",
    phonetics: "/kaʊ/",
    category: "الحيوانات",
    exampleEn: "Cows give us fresh and healthy milk.",
    exampleAr: "الأبقار تعطينا كلاً من الحليب الطازج والصحي."
  },
  elephant: {
    english: "Elephant",
    arabic: "فيل",
    phonetics: "/ˈel.ɪ.fənt/",
    category: "الحيوانات",
    exampleEn: "An elephant has a long trunk and big ears.",
    exampleAr: "الفيل يمتلك خرطوماً طويلاً وآذاناً كبيرة."
  },
  bear: {
    english: "Bear",
    arabic: "دب",
    phonetics: "/beər/",
    category: "الحيوانات",
    exampleEn: "The grizzly bear is catching fish in the river.",
    exampleAr: "الدب الرمادي يصطاد الأسماك في النهر."
  },
  zebra: {
    english: "Zebra",
    arabic: "حمار وحشي",
    phonetics: "/ˈzeb.rə/",
    category: "الحيوانات",
    exampleEn: "A zebra has distinctive black and white stripes.",
    exampleAr: "يمتلك الحمار الوحشي خطوطاً مميزة باللونين الأسود والأبيض."
  },
  giraffe: {
    english: "Giraffe",
    arabic: "زرافة",
    phonetics: "/dʒɪˈrɑːf/",
    category: "الحيوانات",
    exampleEn: "The tall giraffe eats leaves off high branches.",
    exampleAr: "تأكل الزرافة الطويلة أوراق الشجر من الأغصان المرتفعة."
  },
  backpack: {
    english: "Backpack",
    arabic: "حقيبة ظهر",
    phonetics: "/ˈbæk.pæk/",
    category: "أغراض شخصية",
    exampleEn: "I packed my textbooks in my school backpack.",
    exampleAr: "وضعت كتبي المدرسية في حقيبة ظهري."
  },
  umbrella: {
    english: "Umbrella",
    arabic: "مظلة",
    phonetics: "/ʌmˈbrel.ə/",
    category: "أغراض شخصية",
    exampleEn: "Take an umbrella because it might rain today.",
    exampleAr: "خذ معك مظلة لأنها قد تمطر اليوم."
  },
  handbag: {
    english: "Handbag",
    arabic: "حقيبة يد",
    phonetics: "/ˈhænd.bæɡ/",
    category: "أغراض شخصية",
    exampleEn: "She carries her phone and keys in her handbag.",
    exampleAr: "تحمل هاتفها ومفاتيحها في حقيبة يدها."
  },
  tie: {
    english: "Tie",
    arabic: "ربطة عنق",
    phonetics: "/taɪ/",
    category: "أغراض شخصية",
    exampleEn: "He wore a black suit and a matching tie.",
    exampleAr: "ارتدى بدلة سوداء وربطة عنق متناسقة."
  },
  suitcase: {
    english: "Suitcase",
    arabic: "حقيبة سفر",
    phonetics: "/ˈsuːt.keɪs/",
    category: "أغراض شخصية",
    exampleEn: "I prepared my heavy suitcase for the long trip.",
    exampleAr: "جهزت حقيبتي الكبيرة للرحلة الطويلة."
  },
  frisbee: {
    english: "Frisbee",
    arabic: "قرص طائر",
    phonetics: "/ˈfrɪz.bi/",
    category: "ألعاب ورياضة",
    exampleEn: "We played with a frisbee at the beach.",
    exampleAr: "لعبنا بالقرص الطائر على الشاطئ."
  },
  skis: {
    english: "Skis",
    arabic: "زلاجات جليد",
    phonetics: "/skiːz/",
    category: "ألعاب ورياضة",
    exampleEn: "He bought new ski equipment for the winter holiday.",
    exampleAr: "اشترى زلاجات جليد جديدة لقضاء عطلة الشتاء."
  },
  snowboard: {
    english: "Snowboard",
    arabic: "لوح تزلج على الثلج",
    phonetics: "/ˈsnəʊ.bɔːd/",
    category: "ألعاب ورياضة",
    exampleEn: "She slides down the mountain on a snowboard.",
    exampleAr: "تتزلج على الجبل باستخدام لوح تزلج الثلج."
  },
  "sports ball": {
    english: "Sports ball",
    arabic: "كرة رياضية",
    phonetics: "/spɔːts bɔːl/",
    category: "ألعاب ورياضة",
    exampleEn: "Please kick the sports ball into the goal post.",
    exampleAr: "يرجى ركل الكرة الرياضية في المرمى."
  },
  kite: {
    english: "Kite",
    arabic: "طائرة ورقية",
    phonetics: "/kaɪt/",
    category: "ألعاب ورياضة",
    exampleEn: "The children are flying a beautiful kite in the sky.",
    exampleAr: "يقوم الأطفال بتحليق طائرة ورقية جميلة في السماء."
  },
  "baseball bat": {
    english: "Baseball bat",
    arabic: "مضرب بيسبول",
    phonetics: "/ˈbeɪs.bɔːl bæt/",
    category: "ألعاب ورياضة",
    exampleEn: "The player swung the baseball bat forcefully.",
    exampleAr: "قام اللاعب بأرجحة مضرب البيسبول بقوة."
  },
  "baseball glove": {
    english: "Baseball glove",
    arabic: "قفاز بيسبول",
    phonetics: "/ˈbeɪs.bɔːl ɡlʌv/",
    category: "ألعاب ورياضة",
    exampleEn: "He caught the flying ball with his leather glove.",
    exampleAr: "أمسك بالكرة الطائرة بقفاز البيسبول الجلدي الخاص به."
  },
  skateboard: {
    english: "Skateboard",
    arabic: "لوح تزلج",
    phonetics: "/ˈskeɪt.bɔːd/",
    category: "ألعاب ورياضة",
    exampleEn: "He can perform incredible tricks on his skateboard.",
    exampleAr: "يمكنه أداء حيل مذهلة على لوح التزلج الخاص به."
  },
  surfboard: {
    english: "Surfboard",
    arabic: "لوح ركوب الأمواج",
    phonetics: "/ˈsɜːf.bɔːd/",
    category: "ألعاب ورياضة",
    exampleEn: "The surfer waxed his surfboard before entering the sea.",
    exampleAr: "قام راكب الأمواج بوضع الشمع على لوحه قبل دخول البحر."
  },
  "tennis racket": {
    english: "Tennis racket",
    arabic: "مضرب تنس",
    phonetics: "/ˈten.ɪs ˌræk.ɪt/",
    category: "ألعاب ورياضة",
    exampleEn: "I need to restring my favorite tennis racket.",
    exampleAr: "أحتاج إلى إعادة شد أوتار مضرب التنس المفضل لدي."
  },
  bottle: {
    english: "Bottle",
    arabic: "زجاجة / قارورة",
    phonetics: "/ˈbɒt.əl/",
    category: "أواني ومطبخ",
    exampleEn: "She filled the glass bottle with cold water.",
    exampleAr: "ملأت الزجاجة بالماء البارد."
  },
  "wine glass": {
    english: "Wine glass",
    arabic: "كأس",
    phonetics: "/waɪn ɡlɑːs/",
    category: "أواني ومطبخ",
    exampleEn: "Be careful not to shatter the delicate glass.",
    exampleAr: "كن حذراً حتى لا تكسر الكأس الرقيق."
  },
  cup: {
    english: "Cup",
    arabic: "كوب / فنجان",
    phonetics: "/kʌp/",
    category: "أواني ومطبخ",
    exampleEn: "He drank a hot cup of tea after lunch.",
    exampleAr: "شرب كوباً من الشاي الساخن بعد الغداء."
  },
  fork: {
    english: "Fork",
    arabic: "شوكة",
    phonetics: "/fɔːk/",
    category: "أواني ومطبخ",
    exampleEn: "She eats her Italian pasta with a metal fork.",
    exampleAr: "تأكل المعكرونة الإيطالية بشوكة معدنية."
  },
  knife: {
    english: "Knife",
    arabic: "سكين",
    phonetics: "/naɪf/",
    category: "أواني ومطبخ",
    exampleEn: "The chef used a sharp knife to slice the steak.",
    exampleAr: "استخدم الطاهي سكيناً حاداً لتقطيع شريحة اللحم."
  },
  spoon: {
    english: "Spoon",
    arabic: "ملعقة",
    phonetics: "/spuːn/",
    category: "أواني ومطبخ",
    exampleEn: "Eat your soup with a clean table spoon.",
    exampleAr: "تناول حساءك بملعقة طعام نظيفة."
  },
  bowl: {
    english: "Bowl",
    arabic: "وعاء / زبدية",
    phonetics: "/bəʊl/",
    category: "أواني ومطبخ",
    exampleEn: "He poured milk and crunchy cornflakes into a deep bowl.",
    exampleAr: "صب الحليب ورقائق الذرة المقرمشة في وعاء عميق."
  },
  banana: {
    english: "Banana",
    arabic: "موز",
    phonetics: "/bəˈnɑː.nə/",
    category: "طعام وفواكه",
    exampleEn: "Bananas are rich in potassium and energy.",
    exampleAr: "الموز غني بالبوتاسيوم والطاقة الرياضية."
  },
  apple: {
    english: "Apple",
    arabic: "تفاحة",
    phonetics: "/ˈæp.əl/",
    category: "طعام وفواكه",
    exampleEn: "An apple a day keeps the doctor away.",
    exampleAr: "تفاحة في اليوم تغنيك عن الطبيب."
  },
  sandwich: {
    english: "Sandwich",
    arabic: "شطيرة / سندويش",
    phonetics: "/ˈsæn.wɪdʒ/",
    category: "طعام وفواكه",
    exampleEn: "I packed a cheese sandwich for school lunch.",
    exampleAr: "جهّزت شطيرة جبن لوجبة الغداء المدرسية."
  },
  orange: {
    english: "Orange",
    arabic: "برتقالة",
    phonetics: "/ˈɒr.ɪndʒ/",
    category: "طعام وفواكه",
    exampleEn: "Oranges contain high amounts of Vitamin C.",
    exampleAr: "البرتقال يحتوي على كميات عالية من فيتامين سي."
  },
  broccoli: {
    english: "Broccoli",
    arabic: "بروكلي",
    phonetics: "/ˈbrɒk.əl.i/",
    category: "طعام وفواكه",
    exampleEn: "Broccoli is a highly nutritious green vegetable.",
    exampleAr: "البروكلي هو خضار أخضر مغذٍّ جداً."
  },
  carrot: {
    english: "Carrot",
    arabic: "جزرة",
    phonetics: "/ˈkær.ət/",
    category: "طعام وفواكه",
    exampleEn: "Carrots are sweet and good for your vision.",
    exampleAr: "الجزر حلو المذاق ومفيد لقوة النظر."
  },
  "hot dog": {
    english: "Hot dog",
    arabic: "سندويش نقانق",
    phonetics: "/hɒt dɒɡ/",
    category: "طعام وفواكه",
    exampleEn: "He bought a hot dog at the sports stadium.",
    exampleAr: "اشترى سندويش نقانق من الملعب الرياضي."
  },
  pizza: {
    english: "Pizza",
    arabic: "بيتزا",
    phonetics: "/ˈpiːt.sə/",
    category: "طعام وفواكه",
    exampleEn: "We ordered a large cheese pizza for dinner.",
    exampleAr: "طلبنا بيتزا جبن كبيرة لوجبة العشاء."
  },
  donut: {
    english: "Donut",
    arabic: "دونات / كعكة محلاة",
    phonetics: "/ˈdəʊ.nʌt/",
    category: "طعام وفواكه",
    exampleEn: "The sweet chocolate donut tasted delicious.",
    exampleAr: "الدونات المحلاة بالشكولاتة كانت رائعة المذاق."
  },
  cake: {
    english: "Cake",
    arabic: "كعكة / كيك",
    phonetics: "/keɪk/",
    category: "طعام وفواكه",
    exampleEn: "She baked a wonderful cake for the birthday party.",
    exampleAr: "خبزت كعكة رائعة لحفلة عيد الميلاد."
  },
  chair: {
    english: "Chair",
    arabic: "كرسي",
    phonetics: "/tʃeər/",
    category: "الأثاث",
    exampleEn: "Please pull up a comfortable chair and join us.",
    exampleAr: "من فضلك اسحب كرسياً مريحاً وانضم إلينا."
  },
  couch: {
    english: "Couch",
    arabic: "أريكة / صوفا",
    phonetics: "/kaʊtʃ/",
    category: "الأثاث",
    exampleEn: "We sat on the leather couch to watch a movie.",
    exampleAr: "جلسنا على الأريكة الجلدية لمشاهدة فيلم."
  },
  "potted plant": {
    english: "Potted plant",
    arabic: "نبات في أصيص",
    phonetics: "/ˈpɒt.ɪd plɑːnt/",
    category: "منوعات المنزل",
    exampleEn: "She waters the potted plant on the window sill.",
    exampleAr: "تسقي النبتة المنزلية الموجودة على حافة النافذة."
  },
  bed: {
    english: "Bed",
    arabic: "سرير",
    phonetics: "/bed/",
    category: "الأثاث",
    exampleEn: "I go to bed early to stay active during the day.",
    exampleAr: "أذهب إلى السرير مبكراً لأبقى نشيطاً طوال اليوم."
  },
  "dining table": {
    english: "Dining table",
    arabic: "طاولة طعام",
    phonetics: "/ˈdaɪ.nɪŋ ˌteɪ.bəl/",
    category: "الأثاث",
    exampleEn: "Dinner is served on the wooden dining table.",
    exampleAr: "يتم تقديم وجبة العشاء على طاولة الطعام الخشبية."
  },
  toilet: {
    english: "Toilet",
    arabic: "دورق مياه / مرحاض",
    phonetics: "/ˈtɔɪ.lət/",
    category: "منوعات المنزل",
    exampleEn: "Always wash your hands after using the toilet.",
    exampleAr: "اغسل يديك دائماً بالماء والصابون بعد استخدام المرحاض."
  },
  tv: {
    english: "TV / Television",
    arabic: "تلفاز",
    phonetics: "/ˌtiːˈviː/",
    category: "إلكترونيات",
    exampleEn: "We were watching the documentary on TV last night.",
    exampleAr: "كنا نشاهد الفيلم الوثائقي على التلفاز الليلة الماضية."
  },
  laptop: {
    english: "Laptop",
    arabic: "حاسوب محمول",
    phonetics: "/ˈlæp.tɒp/",
    category: "إلكترونيات",
    exampleEn: "He writes his digital notes on a silver laptop.",
    exampleAr: "يكتب ملاحظاته الرقمية على حاسوب محمول فضي."
  },
  mouse: {
    english: "Mouse",
    arabic: "فأرة حاسوب",
    phonetics: "/maʊs/",
    category: "إلكترونيات",
    exampleEn: "Click the link using your computer mouse.",
    exampleAr: "انقر فوق الرابط باستخدام فأرة الحاسوب الخاصة بك."
  },
  remote: {
    english: "Remote controller",
    arabic: "جهاز التحكم عن بعد",
    phonetics: "/rɪˈməʊt/",
    category: "إلكترونيات",
    exampleEn: "Pass me the TV remote control, please.",
    exampleAr: "ناولني جهاز التحكم عن بعد الخاص بالتلفاز من فضلك."
  },
  keyboard: {
    english: "Keyboard",
    arabic: "لوحة مفاتيح",
    phonetics: "/ˈkiː.bɔːd/",
    category: "إلكترونيات",
    exampleEn: "This desktop keyboard has keys that light up.",
    exampleAr: "لوحة مفاتيح الحاسوب هذه تحتوي على أزرار مضيئة."
  },
  "cell phone": {
    english: "Cell phone",
    arabic: "هاتف محمول",
    phonetics: "/ˈsel.fəʊn/",
    category: "إلكترونيات",
    exampleEn: "She answered a phone call on her cell phone.",
    exampleAr: "أجابت على مكالمة هاتفية على هاتفها المحمول."
  },
  microwave: {
    english: "Microwave",
    arabic: "مايكروويف",
    phonetics: "/ˈmaɪ.krə.weɪv/",
    category: "إلكترونيات",
    exampleEn: "Warm up your leftovers inside the microwave.",
    exampleAr: "سخّن بقايا طعامك البارد داخل المايكروويف."
  },
  oven: {
    english: "Oven",
    arabic: "فرن",
    phonetics: "/ˈʌv.ən/",
    category: "أواني ومطبخ",
    exampleEn: "The baking tray was put inside a preheated oven.",
    exampleAr: "تم وضع صينية الخبز داخل فرن تم تسخينه مسبقاً."
  },
  toaster: {
    english: "Toaster",
    arabic: "حمّاصة خبز",
    phonetics: "/ˈtəʊ.stər/",
    category: "أواني ومطبخ",
    exampleEn: "Put the sliced bread in the toaster.",
    exampleAr: "ضع شرائح الخبز داخل الحماصة الكهربائية."
  },
  sink: {
    english: "Sink",
    arabic: "مغسلة / حوض غسيل",
    phonetics: "/sɪŋk/",
    category: "منوعات المنزل",
    exampleEn: "He washed the dirty kitchen dishes in the sink.",
    exampleAr: "غسل الصحام وأدوات المطبخ المتسخة في مغسلة المطبخ."
  },
  refrigerator: {
    english: "Refrigerator / Fridge",
    arabic: "ثلاجة",
    phonetics: "/rɪˈfrɪdʒ.ər.eɪ.tər/",
    category: "إلكترونيات",
    exampleEn: "Keep the fresh dairy products inside the refrigerator.",
    exampleAr: "احفظ منتجات الألبان الطازجة داخل الثلاجة."
  },
  book: {
    english: "Book",
    arabic: "كتاب",
    phonetics: "/bʊk/",
    category: "أقلام ودراسة",
    exampleEn: "Reading an educational book expands your vocabulary.",
    exampleAr: "قراءة كتاب تعليمي يوسع ثروتك اللغوية."
  },
  clock: {
    english: "Clock",
    arabic: "ساعة حائط",
    phonetics: "/klɒk/",
    category: "منوعات المنزل",
    exampleEn: "The grandfather clock on the wall ticks loudly.",
    exampleAr: "تكتك ساعة الحائط القديمة المعلقة في الغرفة بصوت مرتفع."
  },
  vase: {
    english: "Vase",
    arabic: "مزهرية",
    phonetics: "/vɑːz/",
    category: "منوعات المنزل",
    exampleEn: "She arranged a lovely bouquet of red roses in the vase.",
    exampleAr: "قامت بتنسيق باقة جميلة من الزهور الحمراء في المزهرية."
  },
  scissors: {
    english: "Scissors",
    arabic: "مقص",
    phonetics: "/ˈsɪz.əz/",
    category: "أقلام ودراسة",
    exampleEn: "Handle the sharp scissors carefully to avoid injury.",
    exampleAr: "تعامل مع المقص الحاد بعناية لتجنب الإصابة."
  },
  "teddy bear": {
    english: "Teddy bear",
    arabic: "دب لعبة",
    phonetics: "/ˈted.i beər/",
    category: "ألعاب ورياضة",
    exampleEn: "The little girl hugs her soft teddy bear while sleeping.",
    exampleAr: "تحتضن الفتاة الصغيرة دمية الدب الناعمة أثناء نومها."
  },
  "hair drier": {
    english: "Hair dryer",
    arabic: "مجفف شعر",
    phonetics: "/ˈheə ˌdraɪ.ər/",
    category: "أغراض شخصية",
    exampleEn: "She dried her wet hair quickly with a hair dryer.",
    exampleAr: "جففت شعرها المبلل بسرعة باستخدام مجفف الشعر."
  },
  toothbrush: {
    english: "Toothbrush",
    arabic: "فرشاة أسنان",
    phonetics: "/ˈtuːθ.brʌʃ/",
    category: "أغراض شخصية",
    exampleEn: "Dentists advise changing your toothbrush every three months.",
    exampleAr: "ينصح أطباء الأسنان بتغيير فرشاة أسنانك كل ثلاثة أشهر."
  }
};
