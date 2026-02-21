const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { sensitiveLimiter } = require('../middleware/rateLimit');
const { createNotification } = require('../utils/notify');

function doctorGuard(req, res, next) {
  if (req.user.role !== 'DOCTOR') return res.status(403).json({ msg: 'Doctor access required' });
  next();
}

// @route   POST /api/v1/ai/analyze
const analyzeSchema = z.object({
  symptoms: z.string().min(3, 'Describe symptoms in at least 3 characters').max(2000),
});

router.post('/analyze', auth, doctorGuard, sensitiveLimiter, validate(analyzeSchema), async (req, res) => {
  try {
    const { symptoms } = req.body;
    const lower = symptoms.toLowerCase();

    // Simple rule-based AI (placeholder for real ML model)
    let diagnosis = 'General consultation recommended';
    let confidence = 0.5;
    let suggestions = ['Consult a specialist', 'Run blood work'];

    if (lower.includes('headache') || lower.includes('migraine')) {
      diagnosis = 'Tension-type headache / potential migraine';
      confidence = 0.72;
      suggestions = ['Ibuprofen 400mg', 'Rest in dark room', 'Check blood pressure'];
    } else if (lower.includes('fever') || lower.includes('temperature')) {
      diagnosis = 'Possible viral infection';
      confidence = 0.68;
      suggestions = ['Paracetamol 500mg', 'Hydration', 'Monitor temperature'];
    } else if (lower.includes('cough') || lower.includes('throat')) {
      diagnosis = 'Upper respiratory tract infection';
      confidence = 0.65;
      suggestions = ['Throat lozenges', 'Warm fluids', 'Amoxicillin if bacterial'];
    } else if (lower.includes('stomach') || lower.includes('nausea') || lower.includes('vomit')) {
      diagnosis = 'Gastroenteritis / food poisoning';
      confidence = 0.61;
      suggestions = ['ORS solution', 'Bland diet', 'Metoclopramide if severe'];
    } else if (lower.includes('itch') || lower.includes('rash') || lower.includes('skin')) {
      diagnosis = 'Possible allergic reaction / dermatitis';
      confidence = 0.58;
      suggestions = ['Antihistamine', 'Hydrocortisone cream', 'Identify allergen'];
    } else if (lower.includes('anxiety') || lower.includes('panic') || lower.includes('stress')) {
      diagnosis = 'Anxiety disorder symptoms';
      confidence = 0.64;
      suggestions = ['Deep breathing exercises', 'Consider CBT referral', 'Short-term anxiolytic'];
    }

    logger.info('AI analysis performed', { doctorId: req.user.id, diagnosis });
    res.json({ diagnosis, confidence, suggestions });
  } catch (err) {
    logger.error('AI analyze error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/ai/prescribe
const prescribeSchema = z.object({
  consultationId: z.string().uuid(),
  medication: z.string().min(2).max(200),
  dosage: z.string().min(1).max(100),
  instructions: z.string().max(500).default('Take as directed'),
});

router.post('/prescribe', auth, doctorGuard, sensitiveLimiter, validate(prescribeSchema), async (req, res) => {
  try {
    const { consultationId, medication, dosage, instructions } = req.body;

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation || consultation.deletedAt) {
      return res.status(404).json({ msg: 'Consultation not found' });
    }
    if (consultation.doctorId !== req.user.id) {
      return res.status(403).json({ msg: 'Not your consultation' });
    }

    const medications = [{ name: medication, dosage, instructions }];

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: { consultationId, medications },
    });

    // Auto-create order
    const orderId = `#ORD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const secureCode = String(Math.floor(1000 + Math.random() * 9000));

    const order = await prisma.order.create({
      data: {
        publicOrderId: orderId,
        prescriptionId: prescription.id,
        patientId: consultation.patientId,
        status: 'PENDING',
        secureCode,
      },
    });

    // Send system message in chat
    const io = req.app.get('io');
    const systemContent = `💊 Prescription: ${medication} (${dosage}) — ${instructions}`;

    const message = await prisma.message.create({
      data: {
        consultationId,
        senderId: req.user.id,
        content: systemContent,
        isSystem: true,
      },
    });

    if (io) io.to(consultationId).emit('receive_message', message);

    // Notify patient
    await createNotification(
      consultation.patientId,
      'PRESCRIPTION',
      'New prescription',
      `${medication} (${dosage}) has been prescribed.`
    );

    // Notify pharmacists
    const pharmacists = await prisma.user.findMany({
      where: { role: 'PHARMACIST', deletedAt: null },
      select: { id: true },
    });
    for (const p of pharmacists) {
      await createNotification(p.id, 'ORDER', 'New order received', `Order ${orderId} needs preparation.`);
    }

    logger.info('Prescription issued', { consultationId, orderId, medication });
    res.json({ prescription, order });
  } catch (err) {
    logger.error('Prescribe error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
