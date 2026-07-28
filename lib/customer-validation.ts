import { z } from "zod"

const optionalText = z.string().trim().optional().or(z.literal(""))

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer's name"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
  email: optionalText.pipe(z.string().email("Enter a valid email").optional().or(z.literal(""))),
  address: z.object({ line1: z.string().min(1, "Address line 1 is required"), line2: optionalText, city: z.string().min(1, "City is required"), state: z.string().min(1, "State is required"), pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits") }),
  aadhaarNumber: optionalText.pipe(z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal(""))),
  panNumber: optionalText.pipe(z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "PAN must be in ABCDE1234F format").optional().or(z.literal(""))),
  occupation: optionalText,
  annualIncome: z.coerce.number().min(0).optional(),
  nominee: z.object({ name: optionalText, relation: optionalText, dob: optionalText }),
  notes: optionalText,
})

export type CustomerInput = z.infer<typeof customerSchema>
