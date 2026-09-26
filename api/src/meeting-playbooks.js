/** API parity with website meeting playbooks */

const NAMED_OVERRIDES = {
  "Charlize Theron": {
    headline: "UN-aligned private dinner track",
    steps: [
      "Share your event intent and guest profile with our CAA liaison.",
      "Receive a tailored brief — humanitarian or brand summit framing only.",
      "Lock a 72-hour introduction window once terms are confirmed.",
      "Meet at an estate screening, private dinner, or Geneva summit side-room.",
    ],
  },
};

const STEP_VARIANTS = [
  [
    "Tell us your occasion and who will be in the room.",
    "Your ATA rep aligns the brief with their agency desk.",
    "Reserve a priority window — not a confirmed booking yet.",
    "Meet at the venue that fits their category and comfort level.",
  ],
  [
    "Open with budget band and event type — we route to the right desk.",
    "Receive a tailored brief within 24 hours of qualification.",
    "Hold a 72-hour slot while representation reviews fit.",
    "Confirm date, venue, and NDA before travel logistics.",
  ],
];

const HEADLINE_VARIANTS = {
  Film: ["Private screening & dinner track", "Estate reception pathway"],
  Music: ["Backstage & listening-room lane", "Label-routed private session"],
  Sports: ["Paddock & hospitality suite track", "VIP box introduction pathway"],
  Business: ["Summit side-room introduction", "Boardroom keynote track"],
  Influencer: ["Brand-day & creator-house lane", "Private fan-safe meet"],
};

function hashId(id) {
  return parseInt(String(id || "").replace(/\D/g, ""), 10) || 1;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

export function getMeetingPlaybookForCelebrity(c) {
  const override = NAMED_OVERRIDES[c.name];
  if (override) {
    return { meetingHeadline: override.headline, meetingSteps: override.steps };
  }
  const seed = hashId(c.id);
  const cat = c.category || "Film";
  const headlines = HEADLINE_VARIANTS[cat] || HEADLINE_VARIANTS.Film;
  const first = c.name.split(" ")[0];
  const agency = c.agencyRepresentation || "their representation";
  const steps = STEP_VARIANTS[seed % STEP_VARIANTS.length].map((s, i) =>
    i === 1 ? s.replace("agency desk", `${agency} desk`) : s
  );
  return {
    meetingHeadline: `${first}: ${pick(headlines, seed)}`,
    meetingSteps: steps,
  };
}
