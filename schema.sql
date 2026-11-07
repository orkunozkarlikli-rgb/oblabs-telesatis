CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT,
  city TEXT,
  category TEXT,
  phone TEXT UNIQUE,
  rating REAL DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  address TEXT,
  website TEXT,
  status TEXT DEFAULT 'Aranacak',
  notes TEXT DEFAULT '',
  maps_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_district ON leads(district);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);
