const express = require("express")
const router = express.Router()
const prisma = require("../utils/prismaClient")

router.get("/", async (req, res) => {
  try {
    const currencies = await prisma.currencyType.findMany({
      orderBy: { id: "asc" },
    })
    res.json(currencies)
  } catch (error) {
    console.error("Failed to fetch currency types:", error)
    res.status(500).json({
      message: "Failed to fetch currency types",
      error: error.message,
    })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid currency type id" })
    }

    const currency = await prisma.currencyType.findUnique({ where: { id } })
    if (!currency) {
      return res.status(404).json({ message: "Currency type not found" })
    }

    res.json(currency)
  } catch (error) {
    console.error("Failed to fetch currency type:", error)
    res.status(500).json({
      message: "Failed to fetch currency type",
      error: error.message,
    })
  }
})

module.exports = router
