const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DUMMY_ID = '00000000-0000-0000-0000-000000000000';

app.get('/ping-database', async (req, res) => {
  let projects = [];

  // Parse the projects configuration from environment variables
  try {
    projects = JSON.parse(process.env.SUPABASE_PROJECTS || '[]');
  } catch (parseError) {
    console.error('Failed to parse SUPABASE_PROJECTS environment variable:', parseError);
    return res.status(500).send('Configuration error: Invalid JSON in SUPABASE_PROJECTS.');
  }

  if (projects.length === 0) {
    return res.status(400).send('No Supabase projects configured.');
  }

  const results = [];

  // Loop through each configured project
  for (const proj of projects) {
    const { name, url, key } = proj;
    console.log(`Processing keep-alive for project: ${name || url}...`);

    try {
      if (!url || !key) {
        throw new Error('Missing URL or service key for this project config.');
      }

      const supabase = createClient(url, key);

      // 1. Write operation
      const { error: insertError } = await supabase
        .from('keep_alive')
        .upsert([{ id: DUMMY_ID }]);

      if (insertError) throw insertError;

      // 2. Delete operation
      const { error: deleteError } = await supabase
        .from('keep_alive')
        .delete()
        .eq('id', DUMMY_ID);

      if (deleteError) throw deleteError;

      results.push({ project: name || url, status: 'Success' });
      console.log(`Successfully completed keep-alive for ${name || url}`);
    } catch (error) {
      console.error(`Error during keep-alive for ${name || url}:`, error.message);
      results.push({ project: name || url, status: 'Failed', error: error.message });
    }
  }

  // Determine if there were any failures
  const hasFailures = results.some(r => r.status === 'Failed');
  const responseCode = hasFailures ? 207 : 200; // 207 Multi-Status if some failed

  res.status(responseCode).json({
    message: 'Process completed.',
    results: results
  });
});

app.get('/', (req, res) => {
  res.send('Supabase keep-alive server is active.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
