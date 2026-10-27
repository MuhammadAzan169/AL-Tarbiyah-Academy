import { createFileRoute } from "@tanstack/react-router";
import { AcademyPage } from "@/features/academy/public-pages";
export const Route = createFileRoute("/_site/parents")({ component: () => <AcademyPage page="parents" /> });
