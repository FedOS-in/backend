const express = require('express');
const prisma = require('../utils/prismaClient');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const nodes = await prisma.federationNode.findMany({
      where: { isDelete: false },
      orderBy: { createdAt: 'asc' },
      include: {
        parent: true,
        children: true,
      },
    });

    res.json(nodes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch federation nodes', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const node = await prisma.federationNode.findFirst({
      where: { id: req.params.id, isDelete: false },
      include: {
        parent: true,
        children: true,
        forms: true,
        users: true,
      },
    });

    if (!node) {
      return res.status(404).json({ message: 'Federation node not found' });
    }

    res.json(node);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch federation node', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, parentId, isActive } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (parentId) {
      const parent = await prisma.federationNode.findUnique({ where: { id: parentId } });
      if (!parent) {
        return res.status(404).json({ message: 'Parent federation node not found' });
      }
    }

    const node = await prisma.federationNode.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
    });

    res.status(201).json(node);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create federation node', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existingNode = await prisma.federationNode.findFirst({ where: { id: req.params.id, isDelete: false } });

    if (!existingNode) {
      return res.status(404).json({ message: 'Federation node not found' });
    }

    const { name, parentId, isActive } = req.body;
    const updateData = {};

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'parentId')) {
      if (parentId && parentId === req.params.id) {
        return res.status(400).json({ message: 'A node cannot be its own parent' });
      }

      if (parentId) {
        const parent = await prisma.federationNode.findUnique({ where: { id: parentId } });
        if (!parent) {
          return res.status(404).json({ message: 'Parent federation node not found' });
        }
      }

      updateData.parentId = parentId || null;
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    const node = await prisma.federationNode.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(node);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update federation node', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existingNode = await prisma.federationNode.findFirst({ where: { id: req.params.id, isDelete: false } });

    if (!existingNode) {
      return res.status(404).json({ message: 'Federation node not found' });
    }

    const node = await prisma.federationNode.update({
      where: { id: req.params.id },
      data: {
        isDelete: true,
        isActive: false,
      },
    });

    res.json({ message: 'Federation node deleted successfully', node });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete federation node', error: error.message });
  }
});

module.exports = router;
