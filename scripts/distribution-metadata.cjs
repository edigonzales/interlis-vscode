/** Stamp only the prepared package; source manifests retain the local version. */
function distributionManifest(manifest, env = process.env) {
  const run = env.GITHUB_RUN_NUMBER;
  if (env.GITHUB_ACTIONS === 'true' && run === undefined) {
    throw Error('GitHub Actions packaging requires GITHUB_RUN_NUMBER');
  }
  if (run !== undefined && (!/^[1-9]\d*$/.test(run) || !Number.isSafeInteger(Number(run)))) {
    throw Error('GITHUB_RUN_NUMBER must be a positive safe integer without leading zeros');
  }
  return {...manifest, version: run === undefined ? manifest.version : `0.1.${run}`};
}

module.exports = {distributionManifest};
