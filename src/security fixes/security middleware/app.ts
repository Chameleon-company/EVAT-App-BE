import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';

app.use(helmet());
app.use(cors({ origin: process.env.WEB_APP_URL, credentials: true }));
app.use(rateLimit({ windowMs: 10*60*1000, max: 100 }));
app.use(hpp());
app.use(mongoSanitize());
