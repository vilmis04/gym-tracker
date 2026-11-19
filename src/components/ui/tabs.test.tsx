import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
  it("Tab focuses the active tab; arrow keys, Home and End switch tabs and panels", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="upcoming">
        <TabsList aria-label="Session lists">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="invitations">Invitations · 2</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">Upcoming list</TabsContent>
        <TabsContent value="past">Past list</TabsContent>
        <TabsContent value="invitations">Invitations list</TabsContent>
      </Tabs>,
    );
    expect(
      screen.getByRole("tablist", { name: "Session lists" }),
    ).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole("tab", { name: "Upcoming" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Past" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Past list");

    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Invitations · 2" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Invitations list");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Upcoming" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Upcoming list");
  });
});
