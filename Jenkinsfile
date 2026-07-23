// CI runs from the shared library step `dockerSmokeTest` (repo: jenkins-shared-libraries).
// It builds the production Docker image and smoke-tests that it boots and serves.
// The '@Library' id must match the name registered in Jenkins →
// Manage Jenkins → System → Global Pipeline Libraries.
@Library('jenkins-shared-libraries') _

dockerSmokeTest(
  imageName: 'vernaillen-dev',
  secretBuildArgs: [NUXT_GITHUB_TOKEN: 'github-personal-access-token'],
  port: 3000
)
