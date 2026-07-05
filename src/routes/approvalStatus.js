const express = require('express');
const router = express.Router();
const prisma = require('../utils/prismaClient');

router.get('/', async (req, res) => {
  try {
    const statuses = await prisma.approvalStatus.findMany({ orderBy: { id: 'asc' } });
    res.json(statuses);
  } catch (error) {
    console.error('Failed to fetch approval statuses:', error);
    res.status(500).json({ message: 'Failed to fetch approval statuses', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid approval status id' });
    }

    const status = await prisma.approvalStatus.findUnique({ where: { id } });
    if (!status) {
      return res.status(404).json({ message: 'Approval status not found' });
    }

    res.json(status);
  } catch (error) {
    console.error('Failed to fetch approval status:', error);
    res.status(500).json({ message: 'Failed to fetch approval status', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, value } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (typeof value !== 'number') {
      return res.status(400).json({ message: 'Value must be a number' });
    }

    const created = await prisma.approvalStatus.create({ data: { name: name.trim(), value } });
    res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create approval status:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Approval status with this value already exists', error: error.message });
    }
    res.status(500).json({ message: 'Failed to create approval status', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid approval status id' });
    }

    const { name, value } = req.body;
    const data = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Name must be a non-empty string' });
      }
      data.name = name.trim();
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'value')) {
      if (typeof value !== 'number') {
        return res.status(400).json({ message: 'Value must be a number' });
      }
      data.value = value;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'At least one field (name or value) must be provided' });
    }

    const updated = await prisma.approvalStatus.update({ where: { id }, data });
    res.json(updated);
  } catch (error) {
    console.error('Failed to update approval status:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Approval status with this value already exists', error: error.message });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Approval status not found', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update approval status', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid approval status id' });
    }

    await prisma.approvalStatus.delete({ where: { id } });
    res.json({ message: 'Approval status deleted successfully' });
  } catch (error) {
    console.error('Failed to delete approval status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Approval status not found', error: error.message });
    }
    res.status(500).json({ message: 'Failed to delete approval status', error: error.message });
  }
});

module.exports = router;
