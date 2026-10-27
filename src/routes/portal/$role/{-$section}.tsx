import { createFileRoute, notFound } from "@tanstack/react-router";
import { PortalPage } from "@/features/academy/portal";
import { portalLinks, type PortalRole } from "@/features/academy/school-nav";
export const Route = createFileRoute("/portal/$role/{-$section}")({
  beforeLoad: ({ params }) => {
    if (!["admin", "teacher", "parent", "student"].includes(params.role)) throw notFound();
    if (
      params.section &&
      !portalLinks[params.role as PortalRole].some((item) => item.id === params.section)
    )
      throw notFound();
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: PortalRoute,
});
function PortalRoute() {
  const { role, section } = Route.useParams();
  return <PortalPage role={role as PortalRole} section={section} />;
}
