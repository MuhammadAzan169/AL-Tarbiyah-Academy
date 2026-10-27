import { createFileRoute, redirect } from "@tanstack/react-router";
import { AcademyPage } from "@/features/academy/public-pages";
import { supabase } from "@/lib/academy";

export const Route = createFileRoute("/_site/surveys")({
  // One open survey needs no list in front of it. Deciding here rather than in the
  // component means the family is redirected before anything renders.
  loader: async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("survey_forms")
      .select("slug")
      .eq("published", true)
      .order("created_at");
    if (data?.length === 1) throw redirect({ href: `/survey/${data[0]!.slug}` });
  },
  component: () => <AcademyPage page="surveys" />,
});
