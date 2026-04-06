import bcrypt from "bcryptjs";

// ── Fallback SVG avatar for non-named roster entries ──────────────────────────
const svgPortrait = (name, index) => {
  const parts = (name || "Global Icon").trim().split(" ");
  const initials = `${parts[0]?.charAt(0) || "G"}${parts[1]?.charAt(0) || "I"}`.toUpperCase();
  const hue = 30 + ((index * 23) % 45);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900' viewBox='0 0 900 900'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='hsl(${hue},58%,62%)'/><stop offset='100%' stop-color='hsl(${hue + 18},48%,35%)'/></linearGradient></defs><rect width='900' height='900' fill='#0b0b0b'/><rect x='54' y='54' width='792' height='792' rx='44' fill='url(#g)' opacity='0.92'/><circle cx='450' cy='360' r='170' fill='rgba(8,8,8,.72)'/><rect x='240' y='560' width='420' height='190' rx='90' fill='rgba(8,8,8,.72)'/><text x='450' y='470' text-anchor='middle' fill='#f4e1a0' font-family='Segoe UI,Arial,sans-serif' font-size='148' font-weight='700' letter-spacing='8'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// ── Named roster: category / agency / region / price locked to real data ──────
const NAMED = [
  // id,  name,                 category,      agency,              region,           portrait (local /assets/portraits/),                                                                                                                                                                                                                         price,    demand, pop, availability, reach,   awards,                  risk
  ["c1",  "Beyoncé",            "Music",        "WME",               "North America",  "/assets/portraits/c1.jpg", 2100000,  98,     99,  "Limited",    260.0,   "Grammy Award",          "low"],
  ["c2",  "Leonardo DiCaprio",  "Film",         "CAA",               "North America",  "/assets/portraits/c2.jpg",                                                                                                   520000,   88,     92,  "Open",       95.0,    "Academy Award",         "low"],
  ["c3",  "Cristiano Ronaldo",  "Sports",       "Gestifute / CAA",   "Europe",         "/assets/portraits/c3.jpg",                                                                                            1200000,  97,     98,  "Limited",    640.0,   "Ballon d'Or",           "low"],
  ["c4",  "Kim Kardashian",     "Influencer",   "WME",               "North America",  "/assets/portraits/c4.jpg",                                                                                                                    480000,   85,     88,  "Open",       364.0,   "Emmy Award",            "medium"],
  ["c5",  "Drake",              "Music",        "CAA",               "North America",  "/assets/portraits/c5.jpg",                                      1050000,  93,     95,  "Waitlist",   145.0,   "Grammy Award",          "low"],
  ["c6",  "Dwayne Johnson",     "Film",         "WME",               "North America",  "/assets/portraits/c6.jpg",                                                                                                  1500000,  96,     97,  "Limited",    389.0,   "People's Choice Award", "low"],
  ["c7",  "Charlize Theron",    "Film",         "CAA",               "Africa",         "/assets/portraits/c7.jpg",                                                                                                                    310000,   78,     84,  "Open",       42.0,    "Academy Award",         "low"],
  ["c8",  "Keanu Reeves",       "Film",         "CAA",               "North America",  "/assets/portraits/c8.jpg",                                                                               290000,   82,     86,  "Open",       38.0,    "MTV Movie Award",       "low"],
  ["c9",  "Elon Musk",          "Business",     "Independent",       "North America",  "/assets/portraits/c9.jpg",                                                                                         2500000,  91,     89,  "Waitlist",   200.0,   "Forbes Innovator",      "high"],
  ["c10", "Salma Hayek",        "Film",         "CAA",               "Latin America",  "/assets/portraits/c10.jpg",                                     250000,   76,     82,  "Open",       26.0,    "Cannes Award",          "low"],
  ["c11", "Zendaya",            "Film",         "CAA",               "North America",  "/assets/portraits/c11.jpg",                                                                                                     420000,   94,     96,  "Limited",    184.0,   "Emmy Award",            "low"],
  ["c12", "Taylor Swift",       "Music",        "UTA",               "North America",  "/assets/portraits/c12.png",                                                      1800000,  99,     99,  "Waitlist",   282.0,   "Grammy Award",          "low"],
  ["c13", "Rihanna",            "Music",        "WME",               "North America",  "/assets/portraits/c13.png",                                                                                                                               1600000,  95,     97,  "Waitlist",   150.0,   "Grammy Award",          "low"],
  ["c14", "Lewis Hamilton",     "Sports",       "IMG",               "Europe",         "/assets/portraits/c14.jpg", 980000, 90,   93,  "Limited",    33.5,    "FIA World Championship","low"],
  ["c15", "Virat Kohli",        "Sports",       "IMG",               "Asia",           "/assets/portraits/c15.jpg",                                                                                                           850000,   92,     94,  "Open",       270.0,   "ICC Player of the Year","low"],
  ["c16", "Margot Robbie",      "Film",         "CAA",               "Australia",  "/assets/portraits/c16.jpg", 450000, 89, 91, "Open", 22.0,  "BAFTA Award",           "low"],
  // ── Newly added real celebrities (c17–c30) ──────────────────────────────────
  ["c17", "Chris Young",        "Music",        "WME",               "North America",  "/assets/portraits/c17.jpg",                                                                                                                                                                              280000,   78,     82,  "Open",       18.5,    "ACM Award",             "low"],
  ["c18", "Tyler Hynes",        "Film",         "Independent",       "North America",  "/assets/portraits/c18.jpg",                                                                                                                             150000,   72,     76,  "Open",       8.5,     "Canadian Screen Award", "low"],
  ["c19", "Joe Bonamassa",      "Music",        "Independent",       "North America",  "/assets/portraits/c19.jpg",                    185000,   80,     83,  "Open",       12.0,    "Billboard Blues #1",    "low"],
  ["c20", "Boz Scaggs",         "Music",        "WME",               "North America",  "/assets/portraits/c20.jpg",                                                                                                              220000,   75,     78,  "Open",       6.5,     "Grammy Award",          "low"],
  ["c21", "Robert Earl Keen",   "Music",        "Independent",       "North America",  "/assets/portraits/c21.jpg",145000,   70,     74,  "Open",       4.2,     "Americana Award",       "low"],
  ["c22", "Zach Bryan",         "Music",        "WME",               "North America",  "/assets/portraits/c22.jpg",                                                             380000,   92,     93,  "Limited",    34.0,    "Grammy Award",          "low"],
  ["c23", "Lainey Wilson",      "Music",        "WME",               "North America",  "/assets/portraits/c23.jpg",                                                                                                                                                                  290000,   88,     90,  "Open",       22.5,    "CMA Award",             "low"],
  ["c24", "Chris Stapleton",    "Music",        "WME",               "North America",  "/assets/portraits/c24.jpg",                                                                                           420000,   90,     91,  "Limited",    8.8,     "Grammy Award",          "low"],
  ["c25", "Sofia Vergara",      "Film",         "WME",               "North America",  "/assets/portraits/c25.jpg",                                                                                                                        350000,   86,     88,  "Open",       34.5,    "SAG Award Nominee",     "low"],
  ["c26", "Emma Watson",        "Film",         "CAA",               "Europe",         "/assets/portraits/c26.jpg",                                                                                                                                                                        310000,   87,     89,  "Open",       72.0,    "BAFTA Rising Star",     "low"],
  ["c27", "Kate Beckinsale",    "Film",         "CAA",               "Europe",         "/assets/portraits/c27.jpg",                                                                                                            280000,   82,     85,  "Open",       19.5,    "Saturn Award",          "low"],
  ["c28", "Jennifer Aniston",   "Film",         "CAA",               "North America",  "/assets/portraits/c28.jpg",                                                                                                                                                    500000,   89,     91,  "Waitlist",   41.5,    "Emmy Award",            "low"],
  ["c29", "Eva Green",          "Film",         "CAA",               "Europe",         "/assets/portraits/c29.jpg",                                                                                                                                                                290000,   84,     87,  "Open",       11.2,    "BAFTA Rising Star",     "low"],
  ["c30", "Morgan Wallen",      "Music",        "WME",               "North America",  "/assets/portraits/c30.png",                                                                                               650000,   93,     94,  "Limited",    22.0,    "ACM Award",             "low"],
];

// ── Elite intelligence + accurate 2026 net worths ────────────────────────────
const NAMED_EXTRA = {
  c1:  { netWorth: "$600M",   brandValue: "$580M",   eliteSignal: "The highest-grossing touring artist alive — Renaissance World Tour alone cleared $580M. Every appearance redefines culture on every continent." },
  c2:  { netWorth: "$300M",   brandValue: "$220M",   eliteSignal: "Oscar laureate whose every project crosses $500M box office. The most trusted name in Hollywood for 30 years straight." },
  c3:  { netWorth: "$1.3B",   brandValue: "$1.1B",   eliteSignal: "World's most commercially valuable athlete — 640M+ followers, zero brand risk, and the highest sponsorship valuation ever recorded." },
  c4:  { netWorth: "$2.1B",   brandValue: "$1.6B",   eliteSignal: "Built a $2.1B empire from cultural relevance alone. SKIMS is now valued at $4B+ — a marketing force with unbeatable mass reach." },
  c5:  { netWorth: "$300M",   brandValue: "$380M",   eliteSignal: "The most-streamed artist in music history. A single event with Drake becomes a self-sustaining global cultural headline for weeks." },
  c6:  { netWorth: "$800M",   brandValue: "$680M",   eliteSignal: "The highest-paid actor on earth — 2025 Forbes #1. Every project he commits to exceeds $1B at the global box office." },
  c7:  { netWorth: "$175M",   brandValue: "$130M",   eliteSignal: "Oscar-winning actress and active UN global humanitarian. The definitive choice for executive-tier brand alignment with substance." },
  c8:  { netWorth: "$380M",   brandValue: "$270M",   eliteSignal: "A cultural icon with zero recorded controversy in 35 years. Trusted unconditionally across 180 countries and all demographics." },
  c9:  { netWorth: "$852B",   brandValue: "$80B",    eliteSignal: "The wealthiest private individual on earth — Tesla, SpaceX, xAI combined. An engagement with Musk becomes a global news event within minutes." },
  c10: { netWorth: "$200M",   brandValue: "$95M",    eliteSignal: "Cannes-celebrated actress, producer, and Kering Group board member. Two decades of multi-billion-dollar luxury brand partnerships." },
  c11: { netWorth: "$60M",    brandValue: "$250M",   eliteSignal: "Highest-earning young actress of her generation. Dune 2 + Challengers + Zendaya Beauty — reshaping culture for 3B+ Gen-Z consumers." },
  c12: { netWorth: "$1.6B",   brandValue: "$1.4B",   eliteSignal: "The first artist to become a billionaire entirely from music. The Eras Tour is the first concert tour to exceed $2B in revenue." },
  c13: { netWorth: "$1.5B",   brandValue: "$1.3B",   eliteSignal: "Built the world's most inclusive beauty empire (Fenty $2.8B). Her Super Bowl halftime show drew 118 million live viewers globally." },
  c14: { netWorth: "$350M",   brandValue: "$240M",   eliteSignal: "7× Formula 1 World Champion — the most decorated racing driver alive — now racing for Ferrari, unlocking crossover fashion authority." },
  c15: { netWorth: "$230M",   brandValue: "$260M",   eliteSignal: "India's most commercially powerful athlete. 270M followers with a $130M+ annual brand endorsement portfolio — unmatched in Asian markets." },
  c16: { netWorth: "$65M",    brandValue: "$180M",   eliteSignal: "Barbie crossed $1.44B globally. As writer, producer and actress, every project she touches becomes the defining cultural moment of its year." },
  c17: { netWorth: "$25M",    brandValue: "$18M",    eliteSignal: "Billboard country chart staple — 'Think of You' and 'Famous' proved his mass-market pull. A genuine crowd favourite across every midsize and festival market." },
  c18: { netWorth: "$5M",     brandValue: "$12M",    eliteSignal: "Hallmark's most sought-after leading man — beloved by a fiercely loyal audience demographic. Every project he attaches to becomes a cultural conversation for weeks." },
  c19: { netWorth: "$40M",    brandValue: "$28M",    eliteSignal: "Eleven Billboard Blues #1 albums. The hardest-working independent act in blues rock — a master class in touring revenue and direct fan monetisation." },
  c20: { netWorth: "$50M",    brandValue: "$22M",    eliteSignal: "Rock and roll institution whose 'Lido Shuffle' and 'Lowdown' remain radio staples 50 years on. Unimpeachable legacy brand with multigenerational reach." },
  c21: { netWorth: "$15M",    brandValue: "$10M",    eliteSignal: "Americana's founding architect — decades of sold-out Texas tours and a songbook that shaped the entire genre. Cult following with premium spending power." },
  c22: { netWorth: "$30M",    brandValue: "$65M",    eliteSignal: "'I Remember Everything' topped every chart simultaneously. The fastest-growing act in country music — Eras-level stadium demand at a fraction of the fee." },
  c23: { netWorth: "$20M",    brandValue: "$35M",    eliteSignal: "CMA & ACM Female Vocalist of the Year. Her bell-bottomed brand is a masterclass in authenticity — the most commercially ascendant woman in country music." },
  c24: { netWorth: "$45M",    brandValue: "$58M",    eliteSignal: "Seven-time Grammy winner. The most credible voice in American music — his 'Tennessee Whiskey' is a cultural meridian. A once-in-a-generation engagement." },
  c25: { netWorth: "$180M",   brandValue: "$120M",   eliteSignal: "Modern Family's 11-year global icon, cosmetics mogul, and the most powerful Latina entertainer in Hollywood history. Commanding Spanish-language market access." },
  c26: { netWorth: "$85M",    brandValue: "$140M",   eliteSignal: "Hermione Granger to 1.4B Harry Potter fans worldwide. UN Women Goodwill Ambassador — the ultimate dual-market asset bridging entertainment and advocacy." },
  c27: { netWorth: "$60M",    brandValue: "$45M",    eliteSignal: "Underworld and Pearl Harbor icon with a devoted global fanbase. Consistent red-carpet presence and a luxury fashion alignment rated among the industry's cleanest risk profiles." },
  c28: { netWorth: "$320M",   brandValue: "$180M",   eliteSignal: "The most beloved actress in America for 25 years — People's World's Most Beautiful, Friends hall-of-famer. Any appearance guarantees A-list media saturation within minutes." },
  c29: { netWorth: "$30M",    brandValue: "$52M",    eliteSignal: "Casino Royale's Vesper Lynd — the definitive Bond girl. Tim Burton's muse and arthouse cinema's most internationally bankable European actress." },
  c30: { netWorth: "$40M",    brandValue: "$90M",    eliteSignal: "The best-selling country album of 2023 with 'One Thing at a Time'. Dangerfield-style market resilience — every controversy only amplifies his commercial dominance." },
};

// ── Crowd Events: shared group access to upcoming celebrity appearances ───────
export const CROWD_EVENTS = [
  {
    id: "ce1",  celebId: "c1",  name: "Beyoncé",
    eventTitle:  "Renaissance Act III – VIP After-Party Circle",
    eventType:   "Concert After-Party",  city: "Los Angeles, CA",
    date: "2026-05-14",  slots: 40,  claimed: 27,
    pricePerSlot: 4800,
    includes: ["30-min shared backstage access", "Professional photo with artist", "Signed memorabilia", "NDA-protected", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 1600 }, { label: "6-Pay Plan", months: 6, monthly: 800 }],
  },
  {
    id: "ce2",  celebId: "c12", name: "Taylor Swift",
    eventTitle:  "Eras Tour Finale – Exclusive Meet & Greet Ring",
    eventType:   "World Tour Meet & Greet",  city: "London, UK",
    date: "2026-04-27",  slots: 35,  claimed: 24,
    pricePerSlot: 5200,
    includes: ["45-min intimate group session", "Personalised signed item", "Private photography allowed", "Greenroom access", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 1734 }, { label: "6-Pay Plan", months: 6, monthly: 867 }],
  },
  {
    id: "ce3",  celebId: "c3",  name: "Cristiano Ronaldo",
    eventTitle:  "Al-Nassr Match Day – Pitch-Side VIP Lounge",
    eventType:   "Live Sports VIP Access",  city: "Riyadh, Saudi Arabia",
    date: "2026-03-21",  slots: 30,  claimed: 11,
    pricePerSlot: 3200,
    includes: ["Pitch-side pre-match access", "10-min group photo session", "Signed jersey", "Executive lounge dining", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 1067 }, { label: "6-Pay Plan", months: 6, monthly: 534 }],
  },
  {
    id: "ce4",  celebId: "c9",  name: "Elon Musk",
    eventTitle:  "xAI Innovation Summit – Executive Q&A Circle",
    eventType:   "Technology Summit",  city: "Austin, TX",
    date: "2026-06-05",  slots: 20,  claimed: 14,
    pricePerSlot: 8500,
    includes: ["Private 60-min Q&A with Musk", "Front-row seated access", "Branded executive welcome pack", "Direct network introduction", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 2834 }, { label: "6-Pay Plan", months: 6, monthly: 1417 }],
  },
  {
    id: "ce5",  celebId: "c5",  name: "Drake",
    eventTitle:  "OVO Fest Backstage – Private Artist Circle",
    eventType:   "Music Festival Backstage",  city: "Toronto, Canada",
    date: "2026-04-18",  slots: 35,  claimed: 19,
    pricePerSlot: 3800,
    includes: ["Backstage pre-show access", "Group meet & greet (20 min)", "OVO exclusive merchandise", "Professional group photo", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 1267 }, { label: "6-Pay Plan", months: 6, monthly: 634 }],
  },
  {
    id: "ce6",  celebId: "c13", name: "Rihanna",
    eventTitle:  "Fenty x Savage – Runway Access & Brand Circle",
    eventType:   "Fashion Show VIP",  city: "New York, NY",
    date: "2026-05-02",  slots: 40,  claimed: 28,
    pricePerSlot: 2800,
    includes: ["Front-row Savage x Fenty show seating", "Post-show meet & greet (15 min)", "Goodie bag ($800 value)", "Group photo", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 934 }, { label: "6-Pay Plan", months: 6, monthly: 467 }],
  },
  {
    id: "ce7",  celebId: "c6",  name: "Dwayne Johnson",
    eventTitle:  "Rock Foundation Charity Gala – VIP Table Circle",
    eventType:   "Charity Gala Access",  city: "Las Vegas, NV",
    date: "2026-04-10",  slots: 50,  claimed: 31,
    pricePerSlot: 2200,
    includes: ["Gala dinner seating", "Stage-side meet & greet", "Signed memorabilia", "Photo opportunity", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 734 }, { label: "6-Pay Plan", months: 6, monthly: 367 }],
  },
  {
    id: "ce8",  celebId: "c14", name: "Lewis Hamilton",
    eventTitle:  "F1 Miami Grand Prix – Ferrari Paddock Access",
    eventType:   "Formula 1 Paddock Access",  city: "Miami, FL",
    date: "2026-05-10",  slots: 18,  claimed: 7,
    pricePerSlot: 4500,
    includes: ["Ferrari paddock walkthrough", "Exclusive grid access pre-race", "15-min group Q&A with Hamilton", "Signed racing gloves", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 1500 }, { label: "6-Pay Plan", months: 6, monthly: 750 }],
  },
  {
    id: "ce9",  celebId: "c15", name: "Virat Kohli",
    eventTitle:  "IPL Finals – Box Suite & Meet-and-Greet Circle",
    eventType:   "Cricket VIP Box Experience",  city: "Mumbai, India",
    date: "2026-05-26",  slots: 60,  claimed: 39,
    pricePerSlot: 1800,
    includes: ["Premium box suite seating", "Post-match locker room access", "Signed bat or jersey", "Group photo session", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 600 }, { label: "6-Pay Plan", months: 6, monthly: 300 }],
  },
  {
    id: "ce10", celebId: "c11", name: "Zendaya",
    eventTitle:  "Dune: Messiah Premiere – Exclusive Red Carpet Circle",
    eventType:   "Film Premiere Access",  city: "Hollywood, CA",
    date: "2026-06-19",  slots: 25,  claimed: 10,
    pricePerSlot: 3400,
    includes: ["Red carpet standing access", "Post-premiere reception", "10-min group photo session", "Signed Dune memorabilia", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 1134 }, { label: "6-Pay Plan", months: 6, monthly: 567 }],
  },
  {
    id: "ce11", celebId: "c4",  name: "Kim Kardashian",
    eventTitle:  "SKIMS Studio Day – Brand Experience Circle",
    eventType:   "Brand Studio Access",  city: "Beverly Hills, CA",
    date: "2026-03-28",  slots: 30,  claimed: 17,
    pricePerSlot: 1900,
    includes: ["SKIMS HQ studio tour", "Sit-down brand Q&A", "Exclusive product preview", "Group photo + signed item", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 634 }, { label: "6-Pay Plan", months: 6, monthly: 317 }],
  },
  {
    id: "ce12", celebId: "c16", name: "Margot Robbie",
    eventTitle:  "LuckyChap Productions – Film Screening Circle",
    eventType:   "Private Screening & Q&A",  city: "London, UK",
    date: "2026-07-04",  slots: 22,  claimed: 6,
    pricePerSlot: 2600,
    includes: ["Private screening of upcoming production", "Post-film Q&A with Margot", "Signed production items", "Drinks reception", "Escrow-secured"],
    installments: [{ label: "3-Pay Plan", months: 3, monthly: 867 }, { label: "6-Pay Plan", months: 6, monthly: 434 }],
  },
];

const namedCelebrities = NAMED.map(([id, name, category, agency, region, portrait, price, demand, pop, avail, reach, awards, risk], i) => ({
  id,
  name,
  verified: true,
  category,
  region,
  portrait,
  startingPrice: price,
  demandIndex: demand,
  popularityScore: pop,
  availability: avail,
  availabilityWindowDays: 14 + (i % 20),
  socialReachMillions: reach,
  agencyRepresentation: agency,
  awards,
  riskIndex: risk,
  ndaDefault: true,
  securityTiers: ["Standard", "Enhanced", "Executive", "Sovereign"],
  ...(NAMED_EXTRA[id] || { netWorth: "Confidential", brandValue: "Confidential", eliteSignal: "Verified elite talent with confirmed representation and exclusive availability windows." }),
}));

// ── Extended roster portraits — self-hosted local portraits (c31–c100) ──
const EXT_PORTRAITS = [
  '/assets/portraits/c31.jpg',          // c31 Idris Elba
  '/assets/portraits/c32.jpg', // c32 Viola Davis
  '/assets/portraits/c33.jpg',                                                      // c33 Michael B. Jordan
  '/assets/portraits/c34.jpg',                                   // c34 Lupita Nyong'o
  '/assets/portraits/c35.jpg',                                                                      // c35 Priyanka Chopra
  '/assets/portraits/c36.jpg',      // c36 Shah Rukh Khan
  '/assets/portraits/c37.png',                                                 // c37 Deepika Padukone
  '/assets/portraits/c38.jpg',        // c38 Lionel Messi
  '/assets/portraits/c39.jpg',                 // c39 LeBron James
  '/assets/portraits/c40.jpg', // c40 Serena Williams
  '/assets/portraits/c41.png',                        // c41 Naomi Osaka
  '/assets/portraits/c42.jpg',                                            // c42 Simone Biles
  '/assets/portraits/c43.jpg', // c43 Shakira
  '/assets/portraits/c44.jpg',                 // c44 Bad Bunny
  '/assets/portraits/c45.jpg', // c45 Jennifer Lopez
  '/assets/portraits/c46.jpg', // c46 Maluma
  '/assets/portraits/c47.jpg',                                                                        // c47 Michelle Yeoh
  '/assets/portraits/c48.jpg',                      // c48 Jason Momoa
  '/assets/portraits/c49.jpg',                                                   // c49 Dua Lipa
  '/assets/portraits/c50.jpg',                                                 // c50 Ed Sheeran
  '/assets/portraits/c51.jpg',                         // c51 Ariana Grande
  '/assets/portraits/c52.jpg',     // c52 Billie Eilish
  '/assets/portraits/c53.jpg', // c53 Harry Styles
  '/assets/portraits/c54.jpg',                                                                                        // c54 Adele
  '/assets/portraits/c55.jpg',                    // c55 Bruno Mars
  '/assets/portraits/c56.jpg',                                         // c56 The Weeknd
  '/assets/portraits/c57.png',                                                                        // c57 Cardi B
  '/assets/portraits/c58.jpg',                                       // c58 Nicki Minaj
  '/assets/portraits/c59.jpg', // c59 Will Smith
  '/assets/portraits/c60.jpg',        // c60 Denzel Washington
  '/assets/portraits/c61.jpg', // c61 Angela Bassett
  '/assets/portraits/c62.jpg',                    // c62 Kerry Washington
  '/assets/portraits/c63.jpg',             // c63 Pedro Pascal
  '/assets/portraits/c64.jpg',                // c64 Ana de Armas
  '/assets/portraits/c65.jpg',             // c65 Penélope Cruz
  '/assets/portraits/c66.jpg',                                                      // c66 Chris Hemsworth
  '/assets/portraits/c67.jpg', // c67 Ryan Reynolds
  '/assets/portraits/c68.jpg',                                          // c68 Nicole Kidman
  '/assets/portraits/c69.jpg',                                             // c69 Hugh Jackman
  '/assets/portraits/c70.jpg',                                   // c70 Cate Blanchett
  '/assets/portraits/c71.jpg',                       // c71 Mindy Kaling
  '/assets/portraits/c72.jpg',                                    // c72 Olivia Rodrigo
  '/assets/portraits/c73.jpg',                                       // c73 Doja Cat
  '/assets/portraits/c74.jpg',           // c74 Tyler, the Creator
  '/assets/portraits/c75.jpg',                                  // c75 J Balvin
  '/assets/portraits/c76.png',                                                            // c76 Camila Cabello
  '/assets/portraits/c77.jpg', // c77 Rosalía
  '/assets/portraits/c78.jpg',                                                                                       // c78 Jackie Chan
  '/assets/portraits/c79.jpg',                  // c79 Mahershala Ali
  '/assets/portraits/c80.jpg', // c80 Taraji P. Henson
  '/assets/portraits/c81.jpg',                                                 // c81 Vin Diesel
  '/assets/portraits/c82.jpg',    // c82 Tom Holland
  '/assets/portraits/c83.jpg', // c83 Burna Boy
  '/assets/portraits/c84.png',                                                               // c84 Wizkid
  '/assets/portraits/c85.jpg',             // c85 Elton John
  '/assets/portraits/c86.jpg', // c86 Paul McCartney
  '/assets/portraits/c87.jpg',                                            // c87 Roger Federer
  '/assets/portraits/c88.jpg',                                        // c88 Rafael Nadal
  '/assets/portraits/c89.jpg',           // c89 Trevor Noah
  '/assets/portraits/c90.jpg',                                        // c90 Novak Djokovic
  '/assets/portraits/c91.jpg',                                      // c91 Post Malone
  '/assets/portraits/c92.jpg', // c92 SZA
  '/assets/portraits/c93.jpg',                                              // c93 Megan Thee Stallion
  '/assets/portraits/c94.jpg',                                              // c94 Kevin Hart
  '/assets/portraits/c95.jpg',                                                  // c95 Amitabh Bachchan
  '/assets/portraits/c96.jpg',                                                                                   // c96 Ranveer Singh
  '/assets/portraits/c97.jpg',                              // c97 Alia Bhatt
  '/assets/portraits/c98.jpg',                                                               // c98 Zayn Malik
  '/assets/portraits/c99.jpg',                                              // c99 Eddie Murphy
  '/assets/portraits/c100.jpg',                    // c100 Whoopi Goldberg
];

// ── Per-celebrity accurate metadata for c31–c100 (index 0–69) ────────────────
// Each array maps exactly to the extNames order — NO modulo cycling
const extNames = [
  "Idris Elba","Viola Davis","Michael B. Jordan","Lupita Nyong'o",
  "Priyanka Chopra","Shah Rukh Khan","Deepika Padukone","Lionel Messi","LeBron James","Serena Williams",
  "Naomi Osaka","Simone Biles","Shakira","Bad Bunny","Jennifer Lopez","Maluma",
  "Michelle Yeoh","Jason Momoa","Dua Lipa","Ed Sheeran","Ariana Grande","Billie Eilish",
  "Harry Styles","Adele","Bruno Mars","The Weeknd","Cardi B","Nicki Minaj",
  "Will Smith","Denzel Washington","Angela Bassett","Kerry Washington","Pedro Pascal","Ana de Armas",
  "Penélope Cruz","Chris Hemsworth","Ryan Reynolds","Nicole Kidman","Hugh Jackman","Cate Blanchett",
  "Mindy Kaling","Olivia Rodrigo","Doja Cat","Tyler, the Creator","J Balvin","Camila Cabello",
  "Rosalía","Jackie Chan","Mahershala Ali","Taraji P. Henson","Vin Diesel","Tom Holland",
  "Burna Boy","Wizkid","Elton John","Paul McCartney","Roger Federer","Rafael Nadal",
  "Trevor Noah","Novak Djokovic","Post Malone","SZA","Megan Thee Stallion","Kevin Hart",
  "Amitabh Bachchan","Ranveer Singh","Alia Bhatt","Zayn Malik","Eddie Murphy","Whoopi Goldberg",
];
const extCategoryMap = [
  // c31–c37
  "Film","Film","Film","Film","Film","Film","Film",
  // c38–c42 (sports)
  "Sports","Sports","Sports","Sports","Sports",
  // c43–c46 (Latin music)
  "Music","Music","Music","Music",
  // c47–c48 (Film)
  "Film","Film",
  // c49–c58 (Music)
  "Music","Music","Music","Music","Music","Music","Music","Music","Music","Music",
  // c59–c62 (Film)
  "Film","Film","Film","Film",
  // c63–c70 (Film)
  "Film","Film","Film","Film","Film","Film","Film","Film",
  // c71 (Film), c72–c77 (Music)
  "Film","Music","Music","Music","Music","Music","Music",
  // c78 (Film), c79–c82 (Film)
  "Film","Film","Film","Film","Film",
  // c83–c86 (Music)
  "Music","Music","Music","Music",
  // c87–c90 (Sports)
  "Sports","Sports","Film","Sports",
  // c91–c93 (Music)
  "Music","Music","Music",
  // c94 (Film), c95–c97 (Film), c98 (Music), c99–c100 (Film)
  "Film","Film","Film","Film","Music","Film","Film",
];
const extRegionMap = [
  // c31 Idris Elba-Europe, c32 Viola Davis-N.America, c33 Michael B.Jordan-N.America, c34 Lupita-Africa
  "Europe","North America","North America","Africa",
  // c35 Priyanka-Asia, c36 SRK-Asia, c37 Deepika-Asia, c38 Messi-Latin America
  "Asia","Asia","Asia","Latin America",
  // c39 LeBron-N.America, c40 Serena-N.America, c41 Osaka-Asia, c42 Biles-N.America
  "North America","North America","Asia","North America",
  // c43 Shakira-Latin America, c44 Bad Bunny-Latin America, c45 JLo-North America, c46 Maluma-Latin America
  "Latin America","Latin America","North America","Latin America",
  // c47 Michelle Yeoh-Asia, c48 Jason Momoa-North America
  "Asia","North America",
  // c49 Dua Lipa-Europe, c50 Ed Sheeran-Europe, c51 Ariana Grande-N.America, c52 Billie Eilish-N.America
  "Europe","Europe","North America","North America",
  // c53 Harry Styles-Europe, c54 Adele-Europe, c55 Bruno Mars-N.America, c56 The Weeknd-N.America
  "Europe","Europe","North America","North America",
  // c57 Cardi B-N.America, c58 Nicki Minaj-N.America, c59 Will Smith-N.America, c60 Denzel-N.America
  "North America","North America","North America","North America",
  // c61 Angela Bassett-N.America, c62 Kerry Washington-N.America
  "North America","North America",
  // c63 Pedro Pascal-Latin America, c64 Ana de Armas-Latin America, c65 Penélope Cruz-Europe
  "Latin America","Latin America","Europe",
  // c66 Chris Hemsworth-Australia, c67 Ryan Reynolds-N.America, c68 Nicole Kidman-Australia, c69 Hugh Jackman-Australia, c70 Cate Blanchett-Australia
  "Australia","North America","Australia","Australia","Australia",
  // c71 Mindy Kaling-N.America, c72 Olivia Rodrigo-N.America, c73 Doja Cat-N.America, c74 Tyler the Creator-N.America
  "North America","North America","North America","North America",
  // c75 J Balvin-Latin America, c76 Camila Cabello-N.America, c77 Rosalía-Europe
  "Latin America","North America","Europe",
  // c78 Jackie Chan-Asia, c79 Mahershala Ali-N.America, c80 Taraji-N.America, c81 Vin Diesel-N.America, c82 Tom Holland-Europe
  "Asia","North America","North America","North America","Europe",
  // c83 Burna Boy-Africa, c84 Wizkid-Africa, c85 Elton John-Europe, c86 Paul McCartney-Europe
  "Africa","Africa","Europe","Europe",
  // c87 Federer-Europe, c88 Nadal-Europe, c89 Trevor Noah-Africa, c90 Djokovic-Europe
  "Europe","Europe","Africa","Europe",
  // c91 Post Malone-N.America, c92 SZA-N.America, c93 Megan Thee Stallion-N.America, c94 Kevin Hart-N.America
  "North America","North America","North America","North America",
  // c95 Amitabh-Asia, c96 Ranveer-Asia, c97 Alia-Asia, c98 Zayn-Europe, c99 Eddie Murphy-N.America, c100 Whoopi-N.America
  "Asia","Asia","Asia","Europe","North America","North America",
];
const extAgencyMap = [
  // c31–c34
  "WME","WME","WME","CAA",
  // c35–c38
  "WME","Independent","Independent","IMG",
  // c39–c42
  "CAA","WME","IMG","WME",
  // c43–c46
  "WME","CAA","WME","Independent",
  // c47–c48
  "CAA","WME",
  // c49–c58
  "WME","CAA","CAA","CAA","CAA","CAA","WME","WME","WME","WME",
  // c59–c62
  "CAA","CAA","WME","CAA",
  // c63–c70
  "CAA","CAA","CAA","CAA","WME","CAA","CAA","CAA",
  // c71–c77
  "CAA","CAA","UTA","Independent","Independent","CAA","Independent",
  // c78–c82
  "CAA","WME","CAA","CAA","CAA",
  // c83–c86
  "CAA","CAA","WME","Independent",
  // c87–c90
  "IMG","IMG","WME","IMG",
  // c91–c94
  "CAA","UTA","WME","CAA",
  // c95–c100
  "Independent","Independent","Independent","Independent","WME","WME",
];
const extAwardsMap = [
  // c31–c34
  "Golden Globe Nominee","Academy Award","NAACP Award","Academy Award",
  // c35–c38
  "Padma Shri","Padma Shri","National Film Award","Ballon d'Or",
  // c39–c42
  "NBA Championship","Grand Slam Champion","Grand Slam Champion","Olympic Gold Medal",
  // c43–c46
  "Grammy Award","Latin Grammy Award","Grammy Nominee","Latin Grammy Award",
  // c47–c48
  "Academy Award","People's Choice Award",
  // c49–c58
  "Grammy Award","Grammy Award","Grammy Award","Grammy Award","Grammy Award","Grammy Award","Grammy Award","Grammy Award","Grammy Award","Grammy Award",
  // c59–c62
  "Academy Award","Academy Award","Golden Globe Award","Emmy Nominee",
  // c63–c70
  "Emmy Nominee","Oscar Nominee","Academy Award","People's Choice Award","Emmy Award","Academy Award","Tony Award","Academy Award",
  // c71–c77
  "Tony Award","Grammy Award","Grammy Award","Grammy Award","Latin Grammy Award","Grammy Nominee","Grammy Award",
  // c78–c82
  "Honorary Oscar","Academy Award","Golden Globe Award","MTV Generation Award","BAFTA Award",
  // c83–c86
  "Grammy Award","Grammy Award","EGOT Winner","Grammy Award",
  // c87–c90
  "Wimbledon Champion","Grand Slam Champion","Emmy Award","Grand Slam Champion",
  // c91–c94
  "Grammy Nominee","Grammy Award","Grammy Award","Mark Twain Prize",
  // c95–c100
  "National Film Award","Filmfare Award","National Film Award","Grammy Nominee","Mark Twain Prize","EGOT Winner",
];

const extSignals = [
  "A verified elite talent whose global presence commands instant credibility and premium brand alignment.",
  "Award-recognized with multi-continent reach and a verified track record of high-value engagements.",
  "Industry-decorated with exclusive representation and a demand profile that makes every event unmissable.",
  "A globally ranked talent with confirmed NDA-protected booking access and sovereign-tier availability.",
  "Culturally embedded across key markets — their endorsement history reads as a blueprint for brand elevation.",
];
const makeExtCelebrity = (i) => {
  const idx  = i; // i runs 0..69 mapped to c31–c100
  const name = extNames[idx] || `Global Icon ${idx + 31}`;
  const worth = (25 + ((idx * 13) % 475));
  const bval  = (10 + ((idx * 9)  % 220));
  return {
    id: `c${idx + 31}`,
    name,
    verified: true,
    category: extCategoryMap[idx],
    region:   extRegionMap[idx],
    portrait: EXT_PORTRAITS[idx] || svgPortrait(name, idx + 31),
    startingPrice: 120000 + ((idx * 15000) % 1200000),
    demandIndex:   55 + ((idx * 7) % 45),
    popularityScore: 60 + ((idx * 5) % 40),
    availability:  ["Open", "Limited", "Waitlist"][idx % 3],
    availabilityWindowDays: 7 + (idx % 30),
    socialReachMillions: Number((15 + ((idx * 4.4) % 280)).toFixed(1)),
    agencyRepresentation: extAgencyMap[idx],
    awards: extAwardsMap[idx],
    riskIndex: ["low", "medium", "high"][idx % 3],
    ndaDefault: idx % 2 === 0,
    securityTiers: ["Standard", "Enhanced", "Executive", "Sovereign"],
    netWorth:   `$${worth}M`,
    brandValue: `$${bval}M`,
    eliteSignal: extSignals[idx % extSignals.length],
  };
};

// ── Phase 10: New celebrity additions (c101–c119) ────────────────────────────
const NEW_CELEBRITIES = [
  {
    id:"c101", name:"Matt Rife", verified:true, category:"Comedy", region:"North America",
    portrait: "/assets/portraits/c101.jpg",
    startingPrice:85000, demandIndex:88, popularityScore:87, availability:"Open",
    availabilityWindowDays:14, socialReachMillions:42.0, agencyRepresentation:"CAA",
    awards:"Netflix Special — Natural Selection (2023)", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$50M", brandValue:"$30M",
    eliteSignal:"Forbes Top Creators 2025 — ranked #7 with ~$50M earnings. TikTok viral comedian turned arena headliner with back-to-back Netflix specials. Signed with CAA."
  },
  {
    id:"c102", name:"Steven Tyler", verified:true, category:"Music", region:"North America",
    portrait: "/assets/portraits/c102.jpg",
    startingPrice:380000, demandIndex:86, popularityScore:89, availability:"Limited",
    availabilityWindowDays:21, socialReachMillions:18.5, agencyRepresentation:"WME",
    awards:"Rock and Roll Hall of Fame (2001), Grammy Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$130M", brandValue:"$95M",
    eliteSignal:"Aerosmith's iconic frontman — one of rock's most recognisable voices. Rock & Roll Hall of Fame inductee with 150M+ album sales globally. A guaranteed sold-out engagement."
  },
  {
    id:"c103", name:"Joe Perry", verified:true, category:"Music", region:"North America",
    portrait: "/assets/portraits/c103.jpg",
    startingPrice:290000, demandIndex:82, popularityScore:86, availability:"Open",
    availabilityWindowDays:21, socialReachMillions:12.0, agencyRepresentation:"WME",
    awards:"Rock and Roll Hall of Fame (2001), Grammy Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$100M", brandValue:"$70M",
    eliteSignal:"Aerosmith founding guitarist and co-songwriter behind 'Dream On', 'Walk This Way', and 'Sweet Emotion'. Rock & Roll Hall of Fame inductee — the gold standard of American hard rock."
  },
  {
    id:"c104", name:"RM (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c104.jpg",
    startingPrice:620000, demandIndex:93, popularityScore:95, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:48.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, American Music Award, GRAMMY Nomination", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$20M", brandValue:"$85M",
    eliteSignal:"BTS leader and art curator — bridging K-pop and global fine art. Solo albums debuted on Billboard 200. Art exhibitions at SFMOMA and LACMA. A generational cultural ambassador."
  },
  {
    id:"c105", name:"Jin (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c105.png",
    startingPrice:580000, demandIndex:91, popularityScore:93, availability:"Open",
    availabilityWindowDays:30, socialReachMillions:44.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, MTV EMA", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$18M", brandValue:"$72M",
    eliteSignal:"BTS vocalist and UN Youth Delegate. Solo debut 'The Astronaut' produced with Coldplay. One of the most universally beloved voices in global pop — military discharge completed 2025."
  },
  {
    id:"c106", name:"Suga (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c106.jpg",
    startingPrice:600000, demandIndex:92, popularityScore:94, availability:"Open",
    availabilityWindowDays:30, socialReachMillions:46.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, Grammy Nomination", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$20M", brandValue:"$78M",
    eliteSignal:"BTS rapper and producer under alias Agust D — Billboard 200 #2 with debut solo album. HYBE's most prolific songwriter. An unparalleled creative force in Korean hip-hop and production."
  },
  {
    id:"c107", name:"J-Hope (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c107.png",
    startingPrice:590000, demandIndex:91, popularityScore:93, availability:"Open",
    availabilityWindowDays:30, socialReachMillions:44.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, Grand Bell Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$26M", brandValue:"$80M",
    eliteSignal:"BTS main dancer and rapper — first BTS member to headline Lollapalooza 2022. Louis Vuitton House Ambassador. 'Jack in the Box' debuted at #17 Billboard 200 — a cultural trendsetter."
  },
  {
    id:"c108", name:"Jimin (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c108.jpg",
    startingPrice:620000, demandIndex:94, popularityScore:96, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:50.0, agencyRepresentation:"HYBE",
    awards:"Billboard Hot 100 #1, Music Bank Trophy, Grammy Nomination", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$22M", brandValue:"$88M",
    eliteSignal:"First Korean soloist to hit #1 on Billboard Hot 100 (Like Crazy). Solo album 'FACE' peaked at #2 Billboard 200. Dior House Ambassador. Universally regarded as BTS's most iconic performer."
  },
  {
    id:"c109", name:"V (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c109.jpg",
    startingPrice:620000, demandIndex:93, popularityScore:95, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:52.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, CELINE Global Ambassador", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$18M", brandValue:"$90M",
    eliteSignal:"Kim Taehyung — BTS vocalist and the most-followed Korean celebrity on Instagram (60M+). CELINE House Ambassador. His debut solo album 'Layover' topped charts in 102 countries."
  },
  {
    id:"c110", name:"Jungkook (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c110.png",
    startingPrice:650000, demandIndex:95, popularityScore:97, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:55.0, agencyRepresentation:"HYBE",
    awards:"Billboard Hot 100, Seven hit #1 in 100+ countries, Calvin Klein Global Ambassador", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$20M", brandValue:"$95M",
    eliteSignal:"BTS Golden Maknae — solo debut 'Golden' produced global smash 'Seven' (#1 in 100+ countries). Calvin Klein and CELINE ambassador. The #1 most-streamed Korean solo artist on Spotify worldwide."
  },
  {
    id:"c111", name:"Mia Khalifa", verified:true, category:"Influencer", region:"North America",
    portrait: "/assets/portraits/c111.png",
    startingPrice:95000, demandIndex:84, popularityScore:86, availability:"Open",
    availabilityWindowDays:14, socialReachMillions:28.0, agencyRepresentation:"Independent",
    awards:"Viral Media Personality, Aries Fashion Campaign", riskIndex:"medium",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$5M", brandValue:"$22M",
    eliteSignal:"Lebanese-American media personality with 28M+ cross-platform followers. Fashion campaign muse for Aries (London). Sports commentator for Complex. Philanthropy: $800K raised for Beirut relief."
  },
  {
    id:"c112", name:"Lana Rhoades", verified:true, category:"Influencer", region:"North America",
    portrait: "/assets/portraits/c112.jpg",
    startingPrice:75000, demandIndex:80, popularityScore:82, availability:"Open",
    availabilityWindowDays:14, socialReachMillions:20.0, agencyRepresentation:"Independent",
    awards:"iHeartRadio Podcast Award Nominee", riskIndex:"medium",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$3M", brandValue:"$14M",
    eliteSignal:"Multi-platform content creator and co-host of '3 Girls 1 Kitchen' podcast — top-100 US chart. 16M+ Instagram followers. Transitioned to lifestyle, parenting, and brand content creator."
  },
  {
    id:"c113", name:"Riley Reid", verified:true, category:"Influencer", region:"North America",
    portrait: "/assets/portraits/c113.jpg",
    startingPrice:80000, demandIndex:81, popularityScore:83, availability:"Open",
    availabilityWindowDays:14, socialReachMillions:18.0, agencyRepresentation:"Independent",
    awards:"AVN Award, XBIZ Award, FrontPage Media Personality", riskIndex:"medium",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$4M", brandValue:"$12M",
    eliteSignal:"Award-winning content creator and media personality with one of the most engaged digital fanbases in creator economy. Active across OnlyFans, Twitch, and branded content channels."
  },
  {
    id:"c114", name:"Lisa (BLACKPINK)", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c114.jpg",
    startingPrice:750000, demandIndex:96, popularityScore:97, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:110.0, agencyRepresentation:"LLOUD / RCA",
    awards:"MTV VMA Best K-pop (2022, 2024, 2025), Guinness World Records", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$20M", brandValue:"$180M",
    eliteSignal:"BLACKPINK's global icon — most-followed K-pop artist on Instagram (110M+). Solo 'Rockstar' debuted top-5 Billboard Global 200. Stars in HBO's The White Lotus S3. Bulgari and Celine ambassador."
  },
  {
    id:"c115", name:"Jennie Kim", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c115.jpg",
    startingPrice:680000, demandIndex:94, popularityScore:95, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:80.0, agencyRepresentation:"OA Entertainment",
    awards:"MTV VMA Best K-pop, Chanel House Ambassador", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$15M", brandValue:"$160M",
    eliteSignal:"The 'Human Chanel' — Jennie Kim's debut solo 'SOLO' broke all K-pop records. Chanel, adidas, Calvin Klein ambassador. Starred in The Idol (HBO) — a fashion-forward cultural force."
  },
  {
    id:"c116", name:"IU (Lee Ji-eun)", verified:true, category:"Music", region:"Asia",
    portrait: "/assets/portraits/c116.png",
    startingPrice:520000, demandIndex:91, popularityScore:93, availability:"Limited",
    availabilityWindowDays:21, socialReachMillions:35.0, agencyRepresentation:"EDAM Entertainment",
    awards:"Melon Music Award, Golden Disc Award, Daesang (Grand Prize × 8)", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$35M", brandValue:"$95M",
    eliteSignal:"South Korea's best-selling female artist and most trusted actress. 'Celebrity' and 'Lilac' charted on Billboard Global 200. LG and Gucci ambassador. 8× Daesang award winner — irreplaceable in Korean entertainment."
  },
  {
    id:"c117", name:"Park Seo-joon", verified:true, category:"Film", region:"Asia",
    portrait: "/assets/portraits/c117.jpg",
    startingPrice:350000, demandIndex:87, popularityScore:89, availability:"Open",
    availabilityWindowDays:21, socialReachMillions:22.0, agencyRepresentation:"Awesome ENT",
    awards:"Baeksang Arts Award Nominee, Asia Artist Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$12M", brandValue:"$40M",
    eliteSignal:"Marvel Cinematic Universe debut in The Marvels (2023). K-drama icon ('Itaewon Class', 'She Was Pretty') with a Pan-Asian fanbase of 20M+. The gateway name for Western studio K-drama crossover."
  },
  {
    id:"c118", name:"Lee Min-ho", verified:true, category:"Film", region:"Asia",
    portrait: "/assets/portraits/c118.png",
    startingPrice:480000, demandIndex:90, popularityScore:92, availability:"Limited",
    availabilityWindowDays:21, socialReachMillions:32.0, agencyRepresentation:"MYM Entertainment",
    awards:"Korea Drama Awards Best Actor, KBS Drama Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$22M", brandValue:"$75M",
    eliteSignal:"The most recognised Korean actor globally — 32M Instagram followers. 'Boys Over Flowers', 'The Legend of the Blue Sea', and 'The King: Eternal Monarch' each set Pan-Asian viewership records."
  },
  {
    id:"c119", name:"Song Joong-ki", verified:true, category:"Film", region:"Asia",
    portrait: "/assets/portraits/c119.jpg",
    startingPrice:420000, demandIndex:88, popularityScore:90, availability:"Open",
    availabilityWindowDays:21, socialReachMillions:25.0, agencyRepresentation:"HISTORY D&C",
    awards:"Baeksang Arts Award Best Actor, Grand Bell Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$18M", brandValue:"$60M",
    eliteSignal:"'Descendants of the Sun' broke viewership records across 32 countries. Baeksang Best Actor laureate. Leading man in Netflix's Space Sweepers — a genuine Pan-Asian film market crossover phenomenon."
  },
];

// ── Phase 10: Inquiry storage ─────────────────────────────────────────────────
export const inquiries = [];

export const db = {
  users: [
    { id: "u1", email: "client@aurelux.com", name: "Aria Sterling", role: "client", passwordHash: bcrypt.hashSync("Client@123", 10) },
    { id: "u2", email: "manager@aurelux.com", name: "Marcus Vale", role: "manager", passwordHash: bcrypt.hashSync("Manager@123", 10) },
    { id: "u3", email: "admin@aurelux.com", name: "Helena Noir", role: "admin", passwordHash: bcrypt.hashSync("Admin@123", 10) },
  ],
  celebrities: [
    ...namedCelebrities,
    ...NEW_CELEBRITIES,
    ...Array.from({ length: 70 }, (_, i) => makeExtCelebrity(i)),
  ],
  bookings: [],
  crowdBookings: [],
  messages: [
    {
      id: "m1",
      from: "Representation Desk",
      toUserId: "u1",
      body: "Welcome to ALL TALENTS Agency. Your private line is active.",
      timestamp: new Date().toISOString(),
    },
  ],
};
