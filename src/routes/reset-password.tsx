import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/features/academy/reset-password";

export const Route = createFileRoute("/reset-password")({ component: () => <ResetPasswordPage /> });
