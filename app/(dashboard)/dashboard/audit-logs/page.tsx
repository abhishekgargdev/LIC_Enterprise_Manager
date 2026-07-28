import { AuditLogTable } from "@/components/shared/AuditLogTable"
import { PageHeader } from "@/components/shared/PageHeader"
export default function AuditLogsPage() { return <div className="space-y-8"><PageHeader title="Audit log" description="Immutable record of administrative and operational changes." /><AuditLogTable /></div> }
