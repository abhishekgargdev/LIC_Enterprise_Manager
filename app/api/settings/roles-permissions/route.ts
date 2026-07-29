import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  // Define static RBAC reference matrix
  const matrix = [
    {
      module: "Dashboard & Navigation",
      SUPER_ADMIN: "Full Access",
      REGIONAL_ADMIN: "Full Access",
      BRANCH_MANAGER: "Full Access",
      DEVELOPMENT_OFFICER: "Full Access",
      AGENT: "Full Access",
    },
    {
      module: "Regions",
      SUPER_ADMIN: "CRUD (All)",
      REGIONAL_ADMIN: "Read-Only (Own)",
      BRANCH_MANAGER: "No Access",
      DEVELOPMENT_OFFICER: "No Access",
      AGENT: "No Access",
    },
    {
      module: "Branches",
      SUPER_ADMIN: "CRUD (All)",
      REGIONAL_ADMIN: "CRUD (Own Region)",
      BRANCH_MANAGER: "Read-Only (Own)",
      DEVELOPMENT_OFFICER: "No Access",
      AGENT: "No Access",
    },
    {
      module: "Staff Provisioning (Users)",
      SUPER_ADMIN: "CRUD (All)",
      REGIONAL_ADMIN: "CRUD (Own Region)",
      BRANCH_MANAGER: "CRUD (Own Branch)",
      DEVELOPMENT_OFFICER: "CRUD (Own Agents)",
      AGENT: "No Access",
    },
    {
      module: "Customers",
      SUPER_ADMIN: "Full Access (All)",
      REGIONAL_ADMIN: "Read-Only (Region)",
      BRANCH_MANAGER: "Read-Only (Branch)",
      DEVELOPMENT_OFFICER: "Full Access (Direct Agents)",
      AGENT: "Full Access (Own Clients)",
    },
    {
      module: "Policies",
      SUPER_ADMIN: "Full Access (All)",
      REGIONAL_ADMIN: "Read-Only (Region)",
      BRANCH_MANAGER: "Read-Only (Branch)",
      DEVELOPMENT_OFFICER: "Full Access (Direct Agents)",
      AGENT: "Full Access (Own Policies)",
    },
    {
      module: "Premiums & Collections",
      SUPER_ADMIN: "Full Access (All)",
      REGIONAL_ADMIN: "Read-Only (Region)",
      BRANCH_MANAGER: "Read-Only (Branch)",
      DEVELOPMENT_OFFICER: "Full Access (Direct Agents)",
      AGENT: "Record Payment (Own)",
    },
    {
      module: "Commission Rules & Calculations",
      SUPER_ADMIN: "CRUD (All Rules)",
      REGIONAL_ADMIN: "CRUD (Region Rules)",
      BRANCH_MANAGER: "Read-Only (Own)",
      DEVELOPMENT_OFFICER: "Read-Only (Own)",
      AGENT: "Read-Only (Own)",
    },
    {
      module: "CRM Leads",
      SUPER_ADMIN: "Full Access (All)",
      REGIONAL_ADMIN: "Full Access (Region)",
      BRANCH_MANAGER: "Full Access (Branch)",
      DEVELOPMENT_OFFICER: "Full Access (Own)",
      AGENT: "No Access",
    },
    {
      module: "Claims Management",
      SUPER_ADMIN: "CRUD / Process",
      REGIONAL_ADMIN: "CRUD / Process (Region)",
      BRANCH_MANAGER: "Review / Approve (Branch)",
      DEVELOPMENT_OFFICER: "File Claims (Own)",
      AGENT: "File Claims (Own)",
    },
    {
      module: "Audit Logs",
      SUPER_ADMIN: "Read-Only (All)",
      REGIONAL_ADMIN: "Read-Only (Region)",
      BRANCH_MANAGER: "Read-Only (Branch)",
      DEVELOPMENT_OFFICER: "No Access",
      AGENT: "No Access",
    },
  ]

  return Response.json({
    success: true,
    data: matrix,
  })
}
