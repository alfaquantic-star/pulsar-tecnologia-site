// Browser-only Vite environment typing without importing 'vite/client' into
// the root TS config used by Vercel serverless function compilation.
interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly MODE?: string;
  readonly BASE_URL?: string;
  readonly [key: string]: string | boolean | undefined;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
