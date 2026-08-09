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

// Módulos que devem sempre resolver para a instância única do projeto mobile.
// Crítico para evitar "Invalid hook call" causado por múltiplas versões do React
// no pnpm store (ex: react@18.3.1 do workspace web sendo bundled junto com
// react@18.2.0 do mobile).
// Usa require.resolve (não um caminho relativo fixo) porque, com
// node-linker=hoisted, node_modules/react pode existir só na raiz do
// monorepo, não dentro de fretagro-mobile/node_modules — require.resolve
// encontra o pacote onde quer que ele esteja e já retorna o caminho físico
// real (não o symlink), o que o Watchman consegue vigiar corretamente.
const reactDir = path.dirname(require.resolve('react/package.json', { paths: [projectRoot] }));
const SINGLETON_FILES = {
  react: path.join(reactDir, 'index.js'),
  'react/jsx-runtime': path.join(reactDir, 'jsx-runtime.js'),
  'react/jsx-dev-runtime': path.join(reactDir, 'jsx-dev-runtime.js'),
};

config.resolver.extraNodeModules = {
  react: reactDir,
};

// Fix: o servidor HMR envia paths relativos ao monorepoRoot (frete-agro/)
// mas os resolve a partir do projectRoot (fretagro-mobile/). O custom resolver
// intercede e reescreve esses paths usando o monorepoRoot como base.
// Também intercepta imports de React para garantir uma única instância.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Força todos os imports de react e seus subpaths para a instância do mobile
  if (SINGLETON_FILES[moduleName]) {
    return { type: 'sourceFile', filePath: SINGLETON_FILES[moduleName] };
  }

  if (
    moduleName.startsWith('./node_modules/.pnpm/') ||
    moduleName.startsWith('../node_modules/.pnpm/')
  ) {
    return context.resolveRequest(
      { ...context, originModulePath: monorepoRoot + '/.' },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
