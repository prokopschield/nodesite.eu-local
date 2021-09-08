# nodesite.eu-local

Local http listener for nodesite.eu

```typescript
import { listen } from 'nodesite.eu-local';

const { create } = listen({
	port: 8080,
	name: 'mysite.nodesite.eu',
});

create('/', (req) => 'Hello, world');
```

create() works the same as with regular [NodeSite.eu](https://github.com/prokopschield/nodesite.eu)
