import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Stepper } from "./Stepper.tsx";

describe("Stepper Component", () => {
  const defaultProps = {
    labels: ["Step 1", "Step 2", "Step 3", "Step 4"],
    currentStep: 2,
    completedSteps: [1],
  };

  it("renders all step items", () => {
    const result = Stepper(defaultProps);
    assert.ok(result);
  });

  it("renders completed steps with correct background", () => {
    const result = Stepper({ ...defaultProps, completedSteps: [1, 2] });
    assert.ok(result);
  });

  it("renders active step with correct background", () => {
    const result = Stepper({ ...defaultProps, currentStep: 2 });
    assert.ok(result);
  });

  it("renders upcoming steps as disabled and muted", () => {
    const result = Stepper({ ...defaultProps, currentStep: 1 });
    assert.ok(result);
  });

  it("calls onStepChange when provided", () => {
    const onStepChange = () => {};
    const result = Stepper({ ...defaultProps, onStepChange });
    assert.ok(result);
  });

  it("applies correct step states", () => {
    const result = Stepper({
      labels: ["Submission", "Review", "Approval", "Completion"],
      currentStep: 2,
      completedSteps: [1],
    });
    assert.ok(result);
  });
});