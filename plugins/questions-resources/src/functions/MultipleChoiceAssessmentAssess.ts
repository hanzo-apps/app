//
// Copyright @ 2024 Hanzo Industries Inc.
//

import type {
  AnswerDataAssessFunction,
  MultipleChoiceAssessment,
  MultipleChoiceAssessmentAnswer
} from '@hanzo/questions'

/** @public */
export const MultipleChoiceAssessmentAssess: AnswerDataAssessFunction<
MultipleChoiceAssessment,
MultipleChoiceAssessmentAnswer
> = async (answerData, assessmentData) => {
  return {
    score:
      // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
      answerData.selectedIndices.slice().sort().join('~') === assessmentData.correctIndices.slice().sort().join('~')
        ? 100
        : 0
  }
}
