import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { Stepper, StepperFooter } from "./Stepper.tsx";

describe("Chevron Stepper Component", () => {
  const defaultProps = {
    labels: ["Select", "Details", "Verify", "Finish"],
    currentStep: 2,
    completedSteps: [1],
  };

  // 1. Rendering & Structure
  it("renders an accessible navigation container with an ordered list", () => {
    const vdom = Stepper(defaultProps);
    assert.ok(vdom);
    assert.equal(vdom.type, "div");

    // Children: [nav, footer]
    const nav = vdom.props.children[0];
    assert.equal(nav.type, "nav");
    assert.equal(nav.props["aria-label"], "Progress");

    const ol = nav.props.children;
    assert.equal(ol.type, "ol");
    assert.equal(ol.props.role, "list");
    assert.equal(ol.props.children.length, 4);
  });

  // 2. Step States & ARIA Attributes
  it("correctly identifies and attributes active, completed, and upcoming step states", () => {
    const vdom = Stepper({
      labels: ["Select", "Details", "Verify", "Finish"],
      currentStep: 2,
      completedSteps: [1],
    });

    const ol = vdom.props.children[0].props.children;
    const items = ol.props.children;

    // Step 1: Completed
    assert.equal(items[0].props["aria-current"], undefined);
    assert.equal(items[0].props["aria-disabled"], undefined);
    const step1Div = items[0].props.children;
    assert.equal(step1Div.props.role, "button");
    assert.equal(step1Div.props.tabIndex, 0);
    assert.ok(step1Div.props.className.includes("bg-slate-200"));

    // Step 2: Active
    assert.equal(items[1].props["aria-current"], "step");
    assert.equal(items[1].props["aria-disabled"], undefined);
    const step2Div = items[1].props.children;
    assert.equal(step2Div.props.role, undefined);
    assert.equal(step2Div.props.tabIndex, -1);
    assert.ok(step2Div.props.className.includes("bg-[#EA580C]"));

    // Step 3: Upcoming
    assert.equal(items[2].props["aria-current"], undefined);
    assert.equal(items[2].props["aria-disabled"], "true");
    const step3Div = items[2].props.children;
    assert.equal(step3Div.props.role, undefined);
    assert.equal(step3Div.props.tabIndex, -1);
    assert.ok(step3Div.props.className.includes("cursor-not-allowed"));
  });

  // 3. Click-to-Go-Back Behavior
  it("triggers onStepChange when clicking completed steps, but ignores upcoming steps", () => {
    const changes: number[] = [];
    const vdom = Stepper({
      labels: ["Select", "Details", "Verify", "Finish"],
      currentStep: 3,
      completedSteps: [1, 2],
      onStepChange: (step) => changes.push(step),
    });

    const ol = vdom.props.children[0].props.children;
    const items = ol.props.children;

    // Click step 1 (completed): should trigger onStepChange(1)
    items[0].props.children.props.onClick();
    assert.deepEqual(changes, [1]);

    // Click step 2 (completed): should trigger onStepChange(2)
    items[1].props.children.props.onClick();
    assert.deepEqual(changes, [1, 2]);

    // Click step 3 (active): should NOT trigger step change
    items[2].props.children.props.onClick();
    assert.deepEqual(changes, [1, 2]);

    // Click step 4 (upcoming): should NOT trigger step change
    items[3].props.children.props.onClick();
    assert.deepEqual(changes, [1, 2]);
  });

  // 4. Keyboard Navigation
  it("supports keyboard navigation (Enter & Space) for completed steps", () => {
    const changes: number[] = [];
    const vdom = Stepper({
      labels: ["Select", "Details", "Verify", "Finish"],
      currentStep: 3,
      completedSteps: [1, 2],
      onStepChange: (step) => changes.push(step),
    });

    const step1Div = vdom.props.children[0].props.children.props.children[0].props.children;

    let prevented = false;
    const enterEvent = {
      key: "Enter",
      preventDefault: () => {
        prevented = true;
      },
    };
    step1Div.props.onKeyDown(enterEvent);
    assert.ok(prevented);
    assert.deepEqual(changes, [1]);

    prevented = false;
    const spaceEvent = {
      key: " ",
      preventDefault: () => {
        prevented = true;
      },
    };
    step1Div.props.onKeyDown(spaceEvent);
    assert.ok(prevented);
    assert.deepEqual(changes, [1, 1]);

    // Other keys (e.g. Tab or Escape) should not trigger onStepChange
    prevented = false;
    step1Div.props.onKeyDown({
      key: "Escape",
      preventDefault: () => {
        prevented = true;
      },
    });
    assert.equal(prevented, false);
    assert.deepEqual(changes, [1, 1]);
  });

  // 5. Error Handling for Invalid Props
  describe("Error Handling", () => {
    it("throws RangeError when currentStep is less than 1", () => {
      assert.throws(
        () => Stepper({ labels: ["A", "B", "C"], currentStep: 0, completedSteps: [] }),
        (err) => err instanceof RangeError && err.message.includes("out of bounds"),
      );
    });

    it("throws RangeError when currentStep exceeds total labels count", () => {
      assert.throws(
        () => Stepper({ labels: ["A", "B", "C"], currentStep: 4, completedSteps: [] }),
        (err) => err instanceof RangeError && err.message.includes("out of bounds"),
      );
    });

    it("throws TypeError when labels is empty or not an array", () => {
      assert.throws(
        () => Stepper({ labels: [], currentStep: 1, completedSteps: [] }),
        (err) => err instanceof TypeError && err.message.includes("non-empty array"),
      );
      assert.throws(
        () => Stepper({ labels: null as unknown as string[], currentStep: 1, completedSteps: [] }),
        (err) => err instanceof TypeError,
      );
    });

    it("throws TypeError when currentStep is not a valid number", () => {
      assert.throws(
        () => Stepper({ labels: ["A", "B"], currentStep: NaN, completedSteps: [] }),
        (err) => err instanceof TypeError && err.message.includes("valid number"),
      );
    });
  });

  // 6. Navigation Controls & Footer
  describe("StepperFooter Integration", () => {
    it("renders footer with Step X of Y, cancel, and next buttons", () => {
      let nextClicked = false;
      let cancelClicked = false;

      const footer = StepperFooter({
        currentStep: 1,
        totalSteps: 4,
        onNext: () => {
          nextClicked = true;
        },
        onCancel: () => {
          cancelClicked = true;
        },
      });

      assert.ok(footer);
      // Verify text indicator
      const counterDiv = footer.props.children[0];
      assert.equal(counterDiv.props.children[1].props.children, 1);
      assert.equal(counterDiv.props.children[4].props.children, 4);

      // Verify action buttons
      const buttonsContainer = footer.props.children[1];
      const cancelBtn = buttonsContainer.props.children[0];
      const nextBtn = buttonsContainer.props.children[1];

      cancelBtn.props.onClick();
      assert.ok(cancelClicked);

      nextBtn.props.onClick();
      assert.ok(nextClicked);
    });

    it("displays 'Previous' instead of 'Cancel' when past step 1", () => {
      let prevClicked = false;
      const footer = StepperFooter({
        currentStep: 2,
        totalSteps: 4,
        onPrev: () => {
          prevClicked = true;
        },
      });

      const buttonsContainer = footer.props.children[1];
      const prevBtn = buttonsContainer.props.children[0];
      assert.equal(prevBtn.props.children, "← Previous");
      prevBtn.props.onClick();
      assert.ok(prevClicked);
    });

    it("displays 'Complete' on the final step by default", () => {
      const footer = StepperFooter({
        currentStep: 4,
        totalSteps: 4,
        onNext: () => {},
      });

      const buttonsContainer = footer.props.children[1];
      const nextBtn = buttonsContainer.props.children[1];
      assert.equal(nextBtn.props.children.props.children, "Complete");
    });
  });

  // 7. Rich Steps & Custom Icons (Matching Reference Design 2)
  describe("Rich Steps, Custom Icons & Visual Chevron Dividers", () => {
    it("renders custom icons for each step and preserves z-index stacking order", () => {
      const vdom = Stepper({
        steps: [
          { label: "Chambers & Branding" },
          { label: "Meeting Specs & Rules" },
          { label: "Practice Areas / Services" },
          { label: "Time Slots" },
          { label: "Intake Form & Notice" },
        ],
        currentStep: 2,
        completedSteps: [1],
      });

      const items = vdom.props.children[0].props.children.props.children;
      assert.equal(items.length, 5);

      // Verify active step (index 1) has topmost z-index 30
      assert.equal(items[1].props.style.zIndex, 30);

      // Verify upcoming steps descend in z-index so preceding chevrons sit on top
      assert.equal(items[2].props.style.zIndex, 3);
      assert.equal(items[3].props.style.zIndex, 2);
      assert.equal(items[4].props.style.zIndex, 1);

      // Verify SVG chevron divider exists on non-last, non-active step
      const step3Div = items[2].props.children;
      const svgDivider = step3Div.props.children[2];
      assert.ok(svgDivider);
      assert.equal(svgDivider.type, "svg");

      // Verify last step does not have an outgoing divider
      const step5Div = items[4].props.children;
      const step5Divider = step5Div.props.children[2];
      assert.equal(step5Divider, false);
    });
  });
});
