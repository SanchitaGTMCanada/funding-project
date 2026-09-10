import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb({
  host: "localhost",
  user: "root",
  database: "funding_management",
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const employeePassword = await bcrypt.hash("Employee@123", 12);

  // Super Admin
  await prisma.user.upsert({
    where: {
      email: "admin@funding.com",
    },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@funding.com",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
    },
  });

  // Normal Employee
  await prisma.user.upsert({
    where: {
      email: "employee@funding.com",
    },
    update: {},
    create: {
      name: "Normal Employee",
      email: "employee@funding.com",
      passwordHash: employeePassword,
      role: "EMPLOYEE",
    },
  });

  console.log("Users seeded successfully.");
  console.log("");
  console.log("Super Admin:");
  console.log("Email: admin@funding.com");
  console.log("Password: Admin@123");
  console.log("");
  console.log("Employee:");
  console.log("Email: employee@funding.com");
  console.log("Password: Employee@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });