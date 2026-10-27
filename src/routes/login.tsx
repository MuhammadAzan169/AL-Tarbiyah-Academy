import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/academy/auth-page";

export const Route = createFileRoute("/login")({ component: () => <AuthPage /> });
