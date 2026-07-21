const express = require("express")
const router = express.Router()
const prisma = require("../utils/prismaClient")

router.get("/", async (req, res) => {
  try {
    const periods = await prisma.membershipPeriod.findMany({
      orderBy: { id: "asc" },
    })
    res.json(periods)
  } catch (error) {
    console.error("Failed to fetch membership periods:", error)
    res.status(500).json({
      message: "Failed to fetch membership periods",
      error: error.message,
    })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid membership period id" })
    }

    const period = await prisma.membershipPeriod.findUnique({ where: { id } })
    if (!period) {
      return res.status(404).json({ message: "Membership period not found" })
    }

    res.json(period)
  } catch (error) {
    console.error("Failed to fetch membership period:", error)
    res.status(500).json({
      message: "Failed to fetch membership period",
      error: error.message,
    })
  }
})

module.exports = router
