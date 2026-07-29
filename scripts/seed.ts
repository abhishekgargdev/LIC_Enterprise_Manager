import fs from "fs"
import path from "path"
import mongoose from "mongoose"
import { hash } from "bcryptjs"
import { User } from "@/models/User"
import { Region } from "@/models/Region"
import { Branch } from "@/models/Branch"
import { Customer } from "@/models/Customer"
import { Policy } from "@/models/Policy"
import { Premium } from "@/models/Premium"
import { Commission } from "@/models/Commission"
import { CommissionRule } from "@/models/CommissionRule"
import { Lead } from "@/models/Lead"
import { Claim } from "@/models/Claim"
import { Task } from "@/models/Task"
import { Notification } from "@/models/Notification"
import { AuditLog } from "@/models/AuditLog"
import { PolicyHistory } from "@/models/PolicyHistory"
import { PolicyTemplate } from "@/models/PolicyTemplate"

// Load env variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf-8")
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const parts = trimmed.split("=")
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const val = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "")
      process.env[key] = val
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env.local")
  process.exit(1)
}

async function main() {
  console.log("Connecting to MongoDB...")
  await mongoose.connect(MONGODB_URI!)
  console.log("Connected successfully.")

  // Clean all collections
  const collections = [
    User,
    Region,
    Branch,
    Customer,
    Policy,
    Premium,
    Commission,
    CommissionRule,
    Lead,
    Claim,
    Task,
    Notification,
    AuditLog,
    PolicyHistory,
    PolicyTemplate,
  ]

  console.log("Cleaning database collections and dropping indexes...")
  for (const col of collections) {
    await col.collection.drop().catch(() => {})
    console.log(`Cleaned and dropped collection/indexes for ${col.modelName}`)
  }

  // Hash passwords
  console.log("Generating passwords...")
  const passwordHash = await hash("password123", 12)

  // 1. Seed Super Admin
  console.log("Seeding Super Admin...")
  const superAdmin = await User.create({
    name: "Super Admin",
    email: "admin@lic.local",
    passwordHash,
    role: "SUPER_ADMIN",
    employeeCode: "EMP-2026-0001",
    phone: "9876543210",
    avatarUrl: "",
    isActive: true,
    joiningDate: new Date("2024-01-01"),
  })

  // 2. Seed Region
  console.log("Seeding Region...")
  const region = await Region.create({
    name: "North Zone",
    code: "NORTH",
    isActive: true,
  })

  // 3. Seed Regional Admin
  console.log("Seeding Regional Admin...")
  const regionalAdmin = await User.create({
    name: "Regional Admin North",
    email: "regional@lic.local",
    passwordHash,
    role: "REGIONAL_ADMIN",
    employeeCode: "EMP-2026-0002",
    phone: "9876543211",
    region: "NORTH",
    isActive: true,
    joiningDate: new Date("2024-03-01"),
  })
  
  // Link Regional Admin to Region
  await Region.findByIdAndUpdate(region._id, { regionalAdmin: regionalAdmin._id })

  // 4. Seed Branches
  console.log("Seeding Branches...")
  const branchMumb = await Branch.create({
    name: "Mumbai South",
    code: "MUM-S",
    region: "NORTH",
    address: "123 Nariman Point, Mumbai, MH",
    isActive: true,
  })

  const branchDel = await Branch.create({
    name: "Delhi North",
    code: "DEL-N",
    region: "NORTH",
    address: "456 Connaught Place, New Delhi, DL",
    isActive: true,
  })

  // 5. Seed Branch Managers
  console.log("Seeding Branch Managers...")
  const bmMumbai = await User.create({
    name: "Branch Manager Mumbai",
    email: "bm_mumbai@lic.local",
    passwordHash,
    role: "BRANCH_MANAGER",
    employeeCode: "EMP-2026-0003",
    phone: "9876543212",
    branch: "MUM-S",
    isActive: true,
    joiningDate: new Date("2024-06-01"),
  })

  const bmDelhi = await User.create({
    name: "Branch Manager Delhi",
    email: "bm_delhi@lic.local",
    passwordHash,
    role: "BRANCH_MANAGER",
    employeeCode: "EMP-2026-0004",
    phone: "9876543213",
    branch: "DEL-N",
    isActive: true,
    joiningDate: new Date("2024-06-15"),
  })

  // Link Managers to Branches
  await Branch.findByIdAndUpdate(branchMumb._id, { branchManager: bmMumbai._id })
  await Branch.findByIdAndUpdate(branchDel._id, { branchManager: bmDelhi._id })

  // 6. Seed Development Officers
  console.log("Seeding Development Officers...")
  const doMumbai = await User.create({
    name: "Dev Officer Mumbai",
    email: "do_mumbai@lic.local",
    passwordHash,
    role: "DEVELOPMENT_OFFICER",
    employeeCode: "EMP-2026-0005",
    phone: "9876543214",
    branch: "MUM-S",
    isActive: true,
    joiningDate: new Date("2025-01-01"),
  })

  const doDelhi = await User.create({
    name: "Dev Officer Delhi",
    email: "do_delhi@lic.local",
    passwordHash,
    role: "DEVELOPMENT_OFFICER",
    employeeCode: "EMP-2026-0006",
    phone: "9876543215",
    branch: "DEL-N",
    isActive: true,
    joiningDate: new Date("2025-01-10"),
  })

  // 7. Seed Agents
  console.log("Seeding Agents...")
  const agents = []
  const agentNames = [
    { name: "Agent Mumbai One", email: "agent_m1@lic.local", code: "AGT-2026-0001", do: doMumbai, br: "MUM-S" },
    { name: "Agent Mumbai Two", email: "agent_m2@lic.local", code: "AGT-2026-0002", do: doMumbai, br: "MUM-S" },
    { name: "Agent Mumbai Three", email: "agent_m3@lic.local", code: "AGT-2026-0003", do: doMumbai, br: "MUM-S" },
    { name: "Agent Delhi One", email: "agent_d1@lic.local", code: "AGT-2026-0004", do: doDelhi, br: "DEL-N" },
    { name: "Agent Delhi Two", email: "agent_d2@lic.local", code: "AGT-2026-0005", do: doDelhi, br: "DEL-N" },
    { name: "Agent Delhi Three", email: "agent_d3@lic.local", code: "AGT-2026-0006", do: doDelhi, br: "DEL-N" },
  ]

  for (const ag of agentNames) {
    const user = await User.create({
      name: ag.name,
      email: ag.email,
      passwordHash,
      role: "AGENT",
      agentCode: ag.code,
      phone: "987654" + ag.code.split("-").at(-1),
      branch: ag.br,
      manager: ag.do._id,
      isActive: true,
      joiningDate: new Date("2025-02-01"),
    })
    agents.push(user)
  }

  // 8. Seed Commission Rules
  console.log("Seeding Commission Rules...")
  await CommissionRule.create([
    { appliesTo: "GLOBAL", agentPercent: 15, managerPercent: 5, branchPercent: 2, effectiveFrom: new Date("2024-01-01"), isActive: true },
    { appliesTo: "PLAN", planName: "JEEVAN_ANAND", agentPercent: 18, managerPercent: 6, branchPercent: 3, effectiveFrom: new Date("2024-01-01"), isActive: true },
    { appliesTo: "BRANCH", branch: branchMumb._id, agentPercent: 16, managerPercent: 5.5, branchPercent: 2.5, effectiveFrom: new Date("2024-01-01"), isActive: true },
  ])

  // 9. Seed Customers
  console.log("Seeding Customers...")
  const customers = []
  const cities = ["Mumbai", "Navi Mumbai", "Thane", "Delhi", "Noida", "Gurugram"]
  
  // Seed 30 customers (5 per agent)
  for (let i = 1; i <= 30; i++) {
    const agentIndex = Math.floor((i - 1) / 5)
    const agent = agents[agentIndex]
    const branchObj = agent.branch === "MUM-S" ? branchMumb : branchDel
    const gender = i % 2 === 0 ? "FEMALE" : "MALE"
    const birthYear = 1970 + (i % 25)
    const birthMonth = (i % 12)
    const birthDay = 1 + (i % 28)

    const customer = await Customer.create({
      name: `Customer Name ${i}`,
      dob: new Date(birthYear, birthMonth, birthDay),
      gender,
      mobile: `99001122${String(i).padStart(2, "0")}`,
      email: `customer${i}@example.com`,
      address: {
        line1: `${i * 10} Main Street`,
        line2: "Apartment " + (i * 3),
        city: cities[agentIndex],
        state: agent.branch === "MUM-S" ? "Maharashtra" : "Delhi",
        pincode: agent.branch === "MUM-S" ? "400001" : "110001",
      },
      aadhaarNumber: `4567890123${String(i).padStart(2, "0")}`,
      panNumber: `ABCDE${String(i).padStart(2, "0")}12F`,
      occupation: i % 3 === 0 ? "Business" : i % 3 === 1 ? "Salaried" : "Professional",
      annualIncome: 300000 + (i * 25000),
      nominee: {
        name: `Nominee Name ${i}`,
        relation: i % 3 === 0 ? "Spouse" : i % 3 === 1 ? "Son" : "Daughter",
        dob: new Date(birthYear + 25, birthMonth, birthDay),
      },
      agent: agent._id,
      branch: branchObj._id,
      isActive: true,
      notes: "Seeded mock customer details.",
    })
    customers.push(customer)
  }

  // 10. Seed Policies & Premiums & Commissions
  console.log("Seeding Policies, Premiums, and Commissions...")
  const plans = ["JEEVAN_ANAND", "JEEVAN_LAKSHYA", "JEEVAN_UMANG", "JEEVAN_LABH"]
  const modes = ["YEARLY", "HALF_YEARLY", "QUARTERLY", "MONTHLY"]
  let policyCount = 0

  for (let cIdx = 0; cIdx < customers.length; cIdx++) {
    const customer = customers[cIdx]
    const agent = agents[Math.floor(cIdx / 5)]
    const branchObj = agent.branch === "MUM-S" ? branchMumb : branchDel
    
    // Each customer gets 1 or 2 policies
    const policiesToCreate = (cIdx % 3 === 0) ? 2 : 1
    
    for (let p = 0; p < policiesToCreate; p++) {
      policyCount++
      const planName = plans[(cIdx + p) % plans.length]
      const premiumMode = modes[(cIdx + p) % modes.length]
      const policyTerm = 10 + ((cIdx + p) % 3) * 5 // 10, 15, 20 years
      const sumAssured = 200000 + ((cIdx + p) % 5) * 100000 // 200k to 600k
      const premiumAmount = Math.round(sumAssured / (policyTerm * (premiumMode === "YEARLY" ? 1.5 : premiumMode === "HALF_YEARLY" ? 3 : premiumMode === "QUARTERLY" ? 6 : 18)))
      
      // Determine start date to create historical premiums
      // Policy 1: Started 1.5 years ago (ACTIVE)
      // Policy 2: Started 6 months ago (DUE / OVERDUE)
      // Policy 3: Started 2 years ago (LAPSED)
      // Policy 4: Started 10 years ago (MATURED)
      let startDate = new Date()
      let status: "ACTIVE" | "PENDING" | "LAPSED" | "EXPIRED" | "MATURED" | "CANCELLED" | "CLAIM_SETTLED" = "ACTIVE"

      if (policyCount % 7 === 1) {
        // Started 1.5 years ago
        startDate = new Date(Date.now() - 540 * 24 * 60 * 60 * 1000)
        status = "ACTIVE"
      } else if (policyCount % 7 === 2) {
        // Started 6 months ago
        startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
        status = "ACTIVE"
      } else if (policyCount % 7 === 3) {
        // Started 1 year ago, but lapsed
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        status = "LAPSED"
      } else if (policyCount % 7 === 4) {
        // Matured policy
        startDate = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
        status = "MATURED"
      } else if (policyCount % 7 === 5) {
        // Claim Settled
        startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)
        status = "CLAIM_SETTLED"
      } else {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        status = "ACTIVE"
      }

      const maturityDate = new Date(startDate)
      maturityDate.setFullYear(maturityDate.getFullYear() + policyTerm)

      const policyNum = `POL-${2026 - (policyCount % 5)}-${String(policyCount).padStart(4, "0")}`

      const policy = await Policy.create({
        policyNumber: policyNum,
        customer: customer._id,
        agent: agent._id,
        manager: agent.manager,
        branch: branchObj._id,
        planName,
        policyTerm,
        premiumAmount,
        premiumMode,
        sumAssured,
        startDate,
        maturityDate,
        status,
        lastPremiumPaidDate: status === "MATURED" || status === "CLAIM_SETTLED" ? new Date() : undefined,
      })

      // Generate Premiums schedule
      const intervalMonths = premiumMode === "YEARLY" ? 12 : premiumMode === "HALF_YEARLY" ? 6 : premiumMode === "QUARTERLY" ? 3 : 1
      const totalInstallments = status === "MATURED" ? policyTerm * (12 / intervalMonths) : 6 // seed first 6 installments for others

      let lastPaid: Date | undefined = undefined

      for (let inst = 0; inst < totalInstallments; inst++) {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + inst * intervalMonths)

        // Skip future dues for lapsed policies to simulate lapse state
        if (status === "LAPSED" && dueDate > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) && inst >= 2) {
          // Missed installment
          await Premium.create({
            policy: policy._id,
            dueDate,
            amount: premiumAmount,
            status: "MISSED",
          })
          continue
        }

        // Determine premium status based on dates
        let premStatus: "PAID" | "DUE" | "OVERDUE" | "MISSED" = "DUE"
        let paidDate: Date | undefined = undefined

        if (status === "MATURED" || status === "CLAIM_SETTLED" || dueDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
          premStatus = "PAID"
          paidDate = new Date(dueDate)
          paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 10)) // paid a few days late
          lastPaid = paidDate
        } else if (dueDate < new Date()) {
          premStatus = "OVERDUE"
        } else {
          premStatus = "DUE"
        }

        const premium = await Premium.create({
          policy: policy._id,
          dueDate,
          amount: premiumAmount,
          status: premStatus,
          paidDate,
          paidMode: premStatus === "PAID" ? ["CASH", "ONLINE", "UPI", "CHEQUE"][inst % 4] : undefined,
          receiptNumber: premStatus === "PAID" ? `REC-${policyNum.split("-").at(-1)}-${inst}` : undefined,
          recordedBy: premStatus === "PAID" ? agent._id : undefined,
        })

        // Seed Commission if paid
        if (premStatus === "PAID") {
          const ruleAgent = 15
          const ruleManager = 5
          const ruleBranch = 2
          
          await Commission.create({
            premium: premium._id,
            policy: policy._id,
            agent: agent._id,
            manager: agent.manager,
            branch: branchObj._id,
            premiumAmount,
            agentAmount: Math.round((premiumAmount * ruleAgent) / 100),
            managerAmount: Math.round((premiumAmount * ruleManager) / 100),
            branchAmount: Math.round((premiumAmount * ruleBranch) / 100),
            calculatedAt: paidDate,
            status: "CREDITED",
          })
        }
      }

      if (lastPaid) {
        await Policy.findByIdAndUpdate(policy._id, { lastPremiumPaidDate: lastPaid })
      }
    }
  }

  // 11. Seed CRM Leads
  console.log("Seeding Leads...")
  const leadStages = ["NEW", "CONTACTED", "MEETING_SCHEDULED", "PROPOSAL_SUBMITTED", "NEGOTIATION", "CONVERTED", "LOST"]
  for (let i = 1; i <= 12; i++) {
    const agent = agents[i % agents.length]
    const stage = leadStages[i % leadStages.length]
    const nextFollowUpDate = new Date()
    nextFollowUpDate.setDate(nextFollowUpDate.getDate() + (i % 5))

    let convertedToCustomer = undefined
    if (stage === "CONVERTED") {
      convertedToCustomer = customers[i % customers.length]._id
    }

    await Lead.create({
      name: `Prospect Lead ${i}`,
      mobile: `98760011${String(i).padStart(2, "0")}`,
      email: `prospect${i}@example.com`,
      source: ["REFERRAL", "WALK_IN", "PHONE", "OTHER"][i % 4],
      interestedPlan: plans[i % plans.length],
      stage,
      agent: agent._id,
      notes: [
        { text: "Initial phone call inquiry.", createdBy: agent._id, createdAt: new Date() },
        { text: "Expressed interest in savings plans.", createdBy: agent._id, createdAt: new Date() }
      ],
      nextFollowUpDate: stage !== "CONVERTED" && stage !== "LOST" ? nextFollowUpDate : undefined,
      convertedToCustomer,
      lostReason: stage === "LOST" ? "Found premium quote too high relative to competitors." : undefined,
    })
  }

  // 12. Seed Claims
  console.log("Seeding Claims...")
  // Find policies that are matured or claims-ready
  const maturedPolicies = await Policy.find({ status: "MATURED" })
  const claimStatuses = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SETTLED"]
  
  for (let i = 0; i < maturedPolicies.length; i++) {
    const policy = maturedPolicies[i]
    const customer = await Customer.findById(policy.customer)
    const status = claimStatuses[i % claimStatuses.length]
    
    const claim = await Claim.create({
      claimNumber: `CLM-2026-${String(i+1).padStart(4, "0")}`,
      policy: policy._id,
      customer: customer?._id,
      claimType: "MATURITY",
      claimAmount: policy.sumAssured,
      description: "Policy matured. Requesting full sum assured payout.",
      filedBy: policy.agent,
      filedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      status,
      approvedAmount: ["APPROVED", "SETTLED"].includes(status) ? policy.sumAssured : undefined,
      settledDate: status === "SETTLED" ? new Date() : undefined,
      rejectionReason: status === "REJECTED" ? "Premium timeline discrepancy found during review." : undefined,
      reviewedBy: bmMumbai._id, // Reviewed by Mumbai BM
    })

    if (status === "SETTLED") {
      await Policy.findByIdAndUpdate(policy._id, { status: "CLAIM_SETTLED" })
    }
  }

  // 13. Seed Tasks
  console.log("Seeding Tasks...")
  for (let i = 1; i <= 10; i++) {
    const agent = agents[i % agents.length]
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (i % 4) - 2) // some overdue, some future

    await Task.create({
      title: `Task Follow-up #${i}`,
      description: `Follow up with customer to collect premium receipt or explain proposal terms.`,
      assignedTo: agent._id,
      assignedBy: agent.manager || superAdmin._id,
      dueDate,
      priority: ["LOW", "MEDIUM", "HIGH"][i % 3],
      status: ["PENDING", "IN_PROGRESS", "DONE"][i % 3],
      completedAt: i % 3 === 2 ? new Date() : null,
    })
  }

  // 14. Seed Notifications
  console.log("Seeding Notifications...")
  for (let i = 0; i < 5; i++) {
    const agent = agents[i % agents.length]
    await Notification.create({
      recipient: agent._id,
      type: "PREMIUM_DUE",
      title: "Premium Due Reminder",
      message: `Premium installment for client is due soon. Please follow up.`,
      link: "/dashboard/premiums",
      isRead: false,
      dedupeKey: `seed-notif-${i}`,
    })
  }

  // 15. Seed Audit Logs
  console.log("Seeding Audit Logs...")
  await AuditLog.create([
    {
      user: superAdmin._id,
      action: "CREATED_USER",
      entityType: "User",
      entityId: doMumbai._id.toString(),
      newValue: { name: doMumbai.name, role: doMumbai.role },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    {
      user: bmMumbai._id,
      action: "UPDATED_POLICY",
      entityType: "Policy",
      entityId: maturedPolicies[0]?._id?.toString() || "dummy",
      oldValue: { status: "ACTIVE" },
      newValue: { status: "MATURED" },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }
  ])

  // 16. Seed Policy Templates
  console.log("Seeding Policy Templates...")
  await PolicyTemplate.create([
    {
      name: "Jeevan Anand Standard (15 Yrs)",
      planName: "JEEVAN_ANAND",
      defaultTerm: 15,
      defaultSumAssured: 500000,
      defaultCommissionPercent: 15,
    },
    {
      name: "Jeevan Umang High SA (20 Yrs)",
      planName: "JEEVAN_UMANG",
      defaultTerm: 20,
      defaultSumAssured: 1000000,
      defaultCommissionPercent: 18,
    },
  ])

  console.log("Seeding completed successfully!")
  mongoose.connection.close()
  console.log("Database connection closed.")
}

main().catch((err) => {
  console.error("Error seeding database:", err)
  process.exit(1)
})
