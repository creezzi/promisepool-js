# promisepool

Run async work over a list with a concurrency limit, keeping results in order.

## Usage

```js
import { pool } from "promisepool";

const pages = await pool(urls, (url) => fetch(url).then((r) => r.text()), { concurrency: 5 });
```

## Test

```bash
npm test
```

## License

MIT
