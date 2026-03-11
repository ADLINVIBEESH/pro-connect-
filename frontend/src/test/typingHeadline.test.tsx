import { useState } from "react";
import { act } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TypingHeadline from "@/components/profile-completion/TypingHeadline";

const TypingHeadlineHarness = () => {
  const [complete, setComplete] = useState(false);

  return (
    <div>
      <TypingHeadline text="Done typing" speedMs={1} onComplete={() => setComplete(true)} />
      <span>{complete ? "complete" : "pending"}</span>
    </div>
  );
};

describe("TypingHeadline", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("completes without triggering a render-phase update warning", () => {
    vi.stubEnv("MODE", "development");
    vi.useFakeTimers();

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<TypingHeadlineHarness />);
    expect(screen.getByText("pending")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(40);
    });

    expect(screen.getByText("complete")).toBeInTheDocument();

    const errorOutput = consoleError.mock.calls.flat().join(" ");
    expect(errorOutput).not.toContain("Cannot update a component");
  });
});
