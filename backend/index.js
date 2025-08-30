const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const customersRouter = require('./routes/customers');
const addressesRouter = require('./routes/addresses');
const logsRouter = require('./routes/logs');
const errorHandler = require('./middleware/errorHandler');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use('/api/customers', customersRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/logs', logsRouter);

app.get('/api/health', (req, res) => res.json({ success: true, uptime: process.uptime() }));

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
