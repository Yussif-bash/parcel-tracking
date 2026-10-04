// Declarative pipeline for the parcel tracking monorepo (section 12.4 of the project document).
// Requirements on the Jenkins server: NodeJS plugin with an installation named "node-22",
// an IAM instance role with permission to deploy via CDK, and a GitHub webhook for this repo.
// NOTE: written but not yet run. Expect to adjust names and permissions on first use.
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  tools { nodejs 'node-22' }

   environment {
    CI = 'true'
    AWS_REGION = 'eu-west-1'
    AWS_DEFAULT_REGION = 'eu-west-1'
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm install -g pnpm@12.8.1'
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Lint and type check') {
      steps {
        sh 'pnpm lint'
        sh 'pnpm format:check'
        sh 'pnpm typecheck'
      }
    }

    stage('Test') {
      steps { sh 'pnpm test' }
    }

    stage('Build') {
      steps { sh 'pnpm build' }
    }

    stage('CDK synth and diff') {
      when { anyOf { branch 'main'; changeRequest() } }
      steps {
        dir('infra') {
          sh 'pnpm exec cdk synth -c stage=dev --quiet'
          sh 'pnpm exec cdk diff -c stage=dev || true'
        }
      }
    }

    stage('Deploy to dev') {
      when { branch 'master' }
      steps {
        dir('infra') { sh 'pnpm exec cdk deploy --all -c stage=dev --require-approval never' }
      }
    }

    stage('Smoke test (dev)') {
      when { branch 'master' }
      steps {
        sh '''
          API_URL=$(aws cloudformation describe-stacks --stack-name ParcelApi-dev \
            --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
          curl --fail --silent "$API_URL/health"
        '''
      }
    }

    stage('Approve production') {
      when { branch 'master' }
      steps {
        timeout(time: 1, unit: 'HOURS') {
          input message: 'Deploy to production?', ok: 'Deploy'
        }
      }
    }

    stage('Deploy to prod') {
      when { branch 'master' }
      steps {
        dir('infra') { sh 'pnpm exec cdk deploy --all -c stage=prod --require-approval never' }
      }
    }
  }

  post {
    failure { echo 'Build failed. Add email or chat notification here.' }
  }
}
