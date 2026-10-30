# Kelvora

An enterprise-grade procurement management and approval orchestration platform built for high-throughput procurement operations.

## Features

- **Multi-Tenant Procurement Workflows**: Requisition submission, multi-tier budget approvals, purchase order generation, and delivery verification.
- **Cryptographic Audit Ledger**: Tamper-evident hash-chained audit logging for regulatory compliance and audit trails.
- **Automated Communication**: Notification dispatchers for email, SMS, and WhatsApp alerts.
- **Multi-Gateway Payment Integration**: Direct settlement tracking with Monnify, Paystack, and manual bank transfer verification workflows.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across Requestors, Approvers, Procurement Officers, and Finance Managers.

## Tech Stack

- **Framework**: TanStack Start + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Radix UI + Lucide Icons
- **Backend & Auth**: Supabase (PostgreSQL, Realtime, Row Level Security)
- **Deployment**: Render / Node.js Server

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run test suite
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Global Notification Modals

`NotificationModalProvider` is mounted in the application root. Any component beneath it can call `useNotificationModal()` to show a typed modal. Message text can be built from API responses or current records instead of hardcoding it:

```tsx
import { useNotificationModal } from "@/components/ui/notification-modal";

function RequisitionActions({ requisition }: { requisition: { reference: string } }) {
	const notifications = useNotificationModal();

	async function submit() {
		try {
			const result = await submitRequisition(requisition.reference);
			notifications.success(`Requisition ${result.reference} was submitted.`, {
				title: "Requisition submitted",
				durationMs: 4000,
			});
		} catch (error) {
			notifications.error(error instanceof Error ? error.message : "Submission failed.", {
				title: `Could not submit ${requisition.reference}`,
			});
		}
	}

	return <button onClick={submit}>Submit requisition</button>;
}
```

Use `notifications.warning(message)` and `notifications.info(message)` for the other variants. `durationMs` controls auto-dismiss; omit it or pass `null` to keep a modal open until dismissed. New notifications replace the currently displayed one.
