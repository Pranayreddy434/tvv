/**
 * Reusable EPG (Electronic Program Guide) Service
 * Provides schedule lookup, current and next program tracking,
 * and realistic time slot calculations with graceful fallback.
 */

// Sample structured program schedules mapped by channel ID or genre
const CHANNEL_EPG_SCHEDULES = {
  'etv-telugu': [
    { start: '06:00', end: '07:30', title: 'Aaradhana & Bhakthi Geethalu', category: 'Devotional' },
    { start: '07:30', end: '09:00', title: 'ETV Prathidhwani & Morning News', category: 'News' },
    { start: '09:00', end: '10:30', title: 'Abhiruchi - Traditional Telugu Cookery', category: 'Lifestyle' },
    { start: '10:30', end: '12:00', title: 'Antharangalu Super Hit Serial', category: 'Entertainment' },
    { start: '12:00', end: '13:00', title: 'ETV Madhyahnam News Hour', category: 'News' },
    { start: '13:00', end: '15:30', title: 'Matinee Special Tollywood Cinema', category: 'Movies' },
    { start: '15:30', end: '17:00', title: 'Sadhana - Inspiring Stories', category: 'Talk Show' },
    { start: '17:00', end: '18:00', title: 'Swarabhishekam Musical Hour', category: 'Music' },
    { start: '18:00', end: '19:00', title: 'Padha Padha Telugu Game Show', category: 'Entertainment' },
    { start: '19:00', end: '20:00', title: 'ETV News Special Bulletin', category: 'News' },
    { start: '20:00', end: '21:30', title: 'Jabardasth Comedy Express Prime', category: 'Entertainment' },
    { start: '21:30', end: '23:00', title: 'Dhee Champions Grand Finale', category: 'Reality' },
    { start: '23:00', end: '00:30', title: 'Tollywood Night Cinema Classics', category: 'Movies' },
    { start: '00:30', end: '06:00', title: 'Late Night Live Station Broadcast', category: 'General' },
  ],
  'star-maa': [
    { start: '06:00', end: '08:00', title: 'Bhakthi Sankalpam & Subhodayam', category: 'Devotional' },
    { start: '08:00', end: '09:30', title: 'Karthika Deepam Recap & Special', category: 'Entertainment' },
    { start: '09:30', end: '11:00', title: 'Intinti Gruhalakshmi', category: 'Entertainment' },
    { start: '11:00', end: '12:30', title: 'Brahmamudi High Voltage Drama', category: 'Entertainment' },
    { start: '12:30', end: '15:30', title: 'Maa Blockbuster Cinema Special', category: 'Movies' },
    { start: '15:30', end: '17:30', title: 'Guppedantha Manasu', category: 'Entertainment' },
    { start: '17:30', end: '19:00', title: 'Star Maa Parivaar League', category: 'Reality' },
    { start: '19:00', end: '20:00', title: 'Super Singer Junior Showcase', category: 'Music' },
    { start: '20:00', end: '21:30', title: 'Bigg Boss Telugu Prime Arena', category: 'Reality' },
    { start: '21:30', end: '23:00', title: 'Karthika Deepam Season 2', category: 'Entertainment' },
    { start: '23:00', end: '06:00', title: 'Star Maa Night Live Stream', category: 'Entertainment' },
  ],
  'zee-cinemalu': [
    { start: '06:00', end: '09:00', title: 'Tollywood Morning Melodies', category: 'Music' },
    { start: '09:00', end: '12:00', title: 'Morning Premiere: Ala Vaikunthapurramuloo', category: 'Movies' },
    { start: '12:00', end: '15:30', title: 'Matinee Blockbuster: Pushpa - The Rise', category: 'Movies' },
    { start: '15:30', end: '18:30', title: 'Action Special: Sarileru Neekevvaru', category: 'Movies' },
    { start: '18:30', end: '22:00', title: 'Mega Premiere: RRR (Rise Roar Revolt)', category: 'Movies' },
    { start: '22:00', end: '01:30', title: 'Night Thriller: Karthikeya 2', category: 'Movies' },
    { start: '01:30', end: '06:00', title: 'Tollywood Golden Era Classics', category: 'Movies' },
  ],
  'tv9-telugu': [
    { start: '06:00', end: '07:30', title: 'Prabhatha Varthalu - Morning Bulletins', category: 'News' },
    { start: '07:30', end: '09:00', title: 'Morning Headlines & Paper Review', category: 'News' },
    { start: '09:00', end: '11:00', title: 'Live Debate: AP & TS Political Heat', category: 'News' },
    { start: '11:00', end: '13:00', title: 'Ground Zero Investigations', category: 'News' },
    { start: '13:00', end: '14:30', title: 'Big Bulletin Midday Edition', category: 'News' },
    { start: '14:30', end: '16:00', title: 'Tollywood Speed News & Celeb Gossip', category: 'Entertainment' },
    { start: '16:00', end: '18:00', title: 'Speed 50 Breaking Headlines', category: 'News' },
    { start: '18:00', end: '19:30', title: 'Big Story at Six', category: 'News' },
    { start: '19:30', end: '21:00', title: 'Prime Time Debate with Rajinikanth', category: 'News' },
    { start: '21:00', end: '22:30', title: 'Special Focus 360 Degree', category: 'News' },
    { start: '22:30', end: '00:00', title: 'Night Express News Wrap', category: 'News' },
    { start: '00:00', end: '06:00', title: 'Continuous Live Breaking Feeds', category: 'News' },
  ],
  'svbc': [
    { start: '05:00', end: '06:30', title: 'Suprabhata Seva from Tirumala Sanctum', category: 'Devotional' },
    { start: '06:30', end: '08:30', title: 'Nitya Archana & Tomala Seva', category: 'Devotional' },
    { start: '08:30', end: '10:30', title: 'Srinivasa Kalyanam Utsavam Live', category: 'Devotional' },
    { start: '10:30', end: '12:30', title: 'Veda Parayanam & Pravachanam', category: 'Devotional' },
    { start: '12:30', end: '15:00', title: 'Annamacharya Sankeerthana Lahari', category: 'Music' },
    { start: '15:00', end: '17:30', title: 'Kalyanotsavam & Temple News', category: 'Devotional' },
    { start: '17:30', end: '19:30', title: 'Sahasra Deepalankarana Seva Live', category: 'Devotional' },
    { start: '19:30', end: '21:00', title: 'Ekanta Seva & Daily Darshan Wrap', category: 'Devotional' },
    { start: '21:00', end: '05:00', title: 'Govinda Nama Sankeerthanam Feeds', category: 'Devotional' },
  ],
  'dd-sports': [
    { start: '06:00', end: '08:00', title: 'Morning Fitness & Yoga Sadhana', category: 'Sports' },
    { start: '08:00', end: '11:00', title: 'National Games Athletics Highlights', category: 'Sports' },
    { start: '11:00', end: '14:00', title: 'International Cricket Classic Matches', category: 'Sports' },
    { start: '14:00', end: '17:00', title: 'Live Multi-Sport Arena Broadcast', category: 'Sports' },
    { start: '17:00', end: '20:00', title: 'Pro Kabaddi & Wrestling Championships', category: 'Sports' },
    { start: '20:00', end: '23:00', title: 'Sports Prime Live & Expert Analysis', category: 'Sports' },
    { start: '23:00', end: '06:00', title: 'Non-stop Historic Matches Replay', category: 'Sports' },
  ]
};

// Generic genre schedule template for channels that lack explicit schedules
const GENRE_TEMPLATES = {
  News: [
    { start: '06:00', end: '09:00', title: 'Morning Express Headlines', category: 'News' },
    { start: '09:00', end: '12:00', title: 'Live Regional & National Bulletins', category: 'News' },
    { start: '12:00', end: '15:00', title: 'Midday News Wrap & Stock Update', category: 'News' },
    { start: '15:00', end: '18:00', title: 'Ground Reporting & Analysis', category: 'News' },
    { start: '18:00', end: '21:00', title: 'Prime Focus & Evening Debate', category: 'News' },
    { start: '21:00', end: '23:30', title: 'Night Headline Round-Up', category: 'News' },
    { start: '23:30', end: '06:00', title: '24/7 Overnight News Continuous', category: 'News' },
  ],
  Movies: [
    { start: '06:00', end: '09:00', title: 'Morning Film Songs & Trailer Highlights', category: 'Music' },
    { start: '09:00', end: '12:30', title: 'Morning Blockbuster Feature', category: 'Movies' },
    { start: '12:30', end: '16:00', title: 'Afternoon Premiere Film Showcase', category: 'Movies' },
    { start: '16:00', end: '19:30', title: 'Superhit Action Cinema', category: 'Movies' },
    { start: '19:30', end: '23:00', title: 'Prime Time Mega Movie Premiere', category: 'Movies' },
    { start: '23:00', end: '06:00', title: 'Midnight Classic Cinema Showcase', category: 'Movies' },
  ],
  Music: [
    { start: '06:00', end: '10:00', title: 'Morning Melodies & Devotional Beats', category: 'Music' },
    { start: '10:00', end: '14:00', title: 'Non-Stop Chartbuster Anthems', category: 'Music' },
    { start: '14:00', end: '18:00', title: 'Top 20 Countdown & Request Hour', category: 'Music' },
    { start: '18:00', end: '22:00', title: 'Sunset Grooves & Latest Releases', category: 'Music' },
    { start: '22:00', end: '06:00', title: 'Night Chillout Acoustic Hits', category: 'Music' },
  ],
  Sports: [
    { start: '06:00', end: '09:00', title: 'Morning Sports Desk & Match Highlights', category: 'Sports' },
    { start: '09:00', end: '13:00', title: 'International Live Tournament Session 1', category: 'Sports' },
    { start: '13:00', end: '17:00', title: 'Live Match Coverage & Game Analysis', category: 'Sports' },
    { start: '17:00', end: '21:00', title: 'Championship Matchday Live Action', category: 'Sports' },
    { start: '21:00', end: '23:30', title: 'Match Point & Post-Game Analysis', category: 'Sports' },
    { start: '23:30', end: '06:00', title: 'Overnight Replay: Best Plays of the Week', category: 'Sports' },
  ],
  Devotional: [
    { start: '05:00', end: '08:00', title: 'Morning Suprabhatam & Temple Chants', category: 'Devotional' },
    { start: '08:00', end: '12:00', title: 'Live Sanctum Puja & Discourse', category: 'Devotional' },
    { start: '12:00', end: '16:00', title: 'Bhakthi Sankeerthanam & Pravachanam', category: 'Devotional' },
    { start: '16:00', end: '20:00', title: 'Sandhya Deeparadhana & Aarti Live', category: 'Devotional' },
    { start: '20:00', end: '05:00', title: 'Night Spiritual Meditations & Bhajans', category: 'Devotional' },
  ],
  Kids: [
    { start: '06:00', end: '09:00', title: 'Wake Up Cartoons & Playful Rhymes', category: 'Kids' },
    { start: '09:00', end: '13:00', title: 'Animated Adventures & Hero Tales', category: 'Kids' },
    { start: '13:00', end: '17:00', title: 'Fun Cartoon Marathons & Comedy Skits', category: 'Kids' },
    { start: '17:00', end: '20:00', title: 'Prime Time Super Hero Saga', category: 'Kids' },
    { start: '20:00', end: '06:00', title: 'Bedtime Stories & Dreamland Tales', category: 'Kids' },
  ],
  Entertainment: [
    { start: '06:00', end: '09:00', title: 'Morning Serenity & Cultural News', category: 'Entertainment' },
    { start: '09:00', end: '13:00', title: 'Family Drama & Morning Episodes', category: 'Entertainment' },
    { start: '13:00', end: '17:00', title: 'Afternoon Variety Specials & Talk Show', category: 'Entertainment' },
    { start: '17:00', end: '19:30', title: 'Youth Reality & Quiz League', category: 'Entertainment' },
    { start: '19:30', end: '22:30', title: 'Prime Time Mega Serial & Drama', category: 'Entertainment' },
    { start: '22:30', end: '06:00', title: 'Night Entertainment Specials', category: 'Entertainment' },
  ]
};

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesToTime(mins) {
  const norm = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${ampm}`;
}

export function getChannelSchedule(channel, dayOffset = 0) {
  if (!channel) return [];
  const chId = channel.id || '';
  let rawSchedule = CHANNEL_EPG_SCHEDULES[chId];

  if (!rawSchedule) {
    // Check genre match
    const grp = channel.group || (channel.categories && channel.categories[0]) || 'General';
    rawSchedule = GENRE_TEMPLATES[grp] || GENRE_TEMPLATES.Entertainment;
  }

  // Format slots into user-friendly entries
  return rawSchedule.map((item, idx) => ({
    id: `${chId}_${dayOffset}_${idx}`,
    startTime: item.start,
    endTime: item.end,
    displayStart: formatMinutesToTime(parseTimeToMinutes(item.start)),
    displayEnd: formatMinutesToTime(parseTimeToMinutes(item.end)),
    title: item.title,
    category: item.category || channel.group || 'Live TV',
    description: `${item.title} broadcasting live on ${channel.name}.`
  }));
}

export function getCurrentAndNextProgram(channel) {
  if (!channel) {
    return {
      current: { title: 'Live TV Broadcast', time: 'LIVE', category: 'Live TV', progress: 50 },
      next: { title: 'Upcoming Broadcast', time: 'Next', category: 'Live TV' }
    };
  }

  const schedule = getChannelSchedule(channel, 0);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let currentIndex = 0;
  for (let i = 0; i < schedule.length; i++) {
    const startM = parseTimeToMinutes(schedule[i].startTime);
    let endM = parseTimeToMinutes(schedule[i].endTime);
    if (endM < startM) endM += 1440; // overnight wrap

    let checkM = currentMinutes;
    if (checkM < startM && endM >= 1440) {
      checkM += 1440;
    }

    if (checkM >= startM && checkM < endM) {
      currentIndex = i;
      const duration = endM - startM || 60;
      const progress = Math.min(100, Math.max(0, Math.round(((checkM - startM) / duration) * 100)));
      const curProg = {
        title: schedule[i].title,
        time: `${schedule[i].displayStart} - ${schedule[i].displayEnd}`,
        category: schedule[i].category,
        progress
      };

      const nextItem = schedule[(i + 1) % schedule.length];
      const nextProg = {
        title: nextItem ? nextItem.title : 'Upcoming Programming',
        time: nextItem ? `${nextItem.displayStart} - ${nextItem.displayEnd}` : 'Later',
        category: nextItem ? nextItem.category : 'Live TV'
      };

      return { current: curProg, next: nextProg };
    }
  }

  // Fallback
  return {
    current: {
      title: `${channel.name} Live`,
      time: 'Now Streaming',
      category: channel.group || 'Live TV',
      progress: 45
    },
    next: {
      title: 'Next Program Scheduled',
      time: 'Upcoming',
      category: channel.group || 'Live TV'
    }
  };
}
