const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');
const pnpmStore = path.resolve(monorepoRoot, 'node_modules', '.pnpm');

const config = getDefaultConfig(projectRoot);

// Inclui toda a raiz do monorepo e a virtual store do pnpm no watch
config.watchFolders = [monorepoRoot, pnpmStore];

// Define a ordem de resolução: local primeiro, depois raiz do monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Garante que a virtual store do pnpm não seja bloqueada
const { blockList: defaultBlockList } = config.resolver;
const blockListRegex = Array.isArray(defaultBlockList)
  ? defaultBlockList.filter((r) => !String(r).includes('pnpm'))
  : defaultBlockList;
config.resolver.blockList = blockListRegex;

// Necessário para resolver os symlinks do pnpm no bundle principal.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Fix: o servidor HMR envia paths relativos ao monorepoRoot (frete-agro/)
// mas os resolve a partir do projectRoot (fretagro-mobile/). O custom resolver
// intercede e reescreve esses paths usando o monorepoRoot como base.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith('./node_modules/.pnpm/') ||
    moduleName.startsWith('../node_modules/.pnpm/')
  ) {
    const absolutePath = path.resolve(monorepoRoot, moduleName);
    return context.resolveRequest(
      { ...context, originModulePath: monorepoRoot + '/.' },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
