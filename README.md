# Setup Guide

### 1) Install dependencies
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

For Example:
```
npm run start https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202 "Санкт-Петербург и область"
# Or using node directly:
node src/index.js https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202 "Санкт-Петербург и область"
```

P.S. Script opens a new browser window, do not interact with it, it will close automatically