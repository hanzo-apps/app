import Fuse, {IFuseOptions} from 'fuse.js'

export const FUSE_OPTIONS: IFuseOptions<any> = {
  threshold: 0.15,
  ignoreLocation: true,
  findAllMatches: true,
  keys: [
    {name: 'name', weight: 0.9},
    {name: 'alias', weight: 0.1},
  ],
}

// Development mode check for Tauri
export const __DEV__ = process.env.NODE_ENV === 'development'
