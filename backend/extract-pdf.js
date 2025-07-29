const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const pdf = require('pdf-parse');

const router = express.Router();

router.post('/api/extract-pdf', cors(), async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ error: 'File URL is required' });
    }

    // Download PDF from URL
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      return res.status(400).json({ error: 'Failed to download PDF' });
    }

    const pdfBuffer = await pdfResponse.buffer();

    // Extract text from PDF
    const data = await pdf(pdfBuffer);

    // Return extracted content
    res.json({
      content: data.text,
      pages: data.numpages,
      info: data.info
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({ error: 'Failed to extract PDF content' });
  }
});

module.exports = router;