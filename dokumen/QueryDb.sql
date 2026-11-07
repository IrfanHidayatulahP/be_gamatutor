


-- 1. INISIALISASI EXTENSION
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DATABASE GAMATUTOR
CREATE DATABASE Gamatutor;

-- ==========================================
-- A. USER MANAGEMENT & AUTHENTICATION
-- ==========================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(7) DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
    reset_token TEXT,
    reset_token_expiry TIMESTAMPTZ,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

alter table users
add column xp int

delete from users;
select * from users;
CREATE TABLE token (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    access_token_expiry TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
select * from token;
-- ==========================================
-- B. LLM SYSTEM, PROMPT & MSLQ QUIZ ENGINE
-- ==========================================
-- Penampung System Prompt Dynamic (Biar gak hardcoded di Node.js)
CREATE TABLE llm_prompt_templates (
    prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) UNIQUE NOT NULL, -- 'mslq_quiz_generator', 'monthly_evaluation'
    version INT DEFAULT 1,
    system_prompt TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Soal Statis (Fallback kalau API LLM error/limit)
CREATE TABLE mslq_static_questions (
    static_q_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hasil Kuis MSLQ User + Mapping Lock/Unlock Fitur
CREATE TABLE user_quiz_results (
    quiz_result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    dominant_strategy VARCHAR(50) NOT NULL,
    user_profile VARCHAR(100) NOT NULL,
    unlocked_features JSONB NOT NULL, -- ex: ["organization", "time_management"]
    locked_features JSONB NOT NULL,
    answers_payload JSONB NOT NULL,   -- Detail jawaban kuis
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluasi Bulanan (Deteksi Disinkronisasi Antara Profile vs Perilaku)
CREATE TABLE monthly_evaluations (
    eval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    month_year VARCHAR(20) NOT NULL, -- Format: 'MM-YYYY'
    is_synchronized BOOLEAN NOT NULL,
    requires_quiz_retake BOOLEAN DEFAULT FALSE,
    detected_issues JSONB NOT NULL,
    llm_feedback TEXT NOT NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_monthly_eval UNIQUE(user_id, month_year)
);

-- ==========================================
-- C. STRATEGI BELAJAR & CARD MANAGEMENT
-- ==========================================
CREATE TABLE learning_strats (
    learning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_code VARCHAR(50) UNIQUE NOT NULL, -- ex: 'time_management', 'organization'
    learning_strategy VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cards (
    card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    learning_id UUID NOT NULL REFERENCES learning_strats(learning_id) ON DELETE CASCADE,
	description TEXT,
    course_name VARCHAR(50),
    difficulty VARCHAR(10) CHECK (difficulty IN ('easy','medium','hard','expert')),
    priority VARCHAR(10) CHECK (priority IN ('low','medium','high','critical')),
    deadline TIMESTAMPTZ,
    url TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    deleted BOOLEAN DEFAULT FALSE,
    
    -- Evaluasi & Refleksi Mandiri Card
    satisfaction_rating NUMERIC,
    notes TEXT,
    pre_test_grade INT,
    post_test_grade INT,
    reflection_q1_strategy TEXT,
    reflection_q2_confidence NUMERIC,
    reflection_q3_what_learned TEXT,
    reflection_q4_value TEXT,
    reflection_completed_at TIMESTAMPTZ,
    goal_check_rating NUMERIC,
    goal_check_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

alter table cards
alter column deadline type TIMESTAMPTZ;
alter table cards
drop column nm_matkul;

CREATE TABLE card_list (
	cl_id UUID PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    sub_title VARCHAR(255),
	end_time_list TIMESTAMPTZ
); 

alter table card_list
add column start_time_list TIMESTAMPTZ

alter table card_list
add column cl_id UUID DEFAULT gen_random_uuid() NOT NULL

alter table card_list
ADD CONSTRAINT card_list_pkey PRIMARY KEY (cl_id);

CREATE TABLE card_column_movements (
    ccm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    from_column VARCHAR(100),
    to_column VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- D. KOLABORASI, CHAT & SOSIAL
-- ==========================================
CREATE TABLE friendships (
    fs_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending','accepted','declined','blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_request UNIQUE (user_id, friend_id),
    CONSTRAINT no_self_request CHECK (user_id <> friend_id)
);

CREATE TABLE chat (
    chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_chat TEXT NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('delivered','read')),
    time_chat TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE card_list_collab (
    collab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(10) CHECK (role IN ('owner','member')),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(card_id, user_id)
);

CREATE TABLE card_list_chat (
    chat_colab_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collab_id UUID NOT NULL REFERENCES card_list_collab(collab_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
-- ==========================================
-- E. ACTIVITY LOGS & LLM RECOMMENDATIONS (DIREVISI TOTAL)
-- ==========================================

-- 1. Log Aktivitas Ringkas (Sumber data LLM buat evaluasi bulanan)
CREATE TABLE user_activity_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'CARD_MOVED', 'CHAT_SENT', 'REFLECTIONS_COMPLETED'
    ref_id UUID,                         -- Bisa nunjuk ke card_id, chat_id, atau ccm_id
    metadata JSONB,                      -- Detail log ex: {"from":"Planning", "to":"Progress"}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Histori Rekomendasi Strategi dari LLM (Disimpan rapi buat Jejak Audit/Tesis)
CREATE TABLE llm_recommendation_histories (
    rec_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL,  -- 'MONTHLY_EVAL', 'QUIZ_RESULT', 'ON_DEMAND'
    input_context JSONB NOT NULL,       -- Data mentah log/kuis yang dilempar ke LLM
    llm_output JSONB NOT NULL,          -- Respon rekomendasi utuh dari LLM
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- F. GAMIFIKASI (AVATAR) & NOTIFIKASI
-- ==========================================
CREATE TABLE user_avatar (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
	avatar_config JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    notif_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(30) CHECK (type IN ('push', 'smart_reminder', 'social_presence', 'encouragement')),
    title VARCHAR(255),
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    delivered BOOLEAN DEFAULT FALSE,
    delivery_error TEXT,
    scheduled_for TIMESTAMPTZ,
    reminder_reason TEXT,
    trigger_action TEXT,
    trigger_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- G. DEFAULT DATA SEEDING
-- ==========================================
INSERT INTO users (first_name, last_name, email, username, password, role) 
VALUES ('Super', 'Admin', 'superadmin123@gmail.com', 'superadmin123', '$2a$12$qVQZC6kRQmZxIK/YAIT1M.Q7ai1BcpVQ9wclYh21DsO2ldLDWxJda', 'admin');

INSERT INTO learning_strats (key_code, learning_strategy, description) VALUES
('rehearsal', 'Rehearsal', 'Mengingat atau mengulang informasi secara verbatim/hafalan.'),
('organization', 'Organization', 'Mengekstrak ide pokok dan mengelompokkan materi belajar.'),
('elaboration', 'Elaboration', 'Menghubungkan materi baru dengan pengetahuan sebelumnya.'),
('time_management', 'Time Management', 'Mengatur jadwal, target pengerjaan, dan skala prioritas.'),
('help_seeking', 'Help-Seeking', 'Kemampuan meminta bantuan secara efektif saat menemui kesulitan.'),
('metacognitive_self_regulation', 'Metacognitive Self-Regulation', 'Merencanakan, memantau, dan menyesuaikan proses berpikir mandiri.'),


INSERT INTO llm_prompt_templates (template_name, version, system_prompt, is_active)
VALUES (
  'mslq_quiz_generator',
  1,
  'Kamu adalah seorang pakar Psikometri dan Self-Regulated Learning (MSLQ). 
  	Tugasmu adalah membuat 7 pertanyaan kuis pilihan ganda berbasis skenario kehidupan 
	  mahasiswa.\n\nSetiap pertanyaan HARUS mewakili satu dari 7 kategori MSLQ berikut:
	  \n1. organization
	  \n2. time_management
	  \n3. metacognitive_self_regulation
	  \n4. help_seeking
	  \n5. elaboration
	  \n6. rehearsal
	  \n7. critical_thinking
	  \n\nFormat Output WAJIB berupa JSON array valid tanpa teks tambahan di luar JSON:
	  \n[\n  {\n    "category": "organization",
	  \n    "question_text": "...",
	  \n    "options": [
	  \n	  {"text": "...", "score": 3},
	  \n      {"text": "...", "score": 2},
	  \n      {"text": "...", "score": 1}
	  \n    ]\n  }
	  \n]
	  \n\nKetentuan Opsi:
	  \n- Score 3: Menerapkan strategi tersebut secara aktif/ideal.
	  \n- Score 2: Menerapkan secara pasif/parsial.
	  \n- Score 1: Tidak menerapkan sama sekali.',
  TRUE
);

select * from cards;
select * from learning_strats

update cards
set start_time = null
where card_id = 'b530a2e1-d132-40b9-9196-9de3f2721ac7'

update cards
set learning_id = 'ff64041d-30d1-4ef4-86ab-0b214a928dc4'
where card_id = 'bf504c46-08fc-457e-bb45-7ef7075556c7'

INSERT INTO cards(user_id,title,learning_id,description,course_name,difficulty,priority,deadline)
values
('57a5522d-ff32-4259-b4de-c51555698bab','Subquery','1938deff-588a-48ce-ae55-124262f4ce62','Belajar Subquery di SQL Server','Basis Data','hard','high','2026-10-20'),
('57a5522d-ff32-4259-b4de-c51555698bab','sorting','1938deff-588a-48ce-ae55-124262f4ce62','Belajar algoritma sorting','Algoritma','hard','high','2026-10-18')

INSERT INTO cards(user_id,title,learning_id,description,course_name,difficulty,priority,deadline)
values
('57a5522d-ff32-4259-b4de-c51555698bab','Class, Method, dan Function','1938deff-588a-48ce-ae55-124262f4ce62','Belajar Membuat Class, Method, dan Function dengan Bahasa C++','Pemrograman','medium','medium','2026-10-22')

INSERT INTO card_column_movements (card_id, from_column) values
('b530a2e1-d132-40b9-9196-9de3f2721ac7', 'planning');

INSERT INTO card_list (card_id,sub_title) values
('b530a2e1-d132-40b9-9196-9de3f2721ac7', 'Filtering'),
('b530a2e1-d132-40b9-9196-9de3f2721ac7', 'Grouping')

INSERT INTO card_list (card_id,sub_title) values
('db36e069-f106-4a97-a327-2ffae3d97f6e', 'Scalar Subquery'),
('db36e069-f106-4a97-a327-2ffae3d97f6e', 'Multi-row Subquery')

INSERT INTO card_list (card_id,sub_title) values
('4178e472-f152-4005-a686-5daed6965522', 'Bubble Sort'),
('4178e472-f152-4005-a686-5daed6965522', 'Selection dan Merge Sort')

INSERT INTO card_list (card_id,sub_title) values
('bf504c46-08fc-457e-bb45-7ef7075556c7', 'Penerapan Function'),
('bf504c46-08fc-457e-bb45-7ef7075556c7', 'Penerapan Class dan Method')


select * from card_column_movements;
select * from card_list where card_id = '4178e472-f152-4005-a686-5daed6965522';

delete from card_column_movements
where ccm_id = 'd052b44a-676a-4e18-b90f-8bad57ae3a8d'

delete from card_list
where cl_id = '18e0f4b5-a7c1-4023-a286-f49b7fe76c83'

update card_list
set start_time_list = '2026-10-18 16:29:19.21+07'
where card_id = 'b530a2e1-d132-40b9-9196-9de3f2721ac7'

update cards
set notes = null
where card_id = 'b530a2e1-d132-40b9-9196-9de3f2721ac7'

select * from users
select * from token

update card_list
set end_time_list = null
where cl_id = 'bbf283d1-fc43-40ad-a55b-1645c2c21dda'

INSERT INTO mslq_static_questions (category, question_text, options) VALUES
-- ═══════════════════════════════════════════════════════
-- 1. ORGANIZATION (4 soal)
-- ═══════════════════════════════════════════════════════
('organization',
 $q$Kamu harus menghadapi UTS Sistem Operasi. Materinya sangat padat (Process Management, Memory, File System). Apa yang pertama kali kamu lakukan?$q$,
 $j$[
   {"text": "Langsung membaca semua slide dari halaman pertama sampai akhir tanpa membuat rangkuman.", "score": 1},
   {"text": "Membuat mind map atau outline untuk memetakan hubungan antar topik agar lebih mudah dipahami.", "score": 3},
   {"text": "Membaca materi sambil menandai (highlight) bagian yang penting, tapi tidak menyusunnya ulang.", "score": 2}
 ]$j$::jsonb),

('organization',
 $q$Kamu sedang mengerjakan proyek Basis Data. Kamu perlu memahami ERD, Normalisasi, dan Query SQL. Bagaimana caramu mengatur materi ini?$q$,
 $j$[
   {"text": "Mempelajari ketiganya secara terpisah karena menurutku itu topik yang berbeda.", "score": 1},
   {"text": "Membuat tabel perbandingan atau skema yang menghubungkan alur dari ERD ke Normalisasi hingga SQL.", "score": 3},
   {"text": "Membaca modul praktikum berkali-kali sampai hafal urutan perintah SQL-nya.", "score": 2}
 ]$j$::jsonb),

('organization',
 $q$Melihat catatan kuliah Pemrograman Web-mu yang berserakan dan menumpuk di folder Downloads, apa yang kamu lakukan?$q$,
 $j$[
   {"text": "Membiarkannya saja, yang penting file-nya ada dan bisa dicari saat dibutuhkan.", "score": 1},
   {"text": "Merapikan dan mengelompokkan file ke dalam folder khusus (misal: folder HTML, CSS, PHP) agar mudah diakses.", "score": 3},
   {"text": "Hanya mengganti nama file agar lebih rapi, tapi tetap menumpuk di satu folder yang sama.", "score": 2}
 ]$j$::jsonb),

('organization',
 $q$Besok ada kuis Jaringan Komputer tentang OSI Layer dan TCP/IP. Bagaimana kamu menyiapkan catatanmu?$q$,
 $j$[
   {"text": "Membuat ringkasan berupa diagram atau tabel perbandingan antar layer agar mudah dihafal.", "score": 3},
   {"text": "Membaca ulang seluruh bab dari e-book tanpa membuat ringkasan khusus.", "score": 2},
   {"text": "Mengandalkan slide dosen saja dan berharap soalnya mudah.", "score": 1}
 ]$j$::jsonb),

-- ═══════════════════════════════════════════════════════
-- 2. TIME MANAGEMENT (4 soal)
-- ═══════════════════════════════════════════════════════
('time_management',
 $q$Dalam satu minggu ini, kamu punya deadline Proyek PBO, kuis Matematika Diskrit, dan laporan praktikum Jaringan. Bagaimana strategimu?$q$,
 $j$[
   {"text": "Mengerjakan semuanya sekaligus di malam terakhir karena merasa lebih fokus saat dikejar waktu.", "score": 1},
   {"text": "Menyusun jadwal harian di kalender/aplikasi, memecah tugas besar menjadi target kecil, dan menetapkan waktu istirahat.", "score": 3},
   {"text": "Mengerjakan yang paling mudah dan menyenangkan dulu, menunda yang sulit sampai mendekati deadline.", "score": 2}
 ]$j$::jsonb),

('time_management',
 $q$Laporan praktikum deadline 3 hari lagi, tapi teman-teman mengajak mabar game online malam ini. Apa yang kamu lakukan?$q$,
 $j$[
   {"text": "Ikut mabar dulu sampai puas, toh besok dan lusa masih ada waktu untuk mengerjakan.", "score": 1},
   {"text": "Menolak ajakan atau ikut sebentar setelah memastikan target pengerjaan laporan hari ini sudah selesai.", "score": 3},
   {"text": "Ikut mabar sambil membuka laptop untuk mengerjakan laporan, meskipun pengerjaannya jadi lambat dan tidak fokus.", "score": 2}
 ]$j$::jsonb),

('time_management',
 $q$Kamu sadar belakangan ini sering menunda pengerjaan tugas coding karena asyik scrolling TikTok. Apa tindakanmu?$q$,
 $j$[
   {"text": "Membatasi waktu bermain HP dengan fitur screen time atau mode fokus saat jam belajar.", "score": 3},
   {"text": "Menyadari hal itu, tapi tetap membiarkannya karena merasa butuh hiburan setelah lelah kuliah.", "score": 2},
   {"text": "Mematikan pengingat tugas di HP agar tidak merasa bersalah saat menunda.", "score": 1}
 ]$j$::jsonb),

('time_management',
 $q$Kamu merasa jadwal belajarmu sebulan terakhir ini kacau dan tugas selalu mepet. Apa yang kamu lakukan?$q$,
 $j$[
   {"text": "Mencoba lebih disiplin minggu depan tanpa mengubah jadwal yang sudah ada.", "score": 2},
   {"text": "Mengevaluasi jam berapa yang paling sering terbuang, lalu menyusun ulang jadwal dan memasang alarm pengingat.", "score": 3},
   {"text": "Merasa bahwa ini memang gaya belajarku, yang penting tugas tetap terkumpul.", "score": 1}
 ]$j$::jsonb),

-- ═══════════════════════════════════════════════════════
-- 3. METACOGNITIVE SELF REGULATION (4 soal)
-- ═══════════════════════════════════════════════════════
('metacognitive_self_regulation',
 $q$Kamu sedang membaca materi Algoritma tentang Rekursi. Tiba-tiba kamu sadar sudah sampai halaman 5, tapi tidak ada satu pun penjelasan yang masuk ke otakmu. Apa yang kamu lakukan?$q$,
 $j$[
   {"text": "Lanjut membaca saja sampai habis, berharap nanti ada bagian yang membuat semuanya jadi jelas.", "score": 2},
   {"text": "Menutup buku/modul dan beralih ke mata kuliah lain, nanti akan dijelaskan lagi oleh dosen.", "score": 1},
   {"text": "Berhenti, mengevaluasi bagian mana yang membingungkan, lalu mencoba cara lain (misal: menonton video tutorial atau menulis alur kodenya di kertas).", "score": 3}
 ]$j$::jsonb),

('metacognitive_self_regulation',
 $q$Nilai kuis Pemrograman Web-mu jelek, padahal kamu merasa sudah belajar. Bagaimana responsmu?$q$,
 $j$[
   {"text": "Mengecek kembali soal yang salah, mencari tahu penyebabnya (kurang teliti atau tidak paham konsep), dan mencatatnya untuk dipelajari lagi.", "score": 3},
   {"text": "Merasa kecewa dan bertekad akan belajar lebih keras lagi tanpa tahu bagian mana yang harus diperbaiki.", "score": 2},
   {"text": "Menganggap soal kuisnya yang aneh dan tidak perlu dipikirkan lagi.", "score": 1}
 ]$j$::jsonb),

('metacognitive_self_regulation',
 $q$Saat dosen menjelaskan materi Sistem Operasi, kamu sering tiba-tiba menyadari bahwa pikiranmu melayang ke hal lain. Bagaimana caramu menyikapinya?$q$,
 $j$[
   {"text": "Mencoba mencatat poin-poin penting yang sedang dijelaskan untuk memaksa otak kembali fokus.", "score": 3},
   {"text": "Hanya diam dan berharap materi yang terlewat bisa dipelajari sendiri nanti.", "score": 2},
   {"text": "Membiarkannya saja karena bosan, lalu memilih membuka media sosial di bawah meja.", "score": 1}
 ]$j$::jsonb),

('metacognitive_self_regulation',
 $q$Saat mengerjakan soal ujian pemrograman, kamu sadar logika kodemu berbeda dari prediksi awal dan menyebabkan error. Apa yang kamu lakukan?$q$,
 $j$[
   {"text": "Panik dan langsung mengosongkan jawaban karena takut salah.", "score": 1},
   {"text": "Keras kepala memaksa menggunakan cara awal walau sudah tahu hasilnya error.", "score": 2},
   {"text": "Mengubah pendekatan logika, menyesuaikan strategi pemecahan masalah, dan menguji kode kembali.", "score": 3}
 ]$j$::jsonb),

-- ═══════════════════════════════════════════════════════
-- 4. HELP SEEKING (4 soal)
-- ═══════════════════════════════════════════════════════
('help_seeking',
 $q$Kamu sudah stuck 2 jam karena error di kode Python-mu dan tidak tahu penyebabnya. Apa langkahmu?$q$,
 $j$[
   {"text": "Langsung menyalin kode teman yang sudah jalan tanpa bertanya kenapa kodenya bisa berhasil.", "score": 1},
   {"text": "Mencoba debugging mandiri dan mencari di dokumentasi, jika masih buntu baru bertanya ke forum/teman dengan menyertakan detail error-nya.", "score": 3},
   {"text": "Terus mencoba sendiri berjam-jam dan baru mau bertanya kalau sudah benar-benar frustrasi dan menyerah.", "score": 2}
 ]$j$::jsonb),

('help_seeking',
 $q$Kamu masih bingung dengan konsep Deadlock di mata kuliah Sistem Operasi setelah kelas bubar. Apa yang kamu lakukan?$q$,
 $j$[
   {"text": "Diam saja karena malu atau takut dibilang tidak menyimak, berharap nanti paham sendiri.", "score": 1},
   {"text": "Bertanya langsung ke dosen/asisten di sesi konsultasi dengan pertanyaan yang spesifik (misal: \"Pak, saya masih bingung di bagian antrean prosesnya\").", "score": 3},
   {"text": "Bertanya ke teman sekelas yang kelihatan paham, meskipun kadang penjelasannya masih membuatmu bingung.", "score": 2}
 ]$j$::jsonb),

('help_seeking',
 $q$Dalam kelompok proyek akhir, ada anggota tim yang sangat jago backend, sementara kamu masih bingung soal API. Bagaimana sikapmu?$q$,
 $j$[
   {"text": "Meminta dia untuk mengerjakan semua bagian backend sendirian agar tugas cepat selesai.", "score": 1},
   {"text": "Menanyakan hal-hal yang benar-benar mendesak saja, tapi lebih sering menyerahkan bagian tersebut padanya.", "score": 2},
   {"text": "Mengajaknya diskusi atau belajar bareng, minta dijelaskan alurnya, lalu mencoba sendiri dan bertanya lagi jika masih ada yang kurang paham.", "score": 3}
 ]$j$::jsonb),

('help_seeking',
 $q$Kamu sedang mengerjakan proyek aplikasi mobile dan menemukan bug yang sangat rumit. Deadline tinggal 3 hari lagi. Apa yang kamu lakukan?$q$,
 $j$[
   {"text": "Menyembunyikan kesulitan ini karena takut dianggap tidak kompeten, dan terus mencoba sendiri sampai menyerah.", "score": 1},
   {"text": "Menunggu anggota tim lain sadar akan kesulitanmu dan menawarkan bantuan secara sukarela.", "score": 2},
   {"text": "Mencoba menganalisis bug terlebih dahulu, mendokumentasikan percobaan yang sudah dilakukan, lalu meminta bantuan anggota tim yang lebih berpengalaman.", "score": 3}
 ]$j$::jsonb),

-- ═══════════════════════════════════════════════════════
-- 5. ELABORATION (4 soal)
-- ═══════════════════════════════════════════════════════
('elaboration',
 $q$Kamu sedang belajar konsep Inheritance di PBO. Contoh di slide hanya kelas "Hewan" dan "Kucing". Bagaimana caramu membuat konsep ini lebih nempel?$q$,
 $j$[
   {"text": "Menghafal definisinya saja: Inheritance adalah pewarisan sifat, selesai.", "score": 1},
   {"text": "Membaca ulang contoh di slide dan mengganti nama kelasnya agar terlihat berbeda.", "score": 2},
   {"text": "Membuat contoh baru dari hal yang kamu kenal, misalnya kelas \"Akun\" dengan turunan \"AkunMahasiswa\" dan \"AkunDosen\" di aplikasi kampus, lalu menulis kodenya.", "score": 3}
 ]$j$::jsonb),

('elaboration',
 $q$Minggu ini kamu belajar materi Jaringan Komputer (TCP/UDP), dan minggu lalu kamu belajar model OSI. Bagaimana caramu belajar?$q$,
 $j$[
   {"text": "Mempelajari TCP/UDP sebagai topik yang terpisah dan tidak memikirkan hubungannya dengan materi OSI.", "score": 1},
   {"text": "Membaca materi TCP/UDP dengan baik, tapi tidak mencoba mengaitkannya dengan materi sebelumnya.", "score": 2},
   {"text": "Menghubungkan materi baru dengan yang lama: mencari tahu TCP/UDP ada di layer mana, bagaimana kerjanya dengan layer di bawahnya, dan mengambil contoh dari pengalaman streaming atau download file.", "score": 3}
 ]$j$::jsonb),

('elaboration',
 $q$Kamu diminta membuat ringkasan materi AI (Kecerdasan Buatan) oleh dosen. Bagaimana kamu mengerjakannya?$q$,
 $j$[
   {"text": "Menyalin-tempel (copy-paste) teks dari slide ke dokumen tanpa mengubah susunan katanya.", "score": 1},
   {"text": "Menulis ulang materi menggunakan bahasamu sendiri dan mencoba mengaitkannya dengan materi minggu lalu.", "score": 3},
   {"text": "Hanya membaca slide dosen dan merasa tidak perlu membuat ringkasan karena materinya sudah ada.", "score": 2}
 ]$j$::jsonb),

('elaboration',
 $q$Kamu sedang belajar materi Keamanan Informasi tentang Hashing dan Encryption. Keduanya terlihat mirip. Bagaimana kamu memperdalam pemahamanmu?$q$,
 $j$[
   {"text": "Menghafal definisi keduanya secara terpisah tanpa mencari tahu perbedaannya.", "score": 1},
   {"text": "Membaca ulang definisi dan melihat contohnya, tapi belum mencoba menjelaskannya dengan bahasamu sendiri.", "score": 2},
   {"text": "Membandingkan tujuan, proses, dan hasilnya, lalu membuat analogi atau contoh nyata (misal: hashing untuk password, encryption untuk pesan chat).", "score": 3}
 ]$j$::jsonb),

-- ═══════════════════════════════════════════════════════
-- 6. REHEARSAL (4 soal)
-- ═══════════════════════════════════════════════════════
('rehearsal',
 $q$Kamu harus menghafal banyak perintah Git (commit, push, merge, rebase) untuk praktikum. Bagaimana caramu menghafalnya?$q$,
 $j$[
   {"text": "Membuat flashcard atau catatan kecil, lalu berlatih mengetik perintahnya langsung di terminal berulang-ulang.", "score": 3},
   {"text": "Membaca daftar perintahnya beberapa kali sampai merasa hafal.", "score": 2},
   {"text": "Tidak menghafal, nanti juga bisa cari di Google saat dibutuhkan.", "score": 1}
 ]$j$::jsonb),

('rehearsal',
 $q$UTS Jaringan Komputer minggu depan dan ada banyak istilah serta nomor port yang wajib dihafal. Bagaimana strategimu?$q$,
 $j$[
   {"text": "Belajar hanya di malam sebelum ujian dengan membaca catatan secepat mungkin.", "score": 2},
   {"text": "Membagi hafalan menjadi sesi pendek setiap hari, lalu menguji diri sendiri menggunakan kuis atau flashcard tanpa melihat catatan.", "score": 3},
   {"text": "Tidak terlalu menghafal, yang penting paham garis besarnya. Kalau lupa ya sudah.", "score": 1}
 ]$j$::jsonb),

('rehearsal',
 $q$H-1 ujian, kamu ingin memantapkan hafalan materi yang sudah dipelajari seminggu ini. Apa yang kamu lakukan?$q$,
 $j$[
   {"text": "Membaca ulang seluruh catatan dari awal sampai akhir satu kali.", "score": 2},
   {"text": "Memilih tidur lebih awal dan berharap yang sudah dipelajari kemarin masih ingat.", "score": 1},
   {"text": "Menutup catatan, mencoba menuliskan ulang materi inti dari ingatan, lalu mengecek catatan untuk melihat bagian mana yang masih lupa.", "score": 3}
 ]$j$::jsonb),

('rehearsal',
 $q$Kamu ingin mengingat sintaks dasar Python (perulangan, percabangan, fungsi) untuk kuis besok. Kamu sudah membacanya, tapi masih sering lupa. Apa yang kamu lakukan?$q$,
 $j$[
   {"text": "Hanya membaca dan menyalin contoh sintaks dari modul berulang kali tanpa mencoba menulisnya tanpa melihat.", "score": 2},
   {"text": "Mencoba menuliskan kembali sintaks tersebut dari ingatan, lalu mengecek modul untuk memperbaiki bagian yang salah.", "score": 3},
   {"text": "Berhenti mengulang dan beralih ke materi lain karena merasa sudah pernah membacanya.", "score": 1}
 ]$j$::jsonb);
 
select * from users;
select * from user_quiz_results where user_id = '57a5522d-ff32-4259-b4de-c51555698bab';

update user_quiz_results
set unlocked_features = '["time_management"]'
where user_id = '57a5522d-ff32-4259-b4de-c51555698bab'

delete from user_quiz_results
where user_id = '57a5522d-ff32-4259-b4de-c51555698bab'

SELECT category, COUNT(*) AS jumlah
FROM mslq_static_questions
GROUP BY category
ORDER BY category;

SELECT
    static_q_id,
    category,
    jsonb_array_length(options) AS jumlah_opsi,
    (SELECT array_agg((opt->>'score')::int ORDER BY (opt->>'score')::int DESC)
     FROM jsonb_array_elements(options) AS opt) AS daftar_skor
FROM mslq_static_questions
ORDER BY static_q_id;

SELECT question_text, COUNT(*) AS kemunculan
FROM mslq_static_questions
GROUP BY question_text
HAVING COUNT(*) > 1;

SELECT static_q_id, category
FROM mslq_static_questions
WHERE NOT (
    SELECT bool_and(opt ? 'text' AND opt ? 'score')
    FROM jsonb_array_elements(options) AS opt
);

-- ─── users ───
-- email & username sudah ada UNIQUE constraint (otomatis index), aman.

-- ─── token ───
CREATE INDEX idx_token_user_id       ON token (user_id);
CREATE INDEX idx_token_access_token  ON token (access_token);   -- untuk validasi JWT/access token tiap request

-- ─── user_quiz_results ───
CREATE INDEX idx_quiz_results_user_id      ON user_quiz_results (user_id);
CREATE INDEX idx_quiz_results_user_created ON user_quiz_results (user_id, created_at DESC); -- ambil hasil terbaru

-- ─── monthly_evaluations ───
-- UNIQUE(user_id, month_year) sudah otomatis index, cukup.

-- ─── cards ───
CREATE INDEX idx_cards_user_id      ON cards (user_id);
CREATE INDEX idx_cards_learning_id  ON cards (learning_id);

-- ─── card_list ───
CREATE INDEX idx_card_list_card_id_in  ON card_list (card_id);

-- ─── card_column_movements ───
CREATE INDEX idx_ccm_card_id        ON card_column_movements (card_id);
CREATE INDEX idx_ccm_card_timestamp ON card_column_movements (card_id, timestamp DESC);

-- ─── friendships ───
CREATE INDEX idx_friendships_friend_id ON friendships (friend_id);  -- user_id sudah jadi bagian UNIQUE(user_id, friend_id)
-- ↑ WAJIB: tanpa ini, query "siapa saja yang mem-friend aku?" akan sequential scan

-- ─── chat ───
CREATE INDEX idx_chat_user_id     ON chat (user_id);
CREATE INDEX idx_chat_friend_id   ON chat (friend_id);
CREATE INDEX idx_chat_pair_time   ON chat (user_id, friend_id, time_chat DESC); -- history percakapan

-- ─── card_list_collab ───
CREATE INDEX idx_collab_card_id ON card_list_collab (card_id);
-- UNIQUE(card_id, user_id) sudah otomatis index untuk lookup user_id.

-- ─── card_list_chat ───
CREATE INDEX idx_card_list_chat_collab_id ON card_list_chat (collab_id);
CREATE INDEX idx_card_list_chat_user_id   ON card_list_chat (user_id);

-- ─── user_activity_logs ───
CREATE INDEX idx_activity_logs_user_id     ON user_activity_logs (user_id);
CREATE INDEX idx_activity_logs_user_time   ON user_activity_logs (user_id, created_at DESC);

-- ─── llm_recommendation_histories ───
CREATE INDEX idx_llm_rec_user_id      ON llm_recommendation_histories (user_id);
CREATE INDEX idx_llm_rec_user_created ON llm_recommendation_histories (user_id, created_at DESC);

-- ─── avatar_unlocks ───
CREATE INDEX idx_avatar_unlocks_user_id ON avatar_unlocks (user_id);
-- UNIQUE(user_id, component_id) sudah otomatis index untuk component_id lookup? TIDAK — perlu:
CREATE INDEX idx_avatar_unlocks_component_id ON avatar_unlocks (component_id);

-- ─── notifications ───
CREATE INDEX idx_notif_user_id       ON notifications (user_id);
CREATE INDEX idx_notif_user_unread   ON notifications (user_id, read) WHERE read = FALSE; -- badge count
CREATE INDEX idx_notif_scheduled     ON notifications (scheduled_for) WHERE delivered = FALSE; -- job scheduler

-- ─── Filter kartu aktif (soft delete) ───
-- Partial index HANYA mengindeks baris deleted=false → ukuran lebih kecil & cepat
CREATE INDEX idx_cards_user_active ON cards (user_id, deadline)
    WHERE deleted = FALSE;

-- ─── Filter kartu by priority / difficulty ───
CREATE INDEX idx_cards_user_priority ON cards (user_id, priority)
    WHERE deleted = FALSE;
CREATE INDEX idx_cards_user_difficulty ON cards (user_id, difficulty)
    WHERE deleted = FALSE;

-- ─── Deadline alert / reminder job ───
CREATE INDEX idx_cards_deadline_upcoming ON cards (deadline)
    WHERE deleted = FALSE AND deadline IS NOT NULL;

-- ─── Chat unread status ───
CREATE INDEX idx_chat_unread ON chat (friend_id, time_chat DESC)
    WHERE status = 'delivered';

-- ─── Friendship pending request ───
CREATE INDEX idx_friendships_pending ON friendships (friend_id)
    WHERE status = 'pending';

-- ─── Activity log by type (analitik MSLQ) ───
CREATE INDEX idx_activity_logs_type ON user_activity_logs (activity_type, created_at DESC);

-- ─── Log harian untuk evaluasi bulanan (biasanya filter 30 hari terakhir) ───
CREATE INDEX idx_activity_logs_recent ON user_activity_logs (user_id, created_at DESC);
-- ↑ jika data sangat besar; kalau tidak, cukup idx_activity_logs_user_time di atas.

-- ─── Notifikasi yang belum dibaca untuk push ───
CREATE INDEX idx_notif_undelivered ON notifications (scheduled_for)
    WHERE delivered = FALSE AND scheduled_for IS NOT NULL;

-- user_quiz_results.unlocked_features — jika sering query "user yang punya feature X"
CREATE INDEX idx_quiz_unlocked_features_gin ON user_quiz_results USING GIN (unlocked_features);

-- monthly_evaluations.detected_issues — jika analitik perlu filter issue tertentu
CREATE INDEX idx_eval_detected_issues_gin ON monthly_evaluations USING GIN (detected_issues);

-- user_activity_logs.metadata — jika butuh analitik event tertentu
CREATE INDEX idx_activity_metadata_gin ON user_activity_logs USING GIN (metadata);

-- mslq_static_questions.options — jika butuh filter opsi tertentu
CREATE INDEX idx_mslq_options_gin ON mslq_static_questions USING GIN (options);

-- llm_recommendation_histories.llm_output — untuk audit/replay
CREATE INDEX idx_llm_output_gin ON llm_recommendation_histories USING GIN (llm_output);

CREATE INDEX idx_activity_logs_created_brin ON user_activity_logs USING BRIN (created_at);
CREATE INDEX idx_chat_time_brin             ON chat USING BRIN (time_chat);
CREATE INDEX idx_notif_created_brin         ON notifications USING BRIN (created_at);

CREATE INDEX idx_cards_user_active_cover
    ON cards (user_id, deadline)
    INCLUDE (title, priority, difficulty)
    WHERE deleted = FALSE;

-- ─── llm_prompt_templates ───
-- template_name sudah UNIQUE, aman.
CREATE INDEX idx_llm_prompt_active ON llm_prompt_templates (template_name)
    WHERE is_active = TRUE;

-- ─── mslq_static_questions ───
CREATE INDEX idx_mslq_static_category ON mslq_static_questions (category);

UPDATE llm_prompt_templates
SET system_prompt = $$
Kamu adalah seorang pakar Psikometri dan Self-Regulated Learning (MSLQ)
yang berpengalaman menyusun instrumen asesmen untuk mahasiswa Teknologi
Informasi di Indonesia.

═══════════════════════════════════════════════════════════════
TUGAS UTAMA
═══════════════════════════════════════════════════════════════
Buatkan TEPAT 24 (dua puluh empat) pertanyaan kuis pilihan ganda
berbasis SKENARIO KEHIDUPAN MAHASISWA TEKNOLOGI INFORMASI.

Distribusi soal:
- 6 kategori MSLQ
- 4 soal PER KATEGORI
- Total = 24 soal

Daftar kategori (urutkan output sesuai urutan ini):
1. organization
2. time_management
3. metacognitive_self_regulation
4. help_seeking
5. elaboration
6. rehearsal

═══════════════════════════════════════════════════════════════
KONTEKS & KARAKTERISTIK SOAL
═══════════════════════════════════════════════════════════════
- Audiens: mahasiswa S1/S2 Teknologi Informasi (usia 18-25 tahun).
- Setiap soal HARUS berupa SKENARIO SPESIFIK, bukan pertanyaan umum.
- Konteks skenario HARUS relevan dengan dunia IT, contoh:
  * Coding: Python, Java, C++, Flutter, JavaScript, SQL, dll.
  * Debugging error: NullPointerException, syntax error, segfault,
    segmentation fault, deadlock, memory leak, dll.
  * Mata kuliah: Basis Data, Jaringan Komputer, Sistem Operasi,
    Algoritma & Struktur Data, PBO, Pemrograman Web, AI,
    Keamanan Informasi, Matematika Diskrit, dll.
  * Kehidupan kampus: deadline tugas, UTS/UAS, praktikum, kerja
    kelompok, mabar game online, scrolling TikTok, prokrastinasi,
    sesi konsultasi dosen/asisten, dll.
- Gunakan bahasa Indonesia yang natural, santai, mudah dipahami
  mahasiswa, namun tetap baku secara tata bahasa.
- Setiap soal dalam kategori yang sama HARUS menggunakan konteks
  yang BERBEDA (tidak mengulang mata kuliah yang sama terus-menerus,
  variasikan: Pemrograman Web, Jaringan, Sistem Operasi, Basis Data,
  Algoritma, AI, Keamanan Informasi, PBO, dll.).
- JANGAN menyalin atau menduplikasi soal dari contoh referensi di
  bawah. Gunakan contoh hanya sebagai acuan GAYA, PANJANG OPSI,
  dan KEDALAMAN SKENARIO. Soal yang kamu buat HARUS baru dan unik.

═══════════════════════════════════════════════════════════════
CONTOH SOAL REFERENSI (FEW-SHOT EXAMPLES)
═══════════════════════════════════════════════════════════════
Berikut adalah contoh-contoh soal yang sudah ada di database
sebagai acuan kualitas. Pelajari GAYA BAHASA, PANJANG OPSI,
TINGKAT KESULITAN, dan VARIASI KONTEKSNYA.

{{STATIC_EXAMPLES}}

Catatan:
- Jika suatu kategori tidak memiliki contoh di atas, gunakan
  pengetahuanmu tentang kategori MSLQ tersebut untuk membuat soal
  dengan standar kualitas yang sama.
- Total contoh di atas adalah referensi, BUKAN soal yang harus
  dipakai ulang. Jangan copy-paste teksnya.

═══════════════════════════════════════════════════════════════
KETENTUAN OPSI JAWABAN
═══════════════════════════════════════════════════════════════
Setiap pertanyaan WAJIB memiliki TEPAT 3 opsi jawaban dengan
skor 3, 2, dan 1:

- Score 3 (Ideal/Aktif): Menerapkan strategi secara aktif,
  proaktif, dan reflektif. Contoh perilaku:
  * Membuat mind map, outline, atau tabel perbandingan.
  * Menyusun jadwal konkret dan mengevaluasi ulang.
  * Sadar salah paham lalu mengubah strategi.
  * Debugging mandiri dulu, lalu bertanya dengan detail error.
  * Mengaitkan materi dengan analogi atau pengalaman nyata.
  * Menguji diri dengan flashcard atau active recall.
  * Menghubungkan materi baru dengan materi sebelumnya.

- Score 2 (Pasif/Parsial): Menerapkan secara pasif, parsial,
  ragu-ragu, atau setengah hati. Contoh perilaku:
  * Highlight tanpa menyusun ulang.
  * Menunda sampai mendekati deadline.
  * Lanjut baca meski tidak paham.
  * Menunggu bantuan datang tanpa inisiatif.
  * Copy-paste dari slide tanpa parafrase.
  * Membaca ulang tanpa menguji diri.
  * Bertanya ke teman tapi tidak sampai ke dosen.

- Score 1 (Tidak Menerapkan/Kontraproduktif): Tidak menerapkan
  strategi sama sekali, mengabaikan, atau justru merugikan diri.
  Contoh perilaku:
  * Membiarkan catatan berserakan.
  * Langsung ikut mabar tanpa memprioritaskan tugas.
  * Menutup buku dan berharap paham sendiri.
  * Menyalin kode teman tanpa bertanya.
  * Menghafal definisi tanpa memahami.
  * Tidak mengulang materi sama sekali.
  * Diam saja saat bingung karena malu.

═══════════════════════════════════════════════════════════════
ATURAN PENGACAKAN POSISI OPSI (SANGAT PENTING!)
═══════════════════════════════════════════════════════════════
Untuk menghindari bias urutan (acquiescence bias), POSISI opsi
dengan score 3 TIDAK BOLEH selalu di depan. Ikuti tabel rotasi
berikut secara KETAT (A = posisi ke-1, B = posisi ke-2,
C = posisi ke-3):

┌─────┬──────────────────────────────────┬───────────────┐
│ No  │ Kategori                         │ Posisi Score 3│
├─────┼──────────────────────────────────┼───────────────┤
│ 1   │ organization                     │ B             │
│ 2   │ organization                     │ B             │
│ 3   │ organization                     │ B             │
│ 4   │ organization                     │ A             │
│ 5   │ time_management                  │ B             │
│ 6   │ time_management                  │ B             │
│ 7   │ time_management                  │ A             │
│ 8   │ time_management                  │ B             │
│ 9   │ metacognitive_self_regulation    │ C             │
│ 10  │ metacognitive_self_regulation    │ A             │
│ 11  │ metacognitive_self_regulation    │ A             │
│ 12  │ metacognitive_self_regulation    │ C             │
│ 13  │ help_seeking                     │ B             │
│ 14  │ help_seeking                     │ B             │
│ 15  │ help_seeking                     │ C             │
│ 16  │ help_seeking                     │ C             │
│ 17  │ elaboration                      │ C             │
│ 18  │ elaboration                      │ C             │
│ 19  │ elaboration                      │ B             │
│ 20  │ elaboration                      │ C             │
│ 21  │ rehearsal                        │ A             │
│ 22  │ rehearsal                        │ B             │
│ 23  │ rehearsal                        │ C             │
│ 24  │ rehearsal                        │ B             │
└─────┴──────────────────────────────────┴───────────────┘

Posisi opsi dengan score 2 dan score 1 mengisi slot yang tersisa
secara bebas (tidak diatur).

Distribusi akhir: posisi A = 8, posisi B = 8, posisi C = 8
(sempurna seimbang 33% / 33% / 33%).

═══════════════════════════════════════════════════════════════
FORMAT OUTPUT (WAJIB!)
═══════════════════════════════════════════════════════════════
Output HARUS berupa JSON ARRAY yang VALID. TANPA teks pembuka,
TANPA penutup, TANPA penjelasan, TANPA markdown code block
(tanpa ```json). Langsung mulai dengan karakter [ dan akhiri
dengan karakter ].

Struktur yang WAJIB diikuti:

[
  {
    "category": "organization",
    "question_text": "...",
    "options": [
      {"text": "...", "score": 1},
      {"text": "...", "score": 3},
      {"text": "...", "score": 2}
    ]
  }
]

ATURAN KETAT:
- Array HARUS berisi TEPAT 24 objek (4 per kategori).
- 4 objek pertama = organization, 4 berikutnya = time_management,
  lalu metacognitive_self_regulation, help_seeking, elaboration,
  rehearsal. Urutan ini TIDAK BOLEH diacak.
- Nama kategori HARUS snake_case (contoh: "time_management",
  BUKAN "time management", BUKAN "Time Management").
- Setiap objek HARUS punya key: "category", "question_text",
  "options".
- Setiap objek "options" HARUS berisi TEPAT 3 objek dengan key
  "text" dan "score".
- Skor HARUS berupa integer (1, 2, atau 3), BUKAN string.
- Panjang "question_text" idealnya 1-3 kalimat (50-200 karakter).
- Panjang setiap "text" opsi idealnya 1-2 kalimat (30-150 karakter).
- Jangan sertakan komentar (//) atau trailing comma di JSON.
- Jangan sertakan metadata tambahan di luar struktur di atas.
$$,
version = version + 1,
is_active = TRUE,
created_at = NOW()
WHERE template_name = 'mslq_quiz_generator';

select * from llm_prompt_templates
select * from user_quiz_results

select * from users

select * from cards

update cards
set created_at = '2026-10-16'

UPDATE users SET xp = 0 WHERE xp IS NULL;
ALTER TABLE users ALTER COLUMN xp SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN xp SET NOT NULL;

delete from user_quiz_results
where user_id ='57a5522d-ff32-4259-b4de-c51555698bab'

SELECT token_id, access_token, access_token_expiry,NOW() AS now,
       access_token_expiry > NOW() AS valid
FROM token
WHERE user_id = '57a5522d-ff32-4259-b4de-c51555698bab' and access_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU3YTU1MjJkLWZmMzItNDI1OS1iNGRlLWM1MTU1NTY5OGJhYiIsImlhdCI6MTc5Mjc2Njc4OSwiZXhwIjoxNzkzMzcxNTg5fQ.BHBwfyT8oHneu0Nsa2Fieyr2QuLWlQL5LZeUE3335sM';

INSERT INTO avatar_components (category, name, asset_path) values
('shirt','Baju Koko','baju/male_baju_koko.png'),
('shirt','Kaos Basic','baju/open_jacket.png'),
('shirt','Jaket','baju/beige_parka.png'),
('pants','Celana Jeans','kaki/light_denim.png'),
('pants','Rok Panjang','kaki/female_long_skirt.png'),
('pants','Sarung','kaki/male_sarung.png'),
('pants','Celana Ripped','kaki/Pants_Ripped.png'),
('pants','Celana Olahraga','kaki/track_pants.png'),
('head','Cewek Rambut Panjang','kepala/female_long_hair_glasses.png'),
('head','Cewek Rambut Pendek','kepala/female_short_hair.png'),
('head','Cowok Rambut Berantakan','kepala/male_messy_wave_glasses.png'),
('head','Cowok Peci','kepala/male_peci.png'),
('head','Cowok Rambut Pendek','kepala/male_short_fade.png'),
('special','Kaos Sutet','special/kaos_sutet.png'),
('special','Korsa Engineering','special/korsa_engineering.png'),
('special','Almamater','special/ugm_almamater_jacket.png')

ALTER TABLE avatar_components ADD COLUMN gender VARCHAR(10) DEFAULT 'unisex' CHECK (gender IN ('male', 'female', 'unisex'));
UPDATE avatar_components SET gender = 'female' WHERE asset_path LIKE '%female%' OR asset_path LIKE '%hijab%';
UPDATE avatar_components SET gender = 'female' WHERE name = 'Cewek Rambut Pendek';
select * from avatar_components order by category, requiredxp

-- Mempercepat query riwayat kuis
CREATE INDEX idx_quiz_results_user_time ON user_quiz_results (user_id, created_at DESC);

-- Mempercepat query card dan kalkulasi streak
CREATE INDEX idx_cards_user_id ON cards (user_id);
CREATE INDEX idx_token_access ON token (access_token);



select * from avatar_components

Drop table if exists user_avatar cascade

select * from user_avatar

DROP INDEX IF EXISTS idx_cards_user_active;
DROP INDEX IF EXISTS idx_cards_deadline;

select * from card_list;

WITH ranked AS (
      SELECT static_q_id, category, question_text, options,
             ROW_NUMBER() OVER (PARTITION BY category ORDER BY RANDOM()) AS rn
      FROM mslq_static_questions
    )
    SELECT static_q_id, category, question_text, options
    FROM ranked WHERE rn <= 4 ORDER BY RANDOM()
	
select * from users

-- GamaTutor Micro-Goals ("Cek Pemahaman") - skema database
-- Versi PostgreSQL. Di proyek ini tabel dibuat otomatis oleh Sequelize (backend/src/models.js);
-- berkas ini hanya padanan SQL-nya untuk dibaca atau dijalankan manual.
--
-- Catatan desain:
--   * Kolom waktu (created_at, dst.) disimpan sebagai teks ISO-8601 (UTC), sama seperti di aplikasi.
--   * user_id berasal dari header X-User-Id (bawaan 'demo-user'); tidak ada tabel users (tanpa login).
--   * strategy_methods dan ai_analysis berisi JSON dalam bentuk teks.

-- ---------------------------------------------------------------- sesi Cek Pemahaman
CREATE TABLE IF NOT EXISTS micro_goal_sessions (
  id                        VARCHAR(32)  PRIMARY KEY,
  user_id                   VARCHAR(64)  NOT NULL,
  task_id                   VARCHAR(32),                 -- terisi setelah tugas disimpan
  previous_session_id       VARCHAR(32),                 -- sesi sebelumnya bila "Ulangi"
  attempt_no                INTEGER      NOT NULL DEFAULT 1,
  -- snapshot konteks tugas (tugas belum tersimpan saat Cek Pemahaman berjalan)
  course                    VARCHAR(100) NOT NULL,
  task_title                VARCHAR(200) NOT NULL,
  task_description          TEXT         NOT NULL DEFAULT '',
  learning_goal             TEXT         NOT NULL DEFAULT '',
  initial_confidence        INTEGER      NOT NULL CHECK (initial_confidence BETWEEN 0 AND 100),
  articulation_text         TEXT,                        -- penjelasan mahasiswa
  word_count                INTEGER,
  ai_insight                TEXT,
  ai_reason                 TEXT,
  ai_recommended_difficulty VARCHAR(10) CHECK (ai_recommended_difficulty IN ('mudah','sedang','sulit')),
  ai_analysis               TEXT,                        -- JSON: concept_coverage, concept_accuracy, key_elements, knowledge_gaps
  analysis_source           VARCHAR(10)  CHECK (analysis_source IN ('llm','fallback')),
  llm_model                 VARCHAR(80),
  prompt_version            VARCHAR(80),
  latency_ms                INTEGER,
  revised_confidence        INTEGER      CHECK (revised_confidence BETWEEN 0 AND 100),
  confidence_delta          INTEGER,                     -- revised_confidence - initial_confidence
  status                    VARCHAR(10)  NOT NULL DEFAULT 'started'
                            CHECK (status IN ('started','analyzed','completed')),
  created_at                VARCHAR(30)  NOT NULL,
  updated_at                VARCHAR(30)  NOT NULL,
  completed_at              VARCHAR(30)
);
CREATE INDEX IF NOT EXISTS micro_goal_sessions_user_id_created_at
  ON micro_goal_sessions (user_id, created_at);

-- ---------------------------------------------------------------- tugas (kartu Kanban)
CREATE TABLE IF NOT EXISTS tasks (
  id                    VARCHAR(32)  PRIMARY KEY,
  user_id               VARCHAR(64)  NOT NULL,
  course                VARCHAR(100) NOT NULL,
  title                 VARCHAR(200) NOT NULL,
  description           TEXT         NOT NULL DEFAULT '',
  strategy              VARCHAR(40)  NOT NULL CHECK (strategy IN ('simak','praktik','diskusi','uji')),
  strategy_methods      TEXT         NOT NULL DEFAULT '[]',   -- JSON, mis. ["Baca","Video"]
  learning_goal         TEXT         NOT NULL DEFAULT '',
  priority              VARCHAR(10)  NOT NULL CHECK (priority IN ('rendah','sedang','tinggi')),
  deadline_date         VARCHAR(10),                          -- YYYY-MM-DD
  deadline_time         VARCHAR(5),                           -- HH:MM
  difficulty            VARCHAR(10)  CHECK (difficulty IN ('mudah','sedang','sulit')), -- pilihan mahasiswa
  track_grades          BOOLEAN      NOT NULL DEFAULT FALSE,
  micro_goal_session_id VARCHAR(32),                          -- tautan ke micro_goal_sessions.id
  created_at            VARCHAR(30)  NOT NULL,
  status                VARCHAR(12)  NOT NULL DEFAULT 'planning'
                        CHECK (status IN ('planning','in_progress','review','done')),
  started_at            VARCHAR(30),                          -- saat masuk Monitoring
  done_at               VARCHAR(30),                          -- saat masuk Reflection
  felt_difficulty       VARCHAR(15)  CHECK (felt_difficulty IN ('lebih_ringan','pas','lebih_berat')),
  reward_id             INTEGER      CHECK (reward_id BETWEEN 1 AND 40)
);
CREATE INDEX IF NOT EXISTS tasks_user_id_created_at ON tasks (user_id, created_at);

-- ---------------------------------------------------------------- subtask
CREATE TABLE IF NOT EXISTS subtasks (
  id       SERIAL       PRIMARY KEY,
  task_id  VARCHAR(32)  NOT NULL REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE,
  title    VARCHAR(200) NOT NULL,
  is_done  BOOLEAN      NOT NULL DEFAULT FALSE,
  position INTEGER      NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------- tautan
CREATE TABLE IF NOT EXISTS links (
  id       SERIAL       PRIMARY KEY,
  task_id  VARCHAR(32)  NOT NULL REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE,
  title    VARCHAR(120) NOT NULL,
  url      VARCHAR(500) NOT NULL,
  position INTEGER      NOT NULL DEFAULT 0
);

UPDATE user_quiz_results
SET 
    unlocked_features = '[]'::jsonb, 
    dominant_strategy = NULL
WHERE user_profile = 'The All-Rounder';