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

  // Create demo student
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
          firstName: 'Arjun',
          lastName: 'Sharma',
          headline: 'CS Student | Full-Stack Developer | Open to Opportunities',
          bio: 'Passionate computer science student with a love for building scalable web applications. Currently exploring AI/ML and cloud technologies.',
          location: 'Mumbai, India',
          rollNumber: '2021CS001',
          batch: '2021-2025',
          cgpa: 8.7,
          completionScore: 85,
          isPublic: true,
          portfolioSlug: 'arjun-sharma-demo',
          linkedinUrl: 'https://linkedin.com/in/arjun-sharma',
          githubUrl: 'https://github.com/arjun-sharma',
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
          firstName: 'Dr. Priya',
          lastName: 'Mehta',
          headline: 'Associate Professor | Computer Science',
          bio: 'Associate Professor with 15 years of experience in software engineering and AI research.',
          location: 'Mumbai, India',
          completionScore: 90,
          isPublic: true,
          portfolioSlug: 'dr-priya-mehta-demo',
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
      title: 'Smart India Hackathon 2023 — Winner',
      description: 'Won first place in the national-level Smart India Hackathon with a solution for smart waste management.',
      category: 'HACKATHON' as const,
      issuingAuthority: 'Ministry of Education, India',
      issueDate: new Date('2023-08-15'),
      status: 'APPROVED' as const,
      isPublic: true,
    },
    {
      title: 'AWS Cloud Practitioner Certification',
      description: 'Earned the AWS Certified Cloud Practitioner certification demonstrating foundational cloud knowledge.',
      category: 'CERTIFICATION' as const,
      issuingAuthority: 'Amazon Web Services',
      issueDate: new Date('2023-06-20'),
      credentialId: 'AWS-CP-2023-001',
      credentialUrl: 'https://aws.amazon.com/certification',
      status: 'APPROVED' as const,
      isPublic: true,
    },
    {
      title: 'Google Summer Internship 2023',
      description: 'Completed a 3-month software engineering internship at Google, working on the Search infrastructure team.',
      category: 'INTERNSHIP' as const,
      issuingAuthority: 'Google LLC',
      issueDate: new Date('2023-05-01'),
      status: 'APPROVED' as const,
      isPublic: true,
    },
    {
      title: 'Research Paper: ML in Healthcare',
      description: 'Published a research paper on applying machine learning for early disease detection in IEEE conference.',
      category: 'RESEARCH' as const,
      issuingAuthority: 'IEEE',
      issueDate: new Date('2023-09-10'),
      status: 'SUBMITTED' as const,
      isPublic: true,
    },
    {
      title: 'Technical Club President',
      description: 'Served as President of the university technical club, organizing 20+ events and workshops.',
      category: 'LEADERSHIP' as const,
      issuingAuthority: 'University Technical Club',
      issueDate: new Date('2022-07-01'),
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
        content: '🏆 Excited to share that I won the Smart India Hackathon 2023! Our team built a smart waste management solution using IoT and ML. Grateful for the amazing team and mentors! #SIH2023 #Innovation',
        isPublic: true,
        likesCount: 42,
      },
      {
        userId: faculty.id,
        type: 'ANNOUNCEMENT',
        content: '📢 Reminder: The deadline for submitting achievements for this semester is December 31st. Please ensure all your certifications and internship documents are uploaded and submitted for verification. Reach out if you need help!',
        isPublic: true,
        likesCount: 15,
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
        title: 'Google Professional ML Engineer',
        description: 'Based on your Python and ML skills, this certification would significantly boost your profile for AI/ML roles.',
        url: 'https://cloud.google.com/certification/machine-learning-engineer',
        relevance: 0.95,
      },
      {
        userId: student.id,
        type: 'internship',
        title: 'Apply for Microsoft SWE Internship',
        description: 'Your React and Node.js skills align perfectly with Microsoft\'s internship requirements. Applications open now!',
        url: 'https://careers.microsoft.com/students',
        relevance: 0.90,
      },
      {
        userId: student.id,
        type: 'club',
        title: 'Join the AI Research Club',
        description: 'Given your interest in ML, joining the AI Research Club would help you collaborate on projects and build your network.',
        relevance: 0.85,
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
