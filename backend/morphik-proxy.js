const express = require('express');
const fetch = require('node-fetch');

// Retry logic helper
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms`, error.message);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
const FormData = require('form-data');
const router = express.Router();

// Health check endpoint
router.get('/api/morphik/health', async (req, res) => {
  try {
    const apiKey = process.env.MORPHIK_API_KEY;
    const apiUrl = process.env.MORPHIK_API_URL || 'https://api.morphik.ai';

    if (!apiKey) {
      return res.status(503).json({
        status: 'unhealthy',
        error: 'Morphik API key not configured',
        code: 'MORPHIK_NOT_CONFIGURED',
        message: 'Morphik service niet geconfigureerd'
      });
    }

    // Test with a simple request
    const response = await fetch(`${apiUrl}/agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'health check' }),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok || response.status === 400) { // 400 might be expected for test query
      res.json({ status: 'healthy' });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Morphik service not responding correctly',
        statusCode: response.status
      });
    }
  } catch (error) {
    console.error('Morphik health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      code: 'SERVICE_UNAVAILABLE'
    });
  }
});

// Morphik AI proxy endpoints
router.post('/api/morphik/agent', async (req, res) => {
  try {
    const apiKey = process.env.MORPHIK_API_KEY;
    const apiUrl = process.env.MORPHIK_API_URL || 'https://api.morphik.ai';

    if (!apiKey) {
      return res.status(503).json({
        error: 'Morphik service niet geconfigureerd',
        code: 'MORPHIK_NOT_CONFIGURED',
        message: 'De Morphik API key is niet ingesteld op de server'
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await retryWithBackoff(async () => {
        const res = await fetch(`${apiUrl}/agent`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body),
          signal: controller.signal
        });

        // Don't retry on client errors (4xx)
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          return res;
        }

        // Retry on server errors, network errors, and rate limiting
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error || 'Morphik API error',
          details: data,
          statusCode: response.status
        });
      }

      res.json(data);
    } catch (fetchError) {
      clearTimeout(timeout);

      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          error: 'Request timeout',
          code: 'GATEWAY_TIMEOUT',
          message: 'De aanvraag duurde te lang'
        });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Morphik agent error:', error);
    res.status(503).json({
      error: 'Service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Morphik service tijdelijk niet beschikbaar',
      details: error.message
    });
  }
});

router.get('/api/morphik/folders/:name', async (req, res) => {
  try {
    const apiKey = process.env.MORPHIK_API_KEY;
    const apiUrl = process.env.MORPHIK_API_URL || 'https://api.morphik.ai';

    if (!apiKey) {
      return res.status(503).json({
        error: 'Morphik service niet geconfigureerd',
        code: 'MORPHIK_NOT_CONFIGURED'
      });
    }

    const response = await fetch(`${apiUrl}/folders/${encodeURIComponent(req.params.name)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Morphik API error',
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Morphik folder error:', error);
    res.status(503).json({
      error: 'Service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      details: error.message
    });
  }
});

router.post('/api/morphik/folders', async (req, res) => {
  try {
    const apiKey = process.env.MORPHIK_API_KEY;
    const apiUrl = process.env.MORPHIK_API_URL || 'https://api.morphik.ai';

    if (!apiKey) {
      return res.status(503).json({
        error: 'Morphik service niet geconfigureerd',
        code: 'MORPHIK_NOT_CONFIGURED'
      });
    }

    const response = await fetch(`${apiUrl}/folders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Morphik API error',
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Morphik create folder error:', error);
    res.status(503).json({
      error: 'Service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      details: error.message
    });
  }
});

// File upload endpoint - handles multipart form data
router.post('/api/morphik/ingest/file', async (req, res) => {
  try {
    const apiKey = process.env.MORPHIK_API_KEY;
    const apiUrl = process.env.MORPHIK_API_URL || 'https://api.morphik.ai';

    if (!apiKey) {
      return res.status(503).json({
        error: 'Morphik service niet geconfigureerd',
        code: 'MORPHIK_NOT_CONFIGURED'
      });
    }

    // Note: This is a simplified version. In production, you'd use multer
    // to properly handle multipart/form-data uploads
    // For now, we expect the frontend to send base64 or similar

    const formData = new FormData();

    // Handle file upload - expecting file data in request
    if (req.body.file) {
      // Convert base64 or buffer to proper file format
      const fileBuffer = Buffer.from(req.body.file, 'base64');
      formData.append('file', fileBuffer, {
        filename: req.body.filename || 'document.pdf',
        contentType: 'application/pdf'
      });
    }

    if (req.body.folder_name) {
      formData.append('folder_name', req.body.folder_name);
    }

    if (req.body.metadata) {
      formData.append('metadata', JSON.stringify(req.body.metadata));
    }

    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${apiUrl}/ingest/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        body: formData,
        signal: AbortSignal.timeout(120000) // 2 minute timeout for file uploads
      });

      // Don't retry on client errors (4xx) except rate limiting
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return res;
      }

      // Retry on server errors, network errors, and rate limiting
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Upload failed',
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Morphik file upload error:', error);
    res.status(503).json({
      error: 'Service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      message: 'File upload mislukt',
      details: error.message
    });
  }
});

router.get('/api/morphik/documents/:id/status', async (req, res) => {
  try {
    const apiKey = process.env.MORPHIK_API_KEY;
    const apiUrl = process.env.MORPHIK_API_URL || 'https://api.morphik.ai';

    if (!apiKey) {
      return res.status(503).json({
        error: 'Morphik service niet geconfigureerd',
        code: 'MORPHIK_NOT_CONFIGURED'
      });
    }

    const response = await fetch(`${apiUrl}/documents/${req.params.id}/status`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Morphik API error',
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Morphik status error:', error);
    res.status(503).json({
      error: 'Service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      details: error.message
    });
  }
});

router.get('/api/morphik/retrieve/docs', async (req, res) => {
  try {
    const apiKey = process.env.MORPHIK_API_KEY;
    const apiUrl = process.env.MORPHIK_API_URL || 'https://api.morphik.ai';

    if (!apiKey) {
      return res.status(503).json({
        error: 'Morphik service niet geconfigureerd',
        code: 'MORPHIK_NOT_CONFIGURED'
      });
    }

    const queryString = new URLSearchParams(req.query).toString();
    const response = await fetch(`${apiUrl}/retrieve/docs?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Morphik API error',
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Morphik retrieve error:', error);
    res.status(503).json({
      error: 'Service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      details: error.message
    });
  }
});

module.exports = router;