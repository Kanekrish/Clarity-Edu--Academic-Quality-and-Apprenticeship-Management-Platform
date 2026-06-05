const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/schedules',   require('./routes/schedules'));
app.use('/api/grades',      require('./routes/grades'));
app.use('/api/modules',     require('./routes/modules'));
app.use('/api/learners',    require('./routes/learners'));
app.use('/api/employers',   require('./routes/employers'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/feedback',     require('./routes/feedback'));
app.use('/api/evidence',     require('./routes/evidence'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/ksb-mappings', require('./routes/ksb'));
app.use('/api/visits',       require('./routes/visits'));
app.use('/api/sessions',     require('./routes/sessions'));
app.use('/api/observations', require('./routes/observations'));
app.use('/api/targets',      require('./routes/targets'));
app.use('/api/logs',         require('./routes/logs'));

// Test route
app.get('/', (_req, res) => {
  res.json({ message: ' Clarity API is running' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(` Clarity backend running on port ${PORT}`);
});