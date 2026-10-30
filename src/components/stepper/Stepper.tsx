import { ReactNode } from "react";

export interface StepperItem {
  label: string;
  state: "completed" | "active" | "upcoming";
}

export interface StepperProps {
  labels: string[];
  currentStep: number;
  completedSteps: number[];
  onStepChange?: (step: number) => void;
}

export const Stepper = ({
  labels,
  currentStep,
  completedSteps,
  onStepChange,
}: StepperProps) => {
  const totalSteps = labels.length;
  const isStepCompleted = (step: number) =>
    completedSteps.includes(step);
  const isStepActive = (step: number) =>
    step === currentStep && !isStepCompleted(step);
  const isStepUpcoming = (step: number) =>
    step > currentStep && !isStepCompleted(step);

  return (
    <ol
      role="list"
      className="flex flex-wrap gap-2 justify-center py-4 overflow-x-auto"
    >
      {labels.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = isStepCompleted(index);
        const isActive = isStepActive(index);
        const isUpcoming = isStepUpcoming(index);

        const getClasses = () => {
          if (isCompleted) {
            return "completed flex-1 bg-[#0B1457] text-white rounded-md";
          }
          if (isActive) {
            return "active flex-1 bg-[#0001FF] text-white rounded-md";
          }
          if (isUpcoming) {
            return "upcoming flex-1 bg-slate-100 text-slate-500 rounded-md opacity-60 cursor-not-allowed";
          }
          return "";
        };

        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (onStepChange && !isUpcoming) {
            onStepChange(stepNumber);
          }
        };

        return (
          <li
            key={index}
            className="list-item"
            role="listitem"
            aria-current={stepNumber === currentStep ? "step" : undefined}
            aria-disabled={isUpcoming || isCompleted ? "true" : undefined}
            style={{ flexGrow: "1" }}
          >
            <div
              className={`step-wrapper ${getClasses()}`}
              onClick={handleClick}
              role="button"
              tabIndex={isUpcoming ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(e as unknown as React.MouseEvent);
                }
              }}
            >
              <span className="step-number">{stepNumber}</span>
              <span className="step-label">{label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
};