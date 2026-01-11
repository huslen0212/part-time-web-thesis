import express from 'express';
import cors from 'cors';
import authRoutes from './auth/auth.routes';
import jobRoutes from './jobs/jobs.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/jobs', jobRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
