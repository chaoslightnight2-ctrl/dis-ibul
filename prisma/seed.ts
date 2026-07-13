import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.treatmentCategory.upsert({
    where: { slug: "implant" },
    update: {},
    create: {
      slug: "implant",
      name: "İmplant",
      description: "Demo tedavi kategorisi. Production seed gerçek kişi/klinik adı içermez.",
    },
  });

  await prisma.treatment.upsert({
    where: { slug: "tek-dis-implanti" },
    update: {},
    create: {
      slug: "tek-dis-implanti",
      categoryId: category.id,
      name: "Tek diş implantı",
      pricingUnit: "diş başına",
      patientInfoText: "Kesin tedavi planı muayene sonrası belirlenir.",
      riskWarning: "Bu içerik teşhis veya tedavi önerisi değildir.",
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
