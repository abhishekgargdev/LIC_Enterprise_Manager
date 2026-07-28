import { CalendarView } from "@/components/shared/CalendarView"
import { PageHeader } from "@/components/shared/PageHeader"
export default function CalendarPage() { return <div className="space-y-8"><PageHeader title="Calendar" description="Premiums, meetings, birthdays, maturities, and claims in one view." /><CalendarView /></div> }
