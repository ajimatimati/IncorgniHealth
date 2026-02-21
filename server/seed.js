const { PrismaClient } = require('@prisma/client');
const { hashData } = require('./utils/crypto');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function seed() {
  console.log('Seeding Database...');

  // 1. Create a Doctor
  const doctorPhone = "+23480DOCTOR00";
  const doctorHash = hashData(doctorPhone);
  
  const doctor = await prisma.user.upsert({
    where: { publicId: 'DR-SMITH-001' },
    update: {},
    create: {
      publicId: 'DR-SMITH-001',
      role: 'DOCTOR',
      dataHash: doctorHash,
      nickname: 'Dr. Smith',
      sex: 'Male',
      avatar: 'doc_avatar_1.png'
    },
  });

  console.log('Created Doctor:', doctor.publicId);

  // 2. Create some Patients (Ghosts)
  for (let i = 1; i <= 5; i++) {
    const pid = `#GH-TEST-${1000 + i}`;
    await prisma.user.upsert({
      where: { publicId: pid },
      update: {},
      create: {
        publicId: pid,
        role: 'PATIENT',
        dataHash: hashData(`+23480TEST00${i}`),
        nickname: `Ghost ${i}`,
        age: 20 + i * 2,
        sex: i % 2 === 0 ? 'Female' : 'Male'
      }
    });
  }
  
  console.log('Created 5 Test Patients');

  // 3. Create active Consultations for the Doctor (Queue)
  // Get all patients
  const patients = await prisma.user.findMany({ where: { role: 'PATIENT' } });
  
  for (const p of patients) {
      await prisma.consultation.create({
          data: {
              patientId: p.id,
              doctorId: doctor.id,
              status: 'PENDING'
          }
      });
  }
  
  console.log('Created Consultations for Queue');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
