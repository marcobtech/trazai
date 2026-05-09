const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());

const webhookRoutes = require('./routes/webhook');

app.use('/webhook', webhookRoutes);

app.listen(3001, () => {
    console.log('Webhook service rodando na porta 3001');
});