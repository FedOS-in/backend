const express = require("express")
const router = express.Router()
const prisma = require("../utils/prismaClient")
const crypto = require("crypto")

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user
  return safeUser
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(
    password,
  )
}

function isUnknownFieldError(error) {
  return (
    error?.name === "PrismaClientValidationError" &&
    /Unknown argument/.test(String(error?.message || ""))
  )
}

function buildLegacyAddress({
  addressLine1,
  addressLine2,
  city,
  state,
  pincode,
}) {
  return [addressLine1, addressLine2, city, state, pincode]
    .filter((part) => typeof part === "string" && part.trim())
    .join(", ")
}

function formatMemberSequence(sequence) {
  return String(sequence).padStart(3, "0")
}

async function generateMemberId(tx, membershipCode) {
  const year = new Date().getFullYear()
  const code = String(membershipCode || "")
    .trim()
    .toUpperCase()
  if (!code) {
    throw new Error("Membership type code is required to generate memberId")
  }

  const prefix = `${code}-${year}-`
  const latest = await tx.federationUser.findFirst({
    where: { memberId: { startsWith: prefix } },
    orderBy: { memberId: "desc" },
    select: { memberId: true },
  })

  let nextSequence = 1
  if (latest?.memberId) {
    const parts = latest.memberId.split("-")
    const parsed = parseInt(parts[parts.length - 1], 10)
    if (!Number.isNaN(parsed) && parsed >= 0) nextSequence = parsed + 1
  }

  return `${prefix}${formatMemberSequence(nextSequence)}`
}

async function resolveMembershipType({ membershipTypeId, formId }, tx = prisma) {
  if (membershipTypeId) {
    const membershipType = await tx.membershipType.findUnique({
      where: { id: membershipTypeId },
      select: { id: true, code: true, status: true },
    })
    if (!membershipType) {
      throw new Error("Membership type not found")
    }
    return membershipType
  }

  const form = await tx.federationForm.findUnique({
    where: { id: formId },
    select: {
      membershipTypeId: true,
      membershipType: { select: { id: true, code: true, status: true } },
    },
  })

  if (!form) {
    throw new Error("Form not found")
  }
  if (!form.membershipType) {
    throw new Error("Form does not have a membership type configured")
  }

  return form.membershipType
}

const USER_INCLUDE = {
  membershipType: {
    select: {
      id: true,
      label: true,
      code: true,
      joiningFee: true,
      renewalFee: true,
      currencyId: true,
      validityId: true,
    },
  },
}

router.get("/", async (req, res) => {
  try {
    const { federationNodeId, formId, approvalStatus, membershipTypeId } =
      req.query
    const where = {}

    if (federationNodeId) where.federationNodeId = federationNodeId
    if (formId) where.formId = formId
    if (membershipTypeId) where.membershipTypeId = membershipTypeId
    if (approvalStatus) where.approvalStatus = parseInt(approvalStatus, 10)

    const users = await prisma.federationUser.findMany({
      where,
      include: USER_INCLUDE,
      orderBy: { createdAt: "desc" },
    })

    res.json(users.map(sanitizeUser))
  } catch (error) {
    console.error("Failed to fetch federation users:", error)
    res.status(500).json({
      message: "Failed to fetch federation users",
      error: error.message,
    })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.federationUser.findUnique({
      where: { id },
      include: USER_INCLUDE,
    })

    if (!user) {
      return res.status(404).json({ message: "Federation user not found" })
    }

    res.json(sanitizeUser(user))
  } catch (error) {
    console.error("Failed to fetch federation user:", error)
    res.status(500).json({
      message: "Failed to fetch federation user",
      error: error.message,
    })
  }
})

router.post("/", async (req, res) => {
  try {
    const {
      federationNodeId,
      formId,
      membershipTypeId,
      name,
      email,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      password,
      approvalStatus,
      paymentStatus,
      dynamicFields,
    } = req.body

    const requiredTextUpdates = {
      name,
      email,
      phoneNumber,
      addressLine1,
      city,
      state,
      pincode,
    }

    for (const [fieldName, fieldValue] of Object.entries(requiredTextUpdates)) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, fieldName) &&
        !String(fieldValue || "").trim()
      ) {
        return res.status(400).json({ message: `${fieldName} cannot be empty` })
      }
    }

    if (
      !federationNodeId ||
      !formId ||
      !name ||
      !email ||
      !phoneNumber ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode ||
      !password
    ) {
      return res.status(400).json({
        message:
          "federationNodeId, formId, name, email, phoneNumber, addressLine1, city, state, pincode, and password are required",
      })
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be strong (8+ chars with upper, lower, number, special character)",
      })
    }

    const safeDynamicFields =
      typeof dynamicFields === "object" && dynamicFields !== null
        ? dynamicFields
        : {}

    const created = await prisma.$transaction(async (tx) => {
      const membershipType = await resolveMembershipType(
        { membershipTypeId, formId },
        tx,
      )

      const memberId = await generateMemberId(tx, membershipType.code)

      const newSchemaData = {
        federationNodeId,
        formId,
        membershipTypeId: membershipType.id,
        memberId,
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        passwordHash: hashPassword(password),
        approvalStatus: typeof approvalStatus === "number" ? approvalStatus : 1,
        paymentStatus: typeof paymentStatus === "number" ? paymentStatus : 1,
        dynamicFields: safeDynamicFields,
      }

      try {
        return await tx.federationUser.create({
          data: newSchemaData,
          include: USER_INCLUDE,
        })
      } catch (createError) {
        if (!isUnknownFieldError(createError)) throw createError

        const legacyDynamicFields = {
          ...safeDynamicFields,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2 ? addressLine2.trim() : null,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          passwordHash: newSchemaData.passwordHash,
        }

        return tx.federationUser.create({
          data: {
            federationNodeId,
            formId,
            membershipTypeId: membershipType.id,
            memberId,
            name: name.trim(),
            email: email.trim(),
            phoneNumber: phoneNumber.trim(),
            address: buildLegacyAddress({
              addressLine1,
              addressLine2,
              city,
              state,
              pincode,
            }),
            approvalStatus:
              typeof approvalStatus === "number" ? approvalStatus : 1,
            dynamicFields: legacyDynamicFields,
          },
          include: USER_INCLUDE,
        })
      }
    })

    res.status(201).json(sanitizeUser(created))
  } catch (error) {
    console.error("Failed to create federation user:", error)
    if (
      error.message === "Membership type not found" ||
      error.message === "Form not found" ||
      error.message === "Form does not have a membership type configured" ||
      error.message === "Membership type code is required to generate memberId"
    ) {
      return res.status(400).json({ message: error.message })
    }
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Generated memberId already exists, please retry",
        error: error.message,
      })
    }
    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ message: "Related record not found", error: error.message })
    }
    res.status(500).json({
      message: "Failed to create federation user",
      error: error.message,
    })
  }
})

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const {
      federationNodeId,
      formId,
      membershipTypeId,
      name,
      email,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      password,
      approvalStatus,
      paymentStatus,
      dynamicFields,
    } = req.body

    if (Object.prototype.hasOwnProperty.call(req.body, "memberId")) {
      return res.status(400).json({ message: "memberId cannot be updated" })
    }

    const data = {}
    if (Object.prototype.hasOwnProperty.call(req.body, "federationNodeId"))
      data.federationNodeId = federationNodeId
    if (Object.prototype.hasOwnProperty.call(req.body, "formId"))
      data.formId = formId
    if (Object.prototype.hasOwnProperty.call(req.body, "membershipTypeId")) {
      if (!membershipTypeId) {
        return res
          .status(400)
          .json({ message: "membershipTypeId cannot be empty" })
      }
      const membershipType = await prisma.membershipType.findUnique({
        where: { id: membershipTypeId },
        select: { id: true },
      })
      if (!membershipType) {
        return res.status(400).json({ message: "Membership type not found" })
      }
      data.membershipTypeId = membershipTypeId
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "name"))
      data.name = name.trim()
    if (Object.prototype.hasOwnProperty.call(req.body, "email"))
      data.email = email.trim()
    if (Object.prototype.hasOwnProperty.call(req.body, "phoneNumber"))
      data.phoneNumber = phoneNumber.trim()
    if (Object.prototype.hasOwnProperty.call(req.body, "addressLine1"))
      data.addressLine1 = addressLine1.trim()
    if (Object.prototype.hasOwnProperty.call(req.body, "addressLine2"))
      data.addressLine2 = addressLine2 ? addressLine2.trim() : null
    if (Object.prototype.hasOwnProperty.call(req.body, "city"))
      data.city = city.trim()
    if (Object.prototype.hasOwnProperty.call(req.body, "state"))
      data.state = state.trim()
    if (Object.prototype.hasOwnProperty.call(req.body, "pincode"))
      data.pincode = pincode.trim()
    if (Object.prototype.hasOwnProperty.call(req.body, "password")) {
      if (!password || !isStrongPassword(password)) {
        return res.status(400).json({
          message:
            "Password must be strong (8+ chars with upper, lower, number, special character)",
        })
      }
      data.passwordHash = hashPassword(password)
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "approvalStatus"))
      data.approvalStatus = approvalStatus
    if (Object.prototype.hasOwnProperty.call(req.body, "paymentStatus")) {
      if (typeof paymentStatus !== "number") {
        return res
          .status(400)
          .json({ message: "paymentStatus must be a number" })
      }
      data.paymentStatus = paymentStatus
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "dynamicFields"))
      data.dynamicFields =
        typeof dynamicFields === "object" && dynamicFields !== null
          ? dynamicFields
          : {}

    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({ message: "At least one field must be provided to update" })
    }

    let updated
    try {
      updated = await prisma.federationUser.update({
        where: { id },
        data,
        include: USER_INCLUDE,
      })
    } catch (updateError) {
      if (!isUnknownFieldError(updateError)) throw updateError

      const legacyData = { ...data }
      const addressParts = {
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
      }

      delete legacyData.addressLine1
      delete legacyData.addressLine2
      delete legacyData.city
      delete legacyData.state
      delete legacyData.pincode
      delete legacyData.passwordHash

      if (
        Object.prototype.hasOwnProperty.call(req.body, "addressLine1") ||
        Object.prototype.hasOwnProperty.call(req.body, "addressLine2") ||
        Object.prototype.hasOwnProperty.call(req.body, "city") ||
        Object.prototype.hasOwnProperty.call(req.body, "state") ||
        Object.prototype.hasOwnProperty.call(req.body, "pincode")
      ) {
        legacyData.address = buildLegacyAddress(addressParts)
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "password")) {
        const currentDynamicFields =
          typeof dynamicFields === "object" && dynamicFields !== null
            ? dynamicFields
            : {}
        legacyData.dynamicFields = {
          ...currentDynamicFields,
          passwordHash: hashPassword(password),
        }
      }

      updated = await prisma.federationUser.update({
        where: { id },
        data: legacyData,
        include: USER_INCLUDE,
      })
    }

    res.json(sanitizeUser(updated))
  } catch (error) {
    console.error("Failed to update federation user:", error)
    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ message: "Related record not found", error: error.message })
    }
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Federation user not found", error: error.message })
    }
    res.status(500).json({
      message: "Failed to update federation user",
      error: error.message,
    })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    await prisma.federationUser.delete({ where: { id } })
    res.json({ message: "Federation user deleted successfully" })
  } catch (error) {
    console.error("Failed to delete federation user:", error)
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Federation user not found", error: error.message })
    }
    res.status(500).json({
      message: "Failed to delete federation user",
      error: error.message,
    })
  }
})

module.exports = router
