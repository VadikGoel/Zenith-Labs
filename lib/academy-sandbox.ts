import type { AcademyExecutionLanguage, AcademyExecutionPolicy } from './academy-execution-policy.ts'

export const ACADEMY_SANDBOX = {
  cppImage: 'gcc:14.4.0@sha256:4cd6d2f5b438d0124e659f3c46991d6d724b78066eb28668099a9ff46842f9b9',
  csharpImage: 'mcr.microsoft.com/dotnet/sdk:10.0-noble@sha256:ed034a8bf0b24ded0cbbac07e17825d8e9ebfe21e308191d0f7421eaf5ad4664',
  csharpRuntimeImage: 'mcr.microsoft.com/dotnet/runtime:10.0-noble@sha256:a365ce6a50b09176855d085c69da3fc1204a48432e36087e9a208f6e5860e235',
  memory: '128m',
  cpus: '0.5',
  pidsLimit: '64',
} as const

export type AcademySandboxPhase = 'compile' | 'run'

export function sandboxAvailable() {
  return process.platform !== 'win32'
}

export function buildSandboxArgs(
  language: AcademyExecutionLanguage,
  phase: AcademySandboxPhase,
  root: string,
  policy: AcademyExecutionPolicy,
): string[] {
  if (!sandboxAvailable()) throw new Error('The Academy sandbox requires a Linux container runtime.')

  const image = language === 'cpp'
    ? ACADEMY_SANDBOX.cppImage
    : phase === 'run'
      ? ACADEMY_SANDBOX.csharpRuntimeImage
      : ACADEMY_SANDBOX.csharpImage
  const outputMount = phase === 'run' ? `type=bind,src=${root}/output,dst=/output,readonly` : `type=bind,src=${root}/output,dst=/output`
  const common = [
    'run', '--rm', '--network', 'none',
    '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges=true',
    '--memory', ACADEMY_SANDBOX.memory, '--memory-swap', ACADEMY_SANDBOX.memory,
    '--cpus', ACADEMY_SANDBOX.cpus, '--pids-limit', ACADEMY_SANDBOX.pidsLimit,
    '--tmpfs', '/tmp:rw,nosuid,nodev,size=16m',
    '--mount', `type=bind,src=${root}/input,dst=/input,readonly`,
    '--mount', outputMount,
    '--user', '65532:65532',
    ...(language === 'csharp' && phase === 'compile' ? [
      '--env', 'DOTNET_CLI_HOME=/tmp/dotnet-home',
      '--env', 'NUGET_PACKAGES=/tmp/nuget',
      '--env', 'DOTNET_SKIP_WORKLOAD_INTEGRITY_CHECK=true',
    ] : []),
    image,
  ]

  if (language === 'cpp') {
    return phase === 'compile'
      ? [...common, 'g++', '-std=c++20', '-Wall', '-Wextra', '-Werror', '/input/main.cpp', '-o', '/output/app']
      : [...common, '/output/app']
  }

  return phase === 'compile'
    ? [...common, 'dotnet', 'build', '/input/AcademyRunner.csproj', '--nologo', '--ignore-failed-sources', '-o', '/output', '-p:BaseIntermediateOutputPath=/tmp/obj/', '-p:MSBuildProjectExtensionsPath=/tmp/obj/', '-p:MSBuildEnableWorkloadResolver=false']
    : [...common, 'dotnet', '/output/AcademyRunner.dll']
}

export function sandboxSecurityContract(policy: AcademyExecutionPolicy) {
  return {
    network: 'none' as const,
    readOnlyRoot: true,
    droppedCapabilities: 'ALL' as const,
    noNewPrivileges: true,
    memoryBytes: 128 * 1024 * 1024,
    cpuCores: 0.5,
    pids: 64,
    tmpfsBytes: 16 * 1024 * 1024,
    outputBytes: policy.maxOutputBytes,
    timeoutMs: policy.timeoutMs,
  }
}
