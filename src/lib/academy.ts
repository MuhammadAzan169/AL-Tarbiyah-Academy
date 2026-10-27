import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Role = "admin" | "teacher" | "parent" | "student";
export type Question = { id: string; label: string; type: "short" | "long" | "single" | "multi"; required?: boolean; options?: string[] };
export type SurveyForm = { id: string; slug: string; title: string; description: string; questions: Question[]; published: boolean; created_at?: string; qr_label?: string | null; qr_dark?: string | null; qr_light?: string | null };
export type Child = { age: string; grade: string; listening: string; reading: string; writing: string; accessibility: string };

const url = import.meta.env["VITE_SUPABASE_URL"];
const key = import.meta.env["VITE_SUPABASE_ANON_KEY"];
export const configured = Boolean(url && key);
export const supabase: SupabaseClient | null = configured ? createClient(url, key) : null;

export const grades = [1, 2, 3, 4, 5, 6];
export const listeningOptions = ["Cannot understand English.", "Understands a few simple English words.", "Understands simple English sentences.", "Understands most everyday English conversations.", "Can understand classroom instructions and explanations in English."];
export const readingOptions = ["Cannot read English yet.", "Can recognize some English letters and words.", "Can read simple English words and sentences.", "Can read short paragraphs.", "Can read age-appropriate English texts independently."];
export const writingOptions = ["Cannot write in English yet.", "Can write individual letters and simple words.", "Can write simple English sentences.", "Can write short paragraphs.", "Can write age-appropriate English texts independently."];
export const countries = ["United States", "United Kingdom", "Canada", "Australia", "New Zealand", "United Arab Emirates", "Saudi Arabia", "Pakistan", "India", "South Africa", "Malaysia", "Other country"];

export const defaultQuestions: Question[] = [
  { id: "interest", label: "How interested are you in enrolling your child in our Islamic Studies programme?", type: "single", required: true, options: ["Very interested", "Interested", "Somewhat interested"] },
  { id: "start", label: "When would you like your child to start classes?", type: "single", required: true, options: ["Immediately or within 2 weeks", "Within 1 month", "Within 2–3 months", "Within 4–6 months", "More than 6 months from now"] },
  { id: "decision", label: "What information would help you make your enrollment decision?", type: "multi", options: ["Reviewing the Islamic Studies syllabus", "Understanding the class schedule", "Understanding the subjects and topics covered", "Learning how online classes are conducted", "Other information"] },
  { id: "syllabus", label: "After reviewing the syllabus, how well does it meet your expectations?", type: "single", options: ["Meets my expectations very well", "Meets my expectations somewhat", "Does not meet my expectations"] },
  { id: "days_per_week", label: "How many days per week would you prefer your child to attend classes?", type: "single", required: true, options: ["3 days per week", "4 days per week"] },
  { id: "days", label: "Which days of the week would suit your family for classes?", type: "multi", required: true, options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
  { id: "preferred_times", label: "What days and times would be most suitable for your child's classes?", type: "long" },
  { id: "duration", label: "How long would you prefer each class to last?", type: "single", required: true, options: ["45 minutes", "60 minutes"] },
  { id: "time_zone", label: "What is your local time zone?", type: "short" },
  { id: "topics", label: "Which areas of Islamic Studies are you most interested in your child learning?", type: "multi", options: ["Aqeedah (Islamic beliefs)", "Fiqh (foundational Islamic rulings and worship)", "Hadith", "Seerah (the life of Prophet Muhammad ﷺ)", "Stories of the Prophets and Companions", "Islamic manners and character", "Islamic history", "Other topics included in the grade-level syllabus"] },
];

export const demoForm: SurveyForm = { id: "demo", slug: "parent-interest", title: "Parent Interest & Enrollment Survey", description: "Help us plan the right Islamic Studies class for your family.", questions: defaultQuestions, published: true };

export function appUrl(path: string) {
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
}
