'use strict';

const fs = require('fs');
const express = require('express');
const mime = require('mime');
const upload = require('multer')();
const vm = require('vm');
const puppeteer = require('puppeteer');

// Async route handlers are wrapped with this to catch rejected promise errors.
const catchAsyncErrors = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

let unhandledRejectionHandlerAdded = false;

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  console.error('errorHandler', err);
  res.status(500).send({errors: `Error running your code. ${err}`});
}

const app = express();

app.use('/files', express.static('./files/'));

app.get('/', (req, res, next) => {
  res.status(200).send('It works!');
});

app.get('/convert', catchAsyncErrors(async (req, res, next) => {
  // Only add listener once per process.
  if (!unhandledRejectionHandlerAdded) {
    process.on('unhandledRejection', err => {
      console.error('unhandledRejection');
      next(err, req, res, next);
    });
    unhandledRejectionHandlerAdded = true;
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let sessionId = req.query.session;
    let domain = req.query.domain;
    let fileName = req.query.filename;
    let url = req.query.url;

    console.log('Starting with options:');
    console.log('sessionId', sessionId);
    console.log('domain', domain);
    console.log('fileName', fileName);
    console.log('url', url);
    
    console.log('Setting cookie');
    await page.setCookie({
      name: 'sessionid',
      value: sessionId,
      domain: domain,
      path: '/',
    });
    
    console.log('Navigating to url...');
    await page.goto(url);

    console.log('Waiting for page console...')
    page.on('console', async (msg) => {
      const successMsg = 'ACCURANKER_LOADED_TIME_TO_SMILE';
      const isDone = msg.text().includes(successMsg);
      console.log('isDone', isDone);
      console.log('msg', msg.text());

      if (isDone) {
        console.log('Saving PDF...');
        await page.pdf({
            path: `./files/${fileName}`,
            format: 'A4',
            scale: 1,
            landscape: true,
        });
        
        console.log(`Created PDF /files/${fileName}`)
        browser.close();

        if (!res.headersSent) {
          res.status(200).send(`/files/${fileName}`);
        }
      }
    });
  } catch (err) {
    throw err;
  }
}));

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
