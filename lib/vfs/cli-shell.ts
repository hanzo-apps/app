import { VirtualFileSystem } from './index';

export type ShellOpts = {
  cwd?: string;
  timeoutMs?: number;
};

export type ShellResult = {
  stdout: string;
  stderr: string;
  exitCode: number; // 0 success
};

const TRUNCATE_CHARS = 100000;

function truncate(out: string): string {
  if (out.length > TRUNCATE_CHARS) {
    return out.slice(0, TRUNCATE_CHARS) + "\n… [truncated]";
  }
  return out;
}

function normalizePath(p?: string): string | undefined {
  if (!p) return p;
  if (p.startsWith('/workspace')) {
    const rest = p.slice('/workspace'.length);
    p = rest.length ? rest : '/';
  }
  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

async function ensureDirectory(vfs: VirtualFileSystem, projectId: string, path: string) {
  if (path === '/' || !path) return;
  const parts = path.split('/').filter(Boolean);
  let cur = '';
  for (let i = 0; i < parts.length; i++) {
    cur = '/' + parts.slice(0, i + 1).join('/');
    try {
      await vfs.createDirectory(projectId, cur);
    } catch {
      // ignore
    }
  }
}

async function vfsShellExecute(
  vfs: VirtualFileSystem,
  projectId: string,
  cmd: string[],
  _opts: ShellOpts = {}
): Promise<ShellResult> {
  if (!projectId || typeof projectId !== 'string') {
    return { stdout: '', stderr: 'Invalid project ID provided', exitCode: 2 };
  }

  if (!cmd || cmd.length === 0) {
    return { stdout: '', stderr: 'No command provided', exitCode: 2 };
  }

  const cleanCmd = cmd.filter(arg => arg !== undefined && arg !== null && arg !== '');
  if (cleanCmd.length === 0) {
    return { stdout: '', stderr: 'No valid command arguments provided', exitCode: 2 };
  }

  const [program, ...args] = cleanCmd;

  try {
    switch (program) {
      case 'ls': {
        const flags = new Set<string>();
        const paths: string[] = [];
        for (const a of args) {
          if (a && a.startsWith('-')) flags.add(a);
          else if (a) paths.push(a);
        }
        const recursive = flags.has('-R') || flags.has('-r');
        const path = normalizePath(paths[0]) || '/';
        if (!recursive) {
          const files = await vfs.listDirectory(projectId, path);
          const lines = files.map(f => f.path).sort().join('\n');
          return { stdout: truncate(lines), stderr: '', exitCode: 0 };
        } else {
          const entries = await vfs.getAllFilesAndDirectories(projectId);
          const prefix = path === '/' ? '/' : (path.endsWith('/') ? path : path + '/');
          const res = entries
            .filter((e: any) => e.path === path || e.path.startsWith(prefix))
            .map((e: any) => e.path)
            .sort()
            .join('\n');
          return { stdout: truncate(res), stderr: '', exitCode: 0 };
        }
      }
      case 'cat': {
        const path = normalizePath(args[0]);
        if (!path) return { stdout: '', stderr: 'cat: missing file path', exitCode: 2 };
        if (path.startsWith('/-')) return { stdout: '', stderr: 'cat: invalid path (looks like an option). Use: cat /path/to/file', exitCode: 2 };
        const file = await vfs.readFile(projectId, path);
        if (typeof file.content !== 'string') {
          return { stdout: '', stderr: `cat: ${path}: binary or non-text file`, exitCode: 1 };
        }
        return { stdout: truncate(file.content), stderr: '', exitCode: 0 };
      }
      case 'grep': {
        const flags: Record<string, boolean> = { n: false, i: false, r: false, F: false };
        const fargs: string[] = [];
        for (const a of args) {
          if (a.startsWith('-')) {
            for (const ch of a.slice(1)) if (ch in flags) flags[ch] = true;
          } else {
            fargs.push(a);
          }
        }
        const pattern = fargs[0];
        const path = normalizePath(fargs[1]) || '/';
        if (!pattern) return { stdout: '', stderr: 'grep: missing pattern', exitCode: 2 };

        let regex: RegExp;
        if (flags.F) {
          const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          regex = new RegExp(escaped, flags.i ? 'i' : '');
        } else {
          regex = new RegExp(pattern, flags.i ? 'i' : '');
        }

        const entries = await vfs.getAllFilesAndDirectories(projectId);
        const dirPrefix = path === '/' ? '/' : (path.endsWith('/') ? path : path + '/');
        const outLines: string[] = [];
        for (const e of entries) {
          if ('type' in e && e.type === 'directory') continue;
          const file = e as any;
          if (!file.path.startsWith(dirPrefix) && file.path !== path) continue;
          if (typeof file.content !== 'string') continue;
          const lines = (file.content as string).split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (regex.test(line)) {
              outLines.push(
                `${file.path}${flags.n ? ':' + (i + 1) : ''}:${line}`
              );
            }
          }
        }
        const output = outLines.join('\n');
        if (outLines.length === 0) {
          const location = path === '/' ? 'workspace root' : path;
          return { stdout: '', stderr: `grep: pattern "${pattern}" not found in ${location}`, exitCode: 1 };
        }
        return { stdout: truncate(output), stderr: '', exitCode: 0 };
      }
      case 'find': {
        let rootArg: string | undefined;
        let pattern: string | undefined;
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (!a) continue;
          if (a === '-name') { pattern = args[i + 1]; i++; continue; }
          if (a === '-maxdepth' || a === '-type') { i++; continue; }
          if (!a.startsWith('-') && !rootArg) rootArg = a;
        }
        const root = normalizePath(rootArg) || '/';
        const entries = await vfs.getAllFilesAndDirectories(projectId);
        const prefix = root === '/' ? '/' : (root.endsWith('/') ? root : root + '/');
        const toGlob = (s: string) => new RegExp('^' + s.replace(/[.+^${}()|\[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
        const regex = pattern ? toGlob(pattern) : null;
        const res = entries
          .filter((e: any) => e.path === root || e.path.startsWith(prefix))
          .map((e: any) => e.path)
          .filter(p => (regex ? regex.test(p.split('/').pop() || p) : true))
          .sort();
        return { stdout: truncate(res.join('\n')), stderr: '', exitCode: 0 };
      }
      case 'mkdir': {
        const hasP = args.includes('-p');
        const raw = args[hasP ? args.indexOf('-p') + 1 : 0];
        const path = normalizePath(raw);
        if (!path) return { stdout: '', stderr: 'mkdir: missing path', exitCode: 2 };
        if (hasP) {
          await ensureDirectory(vfs, projectId, path);
        } else {
          await vfs.createDirectory(projectId, path);
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      }
      case 'rm': {
        let recursive = false;
        let force = false;
        let verbose = false;
        const targets: string[] = [];

        for (const arg of args) {
          if (arg && arg.startsWith('-')) {
            if (arg.includes('r') || arg.includes('R')) recursive = true;
            if (arg.includes('f')) force = true;
            if (arg.includes('v')) verbose = true;
          } else if (arg) {
            targets.push(arg);
          }
        }

        if (targets.length === 0) return { stdout: '', stderr: 'rm: missing operand', exitCode: 2 };

        let hadError = false;
        const verboseOutput: string[] = [];

        for (const target of targets) {
          const path = normalizePath(target);
          if (!path) {
            if (!force) hadError = true;
            continue;
          }

          try {
            await vfs.deleteFile(projectId, path);
            if (verbose) verboseOutput.push(`removed '${path}'`);
          } catch {
            if (recursive) {
              try {
                await vfs.deleteDirectory(projectId, path);
                if (verbose) verboseOutput.push(`removed directory '${path}'`);
              } catch {
                if (!force) {
                  hadError = true;
                  if (verbose) verboseOutput.push(`rm: cannot remove '${path}': No such file or directory`);
                }
              }
            } else {
              if (!force) {
                hadError = true;
                if (verbose) verboseOutput.push(`rm: cannot remove '${path}': Is a directory (use -r to remove directories)`);
              }
            }
          }
        }

        const stdout = verbose ? verboseOutput.join('\n') : '';
        const stderr = hadError && !verbose ? 'rm: some paths could not be removed' : '';
        return { stdout: truncate(stdout), stderr, exitCode: hadError ? 1 : 0 };
      }
      case 'mv': {
        const [rold, rnew] = args;
        const oldPath = normalizePath(rold);
        const newPath = normalizePath(rnew);
        if (!oldPath || !newPath) return { stdout: '', stderr: 'mv: missing operands', exitCode: 2 };
        try {
          await vfs.renameFile(projectId, oldPath, newPath);
          return { stdout: '', stderr: '', exitCode: 0 };
        } catch {
          await vfs.renameDirectory(projectId, oldPath, newPath);
          return { stdout: '', stderr: '', exitCode: 0 };
        }
      }
      case 'cp': {
        const recursive = args.includes('-r');
        const filtered = args.filter(a => a !== '-r');
        let [src, dst] = filtered;
        src = normalizePath(src) as string;
        dst = normalizePath(dst) as string;
        if (!src || !dst) return { stdout: '', stderr: 'cp: missing operands', exitCode: 2 };
        try {
          const file = await vfs.readFile(projectId, src);
          const content = typeof file.content === 'string' ? file.content : file.content;
          try {
            await vfs.createFile(projectId, dst, content as any);
          } catch {
            await vfs.updateFile(projectId, dst, content as any);
          }
          return { stdout: '', stderr: '', exitCode: 0 };
        } catch {
          if (!recursive) {
            return { stdout: '', stderr: 'cp: -r required for directories', exitCode: 1 };
          }
          const entries = await vfs.getAllFilesAndDirectories(projectId);
          const srcPrefix = src.endsWith('/') ? src : src + '/';
          for (const e2 of entries) {
            if ('type' in e2 && e2.type === 'directory') continue;
            const file = e2 as any;
            if (file.path === src || file.path.startsWith(srcPrefix)) {
              const rel = file.path.slice(src.length);
              const target = (dst.endsWith('/') ? dst.slice(0, -1) : dst) + rel;
              await ensureDirectory(vfs, projectId, target.split('/').slice(0, -1).join('/'));
              const content = typeof file.content === 'string' ? file.content : file.content;
              try {
                await vfs.createFile(projectId, target, content as any);
              } catch {
                await vfs.updateFile(projectId, target, content as any);
              }
            }
          }
          return { stdout: '', stderr: '', exitCode: 0 };
        }
      }
      default: {
        return {
          stdout: '',
          stderr: `${program}: command not supported

Supported commands: ls, cat, grep, find, mkdir, rm, mv, cp`,
          exitCode: 127
        };
      }
    }
  } catch (e: any) {
    return { stdout: '', stderr: e?.message || String(e), exitCode: 1 };
  }
}

// Create a global instance that can be imported
export const vfsShell = {
  execute: async (projectId: string, cmd: string[]): Promise<{ success: boolean; stdout?: string; stderr?: string }> => {
    const { VirtualFileSystem } = await import('./index');
    const vfs = new VirtualFileSystem();
    await vfs.init();
    const result = await vfsShellExecute(vfs, projectId, cmd);
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }
};
