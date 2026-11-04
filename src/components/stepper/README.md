# Chevron Stepper Component (`Stepper`)

A reusable, accessible, and responsive multi-step navigation header styled with interlocking chevrons, matching the Kelvora visual design language.

## Visual Design

The chevron stepper implements a horizontal arrow pipeline where each step is connected via chevron arrows:
- **Completed Steps (`completed`)**: Rendered in soft slate/neutral (`bg-slate-200/85 text-slate-800`), decorated with an emerald circular checkmark badge (`bg-emerald-600 text-white`). Fully interactive and clickable to navigate back in the flow.
- **Active Step (`active`)**: Highlighted with high-contrast vibrant orange (`bg-[#EA580C] text-white font-bold`), marked with `aria-current="step"`, and elevated with prominent depth.
- **Upcoming Steps (`upcoming`)**: Clean, muted background (`bg-white/90 text-slate-400 font-medium`), disabled from direct interaction (`aria-disabled="true"`).

On mobile viewports, the component gracefully maintains responsive scrolling with clean touch-friendly tap targets.

---

## Props Reference (`StepperProps`)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `labels` | `string[]` | `undefined` | Array of step labels in sequential order (e.g. `["Select", "Details", "Verify", "Finish"]`). |
| `steps` | `(string \| StepperStep)[]` | `undefined` | Array of rich step objects with `label`, `icon`, and `description`. Alternative to `labels`. |
| `currentStep` | `number` | *Required* | 1-based index of the currently active step (must be between `1` and total steps count). |
| `completedSteps` | `number[]` | `[]` | Array of completed step numbers (e.g. `[1, 2]`). |
| `onStepChange` | `(step: number) => void` | `undefined` | Callback fired when user clicks a completed step to go back. |
| `icons` | `ReactNode[]` | `undefined` | Optional array of custom icons for each step. |
| `className` | `string` | `""` | Additional styling classes for the container. |
| `showFooter` | `boolean` | `false` | Whether to display the integrated navigation footer. |
| `onNext` | `() => void` | `undefined` | Fired when the "Next Step →" button is clicked. |
| `onPrev` | `() => void` | `undefined` | Fired when the "← Previous" button is clicked. |
| `onCancel` | `() => void` | `undefined` | Fired when the "← Cancel" button is clicked (on step 1). |
| `nextLabel` | `string` | `"Next Step →"` | Label for the forward action button (defaults to `"Complete"` on the last step). |
| `prevLabel` | `string` | `"← Back"` | Label for the backward button. |
| `cancelLabel` | `string` | `"← Cancel"` | Label for the abort button on the first step. |
| `isNextDisabled` | `boolean` | `false` | Disables the next action button (e.g., during validation). |
| `isPrevDisabled` | `boolean` | `false` | Disables the back action button. |
| `isSubmitting` | `boolean` | `false` | Shows a loading spinner in the next action button. |

---

## Usage Examples

### 1. Standalone Multi-Step Navigation Header
```tsx
import { Stepper } from "@/components/stepper/Stepper";

function ApprovalPipeline() {
  const [currentStep, setCurrentStep] = useState(2);
  const completedSteps = [1];

  return (
    <Stepper
      labels={["Submission", "Review", "Approval", "Completion"]}
      currentStep={currentStep}
      completedSteps={completedSteps}
      onStepChange={(step) => setCurrentStep(step)}
    />
  );
}
```

### 2. Full Modal Wizard with Controls
```tsx
import { Stepper } from "@/components/stepper/Stepper";

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const steps = ["Select", "Details", "Verify", "Finish"];
  const completed = Array.from({ length: step - 1 }, (_, i) => i + 1);

  return (
    <div className="p-6">
      <Stepper
        labels={steps}
        currentStep={step}
        completedSteps={completed}
        onStepChange={(s) => setStep(s)}
        showFooter
        onNext={() => {
          if (step < steps.length) setStep(step + 1);
          else onClose();
        }}
        onPrev={() => setStep(step - 1)}
        onCancel={onClose}
      />

      <div className="py-6">
        {step === 1 && <SelectStepContent />}
        {step === 2 && <DetailsStepContent />}
        {step === 3 && <VerifyStepContent />}
        {step === 4 && <FinishStepContent />}
      </div>
    </div>
  );
}
```

---

## Accessibility & Error Handling

- **Semantic HTML**: Renders `<nav aria-label="Progress">` wrapping `<ol role="list">` and `<li>` items.
- **Screen Reader Announcements**:
  - Sets `aria-current="step"` on the active step.
  - Sets `aria-disabled="true"` on upcoming steps.
  - Descriptive `aria-label` announcing step order, name, and state.
- **Keyboard Navigation**:
  - Clickable completed steps have `tabIndex={0}` and respond to `Enter` and `Space`.
  - Non-clickable upcoming steps have `tabIndex={-1}`.
- **Fail-Safe Validation**:
  - Throws `RangeError` if `currentStep < 1` or `currentStep > labels.length`.
  - Throws `TypeError` if `labels` is empty or not an array.
