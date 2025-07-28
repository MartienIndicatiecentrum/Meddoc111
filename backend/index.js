require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const pdfExtractRoute = require('./extract-pdf');
const morphikProxyRoute = require('./morphik-proxy');

app.use(pdfExtractRoute);
app.use(morphikProxyRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'MedDoc Backend' });
});

app.get('/', (req, res) => {
  res.send('TT Management API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
