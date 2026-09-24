// Multi-Language Audio and Regional Companion Service (JioTV / D2H Architecture)

export const AUDIO_LANGUAGES = [
  { code: 'Telugu', label: 'Telugu (తెలుగు)', flag: '🚩', iso: ['tel', 'te'] },
  { code: 'Hindi', label: 'Hindi (हिंदी)', flag: '🇮🇳', iso: ['hin', 'hi'] },
  { code: 'English', label: 'English', flag: '🇬🇧', iso: ['eng', 'en'] },
  { code: 'Tamil', label: 'Tamil (தமிழ்)', flag: '🇮🇳', iso: ['tam', 'ta'] },
  { code: 'Kannada', label: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳', iso: ['kan', 'kn'] },
  { code: 'Malayalam', label: 'Malayalam (മലയാളം)', flag: '🇮🇳', iso: ['mal', 'ml'] },
  { code: 'Bengali', label: 'Bengali (বাংলা)', flag: '🇮🇳', iso: ['ben', 'bn'] },
  { code: 'Marathi', label: 'Marathi (मराठी)', flag: '🇮🇳', iso: ['mar', 'mr'] },
  { code: 'Gujarati', label: 'Gujarati (ગુજરાતી)', flag: '🇮🇳', iso: ['guj', 'gu'] },
  { code: 'Punjabi', label: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳', iso: ['pan', 'pa'] },
  { code: 'Odia', label: 'Odia (ଓଡ଼ିଆ)', flag: '🇮🇳', iso: ['ori', 'or'] },
  { code: 'Urdu', label: 'Urdu (اردو)', flag: '🇮🇳', iso: ['urd', 'ur'] },
  { code: 'Spanish', label: 'Spanish (Español)', flag: '🇪🇸', iso: ['spa', 'es'] },
  { code: 'French', label: 'French (Français)', flag: '🇫🇷', iso: ['fra', 'fr'] },
  { code: 'German', label: 'German (Deutsch)', flag: '🇩🇪', iso: ['deu', 'de'] },
  { code: 'Russian', label: 'Russian (Русский)', flag: '🇷🇺', iso: ['rus', 'ru'] },
  { code: 'Arabic', label: 'Arabic (العربية)', flag: '🇸🇦', iso: ['ara', 'ar'] },
];

export const ISO_LANG_MAP = {
  tel: 'Telugu', te: 'Telugu',
  hin: 'Hindi', hi: 'Hindi',
  tam: 'Tamil', ta: 'Tamil',
  kan: 'Kannada', kn: 'Kannada',
  mal: 'Malayalam', ml: 'Malayalam',
  ben: 'Bengali', bn: 'Bengali',
  mar: 'Marathi', mr: 'Marathi',
  guj: 'Gujarati', gu: 'Gujarati',
  pan: 'Punjabi', pa: 'Punjabi',
  urd: 'Urdu', ur: 'Urdu',
  ori: 'Odia', or: 'Odia',
  eng: 'English', en: 'English',
  spa: 'Spanish', es: 'Spanish',
  fra: 'French', fr: 'French',
  deu: 'German', de: 'German',
  ita: 'Italian', it: 'Italian',
  por: 'Portuguese', pt: 'Portuguese',
  rus: 'Russian', ru: 'Russian',
  ara: 'Arabic', ar: 'Arabic',
  kor: 'Korean', ko: 'Korean',
  jpn: 'Japanese', ja: 'Japanese',
  zho: 'Chinese', zh: 'Chinese',
};

// Strict Telugu Detection: Zero False Positives
export function isTeluguChannel(channel) {
  if (!channel) return false;
  const name = (channel.name || '').toLowerCase();
  const tvgId = (channel.tvgId || '').toLowerCase();
  const group = (channel.group || '').toLowerCase();
  const chLang = (channel.language || '').toLowerCase();
  const chLangs = (channel.languages || []).map(l => l.toLowerCase());
  const country = (channel.country || '').toUpperCase();
  const url = (channel.url || '').toLowerCase();

  // Strict Exclusions
  if (/\bsvbc\s*[234]\b/i.test(name) || /svbc[234]\.in/i.test(tvgId)) return false;
  if (/big\s*tv\s*24x?7/i.test(name) || /bigtv24x7/i.test(tvgId) || url.includes('bigtvmalayalam')) return false;
  if (/\b4\s*sides\s*tv\b/i.test(name) || /4sidestv/i.test(tvgId)) return false;
  if (/\b9\s*plus\s*news\b/i.test(name) || /9plusnews/i.test(tvgId)) return false;
  if (/\bgospel\s*tv\s*india\b/i.test(name) || /gospeltvindia/i.test(tvgId)) return false;
  if (/\bmetro\s*tv\b/i.test(name) || /metrotv/i.test(tvgId)) return false;
  if (/^mango\s*\(india\)/i.test(name) || tvgId === 'mango.in@sd') return false;
  if (/\bstudio\s*(one\s*\+|yuva)\b/i.test(name) || /studio(oneplus|yuva)/i.test(tvgId)) return false;
  if (/bal\s*bharat/i.test(name) || /balbharat/i.test(tvgId)) return false;

  const hasExplicitTeluguInNameOrId =
    /\b(telugu|telegu)\b/i.test(name) ||
    /\b(telugu|telegu)\b/i.test(tvgId) ||
    /@telugu\b/i.test(tvgId) ||
    /\.tel\.in/i.test(tvgId);

  const nonTeluguPanIndiaPattern = /hungama|nickelodeon|\bnick\b|\bsonic\b|disney|sony\s*(bbc|pix|yay)|super\s*hungama|history\s*tv18|national\s*geographic|nat\s*geo|cartoon\s*network|discovery|eurosport|fox\s*life|dd\s*sports|sada\s*tv|yet\s*(tv|max)/i;
  if (!hasExplicitTeluguInNameOrId && (nonTeluguPanIndiaPattern.test(name) || nonTeluguPanIndiaPattern.test(tvgId))) {
    return false;
  }

  if (/star\s*sports\s*2\b/i.test(name) && !hasExplicitTeluguInNameOrId) return false;
  if (/starsports2\.in@hd/i.test(tvgId) && !hasExplicitTeluguInNameOrId) return false;

  const hasExplicitTelugu =
    hasExplicitTeluguInNameOrId ||
    chLang === 'telugu' || chLang === 'telegu' || chLang === 'tel' ||
    chLangs.some(l => l === 'telugu' || l === 'telegu' || l === 'tel') ||
    group === 'telugu' || group.includes('in: telugu') || group.includes('india: telugu');

  if (hasExplicitTelugu) return true;

  const isIndian = country === 'IN' || /\.in(@|$)/i.test(tvgId);
  if (!isIndian) return false;

  const teluguBrandRegex = new RegExp(
    '\\bstar\\s*maa\\b|\\bstarmaa\\b|\\bmaa\\s*(tv|movies|gold|music)\\b' +
    '|\\bzee\\s*(telugu|cinemalu)\\b|\\bzeecinemalu\\b' +
    '|\\betv\\s*(telugu|andhra|telangana|plus|cinema|life|abhiruchi|news|beats|comedy|josh|music)?\\b' +
    '|\\betv(telugu|andhra|telangana|plus|cinema|life|abhiruchi|news|beats|comedy|josh|music)?\\.in' +
    '|\\bgemini\\s*(tv|movies|music|comedy|life)\\b|\\bsungemini\\b' +
    '|\\btv9\\s*telugu\\b|\\btv9telugu\\b|\\btv5\\s*news\\b|\\btv5news\\b|\\bv6\\s*news\\b|\\bv6news\\b' +
    '|\\bntv\\s*telugu\\b|\\bntvtelugu\\b|\\bntv\\s*news\\b' +
    '|\\bhmtv\\b|\\b10\\s*tv\\b|\\b10tv\\b|\\b99\\s*tv\\b|\\b99tv\\b' +
    '|\\bprime\\s*9(\\s*news)?\\b|\\bprime9news\\b' +
    '|\\bcvr\\s*(news|health|om|spiritual)\\b|\\bcvr(news|health|omspiritual)?\\.in' +
    '|\\babn\\s*(andhra|jyoth?i)?\\b|\\babnandhra\\b|\\babn\\.in\\b' +
    '|\\bsakshi\\s*(tv|news)?\\b|\\bsakshitv\\b' +
    '|\\b(t[\\s-]news|tnews)\\b' +
    '|\\bbig\\s*tv\\b|\\bbigtv\\.in\\b' +
    '|\\bbrk\\s*news\\b|\\bbrknews\\.in\\b' +
    '|\\bswatantra\\s*tv\\b|\\bswatantratv\\.in\\b' +
    '|\\bdd\\s*(saptagiri|yadagiri)\\b|\\bdd(saptagiri|yadagiri)\\.in\\b' +
    '|\\bvanitha\\s*tv\\b|\\bvanithatv\\b' +
    '|\\bvissa\\s*tv\\b|\\bvissatv\\b' +
    '|\\bsvbc\\b|\\bsvbc\\.in\\b' +
    '|\\bbhakthi\\s*tv\\b|\\bbhakthitv\\b' +
    '|\\b6\\s*tv\\s*telugu\\b|\\b6tvtelugu\\b' +
    '|\\bmahaa\\s*(news|tv|max|bhakti)\\b|\\bmahaa(news|max|bhakti)?\\.in\\b' +
    '|\\bmango\\s*(mobile\\s*tv|music|telugu)\\b|\\bmangomobiletv\\b' +
    '|\\binews\\b|\\binews\\.in\\b' +
    '|\\bmojo\\s*tv\\b|\\bmojotv\\.in\\b' +
    '|\\bdivyavani\\s*tv\\b|\\bdivyavanitv\\b' +
    '|\\bhindu\\s*dharmam\\b|\\bhindudharmam\\b' +
    '|\\bnireekshana\\s*tv\\b|\\bnireekshanatv\\b' +
    '|\\bsubhavaarth?a\\b|\\bsubhavaarthatv\\b' +
    '|\\btolly\\s*tv\\b|\\btollywood\\b|\\btollytv\\b' +
    '|\\braj\\s*(news|musix)\\s*telugu\\b|\\braj(news|musix)telugu\\b' +
    '|\\bnews18\\s*(telugu|andhra|telangana)\\b' +
    '|\\btelugu\\s*one\\b|\\bteluguone\\.in\\b' +
    '|\\bap\\s*24x?7\\b' +
    '|\\bpmc\\s*telugu\\b|\\bpmctelugu\\b' +
    '|\\bwow\\s*kidz\\s*telugu\\b|wowkidz.*telugu' +
    '|sony.*sport.*telugu|star.*sport.*telugu',
    'i'
  );

  const combined = `${name} ${tvgId} ${group}`;
  return teluguBrandRegex.test(combined);
}

// Fallback keyword mapping for other languages
export const LANG_KEYWORDS = {
  Hindi: [
    'hindi', 'aaj tak', 'zee news', 'ndtv india', 'star plus', 'colors tv', 'abp news',
    'india tv', 'news18 india', 'republic bharat', 'tv9 bharatvarsh', 'dd news',
    'sansad tv', 'news24', 'news nation', 'zee hindustan', 'doordarshan', 'dd national',
    'samachar', 'sahara', 'sony', 'tez', 'star bharat', 'sab tv', 'star gold',
    'zee cinema', '& pictures', 'set max', 'star utsav', 'zee bollywood', 'sony pal',
    'in: hindi', 'india: hindi',
  ],
  English: [
    'english', 'bbc', 'cnn', 'fox news', 'sky news', 'discovery', 'nat geo',
    'history channel', 'animal planet', 'bloomberg', 'dw english', 'france 24',
    'al jazeera english', 'wion', 'times now', 'india today', 'republic tv',
    'mirror now', 'newsx', 'cnbc', 'espn', 'sky sport',
    'in: english', 'india: english',
  ],
  Tamil: [
    'tamil', 'vijay tv', 'sun tv', 'kalaignar tv', 'raj tv', 'polimer',
    'puthiya thalaimurai', 'thanthi', 'jaya tv', 'news 7 tamil', 'captain tv',
    'dd tamil', 'adithya tv', 'zee tamil', 'star vijay',
    'in: tamil', 'india: tamil',
  ],
  Kannada: [
    'kannada', 'suvarna', 'colors kannada', 'zee kannada', 'tv9 kannada', 'public tv',
    'news18 kannada', 'udaya tv', 'dighvijay', 'in: kannada',
  ],
  Malayalam: [
    'malayalam', 'asianet', 'manorama', 'mathrubhumi', 'mediaone', 'kairali',
    'amrita tv', 'mazhavil manorama', 'surya tv', 'in: malayalam',
  ],
  Bengali: [
    'bengali', 'bangla', 'zee 24 ghanta', 'abp ananda', 'star jalsha', 'colors bangla',
    'news18 bangla', 'in: bengali', 'in: bangla',
  ],
  Marathi: [
    'marathi', 'zee 24 taas', 'abp majha', 'tv9 marathi', 'colors marathi', 'star pravah',
    'news18 lokmat', 'in: marathi',
  ],
};

export function matchesLanguage(channel, lang) {
  if (!channel || !lang) return false;
  if (lang === 'ALL') return true;
  if (lang === 'Telugu') return isTeluguChannel(channel);

  const langLC = lang.toLowerCase();
  const chLang = (channel.language || '').toLowerCase();
  const chLangs = (channel.languages || []).map(l => l.toLowerCase());
  if (chLang === langLC || chLang.includes(langLC)) return true;
  if (chLangs.some(l => l === langLC || l.includes(langLC))) return true;

  const tvgId = (channel.tvgId || '').toLowerCase();
  const lang3 = langLC.slice(0, 3);
  if (tvgId.endsWith(`.${lang3}.in`) || tvgId.includes(`.${lang3}@`) || tvgId.includes(`@${langLC}`)) return true;

  const keywords = LANG_KEYWORDS[lang] || [];
  const nameL = (channel.name || '').toLowerCase();
  const groupL = (channel.group || '').toLowerCase();
  const combined = `${nameL} ${groupL} ${tvgId}`;
  return keywords.some(kw => combined.includes(kw));
}

// Find companion channel for language strictly for the SAME channel network (Zero cross-channel switching)
export function findChannelForLanguage(currentChannel, targetLanguage, allChannels) {
  if (!currentChannel || !allChannels || allChannels.length === 0) return null;

  const clean = (s) => (s || '')
    .toLowerCase()
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .replace(/\b(hd|sd|fhd|4k|720p|1080p|hevc|in|live|tv|channel|network)\b/gi, '')
    .replace(/\b(telugu|hindi|english|tamil|kannada|malayalam|bengali|marathi)\b/gi, '')
    .trim();

  const currentBase = clean(currentChannel.name);
  if (!currentBase || currentBase.length < 3) return null;

  for (const ch of allChannels) {
    if (ch.id === currentChannel.id || ch.url === currentChannel.url) continue;
    const otherBase = clean(ch.name);
    // Strict exact channel base name match only (e.g., Discovery Channel <-> Discovery Channel Telugu)
    if (otherBase === currentBase && matchesLanguage(ch, targetLanguage)) {
      return ch;
    }
  }

  // Never fallback to unrelated channels!
  return null;
}
