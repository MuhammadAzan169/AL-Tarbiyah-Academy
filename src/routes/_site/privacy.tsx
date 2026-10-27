import { createFileRoute } from "@tanstack/react-router";
import { AcademyPage } from "@/features/academy/public-pages";
export const Route = createFileRoute("/_site/privacy")({ component: () => <AcademyPage page="privacy" /> });
