-- "Kaygı Testi" (GAD-7) soru metinlerini tam cümle haline getirir ve
-- cevap ölçeği etiketlerini günceller. Sadece veri güncellemesi — kod
-- değişikliği gerekmiyor, TestRunner bu alanları DB'den okuyor.
-- Skor mantığı (value 0-3, tier aralıkları) değişmedi, sadece metinler.
update public.psychology_tests
set
  questions = '[
    { "id": "q1", "text_tr": "Son zamanlarda kendimi gergin ya da endişeli hissediyorum." },
    { "id": "q2", "text_tr": "Endişelenmeyi durdurmakta ya da kontrol etmekte zorlanıyorum." },
    { "id": "q3", "text_tr": "Farklı konular hakkında gereğinden fazla endişeleniyorum." },
    { "id": "q4", "text_tr": "Rahatlamakta güçlük çekiyorum." },
    { "id": "q5", "text_tr": "Yerimde duramayacak kadar huzursuz hissediyorum." },
    { "id": "q6", "text_tr": "Kolayca sinirleniyor ya da huzursuzlaşıyorum." },
    { "id": "q7", "text_tr": "Sanki kötü bir şey olacakmış gibi bir korku hissediyorum." }
  ]'::jsonb,
  scoring = jsonb_set(
    scoring,
    '{scale}',
    '[
      { "label_tr": "Hiç", "value": 0 },
      { "label_tr": "Birkaç gün", "value": 1 },
      { "label_tr": "Genelde", "value": 2 },
      { "label_tr": "Hemen hemen her gün", "value": 3 }
    ]'::jsonb
  )
where slug = 'kaygi-testi';
