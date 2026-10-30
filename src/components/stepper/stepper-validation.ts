import { z } from "zod";

export const StepperItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  state: z.enum(["completed", "active", "upcoming"]),
});

export const StepperSchema = z.object({
  labels: z.array(z.string().min(1)).nonempty("At least one label is required"),
  currentStep: z.number().int().min(1),
  completedSteps: z.array(z.number().int()).default([]),
  onStepChange: z.function().optional(),
});

export type StepperItem = z.infer<typeof StepperItemSchema>;
export type StepperProps = z.infer<typeof StepperSchema>;