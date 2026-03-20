import type { JobProducer, JobRuntime, JobScheduler } from "./ports";

import { makePgBoss, makePgBossJobProducer, makePgBossJobRuntime } from "./pgboss";

export type JobBackend = {
  readonly producer: JobProducer;
  readonly runtime: JobRuntime;
  readonly scheduler: JobScheduler;
};

export function makeJobBackend(): JobBackend {
  const boss = makePgBoss();
  const runtime = makePgBossJobRuntime(boss);

  return {
    producer: makePgBossJobProducer(boss),
    runtime,
    scheduler: runtime,
  };
}
