const express = require('express');
const request = require('supertest');
const { z } = require('zod');
const validate = require('./middleware/validate');

const app = express();
app.use(express.json());

const schema = z.object({
  phone: z.string().min(10),
  role: z.enum(['PATIENT', 'DOCTOR']).default('PATIENT'),
});

app.post('/test', validate(schema), (req, res) => {
  res.status(200).json({ msg: 'Success' });
});

async function run() {
  console.log('--- Testing Validation Middleware ---');
  
  // Test 1: Valid input
  try {
    const res = await request(app).post('/test').send({ phone: '1234567890' });
    console.log('Valid input:', res.status, res.body);
  } catch (e) {
    console.error('Test 1 error:', e);
  }

  // Test 2: Invalid input (missing phone)
  try {
    const res = await request(app).post('/test').send({ role: 'PATIENT' });
    console.log('Invalid input (missing phone):', res.status, res.body);
  } catch (e) {
    console.error('Test 2 error:', e);
  }
}

run();
