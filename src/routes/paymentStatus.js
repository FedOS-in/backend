const express = require("express")
const router = express.Router()
const prisma = require("../utils/prismaClient")

router.get("/", async (req, res) => {
  try {
    const statuses = await prisma.paymentStatus.findMany({
      orderBy: { id: "asc" },
    })
    res.json(statuses)
  } catch (error) {
    console.error("Failed to fetch payment statuses:", error)
    res.status(500).json({
      message: "Failed to fetch payment statuses",
      error: error.message,
    })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid payment status id" })
    }

    const status = await prisma.paymentStatus.findUnique({ where: { id } })
    if (!status) {
      return res.status(404).json({ message: "Payment status not found" })
    }

    res.json(status)
  } catch (error) {
    console.error("Failed to fetch payment status:", error)
    res.status(500).json({
      message: "Failed to fetch payment status",
      error: error.message,
    })
  }
})

module.exports = router
