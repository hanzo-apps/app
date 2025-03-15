//
// Copyright © 2024 Hanzo Industries Inc.
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

import { Class, Ref, Timestamp, WorkspaceUuid } from '@hanzo/core'
import { InboxNotification } from '@hanzo/notification'
import { ChunterSpace } from '@hanzo/chunter'
import { ActivityMessage } from '@hanzo/activity'

export interface UserRecord {
  telegramId: number
  telegramUsername?: string
  email: string
  workspaces: WorkspaceUuid[]
}

export interface MessageRecord {
  notificationId?: Ref<InboxNotification>
  messageId?: Ref<ActivityMessage>
  workspace: string
  email: string
  telegramId: number
}

export interface ChannelRecord {
  workspace: string
  channelId: Ref<ChunterSpace>
  channelClass: Ref<Class<ChunterSpace>>
  name: string
  email: string
}

export interface ReplyRecord {
  notificationId?: Ref<InboxNotification>
  messageId?: Ref<ActivityMessage>
  telegramId: number
  replyId: number
}

export interface OtpRecord {
  telegramId: number
  telegramUsername?: string
  code: string
  expires: Timestamp
  createdOn: Timestamp
}

export interface PlatformFileInfo {
  filename: string
  type: string
  buffer: Buffer
}

export interface TelegramFileInfo {
  type: string
  url: string
  width: number
  height: number
  name?: string
  size?: number
}

export interface WorkspaceInfo {
  url: string
  id: string
  name: string
}
