import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'CS' },
      update: {},
      create: { name: 'Computer Science', code: 'CS', description: 'Department of Computer Science & Engineering' },
    }),
    prisma.department.upsert({
      where: { code: 'EC' },
      update: {},
      create: { name: 'Electronics & Communication', code: 'EC', description: 'Department of Electronics & Communication Engineering' },
    }),
    prisma.department.upsert({
      where: { code: 'ME' },
      update: {},
      create: { name: 'Mechanical Engineering', code: 'ME', description: 'Department of Mechanical Engineering' },
    }),
    prisma.department.upsert({
      where: { code: 'MBA' },
      update: {},
      create: { name: 'Business Administration', code: 'MBA', description: 'School of Business Administration' },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  const hashedPassword = await bcrypt.hash('demo123', 12);

  // Create demo student — Aditya Singh Rajput
  const student = await prisma.user.upsert({
    where: { email: 'student@demo.com' },
    update: {},
    create: {
      email: 'student@demo.com',
      password: hashedPassword,
      role: 'STUDENT',
      isEmailVerified: true,
      departmentId: departments[0].id,
      profile: {
        create: {
          firstName: 'Aditya',
          lastName: 'Singh Rajput',
          headline: 'Final Year CSE Student | Full-Stack Developer | AI/ML Enthusiast',
          bio: 'Final year Computer Science student passionate about building scalable web applications and AI-powered systems. Creator of Uni-Connect — an AI-powered university achievement platform. Actively exploring cloud technologies and open-source contributions.',
          location: 'Lucknow, Uttar Pradesh, India',
          rollNumber: '2021CS047',
          batch: '2021-2025',
          cgpa: 8.4,
          completionScore: 92,
          isPublic: true,
          portfolioSlug: 'aditya-singh-rajput',
          linkedinUrl: 'https://linkedin.com/in/adityasinghrajput',
          githubUrl: 'https://github.com/adityarajputpvt',
        },
      },
    },
    include: { profile: true },
  });

  // Create demo faculty
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@demo.com' },
    update: {},
    create: {
      email: 'faculty@demo.com',
      password: hashedPassword,
      role: 'FACULTY',
      isEmailVerified: true,
      departmentId: departments[0].id,
      profile: {
        create: {
          firstName: 'Dr. Suresh',
          lastName: 'Pandey',
          headline: 'Associate Professor | Computer Science & Engineering | HBTU Kanpur',
          bio: 'Associate Professor with 14 years of experience in software engineering, distributed systems, and AI research. Project guide for Uni-Connect.',
          location: 'Kanpur, Uttar Pradesh, India',
          completionScore: 88,
          isPublic: true,
          portfolioSlug: 'dr-suresh-pandey',
        },
      },
    },
  });

  // Create demo admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          headline: 'Platform Administrator',
          completionScore: 70,
          isPublic: false,
          portfolioSlug: 'admin-user-demo',
        },
      },
    },
  });

  console.log(`✅ Created demo users: student, faculty, admin`);

  // Create skills
  const skillNames = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Machine Learning', 'AWS', 'Docker'];
  const skillsCreated = await Promise.all(
    skillNames.map(name =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name, category: 'Technical' },
      })
    )
  );

  // Add skills to student profile
  if (student.profile) {
    for (const skill of skillsCreated.slice(0, 5)) {
      await prisma.profileSkill.upsert({
        where: { profileId_skillId: { profileId: student.profile.id, skillId: skill.id } },
        update: {},
        create: { profileId: student.profile.id, skillId: skill.id, level: 'intermediate' },
      });
    }
  }

  // Create sample achievements for student
  const achievements = [
    {
      title: 'Smart India Hackathon 2024 — Finalist',
      description: 'Reached the national finals of Smart India Hackathon 2024 with Uni-Connect — an AI-powered university achievement platform. Presented to a panel of industry experts and government officials.',
      category: 'HACKATHON' as const,
      issuingAuthority: 'Ministry of Education, Government of India',
      issueDate: new Date('2024-03-10'),
      status: 'APPROVED' as const,
      isPublic: true,
    },
    {
      title: 'AWS Certified Cloud Practitioner',
      description: 'Earned the AWS Certified Cloud Practitioner certification demonstrating foundational knowledge of AWS cloud services, architecture, security, and pricing.',
      category: 'CERTIFICATION' as const,
      issuingAuthority: 'Amazon Web Services (AWS)',
      issueDate: new Date('2024-01-18'),
      credentialId: 'AWS-CCP-2024-ASR',
      credentialUrl: 'https://aws.amazon.com/certification/certified-cloud-practitioner',
      status: 'APPROVED' as const,
      isPublic: true,
    },
    {
      title: 'Full-Stack Web Development Internship — TechSolutions Pvt. Ltd.',
      description: 'Completed a 3-month full-stack development internship, building RESTful APIs with Node.js and React dashboards. Contributed to a live production application serving 10,000+ users.',
      category: 'INTERNSHIP' as const,
      issuingAuthority: 'TechSolutions Pvt. Ltd., Lucknow',
      issueDate: new Date('2023-07-01'),
      status: 'APPROVED' as const,
      isPublic: true,
    },
    {
      title: 'Research Paper: AI-Powered Achievement Verification in Universities',
      description: 'Authored a research paper on using machine learning and OCR for automated academic achievement verification, submitted to the International Journal of Computer Applications (IJCA).',
      category: 'RESEARCH' as const,
      issuingAuthority: 'International Journal of Computer Applications (IJCA)',
      issueDate: new Date('2024-08-20'),
      status: 'SUBMITTED' as const,
      isPublic: true,
    },
    {
      title: 'Technical Club Secretary — CSE Department',
      description: 'Served as Secretary of the CSE Technical Club for 2023-24, organizing 15+ workshops, coding contests, and guest lectures. Increased club membership by 40%.',
      category: 'LEADERSHIP' as const,
      issuingAuthority: 'Department of Computer Science & Engineering',
      issueDate: new Date('2023-08-01'),
      status: 'APPROVED' as const,
      isPublic: true,
    },
    {
      title: 'Meta Front-End Developer Professional Certificate',
      description: 'Completed the Meta Front-End Developer Professional Certificate on Coursera, covering React, JavaScript, HTML/CSS, and UX/UI design principles.',
      category: 'CERTIFICATION' as const,
      issuingAuthority: 'Meta (via Coursera)',
      issueDate: new Date('2023-11-05'),
      credentialId: 'META-FE-2023-ASR',
      credentialUrl: 'https://coursera.org/professional-certificates/meta-front-end-developer',
      status: 'APPROVED' as const,
      isPublic: true,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: {
        ...achievement,
        userId: student.id,
        departmentId: departments[0].id,
      },
    });
  }

  console.log(`✅ Created ${achievements.length} sample achievements`);

  // Create sample posts
  await prisma.post.createMany({
    data: [
      {
        userId: student.id,
        type: 'ACHIEVEMENT',
        content: '🏆 Thrilled to share that Uni-Connect reached the national finals of Smart India Hackathon 2024! We built an AI-powered university achievement platform that helps students track, verify, and showcase their academic journey. Grateful to my mentors and teammates! #SIH2024 #UniConnect #FinalYearProject',
        isPublic: true,
        likesCount: 38,
      },
      {
        userId: faculty.id,
        type: 'ANNOUNCEMENT',
        content: '📢 Reminder to all final year students: The deadline for submitting your project achievements and internship certificates for this semester is January 15th. Please upload all documents on Uni-Connect and submit for verification. Reach out if you need assistance!',
        isPublic: true,
        likesCount: 22,
      },
      {
        userId: student.id,
        type: 'GENERAL',
        content: '✅ Just earned my AWS Certified Cloud Practitioner certification! It took 6 weeks of consistent preparation. Happy to share resources and tips with anyone preparing for it. Drop a comment or DM me! ☁️ #AWS #CloudComputing #Certification',
        isPublic: true,
        likesCount: 54,
      },
    ],
  });

  console.log('✅ Created sample posts');

  // Create sample recommendations
  await prisma.recommendation.createMany({
    data: [
      {
        userId: student.id,
        type: 'certification',
        title: 'AWS Solutions Architect — Associate',
        description: 'You already have the Cloud Practitioner cert. The next step is Solutions Architect Associate — highly valued by top tech companies and a natural progression for your profile.',
        url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate',
        relevance: 0.96,
      },
      {
        userId: student.id,
        type: 'internship',
        title: 'Apply for Product-Based Company Placements',
        description: 'Your React, Node.js, and cloud skills align well with product companies. Focus on DSA preparation alongside your final year project to crack campus placements.',
        url: 'https://www.linkedin.com/jobs/software-engineer-jobs',
        relevance: 0.92,
      },
      {
        userId: student.id,
        type: 'certification',
        title: 'Google Associate Cloud Engineer',
        description: 'Diversifying your cloud certifications with GCP alongside AWS will make your profile stand out significantly for cloud and DevOps roles.',
        url: 'https://cloud.google.com/certification/cloud-engineer',
        relevance: 0.88,
      },
    ],
  });

  console.log('✅ Created sample recommendations');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\nDemo credentials:');
  console.log('  Student: student@demo.com / demo123');
  console.log('  Faculty: faculty@demo.com / demo123');
  console.log('  Admin:   admin@demo.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
