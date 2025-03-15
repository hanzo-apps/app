//
// Copyright © 2025 Hanzo Industries Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { AccountRole } from '@hanzo/core'
import { type Builder } from '@hanzo/model'
import core from '@hanzo/model-core'
import workbench from '@hanzo/model-workbench'
import mail from '@hanzo/mail'
import { mySpaceId } from '@hanzo/my-space'

import mySpace from './plugin'

export { mySpaceId } from '@hanzo/my-space'

export { mySpace as default }

export function createModel (builder: Builder): void {
  builder.createDoc(
    workbench.class.Application,
    core.space.Model,
    {
      label: mySpace.string.MySpace,
      icon: mySpace.icon.MySpace,
      alias: mySpaceId,
      accessLevel: AccountRole.User,
      hidden: false,
      navigatorModel: {
        spaces: [],
        specials: [
          {
            id: 'mail',
            label: mySpace.string.Mail,
            icon: mySpace.icon.Mail,
            component: workbench.component.SpecialView,
            componentProps: {
              _class: mail.class.MailThread,
              icon: mySpace.icon.Mail,
              label: mySpace.string.Mail
            },
            queryBuilder: mySpace.functions.BuildQuery
          }
        ]
      }
    },
    mySpace.app.MySpace
  )
}
