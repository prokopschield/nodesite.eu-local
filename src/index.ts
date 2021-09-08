import fs from 'fs';
import http from 'http';
import https from 'https';
import {
	ListenerResponse,
	NodeSiteClient,
	NodeSiteRequest,
	rewrite,
} from 'nodesite.eu';
import Uncased from 'uncased';

export interface NSLocalOptions {
	name: string;
	port: number;
	interface: 'http' | 'https';
	certificate?: {
		cert: string;
		key: string;
	};
}

let iid = -1;

export function listen(options: NSLocalOptions) {
	if (
		options.interface === 'https' &&
		(!options?.certificate?.cert || !options?.certificate?.key)
	) {
		throw new Error(`Either supply path to certificate, or use http!`);
	}
	if (!options.name.includes('.'))
		options.name = `${options.name}.nodesite.eu`;
	function listener(req: http.IncomingMessage, res: http.ServerResponse) {
		const data_buf_ar = Array<Buffer>();
		const headers = new Uncased(req.headers);
		req.on('data', (chunk) => data_buf_ar.push(chunk));
		req.on('end', async () => {
			const nsreq: NodeSiteRequest = {
				iid: ++iid,
				host: options.name,
				method: req.method || 'GET',
				uri: req.url || '/',
				body: Buffer.concat(data_buf_ar),
				head: {
					host: options.name,
					...headers.str,
				},
			};
			const ans = await rewrite(nsreq, '.');
			if (!ans) return void res.end();
			if (typeof ans === 'string' || ans instanceof Buffer) {
				res.write(ans);
				return void res.end();
			}
			if (ans.statusCode) res.statusCode = ans.statusCode;
			if (ans.head) {
				for (const [header, value] of Object.entries(ans.head)) {
					value && res.setHeader(header, value);
				}
			}
			if (ans.body) {
				res.write(ans.body);
			}
			res.end();
		});
	}
	let {
		cert,
		key,
	}: {
		cert?: Buffer;
		key?: Buffer;
	} =
		options.certificate?.cert && options.certificate.key
			? {
					cert: fs.readFileSync(options.certificate.cert),
					key: fs.readFileSync(options.certificate.key),
			  }
			: {};
	const server =
		options.interface === 'https'
			? https.createServer(
					{
						cert,
						key,
					},
					listener
			  )
			: http.createServer(listener);
	server.listen(options.port);
	return {
		server,
		create: (
			path: string,
			listener?:
				| null
				| undefined
				| ((
						req: NodeSiteRequest
				  ) => ListenerResponse | Promise<ListenerResponse>),
			file?: string
		) =>
			NodeSiteClient.create(
				options.name,
				path,
				listener || undefined,
				file
			),
	};
}
