/**
 * High-performance M3U / M3U8 Playlist Parser for IPTV streams
 */

const ISO_LANG_MAP = {
  tel: 'Telugu',
  te: 'Telugu',
  hin: 'Hindi',
  hi: 'Hindi',
  tam: 'Tamil',
  ta: 'Tamil',
  kan: 'Kannada',
  kn: 'Kannada',
  mal: 'Malayalam',
  ml: 'Malayalam',
  ben: 'Bengali',
  bn: 'Bengali',
  mar: 'Marathi',
  mr: 'Marathi',
  guj: 'Gujarati',
  gu: 'Gujarati',
  pan: 'Punjabi',
  pa: 'Punjabi',
  urd: 'Urdu',
  ur: 'Urdu',
  ori: 'Odia',
  or: 'Odia',
  eng: 'English',
  en: 'English',
  spa: 'Spanish',
  es: 'Spanish',
  fra: 'French',
  fr: 'French',
  deu: 'German',
  de: 'German',
  ita: 'Italian',
  it: 'Italian',
  por: 'Portuguese',
  pt: 'Portuguese',
  rus: 'Russian',
  ru: 'Russian',
  ara: 'Arabic',
  ar: 'Arabic',
  kor: 'Korean',
  ko: 'Korean',
  jpn: 'Japanese',
  ja: 'Japanese',
  zho: 'Chinese',
  zh: 'Chinese',
};

export function parseM3U(content) {
  if (!content) return { channels: [], categories: [], countries: [] };

  const lines = content.split(/\r?\n/);
  const channels = [];
  const categorySet = new Set();
  const countrySet = new Set();
  const languageSet = new Set();

  let currentChannel = null;
  let nextUserAgent = null;
  let idCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
      nextUserAgent = line.substring('#EXTVLCOPT:http-user-agent='.length);
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      idCounter++;
      // Parse EXTINF attributes
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const countryMatch = line.match(/tvg-country="([^"]*)"/i);
      const langMatch = line.match(/tvg-language="([^"]*)"/i);

      // Channel name is after the last comma
      const commaIndex = line.lastIndexOf(',');
      let rawName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : `Channel ${idCounter}`;
      
      // Clean quality tag if present, e.g., "(720p)" or "[1080p]"
      let quality = 'SD';
      if (/4k|uhd/i.test(rawName)) quality = '4K';
      else if (/1080p|fhd/i.test(rawName)) quality = '1080p';
      else if (/720p|hd/i.test(rawName)) quality = '720p';
      else if (/576p|480p/i.test(rawName)) quality = '480p';

      // Parse primary group/category
      let rawGroup = groupMatch ? groupMatch[1].trim() : 'General';
      if (!rawGroup) rawGroup = 'General';
      
      // Split multi-categories if separated by semicolons or slashes
      const groups = rawGroup.split(/;/).map(g => g.trim()).filter(Boolean);
      const primaryGroup = groups[0] || 'General';

      groups.forEach(g => categorySet.add(g));

      // Extract country code
      let country = countryMatch ? countryMatch[1].toUpperCase() : null;
      if (!country && tvgIdMatch && tvgIdMatch[1]) {
        const parts = tvgIdMatch[1].split('@')[0].split('.');
        if (parts.length > 1) {
          const possibleCC = parts[parts.length - 1].toUpperCase();
          if (possibleCC.length === 2 && /^[A-Z]{2}$/.test(possibleCC)) {
            country = possibleCC;
          }
        }
      }
      if (country) countrySet.add(country);

      // Extract language(s)
      let parsedLangs = [];
      if (langMatch && langMatch[1]) {
        parsedLangs = langMatch[1]
          .split(/;|,/)
          .map(l => l.trim())
          .filter(Boolean)
          .map(l => ISO_LANG_MAP[l.toLowerCase()] || (l.charAt(0).toUpperCase() + l.slice(1)));
      }

      // Infer language from channel title, tvg-id & group-title keywords
      // IMPORTANT: only use inferred lang if tvg-language was NOT provided by the M3U
      const searchStr = [
        rawName,
        tvgIdMatch ? tvgIdMatch[1] : '',
        rawGroup,
        countryMatch ? countryMatch[1] : '',
      ].join(' ').toLowerCase();

      const langCheckMap = {
        'Telugu': new RegExp(
          '\\b(telugu|telegu)\\b|\\.tel\\.in|@telugu\\b' +
          '|\\bstar\\s*maa\\b|\\bstarmaa\\b|\\bmaa\\s*(tv|movies|gold|music)\\b' +
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
          '|sony.*sport.*telugu|star.*sport.*telugu' +
          '|in:\\s*telugu|india:\\s*telugu',
          'i'
        ),
        'Hindi': /hindi|hin\.in|bal bharat|balbharat|aaj tak|zee news|ndtv india|star plus|colors (tv|hindi)|abp news|india tv|news18 india|republic bharat|tv9 bharatvarsh|dd news|sansad|news24|tez|samachar|zee bollywood|sony pal|star bharat|sab tv|star gold|zee cinema|set max|star utsav|in: hindi|india: hindi/i,
        'Tamil': /tamil|tam\.in|sun tv|vijay tv|kalaignar|polimer|puthiya thalaimurai|seithigal|thanthi|jaya tv|raj tv|zee tamil|star vijay|dd tamil|in: tamil|india: tamil/i,
        'Malayalam': /malayalam|mal\.in|asianet|manorama|mathrubhumi|kairali|amrita|reporter tv|in: malayalam|india: malayalam/i,
        'Kannada': /kannada|kan\.in|tv9 kannada|suvarna|public tv kannada|news18 kannada|kasthuri|udaya|in: kannada|india: kannada/i,
        'Bengali': /bengali|bangla|ban\.in|zee 24 ghanta|abp ananda|news18 bangla|in: bengali|india: bengali/i,
        'Marathi': /marathi|mar\.in|zee 24 taas|abp majha|tv9 marathi|in: marathi|india: marathi/i,
        'Punjabi': /punjabi|pan\.in|ptc|zee punjabi|in: punjabi|india: punjabi/i,
        'English': /\benglish\b|eng\.in|bbc|cnn|fox news|sky news|republic tv|times now|india today|wion|mirror now|newsx|bloomberg|discovery|nat geo/i,
        'Spanish': /spanish|español/i,
        'French': /french|français/i,
        'German': /german|deutsch/i,
        'Arabic': /arabic|العربية/i,
      };

      let matchedLang = null;
      // Only infer if tvg-language was not already provided by the M3U file
      if (parsedLangs.length === 0) {
        for (const [langName, regex] of Object.entries(langCheckMap)) {
          if (langName === 'Telugu') {
            // Strict negative filters to prevent false positives
            if (/\bsvbc\s*[234]\b/i.test(searchStr) || /svbc[234]\.in/i.test(searchStr)) continue;
            if (/big\s*tv\s*24x?7/i.test(searchStr) || /bigtv24x7/i.test(searchStr)) continue;
            if (/\b4\s*sides\s*tv\b/i.test(searchStr) || /4sidestv/i.test(searchStr)) continue;
            if (/\b9\s*plus\s*news\b/i.test(searchStr) || /9plusnews/i.test(searchStr)) continue;
            if (/\bgospel\s*tv\s*india\b/i.test(searchStr) || /gospeltvindia/i.test(searchStr)) continue;
            if (/\bmetro\s*tv\b/i.test(searchStr) || /metrotv/i.test(searchStr)) continue;
            if (/^mango\s*\(india\)/i.test(rawName) || (tvgIdMatch && tvgIdMatch[1] === 'Mango.in@SD')) continue;
            if (/\bstudio\s*(one\s*\+|yuva)\b/i.test(searchStr) || /studio(oneplus|yuva)/i.test(searchStr)) continue;
            if (/bal\s*bharat/i.test(searchStr) || (tvgIdMatch && /balbharat/i.test(tvgIdMatch[1]))) continue;

            const hasExplicitTelugu = /\b(telugu|telegu)\b|@telugu|\.tel\.in/i.test(searchStr);
            const nonTeluguPanIndia = /hungama|nickelodeon|\bnick\b|\bsonic\b|disney|sony\s*(bbc|pix|yay)|super\s*hungama|history\s*tv18|national\s*geographic|nat\s*geo|cartoon\s*network|discovery|eurosport|fox\s*life|dd\s*sports|sada\s*tv|yet\s*(tv|max)/i;
            if (!hasExplicitTelugu && (nonTeluguPanIndia.test(searchStr) || (tvgIdMatch && nonTeluguPanIndia.test(tvgIdMatch[1])))) continue;

            // Star Sports 2 (English) vs Star Sports 2 Telugu
            if (/star\s*sports\s*2\b/i.test(searchStr) && !hasExplicitTelugu) continue;
            if (tvgIdMatch && /starsports2\.in@hd/i.test(tvgIdMatch[1]) && !hasExplicitTelugu) continue;

            const isIndian = country === 'IN' || /\.in(@|$)/i.test(tvgIdMatch ? tvgIdMatch[1] : '');
            if ((hasExplicitTelugu || isIndian) && regex.test(searchStr)) {
              matchedLang = langName;
              break;
            }
          } else if (regex.test(searchStr)) {
            matchedLang = langName;
            break;
          }
        }
      }

      if (matchedLang) {
        parsedLangs = [matchedLang];
      } else if (parsedLangs.length === 0) {
        parsedLangs = ['International'];

      }

      parsedLangs.forEach(l => languageSet.add(l));

      currentChannel = {
        id: `ch_${idCounter}_${Math.random().toString(36).substring(2, 7)}`,
        name: rawName,
        logo: logoMatch ? logoMatch[1] : '',
        group: primaryGroup,
        allGroups: groups,
        tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
        quality,
        country: country || 'Global',
        languages: parsedLangs,
        language: parsedLangs[0] || 'English',
        isMultiAudio: parsedLangs.length > 1,
        userAgent: nextUserAgent,
        url: ''
      };
      nextUserAgent = null; // Reset
    } else if (line.startsWith('#')) {
      // Ignore other comments/directives
      continue;
    } else if (currentChannel && (line.startsWith('http://') || line.startsWith('https://') || line.endsWith('.m3u8') || line.endsWith('.ts') || line.endsWith('.mpd'))) {
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = null;
    }
  }

  const categories = Array.from(categorySet).sort();
  const countries = Array.from(countrySet).sort();
  const languages = Array.from(languageSet).sort();

  return {
    channels,
    categories,
    countries,
    languages
  };
}

/**
 * Fetch and parse an M3U playlist from URL
 */
export async function fetchPlaylist(url, corsProxy = false) {
  let targetUrl = url;
  if (corsProxy) {
    targetUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  }

  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch playlist (${response.status} ${response.statusText})`);
  }

  const text = await response.text();
  return parseM3U(text);
}
