INSERT INTO "SubscriptionPlan" (
  "id", "slug", "name", "description", "monthlyPrice", "currency", "features",
  "trialDays", "displayOrder", "isPopular", "isActive"
) VALUES
  (
    'startup_plan_baslangic', 'baslangic', 'Başlangıç',
    'Kliniğinizi yayınlayın ve temel hasta taleplerini tek yerden yönetin.',
    0, 'TRY', ARRAY['Yayınlanan klinik profili', 'Randevu ve teklif talepleri', 'Temel profil istatistikleri', '1 klinik yöneticisi'],
    0, 10, false, true
  ),
  (
    'startup_plan_buyume', 'buyume', 'Büyüme',
    'Daha fazla hasta talebi alan ve operasyonunu ölçmek isteyen klinikler için.',
    1490, 'TRY', ARRAY['Başlangıç planındaki her şey', 'Gelişmiş performans istatistikleri', 'Öncelikli profil görünürlüğü', '5 ekip üyesi', 'Öncelikli destek'],
    0, 20, true, true
  ),
  (
    'startup_plan_profesyonel', 'profesyonel', 'Profesyonel',
    'Çok şubeli klinikler ve yüksek hacimli ekipler için gelişmiş yönetim.',
    2990, 'TRY', ARRAY['Büyüme planındaki her şey', 'Çoklu şube yönetimi', 'Sınırsız ekip üyesi', 'Özel performans raporları', 'Öncelikli hesap yöneticisi'],
    0, 30, false, true
  )
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "monthlyPrice" = EXCLUDED."monthlyPrice",
  "currency" = EXCLUDED."currency",
  "features" = EXCLUDED."features",
  "trialDays" = EXCLUDED."trialDays",
  "displayOrder" = EXCLUDED."displayOrder",
  "isPopular" = EXCLUDED."isPopular",
  "isActive" = EXCLUDED."isActive";
