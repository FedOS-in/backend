const express = require('express');
const router = express.Router();
const prisma = require('../utils/prismaClient');

router.get('/', async (req, res) => {
  try {
    const { federationNodeId, formId, approvalStatus } = req.query;
    const where = {};

    if (federationNodeId) where.federationNodeId = federationNodeId;
    if (formId) where.formId = formId;
    if (approvalStatus) where.approvalStatus = parseInt(approvalStatus, 10);

    const users = await prisma.federationUser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Failed to fetch federation users:', error);
    res.status(500).json({ message: 'Failed to fetch federation users', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.federationUser.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'Federation user not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Failed to fetch federation user:', error);
    res.status(500).json({ message: 'Failed to fetch federation user', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      federationNodeId,
      formId,
      name,
      email,
      phoneNumber,
      address,
      approvalStatus,
      dynamicFields,
    } = req.body;

    if (!federationNodeId || !formId || !name || !email || !phoneNumber) {
      return res.status(400).json({ message: 'federationNodeId, formId, name, email, and phoneNumber are required' });
    }

    const created = await prisma.federationUser.create({
      data: {
        federationNodeId,
        formId,
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address ? address.trim() : null,
        approvalStatus: typeof approvalStatus === 'number' ? approvalStatus : 1,
        dynamicFields: typeof dynamicFields === 'object' && dynamicFields !== null ? dynamicFields : {},
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create federation user:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Related record not found', error: error.message });
    }
    res.status(500).json({ message: 'Failed to create federation user', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      federationNodeId,
      formId,
      name,
      email,
      phoneNumber,
      address,
      approvalStatus,
      dynamicFields,
    } = req.body;

    const data = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'federationNodeId')) data.federationNodeId = federationNodeId;
    if (Object.prototype.hasOwnProperty.call(req.body, 'formId')) data.formId = formId;
    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) data.name = name ? name.trim() : null;
    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) data.email = email ? email.trim() : null;
    if (Object.prototype.hasOwnProperty.call(req.body, 'phoneNumber')) data.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
    if (Object.prototype.hasOwnProperty.call(req.body, 'address')) data.address = address ? address.trim() : null;
    if (Object.prototype.hasOwnProperty.call(req.body, 'approvalStatus')) data.approvalStatus = approvalStatus;
    if (Object.prototype.hasOwnProperty.call(req.body, 'dynamicFields')) data.dynamicFields = typeof dynamicFields === 'object' && dynamicFields !== null ? dynamicFields : {};

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'At least one field must be provided to update' });
    }

    const updated = await prisma.federationUser.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to update federation user:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Related record not found', error: error.message });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Federation user not found', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update federation user', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.federationUser.delete({ where: { id } });
    res.json({ message: 'Federation user deleted successfully' });
  } catch (error) {
    console.error('Failed to delete federation user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Federation user not found', error: error.message });
    }
    res.status(500).json({ message: 'Failed to delete federation user', error: error.message });
  }
});

module.exports = router;
