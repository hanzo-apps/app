//
// Copyright @ 2024 Hanzo Industries Inc.
//

import { type TrainingAttemptState, trainingAttemptStateOrder } from '@hanzo/training'

export async function trainingAttemptStateAllValues (): Promise<TrainingAttemptState[]> {
  return [...trainingAttemptStateOrder]
}
