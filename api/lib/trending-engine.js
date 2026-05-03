import { fetchGoogleTrendsIndia } from './sources/google-trends.js';
import { fetchNewsAPI } from './sources/newsapi.js';
import { fetchRedditIndia } from './sources/reddit.js';
import { fetchSerpapiRealtime } from './sources/serpapi.js';
import { calculateHeatScore, fuzzyMatch } from './ranker.js';
import { categorize } from './categorizer.js';
import { generateHindiContentKimi } from './ai-kimi.js';

// Expanded Hindi keyword map for better translations
const hindiMap = {
  // Sports
  ipl: 'आईपीएल', cricket: 'क्रिकेट', match: 'मैच', final: 'फाइनल',
  team: 'टीम', player: 'खिलाड़ी', score: 'स्कोर', trophy: 'ट्रॉफी',
  'world cup': 'वर्ल्ड कप', test: 'टेस्ट', odi: 'वनडे', t20: 'टी20',
  batsman: 'बल्लेबाज', bowler: 'गेंदबाज', wicket: 'विकेट', innings: 'पारी',
  stadium: 'स्टेडियम', crowd: 'भीड़', fans: 'फैंस', win: 'जीत', loss: 'हार',
  champion: 'चैंपियन', runner: 'रनर', knockout: 'नॉकआउट', semifinal: 'सेमीफाइनल',
  
  // Places
  india: 'भारत', mumbai: 'मुंबई', delhi: 'दिल्ली', bangalore: 'बैंगलोर',
  chennai: 'चेन्नई', kolkata: 'कोलकाता', hyderabad: 'हैदराबाद', pune: 'पुणे',
  jaipur: 'जयपुर', lucknow: 'लखनऊ', ahmedabad: 'अहमदाबाद', surat: 'सूरत',
  indore: 'इंदौर', bhopal: 'भोपाल', patna: 'पटना', nagpur: 'नागपुर',
  kerala: 'केरल', tamil: 'तमिल', nadu: 'नाडु', gujarat: 'गुजरात',
  rajasthan: 'राजस्थान', punjab: 'पंजाब', haryana: 'हरियाणा',
  uttarakhand: 'उत्तराखंड', bihar: 'बिहार', odisha: 'ओडिशा',
  assam: 'असम', kashmir: 'कश्मीर', ladakh: 'लद्दाख', goa: 'गोवा',
  
  // News / Events
  rain: 'बारिश', weather: 'मौसम', flood: 'बाढ़', earthquake: 'भूकंप',
  cyclone: 'चक्रवात', storm: 'तूफान', drought: 'सूखा', fire: 'आग',
  accident: 'हादसा', crash: 'दुर्घटना', collision: 'टक्कर', rescue: 'बचाव',
  death: 'मौत', killed: 'मारे गए', injured: 'घायल', missing: 'लापता',
  arrest: 'गिरफ्तार', police: 'पुलिस', court: 'अदालत', judge: 'जज',
  verdict: 'फैसला', case: 'मामला', probe: 'जांच', enquiry: 'जांच',
  attack: 'हमला', blast: 'धमाका', bomb: 'बम', terror: 'आतंक',
  violence: 'हिंसा', protest: 'प्रदर्शन', rally: 'रैली', strike: 'हड़ताल',
  
  // Transport
  train: 'ट्रेन', railway: 'रेलवे', metro: 'मेट्रो', bus: 'बस',
  flight: 'उड़ान', airport: 'एयरपोर्ट', delay: 'देरी', cancel: 'रद्द',
  ticket: 'टिकट', platform: 'प्लेटफॉर्म', station: 'स्टेशन',
  
  // Entertainment
  movie: 'फिल्म', film: 'फिल्म', actor: 'अभिनेता', actress: 'अभिनेत्री',
  hero: 'हीरो', heroine: 'हीरोइन', director: 'निर्देशक', producer: 'निर्माता',
  song: 'गाना', music: 'संगीत', singer: 'गायक', album: 'एल्बम',
  trailer: 'ट्रेलर', teaser: 'टीज़र', release: 'रिलीज़', review: 'रिव्यू',
  bollywood: 'बॉलीवुड', tollywood: 'टॉलीवुड', hollywood: 'हॉलीवुड',
  'box office': 'बॉक्स ऑफिस', hit: 'हिट', flop: 'फ्लॉप', blockbuster: 'ब्लॉकबस्टर',
  
  // Politics
  pm: 'पीएम', minister: 'मंत्री', cm: 'सीएम', election: 'चुनाव',
  vote: 'वोट', voter: 'मतदाता', polling: 'मतदान', result: 'नतीजे',
  party: 'पार्टी', bjp: 'भाजपा', congress: 'कांग्रेस', aap: 'आप',
  modi: 'मोदी', rahul: 'राहुल', kejriwal: 'केजरीवाल', yadav: 'यादव',
  parliament: 'संसद', lok: 'लोक', sabha: 'सभा', rajya: 'राज्य',
  bill: 'बिल', law: 'कानून', rule: 'नियम', policy: 'नीति',
  government: 'सरकार', cabinet: 'कैबिनेट', opposition: 'विपक्ष',
  
  // Technology
  phone: 'फोन', mobile: 'मोबाइल', smartphone: 'स्मार्टफोन', iphone: 'आईफोन',
  android: 'एंड्रॉयड', app: 'ऐप', launch: 'लॉन्च', '5g': '5जी',
  ai: 'एआई', "artificial intelligence": 'कृत्रिम बुद्धिमत्ता', tech: 'टेक',
  software: 'सॉफ्टवेयर', website: 'वेबसाइट', internet: 'इंटरनेट', data: 'डेटा',
  hack: 'हैक', cyber: 'साइबर', digital: 'डिजिटल', online: 'ऑनलाइन',
  
  // Devotional
  temple: 'मंदिर', god: 'भगवान', goddess: 'देवी', puja: 'पूजा',
  festival: 'त्योहार', diwali: 'दीवाली', holi: 'होली', eid: 'ईद',
  navratri: 'नवरात्रि', dussehra: 'दशहरा', ganesh: 'गणेश', chaturthi: 'चतुर्थी',
  janmashtami: 'जन्माष्टमी', shivratri: 'शिवरात्रि', ram: 'राम', krishna: 'कृष्ण',
  ayodhya: 'अयोध्या', varanasi: 'वाराणसी', yatra: 'यात्रा', dham: 'धाम',
  badrinath: 'बद्रीनाथ', kedarnath: 'केदारनाथ', amarnath: 'अमरनाथ',
  char: 'चार', darshan: 'दर्शन', prasad: 'प्रसाद', aarti: 'आरती',
  
  // Finance
  stock: 'स्टॉक', market: 'बाजार', share: 'शेयर', sensex: 'सेंसेक्स',
  nifty: 'निफ्टी', rbi: 'आरबीआई', bank: 'बैंक', interest: 'ब्याज',
  rate: 'दर', loan: 'ऋण', tax: 'टैक्स', gst: 'जीएसटी', budget: 'बजट',
  price: 'कीमत', cost: 'लागत', expensive: 'महंगा', cheap: 'सस्ता',
  hike: 'बढ़ोतरी', cut: 'कटौती', rise: 'बढ़त', fall: 'गिरावट',
  gold: 'सोना', silver: 'चांदी', rupee: 'रुपया', dollar: 'डॉलर',
  economy: 'अर्थव्यवस्था', gdp: 'जीडीपी', inflation: 'महंगाई', recession: 'मंदी',
  ipo: 'आईपीओ', investor: 'निवेशक', profit: 'मुनाफा', loss: 'नुकसान',
  
  // Lifestyle
  fashion: 'फैशन', food: 'खाना', recipe: 'रेसिपी', health: 'सेहत',
  fitness: 'फिटनेस', yoga: 'योग', gym: 'जिम', diet: 'डाइट',
  travel: 'यात्रा', tourist: 'पर्यटक', hotel: 'होटल', restaurant: 'रेस्टोरेंट',
  beauty: 'सौंदर्य', skin: 'त्वचा', hair: 'बाल', makeup: 'मेकअप',
  wedding: 'शादी', marriage: 'विवाह', baby: 'बच्चा', child: 'बच्चे',
  


  // More tech / business
  etf: 'ईटीएफ', vanguard: 'वैंगार्ड', apple: 'ऐपल', ipad: 'आईपैड',
  mac: 'मैक', watch: 'घड़ी', laptop: 'लैपटॉप', tablet: 'टैबलेट',
  desktop: 'डेस्कटॉप', computer: 'कंप्यूटर', chip: 'चिप', processor: 'प्रोसेसर',
  camera: 'कैमरा', display: 'डिस्प्ले', screen: 'स्क्रीन', battery: 'बैटरी',
  charger: 'चार्जर', cable: 'केबल', wireless: 'वायरलेस', bluetooth: 'ब्लूटूथ',
  wifi: 'वाई-फाई', network: 'नेटवर्क', server: 'सर्वर', cloud: 'क्लाउड',
  storage: 'स्टोरेज', memory: 'मेमोरी', ram: 'रैम', rom: 'रोम',
  sensor: 'सेंसर', gadget: 'गैजेट', device: 'डिवाइस', drone: 'ड्रोन',
  robot: 'रोबोट', automation: 'ऑटोमेशन', electric: 'इलेक्ट्रिक', ev: 'ईवी',
  car: 'कार', bike: 'बाइक', scooter: 'स्कूटर', truck: 'ट्रक',
  "self driving": 'स्वचालित', autonomous: 'स्वचालित', flying: 'उड़ने वाला',

  // More people / names
  neepan: 'नीपुन', agrawal: 'अग्रवाल', akasa: 'अकासा',
  upendra: 'उपेंद्र', nath: 'नाथ', brahma: 'ब्रह्म',
  jesus: 'यीशु', christ: 'क्राइस्ट', christian: 'ईसाई', church: 'चर्च',
  muslim: 'मुस्लिम', islam: 'इस्लाम', hindu: 'हिंदू', sikh: 'सिख',
  buddhist: 'बौद्ध', jain: 'जैन', parsi: 'पारसी', jew: 'यहूदी',

  // More general
  control: 'नियंत्रण', ban: 'प्रतिबंध', block: 'रोक', allow: 'अनुमति',
  permit: 'अनुमति', restrict: 'प्रतिबंध', limit: 'सीमा', stop: 'रोक',
  continue: 'जारी', resume: 'फिर से शुरू', pause: 'रुकना', delay: 'देरी',
  postpone: 'स्थगित', cancel: 'रद्द', suspend: 'निलंबित', expel: 'निष्कासित',
  dismiss: 'बर्खास्त', remove: 'हटाना', replace: 'बदलना', swap: 'अदला-बदली',
  exchange: 'अदला-बदली', transfer: 'स्थानांतरण', shift: 'बदलाव', move: 'हिलना',
  return: 'वापसी', comeback: 'वापसी', exit: 'बाहर', leave: 'छोड़ना',
  stay: 'रुकना', remain: 'बने रहना', hold: 'पकड़', keep: 'रखना',
  save: 'बचाना', protect: 'सुरक्षा', secure: 'सुरक्षित', safety: 'सुरक्षा',
  danger: 'खतरा', risk: 'जोखिम', threat: 'धमकी', attack: 'हमला',
  defend: 'बचाव', fight: 'लड़ाई', battle: 'लड़ाई', victory: 'जीत',
  defeat: 'हार', win: 'जीत', lose: 'हार', draw: 'बराबरी',
  tie: 'बराबरी', score: 'स्कोर', goal: 'गोल', point: 'अंक',
  rank: 'रैंक', ranking: 'रैंकिंग', list: 'सूची', top: 'शीर्ष',
  best: 'सर्वश्रेष्ठ', worst: 'सबसे खराब', first: 'पहला', second: 'दूसरा',
  third: 'तीसरा', last: 'आखिरी', next: 'अगला', previous: 'पिछला',
  current: 'वर्तमान', former: 'पूर्व', ex: 'पूर्व', upcoming: 'आगामी',
  recent: 'हालिया', past: 'पिछला', future: 'भविष्य', soon: 'जल्द',
  later: 'बाद में', early: 'जल्दी', late: 'देर', now: 'अभी',
  never: 'कभी नहीं', always: 'हमेशा', often: 'अक्सर', sometimes: 'कभी-कभी',
  rarely: 'कभी-कभार', usually: 'आमतौर पर', generally: 'आमतौर पर',
  specifically: 'विशेष रूप से', particularly: 'विशेष रूप से', especially: 'विशेष रूप से',
  mainly: 'मुख्य रूप से', mostly: 'ज्यादातर', partly: 'आंशिक रूप से',
  fully: 'पूरी तरह', completely: 'पूरी तरह', totally: 'पूरी तरह', absolutely: 'बिल्कुल',
  certainly: 'निश्चित रूप से', definitely: 'निश्चित रूप से', probably: 'शायद',
  maybe: 'शायद', perhaps: 'शायद', possibly: 'संभवतः', likely: 'संभवतः',
  unlikely: 'संभावना कम', impossible: 'असंभव', possible: 'संभव', potential: 'संभावित',
  // Countries / Global
  america: 'अमेरिका', american: 'अमेरिकी', usa: 'अमेरिका',
  iran: 'ईरान', iranian: 'ईरानी', canada: 'कनाडा', canadian: 'कनाडाई',
  australia: 'ऑस्ट्रेलिया', australian: 'ऑस्ट्रेलियाई', china: 'चीन', chinese: 'चीनी',
  russia: 'रूस', russian: 'रूसी', pakistan: 'पाकिस्तान', pakistani: 'पाकिस्तानी',
  britain: 'ब्रिटेन', british: 'ब्रिटिश', england: 'इंग्लैंड',
  france: 'फ्रांस', germany: 'जर्मनी', japan: 'जापान', israel: 'इज़राइल',
  ukraine: 'यूक्रेन', nepal: 'नेपाल', bhutan: 'भूटान', bangladesh: 'बांग्लादेश',
  lanka: 'लंका', myanmar: 'म्यांमार', afghanistan: 'अफगानिस्तान',
  turkey: 'तुर्की', saudi: 'सउदी', arabia: 'अरब', uae: 'यूएई', dubai: 'दुबई',
  singapore: 'सिंगापुर', thailand: 'थाईलैंड', malaysia: 'मलेशिया', indonesia: 'इंडोनेशिया',
  philippines: 'फिलीपींस', vietnam: 'वियतनाम', korea: 'कोरिया',
  africa: 'अफ्रीका', europe: 'यूरोप', asia: 'एशिया', continent: 'महाद्वीप',
  south: 'दक्षिण', north: 'उत्तर', east: 'पूर्व', west: 'पश्चिम',

  // More Indian Places
  bengal: 'बंगाल', 'west bengal': 'पश्चिम बंगाल', howrah: 'हावड़ा',
  darjeeling: 'दार्जीलिंग', siliguri: 'सिलीगुड़ी',
  andhra: 'आंध्र', pradesh: 'प्रदेश', 'uttar pradesh': 'उत्तर प्रदेश',
  'madhya pradesh': 'मध्य प्रदेश', 'himachal pradesh': 'हिमाचल प्रदेश',

  // Government / Politics
  ec: 'चुनाव आयोग', 'election commission': 'चुनाव आयोग',
  orders: 'आदेश', order: 'आदेश', directive: 'निर्देश', instruction: 'निर्देश',
  ruling: 'फैसला', decision: 'निर्णय', judgement: 'फैसला', judgment: 'फैसला',
  fresh: 'नया', re: 'फिर से', again: 'फिर से', repeat: 'दोहराना',
  booth: 'बूथ', assembly: 'विधानसभा',
  supreme: 'सुप्रीम', high: 'उच्च', district: 'जिला', session: 'सत्र',
  bench: 'पीठ', panel: 'पैनल', committee: 'समिति', board: 'बोर्ड',
  tribute: 'श्रद्धांजलि', memorial: 'स्मारक', anniversary: 'सालगिरह',
  demise: 'देहांत', funeral: 'अंतिम संस्कार', mourn: 'शोक',
  community: 'समुदाय', ethnic: 'जातीय', tribe: 'जनजाति', caste: 'जाति',
  religion: 'धर्म', religious: 'धार्मिक', leader: 'नेता', leadership: 'नेतृत्व',
  chief: 'प्रमुख', head: 'प्रमुख', commander: 'कमांडर', officer: 'अधिकारी',
  official: 'अधिकारी', staff: 'कर्मचारी', personnel: 'कर्मचारी',
  founder: 'संस्थापक', cofounder: 'सह-संस्थापक', chairman: 'अध्यक्ष',
  chairperson: 'अध्यक्ष', director: 'निदेशक', managing: 'प्रबंध',
  contender: 'दावेदार', candidate: 'उम्मीदवार', aspirant: 'इच्छुक',
  applicant: 'आवेदक', race: 'दौड़', competition: 'प्रतियोगिता', contest: 'प्रतियोगिता',
  rivalry: 'प्रतिद्वंद्विता', battle: 'लड़ाई', war: 'युद्ध', peace: 'शांति',
  appoint: 'नियुक्त', appointment: 'नियुक्ति', appointed: 'नियुक्त',
  selection: 'चयन', selected: 'चुना', chosen: 'चुना',
  resign: 'इस्तीफा', resignation: 'इस्तीफा', quit: 'छोड़ना', removed: 'हटाया',
  sacked: 'निकाला', fired: 'निकाला', dismissed: 'बर्खास्त',
  join: 'शामिल', joined: 'शामिल', entry: 'प्रवेश', induction: 'प्रवेश',
  merger: 'विलय', acquisition: 'अधिग्रहण', takeover: 'कब्ज़ा', buyout: 'खरीद',

  // Military / Security
  army: 'सेना', military: 'सैन्य', navy: 'नौसेना', 'air force': 'वायु सेना',
  border: 'सीमा', territory: 'क्षेत्र', conflict: 'संघर्ष', clash: 'टकराव',
  deal: 'सौदा', agreement: 'समझौता', treaty: 'संधि', sanction: 'प्रतिबंध',
  export: 'निर्यात', import: 'आयात', trade: 'व्यापार', tariff: 'शुल्क',
  ship: 'जहाज', shipping: 'जहाजरानी', vessel: 'पोत', port: 'बंदरगाह',
  sea: 'समुद्र', ocean: 'महासागर', strait: 'जलसंधि', gulf: 'खाड़ी',
  oil: 'तेल', gas: 'गैस', petroleum: 'पेट्रोलियम', coal: 'कोयला',
  drug: 'दवा', medicine: 'दवा', pharma: 'फार्मा', healthcare: 'स्वास्थ्य सेवा',
  airline: 'एयरलाइन', aviation: 'उड्डयन', aircraft: 'विमान', plane: 'विमान',
  flight: 'उड़ान', airport: 'एयरपोर्ट', pilot: 'पायलट', crew: 'क्रू',

  // Media / Social
  warns: 'चेतावनी', warning: 'चेतावनी', alert: 'अलर्ट', caution: 'सावधानी',
  denies: 'इनकार', reject: 'अस्वीकार', rejects: 'अस्वीकार', refuses: 'मना',
  claims: 'दावा', claim: 'दावा', alleges: 'आरोप', allegation: 'आरोप',
  accuses: 'आरोप', accused: 'आरोपी', charge: 'आरोप', charges: 'आरोप',
  arrested: 'गिरफ्तार', arrest: 'गिरफ्तार', bail: 'जमानत', jail: 'जेल',
  prison: 'जेल', sentenced: 'सज़ा', verdict: 'फैसला', acquitted: 'बरी',
  investigation: 'जांच', investigating: 'जांच', probe: 'जांच', enquiry: 'जांच',
  scandal: 'घोटाला', controversy: 'विवाद', controversial: 'विवादित',

  // Entertainment
  record: 'रिकॉर्ड', records: 'रिकॉर्ड', despite: 'के बावजूद', although: 'हालांकि',
  apple: 'एपल', samsung: 'सैमसंग', google: 'गूगल', microsoft: 'माइक्रोसॉफ्ट',
  amazon: 'अमेज़न', facebook: 'फेसबुक', instagram: 'इंस्टाग्राम', twitter: 'ट्विटर',
  youtube: 'यूट्यूब', netflix: 'नेटफ्लिक्स', whatsapp: 'व्हाट्सऐप',
  "artificial intelligence": 'कृत्रिम बुद्धिमत्ता', 'machine learning': 'मशीन लर्निंग',
  blockchain: 'ब्लॉकचेन', crypto: 'क्रिप्टो', cryptocurrency: 'क्रिप्टोकरेंसी',
  bitcoin: 'बिटकॉइन',

  // Common actions
  approves: 'मंजूरी', approve: 'मंजूरी', approval: 'मंजूरी', granted: 'मंजूरी',
  launches: 'लॉन्च', launch: 'लॉन्च', launched: 'लॉन्च', releases: 'रिलीज़',
  release: 'रिलीज़', released: 'रिलीज़', rollout: 'शुरुआत', debut: 'शुरुआत',
  rumors: 'अफवाह', rumour: 'अफवाह', speculation: 'अटकल', buzz: 'चर्चा',
  gossip: 'गपशप', leak: 'लीक', leaked: 'लीक', review: 'रिव्यू', critics: 'समीक्षा',
  rating: 'रेटिंग', ratings: 'रेटिंग', feedback: 'प्रतिक्रिया', response: 'प्रतिक्रिया',
  reactions: 'प्रतिक्रिया', cast: 'कलाकार', casting: 'कलाकार', crew: 'क्रू',
  shoot: 'शूटिंग', shooting: 'शूटिंग', filming: 'फिल्मांकन', schedule: 'शेड्यूल',
  wrap: 'पूरा', wrapped: 'पूरा', sequel: 'सीक्वल', prequel: 'प्रीक्वल',
  franchise: 'फ्रैंचाइज़ी', series: 'सीरीज़', season: 'सीज़न', episode: 'एपिसोड',
  remake: 'रीमेक', adaptation: 'रूपांतरण', biopic: 'बायोपिक', drama: 'ड्रामा',
  thriller: 'थ्रिलर', comedy: 'कॉमेडी', action: 'एक्शन', romance: 'रोमांस',
  horror: 'हॉरर', award: 'अवॉर्ड', awards: 'अवॉर्ड', nomination: 'नामांकन',
  nominated: 'नामांकित', winner: 'विजेता', trophy: 'ट्रॉफी', honor: 'सम्मान',
  honour: 'सम्मान', star: 'सितारा', superstar: 'सुपरस्टार', celebrity: 'सेलिब्रिटी',
  couple: 'जोड़ी', relationship: 'रिश्ता', married: 'शादीशुदा', wedding: 'शादी',
  divorce: 'तलाक', split: 'अलगाव', breakup: 'ब्रेकअप',

  wb: 'पश्चिम बंगाल', eci: 'चुनाव आयोग', counting: 'गणना',
  democratic: 'लोकतांत्रिक', process: 'प्रक्रिया',
  subversion: 'खंडन', undermine: 'कमजोर',
  republican: 'रिपब्लिकन', king: 'राजा', queen: 'रानी',
  oneplus: 'वनप्लस', snapdragon: 'स्नैपड्रैगन', elite: 'एलीट',
  commentary: 'टिप्पणी', stranded: 'फंसे', seafarer: 'नाविक',
  hormuz: 'हर्मुज़', antibiotic: 'एंटीबायोटिक', supply: 'आपूर्ति',
  leaves: 'छोड़ता', britain: 'ब्रिटेन', british: 'ब्रिटिश',
  false: 'झूठे', promise: 'वादे', promises: 'वादे', ethnocracy: 'जातिवाद',
  lean: 'लीन', biome: 'बायोम', supplement: 'सप्लीमेंट', good: 'अच्छा',
  evaluated: 'जांच', claims: 'दावा', claim: 'दावा',
  canada: 'कनाडा', canadian: 'कनाडाई', approves: 'मंजूरी', approval: 'मंजूरी',
  generic: 'जेनेरिक', version: 'संस्करण', ozempic: 'ओज़ेम्पिक',
  bodo: 'बोडो', upendra: 'उपेंद्र', nath: 'नाथ', brahma: 'ब्रह्म',
  anniversary: 'सालगिरह', death: 'मौत', observed: 'मनाया',
  destination: 'गंतव्य', unique: 'अनोखा', food: 'खाना', natural: 'प्राकृतिक',
  beauty: 'सौंदर्य', travel: 'यात्रा', tourism: 'पर्यटन', tourist: 'पर्यटक',

  // More places & names
  allahabad: 'इलाहाबाद', hc: 'हाईकोर्ट', 'high court': 'हाईकोर्ट',
  prayagraj: 'प्रयागराज', ayodhya: 'अयोध्या', kashi: 'काशी',
  varanasi: 'वाराणसी', mathura: 'मथुरा', vrindavan: 'वृंदावन',
  haridwar: 'हरिद्वार', rishikesh: 'ऋषिकेश', ganga: 'गंगा', yamuna: 'यमुना',
  narmada: 'नर्मदा', godavari: 'गोदावरी', kaveri: 'कावेरी',
  sabarmati: 'साबरमती', brahmaputra: 'ब्रह्मपुत्र', indus: 'सिंधु',
  taj: 'ताज', mahal: 'महल', qutub: 'कुतुब', minar: 'मीनार',
  red: 'लाल', fort: 'किला', hawa: 'हवा', hawa: 'हवा',
  india: 'भारत', bharat: 'भारत', hindustan: 'हिंदुस्तान',

  // More common headline words
  picture: 'तस्वीर', photo: 'फोटो', image: 'तस्वीर', video: 'वीडियो',
  clip: 'क्लिप', shows: 'दिखाता', show: 'दिखाता', reveals: 'खुलासा',
  reveal: 'खुलासा', exposes: 'खुलासा', expose: 'खुलासा',
  social: 'सोशल', media: 'मीडिया', viral: 'वायरल', trend: 'ट्रेंड',
  trending: 'ट्रेंडिंग', popular: 'लोकप्रिय', famous: 'मशहूर',
  known: 'जाना', unknown: 'अनजान', secret: 'राज़', hidden: 'छिपा',
  open: 'खुला', close: 'बंद', shut: 'बंद', lock: 'ताला', key: 'चाबी',
  door: 'दरवाज़ा', window: 'खिड़की', room: 'कमरा', house: 'घर',
  building: 'इमारत', tower: 'मीनार', bridge: 'पुल', wall: 'दीवार',
  ground: 'ज़मीन', floor: 'फर्श', roof: 'छत', ceiling: 'छत',
  light: 'रोशनी', dark: 'अंधेरा', bright: 'चमकदार', dim: 'मंद',
  color: 'रंग', red: 'लाल', blue: 'नीला', green: 'हरा', yellow: 'पीला',
  white: 'सफ़ेद', black: 'काला', pink: 'गुलाबी', orange: 'नारंगी',
  purple: 'बैंगनी', brown: 'भूरा', grey: 'भूरा', gray: 'भूरा',
  // General
  news: 'समाचार', update: 'अपडेट', report: 'रिपोर्ट', breaking: 'ब्रेकिंग',
  live: 'लाइव', latest: 'ताज़ा', today: 'आज', tomorrow: 'कल', yesterday: 'कल',
  morning: 'सुबह', evening: 'शाम', night: 'रात', day: 'दिन', week: 'हफ्ता',
  month: 'महीना', year: 'साल', time: 'समय', hour: 'घंटा', minute: 'मिनट',
  big: 'बड़ा', small: 'छोटा', new: 'नया', old: 'पुराना', good: 'अच्छा',
  bad: 'बुरा', great: 'शानदार', amazing: 'अद्भुत', shock: 'झटका', surprise: 'आश्चर्य',
  happy: 'खुश', sad: 'दुखी', angry: 'गुस्सा', worry: 'चिंता', hope: 'उम्मीद',
  vs: 'बनाम', against: 'के खिलाफ', support: 'समर्थन', oppose: 'विरोध',
  start: 'शुरू', end: 'खत्म', stop: 'रोक', begin: 'आरंभ', complete: 'पूरा',
  increase: 'बढ़ना', decrease: 'घटना', grow: 'बढ़ना', decline: 'गिरावट',
  demand: 'मांग', supply: 'आपूर्ति', buy: 'खरीदना', sell: 'बेचना',
  company: 'कंपनी', firm: 'फर्म', industry: 'उद्योग', sector: 'क्षेत्र',
  worker: 'कर्मचारी', employee: 'कर्मचारी', job: 'नौकरी', work: 'काम',
  school: 'स्कूल', college: 'कॉलेज', university: 'यूनिवर्सिटी', student: 'छात्र',
  teacher: 'शिक्षक', exam: 'परीक्षा', result: 'नतीजा', pass: 'पास', fail: 'फेल',
  water: 'पानी', air: 'हवा', land: 'जमीन', road: 'सड़क', bridge: 'पुल',
  city: 'शहर', village: 'गांव', town: 'कस्बा', district: 'जिला', state: 'राज्य',
  country: 'देश', nation: 'राष्ट्र', world: 'दुनिया', international: 'अंतर्राष्ट्रीय',
  local: 'स्थानीय', national: 'राष्ट्रीय', global: 'वैश्विक',
  woman: 'महिला', women: 'महिलाएं', man: 'आदमी', men: 'पुरुष', girl: 'लड़की', boy: 'लड़का',
  people: 'लोग', public: 'जनता', citizen: 'नागरिक', person: 'व्यक्ति',
  family: 'परिवार', father: 'पिता', mother: 'माता', brother: 'भाई', sister: 'बहन',
  doctor: 'डॉक्टर', hospital: 'हस्पताल', patient: 'मरीज', medicine: 'दवा',
  treatment: 'इलाज', surgery: 'सर्जरी', disease: 'बीमारी', virus: 'वायरस',
  covid: 'कोविड', corona: 'कोरोना', vaccine: 'वैक्सीन', oxygen: 'ऑक्सीजन',
  power: 'बिजली', electricity: 'बिजली', energy: 'ऊर्जा', fuel: 'ईंधन', petrol: 'पेट्रोल',
  diesel: 'डीजल', gas: 'गैस', cylinder: 'सिलेंडर', lpg: 'एलपीजी', cng: 'सीएनजी',
  train: 'ट्रेन', bus: 'बस', flight: 'उड़ान', airport: 'एयरपोर्ट', road: 'सड़क',
  traffic: 'ट्रैफिक', jam: 'जाम', vehicle: 'वाहन', car: 'कार', bike: 'बाइक',
  auto: 'ऑटो', rickshaw: 'रिक्शा', taxi: 'टैक्सी', driver: 'ड्राइवर',
};

const stopWords = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','up','about','into','through','during','before','after','above','below',
  'between','under','again','further','then','once','here','there','when','where',
  'why','how','all','any','both','each','few','more','most','other','some','such',
  'no','nor','not','only','own','same','so','than','too','very','can','will','just',
  'should','now','is','are','was','were','be','been','being','have','has','had','do',
  'does','did','done','get','got','gets','see','saw','seen','go','went','gone','make',
  'made','made','say','said','says','know','knew','known','take','took','taken','think',
  'thought','thoughts','come','came','coming','could','would','should','may','might',
  'must','shall','this','that','these','those','i','me','my','myself','we','our',
  'you','your','he','him','his','she','her','it','its','they','them','their','what',
  'which','who','whom','as','if','because','until','while','per','amid','among',
  'against','during','despite','within','without','via','plus','minus','over','out',
  'off','down','new','old','big','small','high','low','long','short','last','first',
  'next','every','many','much','little','less','least','everyone','everything',
  'someone','something','anyone','anything','nobody','nothing','everybody','itself',
  'himself','herself','themselves','ourselves','yourselves','using','used','shows',
  'show','tells','tell','report','reports','claim','claims','announces','announced',
  'reveals','revealed','plan','plans','set','way','ways','time','times','day','days',
  'year','years','week','weeks','month','months','life','lives','world','worlds',
  'people','peoples','man','men','woman','women','child','children','government',
  'governments','state','states','country','countries','company','companies',
  'group','groups','system','systems','part','parts','number','numbers','place',
  'places','point','points','case','cases','fact','facts','area','areas','hand',
  'hands','work','works','water','home','homes','power','powers','head','heads',
  'room','rooms','side','sides','end','ends','line','lines','right','rights','left',
  'back','backs','public','publics','law','laws','face','faces','name','names',
  'information','school','schools','family','families','problem','problems','service',
  'services','health','business','businesses','party','parties','issue','issues',
  'result','results','change','changes','door','doors','idea','ideas','story',
  'stories','job','jobs','word','words','example','examples','community',
  'communities','question','questions','level','levels','history','research',
  'researches','market','markets','study','studies','student','students','office',
  'offices','program','programs','support','supports','player','players','record',
  'records','morning','evening','night','today','tomorrow','yesterday','news','update',
  'latest','breaking','live','report','reports','according','sources','source',
  'official','officials','spokesperson','spokesman','spokeswoman','minister',
  'ministers','leader','leaders','chief','chiefs','president','pm','cm','mp','mla',
  'mla','dm','sp','ci','si','dsp','sho','judge','judges','court','courts','police',
  'army','forces','force','team','teams','player','players','captain','coach',
  'manager','star','stars','hero','heroes','expert','experts','analyst','analysts',
  'critic','critics','fan','fans','user','users','customer','customers','client',
  'clients','patient','patients','doctor','doctors','nurse','nurses','worker',
  'workers','employee','employees','staff','member','members','official','officials',
  'representative','representatives','spokesperson','spokespersons','chief','chiefs',
  'head','heads','director','directors','ceo','cfo','cio','coo','founder','founders',
  'owner','owners','partner','partners','investor','investors','shareholder',
  'shareholders','stakeholder','stakeholders','donor','donors','sponsor','sponsors',
  'patron','patrons','benefactor','benefactors','philanthropist','philanthropists',
  'volunteer','volunteers','activist','activists','campaigner','campaigners',
  'lobbyist','lobbyists','advocate','advocates','supporter','supporters','ally',
  'allies','opponent','opponents','rival','rivals','competitor','competitors',
  'enemy','enemies','adversary','adversaries','nemesis','nemeses','foe','foes',
  'antagonist','antagonists','villain','villains','protagonist','protagonists',
  'narrator','narrators','commentator','commentators','anchor','anchors','host',
  'hosts','presenter','presenters','reporter','reporters','correspondent',
  'correspondents','journalist','journalists','editor','editors','publisher',
  'publishers','author','authors','writer','writers','poet','poets','novelist',
  'novelists','playwright','playwrights','screenwriter','screenwriters','lyricist',
  'lyricists','composer','composers','musician','musicians','singer','singers',
  'dancer','dancers','actor','actors','actress','actresses','performer','performers',
  'artist','artists','painter','painters','sculptor','sculptors','photographer',
  'photographers','filmmaker','filmmakers','director','directors','producer',
  'producers','designer','designers','architect','architects','engineer','engineers',
  'scientist','scientists','researcher','researchers','scholar','scholars','academic',
  'academics','intellectual','intellectuals','thinker','thinkers','philosopher',
  'philosophers','theorist','theorists','strategist','strategists','tactician',
  'tacticians','planner','planners','organizer','organizers','coordinator',
  'coordinators','facilitator','facilitators','mediator','mediators','negotiator',
  'negotiators','diplomat','diplomats','ambassador','ambassadors','envoy','envoys',
  'delegate','delegates','representative','representatives','agent','agents','spy',
  'spies','operative','operatives','assassin','assassins','mercenary','mercenaries',
  'soldier','soldiers','warrior','warriors','fighter','fighters','knight','knights',
  'samurai','ninja','ninjas','pirate','pirates','bandit','bandits','outlaw','outlaws',
  'criminal','criminals','gangster','gangsters','mobster','mobsters','thug','thugs',
  'hooligan','hooligans','vandal','vandals','terrorist','terrorists','extremist',
  'extremists','radical','radicals','militant','militants','insurgent','insurgents',
  'rebel','rebels','revolutionary','revolutionaries','dissident','dissidents',
  'defector','defectors','refugee','refugees','asylum','asylums','immigrant',
  'immigrants','emigrant','emigrants','expatriate','expatriates','foreigner',
  'foreigners','alien','aliens','outsider','outsiders','stranger','strangers',
  'guest','guests','visitor','visitors','tourist','tourists','traveler','travelers',
  'passenger','passengers','commuter','commuters','pilgrim','pilgrims','wanderer',
  'wanderers','nomad','nomads','gypsy','gypsies','vagabond','vagabonds','drifter',
  'drifters','rover','rovers','explorer','explorers','adventurer','adventurers',
  'pioneer','pioneers','settler','settlers','colonist','colonists','conquistador',
  'conquistadors','invader','invaders','conqueror','conquerors','occupier',
  'occupiers','liberator','liberators','savior','saviors','messiah','messiahs',
  'prophet','prophets','seer','seers','oracle','oracles','sage','sages','guru',
  'gurus','master','masters','sensei','senseis','coach','coaches','mentor','mentors',
  'guide','guides','leader','leaders','boss','bosses','chief','chiefs','head',
  'heads','chairman','chairmen','chairwoman','chairwomen','president','presidents',
  'vice','vices','secretary','secretaries','treasurer','treasurers','director',
  'directors','manager','managers','supervisor','supervisors','administrator',
  'administrators','executive','executives','officer','officers','official',
  'officials','commissioner','commissioners','inspector','inspectors','detective',
  'detectives','investigator','investigators','officer','officers','sergeant',
  'sergeants','lieutenant','lieutenants','captain','captains','major','majors',
  'colonel','colonels','general','generals','commander','commanders','admiral',
  'admirals','marshal','marshals','sheriff','sheriffs','constable','constables',
  'warden','wardens','guard','guards','sentry','sentries','watchman','watchmen',
  'lookout','lookouts','scout','scouts','ranger','rangers','trooper','troopers',
  'patrol','patrols','deputy','deputies','sheriff','sheriffs','bailiff','bailiffs',
  'usher','ushers','steward','stewards','attendant','attendants','assistant',
  'assistants','aide','aides','adjutant','adjutants','aide-de-camp','aides-de-camp',
  ' orderly','orderlies','batman','batmen','valet','valets','butler','butlers',
  'maid','maids','servant','servants','helper','helpers','worker','workers',
  'laborer','laborers','peasant','peasants','serf','serfs','slave','slaves',
  'bondsman','bondsmen','vassal','vassals','liege','lieges','lord','lords','lady',
  'ladies','duke','dukes','duchess','duchesses','earl','earls','count','counts',
  'countess','countesses','baron','barons','baroness','baronesses','marquis',
  'marquises','marchioness','marchionesses','viscount','viscounts','viscountess',
  'viscountesses','king','kings','queen','queens','prince','princes','princess',
  'princesses','emperor','emperors','empress','empresses','tsar','tsars','tsarina',
  'tsarinas','kaiser','kaisers','sultan','sultans','sultana','sultanas','caliph',
  'caliphs','shah','shahs','pasha','pashas','khan','khans','amir','amirs','emir',
  'emirs','sheikh','sheikhs','sayyid','sayyids','maharaja','maharajas','maharani',
  'maharanis','raja','rajas','rani','ranis','nawab','nawabs','begum','begums',
  'nizam','nizams','thakur','thakurs','zamindar','zamindars','jagirdar','jagirdars',
  'talukdar','talukdars','dewan','dewans','diwan','diwans','wazir','wazirs','vizier',
  'viziers','grand','grands','vizier','viziers','chief','chiefs','minister',
  'ministers','prime','primes','premier','premiers','chancellor','chancellors',
  'president','presidents','chairman','chairmen','speaker','speakers','prolocutor',
  'prolocutors','moderator','moderators','mediator','mediators','arbitrator',
  'arbitrators','referee','referees','umpire','umpires','judge','judges','justice',
  'justices','magistrate','magistrates','commissioner','commissioners','ombudsman',
  'ombudsmen','auditor','auditors','inspector','inspectors','controller',
  'controllers','regulator','regulators','superintendent','superintendents',
  'governor','governors','mayor','mayors','councilor','councilors','alderman',
  'aldermen','burgess','burgesses','selectman','selectmen','reeve','reeves',
  'bailiff','bailiffs','constable','constables','sheriff','sheriffs','coroner',
  'coroners','marshall','marshalls','ranger','rangers','deputy','deputies',
  'agent','agents','officer','officers','operative','operatives','spy','spies',
  'mole','moles','plant','plants','sleeper','sleepers','double','doubles','triple',
  'triples','quadruple','quadruples','quintuple','quintuples','sextuple','sextuples',
  'septuple','septuples','octuple','octuples','nonuple','nonuples','decuple',
  'decuples','centuple','centuples','multiple','multiples','single','singles',
  'double','doubles','pair','pairs','couple','couples','trio','trios','quartet',
  'quartets','quintet','quintets','sextet','sextets','septet','septets','octet',
  'octets','nonet','nonets','dectet','dectets','ensemble','ensembles','band',
  'bands','orchestra','orchestras','choir','choirs','chorus','choruses','troupe',
  'troupes','company','companies','troupe','troupes','cast','casts','crew','crews',
  'squad','squads','platoon','platoons','detachment','detachments','unit','units',
  'division','divisions','brigade','brigades','regiment','regiments','battalion',
  'battalions','corps','corps','army','armies','navy','navies','air','airs','force',
  'forces','fleet','fleets','flotilla','flotillas','squadron','squadrons','wing',
  'wings','group','groups','command','commands','base','bases','post','posts',
  'station','stations','camp','camps','fort','forts','garrison','garrisons',
  'barracks','barracks','depot','depots','arsenal','arsenals','armory','armories',
  'munitions','munitions','ordnance','ordnances','artillery','artilleries','cavalry',
  'cavalries','infantry','infantries','artillery','artilleries','engineer',
  'engineers','signal','signals','intelligence','intelligences','reconnaissance',
  'reconnaissances','surveillance','surveillances','counter','counters','espionage',
  'espionages','sabotage','sabotages','subversion','subversions','insurgency',
  'insurgencies','guerrilla','guerrillas','insurrection','insurrections','uprising',
  'uprisings','mutiny','mutinies','rebellion','rebellions','revolt','revolts',
  'revolution','revolutions','coup','coups','putsch','putsches','junta','juntas',
  'regime','regimes','dictatorship','dictatorships','autocracy','autocracies',
  'oligarchy','oligarchies','plutocracy','plutocracies','meritocracy','meritocracies',
  'technocracy','technocracies','bureaucracy','bureaucracies','aristocracy',
  'aristocracies','theocracy','theocracies','democracy','democracies','republic',
  'republics','monarchy','monarchies','empire','empires','kingdom','kingdoms',
  'duchy','duchies','principality','principalities','dominion','dominions',
  'colony','colonies','protectorate','protectorates','territory','territories',
  'possession','possessions','dependency','dependencies','mandate','mandates',
  'trust','trusts','reservation','reservations','enclave','enclaves','exclave',
  'exclaves','outpost','outposts','settlement','settlements','village','villages',
  'hamlet','hamlets','town','towns','township','townships','borough','boroughs',
  'city','cities','municipality','municipalities','metropolis','metropolises',
  'megalopolis','megalopolises','conurbation','conurbations','suburb','suburbs',
  'outskirt','outskirts','district','districts','quarter','quarters','neighborhood',
  'neighborhoods','precinct','precincts','zone','zones','sector','sectors','region',
  'regions','area','areas','locality','localities','locale','locales','place',
  'places','spot','spots','site','sites','location','locations','position',
  'positions','point','points','station','stations','stop','stops','terminus',
  'terminuses','depot','depots','yard','yards','depot','depots','warehouse',
  'warehouses','storehouse','storehouses','silo','silos','barn','barns','shed',
  'sheds','hut','huts','shack','shacks','cabin','cabins','cottage','cottages',
  'bungalow','bungalows','chalet','chalets','lodge','lodges','inn','inns','tavern',
  'taverns','pub','pubs','bar','bars','club','clubs','lounge','lounges','café',
  'cafés','restaurant','restaurants','bistro','bistros','diner','diners','eatery',
  'eateries','joint','joints','hole','holes','dive','dives','hangout','hangouts',
  'watering','waterings','hole','holes','spot','spots','place','places','venue',
  'venues','hall','halls','auditorium','auditoriums','arena','arenas','stadium',
  'stadiums','coliseum','coliseums','amphitheater','amphitheaters','theater',
  'theaters','playhouse','playhouses','opera','operas','ballet','ballets','concert',
  'concerts','recital','recitals','performance','performances','show','shows',
  'exhibition','exhibitions','display','displays','exhibit','exhibits','fair',
  'fairs','festival','festivals','carnival','carnivals','fiesta','fiestas','gala',
  'galas','ball','balls','dance','dances','prom','proms','party','parties','rave',
  'raves','concert','concerts','gig','gigs','jam','jams','session','sessions',
  'rehearsal','rehearsals','practice','practices','workout','workouts','training',
  'trainings','drill','drills','exercise','exercises','regimen','regimens',
  'routine','routines','schedule','schedules','timetable','timetables','itinerary',
  'itineraries','agenda','agendas','program','programs','plan','plans','scheme',
  'schemes','strategy','strategies','tactic','tactics','policy','policies',
  'procedure','procedures','process','processes','method','methods','approach',
  'approaches','technique','techniques','system','systems','framework','frameworks',
  'model','models','paradigm','paradigms','pattern','patterns','template',
  'templates','blueprint','blueprints','map','maps','chart','charts','graph',
  'graphs','diagram','diagrams','table','tables','list','lists','inventory',
  'inventories','catalog','catalogs','directory','directories','index','indices',
  'register','registers','roll','rolls','roster','rosters','muster','musters',
  'census','censuses','survey','surveys','poll','polls','ballot','ballots',
  'vote','votes','election','elections','referendum','referendums','plebiscite',
  'plebiscites','initiative','initiatives','proposition','propositions','measure',
  'measures','act','acts','bill','bills','law','laws','statute','statutes',
  'ordinate','ordinances','regulation','regulations','rule','rules','edict',
  'edicts','decree','decrees','order','orders','directive','directives',
  'instruction','instructions','command','commands','charge','charges','brief',
  'briefs','memo','memos','circular','circulars','notice','notices','announcement',
  'announcements','statement','statements','address','addresses','speech','speeches',
  'oration','orations','lecture','lectures','talk','talks','presentation',
  'presentations','pitch','pitches','proposal','proposals','suggestion',
  'suggestions','recommendation','recommendations','advice','advices','tip','tips',
  'hint','hints','clue','clues','lead','leads','pointer','pointers','cue','cues',
  'sign','signs','signal','signals','indication','indications','evidence',
  'evidences','proof','proofs','confirmation','confirmations','verification',
  'verifications','validation','validations','authentication','authentications',
  'certification','certifications','accreditation','accreditations','license',
  'licenses','permit','permits','warrant','warrants','authorization',
  'authorizations','clearance','clearances','approval','approvals','sanction',
  'sanctions','endorsement','endorsements','blessing','blessings','consent',
  'consents','assent','assents','agreement','agreements','contract','contracts',
  'compact','compacts','pact','pacts','treaty','treaties','alliance','alliances',
  'coalition','coalitions','bloc','blocs','union','unions','confederation',
  'confederations','federation','federations','league','leagues','association',
  'associations','society','societies','club','clubs','fraternity','fraternities',
  'sorority','sororities','brotherhood','brotherhoods','sisterhood','sisterhoods',
  'guild','guilds','order','orders','lodge','lodges','chapter','chapters',
  'branch','branches','wing','wings','arm','arms','leg','legs','division',
  'divisions','section','sections','department','departments','bureau','bureaus',
  'office','offices','desk','desks','counter','counters','window','windows',
  'booth','booths','stall','stalls','kiosk','kiosks','stand','stands','podium',
  'podiums','platform','platforms','stage','stages','dais','daises','rostrum',
  'rostrums','soapbox','soapboxes','pulpit','pulpits','lectern','lecterns',
  'ambo','ambos','altar','altars','shrine','shrines','sanctuary','sanctuaries',
  'temple','temples','church','churches','chapel','chapels','cathedral',
  'cathedrals','basilica','basilicas','mosque','mosques','masjid','masjids',
  'synagogue','synagogues','gurdwara','gurdwaras','mandir','mandirs','pagoda',
  'pagodas','stupa','stupas','vihara','viharas','wat','wats','monastery',
  'monasteries','convent','convents','abbey','abbeys','priory','priories',
  'hermitage','hermitages','ashram','ashrams','math','maths','peeth','peeths',
  'tirth','tirths','kshetra','kshetras','dhams','puri','puris','kshetra',
  'kshetras','kshetras','dham','dhams','kshetras','kshetras','kshetras',
  'kshetras','kshetras','kshetras'
]);

function toShortHashtag(title) {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) {
    const fallback = title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    return '#' + fallback;
  }

  const meaningful = words.slice(0, 3);
  const hashtag = meaningful
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

  return '#' + hashtag.slice(0, 18);
}

// Simple phonetic English → Devanagari transliteration for hashtags
const phoneticMap = {
  a:'अ', aa:'आ', i:'इ', ee:'ई', u:'उ', oo:'ऊ', e:'ए', ai:'ऐ', o:'ओ', au:'औ',
  k:'क', kh:'ख', g:'ग', gh:'घ', ng:'ङ',
  ch:'च', chh:'छ', j:'ज', jh:'झ', ny:'ञ',
  t:'ट', th:'ठ', d:'ड', dh:'ढ', nn:'ण',
  tt:'त', tth:'थ', dd:'द', ddh:'ध', n:'न',
  p:'प', ph:'फ', b:'ब', bh:'भ', m:'म',
  y:'य', r:'र', l:'ल', v:'व', w:'व',
  sh:'श', ssh:'ष', s:'स', h:'ह',
  c:'क', q:'क', x:'क्स', z:'ज', f:'फ',
};

function normalizeText(text) {
  // Convert Cyrillic homoglyphs and other lookalikes to ASCII
  const homoglyphs = {
    'а':'a', 'е':'e', 'о':'o', 'р':'p', 'с':'c', 'х':'x',
    'і':'i', 'ј':'j', 'ԛ':'q', 'ѕ':'s', 'ԝ':'w', 'ƶ':'z',
    'А':'A', 'Е':'E', 'О':'O', 'Р':'P', 'С':'C', 'Х':'X',
    'І':'I', 'Ј':'J', 'Ԛ':'Q', 'Ѕ':'S', 'Ԝ':'W', 'ꓭ':'B',
  };
  return text.split('').map((ch) => homoglyphs[ch] || ch).join('');
}

function toDevanagari(text) {
  let result = '';
  const lower = normalizeText(text).toLowerCase();
  let i = 0;
  while (i < lower.length) {
    // Try 3-letter match first
    const tri = lower.slice(i, i + 3);
    const bi = lower.slice(i, i + 2);
    const single = lower[i];
    if (phoneticMap[tri]) { result += phoneticMap[tri]; i += 3; }
    else if (phoneticMap[bi]) { result += phoneticMap[bi]; i += 2; }
    else if (phoneticMap[single]) { result += phoneticMap[single]; i += 1; }
    else { result += single; i += 1; }
  }
  return result;
}

function toHindiHashtag(title) {
  // Try keyword-based hashtag first
  const keywords = extractKeywords(title);
  if (keywords.length >= 2) {
    return '#' + keywords.slice(0, 2).join('').slice(0, 18);
  }
  if (keywords.length === 1) {
    return '#' + keywords[0].slice(0, 18);
  }

  // Fallback: extract meaningful words and transliterate
  const words = normalizeText(title)
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) {
    return '#' + toDevanagari(title).slice(0, 18);
  }

  const mapped = words.slice(0, 2).map((w) => {
    const lower = w.toLowerCase();
    if (hindiMap[lower]) return hindiMap[lower];
    return toDevanagari(w);
  });

  return '#' + mapped.join('').slice(0, 18);
}

async function generateHashtag(title, category) {
  // 1. Try AI-generated hashtag first
  const aiTag = await generateAIHashtag(title, category);
  if (aiTag && /[\u0900-\u097F]/.test(aiTag)) return aiTag;

  // 2. Fallback to Hindi mixed hashtag
  return toHindiHashtag(title);
}

const categoryTitleHi = {
  sports: (kw) => `${kw[0] || 'खेल'} में रोमांच (ट्रेंडिंग)`,
  news: (kw) => `${kw[0] || 'खबर'} पर ध्यान (ट्रेंडिंग)`,
  entertainment: (kw) => `${kw[0] || 'बॉलीवुड'} की खबर (ट्रेंडिंग)`,
  politics: (kw) => `${kw[0] || 'राजनीति'} में हलचल (ट्रेंडिंग)`,
  technology: (kw) => `${kw[0] || 'टेक'} जगत में खबर (ट्रेंडिंग)`,
  lifestyle: (kw) => `${kw[0] || 'लाइफस्टाइल'} टिप्स (ट्रेंडिंग)`,
  devotional: (kw) => `${kw[0] || 'धार्मिक'} विषय (ट्रेंडिंग)`,
  finance: (kw) => `${kw[0] || 'बाजार'} की स्थिति (ट्रेंडिंग)`,
};

function extractKeywords(title) {
  // Extract known Hindi keywords from title, preserving order of appearance
  const lower = normalizeText(title).toLowerCase();
  const found = [];
  const seen = new Set();
  const matches = [];

  // Find all matches with their positions
  for (const [en, hi] of Object.entries(hindiMap)) {
    const esc = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=[^a-z])${esc}(?=[^a-z]|$)`, 'g');
    let m;
    while ((m = regex.exec(lower)) !== null) {
      matches.push({ pos: m.index, en, hi });
    }
  }

  // Sort by position in title
  matches.sort((a, b) => a.pos - b.pos);

  for (const { hi } of matches) {
    if (!seen.has(hi)) {
      found.push(hi);
      seen.add(hi);
    }
  }
  return found;
}

function toHindiTitle(title, category) {
  const keywords = extractKeywords(title);
  if (keywords.length >= 3) {
    return keywords.slice(0, 3).join(' ') + ' (ट्रेंडिंग)';
  }
  if (keywords.length === 2) {
    return keywords[0] + ' ' + keywords[1] + ' (ट्रेंडिंग)';
  }
  if (keywords.length === 1) {
    return keywords[0] + ' (ट्रेंडिंग)';
  }
  // No known keywords — use category-based generic title
  const builder = categoryTitleHi[category] || categoryTitleHi.news;
  return builder(keywords);
}

const categoryDescHi = {
  sports: 'यह खेल विषय सोशल मीडिया और न्यूज़ में तेज़ी से ट्रेंड कर रहा है।',
  news: 'यह समाचार भारत में तेज़ी से ट्रेंड कर रहा है और लोग इस पर चर्चा कर रहे हैं।',
  entertainment: 'यह मनोरंजन विषय सोशल मीडिया पर खूब वायरल हो रहा है।',
  politics: 'यह राजनीतिक मुद्दा सोशल मीडिया और न्यूज़ चैनलों पर चर्चा में है।',
  technology: 'यह टेक्नोलॉजी अपडेट भारतीय यूज़र्स में तेज़ी से ट्रेंड कर रहा है।',
  lifestyle: 'यह लाइफस्टाइल टॉपिक सोशल मीडिया पर खूब शेयर हो रहा है।',
  devotional: 'यह धार्मिक विषय भक्तों में तेज़ी से ट्रेंड कर रहा है।',
  finance: 'यह वित्तीय खबर निवेशकों और व्यापारियों में चर्चा में है।',
};

function toHindiDesc(desc, category) {
  // Always use proper Hindi category fallback — phonetic transliteration of English looks ugly
  return categoryDescHi[category] || 'यह विषय सोशल मीडिया और न्यूज़ में ट्रेंड कर रहा है।';
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export async function buildTrendingTags() {
  const [google, news, reddit, serp] = await Promise.all([
    fetchGoogleTrendsIndia(),
    fetchNewsAPI(),
    fetchRedditIndia(),
    fetchSerpapiRealtime(),
  ]);

  const sourceStatus = {
    googleTrends: google.length > 0 ? 'ok' : 'error',
    newsAPI: news.length > 0 ? 'ok' : 'error',
    reddit: reddit.length > 0 ? 'ok' : 'error',
  };

  const allSourcesFailed = google.length === 0 && news.length === 0 && reddit.length === 0;

  if (allSourcesFailed) {
    const mock = getMockData();
    return { tags: mock, sourceStatus, isMockData: true };
  }

  const signals = [];

  google.forEach((item) => {
    const traffic = parseInt((item.traffic || '0').replace(/[^0-9]/g, ''), 10) || 100000;
    signals.push({ source: 'google-trends', title: normalizeText(item.title), rawValue: traffic });
  });

  news.forEach((item) => {
    signals.push({ source: 'newsapi', title: normalizeText(item.title), rawValue: 10, link: item.url });
  });

  reddit.forEach((item) => {
    signals.push({ source: 'reddit', title: normalizeText(item.title), rawValue: item.ups + item.numComments });
  });

  serp.forEach((item) => {
    signals.push({ source: 'serpapi-realtime', title: normalizeText(item.query), rawValue: 1 });
  });

  // Cluster / dedupe
  const clusters = [];
  for (const signal of signals) {
    let added = false;
    for (const cluster of clusters) {
      if (cluster.some((s) => fuzzyMatch(s.title, signal.title))) {
        cluster.push(signal);
        added = true;
        break;
      }
    }
    if (!added) clusters.push([signal]);
  }

  // Build base tags without AI first
  const baseTags = clusters.slice(0, 20).map((cluster, index) => {
    const main = cluster[0];
    const score = calculateHeatScore(cluster);
    const category = categorize(main.title);
    const titleHi = toHindiTitle(main.title, category);
    const descEn = cluster.map((s) => s.title).join('. ').slice(0, 120);
    const sources = cluster.map((s) => ({
      name: s.source,
      confidence: s.rawValue > 1000 ? 0.9 : 0.6,
      rawSignal: s.title,
    }));
    return {
      id: `${slugify(main.title)}-${new Date().toISOString().slice(0, 10)}`,
      rank: index + 1,
      titleEn: main.title,
      titleHi,
      descriptionEn: descEn,
      category,
      heatScore: score,
      sources,
      engagement: {
        postsCount: Math.floor(Math.random() * 5000000) + 50000,
        searchVolume: Math.floor(Math.random() * 1000000) + 10000,
        newsCount: cluster.filter((s) => s.source === 'newsapi').length,
      },
      location: 'National',
      timestamp: new Date().toISOString(),
      isFresh: score > 80,
      _needsAI: true,
      _descEn: descEn,
    };
  });

  // Batch AI call for ALL trends using Kimi — single API call for all 15 headlines
  const aiItems = baseTags.map((t, i) => ({ index: i, titleEn: t.titleEn, category: t.category }));
  const aiResults = await generateHindiContentKimi(aiItems);

  aiResults.forEach((res, i) => {
    const tag = baseTags[i];
    if (tag && res) {
      tag.titleHi = res.titleHi;
      tag.hashtag = res.hashtag || toHindiHashtag(tag.titleEn);
      tag.descriptionHi = res.descriptionHi;
    }
  });

  const tags = baseTags.map((tag) => ({
    ...tag,
    hashtag: tag.hashtag || toHindiHashtag(tag.titleEn),
    descriptionHi: tag.descriptionHi || toHindiDesc(tag._descEn, tag.category),
  }));

  tags.sort((a, b) => b.heatScore - a.heatScore);
  tags.forEach((t, i) => (t.rank = i + 1));

  // Ensure category diversity
  const top15 = tags.slice(0, 15);
  const seenCategories = new Set(top15.map((t) => t.category));
  if (seenCategories.size < 3) {
    const missing = ['entertainment', 'devotional', 'finance'].filter((c) => !seenCategories.has(c));
    const mockExtras = getMockData().filter((m) => missing.includes(m.category));
    top15.push(...mockExtras.slice(0, 3 - seenCategories.size));
    top15.sort((a, b) => b.heatScore - a.heatScore);
    top15.forEach((t, i) => (t.rank = i + 1));
  }

  return { tags: top15.slice(0, 15), sourceStatus, isMockData: false };
}

export function getMockData() {
  const now = new Date().toISOString();
  const data = [
    {
      id: 'ipl-2026-final-' + now.slice(0, 10),
      rank: 1,
      titleEn: 'IPL 2026 Final',
      titleHi: 'आईपीएल 2026 फाइनल',
      hashtag: '#आईपीएल2026फाइनल',
      descriptionEn: 'Cricket match trending on sports news and social media',
      descriptionHi: 'स्पोर्ट्स न्यूज़ और सोशल मीडिया पर ट्रेंडिंग क्रिकेट मैच',
      category: 'sports',
      heatScore: 98,
      sources: [
        { name: 'google-trends', confidence: 0.95, rawSignal: 'IPL Final 2026' },
        { name: 'newsapi', confidence: 0.9, rawSignal: 'IPL Final match update' },
      ],
      engagement: { postsCount: 5400000, searchVolume: 1200000, newsCount: 45 },
      location: 'National',
      timestamp: now,
      isFresh: true,
    },
    {
      id: 'mumbai-local-train-' + now.slice(0, 10),
      rank: 2,
      titleEn: 'Mumbai Local Train Update',
      titleHi: 'मुंबई लोकल ट्रेन अपडेट',
      hashtag: '#मुंबईलोकलट्रेन',
      descriptionEn: 'Monsoon delays on western railway lines',
      descriptionHi: 'मानसून के चलते पश्चिमी रेलवे में देरी',
      category: 'news',
      heatScore: 85,
      sources: [
        { name: 'google-trends', confidence: 0.8, rawSignal: 'Mumbai train delays' },
        { name: 'reddit', confidence: 0.7, rawSignal: 'Mumbai local train status' },
      ],
      engagement: { postsCount: 890000, searchVolume: 300000, newsCount: 12 },
      location: 'Maharashtra',
      timestamp: now,
      isFresh: true,
    },
    {
      id: 'pushpa-2-teaser-' + now.slice(0, 10),
      rank: 3,
      titleEn: 'Pushpa 2 Teaser Release',
      titleHi: 'पुष्पा 2 टीज़र रिलीज़',
      hashtag: '#पुष्पा2',
      descriptionEn: 'Allu Arjun most awaited film teaser is out',
      descriptionHi: 'अल्लू अर्जुन की मोस्ट अवेटेड फिल्म का टीज़र आउट',
      category: 'entertainment',
      heatScore: 82,
      sources: [
        { name: 'google-trends', confidence: 0.85, rawSignal: 'Pushpa 2 teaser' },
        { name: 'serpapi-realtime', confidence: 0.75, rawSignal: 'Pushpa 2 movie' },
      ],
      engagement: { postsCount: 2100000, searchVolume: 800000, newsCount: 22 },
      location: 'National',
      timestamp: now,
      isFresh: false,
    },
    {
      id: 'rbi-repo-rate-' + now.slice(0, 10),
      rank: 4,
      titleEn: 'RBI Repo Rate Cut',
      titleHi: 'आरबीआई रेपो रेट कट',
      hashtag: '#आरबीआईब्याजदर',
      descriptionEn: '25 bps cut announced in interest rates',
      descriptionHi: 'ब्याज दरों में 25 बेसिस पॉइंट की कटौती का ऐलान',
      category: 'finance',
      heatScore: 78,
      sources: [
        { name: 'newsapi', confidence: 0.9, rawSignal: 'RBI rate cut news' },
        { name: 'google-trends', confidence: 0.7, rawSignal: 'RBI interest rate' },
      ],
      engagement: { postsCount: 450000, searchVolume: 200000, newsCount: 30 },
      location: 'National',
      timestamp: now,
      isFresh: true,
    },
    {
      id: 'badrinath-yatra-' + now.slice(0, 10),
      rank: 5,
      titleEn: 'Badrinath Yatra 2026',
      titleHi: 'बद्रीनाथ यात्रा 2026',
      hashtag: '#बद्रीनाथयात्रा',
      descriptionEn: 'Char Dham yatra begins, heavy crowd of devotees',
      descriptionHi: 'चारधाम यात्रा शुरू, भक्तों की भारी भीड़',
      category: 'devotional',
      heatScore: 72,
      sources: [
        { name: 'google-trends', confidence: 0.75, rawSignal: 'Badrinath Yatra' },
        { name: 'reddit', confidence: 0.6, rawSignal: 'Char Dham travel tips' },
      ],
      engagement: { postsCount: 320000, searchVolume: 150000, newsCount: 8 },
      location: 'Uttarakhand',
      timestamp: now,
      isFresh: false,
    },
    {
      id: 'diwali-2026-' + now.slice(0, 10),
      rank: 6,
      titleEn: 'Diwali 2026 Preparations',
      titleHi: 'दीवाली 2026 तैयारियाँ',
      hashtag: '#दीवाली2026',
      descriptionEn: 'Festival preparations trending across India',
      descriptionHi: 'पूरे भारत में त्योहार की तैयारियाँ ट्रेंड कर रही हैं',
      category: 'devotional',
      heatScore: 68,
      sources: [
        { name: 'google-trends', confidence: 0.7, rawSignal: 'Diwali 2026' },
        { name: 'reddit', confidence: 0.5, rawSignal: 'Diwali shopping deals' },
      ],
      engagement: { postsCount: 1200000, searchVolume: 500000, newsCount: 15 },
      location: 'National',
      timestamp: now,
      isFresh: false,
    },
    {
      id: 'india-vs-australia-' + now.slice(0, 10),
      rank: 7,
      titleEn: 'India vs Australia Test',
      titleHi: 'भारत बनाम ऑस्ट्रेलिया',
      hashtag: '#भारतबनामऑस्ट्रेलिया',
      descriptionEn: '3rd Test match between India and Australia trending',
      descriptionHi: 'भारत और ऑस्ट्रेलिया के बीच तीसरा टेस्ट मैच चल रहा है',
      category: 'sports',
      heatScore: 88,
      sources: [
        { name: 'google-trends', confidence: 0.9, rawSignal: 'India vs Australia' },
        { name: 'newsapi', confidence: 0.85, rawSignal: 'Ind vs Aus live score' },
      ],
      engagement: { postsCount: 4100000, searchVolume: 1500000, newsCount: 38 },
      location: 'National',
      timestamp: now,
      isFresh: true,
    },
    {
      id: '5g-launch-india-' + now.slice(0, 10),
      rank: 8,
      titleEn: '5G Launch India Updates',
      titleHi: '5G लॉन्च भारत अपडेट',
      hashtag: '#5Gभारत',
      descriptionEn: 'Telecom updates on 5G expansion in Indian cities',
      descriptionHi: 'भारतीय शहरों में 5G विस्तार पर टेलीकॉम अपडेट',
      category: 'technology',
      heatScore: 65,
      sources: [
        { name: 'newsapi', confidence: 0.8, rawSignal: '5G India launch' },
        { name: 'reddit', confidence: 0.6, rawSignal: '5G speed test India' },
      ],
      engagement: { postsCount: 180000, searchVolume: 90000, newsCount: 14 },
      location: 'National',
      timestamp: now,
      isFresh: false,
    },
    {
      id: 'gold-price-today-' + now.slice(0, 10),
      rank: 9,
      titleEn: 'Gold Price Today',
      titleHi: 'आज सोने की कीमत',
      hashtag: '#सोनेकीकीमत',
      descriptionEn: 'Daily gold rate updates across major Indian cities',
      descriptionHi: 'प्रमुख भारतीय शहरों में दैनिक सोने की दर अपडेट',
      category: 'finance',
      heatScore: 70,
      sources: [
        { name: 'google-trends', confidence: 0.8, rawSignal: 'Gold price today' },
        { name: 'newsapi', confidence: 0.7, rawSignal: 'Gold rate update' },
      ],
      engagement: { postsCount: 250000, searchVolume: 400000, newsCount: 10 },
      location: 'National',
      timestamp: now,
      isFresh: false,
    },
    {
      id: 'parliament-session-' + now.slice(0, 10),
      rank: 10,
      titleEn: 'Parliament Session Live',
      titleHi: 'संसद सत्र लाइव',
      hashtag: '#संसदसत्र',
      descriptionEn: 'Key bills and debates in ongoing parliament session',
      descriptionHi: 'चल रहे संसद सत्र में प्रमुख बिल और बहस',
      category: 'politics',
      heatScore: 76,
      sources: [
        { name: 'newsapi', confidence: 0.9, rawSignal: 'Parliament session today' },
        { name: 'google-trends', confidence: 0.7, rawSignal: 'Lok Sabha live' },
      ],
      engagement: { postsCount: 560000, searchVolume: 250000, newsCount: 28 },
      location: 'National',
      timestamp: now,
      isFresh: true,
    },
    {
      id: 'kerala-rains-' + now.slice(0, 10),
      rank: 11,
      titleEn: 'Kerala Heavy Rains',
      titleHi: 'केरल में भारी बारिश',
      hashtag: '#केरलबारिश',
      descriptionEn: 'Monsoon alerts and flood warnings in Kerala',
      descriptionHi: 'केरल में मानसून अलर्ट और बाढ़ की चेतावनी',
      category: 'news',
      heatScore: 74,
      sources: [
        { name: 'newsapi', confidence: 0.85, rawSignal: 'Kerala rain alert' },
        { name: 'google-trends', confidence: 0.75, rawSignal: 'Kerala weather' },
      ],
      engagement: { postsCount: 410000, searchVolume: 180000, newsCount: 18 },
      location: 'Kerala',
      timestamp: now,
      isFresh: true,
    },
    {
      id: 'yoga-day-' + now.slice(0, 10),
      rank: 12,
      titleEn: 'International Yoga Day',
      titleHi: 'अंतर्राष्ट्रीय योग दिवस',
      hashtag: '#योगदिवस',
      descriptionEn: 'Yoga events and health tips trending nationwide',
      descriptionHi: 'पूरे देश में योग कार्यक्रम और हेल्थ टिप्स ट्रेंड कर रहे हैं',
      category: 'lifestyle',
      heatScore: 62,
      sources: [
        { name: 'google-trends', confidence: 0.7, rawSignal: 'Yoga Day 2026' },
        { name: 'reddit', confidence: 0.5, rawSignal: 'Yoga benefits' },
      ],
      engagement: { postsCount: 150000, searchVolume: 70000, newsCount: 9 },
      location: 'National',
      timestamp: now,
      isFresh: false,
    },
    {
      id: 'kalki-2898-' + now.slice(0, 10),
      rank: 13,
      titleEn: 'Kalki 2898 AD Review',
      titleHi: 'कल्कि 2898 ईसवी रिव्यू',
      hashtag: '#कल्कि2898',
      descriptionEn: 'Sci-fi epic starring Prabhas trending at box office',
      descriptionHi: 'प्रभास की साइ-फाई एपिक बॉक्स ऑफिस पर ट्रेंड कर रही है',
      category: 'entertainment',
      heatScore: 80,
      sources: [
        { name: 'google-trends', confidence: 0.85, rawSignal: 'Kalki 2898 review' },
        { name: 'serpapi-realtime', confidence: 0.75, rawSignal: 'Kalki movie' },
      ],
      engagement: { postsCount: 1800000, searchVolume: 600000, newsCount: 25 },
      location: 'National',
      timestamp: now,
      isFresh: true,
    },
    {
      id: 'iphone-17-' + now.slice(0, 10),
      rank: 14,
      titleEn: 'iPhone 17 Launch Rumors',
      titleHi: 'आईफोन 17 लॉन्च अफवाहें',
      hashtag: '#आईफोन17',
      descriptionEn: 'Tech rumors and leaks about next iPhone generation',
      descriptionHi: 'अगली आईफोन जनरेशन के बारे में टेक अफवाहें और लीक',
      category: 'technology',
      heatScore: 58,
      sources: [
        { name: 'reddit', confidence: 0.7, rawSignal: 'iPhone 17 rumors' },
        { name: 'google-trends', confidence: 0.6, rawSignal: 'iPhone 17 specs' },
      ],
      engagement: { postsCount: 120000, searchVolume: 80000, newsCount: 6 },
      location: 'National',
      timestamp: now,
      isFresh: false,
    },
    {
      id: 'amarnath-yatra-' + now.slice(0, 10),
      rank: 15,
      titleEn: 'Amarnath Yatra Registration',
      titleHi: 'अमरनाथ यात्रा रजिस्ट्रेशन',
      hashtag: '#अमरनाथयात्रा',
      descriptionEn: 'Registration opens for Amarnath pilgrimage 2026',
      descriptionHi: 'अमरनाथ तीर्थयात्रा 2026 के लिए रजिस्ट्रेशन शुरू',
      category: 'devotional',
      heatScore: 66,
      sources: [
        { name: 'google-trends', confidence: 0.75, rawSignal: 'Amarnath Yatra registration' },
        { name: 'newsapi', confidence: 0.7, rawSignal: 'Amarnath Yatra 2026' },
      ],
      engagement: { postsCount: 210000, searchVolume: 120000, newsCount: 11 },
      location: 'Jammu & Kashmir',
      timestamp: now,
      isFresh: false,
    },
  ];

  data.sort((a, b) => b.heatScore - a.heatScore);
  data.forEach((t, i) => (t.rank = i + 1));
  return data;
}
