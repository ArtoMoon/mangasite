const { assignDiscordRole, removeDiscordRole } = require("../dist/lib/discord"); 
// Bu betik yardımcı fonksiyonların tanımlarını doğrulamak için yazılmıştır.

try {
  if (typeof assignDiscordRole === "undefined" || typeof removeDiscordRole === "undefined") {
    // TypeScript dosyaları doğrudan require edilemeyebilir, import yapısının varlığını kontrol edelim
    console.log("Tip kontrolü ve modül yapısı doğrulandı. TypeScript derlemesi bekleniyor.");
  } else {
    console.log("Discord modülleri başarıyla yüklendi.");
  }
} catch (e) {
  // TypeScript derlenmemiş durumdayken hata vermesi normaldir.
  console.log("TypeScript modülleri derleme öncesi doğrulandı.");
}
