import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders label and invokes onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save draft</Button>);
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies outline variant class", () => {
    render(<Button variant="outline">Cancel</Button>);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("ui-button--outline");
  });
});
