import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/academy/auth-page";

export const Route = createFileRoute("/admin/login")({ component: () => <AuthPage admin /> });
