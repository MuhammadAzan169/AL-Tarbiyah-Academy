import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { type ReactNode } from "react";
import appCss from "../styles.css?url";
import { brand } from "@/config/brand";
import { ThemeProvider, themeInitScript } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createRootRouteWithContext<{queryClient:QueryClient}>()({
  head:()=>({meta:[{charSet:"utf-8"},{name:"viewport",content:"width=device-width, initial-scale=1, viewport-fit=cover"},{title:`${brand.name} — Islamic Studies for Grades 1–6`},{name:"description",content:brand.description},{property:"og:title",content:`${brand.name} — Islamic Studies for Grades 1–6`},{property:"og:description",content:brand.description},{property:"og:type",content:"website"}],links:[{rel:"preconnect",href:"https://fonts.googleapis.com"},{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"},{rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Noto+Naskh+Arabic:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"},{rel:"stylesheet",href:appCss},{rel:"icon",href:"/favicon.svg",type:"image/svg+xml"}],scripts:[{children:themeInitScript}]}),
  shellComponent:({children}:{children:ReactNode})=><html lang="en" suppressHydrationWarning><head><HeadContent/></head><body>{children}<Scripts/></body></html>,
  component:RootComponent,
  notFoundComponent:()=> <><SiteHeader/><main className="academy-shell access-card"><h1>We couldn’t find that page.</h1><p>The link may have moved. The academy homepage is a good place to continue.</p><a href="/" className="academy-button">Return home</a></main><SiteFooter/></>,
  errorComponent:()=> <><SiteHeader/><main className="academy-shell access-card"><h1>This page didn’t load.</h1><p>Please refresh the page or return to the academy homepage.</p><a href="/" className="academy-button">Return home</a></main><SiteFooter/></>,
});
function RootComponent(){const {queryClient}=Route.useRouteContext();return <QueryClientProvider client={queryClient}><ThemeProvider><TooltipProvider delayDuration={150}><Outlet/><Toaster/></TooltipProvider></ThemeProvider></QueryClientProvider>}
