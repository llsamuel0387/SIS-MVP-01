import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ui-button",
  {
    variants: {
      variant: {
        default: "ui-button--default",
        secondary: "ui-button--secondary",
        outline: "ui-button--outline",
        ghost: "ui-button--ghost"
      },
      size: {
        default: "ui-button--size-default",
        sm: "ui-button--size-sm",
        lg: "ui-button--size-lg",
        icon: "ui-button--size-icon"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
