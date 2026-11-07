require('dotenv').config();
const { sequelize, LearningStrat } = require('../src/models');

const learningStrats = [
  // PLANNING strategies
  { keyCode: 'planning-1', learningStrategy: 'Teknik Pomodoro', description: 'Belajar fokus 25 menit, istirahat 5 menit. Ulangi 4 kali lalu istirahat panjang 15-30 menit.' },
  { keyCode: 'planning-2', learningStrategy: 'Mind Mapping', description: 'Visualisasi konsep dengan peta pikiran. Mulai dari topik tengah, cabang ke sub-topik detail.' },
  { keyCode: 'planning-3', learningStrategy: 'Time Blocking', description: 'Alokasi slot waktu tetap per materi di kalender. Contoh: 08:00-10:00 Matematika, 10:15-12:00 Fisika.' },
  { keyCode: 'planning-4', learningStrategy: 'Study Planner', description: 'Buat jadwal belajar mingguan dengan target spesifik per hari. Review & adjust setiap Minggu.' },

  // MONITORING strategies
  { keyCode: 'monitoring-1', learningStrategy: 'Self-Quiz', description: 'Uji pemahaman sendiri dengan flashcard atau soal latihan setelah selesai belajar bab.' },
  { keyCode: 'monitoring-2', learningStrategy: 'Cornell Note Taking', description: 'Catat dengan format Cornell: Cue column (kiri), Note area (kanan), Summary (bawah).' },
  { keyCode: 'monitoring-3', learningStrategy: 'Comprehension Check', description: 'Setelah baca 1 halaman, tutup buku & jelaskan dengan kata sendiri. Jika gagal, baca ulang.' },
  { keyCode: 'monitoring-4', learningStrategy: 'Progress Tracker', description: 'Lacak kemajuan belajar harian: materi selesai, waktu belajar, tingkat pemahaman (1-10).' },

  // CONTROLLING strategies
  { keyCode: 'controlling-1', learningStrategy: 'Deep Work Session', description: 'Blok 90 menit fokus total (no HP, no distraksi). Target: selesaikan 1 materi berat.' },
  { keyCode: 'controlling-2', learningStrategy: 'Task Chunking', description: 'Pecah tugas besar jadi sub-tugas kecil (<30 menit). Tandai selesai satu per satu.' },
  { keyCode: 'controlling-3', learningStrategy: 'Environment Design', description: 'Atur ruang belajar: bersih, pencahayaan baik, hanya bahan yang dibutuhkan. Hapus distraksi.' },
  { keyCode: 'controlling-4', learningStrategy: 'Energy Management', description: 'Jadwalkan materi sulit saat energi tinggi (pagi), materi ringan saat energi turun (siang).' },

  // REFLECTION strategies
  { keyCode: 'reflection-1', learningStrategy: 'Reflective Journal', description: 'Tulis 5 menit tiap malam: Apa berhasil? Apa gagal? Besok coba apa? Pola apa terlihat?' },
  { keyCode: 'reflection-2', learningStrategy: 'Weekly Review', description: 'Setiap Minggu: Review target vs realisasi, identifikasi 3 hal improve, rencanakan minggu depan.' },
  { keyCode: 'reflection-3', learningStrategy: 'Strategy Audit', description: 'Evaluasi strategi belajar tiap bulan: mana efektif, mana buang waktu. Ganti yang tidak kerja.' },
  { keyCode: 'reflection-4', learningStrategy: 'Metacognitive Prompting', description: 'Selama belajar, tanya diri: "Apakah saya paham?", "Mengapa cara ini bekerja?", "Bisa lebih efisien?".' },

  // HELP_SEEKING strategies
  { keyCode: 'help_seeking-1', learningStrategy: 'Peer Teaching', description: 'Jelaskan materi ke teman/teman sebaya. Cara terbaik memastikan Anda benar-benar paham.' },
  { keyCode: 'help_seeking-2', learningStrategy: 'Study Group', description: 'Bergabung/buat grup belajar 3-5 orang. Bagi materi, diskusi, saling menguji pemahaman.' },
  { keyCode: 'help_seeking-3', learningStrategy: 'Expert Consultation', description: 'Siapkan pertanyaan spesifik sebelum bertanya ke guru/mentor. Catat jawaban & review nanti.' },
  { keyCode: 'help_seeking-4', learningStrategy: 'Resource Hunting', description: 'Cari referensi alternatif (YouTube, artikel, buku lain) saat materi sulit. Bandingkan penjelasan.' },

  // EFFORT strategies
  { keyCode: 'effort-1', learningStrategy: 'Consistency Tracker', description: 'Lacak streak belajar harian (min 15 menit). Target: jangan putus streak > 2 hari.' },
  { keyCode: 'effort-2', learningStrategy: 'Micro-Habits', description: 'Mulai sangat kecil: "Buka buku 1 menit/hari". Naikkan bertahap saat sudah jadi kebiasaan.' },
  { keyCode: 'effort-3', learningStrategy: 'Accountability Partner', description: 'Partner belajar yang cek progress saling. Set target mingguan, review bersama tiap Jumat.' },
  { keyCode: 'effort-4', learningStrategy: 'Growth Mindset Reframing', description: 'Gagal = belajar. Ubah "Saya tidak bisa" jadi "Saya belum bisa, tapi saya akan coba cara lain".' },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync();
    console.log('Models synced');

    let createdCount = 0;
    let existsCount = 0;

    for (const strat of learningStrats) {
      const [created, exists] = await LearningStrat.findOrCreate({
        where: { keyCode: strat.keyCode },
        defaults: strat
      });

      if (exists) {
        console.log(`✅ Created: ${strat.keyCode} - ${strat.learningStrategy}`);
        createdCount++;
      } else {
        console.log(`⏭️  Exists: ${strat.keyCode} - ${strat.learningStrategy}`);
        existsCount++;
      }
    }

    console.log('\n🎉 Learning strategies seeding completed!');
    console.log(`Created: ${createdCount}, Already exists: ${existsCount}, Total: ${learningStrats.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();