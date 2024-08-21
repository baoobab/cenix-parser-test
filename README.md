# Setup Guide

<b>Some Info:</b>
 - To run, you need a Node.js version <b>>= 14.4</b>
 - Script opens a new browser window, <b>do not interact with it</b>, it will close automatically
(also script uses a lot of system resources, keep in mind)

### 1) Install dependencies (it may take a few minutes)
```
npm install
```

### 2) Run the app

#### Using npm:
```
npm run start <url-to-parse> <desired-region>
```

#### Or using node:
```
node src/index.js <url-to-parse> <desired-region>
```

<br>

<b>For example:</b>
```
npm run start https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202 "Санкт-Петербург и область"
# Or using node directly:
node src/index.js https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202 "Санкт-Петербург и область"
```