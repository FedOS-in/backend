const express = require("express")
const router = express.Router()
const prisma = require("../utils/prismaClient")

router.get("/", async (req, res) => {
  try {
    const { federationNodeId, status } = req.query
    const where = {}

    if (federationNodeId) {
      where.federationNodeId = String(federationNodeId)
    }
    if (status != null && status !== "") {
      const parsedStatus = Number(status)
      if (!Number.isInteger(parsedStatus)) {
        return res.status(400).json({ message: "status must be an integer" })
      }
      where.status = parsedStatus
    }

    const membershipTypes = await prisma.membershipType.findMany({
      where,
      include: {
        currency: true,
        validity: true,
      },
      orderBy: { createdAt: "desc" },
    })
    res.json(membershipTypes)
  } catch (error) {
    console.error("Failed to fetch membership types:", error)
    res.status(500).json({
      message: "Failed to fetch membership types",
      error: error.message,
    })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const membershipType = await prisma.membershipType.findUnique({
      where: { id: req.params.id },
      include: {
        currency: true,
        validity: true,
      },
    })
    if (!membershipType) {
      return res.status(404).json({ message: "Membership type not found" })
    }
    res.json(membershipType)
  } catch (error) {
    console.error("Failed to fetch membership type:", error)
    res.status(500).json({
      message: "Failed to fetch membership type",
      error: error.message,
    })
  }
})

module.exports = router
