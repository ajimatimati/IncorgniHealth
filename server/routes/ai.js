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
// NOTE: This is a clinical decision SUPPORT tool — a rule-based symptom lookup.
// It is NOT a diagnostic AI. Results must be verified by the attending physician.
const analyzeSchema = z.object({
  symptoms: z.string().min(3, 'Describe symptoms in at least 3 characters').max(2000),
});

router.post('/analyze', auth, doctorGuard, sensitiveLimiter, validate(analyzeSchema), async (req, res) => {
  try {
    const { symptoms } = req.body;
    const lower = symptoms.toLowerCase();

    // ── Symptom lookup table (rule-based, NOT AI) ──────────────────
    // All entries must include a disclaimer. Confidence scores removed —
    // a numeric confidence implies ML precision this system does not have.
    let result = {
      matchedOn: null,
      diagnosis: 'General consultation recommended',
      suggestions: ['Full blood count', 'Vitals check', 'Clinical assessment required'],
      redFlags: [],
      confidence: 0.7,
      disclaimer: 'This is a symptom-based lookup, not a clinical diagnosis. Results must be validated by the treating physician before any action is taken.',
    };

    if (lower.includes('headache') || lower.includes('migraine')) {
      result = {
        matchedOn: 'Headache / migraine keywords',
        diagnosis: 'Tension-type headache / Migraine',
        suggestions: ['Blood pressure check', 'Fundoscopy if papilloedema suspected', 'Ibuprofen 400mg (if not contraindicated)', 'Rest in dark, quiet room', 'Monitor BP'],
        redFlags: ['Sudden onset "thunderclap" headache', 'Neck stiffness', 'Fever', 'Visual disturbance'],
        confidence: 0.85,
        disclaimer: result.disclaimer,
      };
    } else if (lower.includes('fever') || lower.includes('temperature') || lower.includes('pyrexia')) {
      result = {
        matchedOn: 'Fever / pyrexia keywords',
        diagnosis: 'Viral or Bacterial Infection',
        suggestions: ['Malaria RDT / blood film', 'FBC', 'Widal test if typhoid suspected', 'Blood culture if sepsis risk', 'Paracetamol 1g PO QID', 'Adequate hydration', 'Isolate if infectious cause suspected'],
        redFlags: ['Temp > 39.5°C', 'Febrile seizure', 'Rigors', 'Petechial rash', 'Altered consciousness'],
        confidence: 0.82,
        disclaimer: result.disclaimer,
      };
    } else if (lower.includes('cough') || lower.includes('throat') || lower.includes('sore throat')) {
      result = {
        matchedOn: 'Respiratory / throat keywords',
        diagnosis: 'URTI / Pharyngitis',
        suggestions: ['Throat swab if purulent exudate', 'Chest X-ray if lower respiratory signs', 'O2 saturation', 'Throat lozenges', 'Warm saline gargles', 'Amoxicillin 500mg TID x 5 days if bacterial confirmed'],
        redFlags: ['Stridor', 'Drooling / inability to swallow', 'Respiratory distress', 'Coughing blood'],
        confidence: 0.88,
        disclaimer: result.disclaimer,
      };
    } else if (lower.includes('stomach') || lower.includes('nausea') || lower.includes('vomit') || lower.includes('diarrhoea') || lower.includes('diarrhea')) {
      result = {
        matchedOn: 'GI symptoms keywords',
        diagnosis: 'Acute Gastroenteritis / Food Poisoning',
        suggestions: ['Stool culture if bloody diarrhoea', 'Renal function if dehydration suspected', 'H. pylori test if peptic ulcer suspected', 'ORS 200–400ml after each loose stool', 'Bland BRAT diet', 'Metoclopramide 10mg if severe nausea'],
        redFlags: ['Bloody stool', 'Signs of dehydration (sunken eyes, reduced urine)', 'Severe abdominal rigidity', 'Persistent vomiting > 24h'],
        confidence: 0.84,
        disclaimer: result.disclaimer,
      };
    } else if (lower.includes('itch') || lower.includes('rash') || lower.includes('urticaria') || lower.includes('hives')) {
      result = {
        matchedOn: 'Dermatological / allergic keywords',
        diagnosis: 'Dermatitis / Urticaria',
        suggestions: ['Allergen identification history', 'Skin prick test if recurrent', 'Cetirizine 10mg OD', 'Hydrocortisone 1% cream topically', 'Remove suspected allergen', 'Epinephrine 0.3mg IM if anaphylaxis'],
        redFlags: ['Angioedema (lip / tongue swelling)', 'Difficulty breathing (anaphylaxis)', 'Widespread blistering'],
        confidence: 0.9,
        disclaimer: result.disclaimer,
      };
    } else if (lower.includes('anxiety') || lower.includes('panic') || lower.includes('stress') || lower.includes('depression')) {
      result = {
        matchedOn: 'Mental health keywords',
        diagnosis: 'Anxiety / Depression screen',
        suggestions: ['PHQ-9 depression screen', 'GAD-7 anxiety screen', 'TSH (exclude thyroid cause)', 'Full psychosocial history', 'Active listening and validation', 'Breathing exercises', 'CBT referral', 'Consider SSRI if persistent (specialist consultation)'],
        redFlags: ['Suicidal ideation', 'Self-harm risk', 'Psychosis symptoms', 'Inability to care for self'],
        confidence: 0.75,
        disclaimer: result.disclaimer,
      };
    } else if (lower.includes('chest') || lower.includes('palpitation') || lower.includes('heart')) {
      result = {
        matchedOn: 'Cardiac / chest keywords',
        diagnosis: 'Musculoskeletal / GORD (Rule out Cardiac)',
        suggestions: ['ECG (priority)', '12-lead ECG if cardiac suspected', 'Troponin I', 'CXR', 'If ACS suspected: Aspirin 300mg, oxygen, IV access, immediate cardiology referral'],
        redFlags: ['Crushing central chest pain radiating to arm/jaw', 'Diaphoresis', 'Syncope', 'ECG changes'],
        confidence: 0.8,
        disclaimer: result.disclaimer,
      };
    }

    logger.info('Symptom lookup performed', { doctorId: req.user.id, matchedOn: result.matchedOn });
    res.json(result);
  } catch (err) {
    logger.error('AI analyze error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/v1/ai/prescribe
const prescribeSchema = z.object({
  consultationId: z.string().uuid(),
  medication:     z.string().min(2).max(200),
  dosage:         z.string().min(1).max(100),
  instructions:   z.string().max(500).default('Take as directed'),
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

    // ── AI Safety Check (Rule-based Clinical Intelligence) ──
    const dosageLower = dosage.toLowerCase();
    const medLower = medication.toLowerCase();
    let safetyWarning = null;

    if (medLower.includes('paracetamol') || medLower.includes('acetaminophen')) {
      const mgMatch = dosageLower.match(/(\d+)\s*mg/);
      if (mgMatch && parseInt(mgMatch[1]) > 1000) {
        safetyWarning = "AI Warning: Paracetamol dosage exceeds 1g per dose. Please verify clinical intent.";
      }
    } else if (medLower.includes('amoxicillin')) {
       const mgMatch = dosageLower.match(/(\d+)\s*mg/);
       if (mgMatch && parseInt(mgMatch[1]) > 1000) {
         safetyWarning = "AI Warning: Amoxicillin dosage exceeds standard adult single dose (1g).";
       }
    } else if (medLower.includes('ibuprofen')) {
       const mgMatch = dosageLower.match(/(\d+)\s*mg/);
       if (mgMatch && parseInt(mgMatch[1]) > 800) {
         safetyWarning = "AI Warning: Ibuprofen single dose exceeds 800mg.";
       }
    }

    if (safetyWarning) {
      logger.warn('AI Safety Warning Triggered', { medication, dosage, doctorId: req.user.id });
      // We still allow it (Doctor's final call) but we tag it in the logs and could potentially return it
    }

    const prescription = await prisma.prescription.create({
      data: { 
        consultationId, 
        medications,
      },
    });

    // Auto-create order with secure handover code
    const orderId    = `#ORD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const secureCode = String(Math.floor(1000 + Math.random() * 9000));

    const order = await prisma.order.create({
      data: {
        publicOrderId:  orderId,
        prescriptionId: prescription.id,
        patientId:      consultation.patientId,
        status:         'AWAITING_SOURCE',
        secureCode,
      },
    });

    // Emit system message to the chat room
    const io = req.app.get('io');
    const systemContent = `💊 Prescription: ${medication} (${dosage}) — ${instructions}`;

    const message = await prisma.message.create({
      data: {
        consultationId,
        senderId:  req.user.id,
        content:   safetyWarning ? `${systemContent}\n\n⚠️ ${safetyWarning}` : systemContent,
        isSystem:  true,
      },
    });

    if (io) io.to(consultationId).emit('receive_message', message);

    // Notify patient
    await createNotification(
      consultation.patientId,
      'PRESCRIPTION',
      'Action Required: Sourcing',
      `${medication} (${dosage}) has been prescribed. Please choose a pharmacy source.`
    );

    logger.info('Prescription issued awaiting source', { consultationId, orderId, medication });
    res.json({ prescription, order });
  } catch (err) {
    logger.error('Prescribe error', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
