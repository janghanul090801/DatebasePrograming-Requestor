import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => {
    res.send('Backend Server is running...')
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})