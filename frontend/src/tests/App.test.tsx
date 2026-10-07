import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App", () => {
  test("renders welcome message", () => {
    render(<App />);
    const welcomeElement = screen.getByText(/welcome to scope sense/i);
    expect(welcomeElement).toBeTruthy();
  });
});
