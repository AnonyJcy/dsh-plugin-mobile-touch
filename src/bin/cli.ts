#!/usr/bin/env node
/**
 * CLI for DeepSeek Harness Mobile & Touch Optimizer Plugin.
 */

import {
  installTouchPlugin,
  isTouchPluginInstalled,
  targetProfileDir,
  uninstallTouchPlugin,
  verifyTouchPlugin,
} from '../installer.ts'

const command = process.argv[2] ?? 'status'
const profileArg = process.argv[3] ?? 'web'

async function main(): Promise<void> {
  switch (command) {
    case 'install': {
      console.log(`Installing and mounting Mobile Touch Optimizer to profile "${profileArg}"...`)
      const dest = await installTouchPlugin({ profileName: profileArg })
      console.log(`Successfully installed to profile at: ${dest}`)
      const check = await verifyTouchPlugin({ profileName: profileArg })
      if (check.ok) {
        console.log('Verification passed! Touch optimizer is active for DeepSeek Harness Web.')
      } else {
        console.warn(`Warning: verification reported: ${check.message}`)
      }
      break
    }
    case 'uninstall': {
      console.log(`Uninstalling Mobile Touch Optimizer from profile "${profileArg}"...`)
      const removed = await uninstallTouchPlugin({ profileName: profileArg })
      if (removed) {
        console.log('Successfully uninstalled and unmounted Mobile Touch Optimizer.')
      } else {
        console.log('Plugin was not installed in this profile.')
      }
      break
    }
    case 'verify': {
      const dest = targetProfileDir(profileArg)
      console.log(`Verifying Touch Optimizer for profile: ${dest}`)
      const check = await verifyTouchPlugin({ profileName: profileArg })
      if (check.ok) {
        console.log('Mobile Touch Optimizer installation is healthy and active.')
      } else {
        console.error(`Verification failed: ${check.message}`)
        process.exitCode = 1
      }
      break
    }
    case 'status':
    default: {
      const dest = targetProfileDir(profileArg)
      const installed = await isTouchPluginInstalled({ profileName: profileArg })
      console.log(`DSH Web Profile directory: ${dest}`)
      console.log(`Installed & Mounted: ${installed ? 'Yes' : 'No'}`)
      if (installed) {
        const check = await verifyTouchPlugin({ profileName: profileArg })
        console.log(`Status: ${check.ok ? 'Healthy' : `Issues detected (${check.message})`}`)
      }
      console.log('\nUsage:')
      console.log('  dsh-touch-adapt install [profile]    Mount touch optimizer to DSH profile (default: web)')
      console.log('  dsh-touch-adapt uninstall [profile]  Unmount touch optimizer from DSH profile')
      console.log('  dsh-touch-adapt verify [profile]     Verify installation integrity')
      console.log('  dsh-touch-adapt status [profile]     Check installation status')
      break
    }
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exitCode = 1
})
