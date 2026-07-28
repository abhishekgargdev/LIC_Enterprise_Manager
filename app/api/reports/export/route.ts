import { NextResponse } from "next/server"
import mongoose from "mongoose"
import ExcelJS from "exceljs"
import React from "react"
import { Page, Text, View, Document, StyleSheet, pdf } from "@react-pdf/renderer"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { User } from "@/models/User"
import { Branch } from "@/models/Branch"
import { Policy } from "@/models/Policy"
import { Customer } from "@/models/Customer"
import { Premium } from "@/models/Premium"
import { Claim } from "@/models/Claim"
import { getScopedFilters } from "@/lib/reports-helper"

// ----------------------------------------------------
// PDF Styling and Document component
// ----------------------------------------------------
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", fontSize: 9, color: "#1e293b" },
  header: { borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 10, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: "bold", color: "#0f3d91" },
  meta: { fontSize: 8, color: "#64748b", marginTop: 3 },
  table: { width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: "#e2e8f0", borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: "row" },
  tableColHeader: { borderStyle: "solid", borderWidth: 1, borderColor: "#e2e8f0", borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: "#f8fafc", padding: 5 },
  tableCol: { borderStyle: "solid", borderWidth: 1, borderColor: "#e2e8f0", borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  cellText: { fontSize: 8 }
})

function ReportDocument({ type, data, fromDate, toDate }: any) {
  if (data.length === 0) {
    return React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4", orientation: "landscape", style: pdfStyles.page },
        React.createElement(Text, null, "No records found matching current criteria.")
      )
    )
  }

  // Remove system-internal MongoDB keys before printing
  const cleanData = data.map((item: any) => {
    const { _id, id, passwordHash, ...rest } = item
    return rest
  })

  const keys = Object.keys(cleanData[0] || {})
  const headers = keys.map(key => key.replace(/([A-Z])/g, ' $1').toUpperCase())
  const widthPercent = `${100 / Math.max(keys.length, 1)}%`

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", orientation: "landscape", style: pdfStyles.page },
      React.createElement(
        View,
        { style: pdfStyles.header },
        React.createElement(Text, { style: pdfStyles.title }, "LIC Enterprise Management System (LEMS)"),
        React.createElement(Text, { style: pdfStyles.meta }, `REPORT TYPE: ${type.replace("-", " ").toUpperCase()}`),
        React.createElement(Text, { style: pdfStyles.meta }, `FILTER DATES: ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`),
        React.createElement(Text, { style: pdfStyles.meta }, `GENERATED ON: ${new Date().toLocaleString()}`)
      ),
      React.createElement(
        View,
        { style: pdfStyles.table },
        React.createElement(
          View,
          { style: pdfStyles.tableRow },
          headers.map((h, i) =>
            React.createElement(
              View,
              { key: i, style: [pdfStyles.tableColHeader, { width: widthPercent }] },
              React.createElement(Text, { style: [pdfStyles.cellText, { fontWeight: "bold" }] }, h)
            )
          )
        ),
        cleanData.map((row: any, rIdx: number) =>
          React.createElement(
            View,
            { key: rIdx, style: pdfStyles.tableRow },
            keys.map((k, cIdx) => {
              let val = row[k]
              if (val instanceof Date) val = val.toLocaleDateString()
              else if (typeof val === "object" && val !== null) val = JSON.stringify(val)
              else val = String(val ?? "—")

              return React.createElement(
                View,
                { key: cIdx, style: [pdfStyles.tableCol, { width: widthPercent }] },
                React.createElement(Text, { style: pdfStyles.cellText }, val)
              )
            })
          )
        )
      )
    )
  )
}

// ----------------------------------------------------
// Data Aggregator Logic
// ----------------------------------------------------
async function getReportData(type: string, session: any, searchParams: URLSearchParams) {
  const { fromDate, toDate, branchIds, agentIds } = await getScopedFilters(session, searchParams)

  if (type === "agent-performance") {
    const matchStage: Record<string, any> = { role: "AGENT", isActive: true }
    if (agentIds.length > 0) {
      matchStage._id = { $in: agentIds }
    } else {
      if (session.role === "BRANCH_MANAGER") matchStage.branch = session.branch
      else if (session.role === "REGIONAL_ADMIN") matchStage.region = session.region
    }

    return User.aggregate([
      { $match: matchStage },
      { $lookup: {
          from: "policies",
          let: { agentId: "$_id" },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ["$agent", "$$agentId"] },
                    { $gte: ["$startDate", fromDate] },
                    { $lte: ["$startDate", toDate] }
                  ]
                }
              }
            }
          ],
          as: "policies"
        }
      },
      { $lookup: {
          from: "commissions",
          let: { agentId: "$_id" },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ["$agent", "$$agentId"] },
                    { $gte: ["$calculatedAt", fromDate] },
                    { $lte: ["$calculatedAt", toDate] }
                  ]
                }
              }
            }
          ],
          as: "commissions"
        }
      },
      { $project: {
          agentName: "$name",
          agentCode: { $ifNull: ["$agentCode", "—"] },
          policiesSold: { $size: "$policies" },
          premiumCollected: { $sum: "$policies.premiumAmount" },
          commissionsEarned: { $sum: "$commissions.agentAmount" }
        }
      },
      { $sort: { premiumCollected: -1 } }
    ])
  }

  if (type === "branch-performance") {
    const matchStage: Record<string, any> = {}
    if (branchIds.length > 0) {
      matchStage._id = { $in: branchIds }
    } else {
      if (session.branch) matchStage.code = session.branch
    }

    return Branch.aggregate([
      { $match: matchStage },
      { $lookup: {
          from: "users",
          let: { branchCode: "$code" },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ["$branch", "$$branchCode"] },
                    { $eq: ["$role", "AGENT"] },
                    { $eq: ["$isActive", true] }
                  ]
                }
              }
            }
          ],
          as: "agents"
        }
      },
      { $lookup: {
          from: "policies",
          let: { branchId: "$_id" },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ["$branch", "$$branchId"] },
                    { $gte: ["$startDate", fromDate] },
                    { $lte: ["$startDate", toDate] }
                  ]
                }
              }
            }
          ],
          as: "policies"
        }
      },
      { $project: {
          branchName: "$name",
          branchCode: "$code",
          totalAgents: { $size: "$agents" },
          totalPolicies: { $size: "$policies" },
          premiumCollected: { $sum: "$policies.premiumAmount" }
        }
      },
      { $sort: { premiumCollected: -1 } }
    ])
  }

  if (type === "policy-report") {
    const filter: Record<string, any> = {
      startDate: { $gte: fromDate, $lte: toDate }
    }
    if (branchIds.length > 0) filter.branch = { $in: branchIds }
    if (agentIds.length > 0) filter.agent = { $in: agentIds }

    const list = await Policy.find(filter)
      .populate("customer", "name")
      .populate("agent", "name")
      .sort({ startDate: -1 })
      .lean()

    return list.map((p: any) => ({
      policyNumber: p.policyNumber,
      customerName: p.customer?.name || "—",
      agentName: p.agent?.name || "—",
      planName: p.planName,
      sumAssured: p.sumAssured,
      premiumAmount: p.premiumAmount,
      startDate: p.startDate,
      status: p.status
    }))
  }

  if (type === "expired-policies") {
    const filter: Record<string, any> = {
      status: { $in: ["LAPSED", "EXPIRED"] },
      updatedAt: { $gte: fromDate, $lte: toDate }
    }
    if (branchIds.length > 0) filter.branch = { $in: branchIds }
    if (agentIds.length > 0) filter.agent = { $in: agentIds }

    const list = await Policy.find(filter)
      .populate("customer", "name")
      .populate("agent", "name")
      .sort({ updatedAt: -1 })
      .lean()

    return list.map((p: any) => ({
      policyNumber: p.policyNumber,
      customerName: p.customer?.name || "—",
      agentName: p.agent?.name || "—",
      planName: p.planName,
      maturityDate: p.maturityDate,
      status: p.status
    }))
  }

  if (type === "premium-collection") {
    const policyFilter: Record<string, any> = {}
    if (branchIds.length > 0) policyFilter.branch = { $in: branchIds }
    if (agentIds.length > 0) policyFilter.agent = { $in: agentIds }
    const policyIds = await Policy.find(policyFilter).distinct("_id")

    const list = await Premium.find({
      status: "PAID",
      paidDate: { $gte: fromDate, $lte: toDate },
      policy: { $in: policyIds }
    })
    .populate("policy", "policyNumber")
    .sort({ paidDate: -1 })
    .lean()

    return list.map((r: any) => ({
      receiptNumber: r.receiptNumber || "—",
      policyNumber: r.policy?.policyNumber || "—",
      amountPaid: r.amount + (r.lateFee || 0),
      paidDate: r.paidDate,
      paymentMode: r.paidMode || "—"
    }))
  }

  if (type === "customer-growth") {
    const filter: Record<string, any> = {
      createdAt: { $gte: fromDate, $lte: toDate }
    }
    if (branchIds.length > 0) filter.branch = { $in: branchIds }
    if (agentIds.length > 0) filter.agent = { $in: agentIds }

    return Customer.aggregate([
      { $match: filter },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $project: { _id: 0, date: "$_id", customersAdded: "$count" } },
      { $sort: { date: 1 } }
    ])
  }

  if (type === "claim-report") {
    const policyFilter: Record<string, any> = {}
    if (branchIds.length > 0) policyFilter.branch = { $in: branchIds }
    if (agentIds.length > 0) policyFilter.agent = { $in: agentIds }
    const policyIds = await Policy.find(policyFilter).distinct("_id")

    const list = await Claim.find({
      filedDate: { $gte: fromDate, $lte: toDate },
      policy: { $in: policyIds }
    })
    .populate("policy", "policyNumber")
    .populate("customer", "name")
    .sort({ filedDate: -1 })
    .lean()

    return list.map((c: any) => ({
      claimNumber: c.claimNumber,
      policyNumber: c.policy?.policyNumber || "—",
      customerName: c.customer?.name || "—",
      claimType: c.claimType,
      claimAmount: c.claimAmount,
      filedDate: c.filedDate,
      status: c.status
    }))
  }

  return []
}

// ----------------------------------------------------
// Export route handler
// ----------------------------------------------------
export async function GET(request: Request) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || ""
    const format = searchParams.get("format") || "csv"

    const { fromDate, toDate } = await getScopedFilters(session, searchParams)
    const rawData = await getReportData(type, session, searchParams)

    // Remove MongoDB internals or private columns
    const data = JSON.parse(JSON.stringify(rawData)).map((item: any) => {
      const { _id, __v, passwordHash, salt, ...rest } = item
      return rest
    })

    // 1. Export as CSV
    if (format === "csv") {
      if (data.length === 0) {
        return new Response("No records match target filters.", {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${type}-report.csv"`
          }
        })
      }
      const headers = Object.keys(data[0])
      const csvRows = [headers.join(",")]

      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header]
          const valStr = val instanceof Date ? val.toLocaleDateString() : String(val ?? "")
          return `"${valStr.replace(/"/g, '""')}"`
        })
        csvRows.push(values.join(","))
      }

      return new Response(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-report.csv"`
        }
      })
    }

    // 2. Export as EXCEL (ExcelJS)
    if (format === "excel") {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("LEMS Report")

      if (data.length > 0) {
        const columns = Object.keys(data[0]).map(key => ({
          header: key.replace(/([A-Z])/g, ' $1').toUpperCase(),
          key
        }))
        worksheet.columns = columns
        worksheet.addRows(data)
      } else {
        worksheet.addRow(["No records match target filters."])
      }

      const buffer = await workbook.xlsx.writeBuffer()
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${type}-report.xlsx"`
        }
      })
    }

    // 3. Export as PDF (@react-pdf/renderer)
    if (format === "pdf") {
      const doc = React.createElement(ReportDocument, { type, data, fromDate, toDate })
      const pdfBuffer = await pdf(doc).toBuffer()

      return new Response(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${type}-report.pdf"`
        }
      })
    }

    return NextResponse.json({ success: false, error: "Invalid format requested." }, { status: 400 })

  } catch (error: any) {
    console.error("Export report error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
