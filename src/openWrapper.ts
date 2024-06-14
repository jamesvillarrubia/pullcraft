import { ChildProcess } from 'child_process';

export async function openUrl(url: string): Promise<ChildProcess> {
    const { default: open } = await import('open');
    return open(url);
}
