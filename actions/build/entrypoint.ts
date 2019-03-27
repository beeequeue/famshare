import { Toolkit } from 'actions-toolkit'
import TypeScript from 'typescript'
import {
  ChecksUpdateParams,
  ChecksUpdateParamsOutputAnnotations,
} from '@octokit/rest'

const tools = new Toolkit({
  event: ['push'],
})

const { log } = tools
const { GITHUB_TOKEN, GITHUB_ACTION } = process.env

const assertVariables = () => {
  if (GITHUB_TOKEN == null || GITHUB_TOKEN.length < 1) {
    return tools.exit.failure('You need to tick the GITHUB_TOKEN secret!')
  }
}

const regex = /^((?:.*\/.*)+)\((\d+),(\d+)\): (\w+).*: (.*)$/
const getAnnotations = (
  result: string,
): ChecksUpdateParamsOutputAnnotations[] => {
  const lines = result.split('\n')

  return lines
    .map<ChecksUpdateParamsOutputAnnotations>(str => {
      const match = str.match(regex)

      if (match == null) return null as any

      const [, path, line, , type, message] = match

      return {
        title: 'TypeScript Error',
        annotation_level: type === 'error' ? 'failure' : 'warning',
        path,
        message,
        start_line: Number(line),
        end_line: Number(line),
      }
    })
    .filter(ann => !!ann)
}

type CompileReturn = Promise<
  Pick<ChecksUpdateParams, 'conclusion' | 'status' | 'output'>
>
const compileProject = async (): CompileReturn => {
  log.await(`Compiling project using TypeScript ${TypeScript.version}...`)

  const { stdout, stderr } = await tools.runInWorkspace('yarn', ['build'], {
    env: {
      NODE_ENV: 'production',
    },
    reject: false,
  })

  const errored = stderr.split('\n').filter(str => str.length > 0).length > 0

  if (errored) {
    const annotations = getAnnotations(stdout)

    log.error(
      'Failed with errors:\n' +
        annotations
          .map(
            ann =>
              `[${ann.annotation_level.toUpperCase()}] ${ann.path}(${
                ann.start_line
              }, ${ann.start_column}): ${ann.message}`,
          )
          .join('\n'),
    )

    return {
      conclusion: 'failure',
      status: 'completed',
      output: {
        title: 'Result',
        summary: 'Failed with errors.',
        annotations,
      },
    }
  }

  log.success('Finished with no errors!')

  return {
    conclusion: 'success',
    status: 'completed',
    output: {
      title: 'Result',
      summary: 'Finished with no errors!',
    },
  }
}

const main = async () => {
  assertVariables()

  const compilePromise = compileProject()

  const checkName = GITHUB_ACTION

  const response = await tools.github.checks.listForRef({
    check_name: checkName,
    status: 'in_progress' as 'in_progress',
    ref: tools.context.ref,
    ...tools.context.repo(),
  })

  const check = response.data.check_runs.find(
    check => check.name === checkName,
  )!

  const result = await compilePromise

  await tools.github.checks.update({
    check_run_id: check.id,
    completed_at: new Date().toISOString(),
    ...tools.context.repo(),
    ...result,
  })

  if (result.conclusion === 'failure') {
    tools.exit.failure('Finished with errors!')
  }

  tools.exit.success('Finished with no errors!')
}

main()
