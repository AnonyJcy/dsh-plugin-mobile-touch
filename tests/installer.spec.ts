import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  expandHomePath,
  installTouchPlugin,
  isTouchPluginInstalled,
  resolveDshHome,
  targetProfileDir,
  uninstallTouchPlugin,
  verifyTouchPlugin,
} from '../src/installer.ts'

describe('installer', () => {
  let tempHome: string

  beforeEach(async () => {
    tempHome = await mkdtemp(join(tmpdir(), 'dsh-touch-test-'))
  })

  afterEach(async () => {
    await rm(tempHome, { recursive: true, force: true })
  })

  it('resolves home path properly', () => {
    expect(expandHomePath('~')).not.toBe('~')
    expect(resolveDshHome(tempHome)).toBe(tempHome)
    expect(targetProfileDir('web', tempHome)).toBe(join(tempHome, 'profiles', 'web'))
  })

  it('installs, verifies, and uninstalls the touch plugin cleanly', async () => {
    const options = { dshHome: tempHome, profileName: 'web' }

    expect(await isTouchPluginInstalled(options)).toBe(false)

    // Install
    const dest = await installTouchPlugin(options)
    expect(dest).toBe(join(tempHome, 'profiles', 'web'))
    expect(await isTouchPluginInstalled(options)).toBe(true)

    // Verify
    const check = await verifyTouchPlugin(options)
    expect(check.mounted).toBe(true)
    expect(check.ok).toBe(true)

    // Uninstall
    const uninstalled = await uninstallTouchPlugin(options)
    expect(uninstalled).toBe(true)
    expect(await isTouchPluginInstalled(options)).toBe(false)
  })
})
