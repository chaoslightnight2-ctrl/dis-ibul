import { prisma } from "../src/lib/prisma";

const subscriptionPlans = [
  {
    slug: "baslangic",
    name: "Başlangıç",
    description: "Kliniğinizi yayınlayın ve temel hasta taleplerini tek yerden yönetin.",
    monthlyPrice: 0,
    features: ["Yayınlanan klinik profili", "Randevu ve teklif talepleri", "Temel profil istatistikleri", "1 klinik yöneticisi"],
    trialDays: 0,
    displayOrder: 10,
    isPopular: false,
    iyzicoPricingPlanRefCode: null,
  },
  {
    slug: "buyume",
    name: "Büyüme",
    description: "Daha fazla hasta talebi alan ve operasyonunu ölçmek isteyen klinikler için.",
    monthlyPrice: 1490,
    features: ["Başlangıç planındaki her şey", "Gelişmiş performans istatistikleri", "Öncelikli profil görünürlüğü", "5 ekip üyesi", "Öncelikli destek"],
    trialDays: 0,
    displayOrder: 20,
    isPopular: true,
    iyzicoPricingPlanRefCode: process.env.IYZICO_PLAN_GROWTH_REF || null,
  },
  {
    slug: "profesyonel",
    name: "Profesyonel",
    description: "Çok şubeli klinikler ve yüksek hacimli ekipler için gelişmiş yönetim.",
    monthlyPrice: 2990,
    features: ["Büyüme planındaki her şey", "Çoklu şube yönetimi", "Sınırsız ekip üyesi", "Özel performans raporları", "Öncelikli hesap yöneticisi"],
    trialDays: 0,
    displayOrder: 30,
    isPopular: false,
    iyzicoPricingPlanRefCode: process.env.IYZICO_PLAN_PRO_REF || null,
  },
];

const catalog = [
  {
    category: { slug: "implant", name: "İmplant" },
    treatment: { slug: "tek-dis-implanti", name: "Tek diş implantı", pricingUnit: "diş başına" },
  },
  {
    category: { slug: "protez", name: "Protetik diş tedavisi" },
    treatment: { slug: "zirkonyum-kaplama", name: "Zirkonyum kaplama", pricingUnit: "diş başına" },
  },
  {
    category: { slug: "ortodonti", name: "Ortodonti" },
    treatment: { slug: "seffaf-plak-tedavisi", name: "Şeffaf plak tedavisi", pricingUnit: "tedavi planı" },
  },
  {
    category: { slug: "pedodonti", name: "Çocuk diş hekimliği" },
    treatment: { slug: "cocuk-dis-hekimligi", name: "Çocuk diş hekimliği", pricingUnit: "seans başına" },
  },
] as const;

type PriceSeed = {
  treatmentSlug: string;
  minPrice?: number;
  maxPrice?: number;
  fixedPrice?: number;
  priceUnit: string;
};

async function main() {
  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  const treatments = new Map<string, { id: string }>();
  for (const item of catalog) {
    const category = await prisma.treatmentCategory.upsert({
      where: { slug: item.category.slug },
      update: { name: item.category.name },
      create: {
        slug: item.category.slug,
        name: item.category.name,
        description: `${item.category.name} alanındaki tedaviler.`,
      },
    });
    const treatment = await prisma.treatment.upsert({
      where: { slug: item.treatment.slug },
      update: { name: item.treatment.name, pricingUnit: item.treatment.pricingUnit },
      create: {
        slug: item.treatment.slug,
        categoryId: category.id,
        name: item.treatment.name,
        pricingUnit: item.treatment.pricingUnit,
        patientInfoText: "Kesin tedavi planı muayene sonrasında belirlenir.",
        riskWarning: "Bu içerik teşhis veya tedavi önerisi değildir.",
      },
    });
    treatments.set(item.treatment.slug, treatment);
  }

  const sampleClinics: Array<{
    slug: string;
    name: string;
    city: string;
    district: string;
    neighborhood: string;
    address: string;
    firstExamFee: number;
    freeInitialExam: boolean;
    verified: boolean;
    prices: PriceSeed[];
    unavailableTreatmentSlugs: string[];
  }> = [
    {
      slug: "mavi-gulus-klinigi",
      name: "Mavi Gülüş Kliniği",
      city: "İstanbul",
      district: "Kadıköy",
      neighborhood: "Kozyatağı",
      address: "Kozyatağı Mah. Örnek Cad. No:12 Kadıköy/İstanbul",
      firstExamFee: 0,
      freeInitialExam: true,
      verified: true,
      unavailableTreatmentSlugs: ["cocuk-dis-hekimligi"],
      prices: [
        { treatmentSlug: "tek-dis-implanti", minPrice: 14500, maxPrice: 22000, priceUnit: "diş başına" },
        { treatmentSlug: "zirkonyum-kaplama", fixedPrice: 8500, priceUnit: "diş başına" },
      ],
    },
    {
      slug: "nova-dent-agiz-dis-sagligi",
      name: "Nova Dent Ağız ve Diş Sağlığı",
      city: "Ankara",
      district: "Çankaya",
      neighborhood: "Çukurambar",
      address: "Çukurambar Mah. Örnek Sok. No:8 Çankaya/Ankara",
      firstExamFee: 750,
      freeInitialExam: false,
      verified: true,
      unavailableTreatmentSlugs: ["cocuk-dis-hekimligi"],
      prices: [
        { treatmentSlug: "tek-dis-implanti", minPrice: 12000, maxPrice: 19000, priceUnit: "diş başına" },
        { treatmentSlug: "seffaf-plak-tedavisi", minPrice: 32000, maxPrice: 64000, priceUnit: "tedavi planı" },
      ],
    },
    {
      slug: "ege-cocuk-dis",
      name: "Ege Çocuk Diş Merkezi",
      city: "İzmir",
      district: "Karşıyaka",
      neighborhood: "Bostanlı",
      address: "Bostanlı Mah. Örnek Bulvarı No:22 Karşıyaka/İzmir",
      firstExamFee: 450,
      freeInitialExam: false,
      verified: false,
      unavailableTreatmentSlugs: ["tek-dis-implanti"],
      prices: [
        { treatmentSlug: "cocuk-dis-hekimligi", minPrice: 1800, maxPrice: 4200, priceUnit: "seans başına" },
      ],
    },
  ];

  for (const item of sampleClinics) {
    const clinic = await prisma.clinic.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        city: item.city,
        district: item.district,
        neighborhood: item.neighborhood,
        address: item.address,
        firstExamFee: item.firstExamFee,
        freeInitialExam: item.freeInitialExam,
        isPublished: true,
        verificationStatus: item.verified ? "VERIFIED" : "IN_REVIEW",
      },
      create: {
        slug: item.slug,
        name: item.name,
        city: item.city,
        district: item.district,
        neighborhood: item.neighborhood,
        address: item.address,
        isPublished: true,
        verificationStatus: item.verified ? "VERIFIED" : "IN_REVIEW",
        firstExamFee: item.firstExamFee,
        freeInitialExam: item.freeInitialExam,
        initialExamIncludes: ["Ağız içi ön değerlendirme", "Tedavi planı görüşmesi"],
        languages: ["Türkçe", "İngilizce"],
        paymentOptions: ["Kredi kartı", "Banka havalesi"],
      },
    });

    const desiredTreatmentIds = [...item.prices.map((price) => price.treatmentSlug), ...item.unavailableTreatmentSlugs]
      .map((slug) => treatments.get(slug)?.id)
      .filter((id): id is string => Boolean(id));
    await prisma.clinicTreatment.updateMany({
      where: { clinicId: clinic.id, treatmentId: { notIn: desiredTreatmentIds } },
      data: { status: "ARCHIVED" },
    });
    await prisma.treatmentPrice.updateMany({
      where: { clinicId: clinic.id, treatmentId: { notIn: desiredTreatmentIds }, moderationStatus: "APPROVED" },
      data: { moderationStatus: "ARCHIVED" },
    });

    for (const price of item.prices) {
      const treatment = treatments.get(price.treatmentSlug);
      if (!treatment) throw new Error(`Seed treatment missing: ${price.treatmentSlug}`);
      await prisma.clinicTreatment.upsert({
        where: { clinicId_treatmentId: { clinicId: clinic.id, treatmentId: treatment.id } },
        update: { status: "APPROVED", availability: "OFFERED" },
        create: { clinicId: clinic.id, treatmentId: treatment.id, status: "APPROVED", availability: "OFFERED" },
      });
      const existingPrice = await prisma.treatmentPrice.findFirst({
        where: { clinicId: clinic.id, treatmentId: treatment.id, moderationStatus: "APPROVED" },
        orderBy: { updatedAt: "desc" },
      });
      const priceData = {
        minPrice: price.minPrice ?? null,
        maxPrice: price.maxPrice ?? null,
        fixedPrice: price.fixedPrice ?? null,
        priceUnit: price.priceUnit,
        vatIncluded: true,
        examIncluded: item.freeInitialExam,
        moderationStatus: "APPROVED" as const,
        packageContent: "Muayene ve kişiye özel tedavi planı",
        extraFeeConditions: "Görüntüleme veya ek işlem gereksinimleri ayrıca fiyatlandırılabilir.",
      };
      if (existingPrice) {
        await prisma.treatmentPrice.update({ where: { id: existingPrice.id }, data: priceData });
      } else {
        await prisma.treatmentPrice.create({
          data: { clinicId: clinic.id, treatmentId: treatment.id, ...priceData },
        });
      }
    }
    for (const treatmentSlug of item.unavailableTreatmentSlugs) {
      const treatment = treatments.get(treatmentSlug);
      if (!treatment) throw new Error(`Seed treatment missing: ${treatmentSlug}`);
      await prisma.clinicTreatment.upsert({
        where: { clinicId_treatmentId: { clinicId: clinic.id, treatmentId: treatment.id } },
        update: { status: "APPROVED", availability: "NOT_OFFERED" },
        create: { clinicId: clinic.id, treatmentId: treatment.id, status: "APPROVED", availability: "NOT_OFFERED" },
      });
    }
  }
}

main()
  .finally(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
