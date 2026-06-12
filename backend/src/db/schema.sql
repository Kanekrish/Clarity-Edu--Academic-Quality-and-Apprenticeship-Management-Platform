CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('programme_lead','academic_staff','coach','employer','ofsted_inspector','system_admin')) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT
);

CREATE TABLE IF NOT EXISTS learners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  employer_id INTEGER REFERENCES employers(id),
  enrolled_at DATE
);

CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  credits INTEGER,
  level INTEGER,
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS enrolments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER REFERENCES learners(id),
  module_id INTEGER REFERENCES modules(id),
  grade TEXT,
  grade_status TEXT DEFAULT 'pending',
  at_risk INTEGER DEFAULT 0,
  UNIQUE(learner_id, module_id)
);

CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER REFERENCES modules(id),
  title TEXT NOT NULL,
  release_date DATE,
  deadline DATE,
  marking_status TEXT DEFAULT 'not_started',
  review_date DATE,
  external_examiner_required INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ksb_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER REFERENCES modules(id),
  ksb_code TEXT NOT NULL,
  description TEXT,
  workplace_relevance TEXT
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  academic_year TEXT NOT NULL,
  module_id INTEGER REFERENCES modules(id),
  week_number INTEGER,
  session_date DATE,
  topic TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uploaded_by INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  file_path TEXT,
  category TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER REFERENCES learners(id),
  mentor_id INTEGER REFERENCES users(id),
  content TEXT,
  employer_priority TEXT,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER REFERENCES learners(id),
  mentor_id INTEGER REFERENCES users(id),
  visit_date DATE,
  visit_time TEXT,
  location TEXT,
  purpose TEXT,
  attendees TEXT,
  status TEXT DEFAULT 'Scheduled',
  feedback_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id INTEGER REFERENCES learners(id),
  coach_id INTEGER REFERENCES users(id),
  session_date DATE NOT NULL,
  session_time TEXT,
  session_type TEXT DEFAULT 'Progress Review',
  status TEXT DEFAULT 'Scheduled',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coach_id INTEGER REFERENCES users(id),
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coach_id INTEGER REFERENCES users(id),
  learner_id INTEGER REFERENCES learners(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'KSB',
  due_date DATE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'On Track',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER REFERENCES users(id),
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
