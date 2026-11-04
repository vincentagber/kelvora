import React, { ReactNode } from "react";
import { Check, ChevronRight, ArrowLeft, ArrowRight, X } from "lucide-react";

/**
 * Represents an individual step item in the stepper.
 */
export interface StepperStep {
  /** Display label for the step (e.g. "Select", "Details", "Verify", "Finish") */
  label: string;
  /** Optional icon override for the step (e.g. Lucide icon component) */
  icon?: ReactNode | undefined;
  /** Optional subtitle or description */
  description?: string | undefined;
}

/**
 * Props for the Chevron Stepper component.
 */
export interface StepperProps {
  /** Array of step labels in sequential order (alternative to `steps`) */
  labels?: string[] | undefined;
  /** Rich step definitions including labels, icons, and descriptions */
  steps?: (string | StepperStep)[] | undefined;
  /** Current active step (1-based index: 1, 2, 3...) */
  currentStep: number;
  /** Array of step numbers that have been completed (e.g. [1, 2]) */
  completedSteps?: number[] | undefined;
  /** Callback fired when a clickable completed step is selected */
  onStepChange?: ((step: number) => void) | undefined;
  /** Optional custom icons for each step (array matching labels length) */
  icons?: ReactNode[] | undefined;
  /** Optional additional CSS classes for the container */
  className?: string | undefined;

  // Integrated Navigation Controls / Footer
  /** Whether to render the integrated navigation footer controls */
  showFooter?: boolean | undefined;
  /** Callback when user clicks 'Next Step' */
  onNext?: (() => void) | undefined;
  /** Callback when user clicks 'Previous' / 'Back' */
  onPrev?: (() => void) | undefined;
  /** Callback when user clicks 'Cancel' */
  onCancel?: (() => void) | undefined;
  /** Label for the next button (default: "Next Step →" or "Finish" on last step) */
  nextLabel?: string | undefined;
  /** Label for the previous button (default: "← Previous") */
  prevLabel?: string | undefined;
  /** Label for the cancel button (default: "← Cancel") */
  cancelLabel?: string | undefined;
  /** Disable the next button (e.g. while form is invalid) */
  isNextDisabled?: boolean | undefined;
  /** Disable the previous button */
  isPrevDisabled?: boolean | undefined;
  /** Loading state for the action button */
  isSubmitting?: boolean | undefined;
}

/**
 * Validates props and throws descriptive errors for invalid states.
 */
function validateStepperProps(
  labels: string[] | undefined,
  currentStep: number,
  steps?: (string | StepperStep)[] | undefined,
): number {
  const effectiveLength = steps ? steps.length : (labels ? labels.length : 0);

  if (effectiveLength === 0 || (!Array.isArray(labels) && !Array.isArray(steps))) {
    throw new TypeError(
      `Stepper: 'labels' must be a non-empty array of strings. Received: ${JSON.stringify(labels)}`,
    );
  }

  if (typeof currentStep !== "number" || Number.isNaN(currentStep)) {
    throw new TypeError(`Stepper: 'currentStep' must be a valid number. Received: ${currentStep}`);
  }

  if (currentStep < 1 || currentStep > effectiveLength) {
    throw new RangeError(
      `Stepper: 'currentStep' (${currentStep}) is out of bounds. Must be between 1 and ${effectiveLength}.`,
    );
  }

  return effectiveLength;
}

/**
 * Production-ready Chevron Stepper component matching the Kelvora visual language.
 *
 * Each step is rendered in one of three states:
 * - **completed**: Dark badge with emerald checkmark, subtle blue/slate background, clickable to navigate back.
 * - **active**: Distinct vibrant orange background (`#EA580C`), white bold text, marked with `aria-current="step"`.
 * - **upcoming**: Clean slate background, disabled and non-clickable, with chevron arrow dividers.
 *
 * Interlocking chevrons connect each step seamlessly across all states (completed, active, and upcoming)
 * with responsive horizontal scroll and full keyboard & ARIA accessibility.
 *
 * @example
 * ```tsx
 * <Stepper
 *   labels={["Select", "Details", "Verify", "Finish"]}
 *   currentStep={2}
 *   completedSteps={[1]}
 *   onStepChange={(step) => setStep(step)}
 *   showFooter
 *   onNext={() => handleNext()}
 *   onPrev={() => handlePrev()}
 *   onCancel={() => handleCancel()}
 * />
 * ```
 */
export const Stepper = ({
  labels,
  steps,
  currentStep,
  completedSteps = [],
  onStepChange,
  icons,
  className = "",
  showFooter = false,
  onNext,
  onPrev,
  onCancel,
  nextLabel,
  prevLabel = "← Back",
  cancelLabel = "← Cancel",
  isNextDisabled = false,
  isPrevDisabled = false,
  isSubmitting = false,
}: StepperProps) => {
  // Input prop validation and error handling
  const totalSteps = validateStepperProps(labels, currentStep, steps);

  // Normalize step definitions from either `steps` or `labels`
  const stepItems: StepperStep[] = steps
    ? steps.map((s, i) =>
        typeof s === "string"
          ? { label: s, icon: icons?.[i] }
          : { ...s, icon: s.icon ?? icons?.[i] },
      )
    : (labels ?? []).map((label, i) => ({
        label,
        icon: icons?.[i],
      }));

  const isStepCompleted = (step: number) => {
    return completedSteps.includes(step);
  };

  const isStepActive = (step: number) => step === currentStep;
  const isStepUpcoming = (step: number) => step > currentStep && !isStepCompleted(step);

  const handleStepClick = (stepNumber: number, isCompleted: boolean) => {
    // Only completed steps are clickable to navigate backwards in the flow
    if (isCompleted && onStepChange) {
      onStepChange(stepNumber);
    }
  };

  return (
    <div className={`stepper-container w-full space-y-4 ${className}`}>
      {/* ── Semantic Accessible Navigation Header ── */}
      <nav aria-label="Progress" className="w-full">
        <ol
          role="list"
          className="relative flex w-full items-stretch overflow-x-auto rounded-xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-2xs scrollbar-none"
        >
          {stepItems.map((item, index) => {
            const stepNumber = index + 1;
            const isCompleted = isStepCompleted(stepNumber);
            const isActive = isStepActive(stepNumber);
            const isUpcoming = isStepUpcoming(stepNumber);
            const isFirst = index === 0;
            const isLast = index === totalSteps - 1;

            // Stacking Order:
            // Active is topmost (30).
            // Upcoming steps descend in z-index (totalSteps - index) so preceding chevron points sit on top of succeeding notches.
            const zIndex = isActive ? 30 : totalSteps - index;

            // Chevron Clip-Path Geometry
            // First step: flat left, pointed right chevron
            // Middle steps: notched left, pointed right chevron
            // Last step: notched left, flat right
            const clipPath =
              totalSteps <= 1
                ? undefined
                : isFirst
                  ? "polygon(0% 0%, calc(100% - 13px) 0%, 100% 50%, calc(100% - 13px) 100%, 0% 100%)"
                  : isLast
                    ? "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 13px 50%)"
                    : "polygon(0% 0%, calc(100% - 13px) 0%, 100% 50%, calc(100% - 13px) 100%, 0% 100%, 13px 50%)";

            // Visual Styling by State
            let stateClasses = "";
            let badgeClasses = "";
            let textClasses = "";

            if (isActive) {
              // Vibrant Orange/Amber matching the reference design
              stateClasses =
                "bg-[#EA580C] text-white shadow-xs focus-visible:ring-2 focus-visible:ring-orange-400";
              badgeClasses = "bg-white text-[#EA580C] font-bold shadow-2xs";
              textClasses = "text-white font-bold tracking-tight";
            } else if (isCompleted) {
              // Subtle slate-blue / gray matching the reference design
              stateClasses =
                "bg-slate-200/85 hover:bg-slate-300/80 text-slate-800 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-slate-400";
              badgeClasses = "bg-slate-900 text-emerald-400 font-bold";
              textClasses = "text-slate-800 font-semibold";
            } else {
              // Upcoming step: muted, clean, non-clickable
              stateClasses = "bg-white/80 text-slate-500 opacity-90 cursor-not-allowed";
              badgeClasses = "bg-slate-200/90 text-slate-500 font-medium";
              textClasses = "text-slate-500 font-medium";
            }

            return (
              <li
                key={item.label}
                role="listitem"
                style={{ zIndex }}
                className={`group relative flex-1 min-w-[130px] sm:min-w-0 ${!isFirst ? "-ml-3 sm:-ml-3.5" : ""}`}
                aria-current={isActive ? "step" : undefined}
                aria-disabled={isUpcoming ? "true" : undefined}
              >
                <div
                  role={isCompleted ? "button" : undefined}
                  tabIndex={isCompleted ? 0 : -1}
                  aria-label={`Step ${stepNumber}: ${item.label} (${isActive ? "Current" : isCompleted ? "Completed" : "Upcoming"})`}
                  onClick={() => handleStepClick(stepNumber, isCompleted)}
                  onKeyDown={(e) => {
                    if (isCompleted && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleStepClick(stepNumber, isCompleted);
                    }
                  }}
                  style={{ clipPath }}
                  className={`step-chevron relative flex h-11 w-full items-center justify-center gap-2 px-4 transition-all select-none outline-none ${
                    isFirst ? "pl-3.5 pr-5" : isLast ? "pl-5 pr-3.5" : "pl-5 pr-5"
                  } ${stateClasses}`}
                >
                  {/* Step Badge / Icon */}
                  {isCompleted ? (
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] transition-transform ${badgeClasses}`}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3.5]" aria-hidden="true" />
                    </span>
                  ) : item.icon ? (
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center transition-transform ${
                        isActive ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {item.icon}
                    </span>
                  ) : (
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] transition-transform ${badgeClasses}`}
                    >
                      {stepNumber}
                    </span>
                  )}

                  {/* Step Label */}
                  <span className={`truncate text-xs sm:text-[13px] ${textClasses}`}>
                    {item.label}
                  </span>

                  {/* Interlocking Chevron Divider: draws visible chevron arrow between steps */}
                  {!isLast && !isActive && (
                    <svg
                      className="pointer-events-none absolute right-0 top-0 h-full w-[13px] text-slate-300/90 dark:text-slate-600"
                      viewBox="0 0 13 44"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M0.5 0 L12.5 22 L0.5 44"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ── Optional Navigation Controls / Footer Bar ── */}
      {(showFooter || onNext || onPrev || onCancel) && (
        <StepperFooter
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={onNext}
          onPrev={onPrev}
          onCancel={onCancel}
          nextLabel={nextLabel}
          prevLabel={prevLabel}
          cancelLabel={cancelLabel}
          isNextDisabled={isNextDisabled}
          isPrevDisabled={isPrevDisabled}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

/**
 * Props for the Stepper navigation footer.
 */
export interface StepperFooterProps {
  currentStep: number;
  totalSteps: number;
  onNext?: (() => void) | undefined;
  onPrev?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
  nextLabel?: string | undefined;
  prevLabel?: string | undefined;
  cancelLabel?: string | undefined;
  isNextDisabled?: boolean | undefined;
  isPrevDisabled?: boolean | undefined;
  isSubmitting?: boolean | undefined;
  className?: string | undefined;
}

/**
 * Reusable Footer Navigation Bar matching the reference design:
 * "Step X of Y" with "← Cancel" and "Next Step →" buttons.
 */
export const StepperFooter = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onCancel,
  nextLabel,
  prevLabel = "← Previous",
  cancelLabel = "← Cancel",
  isNextDisabled = false,
  isPrevDisabled = false,
  isSubmitting = false,
  className = "",
}: StepperFooterProps) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const resolvedNextLabel = nextLabel ?? (isLastStep ? "Complete" : "Next Step →");

  return (
    <div
      className={`stepper-footer flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 ${className}`}
    >
      {/* Step Counter Indicator */}
      <div className="text-xs font-semibold text-slate-500">
        Step <span className="text-slate-900 font-bold">{currentStep}</span> of{" "}
        <span className="text-slate-900 font-bold">{totalSteps}</span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        {/* Cancel / Previous Button */}
        {isFirstStep ? (
          onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer transition-colors"
            >
              {cancelLabel}
            </button>
          )
        ) : (
          (onPrev || onCancel) && (
            <button
              type="button"
              onClick={onPrev ?? onCancel}
              disabled={isPrevDisabled}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer transition-colors"
            >
              {prevLabel}
            </button>
          )
        )}

        {/* Next / Submit Button */}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isSubmitting}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] px-4 text-xs font-bold text-white shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer transition-colors"
          >
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing…</span>
              </>
            ) : (
              <span>{resolvedNextLabel}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
