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

      // Infer language from channel title & tvg-id keywords if missing or to augment
      const searchStr = `${rawName} ${tvgIdMatch ? tvgIdMatch[1] : ''}`.toLowerCase();
      const langCheckMap = {
        'Telugu': /telugu|telegu|tel\.in|6tv|10tv|99tv|abn|andhra|jyoti|bhakthi|big tv|brk news|cvr|saptagiri|yadagiri|divyavani|etv|hmtv|inews|\bntv\b|tv9 telugu|sakshi|mahaa|v6|t news|tnews|prime9|raj news|studio n|swara|subhavaartha|calvary|express tv|ap 24|ap24|tollywood|vissa|aradhana|vanitha|namasthe|hyderabad|amaravati|telangana/i,
        'Hindi': /hindi|hin\.in|aaj tak|zee news|ndtv india|star plus|colors hindi|ABP news|india tv|news18 india|republic bharat|tv9 bharatvarsh|dd news|sansad|good news today|news24|tez|samachar/i,
        'Tamil': /tamil|tam\.in|sun tv|vijay tv|kTV|polimer|puthiya|seithigal|thanthi|jaya|raj tv/i,
        'Malayalam': /malayalam|mal\.in|asianet|manorama|mathrubhumi|kairali|amrita|reporter tv|24 news/i,
        'Kannada': /kannada|kan\.in|tv9 kannada|suvarna|public tv|news18 kannada|kasthuri|udaya/i,
        'Bengali': /bengali|bangla|ban\.in|zee 24 ghanta|abp ananda|news18 bangla/i,
        'Marathi': /marathi|mar\.in|zee 24 taas|abp majha|tv9 marathi/i,
        'Punjabi': /punjabi|pan\.in|ptc|zee punjabi/i,
        'English': /english|eng\.in|\b(us|uk|ca|au)\b|bbc|cnn|fox|republic tv|times now|india today|wion|mirror now|newsx/i,
        'Spanish': /spanish|español/i,
        'French': /french|français/i,
        'German': /german|deutsch/i,
        'Arabic': /arabic|العربية/i
      };

      let matchedLang = null;
      for (const [langName, regex] of Object.entries(langCheckMap)) {
        if (regex.test(searchStr)) {
          matchedLang = langName;
          break;
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
