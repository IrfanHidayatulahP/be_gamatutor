const { sequelize, MslqStaticQuestion } = require('./src/models');
const { Op } = require('sequelize');

const questions = [
  // PLANNING (4 questions)
  {
    category: 'planning',
    questionText: 'Saya membuat jadwal belajar sebelum memulai.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'planning',
    questionText: 'Saya menetapkan target belajar yang spesifik untuk setiap sesi.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'planning',
    questionText: 'Saya mempersiapkan bahan belajar sebelum memulai.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'planning',
    questionText: 'Saya mengatur prioritas materi yang akan dipelajari.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },

  // MONITORING (4 questions)
  {
    category: 'monitoring',
    questionText: 'Saya memeriksa pemahaman saya saat belajar.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'monitoring',
    questionText: 'Saya menyadari ketika saya tidak memahami materi.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'monitoring',
    questionText: 'Saya menanyakan pada diri sendiri apakah saya sudah paham.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'monitoring',
    questionText: 'Saya mencatat poin-poin penting untuk diingat.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },

  // CONTROLLING (4 questions)
  {
    category: 'controlling',
    questionText: 'Saya mengubah kecepatan belajar sesuai kesulitan materi.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'controlling',
    questionText: 'Saya fokus pada satu tugas hingga selesai.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'controlling',
    questionText: 'Saya menghindari gangguan saat belajar.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'controlling',
    questionText: 'Saya menyesuaikan metode belajar jika tidak efektif.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },

  // REFLECTION (4 questions)
  {
    category: 'reflection',
    questionText: 'Saya mengevaluasi hasil belajar setelah selesai.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'reflection',
    questionText: 'Saya merenung strategi belajar yang berhasil/gagal.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'reflection',
    questionText: 'Saya mencari cara meningkatkan belajar selanjutnya.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'reflection',
    questionText: 'Saya membandingkan hasil dengan target awal.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },

  // HELP_SEEKING (4 questions)
  {
    category: 'help_seeking',
    questionText: 'Saya bertanya ke guru/teman saat kesulitan.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'help_seeking',
    questionText: 'Saya bergabung diskusi kelompok untuk memahami materi.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'help_seeking',
    questionText: 'Saya mencari referensi tambahan saat bingung.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'help_seeking',
    questionText: 'Saya tidak malu meminta penjelasan ulang.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },

  // EFFORT (4 questions)
  {
    category: 'effort',
    questionText: 'Saya tekun belajar meskipun materi sulit.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'effort',
    questionText: 'Saya menyelesaikan tugas tepat waktu.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'effort',
    questionText: 'Saya berusaha maksimal pada setiap tugas.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
  {
    category: 'effort',
    questionText: 'Saya tidak mudah menyerah saat gagal.',
    options: {
      "1": "Sangat tidak seperti saya",
      "2": "Tidak seperti saya",
      "3": "Netral",
      "4": "Seperti saya",
      "5": "Sangat seperti saya",
      "6": "Sangat mirip dengan saya",
      "7": "Sama persis seperti saya"
    }
  },
];

async function seedQuestions() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Check if questions already exist
    const existing = await MslqStaticQuestion.count({ where: { category: { [Op.in]: ['planning', 'monitoring', 'controlling', 'reflection', 'help_seeking', 'effort'] } } });
    if (existing > 0) {
      console.log(`Already ${existing} questions exist. Skipping seed.`);
      process.exit(0);
    }

    // Bulk create
    await MslqStaticQuestion.bulkCreate(questions);
    console.log(`${questions.length} MSLQ questions seeded successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding questions:', err);
    process.exit(1);
  }
}

seedQuestions();