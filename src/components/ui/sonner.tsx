import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/hooks/use-theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      className="toaster group"
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-2xl group-[.toaster]:!bg-popover/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:!border-border group-[.toaster]:!shadow-float !font-sans",
          title: "!font-bold",
          description: "group-[.toast]:!text-muted-foreground",
          actionButton:
            "group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground !rounded-full !font-bold",
          cancelButton:
            "group-[.toast]:!bg-muted group-[.toast]:!text-muted-foreground !rounded-full",
          success: "[&_[data-icon]]:!text-emerald",
          error: "[&_[data-icon]]:!text-destructive",
          info: "[&_[data-icon]]:!text-sky",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
