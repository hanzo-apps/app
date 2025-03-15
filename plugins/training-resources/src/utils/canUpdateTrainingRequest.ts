//
// Copyright @ 2024 Hanzo Industries Inc.
//

import type { TrainingRequest } from '@hanzo/training'
import { getCurrentEmployeeRef } from './getCurrentEmployeeRef'

export function canUpdateTrainingRequest (request: TrainingRequest): boolean {
  return request.owner === getCurrentEmployeeRef()
}
