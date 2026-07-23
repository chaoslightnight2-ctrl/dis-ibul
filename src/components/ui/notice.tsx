export function MedicalNotice() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      Gösterilen fiyatlar klinikler tarafından bilgilendirme amacıyla paylaşılmış tahmini veya başlangıç fiyatlarıdır. Kesin tedavi planı ve fiyat, diş hekimi muayenesi ve gerekli görüntüleme işlemleri sonrasında belirlenir.
    </div>
  );
}

export function OpenStreetMapSourceNotice() {
  return (
    <p className="text-xs leading-5 text-slate-500">
      İnternet klinikleri ücretsiz OpenStreetMap verisinden, yalnızca seçtiğiniz şehir veya ilçe için alınır. Bu kaynak puan veya kullanıcı yorumu sağlamaz; yorumları görmek için Google&apos;da ara bağlantısını kullanabilirsiniz.
    </p>
  );
}
