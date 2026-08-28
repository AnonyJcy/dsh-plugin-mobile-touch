import { describe, expect, it, vi } from 'vitest'
import { apply, bootTouchInjection, buildBootScript, name } from '../src/index.ts'

describe('plugin-mobile-touch', () => {
  it('exports valid plugin name', () => {
    expect(name).toBe('plugin-mobile-touch')
  })

  it('builds valid boot script and injection', () => {
    const script = buildBootScript()
    expect(script).toContain('dsh-touch-optimized')
    expect(script).toContain('touch-action: pan-y manipulation')

    const injection = bootTouchInjection()
    expect(injection.kind).toBe('script')
    expect(injection.placement).toBe('head')
    expect(injection.text).toBe(script)
  })

  it('registers webserver/index-inject listener on apply', () => {
    const handlers: Record<string, Function> = {}
    const mockCtx = {
      on: (event: string, fn: Function) => {
        handlers[event] = fn
      },
      logger: {
        warn: vi.fn(),
      },
    }

    apply(mockCtx as any)
    expect(handlers['webserver/index-inject']).toBeDefined()

    const table: any[] = []
    handlers['webserver/index-inject'](table)
    expect(table.length).toBe(1)
    expect(table[0].kind).toBe('script')
  })

  it('respects disabled config on apply', () => {
    const handlers: Record<string, Function> = {}
    const mockCtx = {
      on: (event: string, fn: Function) => {
        handlers[event] = fn
      },
    }

    apply(mockCtx as any, { disabled: true })
    expect(handlers['webserver/index-inject']).toBeUndefined()
  })
})
