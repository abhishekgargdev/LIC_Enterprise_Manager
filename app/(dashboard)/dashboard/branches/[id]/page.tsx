import { BranchPerformance } from "@/components/shared/BranchPerformance"
export default async function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <BranchPerformance branchId={id} /> }
