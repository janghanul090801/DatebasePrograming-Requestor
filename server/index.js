import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users.js';
import requestsRouter from './routes/requests.js';
import proxyRouter from './routes/proxy.js';

dotenv.config();    
const app = express();
const PORT = process.env.PORT;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());                                               
app.use(express.urlencoded({ extended: true }));                     

app.get('/', (req, res) => {
  res.send('Backend Server is running...');
});

app.use('/api/users', usersRouter);  
app.use('/api/requests', requestsRouter); 
app.use('/api/proxy', proxyRouter);  

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});