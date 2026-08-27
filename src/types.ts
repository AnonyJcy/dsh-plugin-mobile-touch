/**
 * Type declarations for @anonyjcy/dsh-plugin-mobile-touch.
 * @module @anonyjcy/dsh-plugin-mobile-touch/types
 */

export type IndexInjectionPlacement = 'head' | 'body'

export type IndexInjection =
  | { kind: 'script'; placement: IndexInjectionPlacement; text: string }
  | { kind: 'script-src'; placement: IndexInjectionPlacement; src: string }
  | { kind: 'html'; placement: IndexInjectionPlacement; html: string }

export interface Config {
  /** Force enable touch optimizations regardless of hardware detection. Default: false */
  force?: boolean
  /** Disable touch optimizations completely. Default: false */
  disabled?: boolean
}
