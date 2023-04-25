import type http from 'http';
import { ServerResponse } from 'http';
import { saturate, Source } from 'nsblob-stream';

export async function applyHeaders(
	response: ServerResponse,
	source: Source<{ type: string; [key: string]: string }>
) {
	response.setHeader('Accept-Ranges', 'bytes');

	for (const key in source.props) {
		if (key !== 'type') {
			response.setHeader(
				(
					'-' +
					String(key)
						.replace(/_+/g, '-')
						.replace(/^\-+/g, 'X-')
						.toLocaleLowerCase()
				)
					.replace(/\-./g, (c) => c.toLocaleUpperCase())
					.slice(1),
				source.props[key]
			);
		}
	}
}

export async function writeSource(
	request: http.IncomingMessage,
	response: ServerResponse,
	source: Source<{ type: string; [key: string]: string }>
) {
	if (request.headers.range) {
		const matches: string[] = [
			...(request.headers.range.match(/[\d]+/g) || []),
		];

		let [first, last] = [
			...matches,
			matches.length ? source.length - 1 : 0,
			source.length - 1,
		].map(Number);

		if (last >= source.length) {
			last = source.length - 1;
		}

		if (first >= last) {
			first = last;
		}

		response.statusCode = 206;

		response.setHeader('Content-Type', source.props.type);

		response.setHeader(
			'Content-Range',
			`bytes ${first}-${last}/${source.length}`
		);

		response.setHeader('Content-Length', last - first + 1);

		applyHeaders(response, source);

		return saturate(source.raw, response, Number(first), Number(last) + 1);
	} else {
		response.statusCode = 200;

		response.setHeader('Content-Type', source.props.type);
		response.setHeader('Content-Length', source.length);

		applyHeaders(response, source);

		return saturate(source.raw, response);
	}
}
