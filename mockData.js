export const CATEGORIES = [
  { id: 'all', name: 'ALL' },
  { id: 'hackathon', name: 'HACKATHON' },
  { id: 'quiz', name: 'QUIZ' }
];

export const INITIAL_EVENTS = [
  {
    id: 'event-1788625391659',
    title: 'wef',
    tagline: 'Community event hosted on TechZen',
    category: 'HACKATHON',
    badge: 'LIVE HACKATHON',
    format: 'ONLINE',
    locationType: 'ONLINE',
    location: 'TechZen Platform / Online Stream',
    date: 'June 29 - July 20, 2026',
    time: '18:30 - 21:30 IST',
    capacity: 100,
    rsvpCount: 1,
    registeredCount: 1,
    ended: false,
    coverImage: '/operation-cipher.png',
    imageUrl: '/operation-cipher.png',
    hostName: 'Tanishaq Verma Techzen',
    hostAvatar: 'https://lh3.googleusercontent.com/a/ACg8ocLlnKOcl-oxirLpjfa_8KcUsyX1BFvg47IExOnV6WnCzZOhNg=s96-c',
    hostRole: 'Community Admin',
    description: 'wef',
    tags: ['Hackathon', 'Code', 'Prizes'],
    featured: true,
    agenda: [
      { time: 'Start', title: 'Registration & Coffee', speaker: 'Host' },
      { time: 'Keynote', title: 'wef', speaker: 'Speaker' }
    ]
  },
  {
    id: 'operation-cipher-2026',
    title: 'Operation Cipher 2026',
    tagline: 'A Money Heist Themed National Level Hackathon. Code. Plan. Execute. Escape.',
    category: 'HACKATHON',
    badge: 'LIVE HACKATHON',
    format: 'ONLINE',
    locationType: 'ONLINE',
    location: 'National Level Online • Powered by Unstop',
    date: 'June 29 - July 20, 2026',
    time: 'National Level Hackathon',
    capacity: 500,
    rsvpCount: 480,
    registeredCount: 480,
    ended: true,
    coverImage: '/operation-cipher.png',
    imageUrl: '/operation-cipher.png',
    hostName: 'TechZen Team',
    hostAvatar: '/techzen-logo.png',
    hostRole: 'Hackathon Host',
    description: `THE PLAN. THE CODE. THE ESCAPE.
TechZen Presents: OPERATION CIPHER — A Money Heist Themed National Level Hackathon. Powered by Unstop.

heist_blueprint.sh
cipher@techzen:~$ ./initiate_heist.sh
[*] Connecting to TechZen Indian Hackathon Node...
[OK] SYSTEM SECURED. ROUND 1 DETAILS LOADED:
-> Tracks: Software Track & Hardware Track
-> Team size: 1-4 members (Individual or Team)
-> Location: National Level Online Hackathon

💻 Software Track
Build web/app systems, AI bots, blockchain ledgers, or cloud security tools.

⚙️ Hardware Track
Develop IoT, smart robots, embedded devices, or firmware controllers.

🏆 Prizes & Goodies
Prizes worth Cash + Goodies + Developer Vouchers for top performers.

📜 E-Certificates
Official certified credentials powered by TruScholar for all participants.

THE CODE IS READY. THE PLAN IS SET. ARE YOU IN?`,
    tags: ['Hackathon', 'Money Heist', 'Software Track', 'Hardware Track', 'Unstop'],
    featured: true,
    agenda: [
      { time: 'June 29', title: 'Registration & Cipher Node Access Open', speaker: 'TechZen Node' },
      { time: 'July 1 - July 18', title: '24-Hour Building Phase (Software & Hardware)', speaker: 'Hackers' },
      { time: 'July 20', title: 'Final Blueprint Submission & Jury Evaluation', speaker: 'Jury Panel' }
    ]
  },
  {
    id: 'quizverse-2026',
    title: 'TechZen QuizVerse 2026',
    tagline: 'Think. Answer. Conquer. The ultimate tech trivia and CS fundamentals challenge.',
    category: 'QUIZ',
    badge: 'QUIZ',
    format: 'ONLINE',
    locationType: 'ONLINE',
    location: 'Online • TechZen Platform',
    date: 'May 12, 2026',
    time: '30 Minutes • 30 MCQs',
    capacity: 600,
    rsvpCount: 580,
    registeredCount: 580,
    ended: true,
    coverImage: '/quizverse.png',
    imageUrl: '/quizverse.png',
    hostName: 'TechZen Team',
    hostAvatar: '/techzen-logo.png',
    hostRole: 'Quiz Master',
    description: `TECHZEN PRESENTS: QUIZVERSE 2026
THINK. ANSWER. CONQUER.

⏱️ 30 Minutes Quiz Duration
🧠 30 MCQs on Core CS & Hardware Prototyping
💡 No Negative Marking
👥 Open to All Students
🏆 Exciting Prizes & E-Certificates

Sample Question Preview:
Q: Which of the following is an open-source hardware prototyping platform?
[A] Arduino  [B] Raspberry Pi OS  [C] Intel Core i9  [D] Docker Container
(Correct Answer: Arduino)

ARE YOU READY? JOIN. COMPETE. WIN.`,
    tags: ['Tech Quiz', 'Trivia', 'Computer Science', 'Hardware', 'Prizes'],
    featured: true,
    agenda: [
      { time: '19:00 IST', title: 'Quiz Lobby Opens & Rules Briefing', speaker: 'Quiz Master' },
      { time: '19:10 IST', title: 'Live 30-Minute MCQ Sprint (30 Questions)', speaker: 'Participants' },
      { time: '19:45 IST', title: 'Leaderboard Announcement & Digital E-Certificates', speaker: 'TechZen Team' }
    ]
  }
];

export const INITIAL_REGISTRATIONS = [];
