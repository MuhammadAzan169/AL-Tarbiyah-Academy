export const brand = {
  name: "Al Tarbiyah", shortName: "Al Tarbiyah", wordmark: ["Al", "Tarbiyah"] as const,
  tagline: "Islamic Studies for children, wherever home may be.",
  description: "Live, English-language Islamic Studies for children in Grades 1–6. Small group classes, a thoughtful curriculum, and clear updates for parents.",
  statement: "A strong foundation in faith, knowledge and character.",
  email: "hello@altarbiyah.example", supportEmail: "hello@altarbiyah.example", tutorsEmail: "teachers@altarbiyah.example",
  phone: "Contact us through the interest survey", address: "Online classes worldwide", hours: "Class times planned around international families",
  foundedYear: 2026, domain: "altarbiyah.example", social: { instagram: "#", linkedin: "#", youtube: "#", x: "#" }, grades: [1, 2, 3, 4, 5, 6] as const,
} as const;
export const palette = { teal: "var(--teal)", emerald: "var(--emerald)", amber: "var(--amber)", sky: "var(--sky)", lavender: "var(--lavender)", coral: "var(--coral)", navy: "var(--navy)", chart: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"], grid: "var(--chart-grid)" } as const;
export type Tone = "teal" | "emerald" | "amber" | "sky" | "lavender" | "coral";
export const toneClasses: Record<Tone, {text:string;bg:string;soft:string;border:string;ring:string;from:string}> = Object.fromEntries(
  (["teal","emerald","amber","sky","lavender","coral"] as Tone[]).map(t => [t, {text:`text-${t}`,bg:`bg-${t}`,soft:`bg-${t}/12`,border:`border-${t}/30`,ring:`ring-${t}/40`,from:`from-${t}/25`}])
) as Record<Tone, {text:string;bg:string;soft:string;border:string;ring:string;from:string}>;
export const publicNav = [
  { label: "Home", to: "/" }, { label: "Our approach", to: "/how-it-works" }, { label: "Curriculum", to: "/subjects" },
  { label: "For parents", to: "/parents" }, { label: "Teach with us", to: "/tutors" }, { label: "Fees", to: "/pricing" },
] as const;
export const footerNav = [
  { title: "Explore", links: publicNav.slice(0,3) },
  { title: "Join", links: [{label:"Interest surveys",to:"/surveys"},{label:"Teach with us",to:"/tutors"},{label:"Sign in",to:"/login"}] },
] as const;
export const subjectsNav = [{id:"belief",label:"Beliefs"},{id:"worship",label:"Worship"},{id:"character",label:"Character"}] as const;
