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
  // id,  name,                 category,      agency,              region,           portrait (Wikipedia CDN),                                                                                                                                                                                                                         price,    demand, pop, availability, reach,   awards,                  risk
  ["c1",  "Beyoncé",            "Music",        "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg/330px-Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg", 2100000,  98,     99,  "Limited",    260.0,   "Grammy Award",          "low"],
  ["c2",  "Leonardo DiCaprio",  "Film",         "CAA",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/LeoPTABFI191125-28_%28cropped%29.jpg/330px-LeoPTABFI191125-28_%28cropped%29.jpg",                                                                                                   520000,   88,     92,  "Open",       95.0,    "Academy Award",         "low"],
  ["c3",  "Cristiano Ronaldo",  "Sports",       "Gestifute / CAA",   "Europe",         "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Cristiano_Ronaldo_2275_%28cropped%29.jpg/330px-Cristiano_Ronaldo_2275_%28cropped%29.jpg",                                                                                            1200000,  97,     98,  "Limited",    640.0,   "Ballon d'Or",           "low"],
  ["c4",  "Kim Kardashian",     "Influencer",   "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Kim_Kardashian_West_2014.jpg/330px-Kim_Kardashian_West_2014.jpg",                                                                                                                    480000,   85,     88,  "Open",       364.0,   "Emmy Award",            "medium"],
  ["c5",  "Drake",              "Music",        "CAA",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg/330px-Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg",                                      1050000,  93,     95,  "Waitlist",   145.0,   "Grammy Award",          "low"],
  ["c6",  "Dwayne Johnson",     "Film",         "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Dwayne_Johnson-1809_%28cropped%29.jpg/330px-Dwayne_Johnson-1809_%28cropped%29.jpg",                                                                                                  1500000,  96,     97,  "Limited",    389.0,   "People's Choice Award", "low"],
  ["c7",  "Charlize Theron",    "Film",         "CAA",               "Africa",         "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Charlize-theron-IMG_6045.jpg/330px-Charlize-theron-IMG_6045.jpg",                                                                                                                    310000,   78,     84,  "Open",       42.0,    "Academy Award",         "low"],
  ["c8",  "Keanu Reeves",       "Film",         "CAA",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Keanu_Reeves_at_TIFF_2025_02_%28Cropped%29.jpg/330px-Keanu_Reeves_at_TIFF_2025_02_%28Cropped%29.jpg",                                                                               290000,   82,     86,  "Open",       38.0,    "MTV Movie Award",       "low"],
  ["c9",  "Elon Musk",          "Business",     "Independent",       "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/330px-Elon_Musk_-_54820081119_%28cropped%29.jpg",                                                                                         2500000,  91,     89,  "Waitlist",   200.0,   "Forbes Innovator",      "high"],
  ["c10", "Salma Hayek",        "Film",         "CAA",               "Latin America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/MKr383631_Salma_Hayek_%28Women_In_Motion%2C_Cannes_2025%29_crop.jpg/330px-MKr383631_Salma_Hayek_%28Women_In_Motion%2C_Cannes_2025%29_crop.jpg",                                     250000,   76,     82,  "Open",       26.0,    "Cannes Award",          "low"],
  ["c11", "Zendaya",            "Film",         "CAA",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Zendaya_-_2019_by_Glenn_Francis.jpg/330px-Zendaya_-_2019_by_Glenn_Francis.jpg",                                                                                                     420000,   94,     96,  "Limited",    184.0,   "Emmy Award",            "low"],
  ["c12", "Taylor Swift",       "Music",        "UTA",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/330px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png",                                                      1800000,  99,     99,  "Waitlist",   282.0,   "Grammy Award",          "low"],
  ["c13", "Rihanna",            "Music",        "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rihanna_Fenty_2018.png/330px-Rihanna_Fenty_2018.png",                                                                                                                               1600000,  95,     97,  "Waitlist",   150.0,   "Grammy Award",          "low"],
  ["c14", "Lewis Hamilton",     "Sports",       "IMG",               "Europe",         "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg/330px-Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg", 980000, 90,   93,  "Limited",    33.5,    "FIA World Championship","low"],
  ["c15", "Virat Kohli",        "Sports",       "IMG",               "Asia",           "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Virat_Kohli_in_PMO_New_Delhi.jpg/330px-Virat_Kohli_in_PMO_New_Delhi.jpg",                                                                                                           850000,   92,     94,  "Open",       270.0,   "ICC Player of the Year","low"],
  ["c16", "Margot Robbie",      "Film",         "CAA",               "Australia",  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Margot_Robbie_2019_by_Glenn_Francis_%28cropped%29.jpg/330px-Margot_Robbie_2019_by_Glenn_Francis_%28cropped%29.jpg", 450000, 89, 91, "Open", 22.0,  "BAFTA Award",           "low"],
  // ── Newly added real celebrities (c17–c30) ──────────────────────────────────
  ["c17", "Chris Young",        "Music",        "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Chris_young_.jpg/330px-Chris_young_.jpg",                                                                                                                                                                              280000,   78,     82,  "Open",       18.5,    "ACM Award",             "low"],
  ["c18", "Tyler Hynes",        "Film",         "Independent",       "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Tyler_Hynes_at_San_Diego_Comic_Con_2025.jpg/330px-Tyler_Hynes_at_San_Diego_Comic_Con_2025.jpg",                                                                                                                             150000,   72,     76,  "Open",       8.5,     "Canadian Screen Award", "low"],
  ["c19", "Joe Bonamassa",      "Music",        "Independent",       "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Joe_Bonamassa_-_2013_World_Tour_-_Meistersingerhalle_Nuernberg_-_11-03-2013_%28-31534407%29.jpg/330px-Joe_Bonamassa_-_2013_World_Tour_-_Meistersingerhalle_Nuernberg_-_11-03-2013_%28-31534407%29.jpg",                    185000,   80,     83,  "Open",       12.0,    "Billboard Blues #1",    "low"],
  ["c20", "Boz Scaggs",         "Music",        "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Boz_Scaggs_-_Coral_Springs%2C_FL_-_22886393275.jpg/330px-Boz_Scaggs_-_Coral_Springs%2C_FL_-_22886393275.jpg",                                                                                                              220000,   75,     78,  "Open",       6.5,     "Grammy Award",          "low"],
  ["c21", "Robert Earl Keen",   "Music",        "Independent",       "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Robert_Earl_Keen_at_the_Redneck_Country_Club%2C_June_30%2C_2018_MG_1357_%2841334326940%29_%28cropped%29.jpg/330px-Robert_Earl_Keen_at_the_Redneck_Country_Club%2C_June_30%2C_2018_MG_1357_%2841334326940%29_%28cropped%29.jpg",145000,   70,     74,  "Open",       4.2,     "Americana Award",       "low"],
  ["c22", "Zach Bryan",         "Music",        "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Zach_Bryan_performing_at_Crypto.com_Arena_on_23_Aug_2023_%28cropped%29.jpg/330px-Zach_Bryan_performing_at_Crypto.com_Arena_on_23_Aug_2023_%28cropped%29.jpg",                                                             380000,   92,     93,  "Limited",    34.0,    "Grammy Award",          "low"],
  ["c23", "Lainey Wilson",      "Music",        "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Lainey_Wilson_2024.jpg/330px-Lainey_Wilson_2024.jpg",                                                                                                                                                                  290000,   88,     90,  "Open",       22.5,    "CMA Award",             "low"],
  ["c24", "Chris Stapleton",    "Music",        "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Chris_Stapleton_Concert_%2848519730107%29_%28cropped%29.jpg/330px-Chris_Stapleton_Concert_%2848519730107%29_%28cropped%29.jpg",                                                                                           420000,   90,     91,  "Limited",    8.8,     "Grammy Award",          "low"],
  ["c25", "Sofia Vergara",      "Film",         "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Sof%C3%ADa_Vergara_2019_by_Glenn_Francis.jpg/330px-Sof%C3%ADa_Vergara_2019_by_Glenn_Francis.jpg",                                                                                                                        350000,   86,     88,  "Open",       34.5,    "SAG Award Nominee",     "low"],
  ["c26", "Emma Watson",        "Film",         "CAA",               "Europe",         "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Emma_Watson_2013.jpg/330px-Emma_Watson_2013.jpg",                                                                                                                                                                        310000,   87,     89,  "Open",       72.0,    "BAFTA Rising Star",     "low"],
  ["c27", "Kate Beckinsale",    "Film",         "CAA",               "Europe",         "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Kate_Beckinsale_%2829907748884%29_%28cropped2%29.jpg/330px-Kate_Beckinsale_%2829907748884%29_%28cropped2%29.jpg",                                                                                                            280000,   82,     85,  "Open",       19.5,    "Saturn Award",          "low"],
  ["c28", "Jennifer Aniston",   "Film",         "CAA",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/JenniferAnistonHWoFFeb2012.jpg/330px-JenniferAnistonHWoFFeb2012.jpg",                                                                                                                                                    500000,   89,     91,  "Waitlist",   41.5,    "Emmy Award",            "low"],
  ["c29", "Eva Green",          "Film",         "CAA",               "Europe",         "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/EVA_GREEN_CESAR_2020.jpg/330px-EVA_GREEN_CESAR_2020.jpg",                                                                                                                                                                290000,   84,     87,  "Open",       11.2,    "BAFTA Rising Star",     "low"],
  ["c30", "Morgan Wallen",      "Music",        "WME",               "North America",  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Morgan_Wallen_performing_at_Bank_of_America_Stadium.png/330px-Morgan_Wallen_performing_at_Bank_of_America_Stadium.png",                                                                                               650000,   93,     94,  "Limited",    22.0,    "ACM Award",             "low"],
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

// ── Extended roster portraits — Wikipedia CDN real celebrity portraits (c31–c100) ──
const EXT_PORTRAITS = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Idris_Elba_A_House_of_Dynamite-21_%28cropped%29.jpg/330px-Idris_Elba_A_House_of_Dynamite-21_%28cropped%29.jpg',          // c31 Idris Elba
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Viola_Davis_at_the_Air_Premiere_at_SXSW_%28cropped%29.jpg/330px-Viola_Davis_at_the_Air_Premiere_at_SXSW_%28cropped%29.jpg', // c32 Viola Davis
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Michael_B_Jordan_-_Sinners.jpg/330px-Michael_B_Jordan_-_Sinners.jpg',                                                      // c33 Michael B. Jordan
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Lupita_Nyong%27o_by_Gage_Skidmore_4.jpg/330px-Lupita_Nyong%27o_by_Gage_Skidmore_4.jpg',                                   // c34 Lupita Nyong'o
  'https://upload.wikimedia.org/wikipedia/commons/4/45/Priyanka_Chopra_at_Bulgary_launch%2C_2024_%28cropped%29.jpg',                                                                      // c35 Priyanka Chopra
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg/330px-Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg',      // c36 Shah Rukh Khan
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Deepika_Padukone_2025_%281%29.png/330px-Deepika_Padukone_2025_%281%29.png',                                                 // c37 Deepika Padukone
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Lionel_Messi_NE_Revolution_Inter_Miami_7.9.25-178.jpg/330px-Lionel_Messi_NE_Revolution_Inter_Miami_7.9.25-178.jpg',        // c38 Lionel Messi
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/LeBron_James_%2851959977144%29_%28cropped2%29.jpg/330px-LeBron_James_%2851959977144%29_%28cropped2%29.jpg',                 // c39 LeBron James
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Serena_Williams_at_the_2025_International_Tennis_Hall_of_Fame_Induction_Ceremony_Press_Conference_%28cropped%29.jpg/330px-Serena_Williams_at_the_2025_International_Tennis_Hall_of_Fame_Induction_Ceremony_Press_Conference_%28cropped%29.jpg', // c40 Serena Williams
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/NaomiOsaka-smile-2020_%28cropped_tight%29.png/330px-NaomiOsaka-smile-2020_%28cropped_tight%29.png',                        // c41 Naomi Osaka
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Simone_Biles_National_Team_2024.jpg/330px-Simone_Biles_National_Team_2024.jpg',                                            // c42 Simone Biles
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2023-11-16_Gala_de_los_Latin_Grammy%2C_03_%28cropped%2902.jpg/330px-2023-11-16_Gala_de_los_Latin_Grammy%2C_03_%28cropped%2902.jpg', // c43 Shakira
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Bad_Bunny_2019_by_Glenn_Francis_%28cropped%29.jpg/330px-Bad_Bunny_2019_by_Glenn_Francis_%28cropped%29.jpg',                 // c44 Bad Bunny
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_%28cropped_3%29.jpg/330px-Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_%28cropped_3%29.jpg', // c45 Jennifer Lopez
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/2023-11-16_Gala_de_los_Latin_Grammy%2C_20_%28Maluma%29.jpg/330px-2023-11-16_Gala_de_los_Latin_Grammy%2C_20_%28Maluma%29.jpg', // c46 Maluma
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Michelle_Yeoh-2268.jpg/330px-Michelle_Yeoh-2268.jpg',                                                                        // c47 Michelle Yeoh
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Jason_Momoa_%2843055621224%29_%28cropped%29.jpg/330px-Jason_Momoa_%2843055621224%29_%28cropped%29.jpg',                      // c48 Jason Momoa
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Dua_Lipa-69798_%28cropped%29.jpg/330px-Dua_Lipa-69798_%28cropped%29.jpg',                                                   // c49 Dua Lipa
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ed_Sheeran-6886_%28cropped%29.jpg/330px-Ed_Sheeran-6886_%28cropped%29.jpg',                                                 // c50 Ed Sheeran
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Ariana_Grande_promoting_Wicked_%282024%29.jpg/330px-Ariana_Grande_promoting_Wicked_%282024%29.jpg',                         // c51 Ariana Grande
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg/330px-BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg',     // c52 Billie Eilish
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/HarryStylesWembley170623_%2865_of_93%29_%2852982678051%29_%28cropped_2%29.jpg/330px-HarryStylesWembley170623_%2865_of_93%29_%2852982678051%29_%28cropped_2%29.jpg', // c53 Harry Styles
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Adele_2016.jpg/330px-Adele_2016.jpg',                                                                                        // c54 Adele
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/BrunoMars24KMagicWorldTourLive_%28cropped%29.jpg/330px-BrunoMars24KMagicWorldTourLive_%28cropped%29.jpg',                    // c55 Bruno Mars
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait_by_Brian_Ziff.jpg/330px-The_Weeknd_Portrait_by_Brian_Ziff.jpg',                                         // c56 The Weeknd
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Cardi_B_March_2024.png/330px-Cardi_B_March_2024.png',                                                                        // c57 Cardi B
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nicki_Minaj_2025_%283x4_cropped%29.jpg/330px-Nicki_Minaj_2025_%283x4_cropped%29.jpg',                                       // c58 Nicki Minaj
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/TechCrunch_Disrupt_San_Francisco_2019_-_Day_1_%2848834070763%29_%28cropped%29.jpg/330px-TechCrunch_Disrupt_San_Francisco_2019_-_Day_1_%2848834070763%29_%28cropped%29.jpg', // c59 Will Smith
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg/330px-Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg',        // c60 Denzel Washington
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Angela_Basset_at_the_2025_Cannes_Film_Festival_04_%28cropped%29.jpg/330px-Angela_Basset_at_the_2025_Cannes_Film_Festival_04_%28cropped%29.jpg', // c61 Angela Bassett
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Kerry_Washington_in_%282024%29_%28cropped%29.jpg/330px-Kerry_Washington_in_%282024%29_%28cropped%29.jpg',                    // c62 Kerry Washington
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Pedro_Pascal_at_the_2025_Cannes_Film_Festival_04.jpg/330px-Pedro_Pascal_at_the_2025_Cannes_Film_Festival_04.jpg',             // c63 Pedro Pascal
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Ana_de_Armas_%2854462619561%29_%28cropped_3%29.jpg/330px-Ana_de_Armas_%2854462619561%29_%28cropped_3%29.jpg',                // c64 Ana de Armas
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Goyas_2024_-_Pen%C3%A9lope_Cruz-2_%28cropped%29.jpg/330px-Goyas_2024_-_Pen%C3%A9lope_Cruz-2_%28cropped%29.jpg',             // c65 Penélope Cruz
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Chris_Hemsworth_-_Crime_101.jpg/330px-Chris_Hemsworth_-_Crime_101.jpg',                                                      // c66 Chris Hemsworth
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg/330px-Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg', // c67 Ryan Reynolds
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Nicole_Kidman-66059_%28cropped%29.jpg/330px-Nicole_Kidman-66059_%28cropped%29.jpg',                                          // c68 Nicole Kidman
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Hugh_Jackman_by_Gage_Skidmore_3.jpg/330px-Hugh_Jackman_by_Gage_Skidmore_3.jpg',                                             // c69 Hugh Jackman
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Cate_Blanchett-63298_%28cropped_2%29.jpg/330px-Cate_Blanchett-63298_%28cropped_2%29.jpg',                                   // c70 Cate Blanchett
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mindy_Kaling_by_Claire_Leahy_%28cropped%29.jpg/330px-Mindy_Kaling_by_Claire_Leahy_%28cropped%29.jpg',                       // c71 Mindy Kaling
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Glasto2025-546_%28cropped%29_%282%29.jpg/330px-Glasto2025-546_%28cropped%29_%282%29.jpg',                                    // c72 Olivia Rodrigo
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Doja_Cat_x_Amazon1.1_%28cropped%29.jpg/330px-Doja_Cat_x_Amazon1.1_%28cropped%29.jpg',                                       // c73 Doja Cat
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Tyler_the_Creator_%2852163761341%29_%28cropped%29.jpg/330px-Tyler_the_Creator_%2852163761341%29_%28cropped%29.jpg',           // c74 Tyler, the Creator
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/J_Balvin_BTTR_Tour_Photo_January_2025.jpg/330px-J_Balvin_BTTR_Tour_Photo_January_2025.jpg',                                  // c75 J Balvin
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Camila_Cabello_AMAs_2019.png/330px-Camila_Cabello_AMAs_2019.png',                                                            // c76 Camila Cabello
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/2023-11-16_Gala_de_los_Latin_Grammy%2C_27_%28cropped%29.jpg/330px-2023-11-16_Gala_de_los_Latin_Grammy%2C_27_%28cropped%29.jpg', // c77 Rosalía
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Jackie_Chan.jpg/330px-Jackie_Chan.jpg',                                                                                       // c78 Jackie Chan
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Mahershala_Ali_by_Gage_Skidmore_%28cropped%29.jpg/330px-Mahershala_Ali_by_Gage_Skidmore_%28cropped%29.jpg',                  // c79 Mahershala Ali
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/-Hidden_Figures-_Film_Celebration_%28NHQ201612100020%29_%28cropped%29.jpg/330px--Hidden_Figures-_Film_Celebration_%28NHQ201612100020%29_%28cropped%29.jpg', // c80 Taraji P. Henson
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Vin_Diesel_by_Gage_Skidmore_2.jpg/330px-Vin_Diesel_by_Gage_Skidmore_2.jpg',                                                 // c81 Vin Diesel
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Tom_Holland_during_pro-am_Wentworth_golf_club_2023-2.jpg/330px-Tom_Holland_during_pro-am_Wentworth_golf_club_2023-2.jpg',    // c82 Tom Holland
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Untold_2024_-Burna_Boy_%2853927293629%29_%28cropped%29.jpg/330px-Untold_2024_-Burna_Boy_%2853927293629%29_%28cropped%29.jpg', // c83 Burna Boy
  'https://upload.wikimedia.org/wikipedia/commons/d/d3/Wizkid_at_Iyanya%27s_album_launch_concert%2C_2013_%28Cropped%29.png',                                                               // c84 Wizkid
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/EltonDocBFILFF101024_%284_of_17%29_%28cropped%29.jpg/330px-EltonDocBFILFF101024_%284_of_17%29_%28cropped%29.jpg',             // c85 Elton John
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/MaccaLyricsRFH051121_%2815_of_18%29_%28updated%29_%28cropped%29.jpg/330px-MaccaLyricsRFH051121_%2815_of_18%29_%28updated%29_%28cropped%29.jpg', // c86 Paul McCartney
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Roger_Federer_2015_%28cropped%29.jpg/330px-Roger_Federer_2015_%28cropped%29.jpg',                                            // c87 Roger Federer
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Rafael_Nadal_en_2024_%28cropped%29.jpg/330px-Rafael_Nadal_en_2024_%28cropped%29.jpg',                                        // c88 Rafael Nadal
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Trevor_Noah_%2853554114243%29_%28portrait_crop%29.jpg/330px-Trevor_Noah_%2853554114243%29_%28portrait_crop%29.jpg',           // c89 Trevor Noah
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Novak_Djokovic_2024_Paris_Olympics.jpg/330px-Novak_Djokovic_2024_Paris_Olympics.jpg',                                        // c90 Novak Djokovic
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Post_Malone_July_2021_%28cropped%29.jpg/330px-Post_Malone_July_2021_%28cropped%29.jpg',                                      // c91 Post Malone
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/KendrickSZASPurs230725-19_-_54683179509_%28cropped%29_%28cropped%29.jpg/330px-KendrickSZASPurs230725-19_-_54683179509_%28cropped%29_%28cropped%29.jpg', // c92 SZA
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Megan_Thee_Stallion_Adweek_pose.jpg/330px-Megan_Thee_Stallion_Adweek_pose.jpg',                                              // c93 Megan Thee Stallion
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Kevin_Hart_2014_%28cropped_2%29.jpg/330px-Kevin_Hart_2014_%28cropped_2%29.jpg',                                              // c94 Kevin Hart
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Indian_actor_Amitabh_Bachchan.jpg/330px-Indian_actor_Amitabh_Bachchan.jpg',                                                  // c95 Amitabh Bachchan
  'https://upload.wikimedia.org/wikipedia/commons/3/32/Ranveer_Singh_in_2023_%281%29_%28cropped%29.jpg',                                                                                   // c96 Ranveer Singh
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Alia_Bhatt_at_Berlinale_2022_Ausschnitt.jpg/330px-Alia_Bhatt_at_Berlinale_2022_Ausschnitt.jpg',                              // c97 Alia Bhatt
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Zayn_Wiki_%28cropped%29.jpg/330px-Zayn_Wiki_%28cropped%29.jpg',                                                               // c98 Zayn Malik
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Eddie_Murphy_by_David_Shankbone.jpg/330px-Eddie_Murphy_by_David_Shankbone.jpg',                                              // c99 Eddie Murphy
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Whoopi_Goldberg_Springsteen-71_%28cropped%29.jpg/330px-Whoopi_Goldberg_Springsteen-71_%28cropped%29.jpg',                    // c100 Whoopi Goldberg
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
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Matt_Rife%2C_2021.jpg/330px-Matt_Rife%2C_2021.jpg",
    startingPrice:85000, demandIndex:88, popularityScore:87, availability:"Open",
    availabilityWindowDays:14, socialReachMillions:42.0, agencyRepresentation:"CAA",
    awards:"Netflix Special — Natural Selection (2023)", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$50M", brandValue:"$30M",
    eliteSignal:"Forbes Top Creators 2025 — ranked #7 with ~$50M earnings. TikTok viral comedian turned arena headliner with back-to-back Netflix specials. Signed with CAA."
  },
  {
    id:"c102", name:"Steven Tyler", verified:true, category:"Music", region:"North America",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Steven_Tyler_by_Gage_Skidmore_3.jpg/330px-Steven_Tyler_by_Gage_Skidmore_3.jpg",
    startingPrice:380000, demandIndex:86, popularityScore:89, availability:"Limited",
    availabilityWindowDays:21, socialReachMillions:18.5, agencyRepresentation:"WME",
    awards:"Rock and Roll Hall of Fame (2001), Grammy Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$130M", brandValue:"$95M",
    eliteSignal:"Aerosmith's iconic frontman — one of rock's most recognisable voices. Rock & Roll Hall of Fame inductee with 150M+ album sales globally. A guaranteed sold-out engagement."
  },
  {
    id:"c103", name:"Joe Perry", verified:true, category:"Music", region:"North America",
    portrait: "https://upload.wikimedia.org/wikipedia/en/thumb/6/63/Joe_Perry_2015.jpg/330px-Joe_Perry_2015.jpg",
    startingPrice:290000, demandIndex:82, popularityScore:86, availability:"Open",
    availabilityWindowDays:21, socialReachMillions:12.0, agencyRepresentation:"WME",
    awards:"Rock and Roll Hall of Fame (2001), Grammy Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$100M", brandValue:"$70M",
    eliteSignal:"Aerosmith founding guitarist and co-songwriter behind 'Dream On', 'Walk This Way', and 'Sweet Emotion'. Rock & Roll Hall of Fame inductee — the gold standard of American hard rock."
  },
  {
    id:"c104", name:"RM (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/RM_at_W_Korea_Love_Your_W%2C_November_2023.jpg/330px-RM_at_W_Korea_Love_Your_W%2C_November_2023.jpg",
    startingPrice:620000, demandIndex:93, popularityScore:95, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:48.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, American Music Award, GRAMMY Nomination", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$20M", brandValue:"$85M",
    eliteSignal:"BTS leader and art curator — bridging K-pop and global fine art. Solo albums debuted on Billboard 200. Art exhibitions at SFMOMA and LACMA. A generational cultural ambassador."
  },
  {
    id:"c105", name:"Jin (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/BTS_Jin_at_Maison_Fred%2C_13_March_2025_04.png/330px-BTS_Jin_at_Maison_Fred%2C_13_March_2025_04.png",
    startingPrice:580000, demandIndex:91, popularityScore:93, availability:"Open",
    availabilityWindowDays:30, socialReachMillions:44.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, MTV EMA", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$18M", brandValue:"$72M",
    eliteSignal:"BTS vocalist and UN Youth Delegate. Solo debut 'The Astronaut' produced with Coldplay. One of the most universally beloved voices in global pop — military discharge completed 2025."
  },
  {
    id:"c106", name:"Suga (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/160217_Gaon_Chart_K-POP_Awards_Red_Carpet_BTS_Suga.jpg/330px-160217_Gaon_Chart_K-POP_Awards_Red_Carpet_BTS_Suga.jpg",
    startingPrice:600000, demandIndex:92, popularityScore:94, availability:"Open",
    availabilityWindowDays:30, socialReachMillions:46.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, Grammy Nomination", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$20M", brandValue:"$78M",
    eliteSignal:"BTS rapper and producer under alias Agust D — Billboard 200 #2 with debut solo album. HYBE's most prolific songwriter. An unparalleled creative force in Korean hip-hop and production."
  },
  {
    id:"c107", name:"J-Hope (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/J-Hope_at_W_Korea_Breast_Cancer_Campaign%2C_15_October_2025.png/330px-J-Hope_at_W_Korea_Breast_Cancer_Campaign%2C_15_October_2025.png",
    startingPrice:590000, demandIndex:91, popularityScore:93, availability:"Open",
    availabilityWindowDays:30, socialReachMillions:44.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, Grand Bell Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$26M", brandValue:"$80M",
    eliteSignal:"BTS main dancer and rapper — first BTS member to headline Lollapalooza 2022. Louis Vuitton House Ambassador. 'Jack in the Box' debuted at #17 Billboard 200 — a cultural trendsetter."
  },
  {
    id:"c108", name:"Jimin (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Jimin_on_the_way_to_SBS_Radio%2C_31_March_2023_%282%29.jpg/330px-Jimin_on_the_way_to_SBS_Radio%2C_31_March_2023_%282%29.jpg",
    startingPrice:620000, demandIndex:94, popularityScore:96, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:50.0, agencyRepresentation:"HYBE",
    awards:"Billboard Hot 100 #1, Music Bank Trophy, Grammy Nomination", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$22M", brandValue:"$88M",
    eliteSignal:"First Korean soloist to hit #1 on Billboard Hot 100 (Like Crazy). Solo album 'FACE' peaked at #2 Billboard 200. Dior House Ambassador. Universally regarded as BTS's most iconic performer."
  },
  {
    id:"c109", name:"V (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/BTS%27s_V_20251004_04.jpg/330px-BTS%27s_V_20251004_04.jpg",
    startingPrice:620000, demandIndex:93, popularityScore:95, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:52.0, agencyRepresentation:"HYBE",
    awards:"Billboard Music Award, CELINE Global Ambassador", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$18M", brandValue:"$90M",
    eliteSignal:"Kim Taehyung — BTS vocalist and the most-followed Korean celebrity on Instagram (60M+). CELINE House Ambassador. His debut solo album 'Layover' topped charts in 102 countries."
  },
  {
    id:"c110", name:"Jungkook (BTS)", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Jung_Kook_of_BTS%2C_February_12%2C_2026_%281%29.png/330px-Jung_Kook_of_BTS%2C_February_12%2C_2026_%281%29.png",
    startingPrice:650000, demandIndex:95, popularityScore:97, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:55.0, agencyRepresentation:"HYBE",
    awards:"Billboard Hot 100, Seven hit #1 in 100+ countries, Calvin Klein Global Ambassador", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$20M", brandValue:"$95M",
    eliteSignal:"BTS Golden Maknae — solo debut 'Golden' produced global smash 'Seven' (#1 in 100+ countries). Calvin Klein and CELINE ambassador. The #1 most-streamed Korean solo artist on Spotify worldwide."
  },
  {
    id:"c111", name:"Mia Khalifa", verified:true, category:"Influencer", region:"North America",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Mia_Khalifa_in_2019.png",
    startingPrice:95000, demandIndex:84, popularityScore:86, availability:"Open",
    availabilityWindowDays:14, socialReachMillions:28.0, agencyRepresentation:"Independent",
    awards:"Viral Media Personality, Aries Fashion Campaign", riskIndex:"medium",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$5M", brandValue:"$22M",
    eliteSignal:"Lebanese-American media personality with 28M+ cross-platform followers. Fashion campaign muse for Aries (London). Sports commentator for Complex. Philanthropy: $800K raised for Beirut relief."
  },
  {
    id:"c112", name:"Lana Rhoades", verified:true, category:"Influencer", region:"North America",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lana_Rhoades_2-2017_%28cropped%29.jpg/330px-Lana_Rhoades_2-2017_%28cropped%29.jpg",
    startingPrice:75000, demandIndex:80, popularityScore:82, availability:"Open",
    availabilityWindowDays:14, socialReachMillions:20.0, agencyRepresentation:"Independent",
    awards:"iHeartRadio Podcast Award Nominee", riskIndex:"medium",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$3M", brandValue:"$14M",
    eliteSignal:"Multi-platform content creator and co-host of '3 Girls 1 Kitchen' podcast — top-100 US chart. 16M+ Instagram followers. Transitioned to lifestyle, parenting, and brand content creator."
  },
  {
    id:"c113", name:"Riley Reid", verified:true, category:"Influencer", region:"North America",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Riley_Reid_2019_by_Glenn_Francis.jpg/330px-Riley_Reid_2019_by_Glenn_Francis.jpg",
    startingPrice:80000, demandIndex:81, popularityScore:83, availability:"Open",
    availabilityWindowDays:14, socialReachMillions:18.0, agencyRepresentation:"Independent",
    awards:"AVN Award, XBIZ Award, FrontPage Media Personality", riskIndex:"medium",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$4M", brandValue:"$12M",
    eliteSignal:"Award-winning content creator and media personality with one of the most engaged digital fanbases in creator economy. Active across OnlyFans, Twitch, and branded content channels."
  },
  {
    id:"c114", name:"Lisa (BLACKPINK)", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/20240314_Lisa_Manoban_07.jpg/330px-20240314_Lisa_Manoban_07.jpg",
    startingPrice:750000, demandIndex:96, popularityScore:97, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:110.0, agencyRepresentation:"LLOUD / RCA",
    awards:"MTV VMA Best K-pop (2022, 2024, 2025), Guinness World Records", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$20M", brandValue:"$180M",
    eliteSignal:"BLACKPINK's global icon — most-followed K-pop artist on Instagram (110M+). Solo 'Rockstar' debuted top-5 Billboard Global 200. Stars in HBO's The White Lotus S3. Bulgari and Celine ambassador."
  },
  {
    id:"c115", name:"Jennie Kim", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Kim_Jennie_%28%EA%B9%80%EC%A0%9C%EB%8B%88%29_05.jpg/330px-Kim_Jennie_%28%EA%B9%80%EC%A0%9C%EB%8B%88%29_05.jpg",
    startingPrice:680000, demandIndex:94, popularityScore:95, availability:"Limited",
    availabilityWindowDays:30, socialReachMillions:80.0, agencyRepresentation:"OA Entertainment",
    awards:"MTV VMA Best K-pop, Chanel House Ambassador", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$15M", brandValue:"$160M",
    eliteSignal:"The 'Human Chanel' — Jennie Kim's debut solo 'SOLO' broke all K-pop records. Chanel, adidas, Calvin Klein ambassador. Starred in The Idol (HBO) — a fashion-forward cultural force."
  },
  {
    id:"c116", name:"IU (Lee Ji-eun)", verified:true, category:"Music", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/IU_at_Blue_Dragon_Series_Awards_on_18072025_%2810%29.png/330px-IU_at_Blue_Dragon_Series_Awards_on_18072025_%2810%29.png",
    startingPrice:520000, demandIndex:91, popularityScore:93, availability:"Limited",
    availabilityWindowDays:21, socialReachMillions:35.0, agencyRepresentation:"EDAM Entertainment",
    awards:"Melon Music Award, Golden Disc Award, Daesang (Grand Prize × 8)", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$35M", brandValue:"$95M",
    eliteSignal:"South Korea's best-selling female artist and most trusted actress. 'Celebrity' and 'Lilac' charted on Billboard Global 200. LG and Gucci ambassador. 8× Daesang award winner — irreplaceable in Korean entertainment."
  },
  {
    id:"c117", name:"Park Seo-joon", verified:true, category:"Film", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Park_Seo-joon_for_Marie_Claire_Korea%2C_2023_%281%29.jpg/330px-Park_Seo-joon_for_Marie_Claire_Korea%2C_2023_%281%29.jpg",
    startingPrice:350000, demandIndex:87, popularityScore:89, availability:"Open",
    availabilityWindowDays:21, socialReachMillions:22.0, agencyRepresentation:"Awesome ENT",
    awards:"Baeksang Arts Award Nominee, Asia Artist Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$12M", brandValue:"$40M",
    eliteSignal:"Marvel Cinematic Universe debut in The Marvels (2023). K-drama icon ('Itaewon Class', 'She Was Pretty') with a Pan-Asian fanbase of 20M+. The gateway name for Western studio K-drama crossover."
  },
  {
    id:"c118", name:"Lee Min-ho", verified:true, category:"Film", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Lee_Min-ho_in_December_2025.png/330px-Lee_Min-ho_in_December_2025.png",
    startingPrice:480000, demandIndex:90, popularityScore:92, availability:"Limited",
    availabilityWindowDays:21, socialReachMillions:32.0, agencyRepresentation:"MYM Entertainment",
    awards:"Korea Drama Awards Best Actor, KBS Drama Award", riskIndex:"low",
    ndaDefault:true, securityTiers:["Standard","Enhanced","Executive","Sovereign"],
    netWorth:"$22M", brandValue:"$75M",
    eliteSignal:"The most recognised Korean actor globally — 32M Instagram followers. 'Boys Over Flowers', 'The Legend of the Blue Sea', and 'The King: Eternal Monarch' each set Pan-Asian viewership records."
  },
  {
    id:"c119", name:"Song Joong-ki", verified:true, category:"Film", region:"Asia",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Song_Joong-ki_at_Style_Icon_Asia_2016.jpg/330px-Song_Joong-ki_at_Style_Icon_Asia_2016.jpg",
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
