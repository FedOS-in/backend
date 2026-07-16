const express = require("express")
const router = express.Router()
const prisma = require("../utils/prismaClient")

const VALID_FIELD_TYPES = new Set([
  "TEXT",
  "NUMBER",
  "DATE",
  "SELECT",
  "MULTI_SELECT",
  "BOOLEAN",
  "FILE",
  "EMAIL",
  "PHONE",
  "TEXTAREA",
  "CHECKBOX",
  "RADIO",
])

const VALID_PAYMENT_PERIODS = new Set(["PRE_APPROVAL", "POST_APPROVAL"])

function normalizeFieldType(fieldType) {
  const upper = String(fieldType || "").toUpperCase()

  // UI aliases -> Prisma enum values

  return upper
}

function normalizePaymentPeriod(paymentPeriod) {
  if (paymentPeriod == null || paymentPeriod === "") return null
  return String(paymentPeriod).toUpperCase()
}

function normalizeSubscriptionAmount(subscriptionAmount) {
  if (subscriptionAmount == null || subscriptionAmount === "") return null
  const amount = Number(subscriptionAmount)
  if (Number.isNaN(amount)) return NaN
  return amount
}

function validateSubscriptionFields({ subscriptionAmount, paymentPeriod, required }) {
  const normalizedAmount = normalizeSubscriptionAmount(subscriptionAmount)
  const normalizedPeriod = normalizePaymentPeriod(paymentPeriod)

  if (required) {
    if (normalizedAmount == null || Number.isNaN(normalizedAmount)) {
      return { error: "subscriptionAmount is required and must be a valid number" }
    }
    if (normalizedAmount < 0) {
      return { error: "subscriptionAmount must be a non-negative number" }
    }
    if (!normalizedPeriod) {
      return { error: "paymentPeriod is required" }
    }
  } else if (normalizedAmount != null) {
    if (Number.isNaN(normalizedAmount)) {
      return { error: "subscriptionAmount must be a valid number" }
    }
    if (normalizedAmount < 0) {
      return { error: "subscriptionAmount must be a non-negative number" }
    }
  }

  if (normalizedPeriod && !VALID_PAYMENT_PERIODS.has(normalizedPeriod)) {
    return {
      error: `Invalid paymentPeriod '${paymentPeriod}'. Allowed values: PRE_APPROVAL, POST_APPROVAL`,
    }
  }

  return {
    subscriptionAmount: normalizedAmount,
    paymentPeriod: normalizedPeriod,
  }
}

function normalizeFieldOptions(options) {
  if (options == null) return null
  if (Array.isArray(options)) return options
  if (typeof options === "string") {
    return options
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return options
}

function normalizeIncomingFields(fields = []) {
  return fields.map((field) => ({
    ...field,
    fieldType: normalizeFieldType(field.fieldType),
    options: normalizeFieldOptions(field.options),
  }))
}

function findInvalidFieldType(fields = []) {
  return fields.find((field) => !VALID_FIELD_TYPES.has(field.fieldType))
}

// POST /api/forms
// Body for create: { federationNodeId, name, subscriptionAmount, paymentPeriod, version?, isActive?, fields: [ { fieldKey, label, fieldType, isRequired?, sortOrder?, options? } ] }
router.post("/", async (req, res) => {
  try {
    const body = req.body
    if (!body) return res.status(400).json({ message: "No body provided" })

    const { federationNodeId, name, version, isActive } = body
    if (!federationNodeId || !name)
      return res
        .status(400)
        .json({ message: "federationNodeId and name are required for create" })

    const subscriptionValidation = validateSubscriptionFields({
      subscriptionAmount: body.subscriptionAmount,
      paymentPeriod: body.paymentPeriod,
      required: true,
    })
    if (subscriptionValidation.error) {
      return res.status(400).json({ message: subscriptionValidation.error })
    }

    const normalizedFields = normalizeIncomingFields(
      Array.isArray(body.fields) ? body.fields : [],
    )
    const invalidField = findInvalidFieldType(normalizedFields)
    if (invalidField) {
      return res.status(400).json({
        message: `Invalid fieldType '${invalidField.fieldType}' for field '${invalidField.fieldKey || invalidField.label || "unknown"}'`,
      })
    }

    const created = await prisma.$transaction(async (tx) => {
      const createdForm = await tx.federationForm.create({
        data: {
          federationNodeId,
          name,
          version: typeof version === "number" ? version : 1,
          isActive: typeof isActive === "boolean" ? isActive : true,
          subscriptionAmount: subscriptionValidation.subscriptionAmount,
          paymentPeriod: subscriptionValidation.paymentPeriod,
        },
      })

      for (const f of normalizedFields) {
        await tx.formField.create({
          data: {
            formId: createdForm.id,
            fieldKey: f.fieldKey,
            label: f.label,
            fieldType: f.fieldType,
            isRequired:
              typeof f.isRequired === "boolean" ? f.isRequired : false,
            sortOrder: typeof f.sortOrder === "number" ? f.sortOrder : 0,
            options: f.options ?? null,
          },
        })
      }

      return tx.federationForm.findUnique({
        where: { id: createdForm.id },
        include: { fields: true },
      })
    })

    return res.status(201).json(created)
  } catch (error) {
    console.error("Forms route error:", error)
    return res
      .status(500)
      .json({ message: "Failed to create form", error: error.message })
  }
})

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id
    const body = req.body
    if (!body) return res.status(400).json({ message: "No body provided" })

    const hasSubscriptionAmount = Object.prototype.hasOwnProperty.call(
      body,
      "subscriptionAmount",
    )
    const hasPaymentPeriod = Object.prototype.hasOwnProperty.call(
      body,
      "paymentPeriod",
    )
    let subscriptionValidation = null
    if (hasSubscriptionAmount || hasPaymentPeriod) {
      subscriptionValidation = validateSubscriptionFields({
        subscriptionAmount: hasSubscriptionAmount
          ? body.subscriptionAmount
          : undefined,
        paymentPeriod: hasPaymentPeriod ? body.paymentPeriod : undefined,
        required: hasSubscriptionAmount && hasPaymentPeriod,
      })
      if (subscriptionValidation.error) {
        return res.status(400).json({ message: subscriptionValidation.error })
      }
    }

    const normalizedFields = normalizeIncomingFields(
      Array.isArray(body.fields) ? body.fields : [],
    )
    const invalidField = findInvalidFieldType(normalizedFields)
    if (invalidField) {
      return res.status(400).json({
        message: `Invalid fieldType '${invalidField.fieldType}' for field '${invalidField.fieldKey || invalidField.label || "unknown"}'`,
      })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.federationForm.findUnique({
        where: { id },
        include: { fields: true },
      })
      if (!existing) {
        throw new Error("Form not found")
      }

      const formData = {}
      if (Object.prototype.hasOwnProperty.call(body, "federationNodeId"))
        formData.federationNodeId = body.federationNodeId
      if (Object.prototype.hasOwnProperty.call(body, "name"))
        formData.name = body.name
      if (Object.prototype.hasOwnProperty.call(body, "version"))
        formData.version = body.version
      if (Object.prototype.hasOwnProperty.call(body, "isActive"))
        formData.isActive = body.isActive
      if (hasSubscriptionAmount)
        formData.subscriptionAmount = subscriptionValidation.subscriptionAmount
      if (hasPaymentPeriod)
        formData.paymentPeriod = subscriptionValidation.paymentPeriod

      await tx.federationForm.update({ where: { id }, data: formData })

      const incomingFields = normalizedFields
      const incomingIds = incomingFields
        .filter((f) => f && f.id)
        .map((f) => f.id)
      const toDelete = existing.fields
        .filter((f) => !incomingIds.includes(f.id))
        .map((f) => f.id)

      if (toDelete.length) {
        await tx.formField.deleteMany({ where: { id: { in: toDelete } } })
      }

      for (const f of incomingFields) {
        if (f.id) {
          const updateData = {}
          if (Object.prototype.hasOwnProperty.call(f, "fieldKey"))
            updateData.fieldKey = f.fieldKey
          if (Object.prototype.hasOwnProperty.call(f, "label"))
            updateData.label = f.label
          if (Object.prototype.hasOwnProperty.call(f, "fieldType"))
            updateData.fieldType = f.fieldType
          if (Object.prototype.hasOwnProperty.call(f, "isRequired"))
            updateData.isRequired = f.isRequired
          if (Object.prototype.hasOwnProperty.call(f, "sortOrder"))
            updateData.sortOrder = f.sortOrder
          if (Object.prototype.hasOwnProperty.call(f, "options"))
            updateData.options = f.options

          await tx.formField.update({ where: { id: f.id }, data: updateData })
        } else {
          await tx.formField.create({
            data: {
              formId: id,
              fieldKey: f.fieldKey,
              label: f.label,
              fieldType: f.fieldType,
              isRequired:
                typeof f.isRequired === "boolean" ? f.isRequired : false,
              sortOrder: typeof f.sortOrder === "number" ? f.sortOrder : 0,
              options: f.options ?? null,
            },
          })
        }
      }

      return tx.federationForm.findUnique({
        where: { id },
        include: { fields: true },
      })
    })

    return res.json(updated)
  } catch (error) {
    console.error("Forms route error:", error)
    if (error.message === "Form not found")
      return res.status(404).json({ message: "Form not found" })
    return res
      .status(500)
      .json({ message: "Failed to update form", error: error.message })
  }
})

// Additional helpful endpoints
router.get("/", async (req, res) => {
  try {
    const forms = await prisma.federationForm.findMany({
      include: { fields: true },
      orderBy: { createdAt: "desc" },
    })
    res.json(forms)
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch forms", error: error.message })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const form = await prisma.federationForm.findUnique({
      where: { id: req.params.id },
      include: { fields: true },
    })
    if (!form) return res.status(404).json({ message: "Form not found" })
    res.json(form)
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch form", error: error.message })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.federationForm.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    })

    if (!existing) {
      return res.status(404).json({ message: "Form not found" })
    }

    await prisma.federationForm.delete({
      where: { id: req.params.id },
    })

    return res.status(204).send()
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete form", error: error.message })
  }
})

module.exports = router
