import * as React from "react";
import { cn } from "@/lib/utils";

function Separator({ className, orientation = "horizontal", ...props }: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn("ui-separator", orientation === "horizontal" ? "ui-separator--horizontal" : "ui-separator--vertical", className)}
      {...props}
    />
  );
}

export { Separator };
