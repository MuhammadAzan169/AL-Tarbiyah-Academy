import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Fetch a route's chunk as soon as a link is hovered/focused so navigation
    // feels instant instead of waiting for the chunk on click.
    defaultPreload: "intent",
    defaultPreloadDelay: 40,
  });

  return router;
};
