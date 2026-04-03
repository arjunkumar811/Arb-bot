export type RetryOptions = {
	retries: number;
	delayMs: number;
	backoffFactor: number;
	maxDelayMs: number;
	jitter: number;
	shouldRetry?: (error: Error) => boolean;
	onRetry?: (error: Error, attempt: number) => void;
};

export async function retry<T>(
	fn: () => Promise<T>,
	options: RetryOptions
): Promise<T> {
	let attempt = 0;
	let lastError: Error | null = null;

	while (attempt <= options.retries) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;
			const shouldRetry = options.shouldRetry?.(lastError) ?? true;
			if (!shouldRetry || attempt >= options.retries) {
				break;
			}

			options.onRetry?.(lastError, attempt + 1);

			const backoff = Math.min(
				options.delayMs * Math.pow(options.backoffFactor, attempt),
				options.maxDelayMs
			);
			const jitter = backoff * options.jitter * Math.random();
			const delay = backoff + jitter;

			await new Promise((resolve) => setTimeout(resolve, delay));
			attempt += 1;
		}
	}

	throw lastError ?? new Error("Retry failed");
}

export async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	onTimeout?: () => void
): Promise<T> {
	if (!timeoutMs || timeoutMs <= 0) {
		return promise;
	}

	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			onTimeout?.();
			reject(new Error(`Timeout after ${timeoutMs}ms`));
		}, timeoutMs);

		promise
			.then((value) => {
				clearTimeout(timer);
				resolve(value);
			})
			.catch((error) => {
				clearTimeout(timer);
				reject(error);
			});
	});
}
