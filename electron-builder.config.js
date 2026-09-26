module.exports = {
  appId: 'com.wealthlens.desktop',
  productName: 'WealthLens',
  directories: {
    app: '.',
    output: 'dist'
  },
  files: [
    'electron/**/*',
    'client/dist/**/*',
    'server/dist/**/*',
    'server/package.json',
    'package.json',
    'node_modules/**/*'
  ],
  mac: {
    category: 'public.app-category.finance',
    target: ['dmg'],
    artifactName: 'WealthLens-${version}.dmg',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'electron/entitlements.mac.plist',
    entitlementsInherit: 'electron/entitlements.mac.plist',
    notarize: {
      teamId: process.env.APPLE_TEAM_ID,
    },
  },
  dmg: {
    title: 'WealthLens',
    icon: 'electron/icon.icns',
    background: 'electron/dmg-background.png',
    contents: [
      { x: 130, y: 220, type: 'file' },
      { x: 410, y: 220, type: 'link', path: '/Applications' }
    ]
  },
  win: {
    target: ['portable'],
    artifactName: 'WealthLens-${version}.exe'
  },
  afterSign: 'electron/notarize.js'
};
