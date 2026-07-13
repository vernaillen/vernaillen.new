pipeline {
  agent { label 'docker' }

  options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  environment {
    IMAGE_NAME     = 'vernaillen-dev'
    CONTAINER_NAME = "smoke-${env.BUILD_TAG}"
  }

  stages {
    stage('Prep') {
      steps {
        script {
          // Multibranch checks the repo out automatically, but the top-level
          // environment block evaluates before env.GIT_COMMIT is populated,
          // so the tag is computed here instead of up there.
          env.IMAGE_TAG = sh(script: 'git rev-parse --short=8 HEAD', returnStdout: true).trim()
        }
      }
    }

    stage('Build image') {
      options {
        timeout(time: 15, unit: 'MINUTES')
        retry(2) // pnpm install is the flaky part; a real build/lint error fails the same way twice
      }
      steps {
        withCredentials([string(credentialsId: 'github-personal-access-token', variable: 'NUXT_GITHUB_TOKEN')]) {
          sh '''
            DOCKER_BUILDKIT=1 docker build \
              --progress=plain \
              --memory=4g \
              --memory-swap=4g \
              --secret id=nuxt_github_token,env=NUXT_GITHUB_TOKEN \
              -t "$IMAGE_NAME:$IMAGE_TAG" \
              .
          '''
        }
      }
    }

    stage('Smoke test') {
      options { timeout(time: 3, unit: 'MINUTES') }
      steps {
        sh '''
          docker run -d --rm --name "$CONTAINER_NAME" --memory=256m --memory-swap=256m -p 127.0.0.1::3000 "$IMAGE_NAME:$IMAGE_TAG"
          PORT=$(docker port "$CONTAINER_NAME" 3000/tcp | cut -d: -f2)
          for i in $(seq 1 15); do
            curl -fsS "http://localhost:$PORT" > /dev/null && { echo "container is serving"; exit 0; }
            sleep 2
          done
          echo "container never responded"; docker logs "$CONTAINER_NAME"; exit 1
        '''
      }
      post {
        always {
          sh 'docker rm -f "$CONTAINER_NAME" || true'
        }
      }
    }
  }

  post {
    always {
      sh 'docker image rm -f "$IMAGE_NAME:$IMAGE_TAG" || true'
    }
  }
}
