import { GoogleGenAI } from "@google/genai";
import { AIResponse, ChatMessage, StyleRecommendation } from "../types";

export const getStyleAdvice = async (history: ChatMessage[]): Promise<AIResponse> => {
  try {
    if (!(import.meta as any).env.VITE_API_KEY) {
      return {
        type: "conversation",
        text: "Error: API Key belum disetting.",
      };
    }

    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_API_KEY });

    // Convert history to Gemini format
    const conversationHistory = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const systemInstruction = `
      Kamu adalah Konsultan Barber Profesional ("GantengMaksimal AI").
      
      TUGAS UTAMA:
      Berikan rekomendasi gaya rambut yang *sangat personal* berdasarkan fitur fisik pengguna.
      
      PROTOKOL INTERAKSI (WAJIB DIPATUHI):
      1. FASE INTERVIEW (JANGAN REKOMENDASI DULU):
         - Jangan langsung memberikan rekomendasi jika pengguna baru menyapa atau informasinya belum lengkap.
         - Kamu HARUS mengetahui minimal 5 hal ini dari user secara bertahap:
           a. Bentuk Wajah (Bulat, Kotak, Oval, Lonjong, dll)
           b. Jenis Rambut (Lurus, Ikal, Keriting, Tipis, Tebal)
           c. Panjang Rambut Saat Ini (Botak, Cepak, Pendek, Medium, Gondrong)
           d. Preferensi/Keinginan (Mau rapi formal, mau messy, mau fade, dll)
           e. Fitur Spesifik/Tambahan (Kacamata, Jawline, Jidat lebar, dll) <-- PENTING! Tanyakan: "Ada detail lain yang perlu gue tau ga bro? Misal lo pake kacamata, jawline tegas, atau ada 'secure' di jidat?"
         - Tanyakan satu per satu atau maksimal dua pertanyaan sekaligus agar user nyaman. Gunakan bahasa gaul tapi sopan (bro/gan).
      
      2. FASE REKOMENDASI (HANYA JIKA DATA LENGKAP):
         - Jika kamu merasa sudah cukup informasi tentang fisik user (Wajah, Jenis, Panjang Awal, Preferensi, Fitur Tambahan), BARU berikan rekomendasi.
         - Outputkan JSON Array murni.
      
      ATURAN FORMAT OUTPUT:
      
      KONDISI A: Masih butuh info / Interview
      Output: Teks biasa (String). Bertanyalah kepada user.
      
      KONDISI B: Data Lengkap -> Rekomendasi
      Output: JSON Array murni. 
      Format JSON:
      [
        { 
          "title": "Nama Gaya Rambut", 
          "description": "RINGKASAN KONTEKSTUAL: Jelaskan kenapa gaya ini cocok. Contoh: 'Karena wajah lo bulat dan lo pake kacamata, style ini bikin lo terlihat lebih smart tapi tetap casual...'",
          "imageKeyword": "South East Asian man with [Nama Gaya Rambut] hairstyle, [Jenis Rambut User] texture, wearing glasses if mentioned, head and shoulders portrait, professional barber photography, well lit, 8k, showing full haircut"
        },
        ... (Maksimal 3 rekomendasi)
      ]

      PENTING UNTUK imageKeyword:
      - Gunakan bahasa Inggris.
      - SUBJEK WAJIB: "South East Asian man" atau "Indonesian man" agar relate dengan target market.
      - FRAMING: "Head and shoulders portrait" agar rambut terlihat utuh (JANGAN close-up wajah saja).
      - Deskripsikan secara visual agar bisa digenerate menjadi gambar.

      PENTING:
      - HANYA return JSON Array saat rekomendasi.
      - JANGAN GUNAKAN MARKDOWN BLOCK (seperti \`\`\`json). Kirimkan raw string saja.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: conversationHistory, // Pass full history here
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const responseText = response.text?.trim() || "";

    // LOGIKA PARSING YANG LEBIH KUAT
    // Mencari kurung siku pertama '[' dan terakhir ']' untuk mengambil JSON saja
    // Ini mengatasi masalah jika AI membungkus response dengan markdown ```json ... ```
    const firstBracket = responseText.indexOf("[");
    const lastBracket = responseText.lastIndexOf("]");

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const potentialJson = responseText.substring(firstBracket, lastBracket + 1);
      try {
        const parsed = JSON.parse(potentialJson) as StyleRecommendation[];
        // Validasi apakah ini benar-benar array rekomendasi
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
          return {
            type: "recommendation",
            data: parsed,
          };
        }
      } catch (e) {
        console.error("Gagal parsing JSON dari substring, fallback ke text biasa", e);
        // Jika gagal parse, biarkan return default di bawah (text conversation)
      }
    }

    // Default: Percakapan biasa (pertanyaan/interview) atau jika JSON invalid
    return {
      type: "conversation",
      text: responseText,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      type: "conversation",
      text: "Maaf, AI sedang pusing (Error jaringan). Coba lagi ya bro.",
    };
  }
};
