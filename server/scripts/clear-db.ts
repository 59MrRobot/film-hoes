import * as dotenv from 'dotenv';
import path from 'path';

// Load .env file explicitly before importing the db connection
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Use dynamic import to prevent hoisting issues
async function main() {
  const { prisma } = await import('../src/db');
  
  console.log("Clearing database tables...");
  
  try {
    // Delete in order to respect foreign key constraints
    await prisma.vote.deleteMany();
    await prisma.nomination.deleteMany();
    await prisma.week.deleteMany();
    
    console.log("✅ Successfully cleared Votes, Nominations, and Weeks tables.");
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
