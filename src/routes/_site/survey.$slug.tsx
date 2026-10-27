import { createFileRoute } from "@tanstack/react-router";
import { SurveyPage } from "@/features/academy/survey";
export const Route = createFileRoute("/_site/survey/$slug")({ component: SurveyRoute });
function SurveyRoute() { const {slug}=Route.useParams(); return <SurveyPage slug={slug}/>; }
