import { getDefaultHub, NodeClient } from '@sentry/node';
import { Integration, SentryEvent, Severity } from '@sentry/types';
import {
  dialog,
  // tslint:disable-next-line:no-implicit-dependencies
} from 'electron';

/** Capture unhandled erros. */
export class OnUncaughtException implements Integration {
  /**
   * @inheritDoc
   */
  public name: string = 'OnUncaughtException';

  /**
   * @inheritDoc
   */
  public constructor(
    private readonly options: {
      onFatalError?(error: Error): void;
    } = {},
  ) {}

  /**
   * @inheritDoc
   */
  public install(): void {
    global.process.on('uncaughtException', (error: Error) => {
      getDefaultHub().withScope(async () => {
        getDefaultHub().addEventProcessor(async (event: SentryEvent) => ({
          ...event,
          level: Severity.Fatal,
        }));

        const nodeClient = getDefaultHub().getClient() as NodeClient;
        await nodeClient.captureException(error, getDefaultHub().getScope());

        if (this.options.onFatalError) {
          this.options.onFatalError(error);
        } else {
          console.error('Uncaught Exception:');
          console.error(error);
          const ref = error.stack;
          const stack = ref !== undefined ? ref : `${error.name}: ${error.message}`;
          const message = `Uncaught Exception:\n${stack}`;
          dialog.showErrorBox('A JavaScript error occurred in the main process', message);
        }
      });
    });
  }
}
