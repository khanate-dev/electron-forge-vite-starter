import { useEffect, useState } from 'react';

import { stringifyError } from '../errors';
import { dayjsUtc } from '../helpers/date.helpers';

export const useCodeReader = () => {
	const [status, setStatus] = useState<
		| { type: 'error'; message: string }
		| { type: 'connecting' }
		| { type: 'connected'; reading?: { at: string; data: number } }
	>({ type: 'connecting' });

	useEffect(() => {
		window.ipc.codeReader
			.connect()
			.then(() => {
				setStatus({ type: 'connected' });
			})
			.catch((error) => {
				setStatus({ type: 'error', message: stringifyError(error) });
			});

		window.ipc.codeReader.listen((data) => {
			setStatus((prev) =>
				prev.type === 'connected'
					? {
							...prev,
							reading: { data, at: dayjsUtc().format('h:mm:ss A') },
					  }
					: prev,
			);
		});

		return () => {
			window.ipc.codeReader.disconnect().catch(() => false);
		};
	}, []);

	return status;
};
