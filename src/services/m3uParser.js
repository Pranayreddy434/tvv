/**
 * High-performance M3U / M3U8 Playlist Parser for IPTV streams
 */

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
        parsedLangs = langMatch[1].split(/;|,/).map(l => l.trim()).filter(Boolean);
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
          '\\btelugu\\b|\\btelegu\\b|\\.tel\\.in|@telugu\\b' +
          '|\\bstar\\s*maa\\b|\\bmaa\\s*(tv|movies|gold|music)\\b' +
          '|\\bzee\\s*(telugu|cinemalu)\\b' +
          '|\\betv\\s*(telugu|andhra|telangana|plus|cinema|life|abhiruchi)\\b' +
          '|etv(telugu|andhra|telangana|plus|cinema|life|abhiruchi)\\.in' +
          '|\\bgemini\\s*(tv|movies|music|comedy|life)\\b' +
          '|\\btv9\\s*telugu\\b|\\btv5\\s*news\\b|\\bv6\\s*news\\b|\\bntv\\s*telugu\\b' +
          '|\\bhmtv\\b|\\b10\\s*tv\\b|\\b99\\s*tv\\b|\\bprime9(\\s*news)?\\b|\\bcvr\\s*news\\b' +
          '|\\babn\\s*(andhra|jyoth?i)\\b|abnandhra' +
          '|\\bsakshi\\s*(tv|news)?\\b|\\b(t[\\s-]news|tnews)\\b' +
          '|\\bvanitha\\s*tv\\b|\\bvissa\\s*tv\\b|\\bsubhavaarth?a\\b|\\bsvbc(\\s*\\d|\\s*sri)?\\b' +
          '|\\btolly\\s*tv\\b|\\btollywood\\b|\\braj\\s*(news|musix)\\s*telugu\\b' +
          '|\\bnews18\\s*(telugu|andhra)\\b|\\bmahaa\\s*(news|tv)\\b|\\bap\\s*24x?7\\b' +
          '|\\bbhakthi\\s*tv\\b|\\b6\\s*tv\\s*telugu\\b' +
          '|in:\\s*telugu|india:\\s*telugu',
          'i'
        ),
        'Hindi': /hindi|hin\.in|aaj tak|zee news|ndtv india|star plus|colors (tv|hindi)|abp news|india tv|news18 india|republic bharat|tv9 bharatvarsh|dd news|sansad|news24|tez|samachar|zee bollywood|sony pal|star bharat|sab tv|star gold|zee cinema|set max|star utsav|in: hindi|india: hindi/i,
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
            const hasExplicitTelugu = /\btelugu\b|\btelegu\b|@telugu|\.tel\.in/i.test(searchStr);
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
    targetUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  }

  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch playlist (${response.status} ${response.statusText})`);
  }

  const text = await response.text();
  return parseM3U(text);
}
