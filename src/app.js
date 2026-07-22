const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const federationNodeRoutes = require('./routes/federationNodes');
const formRoutes = require('./routes/forms');
const approvalStatusRoutes = require('./routes/approvalStatus');
const paymentStatusRoutes = require('./routes/paymentStatus');
const currencyTypeRoutes = require('./routes/currencyType');
const membershipPeriodRoutes = require('./routes/membershipPeriod');
const membershipTypeRoutes = require('./routes/membershipType');
const federationUserRoutes = require('./routes/federationUsers');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'FedOS backend API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/federation-nodes', federationNodeRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/approval-statuses', approvalStatusRoutes);
app.use('/api/payment-statuses', paymentStatusRoutes);
app.use('/api/currency-types', currencyTypeRoutes);
app.use('/api/membership-periods', membershipPeriodRoutes);
app.use('/api/membership-types', membershipTypeRoutes);
app.use('/api/federation-users', federationUserRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
